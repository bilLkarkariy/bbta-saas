import "dotenv/config";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function testSMS() {
  const to = process.argv[2] || process.env.TEST_SMS_TO;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!to) {
    throw new Error("Missing destination phone. Use: npx tsx scripts/test-sms.ts <E164_PHONE> or set TEST_SMS_TO");
  }

  if (!from) {
    throw new Error("Missing TWILIO_PHONE_NUMBER environment variable");
  }
  
  console.log(`📱 Sending SMS: ${from} → ${to}`);
  
  const msg = await client.messages.create({
    body: "🎉 Test Lumelia - SMS fonctionne !",
    from,
    to,
  });
  
  console.log(`✅ Sent! SID: ${msg.sid}, Status: ${msg.status}`);
}

testSMS().catch(console.error);
