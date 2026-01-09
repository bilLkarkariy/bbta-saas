import { getCurrentTenant } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection message
        const initialData = `data: ${JSON.stringify({ type: "connected", tenantId })}\n\n`;
        controller.enqueue(encoder.encode(initialData));

        // Poll for unread count every 30 seconds
        const intervalId = setInterval(async () => {
          try {
            const count = await getUnreadNotificationCount(tenantId);
            const data = `data: ${JSON.stringify({ type: "unread_count", count })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error("Error polling unread count:", error);
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener("abort", () => {
          clearInterval(intervalId);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in SSE stream:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}
