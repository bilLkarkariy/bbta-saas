import "dotenv/config";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function testSMS() {
  const to = process.argv[2] || "+33600000002";
  const from = process.env.TWILIO_PHONE_NUMBER || "+18777804236";
  
  console.log(`📱 Sending SMS: ${from} → ${to}`);
  
  const msg = await client.messages.create({
    body: "🎉 Test Lumelia - SMS fonctionne !",
    from,
    to,
  });
  
  console.log(`✅ Sent! SID: ${msg.sid}, Status: ${msg.status}`);
}

testSMS().catch(console.error);
