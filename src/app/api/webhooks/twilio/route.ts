import { NextResponse } from "next/server";
import { verifyTwilioSignature, parseTwilioWebhook } from "@/lib/twilio";
import { resolveTenantByPhone } from "@/lib/webhooks/tenant-resolver";
import {
  processInboundMessage,
  isMessageProcessed,
  type TwilioWebhookPayload,
} from "@/lib/webhooks/twilio-processor";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Parse form data
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Verify Twilio signature (skip only if explicitly disabled for local dev)
    const skipSignatureVerification = process.env.TWILIO_SKIP_SIGNATURE_VERIFICATION === "true";
    if (!skipSignatureVerification) {
      const signature = req.headers.get("x-twilio-signature");
      const url = process.env.TWILIO_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/twilio";

      if (!signature || !verifyTwilioSignature(signature, url, params)) {
        console.error("[Twilio] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    const webhook = parseTwilioWebhook(params) as TwilioWebhookPayload;
    const { From, To, Body, MessageSid } = webhook;

    console.log(`[Twilio] Incoming from ${From}: ${Body.slice(0, 50)}...`);

    // Quick idempotency check (before any DB calls)
    if (isMessageProcessed(MessageSid)) {
      console.log(`[Twilio] Duplicate ignored: ${MessageSid}`);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Resolve tenant (cached)
    const businessPhone = To.replace("whatsapp:", "");
    const tenant = await resolveTenantByPhone(businessPhone);

    if (!tenant) {
      console.error(`[Twilio] No tenant for: ${businessPhone}`);
      return NextResponse.json({ received: true, error: "tenant_not_found" });
    }

    // Process message (includes rate limiting, AI routing, response)
    const result = await processInboundMessage(webhook, tenant);

    const processingTime = Date.now() - startTime;
    console.log(`[Twilio] Processed in ${processingTime}ms - ${JSON.stringify(result)}`);

    // Return empty TwiML (we send response via API)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("[Twilio] Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
