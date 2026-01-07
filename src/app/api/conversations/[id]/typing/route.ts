import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenant } from "@/lib/auth";
import { emitToTenant } from "../../stream/route";
import { db } from "@/lib/db";

// Validate CUID format
const cuidSchema = z.string().cuid();

// Store typing states (in-memory, replace with Redis in production)
interface TypingState {
  userId: string;
  userName?: string;
  expiresAt: number;
}

const typingStates = new Map<string, TypingState>();

// Cleanup expired typing states every 5 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of typingStates.entries()) {
    if (value.expiresAt < now) {
      typingStates.delete(key);
    }
  }
}, 5000);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST - Start typing indicator
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { user, tenantId } = await getCurrentTenant();
    const { id } = await params;

    // Validate conversation ID format
    const validationResult = cuidSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid conversation ID format" },
        { status: 400 }
      );
    }
    const conversationId = validationResult.data;

    // Verify conversation belongs to tenant
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, tenantId },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Set typing state (expires in 5 seconds)
    typingStates.set(conversationId, {
      userId: user.id,
      userName: user.name || undefined,
      expiresAt: Date.now() + 5000,
    });

    // Emit to all clients
    emitToTenant(tenantId, {
      type: "typing_start",
      data: {
        conversationId,
        userId: user.id,
        userName: user.name,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Typing] POST error:", error);
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
}

/**
 * DELETE - Stop typing indicator
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { user, tenantId } = await getCurrentTenant();
    const { id } = await params;

    // Validate conversation ID format
    const validationResult = cuidSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid conversation ID format" },
        { status: 400 }
      );
    }
    const conversationId = validationResult.data;

    // Remove typing state
    typingStates.delete(conversationId);

    // Emit to all clients
    emitToTenant(tenantId, {
      type: "typing_stop",
      data: {
        conversationId,
        userId: user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Typing] DELETE error:", error);
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
}

/**
 * GET - Check typing state for a conversation
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    // Validate conversation ID format
    const validationResult = cuidSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json(
        { isTyping: false },
        { status: 400 }
      );
    }
    const conversationId = validationResult.data;

    // Verify conversation belongs to tenant (auth check)
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, tenantId },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { isTyping: false },
        { status: 404 }
      );
    }

    const state = typingStates.get(conversationId);

    return NextResponse.json({
      isTyping: state ? state.expiresAt > Date.now() : false,
      userId: state?.userId,
      userName: state?.userName,
    });
  } catch (error) {
    console.error("[Typing] GET error:", error);
    return NextResponse.json(
      { isTyping: false },
      { status: 200 }
    );
  }
}
