import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  getResourceById,
  updateResource,
  deleteResource,
} from "@/lib/queries/resources";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/resources/[id]
 * Get a specific resource
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    const resource = await getResourceById(id, tenantId);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ resource });
  } catch (error: any) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch resource" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/resources/[id]
 * Update a resource
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;
    const body = await request.json();

    // Validate type if provided
    if (body.type && !["staff", "room", "equipment"].includes(body.type)) {
      return NextResponse.json(
        { error: "Type must be 'staff', 'room', or 'equipment'" },
        { status: 400 }
      );
    }

    // Validate color format if provided
    if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return NextResponse.json(
        { error: "Invalid color format. Must be hex color like #3B82F6" },
        { status: 400 }
      );
    }

    const resource = await updateResource(id, tenantId, {
      ...(body.name && { name: body.name.trim() }),
      ...(body.type && { type: body.type }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.workingHours !== undefined && { workingHours: body.workingHours }),
    });

    return NextResponse.json({ resource });
  } catch (error: any) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update resource" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resources/[id]
 * Delete a resource
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    await deleteResource(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting resource:", error);

    // Check if it's a constraint error
    if (error.message.includes("Cannot delete resource")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to delete resource" },
      { status: 500 }
    );
  }
}
