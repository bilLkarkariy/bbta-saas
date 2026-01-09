/**
 * Recurring Bookings Queries
 */

import { db } from "@/lib/db";
import { addDays, addWeeks, addMonths, parseISO, format } from "date-fns";

/**
 * Create recurring booking series
 */
export async function createRecurringBooking(
  tenantId: string,
  bookingData: {
    customerPhone: string;
    customerName?: string;
    service: string;
    date: string; // Start date (YYYY-MM-DD)
    time: string; // HH:MM
    resourceId?: string;
    notes?: string;
    recurrenceRule: "weekly" | "biweekly" | "monthly";
    recurrenceEndDate: string; // End date (YYYY-MM-DD)
    status?: string;
  }
) {
  // Create parent booking
  const parentBooking = await db.booking.create({
    data: {
      tenantId,
      customerPhone: bookingData.customerPhone,
      customerName: bookingData.customerName || null,
      service: bookingData.service,
      date: bookingData.date,
      time: bookingData.time,
      resourceId: bookingData.resourceId || null,
      notes: bookingData.notes || null,
      status: bookingData.status || "confirmed",
      isRecurring: true,
      recurrenceRule: bookingData.recurrenceRule,
      recurrenceEndDate: bookingData.recurrenceEndDate,
    },
  });

  // Generate occurrences
  const occurrences = generateOccurrences(
    bookingData.date,
    bookingData.recurrenceEndDate,
    bookingData.recurrenceRule
  );

  // Create child bookings for each occurrence (skip first one, it's the parent)
  const childBookings = await Promise.all(
    occurrences.slice(1).map((occurrenceDate) =>
      db.booking.create({
        data: {
          tenantId,
          customerPhone: bookingData.customerPhone,
          customerName: bookingData.customerName || null,
          service: bookingData.service,
          date: occurrenceDate,
          time: bookingData.time,
          resourceId: bookingData.resourceId || null,
          notes: bookingData.notes || null,
          status: bookingData.status || "confirmed",
          isRecurring: true,
          recurrenceRule: bookingData.recurrenceRule,
          parentBookingId: parentBooking.id,
        },
      })
    )
  );

  return {
    parent: parentBooking,
    occurrences: childBookings,
    total: occurrences.length,
  };
}

/**
 * Generate occurrence dates based on recurrence rule
 */
function generateOccurrences(
  startDate: string,
  endDate: string,
  rule: "weekly" | "biweekly" | "monthly"
): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const occurrences: string[] = [];

  let currentDate = start;

  // Limit to 52 occurrences max to prevent infinite loops
  let count = 0;
  const maxOccurrences = 52;

  while (currentDate <= end && count < maxOccurrences) {
    occurrences.push(format(currentDate, "yyyy-MM-dd"));

    // Calculate next occurrence based on rule
    switch (rule) {
      case "weekly":
        currentDate = addWeeks(currentDate, 1);
        break;
      case "biweekly":
        currentDate = addWeeks(currentDate, 2);
        break;
      case "monthly":
        currentDate = addMonths(currentDate, 1);
        break;
    }

    count++;
  }

  return occurrences;
}

/**
 * Get all occurrences of a recurring booking
 */
export async function getRecurringBookingSeries(
  bookingId: string,
  tenantId: string
) {
  // Get the booking
  const booking = await db.booking.findFirst({
    where: { id: bookingId, tenantId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // If it's a child booking, get the parent
  const parentId = booking.parentBookingId || booking.id;

  // Get parent and all children
  const [parent, children] = await Promise.all([
    db.booking.findUnique({
      where: { id: parentId },
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
    }),
    db.booking.findMany({
      where: {
        parentBookingId: parentId,
        tenantId,
      },
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
      orderBy: { date: "asc" },
    }),
  ]);

  if (!parent) {
    throw new Error("Parent booking not found");
  }

  return {
    parent,
    occurrences: [parent, ...children],
    total: children.length + 1,
  };
}

/**
 * Update all future occurrences of a recurring booking
 */
export async function updateRecurringSeries(
  bookingId: string,
  tenantId: string,
  updates: {
    time?: string;
    service?: string;
    resourceId?: string;
    notes?: string;
    status?: string;
  }
) {
  // Get the booking
  const booking = await db.booking.findFirst({
    where: { id: bookingId, tenantId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const parentId = booking.parentBookingId || booking.id;
  const today = format(new Date(), "yyyy-MM-dd");

  // Update parent if it's in the future
  if (booking.date >= today) {
    await db.booking.update({
      where: { id: parentId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  // Update all future occurrences
  const result = await db.booking.updateMany({
    where: {
      parentBookingId: parentId,
      tenantId,
      date: { gte: today },
    },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  });

  return {
    updated: result.count,
  };
}

/**
 * Cancel all future occurrences of a recurring booking
 */
export async function cancelRecurringSeries(
  bookingId: string,
  tenantId: string
) {
  return updateRecurringSeries(bookingId, tenantId, { status: "cancelled" });
}

/**
 * Delete all future occurrences of a recurring booking
 */
export async function deleteRecurringSeries(
  bookingId: string,
  tenantId: string
) {
  // Get the booking
  const booking = await db.booking.findFirst({
    where: { id: bookingId, tenantId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const parentId = booking.parentBookingId || booking.id;
  const today = format(new Date(), "yyyy-MM-dd");

  // Delete all future occurrences (including parent if in future)
  const deleted = await db.booking.deleteMany({
    where: {
      OR: [
        { id: parentId, date: { gte: today } },
        { parentBookingId: parentId, date: { gte: today } },
      ],
      tenantId,
    },
  });

  return { deleted: deleted.count };
}

/**
 * Get recurring bookings statistics
 */
export async function getRecurringBookingsStats(tenantId: string) {
  const [totalSeries, totalOccurrences, activeSeries] = await Promise.all([
    // Count parent bookings
    db.booking.count({
      where: {
        tenantId,
        isRecurring: true,
        parentBookingId: null,
      },
    }),

    // Count all recurring bookings
    db.booking.count({
      where: {
        tenantId,
        isRecurring: true,
      },
    }),

    // Count active series (future occurrences)
    db.booking.count({
      where: {
        tenantId,
        isRecurring: true,
        parentBookingId: null,
        date: { gte: format(new Date(), "yyyy-MM-dd") },
      },
    }),
  ]);

  return {
    totalSeries,
    totalOccurrences,
    activeSeries,
    averageOccurrencesPerSeries:
      totalSeries > 0 ? Math.round(totalOccurrences / totalSeries) : 0,
  };
}
