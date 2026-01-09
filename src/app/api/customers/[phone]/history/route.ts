import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getCustomerHistory } from "@/lib/queries/bookings";

interface RouteParams {
  params: Promise<{ phone: string }>;
}

/**
 * GET /api/customers/[phone]/history
 * Get customer booking history and stats
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { phone } = await params;

    const history = await getCustomerHistory(tenantId, decodeURIComponent(phone));

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Error fetching customer history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer history" },
      { status: 500 }
    );
  }
}
