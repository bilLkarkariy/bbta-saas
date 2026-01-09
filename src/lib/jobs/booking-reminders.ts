import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { addDays, format } from "date-fns";

export async function sendBookingReminders() {
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Find bookings for tomorrow that haven't been reminded
  const bookings = await db.booking.findMany({
    where: {
      date: tomorrow,
      status: { in: ["pending", "confirmed"] },
      reminderSent: false,
    },
    include: {
      tenant: {
        select: { whatsappNumber: true },
      },
    },
  });

  let successCount = 0;
  let failureCount = 0;

  for (const booking of bookings) {
    try {
      if (!booking.tenant.whatsappNumber) {
        console.error(`Booking ${booking.id}: Tenant has no WhatsApp number configured`);
        failureCount++;
        continue;
      }

      const message = `🗓️ *Rappel de rendez-vous*\n\nBonjour ${booking.customerName || ""},\n\nVotre rendez-vous est prévu *demain à ${booking.time}* pour :\n📌 ${booking.service}\n\n━━━━━━━━━━━━━━━\nMerci de répondre :\n\n✅ Tapez *OK* pour confirmer\n❌ Tapez *ANNULER* pour annuler\n\nÀ bientôt ! 👋`;

      await sendWhatsAppMessage({
        to: booking.customerPhone,
        body: message,
        from: booking.tenant.whatsappNumber,
      });

      // Mark as sent
      await db.booking.update({
        where: { id: booking.id },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      });

      successCount++;
    } catch (error) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, error);
      failureCount++;
    }
  }

  return {
    sent: successCount,
    failed: failureCount,
    total: bookings.length,
  };
}
