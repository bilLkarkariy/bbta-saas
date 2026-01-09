import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { deleteBlockedSlot } from "@/lib/queries/availability";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/blocked-slots/[id]
 * Delete a blocked slot
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    await deleteBlockedSlot(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting blocked slot:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete blocked slot" },
      { status: 500 }
    );
  }
}
