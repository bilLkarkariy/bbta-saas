// Quote Request Flow - For artisans, consultants, services
// Collects project details for a quote

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { FlowDefinition, FlowContext, ValidationResult } from "./types";

const isValidDescription = (text: string): boolean => {
  return text.length >= 10 && text.length <= 1000;
};

const isValidAddress = (text: string): boolean => {
  return text.length >= 5;
};

export const QUOTE_REQUEST_FLOW: FlowDefinition = {
  type: "quote_request",
  maxAttempts: 3,

  steps: {
    ask_service_type: {
      id: "ask_service_type",
      prompt: () => {
        return `Quel type d'intervention souhaitez-vous ?

🔧 Dépannage urgent
🆕 Installation neuve
🔨 Rénovation
🛠️ Entretien
💬 Conseil/Diagnostic

Répondez avec le type qui vous convient.`;
      },
      validate: (response: string): ValidationResult => {
        const types = ["dépannage", "depannage", "urgent", "installation", "rénovation", "renovation", "entretien", "conseil", "diagnostic"];
        const lower = response.toLowerCase();
        const matchedType = types.find(t => lower.includes(t));

        if (matchedType) {
          const typeMap: Record<string, string> = {
            "dépannage": "Dépannage urgent",
            "depannage": "Dépannage urgent",
            "urgent": "Dépannage urgent",
            "installation": "Installation neuve",
            "rénovation": "Rénovation",
            "renovation": "Rénovation",
            "entretien": "Entretien",
            "conseil": "Conseil/Diagnostic",
            "diagnostic": "Conseil/Diagnostic",
          };
          return { valid: true, extractedValue: typeMap[matchedType] || matchedType };
        }

        // Accept any description as free text
        if (response.length >= 3) {
          return { valid: true, extractedValue: response };
        }

        return {
          valid: false,
          errorMessage: "Pouvez-vous préciser le type d'intervention ? (dépannage, installation, rénovation, entretien ou conseil)",
        };
      },
      next: () => "ask_description",
    },

    ask_description: {
      id: "ask_description",
      prompt: () => "Décrivez-moi votre besoin en quelques mots :",
      validate: (response: string): ValidationResult => {
        if (!isValidDescription(response)) {
          return {
            valid: false,
            errorMessage: "Pouvez-vous donner un peu plus de détails ? (minimum 10 caractères)",
          };
        }
        return { valid: true, extractedValue: response };
      },
      next: () => "ask_photos",
    },

    ask_photos: {
      id: "ask_photos",
      prompt: () => `Avez-vous des photos à m'envoyer pour mieux comprendre la situation ?

📷 Oui, je vous envoie des photos
❌ Non, pas de photos`,
      validate: (response: string): ValidationResult => {
        const lower = response.toLowerCase();
        const hasPhotos = lower.includes("oui") || lower.includes("photo");
        const noPhotos = lower.includes("non") || lower.includes("pas");

        if (hasPhotos || noPhotos) {
          return { valid: true, extractedValue: hasPhotos };
        }

        // Accept any response
        return { valid: true, extractedValue: false };
      },
      next: (data) => {
        if (data.photos === true) {
          return "wait_photos";
        }
        return "ask_address";
      },
    },

    wait_photos: {
      id: "wait_photos",
      prompt: () => "Parfait, envoyez-moi les photos et je vous réponds. 📷",
      validate: (): ValidationResult => {
        // Accept any response (photo or text saying they sent it)
        return { valid: true, extractedValue: true };
      },
      next: () => "ask_address",
    },

    ask_address: {
      id: "ask_address",
      prompt: () => "Quelle est l'adresse de l'intervention ? 📍",
      validate: (response: string): ValidationResult => {
        if (!isValidAddress(response)) {
          return {
            valid: false,
            errorMessage: "Pouvez-vous me donner une adresse plus complète ?",
          };
        }
        return { valid: true, extractedValue: response };
      },
      next: () => "ask_urgency",
    },

    ask_urgency: {
      id: "ask_urgency",
      prompt: () => `C'est urgent ou planifiable ?

⚡ Urgent (sous 24h)
📅 Cette semaine
📆 Ce mois-ci
🕐 Pas pressé`,
      validate: (response: string): ValidationResult => {
        const lower = response.toLowerCase();

        if (lower.includes("urgent") || lower.includes("24h")) {
          return { valid: true, extractedValue: "Urgent (sous 24h)" };
        }
        if (lower.includes("semaine")) {
          return { valid: true, extractedValue: "Cette semaine" };
        }
        if (lower.includes("mois")) {
          return { valid: true, extractedValue: "Ce mois-ci" };
        }
        if (lower.includes("press") || lower.includes("pas")) {
          return { valid: true, extractedValue: "Pas pressé" };
        }

        // Accept any response
        return { valid: true, extractedValue: response };
      },
      next: () => "ask_contact",
    },

    ask_contact: {
      id: "ask_contact",
      prompt: () => "Votre nom et email pour vous envoyer le devis ? 📧\n(ex: Jean Dupont, jean@email.com)",
      validate: (response: string): ValidationResult => {
        // Try to extract email
        const emailMatch = response.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);

        if (!emailMatch) {
          return {
            valid: false,
            errorMessage: "Pouvez-vous inclure votre adresse email ? (ex: jean@email.com)",
          };
        }

        // Extract name (everything before the email or comma)
        const email = emailMatch[0];
        let name = response.replace(email, "").replace(/[,\s]+/g, " ").trim();

        if (!name || name.length < 2) {
          name = "Client";
        }

        return {
          valid: true,
          extractedValue: { name, email },
        };
      },
      next: () => null, // Flow complete
    },
  },

  onComplete: async (data: Record<string, unknown>, ctx: FlowContext): Promise<string> => {
    const { service_type, description, address, urgency, contact } = data as {
      service_type: string;
      description: string;
      address: string;
      urgency: string;
      contact: { name: string; email: string };
    };

    // Create or update contact
    await db.contact.upsert({
      where: {
        tenantId_phone: {
          tenantId: ctx.tenant.id,
          phone: ctx.conversation.customerPhone,
        },
      },
      update: {
        name: contact.name,
        email: contact.email,
        lastContactAt: new Date(),
        customFields: {
          lastQuoteRequest: {
            service_type,
            description,
            address,
            urgency,
            requestedAt: new Date().toISOString(),
          },
        },
      },
      create: {
        tenantId: ctx.tenant.id,
        phone: ctx.conversation.customerPhone,
        name: contact.name,
        email: contact.email,
        source: "whatsapp",
        customFields: {
          lastQuoteRequest: {
            service_type,
            description,
            address,
            urgency,
            requestedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Update conversation with lead info
    await db.conversation.update({
      where: { id: ctx.conversation.id },
      data: {
        customerName: contact.name,
        customerEmail: contact.email,
        leadStatus: "new",
        leadScore: urgency === "Urgent (sous 24h)" ? 80 : urgency === "Cette semaine" ? 60 : 40,
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    return `Parfait ! J'ai bien reçu votre demande de devis. 📝

📋 ${service_type}
📝 ${description.substring(0, 50)}${description.length > 50 ? "..." : ""}
📍 ${address}
⏰ ${urgency}
👤 ${contact.name}

Je vous envoie un devis détaillé par email (${contact.email}) sous 24h.

Merci de votre confiance ! 🙏`;
  },

  onCancel: async (ctx: FlowContext): Promise<string> => {
    // Clear flow state
    await db.conversation.update({
      where: { id: ctx.conversation.id },
      data: {
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    return "Pas de souci ! N'hésitez pas si vous avez besoin d'un devis plus tard. 👋";
  },
};
