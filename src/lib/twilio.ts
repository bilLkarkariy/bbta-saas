import twilio from "twilio";
import crypto from "crypto";

// Lazy initialization to avoid runtime errors if credentials aren't set
let _twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!_twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
    }

    _twilioClient = twilio(accountSid, authToken);
  }
  return _twilioClient;
}

export interface SendWhatsAppOptions {
  to: string;
  body: string;
  from?: string;
}

export async function sendWhatsAppMessage({
  to,
  body,
  from,
}: SendWhatsAppOptions): Promise<{ sid: string; status: string }> {
  const client = getTwilioClient();
  const fromNumber = from || process.env.TWILIO_WHATSAPP_NUMBER;

  if (!fromNumber) {
    throw new Error("TWILIO_WHATSAPP_NUMBER is required");
  }

  // Ensure WhatsApp prefix
  const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const fromWhatsApp = fromNumber.startsWith("whatsapp:")
    ? fromNumber
    : `whatsapp:${fromNumber}`;

  const message = await client.messages.create({
    body,
    from: fromWhatsApp,
    to: toWhatsApp,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}

export function verifyTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN is not set");
    return false;
  }

  // Build the data string
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // Create HMAC-SHA1
  const expectedSignature = crypto
    .createHmac("sha1", authToken)
    .update(data, "utf-8")
    .digest("base64");

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  ProfileName?: string;
  WaId?: string;
}

export function parseTwilioWebhook(
  formData: Record<string, string>
): TwilioWebhookPayload {
  return {
    MessageSid: formData.MessageSid || "",
    AccountSid: formData.AccountSid || "",
    From: formData.From || "",
    To: formData.To || "",
    Body: formData.Body || "",
    NumMedia: formData.NumMedia || "0",
    ProfileName: formData.ProfileName,
    WaId: formData.WaId,
  };
}
