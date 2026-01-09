import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { convertToBooking } from "@/lib/queries/waiting-list";

/**
 * POST /api/waiting-list/[id]/convert
 * Convert waiting list entry to booking
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    const { date, time } = body;
    if (!date || !time) {
      return NextResponse.json(
        { error: "Missing required fields: date, time" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected HH:MM" },
        { status: 400 }
      );
    }

    // Convert to booking
    const result = await convertToBooking(id, tenantId, {
      date,
      time,
      resourceId: body.resourceId,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      entry: result.entry,
      message: "Successfully converted to booking",
    });
  } catch (error: any) {
    console.error("Error converting to booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert to booking" },
      { status: 500 }
    );
  }
}
