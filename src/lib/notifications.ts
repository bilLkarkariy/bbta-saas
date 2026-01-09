/**
 * Notification Helper Functions
 * Emit notifications for booking events
 */

import { createNotification, type NotificationType } from "@/lib/queries/notifications";

/**
 * Emit notification for new booking
 */
export async function notifyNewBooking(
  tenantId: string,
  booking: {
    id: string;
    customerName: string | null;
    customerPhone: string;
    service: string;
    date: string;
    time: string;
  }
) {
  const customerDisplay = booking.customerName || booking.customerPhone;

  await createNotification({
    tenantId,
    type: "new_booking",
    title: "Nouvelle réservation",
    message: `${customerDisplay} - ${booking.service} le ${new Date(booking.date).toLocaleDateString("fr-FR")} à ${booking.time}`,
    bookingId: booking.id,
    resourceType: "booking",
    resourceId: booking.id,
  });
}

/**
 * Emit notification for booking cancellation
 */
export async function notifyBookingCancelled(
  tenantId: string,
  booking: {
    id: string;
    customerName: string | null;
    customerPhone: string;
    service: string;
    date: string;
    time: string;
  }
) {
  const customerDisplay = booking.customerName || booking.customerPhone;

  await createNotification({
    tenantId,
    type: "booking_cancelled",
    title: "Réservation annulée",
    message: `${customerDisplay} - ${booking.service} le ${new Date(booking.date).toLocaleDateString("fr-FR")} à ${booking.time}`,
    bookingId: booking.id,
    resourceType: "booking",
    resourceId: booking.id,
  });
}

/**
 * Emit notification for booking update
 */
export async function notifyBookingUpdated(
  tenantId: string,
  booking: {
    id: string;
    customerName: string | null;
    customerPhone: string;
    service: string;
    date: string;
    time: string;
  },
  changes: string
) {
  const customerDisplay = booking.customerName || booking.customerPhone;

  await createNotification({
    tenantId,
    type: "booking_updated",
    title: "Réservation modifiée",
    message: `${customerDisplay} - ${changes}`,
    bookingId: booking.id,
    resourceType: "booking",
    resourceId: booking.id,
  });
}

/**
 * Emit notification for no-show
 */
export async function notifyNoShow(
  tenantId: string,
  booking: {
    id: string;
    customerName: string | null;
    customerPhone: string;
    service: string;
    date: string;
    time: string;
  }
) {
  const customerDisplay = booking.customerName || booking.customerPhone;

  await createNotification({
    tenantId,
    type: "no_show",
    title: "Client absent",
    message: `${customerDisplay} ne s'est pas présenté pour ${booking.service}`,
    bookingId: booking.id,
    resourceType: "booking",
    resourceId: booking.id,
  });
}

/**
 * Emit notification for reminder pending
 */
export async function notifyReminderPending(
  tenantId: string,
  booking: {
    id: string;
    customerName: string | null;
    customerPhone: string;
    service: string;
    date: string;
    time: string;
  }
) {
  const customerDisplay = booking.customerName || booking.customerPhone;

  await createNotification({
    tenantId,
    type: "reminder_pending",
    title: "Rappel à envoyer",
    message: `Rappel pour ${customerDisplay} - ${booking.service} demain`,
    bookingId: booking.id,
    resourceType: "booking",
    resourceId: booking.id,
  });
}
