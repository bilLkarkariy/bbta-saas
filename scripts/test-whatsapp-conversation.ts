/**
 * WhatsApp Conversation Tester
 *
 * This script helps you test the WhatsApp AI agent by sending messages
 * and guiding you through a booking conversation.
 *
 * Run with: npx tsx scripts/test-whatsapp-conversation.ts +33XXXXXXXXX
 */

import "dotenv/config";
import { sendWhatsAppMessage } from "../src/lib/twilio";
import { db } from "../src/lib/db";
import * as readline from "readline";

async function testConversation() {
  const phoneNumber = process.argv[2];

  if (!phoneNumber) {
    console.error("Usage: npx tsx scripts/test-whatsapp-conversation.ts +33XXXXXXXXX");
    console.error("Replace with your WhatsApp phone number");
    process.exit(1);
  }

  console.log("\n🤖 === WhatsApp AI Agent Tester ===");
  console.log(`Testing with: ${phoneNumber}`);

  // Find tenant
  const tenant = await db.tenant.findFirst({
    where: {
      whatsappNumber: { not: null },
    },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
    },
  });

  if (!tenant || !tenant.whatsappNumber) {
    console.error("❌ No tenant found with WhatsApp configured");
    process.exit(1);
  }

  console.log(`\n✅ Found tenant: ${tenant.name}`);
  console.log(`   WhatsApp: ${tenant.whatsappNumber}`);
  console.log(`   Your phone: ${phoneNumber}`);

  // Show existing bookings for context
  console.log("\n📅 Current Calendar Status:");
  const bookings = await db.booking.findMany({
    where: {
      tenantId: tenant.id,
      date: {
        gte: new Date().toISOString().split("T")[0],
      },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 20,
  });

  if (bookings.length === 0) {
    console.log("   No bookings found. Run setup-mock-calendar.ts first!");
  } else {
    const bookingsByDate = bookings.reduce((acc, b) => {
      if (!acc[b.date]) acc[b.date] = [];
      acc[b.date].push(b);
      return acc;
    }, {} as Record<string, typeof bookings>);

    for (const [date, dateBookings] of Object.entries(bookingsByDate)) {
      console.log(`\n   ${date}:`);
      dateBookings.forEach((b) => {
        const status = b.status === "confirmed" ? "✅" : "⏳";
        console.log(`     ${b.time}: ${status} ${b.customerName} - ${b.service}`);
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n💬 CONVERSATION GUIDE");
  console.log("=".repeat(60));
  console.log("\nThe AI agent on Railway is listening for messages at:");
  console.log(`   ${tenant.whatsappNumber}`);
  console.log("\n📱 To test the booking flow:");
  console.log("\n1️⃣  Send a message to initiate booking:");
  console.log('   "Bonjour, je voudrais réserver"');
  console.log('   or "Hello" or "Salut"\n');

  console.log("2️⃣  The agent will ask for service. Reply with:");
  console.log('   "Coupe" or "Coloration" or any service\n');

  console.log("3️⃣  The agent will ask for date. Try:");
  console.log('   "demain" or "15/01" or day names\n');

  console.log("4️⃣  The agent will show available slots. Pick one:");
  console.log('   "14h" or "16:00"\n');

  console.log("5️⃣  The agent will ask for your name:");
  console.log('   "Jean Dupont"\n');

  console.log("6️⃣  Confirm the booking:");
  console.log('   "oui" or "confirme"\n');

  console.log("=".repeat(60));

  // Interactive message sender
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n📲 Quick Message Sender");
  console.log("Type a message to send via WhatsApp, or 'quit' to exit\n");

  const askMessage = () => {
    rl.question("💬 Message (or 'quit'): ", async (message) => {
      if (message.toLowerCase() === "quit") {
        console.log("\n👋 Goodbye!");
        rl.close();
        await db.$disconnect();
        return;
      }

      if (!message.trim()) {
        askMessage();
        return;
      }

      try {
        console.log(`\n📤 Sending: "${message}"`);

        const result = await sendWhatsAppMessage({
          to: phoneNumber,
          body: message,
          from: tenant.whatsappNumber!,
        });

        console.log(`✅ Sent! SID: ${result.sid}`);
        console.log("⏳ Wait for response on your WhatsApp...\n");
      } catch (error: any) {
        console.error(`❌ Failed: ${error.message}\n`);
      }

      // Ask for next message
      setTimeout(() => askMessage(), 100);
    });
  };

  // Start interactive loop
  askMessage();
}

testConversation().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
