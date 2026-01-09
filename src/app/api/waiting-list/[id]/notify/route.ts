import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getWaitingListById, markAsNotified } from "@/lib/queries/waiting-list";
import { sendWhatsAppMessage } from "@/lib/twilio";

/**
 * POST /api/waiting-list/[id]/notify
 * Send WhatsApp notification to customer on waiting list
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, tenant } = await getCurrentTenant();
    const { id } = await params;

    // Get waiting list entry
    const entry = await getWaitingListById(id, tenantId);
    if (!entry) {
      return NextResponse.json(
        { error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    // Check if entry is still waiting
    if (entry.status !== "waiting") {
      return NextResponse.json(
        { error: "Entry is not in waiting status" },
        { status: 400 }
      );
    }

    // Format message
    const customerName = entry.customerName || "Client";
    const message = `Bonjour ${customerName},\n\nBonne nouvelle ! Un créneau s'est libéré pour ${entry.service}.\n\nDate souhaitée: ${new Date(entry.desiredDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}\n\nContactez-nous pour confirmer votre réservation.\n\n${tenant.businessName || "L'équipe"}`;

    // Send WhatsApp message
    await sendWhatsAppMessage({
      to: entry.customerPhone,
      body: message,
    });

    // Mark as notified
    const updatedEntry = await markAsNotified(id, tenantId);

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: "Notification sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
