import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTwilioSignature } from "@/lib/twilio";

// Twilio message status values
type TwilioMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "undelivered";

// Map Twilio status to our internal status
const STATUS_MAP: Record<TwilioMessageStatus, string> = {
  queued: "queued",
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
  undelivered: "failed",
};

export async function POST(req: NextRequest) {
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
      const url = process.env.TWILIO_WEBHOOK_URL_STATUS || process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/twilio/status";

      if (!signature || !verifyTwilioSignature(signature, url, params)) {
        console.error("[Twilio Status] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus as TwilioMessageStatus;
    const errorCode = params.ErrorCode || null;
    const errorMessage = params.ErrorMessage || null;

    if (!messageSid || !messageStatus) {
      console.error("[Twilio Status] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const status = STATUS_MAP[messageStatus] || messageStatus;

    console.log(`[Twilio Status] ${messageSid}: ${messageStatus} -> ${status}`);

    // Update message status in database
    const updateResult = await db.message.updateMany({
      where: { twilioSid: messageSid },
      data: {
        status,
        ...(errorCode && {
          metadata: {
            errorCode,
            errorMessage,
          },
        }),
      },
    });

    if (updateResult.count === 0) {
      console.warn(`[Twilio Status] Message not found: ${messageSid}`);
    }

    // If message failed, we might want to trigger alerts or retry logic
    if (status === "failed" && errorCode) {
      console.error(
        `[Twilio Status] Message failed: ${messageSid}, error: ${errorCode} - ${errorMessage}`
      );
      // Future: Add alerting/retry logic here
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Twilio Status] Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
