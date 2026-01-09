/**
 * Notification Queries
 */

import { db } from "@/lib/db";

export type NotificationType =
  | "new_booking"
  | "booking_cancelled"
  | "booking_updated"
  | "reminder_pending"
  | "no_show";

export interface CreateNotificationInput {
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      tenantId: input.tenantId,
      type: input.type,
      title: input.title,
      message: input.message,
      bookingId: input.bookingId || null,
      resourceType: input.resourceType || null,
      resourceId: input.resourceId || null,
    },
  });
}

/**
 * Get notifications for a tenant
 */
export async function getNotifications(
  tenantId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  const where: any = { tenantId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            service: true,
            date: true,
            time: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),

    db.notification.count({ where }),

    db.notification.count({
      where: { tenantId, isRead: false },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    hasMore: offset + limit < total,
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string, tenantId: string) {
  return db.notification.update({
    where: { id, tenantId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(tenantId: string) {
  return db.notification.updateMany({
    where: { tenantId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Delete old notifications (older than 30 days)
 */
export async function deleteOldNotifications(tenantId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return db.notification.deleteMany({
    where: {
      tenantId,
      createdAt: { lt: thirtyDaysAgo },
    },
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string, tenantId: string) {
  return db.notification.delete({
    where: { id, tenantId },
  });
}

/**
 * Get unread count
 */
export async function getUnreadNotificationCount(tenantId: string) {
  return db.notification.count({
    where: { tenantId, isRead: false },
  });
}
