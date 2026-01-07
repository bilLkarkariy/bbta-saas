import type { FlowDefinition, ValidationResult } from "./types";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { addDays, format, isValid, isBefore, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Parse relative date expressions
function parseDate(input: string, timezone: string): Date | null {
  const now = toZonedTime(new Date(), timezone);
  const today = startOfDay(now);
  const lowered = input.toLowerCase().trim();

  if (lowered.includes("demain")) return addDays(today, 1);
  if (lowered.includes("aujourd'hui") || lowered.includes("aujourdhui")) return today;
  if (lowered.includes("après-demain") || lowered.includes("apres-demain")) return addDays(today, 2);

  // Day names
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  for (let i = 0; i < days.length; i++) {
    if (lowered.includes(days[i])) {
      const currentDay = now.getDay();
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      return addDays(today, daysUntil);
    }
  }

  // Try to parse explicit date formats
  const dateMatch = input.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    const parsed = new Date(fullYear, month, day);
    if (isValid(parsed)) return parsed;
  }

  return null;
}

// Parse time expressions
function parseTime(input: string): string | null {
  const lowered = input.toLowerCase().trim();

  // Common time words
  if (lowered.includes("midi")) return "12:00";
  if (lowered.includes("minuit")) return "00:00";

  // Parse HH:MM or HHhMM or HHh
  const timeMatch = input.match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

// Check availability for a time slot
async function checkAvailability(
  tenantId: string,
  date: string,
  time: string,
  resourceId?: string
): Promise<boolean> {
  const existing = await db.booking.findFirst({
    where: {
      tenantId,
      date,
      time,
      resourceId: resourceId || null,
      status: { in: ["pending", "confirmed"] },
    },
  });
  return !existing;
}

// Get available time slots for a date
async function getAvailableSlots(
  tenantId: string,
  date: string,
  _businessHours?: string
): Promise<string[]> {
  // Default business hours
  const defaultSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  // Get existing bookings
  const existingBookings = await db.booking.findMany({
    where: {
      tenantId,
      date,
      status: { in: ["pending", "confirmed"] },
    },
    select: { time: true },
  });

  const bookedTimes = new Set(existingBookings.map((b) => b.time));
  return defaultSlots.filter((slot) => !bookedTimes.has(slot));
}

export const BOOKING_FLOW: FlowDefinition = {
  type: "booking",
  maxAttempts: 3,

  steps: {
    ask_service: {
      id: "ask_service",
      prompt: (ctx) => {
        const services = ctx.tenant.services?.join(", ") || "nos services";
        return `Parfait ! Quel service souhaitez-vous réserver ? Nous proposons: ${services}`;
      },
      validate: (response): ValidationResult => {
        if (response.trim().length < 2) {
          return { valid: false, errorMessage: "Pouvez-vous préciser le service souhaité ?" };
        }
        return { valid: true, extractedValue: response.trim() };
      },
      next: () => "ask_date",
    },

    ask_date: {
      id: "ask_date",
      prompt: () => "Quelle date vous conviendrait ? (ex: demain, lundi, 15/01)",
      validate: (response, ctx): ValidationResult => {
        const date = parseDate(response, ctx.tenant.timezone);
        if (!date) {
          return { valid: false, errorMessage: "Je n'ai pas compris la date. Pouvez-vous la préciser ? (ex: demain, 15/01)" };
        }
        const today = startOfDay(toZonedTime(new Date(), ctx.tenant.timezone));
        if (isBefore(date, today)) {
          return { valid: false, errorMessage: "Cette date est passée. Choisissez une date future." };
        }
        return { valid: true, extractedValue: format(date, "yyyy-MM-dd") };
      },
      next: () => "ask_time",
    },

    ask_time: {
      id: "ask_time",
      prompt: async (ctx) => {
        const date = ctx.currentData.date as string;
        const availableSlots = await getAvailableSlots(ctx.tenant.id, date, ctx.tenant.businessHours);
        if (availableSlots.length === 0) {
          return "Désolé, cette date est complète. Voulez-vous choisir une autre date ?";
        }
        return `Voici les créneaux disponibles: ${availableSlots.join(", ")}. Quelle heure préférez-vous ?`;
      },
      validate: async (response, ctx): Promise<ValidationResult> => {
        const time = parseTime(response);
        if (!time) {
          return { valid: false, errorMessage: "Je n'ai pas compris l'heure. Pouvez-vous la préciser ? (ex: 14h, 10h30)" };
        }

        const date = ctx.currentData.date as string;
        const isAvailable = await checkAvailability(ctx.tenant.id, date, time);
        if (!isAvailable) {
          const availableSlots = await getAvailableSlots(ctx.tenant.id, date);
          return {
            valid: false,
            errorMessage: `Désolé, ${time} n'est plus disponible. Créneaux libres: ${availableSlots.join(", ")}`,
          };
        }

        return { valid: true, extractedValue: time };
      },
      next: () => "ask_name",
    },

    ask_name: {
      id: "ask_name",
      prompt: (ctx) => {
        if (ctx.conversation.customerName) {
          return `C'est bien au nom de ${ctx.conversation.customerName} ?`;
        }
        return "À quel nom dois-je réserver ?";
      },
      validate: (response, ctx): ValidationResult => {
        const lowered = response.toLowerCase();
        if (ctx.conversation.customerName && (lowered.includes("oui") || lowered.includes("ok") || lowered.includes("exact"))) {
          return { valid: true, extractedValue: ctx.conversation.customerName };
        }
        if (response.trim().length < 2) {
          return { valid: false, errorMessage: "Pouvez-vous me donner votre nom complet ?" };
        }
        return { valid: true, extractedValue: response.trim() };
      },
      next: () => "confirm",
    },

    confirm: {
      id: "confirm",
      prompt: (ctx) => {
        const data = ctx.currentData;
        return `Je récapitule votre réservation:
📅 Date: ${data.date}
🕐 Heure: ${data.time}
💼 Service: ${data.service}
👤 Nom: ${data.name}

Confirmez-vous cette réservation ? (oui/non)`;
      },
      validate: (response): ValidationResult => {
        const lowered = response.toLowerCase();
        if (lowered.includes("oui") || lowered.includes("ok") || lowered.includes("confirme") || lowered.includes("c'est bon")) {
          return { valid: true, extractedValue: true };
        }
        if (lowered.includes("non") || lowered.includes("annule") || lowered.includes("pas")) {
          return { valid: true, extractedValue: false };
        }
        return { valid: false, errorMessage: "Répondez par oui ou non s'il vous plaît." };
      },
      next: (data) => (data.confirmed === false ? "cancelled" : null),
    },

    cancelled: {
      id: "cancelled",
      prompt: () => "Pas de problème ! Si vous souhaitez réserver plus tard, n'hésitez pas à me recontacter. 👋",
      validate: () => ({ valid: true }),
      next: () => null,
    },
  },

  onComplete: async (data, context) => {
    // Create booking in database
    await db.booking.create({
      data: {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        customerPhone: context.conversation.customerPhone,
        customerName: data.name as string,
        service: data.service as string,
        date: data.date as string,
        time: data.time as string,
        status: "confirmed",
      },
    });

    // Clear flow state
    await db.conversation.update({
      where: { id: context.conversation.id },
      data: {
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    return `✅ Votre réservation est confirmée !

📅 ${data.date} à ${data.time}
💼 ${data.service}
👤 ${data.name}

Vous recevrez un rappel avant le rendez-vous. À bientôt !`;
  },

  onCancel: async (context) => {
    await db.conversation.update({
      where: { id: context.conversation.id },
      data: {
        currentFlow: null,
        flowData: Prisma.JsonNull,
      },
    });

    return "Pas de problème, la réservation a été annulée. Comment puis-je vous aider autrement ?";
  },
};
