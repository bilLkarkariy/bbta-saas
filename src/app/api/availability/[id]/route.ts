import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { updateAvailability, deleteAvailability } from "@/lib/queries/availability";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/availability/[id]
 * Update an availability rule
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;
    const body = await request.json();

    // Validate time format if provided
    if (body.startTime && !/^\d{2}:\d{2}$/.test(body.startTime)) {
      return NextResponse.json(
        { error: "startTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    if (body.endTime && !/^\d{2}:\d{2}$/.test(body.endTime)) {
      return NextResponse.json(
        { error: "endTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    if (body.startTime && body.endTime && body.startTime >= body.endTime) {
      return NextResponse.json(
        { error: "startTime must be before endTime" },
        { status: 400 }
      );
    }

    const availability = await updateAvailability(id, tenantId, body);

    return NextResponse.json({ availability });
  } catch (error: any) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update availability" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/availability/[id]
 * Delete an availability rule
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    await deleteAvailability(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete availability" },
      { status: 500 }
    );
  }
}
