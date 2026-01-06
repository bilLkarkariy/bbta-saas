import OpenAI from "openai";

// Lazy initialization to avoid errors at import time
let _ai: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!_ai) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    _ai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://lumelia.fr",
        "X-Title": "Lumelia WhatsApp Bot",
      },
    });
  }
  return _ai;
}

// Legacy export for backward compatibility
export const ai = {
  get chat() {
    return getAIClient().chat;
  },
};

// Model configuration by tier (based on Jan 2026 benchmark)
export const MODELS = {
  TIER_1: "x-ai/grok-4.1-fast", // Router + simple FAQ (95.6% accuracy, cheap)
  TIER_2: "anthropic/claude-sonnet-4.5", // Booking, lead capture (95.6% accuracy)
  TIER_3: "anthropic/claude-opus-4.5", // Complex, escalation (97.8% accuracy)
  FALLBACK: "x-ai/grok-4.1-fast", // If Anthropic is down
} as const;

export type ModelTier = keyof typeof MODELS;

// Cost per 1M tokens (for tracking)
export const MODEL_COSTS: Record<
  Exclude<ModelTier, "FALLBACK">,
  { input: number; output: number }
> = {
  TIER_1: { input: 0.2, output: 0.5 }, // Grok 4.1 Fast
  TIER_2: { input: 3.0, output: 15.0 }, // Claude Sonnet 4.5
  TIER_3: { input: 15.0, output: 75.0 }, // Claude Opus 4.5
} as const;

// Calculate cost for a request
export function calculateCost(
  tier: Exclude<ModelTier, "FALLBACK">,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[tier];
  if (!costs) {
    throw new Error(`Invalid tier for cost calculation: ${tier}`);
  }
  return (
    (inputTokens * costs.input) / 1_000_000 +
    (outputTokens * costs.output) / 1_000_000
  );
}
