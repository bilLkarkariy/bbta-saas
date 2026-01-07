import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { emitToTenant } from "../../stream/route";

// Validate CUID format
const cuidSchema = z.string().cuid();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
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
        { error: "Invalid conversation ID format" },
        { status: 400 }
      );
    }
    const conversationId = validationResult.data;

    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Get conversation with tenant
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        tenant: {
          select: {
            id: true,
            whatsappNumber: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!conversation.tenant.whatsappNumber) {
      return NextResponse.json(
        { error: "WhatsApp number not configured" },
        { status: 400 }
      );
    }

    // Send message via Twilio
    let twilioSid: string | null = null;
    let messageStatus = "sent";

    try {
      const twilioResponse = await sendWhatsAppMessage({
        to: conversation.customerPhone,
        from: conversation.tenant.whatsappNumber,
        body: content.trim(),
      });
      twilioSid = twilioResponse.sid;
    } catch (twilioError) {
      console.error("[Reply] Twilio error:", twilioError);
      messageStatus = "failed";
    }

    // Create message record
    const message = await db.message.create({
      data: {
        conversationId,
        direction: "outbound",
        content: content.trim(),
        status: messageStatus,
        twilioSid,
        intent: "MANUAL", // Manual reply from dashboard
      },
    });

    // Update conversation
    await db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Emit to real-time subscribers
    emitToTenant(tenantId, {
      type: "new_message",
      data: {
        id: message.id,
        conversationId,
        direction: "outbound",
        content: message.content,
        status: message.status,
        intent: message.intent,
        createdAt: message.createdAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        status: message.status,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Reply] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
