import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getAvailabilities, createAvailability } from "@/lib/queries/availability";

/**
 * GET /api/availability
 * Get all availability rules
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId") || undefined;

    const availabilities = await getAvailabilities(tenantId, resourceId);

    return NextResponse.json({ availabilities });
  } catch (error: any) {
    console.error("Error fetching availabilities:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch availabilities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/availability
 * Create a new availability rule
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const body = await request.json();

    // Validate required fields
    if (body.dayOfWeek === undefined || body.dayOfWeek < 0 || body.dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)" },
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

    const availability = await createAvailability(tenantId, {
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      resourceId: body.resourceId || undefined,
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create availability" },
      { status: 500 }
    );
  }
}
