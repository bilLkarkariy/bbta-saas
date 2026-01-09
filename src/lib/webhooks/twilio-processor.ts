import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { routeIntent } from "@/lib/ai/router";
import { generateResponse } from "@/lib/ai/responder";
import { executeFlow, hasActiveFlow } from "@/lib/ai/flows/executor";

// ============ IDEMPOTENCY CHECK ============
// TODO: Replace with Redis for production multi-instance deployments
// In-memory Map will not work correctly in serverless environments (Vercel)
// Each function instance has its own memory, causing duplicate processing
// Recommended: Use Upstash Redis - https://upstash.com/docs/redis/quickstarts/nextjs
//
// Example Redis implementation:
// import { Redis } from '@upstash/redis';
// const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL!, token: process.env.UPSTASH_REDIS_TOKEN! });
// export async function isMessageProcessed(sid: string) { return (await redis.exists(`msg:${sid}`)) === 1; }
// export async function markMessageProcessed(sid: string) { await redis.set(`msg:${sid}`, '1', { ex: 3600 }); }

const processedMessages = new Map<string, { timestamp: number }>();
const MESSAGE_DEDUP_TTL = 60 * 60 * 1000; // 1 hour

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [sid, data] of processedMessages.entries()) {
    if (now - data.timestamp > MESSAGE_DEDUP_TTL) {
      processedMessages.delete(sid);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export function isMessageProcessed(messageSid: string): boolean {
  return processedMessages.has(messageSid);
}

export function markMessageProcessed(messageSid: string): void {
  processedMessages.set(messageSid, { timestamp: Date.now() });
}

// ============ RATE LIMITING ============
// TODO: Replace with Redis for production - same issue as idempotency check above
// Rate limiting per phone number to prevent abuse
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"); // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "10"); // Max 10 messages per minute per phone

export function checkRateLimit(phone: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ============ MESSAGE PROCESSING ============
export interface TwilioWebhookPayload {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  ProfileName?: string;
  NumMedia?: string;
  MediaUrl0?: string;
}

export interface TenantWithFAQs {
  id: string;
  name: string;
  businessType: string;
  timezone: string;
  whatsappNumber: string | null;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string | null;
    keywords: string[];
  }>;
}

export interface ProcessMessageResult {
  success: boolean;
  duplicate?: boolean;
  rateLimited?: boolean;
  messageId?: string;
  error?: string;
}

export async function processInboundMessage(
  webhook: TwilioWebhookPayload,
  tenant: TenantWithFAQs
): Promise<ProcessMessageResult> {
  const { MessageSid, From, To, Body, ProfileName } = webhook;
  const customerPhone = From.replace("whatsapp:", "");
  const businessPhone = To.replace("whatsapp:", "");

  // 1. Check idempotency
  if (isMessageProcessed(MessageSid)) {
    console.log(`[Twilio] Duplicate message ignored: ${MessageSid}`);
    return { success: true, duplicate: true };
  }

  // 2. Check rate limit
  const rateLimit = checkRateLimit(customerPhone);
  if (!rateLimit.allowed) {
    console.warn(`[Twilio] Rate limit exceeded for: ${customerPhone}`);

    // Send rate limit message to user (don't fail silently)
    try {
      await sendWhatsAppMessage({
        to: customerPhone,
        body: "Vous envoyez des messages trop rapidement. Veuillez patienter quelques instants avant de réessayer.",
        from: businessPhone,
      });
    } catch (rateLimitMsgError) {
      console.error("[Twilio] Failed to send rate limit message:", rateLimitMsgError);
    }

    return { success: false, rateLimited: true };
  }

  // 3. Mark as processing (prevents parallel processing of same message)
  markMessageProcessed(MessageSid);

  try {
    // 4. Find or create conversation
    const conversation = await db.conversation.upsert({
      where: {
        tenantId_customerPhone: {
          tenantId: tenant.id,
          customerPhone,
        },
      },
      create: {
        tenantId: tenant.id,
        customerPhone,
        customerName: ProfileName || null,
        status: "active",
      },
      update: {
        lastMessageAt: new Date(),
        // Update name if we have a new one
        ...(ProfileName && { customerName: ProfileName }),
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    // 5. Save inbound message
    const inboundMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        content: Body,
        twilioSid: MessageSid,
        status: "received",
      },
    });

    // 6. Build conversation history
    const conversationHistory = conversation.messages
      .slice()
      .reverse()
      .map((m) => ({
        role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

    // 7. Route intent
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

    console.log(`[AI] Intent: ${routerResult.intent} (${routerResult.confidence})`);

    // 8. Check if we should use structured flow or free-form AI response
    const hasFlow = await hasActiveFlow(conversation.id);
    const shouldUseFlow = hasFlow || routerResult.suggested_flow;

    let responseText = "";
    let modelUsed = "";
    let shouldEscalate = false;

    if (shouldUseFlow) {
      // Use structured booking/lead-capture flow
      console.log(`[Flow] ${hasFlow ? "Continuing" : "Starting"} flow: ${routerResult.suggested_flow || "existing"}`);

      const flowResult = await executeFlow(
        conversation.id,
        Body,
        routerResult.suggested_flow
      );

      if (flowResult) {
        responseText = flowResult.response;
        modelUsed = "flow";

        if (flowResult.flowComplete) {
          console.log("[Flow] Flow completed successfully");
        } else if (flowResult.flowCancelled) {
          console.log("[Flow] Flow cancelled by user or error");
          shouldEscalate = true;
        }
      } else {
        // Flow execution failed, fallback to AI response
        console.warn("[Flow] Flow execution returned null, falling back to AI response");
        const fallback = await generateResponse({
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
        responseText = fallback.response;
        modelUsed = fallback.model_used;
        shouldEscalate = fallback.should_escalate;
      }
    } else {
      // Use free-form AI response
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
      responseText = responderResult.response;
      modelUsed = responderResult.model_used;
      shouldEscalate = responderResult.should_escalate;
    }

    // 9. Send via Twilio
    let twilioSid = "";
    let sendStatus = "failed";
    try {
      const result = await sendWhatsAppMessage({
        to: customerPhone,
        body: responseText,
        from: businessPhone,
      });
      twilioSid = result.sid;
      sendStatus = "sent";
    } catch (sendError) {
      console.error("[Twilio] Send failed:", sendError);
    }

    // 10. Save outbound message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        direction: "outbound",
        content: responseText,
        twilioSid: twilioSid || undefined,
        status: sendStatus,
        intent: routerResult.intent,
        confidence: routerResult.confidence,
        tierUsed: `TIER_${routerResult.tier_needed}`,
        metadata: {
          model: modelUsed,
          usedFlow: shouldUseFlow,
        },
      },
    });

    // 11. Update conversation if escalated
    if (shouldEscalate) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { status: "escalated" },
      });
    }

    // 12. Track AI usage (only if not using flow)
    if (!shouldUseFlow) {
      await trackAIUsage(tenant.id, routerResult, { model_used: modelUsed, response: responseText }, Body);
    }

    return { success: true, messageId: inboundMessage.id };
  } catch (error) {
    console.error("[Twilio] Processing error:", error);
    return { success: false, error: String(error) };
  }
}

// ============ AI USAGE TRACKING ============
async function trackAIUsage(
  tenantId: string,
  routerResult: { tier_needed: number },
  responderResult: { model_used: string; response: string },
  inputMessage: string
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const tier = `TIER_${routerResult.tier_needed}`;
  const inputTokens = Math.ceil(inputMessage.length / 4);
  const outputTokens = Math.ceil(responderResult.response.length / 4);
  const cost = estimateCost(responderResult.model_used);

  await db.aIUsage.upsert({
    where: {
      tenantId_month_model_tier: {
        tenantId,
        month: currentMonth,
        model: responderResult.model_used,
        tier,
      },
    },
    create: {
      tenantId,
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
}

function estimateCost(model: string): number {
  const costs: Record<string, number> = {
    "x-ai/grok-4.1-fast": 0.0001,
    "anthropic/claude-sonnet-4.5": 0.003,
    "anthropic/claude-opus-4.5": 0.015,
  };
  return costs[model] || 0.001;
}
