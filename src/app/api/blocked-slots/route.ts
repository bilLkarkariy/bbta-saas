import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getBlockedSlots, createBlockedSlot } from "@/lib/queries/availability";

/**
 * GET /api/blocked-slots
 * Get all blocked slots
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const resourceId = searchParams.get("resourceId") || undefined;

    const blockedSlots = await getBlockedSlots(tenantId, dateFrom, dateTo, resourceId);

    return NextResponse.json({ blockedSlots });
  } catch (error: any) {
    console.error("Error fetching blocked slots:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch blocked slots" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blocked-slots
 * Create a new blocked slot
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const body = await request.json();

    // Validate required fields
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { error: "date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (!body.startTime || !/^\d{2}:\d{2}$/.test(body.startTime)) {
      return NextResponse.json(
        { error: "startTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    if (!body.endTime || !/^\d{2}:\d{2}$/.test(body.endTime)) {
      return NextResponse.json(
        { error: "endTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    if (body.startTime >= body.endTime) {
      return NextResponse.json(
        { error: "startTime must be before endTime" },
        { status: 400 }
      );
    }

    const blockedSlot = await createBlockedSlot(tenantId, {
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason || undefined,
      resourceId: body.resourceId || undefined,
    });

    return NextResponse.json({ blockedSlot }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating blocked slot:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create blocked slot" },
      { status: 500 }
    );
  }
}
