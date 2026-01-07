import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyTwilioSignature,
  parseTwilioWebhook,
  sendWhatsAppMessage,
} from "@/lib/twilio";
import { routeIntent } from "@/lib/ai/router";
import { generateResponse } from "@/lib/ai/responder";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Parse form data
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Verify Twilio signature in production
    if (process.env.NODE_ENV === "production") {
      const signature = req.headers.get("x-twilio-signature");
      const url = process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/twilio";

      if (!signature || !verifyTwilioSignature(signature, url, params)) {
        console.error("Invalid Twilio signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    const webhook = parseTwilioWebhook(params);
    const { From, To, Body, MessageSid, ProfileName } = webhook;

    console.log(`Incoming message from ${From}: ${Body}`);

    // Extract phone number (remove whatsapp: prefix)
    const customerPhone = From.replace("whatsapp:", "");
    const businessPhone = To.replace("whatsapp:", "");

    // Find tenant by WhatsApp number
    const tenant = await db.tenant.findFirst({
      where: { whatsappNumber: businessPhone },
      include: {
        faqs: true,
      },
    });

    if (!tenant) {
      console.error(`No tenant found for WhatsApp number: ${businessPhone}`);
      // Return 200 to acknowledge receipt but don't process
      return NextResponse.json({ received: true, error: "tenant_not_found" });
    }

    // Find or create conversation
    let conversation = await db.conversation.findFirst({
      where: {
        tenantId: tenant.id,
        customerPhone,
        status: { not: "resolved" },
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          tenantId: tenant.id,
          customerPhone,
          customerName: ProfileName || null,
          status: "active",
        },
        include: {
          messages: true,
        },
      });
    }

    // Save inbound message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        content: Body,
        twilioSid: MessageSid,
        status: "delivered",
      },
    });

    // Build conversation history for AI
    const conversationHistory = conversation.messages
      .slice()
      .reverse()
      .map((m) => ({
        role: (m.direction === "inbound" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.content,
      }));

    // Route intent using TIER_1 (fast)
    const routerResult = await routeIntent({
      message: Body,
      customerPhone,
      businessType: tenant.businessType,
      faqs: tenant.faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        category: f.category,
      })),
      conversationHistory,
    });

    console.log(`Intent: ${routerResult.intent} (${routerResult.confidence})`);

    // Generate response
    const responderResult = await generateResponse({
      routerResult,
      message: Body,
      customerName: ProfileName || undefined,
      businessName: tenant.name,
      businessType: tenant.businessType,
      faqs: tenant.faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        category: f.category,
      })),
      conversationHistory,
    });

    // Send response via Twilio
    let twilioSid = "";
    try {
      const result = await sendWhatsAppMessage({
        to: customerPhone,
        body: responderResult.response,
        from: businessPhone,
      });
      twilioSid = result.sid;
    } catch (sendError) {
      console.error("Failed to send WhatsApp message:", sendError);
      // Continue to save the message even if send fails
    }

    // Save outbound message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        direction: "outbound",
        content: responderResult.response,
        twilioSid: twilioSid || undefined,
        status: twilioSid ? "sent" : "failed",
        metadata: {
          intent: routerResult.intent,
          confidence: routerResult.confidence,
          model: responderResult.model_used,
        },
      },
    });

    // Update conversation status if escalated
    if (responderResult.should_escalate) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { status: "escalated" },
      });
    }

    // Log AI usage for analytics (aggregate by month/model/tier)
    const processingTime = Date.now() - startTime;
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-01"
    const tier = `TIER_${routerResult.tier_needed}`;
    const inputTokens = Math.ceil(Body.length / 4);
    const outputTokens = Math.ceil(responderResult.response.length / 4);
    const cost = estimateCost(responderResult.model_used);

    await db.aIUsage.upsert({
      where: {
        tenantId_month_model_tier: {
          tenantId: tenant.id,
          month: currentMonth,
          model: responderResult.model_used,
          tier,
        },
      },
      create: {
        tenantId: tenant.id,
        month: currentMonth,
        model: responderResult.model_used,
        tier,
        inputTokens,
        outputTokens,
        requestCount: 1,
        costUsd: cost,
      },
      update: {
        inputTokens: { increment: inputTokens },
        outputTokens: { increment: outputTokens },
        requestCount: { increment: 1 },
        costUsd: { increment: cost },
      },
    });

    console.log(`Processed in ${processingTime}ms`);

    // Return TwiML response (empty - we're sending via API)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function estimateCost(model: string): number {
  // Rough cost estimates per 1K tokens (input + output averaged)
  const costs: Record<string, number> = {
    "x-ai/grok-4.1-fast": 0.0001,
    "anthropic/claude-sonnet-4.5": 0.003,
    "anthropic/claude-opus-4.5": 0.015,
    fallback: 0,
  };
  return costs[model] || 0.001;
}
