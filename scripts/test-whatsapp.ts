// Quick WhatsApp test script
// Run with: npx tsx scripts/test-whatsapp.ts +33XXXXXXXXX

import "dotenv/config";
import { sendWhatsAppMessage } from "../src/lib/twilio";

async function testWhatsApp() {
  const phoneNumber = process.argv[2];

  if (!phoneNumber) {
    console.error("Usage: npx tsx scripts/test-whatsapp.ts +33XXXXXXXXX");
    console.error("Replace with your WhatsApp phone number");
    process.exit(1);
  }

  // Support both env var names
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  console.log("📱 Testing WhatsApp integration...");
  console.log(`To: ${phoneNumber}`);
  console.log(`From: ${fromNumber}`);

  if (!fromNumber) {
    console.error("❌ Missing TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER in .env");
    process.exit(1);
  }

  try {
    const result = await sendWhatsAppMessage({
      to: phoneNumber,
      body: "🎉 Test Lumelia - WhatsApp fonctionne !",
      from: fromNumber,
    });

    console.log("\n✅ Message sent successfully!");
    console.log(`   SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
  } catch (error) {
    console.error("\n❌ Failed to send message:");
    console.error(error);
    process.exit(1);
  }
}

testWhatsApp();
