import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/twilio";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/bookings/[id]/send-reminder
 * Send a WhatsApp reminder for a booking manually
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { tenantId, tenant } = await getCurrentTenant();
    const { id } = await params;

    // Get booking
    const booking = await db.booking.findFirst({
      where: { id, tenantId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check status
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Can only send reminders for pending or confirmed bookings" },
        { status: 400 }
      );
    }

    // Check tenant has WhatsApp configured
    if (!tenant.whatsappNumber) {
      return NextResponse.json(
        { error: "WhatsApp number not configured for this tenant" },
        { status: 400 }
      );
    }

    // Format date for message
    const bookingDate = new Date(booking.date);
    const dateString = bookingDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // Prepare message
    const message = `Bonjour ${booking.customerName || ""},\n\nRappel de votre rendez-vous le ${dateString} à ${booking.time} pour ${booking.service}.\n\nMerci de répondre "OK" pour confirmer ou "ANNULER" pour annuler.`;

    // Send WhatsApp message
    await sendWhatsAppMessage({
      to: booking.customerPhone,
      body: message,
      from: tenant.whatsappNumber,
    });

    // Update booking
    await db.booking.update({
      where: { id },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send reminder" },
      { status: 500 }
    );
  }
}
