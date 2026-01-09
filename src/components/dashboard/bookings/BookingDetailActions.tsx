"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Bell } from "lucide-react";
import { RescheduleDialog } from "./RescheduleDialog";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  customerName: string | null;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  status: string;
  reminderSent?: boolean;
}

interface BookingDetailActionsProps {
  booking: Booking;
}

export function BookingDetailActions({ booking }: BookingDetailActionsProps) {
  const router = useRouter();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const canReschedule = booking.status === "pending" || booking.status === "confirmed";

  const handleRescheduleSuccess = () => {
    router.refresh();
  };

  const handleSendReminder = async () => {
    if (!confirm("Envoyer un rappel WhatsApp pour cette réservation ?")) {
      return;
    }

    setSendingReminder(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/send-reminder`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'envoi");
      }

      alert("Rappel envoyé avec succès !");
      router.refresh();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSendingReminder(false);
    }
  };

  if (!canReschedule) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleSendReminder}
        disabled={sendingReminder}
        className="flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        {sendingReminder ? "Envoi..." : "Envoyer rappel"}
      </Button>

      <Button
        variant="outline"
        onClick={() => setRescheduleOpen(true)}
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        Reprogrammer
      </Button>

      <RescheduleDialog
        booking={booking}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={handleRescheduleSuccess}
      />
    </>
  );
}
