import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get notes for a conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenant } = await getCurrentTenant();
    const { id: conversationId } = await params;

    // Verify conversation belongs to tenant
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const notes = await db.conversationNote.findMany({
      where: { conversationId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      notes.map((n) => ({
        id: n.id,
        content: n.content,
        user: n.user,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});

// Create a note
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenant, user } = await getCurrentTenant();
    const { id: conversationId } = await params;

    // Viewers cannot add notes
    if (user.role === "VIEWER") {
      return NextResponse.json({ error: "Viewers cannot add notes" }, { status: 403 });
    }

    // Verify conversation belongs to tenant
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const note = await db.conversationNote.create({
      data: {
        conversationId,
        userId: user.id,
        content: parsed.data.content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      id: note.id,
      content: note.content,
      user: note.user,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
