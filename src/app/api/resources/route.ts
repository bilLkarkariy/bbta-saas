import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getResources, createResource } from "@/lib/queries/resources";

/**
 * GET /api/resources
 * Get all resources for the current tenant
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();

    // Get query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;

    const resources = await getResources(tenantId, type);

    return NextResponse.json({ resources });
  } catch (error: any) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resources
 * Create a new resource
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.type || !["staff", "room", "equipment"].includes(body.type)) {
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

    const resource = await createResource(tenantId, {
      name: body.name.trim(),
      type: body.type,
      color: body.color || undefined,
      workingHours: body.workingHours || undefined,
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create resource" },
      { status: 500 }
    );
  }
}
