import twilio from "twilio";
import crypto from "crypto";
import { z } from "zod";

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

  // Constant-time comparison with length check
  try {
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // Buffers must be same length for timingSafeEqual
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// Zod schema for Twilio webhook validation
const TwilioWebhookSchema = z.object({
  MessageSid: z.string().min(1, "MessageSid is required"),
  AccountSid: z.string().min(1, "AccountSid is required"),
  From: z.string().min(1, "From is required"),
  To: z.string().min(1, "To is required"),
  Body: z.string().max(4096).default(""), // WhatsApp message limit
  NumMedia: z.string().default("0"),
  ProfileName: z.string().optional(),
  WaId: z.string().optional(),
  MediaUrl0: z.string().optional(),
  MediaContentType0: z.string().optional(),
});

export type TwilioWebhookPayload = z.infer<typeof TwilioWebhookSchema>;

export function parseTwilioWebhook(
  formData: Record<string, string>
): TwilioWebhookPayload {
  // Use safeParse for graceful handling of invalid data
  const result = TwilioWebhookSchema.safeParse(formData);

  if (!result.success) {
    console.error("[Twilio] Webhook validation failed:", result.error.issues);
    // Return minimal valid payload for graceful degradation
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

  return result.data;
}
