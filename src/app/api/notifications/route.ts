import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  getNotifications,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "@/lib/queries/notifications";

/**
 * GET /api/notifications
 * Get notifications for the current tenant
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getNotifications(tenantId, {
      limit,
      offset,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark all notifications as read
 */
export async function PATCH(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();

    await markAllNotificationsAsRead(tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
