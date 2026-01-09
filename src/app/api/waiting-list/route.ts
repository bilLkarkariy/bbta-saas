import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getWaitingList, createWaitingListEntry } from "@/lib/queries/waiting-list";

/**
 * GET /api/waiting-list
 * Fetch waiting list entries with optional filters
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = {
      status: searchParams.get("status") as any,
      desiredDate: searchParams.get("desiredDate") || undefined,
      resourceId: searchParams.get("resourceId") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    };

    const result = await getWaitingList(tenantId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching waiting list:", error);
    return NextResponse.json(
      { error: "Failed to fetch waiting list" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/waiting-list
 * Create a new waiting list entry
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const body = await request.json();

    // Validate required fields
    const { customerPhone, service, desiredDate } = body;
    if (!customerPhone || !service || !desiredDate) {
      return NextResponse.json(
        { error: "Missing required fields: customerPhone, service, desiredDate" },
        { status: 400 }
      );
    }

    // Validate phone format (basic)
    if (!/^\+?[\d\s-]+$/.test(customerPhone)) {
      return NextResponse.json(
        { error: "Invalid phone format" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desiredDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate time format if provided (HH:MM)
    if (body.desiredTime && !/^\d{2}:\d{2}$/.test(body.desiredTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected HH:MM" },
        { status: 400 }
      );
    }

    // Create entry
    const entry = await createWaitingListEntry(tenantId, {
      customerPhone,
      customerName: body.customerName,
      service,
      desiredDate,
      desiredTime: body.desiredTime,
      resourceId: body.resourceId,
      notes: body.notes,
      priority: body.priority || 0,
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating waiting list entry:", error);
    return NextResponse.json(
      { error: "Failed to create waiting list entry" },
      { status: 500 }
    );
  }
}
