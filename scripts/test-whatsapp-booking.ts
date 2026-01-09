/**
 * Enhanced WhatsApp Booking Test Script
 *
 * This script simulates a complete booking conversation with:
 * - Mock calendar with available/booked slots
 * - Interactive conversation flow
 * - Step-by-step booking process
 * - Validation testing
 *
 * Run with: npx tsx scripts/test-whatsapp-booking.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { sendWhatsAppMessage } from "../src/lib/twilio";
import { addDays, format } from "date-fns";
import * as readline from "readline";

// ==================== Mock Calendar Data ====================

interface TimeSlot {
  time: string;
  available: boolean;
  bookedBy?: string;
}

interface MockCalendar {
  [date: string]: TimeSlot[];
}

// Mock calendar with some slots already booked
const mockCalendar: MockCalendar = {
  // Tomorrow
  [format(addDays(new Date(), 1), "yyyy-MM-dd")]: [
    { time: "09:00", available: true },
    { time: "10:00", available: false, bookedBy: "Marie Dupont" },
    { time: "11:00", available: true },
    { time: "14:00", available: true },
    { time: "15:00", available: false, bookedBy: "Jean Martin" },
    { time: "16:00", available: true },
    { time: "17:00", available: true },
  ],
  // Day after tomorrow
  [format(addDays(new Date(), 2), "yyyy-MM-dd")]: [
    { time: "09:00", available: true },
    { time: "10:00", available: true },
    { time: "11:00", available: true },
    { time: "14:00", available: false, bookedBy: "Sophie Laurent" },
    { time: "15:00", available: true },
    { time: "16:00", available: true },
    { time: "17:00", available: true },
  ],
};

// ==================== Conversation Simulation ====================

interface ConversationState {
  step: "service" | "date" | "time" | "name" | "confirm" | "complete";
  data: {
    service?: string;
    date?: string;
    time?: string;
    name?: string;
  };
}

class BookingSimulator {
  private state: ConversationState = {
    step: "service",
    data: {},
  };
  private rl: readline.Interface;
  private tenantId: string;
  private customerPhone: string;
  private whatsappNumber: string;

  constructor(tenantId: string, customerPhone: string, whatsappNumber: string) {
    this.tenantId = tenantId;
    this.customerPhone = customerPhone;
    this.whatsappNumber = whatsappNumber;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start() {
    console.log("\n🤖 === WhatsApp Booking Simulator ===");
    console.log("Simulating conversation with:", this.customerPhone);
    console.log("\n📅 Mock Calendar Status:");
    this.printCalendar();
    console.log("\n💬 Starting booking conversation...\n");

    await this.sendSystemMessage("Bonjour ! Bienvenue chez Lumelia. Je peux vous aider à réserver un rendez-vous.");
    await this.nextStep();
  }

  private printCalendar() {
    Object.entries(mockCalendar).forEach(([date, slots]) => {
      console.log(`\n  ${date}:`);
      slots.forEach((slot) => {
        const status = slot.available ? "✅ Available" : `❌ Booked (${slot.bookedBy})`;
        console.log(`    ${slot.time}: ${status}`);
      });
    });
  }

  private async sendSystemMessage(message: string) {
    console.log(`\n🤖 SYSTEM: ${message}`);

    // Optional: Actually send WhatsApp message (commented by default to avoid spam)
    // Uncomment this to test real WhatsApp integration
    /*
    try {
      await sendWhatsAppMessage({
        to: this.customerPhone,
        body: message,
        from: this.whatsappNumber,
      });
      console.log("   ✓ Sent via WhatsApp");
    } catch (error) {
      console.log("   ⚠ WhatsApp send failed (continuing simulation):", error.message);
    }
    */
  }

  private async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`\n👤 ${prompt}: `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async nextStep() {
    switch (this.state.step) {
      case "service":
        await this.askService();
        break;
      case "date":
        await this.askDate();
        break;
      case "time":
        await this.askTime();
        break;
      case "name":
        await this.askName();
        break;
      case "confirm":
        await this.confirm();
        break;
      case "complete":
        await this.complete();
        break;
    }
  }

  private async askService() {
    await this.sendSystemMessage("Parfait ! Quel service souhaitez-vous réserver ? Nous proposons: Coupe, Coloration, Soin");
    const response = await this.getUserInput("Your response");

    if (response.length < 2) {
      await this.sendSystemMessage("Pouvez-vous préciser le service souhaité ?");
      return this.askService();
    }

    this.state.data.service = response;
    this.state.step = "date";
    await this.nextStep();
  }

  private async askDate() {
    const tomorrow = format(addDays(new Date(), 1), "dd/MM");
    const dayAfter = format(addDays(new Date(), 2), "dd/MM");

    await this.sendSystemMessage(`Quelle date vous conviendrait ? (ex: demain, ${tomorrow}, ${dayAfter})`);
    const response = await this.getUserInput("Your response");

    const parsedDate = this.parseDate(response);
    if (!parsedDate) {
      await this.sendSystemMessage("Je n'ai pas compris la date. Pouvez-vous la préciser ? (ex: demain, 15/01)");
      return this.askDate();
    }

    // Check if date exists in mock calendar
    if (!mockCalendar[parsedDate]) {
      await this.sendSystemMessage("Désolé, cette date n'est pas disponible. Essayez demain ou après-demain.");
      return this.askDate();
    }

    this.state.data.date = parsedDate;
    this.state.step = "time";
    await this.nextStep();
  }

  private async askTime() {
    const date = this.state.data.date!;
    const availableSlots = mockCalendar[date]
      .filter((slot) => slot.available)
      .map((slot) => slot.time);

    if (availableSlots.length === 0) {
      await this.sendSystemMessage("Désolé, cette date est complète. Voulez-vous choisir une autre date ?");
      this.state.step = "date";
      return this.nextStep();
    }

    await this.sendSystemMessage(`Voici les créneaux disponibles: ${availableSlots.join(", ")}. Quelle heure préférez-vous ?`);
    const response = await this.getUserInput("Your response");

    const parsedTime = this.parseTime(response);
    if (!parsedTime) {
      await this.sendSystemMessage("Je n'ai pas compris l'heure. Pouvez-vous la préciser ? (ex: 14h, 10h30)");
      return this.askTime();
    }

    // Check availability in mock calendar
    const slot = mockCalendar[date].find((s) => s.time === parsedTime);
    if (!slot || !slot.available) {
      await this.sendSystemMessage(`Désolé, ${parsedTime} n'est plus disponible. Créneaux libres: ${availableSlots.join(", ")}`);
      return this.askTime();
    }

    this.state.data.time = parsedTime;
    this.state.step = "name";
    await this.nextStep();
  }

  private async askName() {
    await this.sendSystemMessage("À quel nom dois-je réserver ?");
    const response = await this.getUserInput("Your response");

    if (response.length < 2) {
      await this.sendSystemMessage("Pouvez-vous me donner votre nom complet ?");
      return this.askName();
    }

    this.state.data.name = response;
    this.state.step = "confirm";
    await this.nextStep();
  }

  private async confirm() {
    const { service, date, time, name } = this.state.data;
    const message = `Je récapitule votre réservation:
📅 Date: ${date}
🕐 Heure: ${time}
💼 Service: ${service}
👤 Nom: ${name}

Confirmez-vous cette réservation ? (oui/non)`;

    await this.sendSystemMessage(message);
    const response = await this.getUserInput("Your response");

    const lowered = response.toLowerCase();
    if (lowered.includes("oui") || lowered.includes("ok") || lowered.includes("confirme")) {
      this.state.step = "complete";
      await this.nextStep();
    } else if (lowered.includes("non") || lowered.includes("annule")) {
      await this.sendSystemMessage("Pas de problème ! Si vous souhaitez réserver plus tard, n'hésitez pas à me recontacter. 👋");
      this.rl.close();
    } else {
      await this.sendSystemMessage("Répondez par oui ou non s'il vous plaît.");
      return this.confirm();
    }
  }

  private async complete() {
    const { service, date, time, name } = this.state.data;

    console.log("\n💾 Creating booking in database...");

    try {
      // Create actual booking in database
      const booking = await db.booking.create({
        data: {
          tenantId: this.tenantId,
          customerPhone: this.customerPhone,
          customerName: name!,
          service: service!,
          date: date!,
          time: time!,
          status: "confirmed",
          notes: "Created via WhatsApp booking simulator",
        },
      });

      console.log("✅ Booking created successfully!");
      console.log("   ID:", booking.id);

      // Mark slot as booked in mock calendar
      const slot = mockCalendar[date!].find((s) => s.time === time);
      if (slot) {
        slot.available = false;
        slot.bookedBy = name;
      }

      const confirmMessage = `✅ Votre réservation est confirmée !

📅 ${date} à ${time}
💼 ${service}
👤 ${name}

Vous recevrez un rappel avant le rendez-vous. À bientôt !`;

      await this.sendSystemMessage(confirmMessage);

      console.log("\n📅 Updated Mock Calendar:");
      this.printCalendar();

    } catch (error) {
      console.error("❌ Error creating booking:", error);
      await this.sendSystemMessage("Désolé, une erreur est survenue. Veuillez réessayer.");
    }

    this.rl.close();
  }

  // Helper: Parse date from user input
  private parseDate(input: string): string | null {
    const lowered = input.toLowerCase().trim();

    if (lowered.includes("demain")) {
      return format(addDays(new Date(), 1), "yyyy-MM-dd");
    }
    if (lowered.includes("après-demain") || lowered.includes("apres-demain")) {
      return format(addDays(new Date(), 2), "yyyy-MM-dd");
    }

    // Try parsing explicit dates
    const dateMatch = input.match(/(\d{1,2})[\/\-.](\d{1,2})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = new Date().getFullYear();
      const parsed = new Date(year, month, day);
      return format(parsed, "yyyy-MM-dd");
    }

    return null;
  }

  // Helper: Parse time from user input
  private parseTime(input: string): string | null {
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
}

// ==================== Main ====================

async function main() {
  console.log("🔍 Finding tenant with WhatsApp configured...");

  const tenant = await db.tenant.findFirst({
    where: {
      whatsappNumber: { not: null },
    },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      ownerPhone: true,
    },
  });

  if (!tenant) {
    console.error("❌ No tenant found with WhatsApp number configured");
    console.error("   Run the app and configure WhatsApp in settings first");
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name}`);
  console.log(`   WhatsApp: ${tenant.whatsappNumber}`);

  // Use owner phone or command line argument
  const customerPhone = process.argv[2] || tenant.ownerPhone || "+33612345678";
  console.log(`   Test customer: ${customerPhone}`);

  const simulator = new BookingSimulator(
    tenant.id,
    customerPhone,
    tenant.whatsappNumber!
  );

  await simulator.start();

  await db.$disconnect();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
