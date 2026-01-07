import { NextRequest } from "next/server";
import { getCurrentTenant } from "@/lib/auth";

// ============ IN-MEMORY SSE (SERVERLESS LIMITATION) ============
// TODO: Replace with Redis pub/sub for production multi-instance deployments
// In-memory Map will not work correctly in serverless environments (Vercel)
// Each function instance has its own memory, causing missed events across instances
// Recommended: Use Upstash Redis pub/sub - https://upstash.com/docs/redis/quickstarts/nextjs
//
// Example Redis implementation:
// import { Redis } from '@upstash/redis';
// const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL! });
// Use redis.subscribe() for receiving events and redis.publish() for emitting

type EventCallback = (data: RealtimeEvent) => void;
const subscribers = new Map<string, Set<EventCallback>>();

// DoS protection: limit subscribers per tenant
const MAX_SUBSCRIBERS_PER_TENANT = 50;

export interface RealtimeEvent {
  type:
    | "connected"
    | "heartbeat"
    | "new_message"
    | "status_change"
    | "conversation_update"
    | "typing_start"
    | "typing_stop";
  data?: unknown;
}

/**
 * Emit an event to all subscribers of a tenant
 */
export function emitToTenant(tenantId: string, event: RealtimeEvent): void {
  const tenantSubs = subscribers.get(tenantId);
  if (tenantSubs) {
    tenantSubs.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("[SSE] Error emitting to subscriber:", error);
      }
    });
  }
}

/**
 * Emit an event to a specific conversation's subscribers
 */
export function emitToConversation(
  tenantId: string,
  conversationId: string,
  event: RealtimeEvent
): void {
  // For now, emit to all tenant subscribers
  // In production, filter by conversation subscription
  emitToTenant(tenantId, event);
}

/**
 * Get current subscriber count for a tenant (useful for debugging)
 */
export function getSubscriberCount(tenantId: string): number {
  return subscribers.get(tenantId)?.size || 0;
}

/**
 * SSE endpoint for real-time conversation updates
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await getCurrentTenant();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // DoS protection: check subscriber limit
        const currentCount = subscribers.get(tenantId)?.size || 0;
        if (currentCount >= MAX_SUBSCRIBERS_PER_TENANT) {
          console.warn(`[SSE] Subscriber limit reached for tenant ${tenantId}`);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", data: { message: "Too many connections" } })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Callback for this client
        const callback: EventCallback = (event) => {
          try {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error("[SSE] Error sending event:", error);
          }
        };

        // Subscribe
        if (!subscribers.has(tenantId)) {
          subscribers.set(tenantId, new Set());
        }
        subscribers.get(tenantId)!.add(callback);

        console.log(
          `[SSE] Client connected for tenant ${tenantId}. Total: ${getSubscriberCount(tenantId)}`
        );

        // Send initial connected event
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "connected", data: { timestamp: new Date().toISOString() } })}\n\n`
            )
          );
        } catch (error) {
          console.error("[SSE] Error sending connected event:", error);
        }

        // Heartbeat every 15 seconds (more aggressive for serverless environments)
        const heartbeat = setInterval(() => {
          try {
            // Use SSE comment format for heartbeat (lighter weight)
            controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
          } catch {
            // Client disconnected
            clearInterval(heartbeat);
            subscribers.get(tenantId)?.delete(callback);
          }
        }, 15000);

        // Cleanup on abort
        req.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          subscribers.get(tenantId)?.delete(callback);

          console.log(
            `[SSE] Client disconnected for tenant ${tenantId}. Remaining: ${getSubscriberCount(tenantId)}`
          );

          // Clean up empty tenant subscriptions
          if (getSubscriberCount(tenantId) === 0) {
            subscribers.delete(tenantId);
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("[SSE] Authentication error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}
