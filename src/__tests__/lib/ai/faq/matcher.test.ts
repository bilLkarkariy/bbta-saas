import { describe, it, expect, beforeEach } from "vitest";
import { mockAIClientResponse, resetAIMocks } from "../../../mocks/ai";

describe("FAQ Matcher", () => {
  beforeEach(() => {
    resetAIMocks();
  });

  const sampleFAQs = [
    {
      id: "faq1",
      question: "Quels sont vos horaires d'ouverture ?",
      answer: "Nous sommes ouverts de 9h à 18h du lundi au vendredi.",
      category: "Horaires",
      keywords: ["horaires", "ouverture", "heures", "quand"],
    },
    {
      id: "faq2",
      question: "Où êtes-vous situés ?",
      answer: "Nous sommes situés au 123 rue de Paris.",
      category: "Localisation",
      keywords: ["adresse", "localisation", "où", "situé"],
    },
    {
      id: "faq3",
      question: "Quels sont vos tarifs ?",
      answer: "Nos tarifs commencent à 50€.",
      category: "Prix",
      keywords: ["prix", "tarif", "coût", "combien"],
    },
  ];

  describe("matchFAQ()", () => {
    it("finds exact match", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("Quels sont vos horaires d'ouverture ?", sampleFAQs);

      expect(result).not.toBeNull();
      expect(result?.faq.question).toContain("horaires");
      expect(result?.matchType).toBe("exact");
    });

    it("finds keyword match", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("C'est quoi vos heures ?", sampleFAQs, 0.3);

      expect(result).not.toBeNull();
      expect(result?.faq.id).toBe("faq1"); // Should match horaires FAQ
    });

    it("returns null below threshold", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("Quel est le temps de livraison ?", sampleFAQs, 0.8);

      expect(result).toBeNull();
    });

    it("handles empty FAQ set", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("Question quelconque", []);

      expect(result).toBeNull();
    });

    it("normalizes accents and case", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("HORAIRES D'OUVERTURE", sampleFAQs);

      expect(result).not.toBeNull();
    });
  });

  describe("findTopMatches()", () => {
    it("returns sorted results", async () => {
      const { findTopMatches } = await import("@/lib/ai/faq/matcher");

      const results = await findTopMatches("Vos tarifs et horaires ?", sampleFAQs, 3);

      expect(results.length).toBeGreaterThan(0);
      // Results should be sorted by similarity descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it("respects limit parameter", async () => {
      const { findTopMatches } = await import("@/lib/ai/faq/matcher");

      const results = await findTopMatches("Question", sampleFAQs, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("returns empty array for no matches", async () => {
      const { findTopMatches } = await import("@/lib/ai/faq/matcher");

      const results = await findTopMatches("xyzabc random", sampleFAQs, 3, 0.9);

      expect(results).toEqual([]);
    });
  });

  describe("checkExactMatch() - Jaccard similarity", () => {
    it("calculates high similarity for similar strings", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      // Almost exact match should have high similarity
      const result = await matchFAQ("Quels sont vos horaires ?", sampleFAQs);

      expect(result).not.toBeNull();
      expect(result?.similarity).toBeGreaterThan(0.7);
    });

    it("calculates low similarity for different strings", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("Livraison internationale possible ?", sampleFAQs);

      // Should either be null or have low similarity
      if (result) {
        expect(result.similarity).toBeLessThan(0.5);
      }
    });
  });

  describe("calculateKeywordOverlap()", () => {
    it("scores based on keyword presence", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      // Query with keywords matching FAQ
      const result = await matchFAQ("prix tarif combien", sampleFAQs, 0.3);

      expect(result).not.toBeNull();
      expect(result?.faq.id).toBe("faq3"); // Should match prix FAQ
    });

    it("handles queries with no keyword overlap", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("xyz abc def", sampleFAQs, 0.8);

      expect(result).toBeNull();
    });
  });

  describe("normalizeText()", () => {
    it("removes accents", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      // "êtes" should match "situés" FAQ
      const result = await matchFAQ("Ou etes vous situes ?", sampleFAQs);

      expect(result).not.toBeNull();
    });

    it("handles punctuation", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("horaires???!!!", sampleFAQs);

      expect(result).not.toBeNull();
    });

    it("normalizes whitespace", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("  quels   sont   vos   horaires  ", sampleFAQs);

      expect(result).not.toBeNull();
    });
  });

  describe("semanticMatch()", () => {
    it("uses AI for semantic matching on small FAQ sets", async () => {
      mockAIClientResponse(
        JSON.stringify({
          matched_index: 1,
          similarity: 0.85,
          reasoning: "Semantic match found",
        })
      );

      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      // For small FAQ sets with keyword overlap > 0.3, semantic matching is used
      const smallFAQs = sampleFAQs.slice(0, 2);
      const result = await matchFAQ("horaires ouverture quand", smallFAQs, 0.3);

      // Should find a match via keyword or semantic
      expect(result).not.toBeNull();
    });
  });

  describe("match type classification", () => {
    it("classifies as exact for high Jaccard similarity", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("Quels sont vos horaires d'ouverture ?", sampleFAQs);

      if (result && result.similarity > 0.9) {
        expect(result.matchType).toBe("exact");
      }
    });

    it("classifies as keyword for keyword-based match", async () => {
      const { matchFAQ } = await import("@/lib/ai/faq/matcher");

      const result = await matchFAQ("Dites moi les heures", sampleFAQs, 0.3);

      if (result && result.matchType !== "exact") {
        expect(["keyword", "semantic"]).toContain(result.matchType);
      }
    });
  });
});
