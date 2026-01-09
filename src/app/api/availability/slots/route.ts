import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getAvailableSlots } from "@/lib/queries/availability";

/**
 * GET /api/availability/slots?date=YYYY-MM-DD&resourceId=xxx
 * Get available time slots for a specific date and optional resource
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const resourceId = searchParams.get("resourceId") || undefined;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "date parameter is required in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const result = await getAvailableSlots(tenantId, date, resourceId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
