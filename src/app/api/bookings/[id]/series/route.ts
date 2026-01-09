import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  getRecurringBookingSeries,
  updateRecurringSeries,
  deleteRecurringSeries,
} from "@/lib/queries/recurring-bookings";

/**
 * GET /api/bookings/[id]/series
 * Get all occurrences of a recurring booking
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    const series = await getRecurringBookingSeries(id, tenantId);

    return NextResponse.json(series);
  } catch (error: any) {
    console.error("Error fetching recurring series:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recurring series" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]/series
 * Update all future occurrences of a recurring booking
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;
    const body = await request.json();

    const result = await updateRecurringSeries(id, tenantId, body);

    return NextResponse.json({
      success: true,
      updated: result.updated,
      message: `Updated ${result.updated} future occurrence(s)`,
    });
  } catch (error: any) {
    console.error("Error updating recurring series:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update recurring series" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/[id]/series
 * Delete all future occurrences of a recurring booking
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    const result = await deleteRecurringSeries(id, tenantId);

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      message: `Deleted ${result.deleted} future occurrence(s)`,
    });
  } catch (error: any) {
    console.error("Error deleting recurring series:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete recurring series" },
      { status: 500 }
    );
  }
}
