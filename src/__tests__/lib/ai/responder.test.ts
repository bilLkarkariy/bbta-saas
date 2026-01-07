import { describe, it, expect, beforeEach } from "vitest";
import { mockAIClientResponse, mockAIClientError, mockAIClient, resetAIMocks } from "../../mocks/ai";

// Import after mocks
import { generateResponse, type ResponderContext } from "@/lib/ai/responder";
import type { RouterResult } from "@/lib/ai/router";

describe("AI Responder", () => {
  beforeEach(() => {
    resetAIMocks();
  });

  const baseRouterResult: RouterResult = {
    intent: "FAQ",
    confidence: 0.9,
    tier_needed: 1,
    entities: {},
    should_continue_flow: false,
  };

  const baseContext: ResponderContext = {
    routerResult: baseRouterResult,
    message: "Quels sont vos horaires ?",
    businessName: "Restaurant Test",
    businessType: "Restaurant",
    faqs: [
      {
        question: "Quels sont vos horaires ?",
        answer: "Nous sommes ouverts de 9h à 18h.",
        category: "Horaires",
      },
    ],
  };

  describe("generateResponse()", () => {
    it("generates response for FAQ intent", async () => {
      mockAIClientResponse("Nous sommes ouverts de 9h à 18h du lundi au vendredi.");

      const result = await generateResponse(baseContext);

      expect(result.response).toBeTruthy();
      expect(result.model_used).toBeTruthy();
      expect(result.should_escalate).toBe(false);
    });

    it("uses correct model per tier", async () => {
      mockAIClientResponse("Response");

      // Tier 1
      await generateResponse(baseContext);
      expect(mockAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining("grok"),
        })
      );

      resetAIMocks();
      mockAIClientResponse("Response");

      // Tier 2
      await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, tier_needed: 2 },
      });
      expect(mockAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining("claude"),
        })
      );
    });

    it("includes FAQ in prompt when matched", async () => {
      mockAIClientResponse("Voici la réponse");

      await generateResponse({
        ...baseContext,
        routerResult: {
          ...baseRouterResult,
          faq_match: {
            question: "Quels sont vos horaires ?",
            answer: "9h à 18h",
            similarity: 0.95,
          },
        },
      });

      const callArgs = mockAIClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("FAQ CORRESPONDANTE");
    });

    it("personalizes with customer name", async () => {
      mockAIClientResponse("Bonjour Jean !");

      await generateResponse({
        ...baseContext,
        customerName: "Jean",
      });

      const callArgs = mockAIClient.chat.completions.create.mock.calls[0][0];
      const userMessage = callArgs.messages[callArgs.messages.length - 1].content;
      expect(userMessage).toContain("Jean");
    });

    it("includes conversation history", async () => {
      mockAIClientResponse("Réponse");

      await generateResponse({
        ...baseContext,
        conversationHistory: [
          { role: "user", content: "Bonjour" },
          { role: "assistant", content: "Bonjour !" },
        ],
      });

      const callArgs = mockAIClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages.length).toBeGreaterThan(2);
    });

    it("marks escalation for ESCALATE intent", async () => {
      mockAIClientResponse("Un conseiller va vous contacter.");

      const result = await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, intent: "ESCALATE" },
      });

      expect(result.should_escalate).toBe(true);
    });

    it("cleans up response - removes quotes", async () => {
      mockAIClientResponse('"Voici ma réponse"');

      const result = await generateResponse(baseContext);

      expect(result.response.startsWith('"')).toBe(false);
      expect(result.response.endsWith('"')).toBe(false);
    });

    it("cleans up response - limits newlines", async () => {
      mockAIClientResponse("Ligne 1\n\n\n\n\nLigne 2");

      const result = await generateResponse(baseContext);

      expect(result.response).not.toContain("\n\n\n");
    });

    it("returns fallback on AI error", async () => {
      mockAIClientError(new Error("API Error"));

      const result = await generateResponse(baseContext);

      expect(result.response).toBeTruthy();
      expect(result.model_used).toBe("fallback");
      expect(result.should_escalate).toBe(true);
    });
  });

  describe("getSuggestedActions()", () => {
    it("returns booking actions for BOOKING", async () => {
      mockAIClientResponse("Pour réserver...");

      const result = await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, intent: "BOOKING" },
      });

      expect(result.suggested_actions).toContain("show_calendar");
      expect(result.suggested_actions).toContain("create_booking");
    });

    it("returns CRM actions for LEAD_CAPTURE", async () => {
      mockAIClientResponse("Je note vos coordonnées...");

      const result = await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, intent: "LEAD_CAPTURE" },
      });

      expect(result.suggested_actions).toContain("add_to_crm");
    });

    it("returns escalation actions for ESCALATE", async () => {
      mockAIClientResponse("Un conseiller va vous contacter.");

      const result = await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, intent: "ESCALATE" },
      });

      expect(result.suggested_actions).toContain("notify_team");
    });

    it("returns empty array for FAQ", async () => {
      mockAIClientResponse("Réponse FAQ");

      const result = await generateResponse(baseContext);

      expect(result.suggested_actions).toEqual([]);
    });
  });

  describe("getFallbackResponse()", () => {
    it("returns greeting for GREETING intent on error", async () => {
      mockAIClientError(new Error("API Error"));

      const result = await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, intent: "GREETING" },
      });

      expect(result.response).toContain("Bonjour");
      expect(result.response).toContain("Restaurant Test");
    });

    it("returns escalation message for ESCALATE on error", async () => {
      mockAIClientError(new Error("API Error"));

      const result = await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, intent: "ESCALATE" },
      });

      expect(result.response).toContain("équipe");
      expect(result.response).toContain("recontacter");
    });

    it("returns opt-out confirmation for OPT_OUT on error", async () => {
      mockAIClientError(new Error("API Error"));

      const result = await generateResponse({
        ...baseContext,
        routerResult: { ...baseRouterResult, intent: "OPT_OUT" },
      });

      expect(result.response).toContain("plus de messages");
    });
  });
});
