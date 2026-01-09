import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { createRecurringBooking, getRecurringBookingsStats } from "@/lib/queries/recurring-bookings";

/**
 * POST /api/bookings/recurring
 * Create a recurring booking series
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const body = await request.json();

    // Validate required fields
    const { customerPhone, service, date, time, recurrenceRule, recurrenceEndDate } = body;
    if (!customerPhone || !service || !date || !time || !recurrenceRule || !recurrenceEndDate) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: customerPhone, service, date, time, recurrenceRule, recurrenceEndDate",
        },
        { status: 400 }
      );
    }

    // Validate recurrence rule
    if (!["weekly", "biweekly", "monthly"].includes(recurrenceRule)) {
      return NextResponse.json(
        { error: "Invalid recurrence rule. Must be 'weekly', 'biweekly', or 'monthly'" },
        { status: 400 }
      );
    }

    // Validate dates
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{4}-\d{2}-\d{2}$/.test(recurrenceEndDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected HH:MM" },
        { status: 400 }
      );
    }

    // Validate end date is after start date
    if (new Date(recurrenceEndDate) <= new Date(date)) {
      return NextResponse.json(
        { error: "Recurrence end date must be after start date" },
        { status: 400 }
      );
    }

    // Create recurring booking
    const result = await createRecurringBooking(tenantId, {
      customerPhone,
      customerName: body.customerName,
      service,
      date,
      time,
      resourceId: body.resourceId,
      notes: body.notes,
      recurrenceRule,
      recurrenceEndDate,
      status: body.status || "confirmed",
    });

    return NextResponse.json(
      {
        success: true,
        parent: result.parent,
        occurrencesCreated: result.total,
        message: `Created ${result.total} bookings in the series`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating recurring booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create recurring booking" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/recurring/stats
 * Get recurring bookings statistics
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const stats = await getRecurringBookingsStats(tenantId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching recurring stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring bookings stats" },
      { status: 500 }
    );
  }
}
