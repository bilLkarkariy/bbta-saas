/**
 * Booking Database Queries
 */

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export interface BookingFilters {
  status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  paymentStatus?: "unpaid" | "deposit" | "paid";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface BookingStats {
  totalThisMonth: number;
  pendingCount: number;
  todayCount: number;
  noShowRate: number;
  upcomingNext7Days: number;
  // Payment stats
  totalRevenue: number;
  unpaidCount: number;
  paidCount: number;
  averageBookingValue: number;
}

export interface PaymentStats {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  depositRevenue: number;
  unpaidCount: number;
  depositCount: number;
  paidCount: number;
  averageBookingValue: number;
  currency: string;
}

/**
 * Get bookings with filters
 */
export async function getBookings(tenantId: string, filters: BookingFilters = {}) {
  const {
    status,
    paymentStatus,
    dateFrom,
    dateTo,
    search,
    limit = 50,
    offset = 0,
  } = filters;

  const where: any = { tenantId };

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  if (search) {
    // Sanitize search input to prevent SQL injection
    const sanitizedSearch = search.trim().replace(/[%_\\]/g, '\\$&');

    where.OR = [
      { customerName: { contains: sanitizedSearch, mode: "insensitive" } },
      { customerPhone: { contains: sanitizedSearch } },
    ];
  }

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: limit,
      skip: offset,
    }),
    db.booking.count({ where }),
  ]);

  return {
    bookings,
    total,
    hasMore: offset + bookings.length < total,
  };
}

/**
 * Get single booking by ID
 */
export async function getBookingById(id: string, tenantId: string) {
  const booking = await db.booking.findFirst({
    where: { id, tenantId },
    include: {
      conversation: {
        select: {
          id: true,
          customerPhone: true,
          status: true,
          messages: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              content: true,
              direction: true,
              createdAt: true,
            },
          },
        },
      },
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

  return booking;
}

/**
 * Update booking
 */
export async function updateBooking(
  id: string,
  tenantId: string,
  data: Partial<{
    status: string;
    notes: string;
    date: string;
    time: string;
    service: string;
    customerName: string;
    amount: number;
    currency: string;
    paymentStatus: string;
    paymentMethod: string;
    paidAt: Date;
  }>
) {
  const booking = await db.booking.update({
    where: { id, tenantId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return booking;
}

/**
 * Delete booking
 */
export async function deleteBooking(id: string, tenantId: string) {
  await db.booking.delete({
    where: { id, tenantId },
  });

  return { success: true };
}

/**
 * Get booking statistics
 */
export async function getBookingStats(tenantId: string): Promise<BookingStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  const [
    totalThisMonth,
    pendingCount,
    todayCount,
    upcomingNext7Days,
    completedBookings,
    noShowBookings,
    unpaidCount,
    paidCount,
    bookingsWithAmount,
  ] = await Promise.all([
    // Total this month
    db.booking.count({
      where: {
        tenantId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // Pending confirmations
    db.booking.count({
      where: {
        tenantId,
        status: "pending",
      },
    }),

    // Today's bookings
    db.booking.count({
      where: {
        tenantId,
        date: {
          gte: todayStart.toISOString().split("T")[0],
          lte: todayEnd.toISOString().split("T")[0],
        },
      },
    }),

    // Upcoming next 7 days
    db.booking.count({
      where: {
        tenantId,
        date: {
          gte: now.toISOString().split("T")[0],
          lte: next7Days.toISOString().split("T")[0],
        },
        status: { in: ["pending", "confirmed"] },
      },
    }),

    // Completed bookings (for no-show rate)
    db.booking.count({
      where: {
        tenantId,
        status: "completed",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // No-show bookings
    db.booking.count({
      where: {
        tenantId,
        status: "no_show",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // Unpaid bookings
    db.booking.count({
      where: {
        tenantId,
        paymentStatus: "unpaid",
        status: { notIn: ["cancelled"] },
      },
    }),

    // Paid bookings
    db.booking.count({
      where: {
        tenantId,
        paymentStatus: "paid",
      },
    }),

    // Get all bookings with amounts for revenue calculation
    db.booking.findMany({
      where: {
        tenantId,
        amount: { not: null },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: {
        amount: true,
        paymentStatus: true,
      },
    }),
  ]);

  // Calculate no-show rate
  const totalFinished = completedBookings + noShowBookings;
  const noShowRate = totalFinished > 0 ? (noShowBookings / totalFinished) * 100 : 0;

  // Calculate revenue metrics
  const totalRevenue = bookingsWithAmount.reduce((sum, booking) => {
    if (booking.amount && booking.paymentStatus === "paid") {
      return sum + Number(booking.amount);
    }
    return sum;
  }, 0);

  const averageBookingValue = bookingsWithAmount.length > 0
    ? bookingsWithAmount.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) / bookingsWithAmount.length
    : 0;

  return {
    totalThisMonth,
    pendingCount,
    todayCount,
    noShowRate: Math.round(noShowRate * 10) / 10,
    upcomingNext7Days,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    unpaidCount,
    paidCount,
    averageBookingValue: Math.round(averageBookingValue * 100) / 100,
  };
}

/**
 * Get payment statistics
 */
export async function getPaymentStats(tenantId: string): Promise<PaymentStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    unpaidCount,
    depositCount,
    paidCount,
    bookingsWithAmount,
  ] = await Promise.all([
    // Unpaid bookings
    db.booking.count({
      where: {
        tenantId,
        paymentStatus: "unpaid",
        status: { notIn: ["cancelled"] },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // Deposit bookings
    db.booking.count({
      where: {
        tenantId,
        paymentStatus: "deposit",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // Paid bookings
    db.booking.count({
      where: {
        tenantId,
        paymentStatus: "paid",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // Get all bookings with amounts
    db.booking.findMany({
      where: {
        tenantId,
        amount: { not: null },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: {
        amount: true,
        paymentStatus: true,
        currency: true,
      },
    }),
  ]);

  // Calculate revenue by payment status
  const paidRevenue = bookingsWithAmount.reduce((sum, booking) => {
    if (booking.paymentStatus === "paid" && booking.amount) {
      return sum + Number(booking.amount);
    }
    return sum;
  }, 0);

  const depositRevenue = bookingsWithAmount.reduce((sum, booking) => {
    if (booking.paymentStatus === "deposit" && booking.amount) {
      return sum + Number(booking.amount);
    }
    return sum;
  }, 0);

  const pendingRevenue = bookingsWithAmount.reduce((sum, booking) => {
    if (booking.paymentStatus === "unpaid" && booking.amount) {
      return sum + Number(booking.amount);
    }
    return sum;
  }, 0);

  const totalRevenue = paidRevenue + depositRevenue + pendingRevenue;

  const averageBookingValue = bookingsWithAmount.length > 0
    ? bookingsWithAmount.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) / bookingsWithAmount.length
    : 0;

  // Get most common currency
  const currency = bookingsWithAmount.find((b) => b.currency)?.currency || "EUR";

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    paidRevenue: Math.round(paidRevenue * 100) / 100,
    pendingRevenue: Math.round(pendingRevenue * 100) / 100,
    depositRevenue: Math.round(depositRevenue * 100) / 100,
    unpaidCount,
    depositCount,
    paidCount,
    averageBookingValue: Math.round(averageBookingValue * 100) / 100,
    currency,
  };
}

/**
 * Get customer history by phone number
 */
export async function getCustomerHistory(tenantId: string, customerPhone: string) {
  // Get all bookings for this customer
  const bookings = await db.booking.findMany({
    where: {
      tenantId,
      customerPhone,
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
    orderBy: {
      date: "desc",
    },
  });

  if (bookings.length === 0) {
    return {
      customerPhone,
      customerName: null,
      bookings: [],
      stats: {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        noShowCount: 0,
        noShowRate: 0,
        favoriteService: null,
        firstBookingDate: null,
      },
    };
  }

  // Calculate stats
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
  const noShowCount = bookings.filter((b) => b.status === "no_show").length;
  const finishedBookings = completedBookings + noShowCount;
  const noShowRate =
    finishedBookings > 0 ? (noShowCount / finishedBookings) * 100 : 0;

  // Find most frequent service
  const serviceCounts: Record<string, number> = {};
  bookings.forEach((booking) => {
    serviceCounts[booking.service] = (serviceCounts[booking.service] || 0) + 1;
  });
  const favoriteService =
    Object.keys(serviceCounts).length > 0
      ? Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // First booking date
  const firstBookingDate = bookings[bookings.length - 1].createdAt;

  // Get customer name from most recent booking
  const customerName = bookings.find((b) => b.customerName)?.customerName || null;

  return {
    customerPhone,
    customerName,
    bookings,
    stats: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowCount,
      noShowRate: Math.round(noShowRate * 10) / 10,
      favoriteService,
      firstBookingDate,
    },
  };
}
