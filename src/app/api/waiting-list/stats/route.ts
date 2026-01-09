import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getWaitingListStats } from "@/lib/queries/waiting-list";

/**
 * GET /api/waiting-list/stats
 * Get waiting list statistics
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();

    const stats = await getWaitingListStats(tenantId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching waiting list stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch waiting list stats" },
      { status: 500 }
    );
  }
}
