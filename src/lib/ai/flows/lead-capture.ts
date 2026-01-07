import type { FlowDefinition, ValidationResult } from "./types";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");
  return /^(\+?\d{8,15})$/.test(cleaned);
}

export const LEAD_CAPTURE_FLOW: FlowDefinition = {
  type: "lead_capture",
  maxAttempts: 3,

  steps: {
    ask_interest: {
      id: "ask_interest",
      prompt: (ctx) => {
        return `Je serai ravi de vous aider ! Pour mieux vous orienter, pourriez-vous me préciser ce qui vous intéresse ?

Nos services incluent: ${ctx.tenant.services?.join(", ") || "divers services adaptés à vos besoins"}`;
      },
      validate: (response): ValidationResult => {
        if (response.trim().length < 3) {
          return { valid: false, errorMessage: "Pouvez-vous me donner plus de détails sur ce qui vous intéresse ?" };
        }
        return { valid: true, extractedValue: response.trim() };
      },
      next: () => "ask_name",
    },

    ask_name: {
      id: "ask_name",
      prompt: (ctx) => {
        if (ctx.conversation.customerName) {
          return `Super ! Et c'est bien avec ${ctx.conversation.customerName} que j'ai le plaisir d'échanger ?`;
        }
        return "Parfait ! Puis-je avoir votre nom pour personnaliser notre échange ?";
      },
      validate: (response, ctx): ValidationResult => {
        const lowered = response.toLowerCase();
        if (ctx.conversation.customerName && (lowered.includes("oui") || lowered.includes("exact") || lowered.includes("c'est ça"))) {
          return { valid: true, extractedValue: ctx.conversation.customerName };
        }
        if (response.trim().length < 2) {
          return { valid: false, errorMessage: "Pouvez-vous me donner votre nom ?" };
        }
        return { valid: true, extractedValue: response.trim() };
      },
      next: () => "ask_contact",
    },

    ask_contact: {
      id: "ask_contact",
      prompt: () => `Comment préférez-vous être recontacté(e) ?
1️⃣ Par email
2️⃣ Par téléphone
3️⃣ Les deux`,
      validate: (response): ValidationResult => {
        const lowered = response.toLowerCase();
        if (lowered.includes("1") || lowered.includes("email") || lowered.includes("mail")) {
          return { valid: true, extractedValue: "email" };
        }
        if (lowered.includes("2") || lowered.includes("téléphone") || lowered.includes("telephone") || lowered.includes("appel")) {
          return { valid: true, extractedValue: "phone" };
        }
        if (lowered.includes("3") || lowered.includes("deux") || lowered.includes("les 2")) {
          return { valid: true, extractedValue: "both" };
        }
        return { valid: false, errorMessage: "Choisissez: 1 (email), 2 (téléphone), ou 3 (les deux)" };
      },
      next: (data) => {
        const method = data.contact_method;
        if (method === "email" || method === "both") return "ask_email";
        return "ask_phone";
      },
    },

    ask_email: {
      id: "ask_email",
      prompt: () => "Quelle est votre adresse email ?",
      validate: (response): ValidationResult => {
        const email = response.trim().toLowerCase();
        if (!isValidEmail(email)) {
          return { valid: false, errorMessage: "Cette adresse email ne semble pas valide. Pouvez-vous vérifier ?" };
        }
        return { valid: true, extractedValue: email };
      },
      next: (data) => (data.contact_method === "both" ? "ask_phone" : "ask_availability"),
    },

    ask_phone: {
      id: "ask_phone",
      prompt: (ctx) => {
        // Check if we already have their WhatsApp number
        if (ctx.conversation.customerPhone) {
          return `Préférez-vous être rappelé sur ce numéro WhatsApp (${ctx.conversation.customerPhone}) ou un autre ?`;
        }
        return "Quel est votre numéro de téléphone ?";
      },
      validate: (response, ctx): ValidationResult => {
        const lowered = response.toLowerCase();
        // Accept "oui" or "ce numéro" as using WhatsApp number
        if (ctx.conversation.customerPhone && (lowered.includes("oui") || lowered.includes("ce numéro") || lowered.includes("celui-ci") || lowered.includes("celui ci"))) {
          return { valid: true, extractedValue: ctx.conversation.customerPhone };
        }

        const cleaned = response.replace(/[\s\-\.\(\)]/g, "");
        if (!isValidPhone(cleaned)) {
          return { valid: false, errorMessage: "Ce numéro ne semble pas valide. Pouvez-vous vérifier ?" };
        }
        return { valid: true, extractedValue: cleaned };
      },
      next: () => "ask_availability",
    },

    ask_availability: {
      id: "ask_availability",
      prompt: () => `Quand seriez-vous disponible pour un échange ?
• Le matin
• L'après-midi
• En soirée
• À tout moment`,
      validate: (response): ValidationResult => {
        const lowered = response.toLowerCase();
        if (lowered.includes("matin")) {
          return { valid: true, extractedValue: "matin (9h-12h)" };
        }
        if (lowered.includes("après-midi") || lowered.includes("apres-midi") || lowered.includes("aprèm")) {
          return { valid: true, extractedValue: "après-midi (14h-18h)" };
        }
        if (lowered.includes("soir")) {
          return { valid: true, extractedValue: "soirée (18h-20h)" };
        }
        if (lowered.includes("tout") || lowered.includes("n'importe") || lowered.includes("importe")) {
          return { valid: true, extractedValue: "flexible" };
        }
        // Accept any response
        return { valid: true, extractedValue: response.trim() };
      },
      next: () => "confirm",
    },

    confirm: {
      id: "confirm",
      prompt: (ctx) => {
        const data = ctx.currentData;
        let contactInfo = "";
        if (data.email) contactInfo += `📧 ${data.email}\n`;
        if (data.phone) contactInfo += `📱 ${data.phone}\n`;

        return `Parfait ! Je récapitule :

👤 ${data.name}
${contactInfo}🎯 Intérêt: ${data.interest}
🕐 Disponibilité: ${data.availability}

Un conseiller vous contactera très prochainement. C'est bien noté ?`;
      },
      validate: (response): ValidationResult => {
        const lowered = response.toLowerCase();
        if (lowered.includes("oui") || lowered.includes("ok") || lowered.includes("parfait") || lowered.includes("merci") || lowered.includes("super")) {
          return { valid: true, extractedValue: true };
        }
        if (lowered.includes("non") || lowered.includes("annule") || lowered.includes("pas")) {
          return { valid: true, extractedValue: false };
        }
        // Accept any positive-seeming response
        return { valid: true, extractedValue: true };
      },
      next: (data) => (data.confirmed === false ? "cancelled" : null),
    },

    cancelled: {
      id: "cancelled",
      prompt: () => "Pas de problème ! N'hésitez pas à revenir vers nous si vous changez d'avis. 👋",
      validate: () => ({ valid: true }),
      next: () => null,
    },
  },

  onComplete: async (data, context) => {
    // Update conversation with lead info
    await db.conversation.update({
      where: { id: context.conversation.id },
      data: {
        customerName: data.name as string,
        customerEmail: data.email as string | undefined,
        leadStatus: "new",
        leadScore: 70, // Initial score for engaged lead
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    // Create or update contact
    await db.contact.upsert({
      where: {
        tenantId_phone: {
          tenantId: context.tenant.id,
          phone: context.conversation.customerPhone,
        },
      },
      create: {
        tenantId: context.tenant.id,
        phone: context.conversation.customerPhone,
        name: data.name as string,
        email: data.email as string | undefined,
        source: "whatsapp",
        customFields: {
          interest: String(data.interest || ""),
          availability: String(data.availability || ""),
          capturedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
      update: {
        name: data.name as string,
        email: data.email as string | undefined,
        lastContactAt: new Date(),
        customFields: {
          interest: String(data.interest || ""),
          availability: String(data.availability || ""),
          updatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return `Merci ${data.name} ! 🙏

Votre demande a bien été enregistrée. Un conseiller vous contactera ${data.availability === "flexible" ? "dans les plus brefs délais" : `de préférence le ${data.availability}`}.

En attendant, n'hésitez pas à me poser d'autres questions !`;
  },

  onCancel: async (context) => {
    await db.conversation.update({
      where: { id: context.conversation.id },
      data: {
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    return "Pas de problème ! Je reste disponible si vous avez des questions. 😊";
  },
};
