import { getAIClient, MODELS } from "@/lib/ai";
import type { Intent, RouterResult, FAQ } from "./router";

export interface ResponderContext {
  routerResult: RouterResult;
  message: string;
  customerName?: string;
  businessName: string;
  businessType: string;
  faqs: FAQ[];
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

export interface ResponderResult {
  response: string;
  model_used: string;
  should_escalate: boolean;
  suggested_actions?: string[];
}

const RESPONDER_SYSTEM_PROMPT = `Tu es un assistant WhatsApp sympathique et professionnel pour {businessName} ({businessType}).

RÈGLES DE COMMUNICATION:
1. Sois concis - les messages WhatsApp doivent être courts (max 2-3 phrases)
2. Utilise un ton amical mais professionnel
3. Tutoie le client (usage du "tu" en français)
4. N'utilise pas d'emojis sauf si le client en utilise
5. Signe jamais tes messages
6. Ne dis jamais que tu es une IA

CONTEXTE:
- Tu représentes {businessName}
- Type d'activité: {businessType}
{faqContext}

Réponds de manière naturelle et utile au message du client.`;

const INTENT_PROMPTS: Record<Intent, string> = {
  FAQ: "Le client pose une question. Utilise la FAQ correspondante pour répondre naturellement.",
  BOOKING: "Le client veut prendre rendez-vous. Guide-le vers la prise de RDV ou demande ses disponibilités.",
  LEAD_CAPTURE: "Le client montre de l'intérêt. Récupère ses coordonnées ou propose un échange pour en discuter.",
  ESCALATE: "Le client a besoin d'aide humaine. Informe-le qu'un membre de l'équipe va le recontacter rapidement.",
  OPT_OUT: "Le client veut se désabonner. Confirme que tu as bien noté sa demande et présente des excuses pour le dérangement.",
  GREETING: "Simple salutation. Réponds chaleureusement et propose ton aide.",
  UNKNOWN: "Message pas clair. Demande poliment des précisions sur ce que le client recherche.",
};

export async function generateResponse(
  context: ResponderContext
): Promise<ResponderResult> {
  const ai = getAIClient();
  const { routerResult, businessName, businessType, faqs } = context;

  // Select model based on tier
  const modelKey = `TIER_${routerResult.tier_needed}` as keyof typeof MODELS;
  const model = MODELS[modelKey] || MODELS.TIER_2;

  // Build FAQ context
  let faqContext = "";
  if (routerResult.faq_match) {
    faqContext = `\nFAQ CORRESPONDANTE:\nQ: ${routerResult.faq_match.question}\nR: ${routerResult.faq_match.answer}`;
  } else if (faqs.length > 0) {
    faqContext = `\nFAQs DISPONIBLES:\n${faqs.slice(0, 5).map((f) => `- ${f.question}: ${f.answer}`).join("\n")}`;
  }

  const systemPrompt = RESPONDER_SYSTEM_PROMPT
    .replace(/{businessName}/g, businessName)
    .replace(/{businessType}/g, businessType)
    .replace("{faqContext}", faqContext);

  // Build conversation context
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add recent history
  if (context.conversationHistory?.length) {
    for (const msg of context.conversationHistory.slice(-4)) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
  }

  // Add current message with intent context
  const intentPrompt = INTENT_PROMPTS[routerResult.intent];
  const customerPrefix = context.customerName
    ? `Le client s'appelle ${context.customerName}. `
    : "";

  messages.push({
    role: "user",
    content: `${customerPrefix}${intentPrompt}\n\nMessage du client: "${context.message}"`,
  });

  try {
    const response = await ai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";

    // Clean up response
    const cleanResponse = content
      .trim()
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\n{3,}/g, "\n\n"); // Limit newlines

    return {
      response: cleanResponse,
      model_used: model,
      should_escalate: routerResult.intent === "ESCALATE",
      suggested_actions: getSuggestedActions(routerResult.intent),
    };
  } catch (error) {
    console.error("Responder error:", error);

    // Fallback response based on intent
    return {
      response: getFallbackResponse(routerResult.intent, businessName),
      model_used: "fallback",
      should_escalate: true,
      suggested_actions: ["review_error", "manual_response"],
    };
  }
}

function getSuggestedActions(intent: Intent): string[] {
  switch (intent) {
    case "BOOKING":
      return ["show_calendar", "create_booking"];
    case "LEAD_CAPTURE":
      return ["add_to_crm", "send_catalog"];
    case "ESCALATE":
      return ["notify_team", "create_ticket"];
    case "OPT_OUT":
      return ["update_preferences", "confirm_optout"];
    default:
      return [];
  }
}

function getFallbackResponse(intent: Intent, businessName: string): string {
  switch (intent) {
    case "GREETING":
      return `Bonjour ! Bienvenue chez ${businessName}. Comment puis-je t'aider ?`;
    case "ESCALATE":
      return `Je comprends, un membre de notre équipe va te recontacter très rapidement.`;
    case "OPT_OUT":
      return `C'est noté, tu ne recevras plus de messages de notre part. Désolé pour le dérangement.`;
    default:
      return `Merci pour ton message. Un membre de l'équipe va te répondre rapidement.`;
  }
}
