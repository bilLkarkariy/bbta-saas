import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

const updateSchema = z.object({
  role: z.enum(["ADMIN", "AGENT", "VIEWER"]).optional(),
  isAvailable: z.boolean().optional(),
  maxConversations: z.number().min(1).max(100).optional(),
  name: z.string().min(1).max(100).optional(),
});

// Update team member
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenant, user } = await getCurrentTenant();
    const { memberId } = await params;

    // Get target member
    const member = await db.user.findFirst({
      where: { id: memberId, tenantId: tenant.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Permission checks
    const isUpdatingSelf = member.id === user.id;
    const isOwner = user.role === "OWNER";
    const isAdmin = user.role === "ADMIN";

    // Parse request body
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { role, isAvailable, maxConversations, name } = parsed.data;

    // Role change rules
    if (role !== undefined) {
      // Cannot change owner role
      if (member.role === "OWNER") {
        return NextResponse.json(
          { error: "Cannot change owner's role" },
          { status: 403 }
        );
      }

      // Only owner can change roles
      if (!isOwner) {
        return NextResponse.json(
          { error: "Only owners can change roles" },
          { status: 403 }
        );
      }

      // Note: Cannot promote to owner - schema validation prevents "OWNER" value
    }

    // Availability changes - agents can update their own, admin/owner can update anyone
    if (isAvailable !== undefined || maxConversations !== undefined) {
      if (!isUpdatingSelf && !isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Cannot update other members' availability" },
          { status: 403 }
        );
      }
    }

    // Update member
    const updated = await db.user.update({
      where: { id: memberId },
      data: {
        ...(role !== undefined && { role: role as UserRole }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(maxConversations !== undefined && { maxConversations }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAvailable: true,
        maxConversations: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Team update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove team member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenant, user } = await getCurrentTenant();
    const { memberId } = await params;

    // Get target member
    const member = await db.user.findFirst({
      where: { id: memberId, tenantId: tenant.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot remove owner
    if (member.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove owner" },
        { status: 403 }
      );
    }

    // Cannot remove self (use different flow)
    if (member.id === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself. Use account settings instead." },
        { status: 403 }
      );
    }

    // Only owner can remove members
    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can remove team members" },
        { status: 403 }
      );
    }

    // Unassign all conversations first
    await db.conversation.updateMany({
      where: { assignedToId: memberId },
      data: { assignedToId: null, assignedAt: null },
    });

    // Delete user
    await db.user.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Team delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
