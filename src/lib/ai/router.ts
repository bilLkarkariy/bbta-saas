import { getAIClient, MODELS } from "@/lib/ai";

export type Intent =
  | "FAQ"
  | "BOOKING"
  | "LEAD_CAPTURE"
  | "ESCALATE"
  | "OPT_OUT"
  | "GREETING"
  | "UNKNOWN";

export interface RouterResult {
  intent: Intent;
  confidence: number;
  tier_needed: 1 | 2 | 3;
  entities: Record<string, string>;
  faq_match?: {
    question: string;
    answer: string;
    similarity: number;
  };
  reasoning?: string;
}

export interface FAQ {
  question: string;
  answer: string;
  category: string | null;
}

export interface RouterContext {
  message: string;
  customerPhone: string;
  businessType: string;
  faqs: FAQ[];
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

const ROUTER_SYSTEM_PROMPT = `Tu es un routeur d'intentions pour un assistant WhatsApp business.
Analyse le message du client et classifie l'intention.

INTENTS DISPONIBLES:
- FAQ: Le client pose une question qui peut être répondue par une FAQ existante
- BOOKING: Le client veut prendre rendez-vous ou réserver
- LEAD_CAPTURE: Le client montre de l'intérêt (demande de devis, info produit/service)
- ESCALATE: Le client est frustré, mécontent, ou demande explicitement un humain
- OPT_OUT: Le client veut se désabonner ou arrêter les messages
- GREETING: Simple salutation (bonjour, salut, etc.)
- UNKNOWN: Impossible de déterminer l'intention

RÈGLES:
1. Si une FAQ correspond bien (>70% similaire), retourne FAQ avec la FAQ correspondante
2. ESCALATE si mots-clés: "plainte", "problème", "humain", "manager", "rembours"
3. OPT_OUT si mots-clés: "stop", "désabonner", "arrêter", "ne plus recevoir"
4. GREETING pour les simples salutations sans autre demande

Réponds UNIQUEMENT en JSON valide avec ce format:
{
  "intent": "FAQ|BOOKING|LEAD_CAPTURE|ESCALATE|OPT_OUT|GREETING|UNKNOWN",
  "confidence": 0.0-1.0,
  "tier_needed": 1|2|3,
  "entities": {},
  "faq_match": {"question": "...", "answer": "...", "similarity": 0.0-1.0} | null,
  "reasoning": "courte explication"
}`;

export async function routeIntent(context: RouterContext): Promise<RouterResult> {
  const ai = getAIClient();

  const faqList = context.faqs.length > 0
    ? `FAQs DISPONIBLES:\n${context.faqs.map((f, i) => `${i + 1}. Q: ${f.question}\n   R: ${f.answer}`).join("\n\n")}`
    : "Aucune FAQ configurée.";

  const historyContext = context.conversationHistory?.length
    ? `\nHISTORIQUE RÉCENT:\n${context.conversationHistory.slice(-5).map((m) => `${m.role === "user" ? "Client" : "Bot"}: ${m.content}`).join("\n")}`
    : "";

  const userPrompt = `Type de business: ${context.businessType}

${faqList}
${historyContext}

MESSAGE DU CLIENT: "${context.message}"

Analyse et classifie ce message.`;

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.TIER_1,
      messages: [
        { role: "system", content: ROUTER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistent classification
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as RouterResult;

    // Validate and normalize
    return {
      intent: validateIntent(result.intent),
      confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
      tier_needed: validateTier(result.tier_needed),
      entities: result.entities || {},
      faq_match: result.faq_match,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error("Router error:", error);
    // Fallback to safe defaults
    return {
      intent: "UNKNOWN",
      confidence: 0,
      tier_needed: 2,
      entities: {},
      reasoning: "Router error - fallback to UNKNOWN",
    };
  }
}

function validateIntent(intent: string): Intent {
  const validIntents: Intent[] = [
    "FAQ",
    "BOOKING",
    "LEAD_CAPTURE",
    "ESCALATE",
    "OPT_OUT",
    "GREETING",
    "UNKNOWN",
  ];
  return validIntents.includes(intent as Intent) ? (intent as Intent) : "UNKNOWN";
}

function validateTier(tier: number): 1 | 2 | 3 {
  if (tier === 1 || tier === 2 || tier === 3) return tier;
  return 2; // Default to tier 2
}
