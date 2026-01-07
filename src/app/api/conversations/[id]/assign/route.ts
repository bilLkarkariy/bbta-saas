import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const assignSchema = z.object({
  agentId: z.string().nullable(),
});

// Assign conversation to agent
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenant, user } = await getCurrentTenant();
    const { id: conversationId } = await params;

    // Only OWNER, ADMIN, and AGENT can assign
    if (user.role === "VIEWER") {
      return NextResponse.json({ error: "Viewers cannot assign conversations" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agentId } = parsed.data;

    // Get conversation
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // If assigning to someone, validate they exist and can take more
    if (agentId) {
      const targetUser = await db.user.findFirst({
        where: { id: agentId, tenantId: tenant.id },
        include: {
          _count: {
            select: {
              assignedConversations: {
                where: { status: "active" },
              },
            },
          },
        },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check capacity
      if (targetUser._count.assignedConversations >= targetUser.maxConversations) {
        return NextResponse.json(
          { error: "User has reached maximum conversation capacity" },
          { status: 400 }
        );
      }

      // Check availability
      if (!targetUser.isAvailable) {
        return NextResponse.json(
          { error: "User is not available" },
          { status: 400 }
        );
      }
    }

    // Update assignment
    const updated = await db.conversation.update({
      where: { id: conversationId },
      data: {
        assignedToId: agentId,
        assignedAt: agentId ? new Date() : null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      assignedTo: updated.assignedTo,
      assignedAt: updated.assignedAt?.toISOString() || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Assign conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
