import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  markNotificationAsRead,
  deleteNotification,
} from "@/lib/queries/notifications";

/**
 * PATCH /api/notifications/[id]
 * Mark a notification as read
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    const notification = await markNotificationAsRead(id, tenantId);

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    await deleteNotification(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}
