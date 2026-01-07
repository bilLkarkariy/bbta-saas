import { getAIClient, MODELS } from "@/lib/ai";

export type Intent =
  | "FAQ"
  | "BOOKING"
  | "LEAD_CAPTURE"
  | "SUPPORT"
  | "ESCALATE"
  | "OPT_OUT"
  | "GREETING"
  | "THANKS"
  | "UNKNOWN";

export interface ExtractedEntities {
  date?: string;        // Format YYYY-MM-DD
  time?: string;        // Format HH:MM
  service?: string;     // Service name requested
  name?: string;        // Customer name
  phone?: string;       // Phone number
  email?: string;       // Email address
  quantity?: number;    // Number of people/items
}

export interface RouterResult {
  intent: Intent;
  confidence: number;
  tier_needed: 1 | 2 | 3;
  entities: ExtractedEntities;
  faq_match?: {
    faq_id?: string;
    question: string;
    answer: string;
    similarity: number;
  };
  should_continue_flow: boolean;
  suggested_flow?: "booking" | "lead_capture" | null;
  reasoning?: string;
}

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string | null;
  keywords?: string[];
}

export interface RouterContext {
  message: string;
  customerPhone: string;
  businessType: string;
  faqs: FAQ[];
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  currentFlow?: string | null;
  flowData?: Record<string, unknown>;
  timezone?: string;
}

const ROUTER_SYSTEM_PROMPT = `Tu es un routeur intelligent pour un assistant WhatsApp B2B.

TÂCHE: Analyse le message client et retourne un JSON avec:
1. L'intention principale (intent)
2. Le niveau de confiance (0-1)
3. Le tier AI nécessaire (1=simple, 2=moyen, 3=complexe)
4. Les entités extraites
5. Si un flow conversationnel doit être suggéré

INTENTS POSSIBLES:
- FAQ: Question sur horaires, tarifs, services, adresse
- BOOKING: Demande de rendez-vous/réservation
- LEAD_CAPTURE: Demande de devis, rappel, information commerciale
- SUPPORT: Problème technique, réclamation, suivi commande
- ESCALATE: Demande explicite d'humain, frustration élevée
- OPT_OUT: Stop, désabonnement
- GREETING: Bonjour, salut, hey
- THANKS: Merci, parfait, super
- UNKNOWN: Impossible à classifier

EXTRACTION D'ENTITÉS:
- date: format YYYY-MM-DD (convertis "demain" en date réelle, "lundi" en prochain lundi)
- time: format HH:MM (convertis "14h" en 14:00, "midi" en 12:00)
- service: nom exact du service mentionné
- name: nom complet si donné
- phone: numéro de téléphone
- email: adresse email
- quantity: nombre de personnes/quantité

RÈGLES TIER:
- TIER 1: FAQ simple avec confiance > 0.85, GREETING, THANKS, OPT_OUT
- TIER 2: BOOKING, LEAD_CAPTURE, FAQ avec confiance moyenne
- TIER 3: SUPPORT complexe, ESCALATE, sentiment négatif détecté

FLOW SUGGESTION:
- suggested_flow: "booking" si le client veut réserver
- suggested_flow: "lead_capture" si le client demande devis/info commerciale
- should_continue_flow: true si déjà dans un flow et le message y répond

Réponds UNIQUEMENT en JSON valide.`;

// Sanitize user input to prevent prompt injection
function sanitizeForPrompt(text: string, maxLength: number = 2000): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .slice(0, maxLength);
}

export async function routeIntent(context: RouterContext): Promise<RouterResult> {
  const ai = getAIClient();

  // Build FAQ context (limit to prevent token overflow)
  const faqList = context.faqs.length > 0
    ? `FAQs DISPONIBLES:\n${context.faqs.slice(0, 15).map((f, i) =>
        `${i + 1}. Q: ${f.question}\n   R: ${f.answer}${f.keywords?.length ? `\n   Mots-clés: ${f.keywords.join(", ")}` : ""}`
      ).join("\n\n")}`
    : "Aucune FAQ configurée.";

  const historyContext = context.conversationHistory?.length
    ? `\nHISTORIQUE RÉCENT:\n${context.conversationHistory.slice(-5).map((m) =>
        `${m.role === "user" ? "Client" : "Bot"}: ${m.content}`
      ).join("\n")}`
    : "";

  const flowContext = context.currentFlow
    ? `\nFLOW EN COURS: ${context.currentFlow}\nDONNÉES FLOW: ${JSON.stringify(context.flowData || {})}`
    : "";

  const today = new Date();
  const dateContext = `\nDATE ACTUELLE: ${today.toISOString().split("T")[0]} (${today.toLocaleDateString("fr-FR", { weekday: "long" })})`;

  const userPrompt = `Type de business: ${context.businessType}
${dateContext}
${faqList}
${historyContext}
${flowContext}

MESSAGE DU CLIENT: "${sanitizeForPrompt(context.message)}"

Analyse et classifie ce message. Extrais toutes les entités pertinentes.`;

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.TIER_1,
      messages: [
        { role: "system", content: ROUTER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 800,
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

    const result = JSON.parse(jsonMatch[0]);

    // Validate and normalize
    return {
      intent: validateIntent(result.intent),
      confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
      tier_needed: validateTier(result.tier_needed),
      entities: normalizeEntities(result.entities || {}),
      faq_match: result.faq_match,
      should_continue_flow: Boolean(result.should_continue_flow),
      suggested_flow: validateFlow(result.suggested_flow),
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error("[Router] Error:", error);
    return {
      intent: "UNKNOWN",
      confidence: 0,
      tier_needed: 2,
      entities: {},
      should_continue_flow: false,
      reasoning: "Router error - fallback to UNKNOWN",
    };
  }
}

function validateIntent(intent: string): Intent {
  const validIntents: Intent[] = [
    "FAQ",
    "BOOKING",
    "LEAD_CAPTURE",
    "SUPPORT",
    "ESCALATE",
    "OPT_OUT",
    "GREETING",
    "THANKS",
    "UNKNOWN",
  ];
  return validIntents.includes(intent as Intent) ? (intent as Intent) : "UNKNOWN";
}

function validateTier(tier: number): 1 | 2 | 3 {
  if (tier === 1 || tier === 2 || tier === 3) return tier;
  return 2;
}

function validateFlow(flow: string | undefined | null): "booking" | "lead_capture" | null {
  if (flow === "booking" || flow === "lead_capture") return flow;
  return null;
}

function normalizeEntities(entities: Record<string, unknown>): ExtractedEntities {
  const normalized: ExtractedEntities = {};

  if (typeof entities.date === "string") {
    normalized.date = entities.date;
  }
  if (typeof entities.time === "string") {
    normalized.time = entities.time;
  }
  if (typeof entities.service === "string") {
    normalized.service = entities.service;
  }
  if (typeof entities.name === "string") {
    normalized.name = entities.name;
  }
  if (typeof entities.phone === "string") {
    normalized.phone = entities.phone;
  }
  if (typeof entities.email === "string") {
    normalized.email = entities.email;
  }
  if (typeof entities.quantity === "number") {
    normalized.quantity = entities.quantity;
  } else if (typeof entities.quantity === "string") {
    const parsed = parseInt(entities.quantity, 10);
    if (!isNaN(parsed)) normalized.quantity = parsed;
  }

  return normalized;
}
