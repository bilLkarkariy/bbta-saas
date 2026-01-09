import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getBookingStats } from "@/lib/queries/bookings";

/**
 * GET /api/bookings/stats
 * Get booking statistics for the current tenant
 */
export async function GET() {
  try {
    const { tenantId } = await getCurrentTenant();

    const stats = await getBookingStats(tenantId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking statistics" },
      { status: 500 }
    );
  }
}
