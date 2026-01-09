import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  getWaitingListById,
  updateWaitingListEntry,
  deleteWaitingListEntry,
} from "@/lib/queries/waiting-list";

/**
 * GET /api/waiting-list/[id]
 * Get single waiting list entry
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    const entry = await getWaitingListById(id, tenantId);

    if (!entry) {
      return NextResponse.json(
        { error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching waiting list entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch waiting list entry" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/waiting-list/[id]
 * Update waiting list entry
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;
    const body = await request.json();

    // Validate entry exists
    const existing = await getWaitingListById(id, tenantId);
    if (!existing) {
      return NextResponse.json(
        { error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status && !["waiting", "notified", "converted", "cancelled"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update entry
    const entry = await updateWaitingListEntry(id, tenantId, body);

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Error updating waiting list entry:", error);
    return NextResponse.json(
      { error: "Failed to update waiting list entry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/waiting-list/[id]
 * Delete waiting list entry
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    // Validate entry exists
    const existing = await getWaitingListById(id, tenantId);
    if (!existing) {
      return NextResponse.json(
        { error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    await deleteWaitingListEntry(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting waiting list entry:", error);
    return NextResponse.json(
      { error: "Failed to delete waiting list entry" },
      { status: 500 }
    );
  }
}
