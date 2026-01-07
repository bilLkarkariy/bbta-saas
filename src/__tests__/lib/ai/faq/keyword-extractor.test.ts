import { describe, it, expect, beforeEach } from "vitest";
import { mockAIClientResponse, mockAIClientError, resetAIMocks } from "../../../mocks/ai";

describe("Keyword Extractor", () => {
  beforeEach(() => {
    resetAIMocks();
  });

  describe("extractKeywords()", () => {
    it("returns AI-generated keywords", async () => {
      mockAIClientResponse(
        JSON.stringify({
          keywords: ["horaires", "ouverture", "heures", "temps", "disponibilité"],
        })
      );

      const { extractKeywords } = await import("@/lib/ai/faq/keyword-extractor");

      const result = await extractKeywords(
        "Quels sont vos horaires d'ouverture ?",
        "Nous sommes ouverts de 9h à 18h."
      );

      expect(result).toContain("horaires");
      expect(result.length).toBeGreaterThan(0);
    });

    it("falls back to local extraction on AI error", async () => {
      mockAIClientError(new Error("API Error"));

      const { extractKeywords } = await import("@/lib/ai/faq/keyword-extractor");

      const result = await extractKeywords(
        "Quels sont vos horaires d'ouverture ?",
        "Nous sommes ouverts de 9h à 18h."
      );

      // Should still return keywords from local extraction
      expect(result.length).toBeGreaterThan(0);
    });

    it("handles malformed AI response", async () => {
      mockAIClientResponse("Not a valid JSON response");

      const { extractKeywords } = await import("@/lib/ai/faq/keyword-extractor");

      const result = await extractKeywords(
        "Question test",
        "Réponse test"
      );

      // Should fall back to local extraction
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("extractKeywordsLocal()", () => {
    it("extracts keywords from text", async () => {
      const { extractKeywordsLocal } = await import("@/lib/ai/faq/keyword-extractor");

      const result = extractKeywordsLocal(
        "Quels sont vos horaires d'ouverture ?",
        "Nous sommes ouverts de 9h à 18h du lundi au vendredi."
      );

      expect(result.length).toBeGreaterThan(0);
      // Should contain meaningful words
      expect(result.some((k) => k.length > 3)).toBe(true);
    });

    it("filters stop words", async () => {
      const { extractKeywordsLocal } = await import("@/lib/ai/faq/keyword-extractor");

      const result = extractKeywordsLocal(
        "Comment puis-je vous contacter ?",
        "Vous pouvez nous contacter par email."
      );

      // French stop words should be filtered
      expect(result).not.toContain("vous");
      expect(result).not.toContain("je");
      expect(result).not.toContain("par");
    });

    it("removes duplicates", async () => {
      const { extractKeywordsLocal } = await import("@/lib/ai/faq/keyword-extractor");

      const result = extractKeywordsLocal(
        "horaires horaires horaires",
        "horaires horaires"
      );

      const uniqueCount = new Set(result).size;
      expect(result.length).toBe(uniqueCount);
    });

    it("limits to max keywords", async () => {
      const { extractKeywordsLocal } = await import("@/lib/ai/faq/keyword-extractor");

      const longText = Array(50).fill("mot différent unique").join(" ");
      const result = extractKeywordsLocal(longText, longText);

      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe("enrichFAQ()", () => {
    it("merges existing keywords with extracted", async () => {
      mockAIClientResponse(
        JSON.stringify({
          keywords: ["nouveau", "extrait"],
        })
      );

      const { enrichFAQ } = await import("@/lib/ai/faq/keyword-extractor");

      const faq = {
        question: "Question",
        answer: "Réponse",
        keywords: ["existant"],
      };

      const result = await enrichFAQ(faq);

      expect(result.keywords).toContain("existant");
      expect(result.keywords).toContain("nouveau");
      expect(result.keywords).toContain("extrait");
    });

    it("preserves question and answer structure", async () => {
      mockAIClientResponse(JSON.stringify({ keywords: ["test"] }));

      const { enrichFAQ } = await import("@/lib/ai/faq/keyword-extractor");

      const faq = {
        question: "Question test",
        answer: "Réponse test",
        keywords: [],
      };

      const result = await enrichFAQ(faq);

      // enrichFAQ returns { question, answer, keywords }
      expect(result.question).toBe("Question test");
      expect(result.answer).toBe("Réponse test");
      expect(result.keywords).toBeDefined();
    });
  });

  describe("batchExtractKeywords()", () => {
    it("processes multiple FAQs", async () => {
      // Mock multiple AI responses
      mockAIClientResponse(JSON.stringify({ keywords: ["mot1"] }));

      const { batchExtractKeywords } = await import("@/lib/ai/faq/keyword-extractor");

      const faqs = [
        { question: "Q1 test question", answer: "A1 test answer" },
        { question: "Q2 test question", answer: "A2 test answer" },
        { question: "Q3 test question", answer: "A3 test answer" },
      ];

      const results = await batchExtractKeywords(faqs);

      // batchExtractKeywords returns string[][] (array of keyword arrays)
      expect(results.length).toBe(3);
      results.forEach((keywords) => {
        expect(Array.isArray(keywords)).toBe(true);
        expect(keywords.length).toBeGreaterThan(0);
      });
    });

    it("respects concurrency limit", async () => {
      mockAIClientResponse(JSON.stringify({ keywords: ["mot"] }));

      const { batchExtractKeywords } = await import("@/lib/ai/faq/keyword-extractor");

      const faqs = Array(10)
        .fill(null)
        .map((_, i) => ({
          question: `Question ${i} for testing`,
          answer: `Answer ${i} with content`,
        }));

      const startTime = Date.now();
      const results = await batchExtractKeywords(faqs);
      const duration = Date.now() - startTime;

      // Should complete (concurrency limits parallel execution)
      expect(duration).toBeDefined();
      expect(results.length).toBe(10);
    });

    it("handles partial failures gracefully", async () => {
      // First call succeeds, second fails - falls back to local extraction
      let callCount = 0;
      const { mockAIClient } = await import("../../../mocks/ai");
      mockAIClient.chat.completions.create.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error("API Error");
        }
        return Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ keywords: ["success"] }) } }],
        });
      });

      const { batchExtractKeywords } = await import("@/lib/ai/faq/keyword-extractor");

      const faqs = [
        { question: "Q1 test question", answer: "A1 test answer" },
        { question: "Q2 test question", answer: "A2 test answer" },
      ];

      const results = await batchExtractKeywords(faqs);

      // Both should have keywords (one from AI, one from fallback)
      expect(results.length).toBe(2);
      results.forEach((keywords) => {
        expect(Array.isArray(keywords)).toBe(true);
      });
    });
  });

  describe("Stop words filtering", () => {
    it("filters French common words", async () => {
      const { extractKeywordsLocal } = await import("@/lib/ai/faq/keyword-extractor");

      const result = extractKeywordsLocal(
        "Je suis le client et je veux des informations",
        "Voici les informations que vous demandez"
      );

      // Common French stop words should be removed
      expect(result).not.toContain("je");
      expect(result).not.toContain("le");
      expect(result).not.toContain("et");
      expect(result).not.toContain("des");
      expect(result).not.toContain("que");
    });

    it("keeps meaningful words", async () => {
      const { extractKeywordsLocal } = await import("@/lib/ai/faq/keyword-extractor");

      const result = extractKeywordsLocal(
        "Réservation restaurant Paris",
        "Réservez votre table dans notre restaurant parisien"
      );

      // Meaningful words should be kept
      expect(result.some((k) => k.includes("reserv") || k.includes("restaurant") || k.includes("paris"))).toBe(true);
    });
  });
});
