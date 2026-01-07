import { Intent } from "./router";

export interface TierSelectionContext {
  intent: Intent;
  confidence: number;
  conversationLength: number;
  hasActiveFlow: boolean;
  previousTierUsed?: number;
  sentiment?: number; // 0-1, 1 = positive
  isComplexQuery?: boolean;
}

/**
 * Selects the appropriate AI tier based on context
 *
 * TIER 1 (Fast, cheap): Simple queries with high confidence
 * - Grok 4.1 Fast - ~$0.0001/1K tokens
 * - Greetings, thanks, opt-out, simple FAQ matches
 *
 * TIER 2 (Balanced): Moderate complexity
 * - Claude Sonnet 4 - ~$0.003/1K tokens
 * - Booking flows, lead capture, uncertain FAQ
 *
 * TIER 3 (Premium): Complex or sensitive
 * - Claude Opus 4 - ~$0.015/1K tokens
 * - Frustrated customers, complex support, escalations
 */
export function selectTier(context: TierSelectionContext): 1 | 2 | 3 {
  const {
    intent,
    confidence,
    conversationLength,
    hasActiveFlow,
    sentiment = 0.7,
    isComplexQuery = false,
  } = context;

  // TIER 1: Simple, high-confidence cases
  const tier1Intents: Intent[] = ["GREETING", "THANKS", "OPT_OUT"];
  if (tier1Intents.includes(intent)) {
    return 1;
  }

  // High confidence FAQ match
  if (intent === "FAQ" && confidence > 0.85) {
    return 1;
  }

  // TIER 3: Complex cases requiring advanced reasoning

  // Explicit escalation request
  if (intent === "ESCALATE") {
    return 3;
  }

  // Frustrated customer (low sentiment score)
  if (sentiment < 0.3) {
    return 3;
  }

  // Complex support issue
  if (intent === "SUPPORT") {
    return 3;
  }

  // Long conversation in active flow might need help
  if (conversationLength > 10 && hasActiveFlow) {
    return 3;
  }

  // Complex query detected
  if (isComplexQuery) {
    return 3;
  }

  // TIER 2: Default for moderate complexity
  // Booking, lead capture, uncertain FAQ
  return 2;
}

/**
 * Get the model ID for a given tier
 */
export function getTierModel(tier: 1 | 2 | 3): string {
  const models: Record<1 | 2 | 3, string> = {
    1: process.env.AI_TIER_1_MODEL || "x-ai/grok-4.1-fast",
    2: process.env.AI_TIER_2_MODEL || "anthropic/claude-sonnet-4",
    3: process.env.AI_TIER_3_MODEL || "anthropic/claude-opus-4",
  };

  return models[tier];
}

/**
 * Get estimated cost per 1K tokens for a tier
 */
export function getTierCost(tier: 1 | 2 | 3): number {
  const costs: Record<1 | 2 | 3, number> = {
    1: 0.0001,  // Grok Fast
    2: 0.003,   // Claude Sonnet
    3: 0.015,   // Claude Opus
  };

  return costs[tier];
}

/**
 * Analyze sentiment from message content
 * Returns 0-1 where 1 is very positive, 0 is very negative
 */
export function analyzeSentiment(message: string): number {
  const lowered = message.toLowerCase();

  // Negative indicators
  const negativeWords = [
    "problème", "probleme", "bug", "erreur", "marche pas", "fonctionne pas",
    "déçu", "decu", "nul", "horrible", "pire", "jamais", "plainte",
    "rembours", "colère", "colere", "inacceptable", "scandale",
    "marre", "ras le bol", "furieux", "énervé", "enerve"
  ];

  // Positive indicators
  const positiveWords = [
    "merci", "super", "génial", "genial", "parfait", "excellent",
    "bravo", "top", "cool", "bien", "content", "satisfait",
    "ravie", "ravi", "formidable", "incroyable"
  ];

  let score = 0.5; // Neutral baseline

  for (const word of negativeWords) {
    if (lowered.includes(word)) {
      score -= 0.15;
    }
  }

  for (const word of positiveWords) {
    if (lowered.includes(word)) {
      score += 0.1;
    }
  }

  // Caps lock detection (shouting)
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.5 && message.length > 10) {
    score -= 0.2;
  }

  // Exclamation marks (could be positive or negative, but usually emphasis)
  const exclamationCount = (message.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    score -= 0.1;
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Detect if a query is complex (requires more reasoning)
 */
export function isComplexQuery(message: string): boolean {
  const lowered = message.toLowerCase();

  // Multiple questions
  const questionMarks = (message.match(/\?/g) || []).length;
  if (questionMarks > 1) return true;

  // Long message with conditional logic
  const conditionalWords = ["si", "mais", "cependant", "toutefois", "sauf", "à condition", "dans le cas"];
  const hasConditionals = conditionalWords.some(word => lowered.includes(word));
  if (hasConditionals && message.length > 100) return true;

  // Comparison requests
  const comparisonWords = ["différence", "difference", "comparer", "comparaison", "versus", "vs", "mieux", "meilleur"];
  if (comparisonWords.some(word => lowered.includes(word))) return true;

  // Technical or detailed questions
  const technicalWords = ["comment fonctionne", "expliquer", "détail", "detail", "pourquoi", "technique"];
  if (technicalWords.some(word => lowered.includes(word)) && message.length > 50) return true;

  return false;
}
