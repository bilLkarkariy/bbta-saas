/**
 * Waiting List Database Queries
 */

import { db } from "@/lib/db";

export interface WaitingListFilters {
  status?: "waiting" | "notified" | "converted" | "cancelled";
  desiredDate?: string;
  resourceId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get waiting list entries with filters
 */
export async function getWaitingList(
  tenantId: string,
  filters: WaitingListFilters = {}
) {
  const {
    status,
    desiredDate,
    resourceId,
    search,
    limit = 50,
    offset = 0,
  } = filters;

  const where: any = { tenantId };

  if (status) {
    where.status = status;
  }

  if (desiredDate) {
    where.desiredDate = desiredDate;
  }

  if (resourceId) {
    where.resourceId = resourceId;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
      { service: { contains: search, mode: "insensitive" } },
    ];
  }

  const [entries, total] = await Promise.all([
    db.waitingList.findMany({
      where,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      take: limit,
      skip: offset,
    }),
    db.waitingList.count({ where }),
  ]);

  return {
    entries,
    total,
    hasMore: offset + entries.length < total,
  };
}

/**
 * Get single waiting list entry by ID
 */
export async function getWaitingListById(id: string, tenantId: string) {
  const entry = await db.waitingList.findFirst({
    where: { id, tenantId },
    include: {
      resource: {
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
        },
      },
    },
  });

  return entry;
}

/**
 * Create waiting list entry
 */
export async function createWaitingListEntry(
  tenantId: string,
  data: {
    customerPhone: string;
    customerName?: string;
    service: string;
    desiredDate: string;
    desiredTime?: string;
    resourceId?: string;
    notes?: string;
    priority?: number;
  }
) {
  const entry = await db.waitingList.create({
    data: {
      tenantId,
      customerPhone: data.customerPhone,
      customerName: data.customerName || null,
      service: data.service,
      desiredDate: data.desiredDate,
      desiredTime: data.desiredTime || null,
      resourceId: data.resourceId || null,
      notes: data.notes || null,
      priority: data.priority || 0,
      status: "waiting",
    },
    include: {
      resource: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  return entry;
}

/**
 * Update waiting list entry
 */
export async function updateWaitingListEntry(
  id: string,
  tenantId: string,
  data: Partial<{
    status: string;
    priority: number;
    notes: string;
    desiredDate: string;
    desiredTime: string;
    resourceId: string;
  }>
) {
  const entry = await db.waitingList.update({
    where: { id, tenantId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return entry;
}

/**
 * Mark as notified
 */
export async function markAsNotified(id: string, tenantId: string) {
  const entry = await db.waitingList.update({
    where: { id, tenantId },
    data: {
      status: "notified",
      notifiedAt: new Date(),
      notificationCount: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  return entry;
}

/**
 * Convert to booking
 */
export async function convertToBooking(
  id: string,
  tenantId: string,
  bookingData: {
    date: string;
    time: string;
    resourceId?: string;
  }
) {
  // Get waiting list entry
  const entry = await getWaitingListById(id, tenantId);
  if (!entry) {
    throw new Error("Waiting list entry not found");
  }

  // Create booking
  const booking = await db.booking.create({
    data: {
      tenantId,
      customerPhone: entry.customerPhone,
      customerName: entry.customerName,
      service: entry.service,
      date: bookingData.date,
      time: bookingData.time,
      resourceId: bookingData.resourceId || entry.resourceId,
      status: "confirmed",
      notes: entry.notes,
    },
  });

  // Mark waiting list entry as converted
  await db.waitingList.update({
    where: { id, tenantId },
    data: {
      status: "converted",
      updatedAt: new Date(),
    },
  });

  return { booking, entry };
}

/**
 * Delete waiting list entry
 */
export async function deleteWaitingListEntry(id: string, tenantId: string) {
  await db.waitingList.delete({
    where: { id, tenantId },
  });

  return { success: true };
}

/**
 * Get waiting list statistics
 */
export async function getWaitingListStats(tenantId: string) {
  const [
    totalWaiting,
    notifiedCount,
    convertedThisMonth,
    byDate,
  ] = await Promise.all([
    // Total waiting
    db.waitingList.count({
      where: {
        tenantId,
        status: "waiting",
      },
    }),

    // Recently notified (last 7 days)
    db.waitingList.count({
      where: {
        tenantId,
        status: "notified",
        notifiedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Converted this month
    db.waitingList.count({
      where: {
        tenantId,
        status: "converted",
        updatedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    // Group by desired date
    db.waitingList.groupBy({
      by: ["desiredDate"],
      where: {
        tenantId,
        status: { in: ["waiting", "notified"] },
      },
      _count: true,
      orderBy: {
        desiredDate: "asc",
      },
      take: 10,
    }),
  ]);

  return {
    totalWaiting,
    notifiedCount,
    convertedThisMonth,
    byDate: byDate.map((item) => ({
      date: item.desiredDate,
      count: item._count,
    })),
  };
}
