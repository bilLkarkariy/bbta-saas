import { db } from "@/lib/db";

export interface Availability {
  id: string;
  tenantId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  resourceId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockedSlot {
  id: string;
  tenantId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  resourceId: string | null;
  createdAt: Date;
}

export interface CreateAvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  resourceId?: string;
}

export interface CreateBlockedSlotInput {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  resourceId?: string;
}

/**
 * Get all availabilities for a tenant
 */
export async function getAvailabilities(tenantId: string, resourceId?: string) {
  return db.availability.findMany({
    where: {
      tenantId,
      ...(resourceId && { resourceId }),
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
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });
}

/**
 * Create an availability rule
 */
export async function createAvailability(
  tenantId: string,
  data: CreateAvailabilityInput
) {
  return db.availability.create({
    data: {
      tenantId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      resourceId: data.resourceId || null,
      isActive: true,
    },
  });
}

/**
 * Update an availability rule
 */
export async function updateAvailability(
  id: string,
  tenantId: string,
  data: Partial<CreateAvailabilityInput> & { isActive?: boolean }
) {
  return db.availability.update({
    where: { id },
    data: {
      ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
      ...(data.startTime && { startTime: data.startTime }),
      ...(data.endTime && { endTime: data.endTime }),
      ...(data.resourceId !== undefined && { resourceId: data.resourceId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

/**
 * Delete an availability rule
 */
export async function deleteAvailability(id: string, tenantId: string) {
  return db.availability.delete({
    where: { id },
  });
}

/**
 * Get all blocked slots for a tenant
 */
export async function getBlockedSlots(
  tenantId: string,
  dateFrom?: string,
  dateTo?: string,
  resourceId?: string
) {
  const where: any = { tenantId };

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  if (resourceId) {
    where.resourceId = resourceId;
  }

  return db.blockedSlot.findMany({
    where,
    include: {
      resource: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: [
      { date: "asc" },
      { startTime: "asc" },
    ],
  });
}

/**
 * Create a blocked slot
 */
export async function createBlockedSlot(
  tenantId: string,
  data: CreateBlockedSlotInput
) {
  return db.blockedSlot.create({
    data: {
      tenantId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason || null,
      resourceId: data.resourceId || null,
    },
  });
}

/**
 * Delete a blocked slot
 */
export async function deleteBlockedSlot(id: string, tenantId: string) {
  return db.blockedSlot.delete({
    where: { id },
  });
}

/**
 * Get available time slots for a given date and resource
 */
export async function getAvailableSlots(
  tenantId: string,
  date: string,
  resourceId?: string
) {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0=Sunday, 6=Saturday

  // Get availability rules for this day
  const availabilities = await db.availability.findMany({
    where: {
      tenantId,
      dayOfWeek,
      isActive: true,
      ...(resourceId ? { resourceId } : { resourceId: null }),
    },
  });

  if (availabilities.length === 0) {
    return {
      available: false,
      slots: [],
      message: "No working hours defined for this day",
    };
  }

  // Get blocked slots for this date
  const blockedSlots = await db.blockedSlot.findMany({
    where: {
      tenantId,
      date,
      ...(resourceId && { resourceId }),
    },
  });

  // Get existing bookings for this date
  const bookings = await db.booking.findMany({
    where: {
      tenantId,
      date,
      status: {
        in: ["pending", "confirmed"],
      },
      ...(resourceId && { resourceId }),
    },
    select: {
      time: true,
    },
  });

  // Generate time slots (30-minute intervals)
  const slots: { time: string; available: boolean; reason?: string }[] = [];

  for (const availability of availabilities) {
    const startHour = parseInt(availability.startTime.split(":")[0]);
    const startMinute = parseInt(availability.startTime.split(":")[1]);
    const endHour = parseInt(availability.endTime.split(":")[0]);
    const endMinute = parseInt(availability.endTime.split(":")[1]);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

      // Check if slot is blocked
      const isBlocked = blockedSlots.some((blocked) => {
        const blockedStart = blocked.startTime;
        const blockedEnd = blocked.endTime;
        return timeString >= blockedStart && timeString < blockedEnd;
      });

      // Check if slot is booked
      const isBooked = bookings.some((booking) => booking.time === timeString);

      slots.push({
        time: timeString,
        available: !isBlocked && !isBooked,
        reason: isBlocked ? "Blocked" : isBooked ? "Booked" : undefined,
      });

      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }
  }

  return {
    available: true,
    slots,
    message: slots.filter((s) => s.available).length > 0
      ? `${slots.filter((s) => s.available).length} slots available`
      : "No slots available for this date",
  };
}
