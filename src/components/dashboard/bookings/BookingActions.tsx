"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  MoreVertical,
  Trash2,
  Calendar,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RescheduleDialog } from "./RescheduleDialog";

interface Booking {
  id: string;
  customerName: string | null;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  reminderSent?: boolean;
}

interface BookingActionsProps {
  booking: Booking;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReschedule?: () => void;
  onReminderSent?: () => void;
}

export function BookingActions({
  booking,
  onStatusUpdate,
  onDelete,
  onReschedule,
  onReminderSent,
}: BookingActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    setIsLoading(true);
    try {
      await onStatusUpdate(booking.id, status);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(booking.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescheduleSuccess = () => {
    if (onReschedule) {
      onReschedule();
    }
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
      if (onReminderSent) {
        onReminderSent();
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <>
      <RescheduleDialog
        booking={booking}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={handleRescheduleSuccess}
      />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isLoading}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {/* Send Reminder */}
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <DropdownMenuItem
            onClick={handleSendReminder}
            disabled={sendingReminder}
          >
            <Bell className="h-4 w-4 mr-2 text-blue-600" />
            {sendingReminder ? "Envoi..." : "Envoyer rappel"}
          </DropdownMenuItem>
        )}

        {/* Reschedule */}
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <>
            <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Reprogrammer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Status Actions */}
        {booking.status === "pending" && (
          <DropdownMenuItem onClick={() => handleStatusUpdate("confirmed")}>
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Confirmer
          </DropdownMenuItem>
        )}

        {booking.status === "confirmed" && (
          <>
            <DropdownMenuItem onClick={() => handleStatusUpdate("completed")}>
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Marquer terminé
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate("no_show")}>
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Marquer no-show
            </DropdownMenuItem>
          </>
        )}

        {(booking.status === "pending" || booking.status === "confirmed") && (
          <DropdownMenuItem onClick={() => handleStatusUpdate("cancelled")}>
            <X className="h-4 w-4 mr-2 text-destructive" />
            Annuler
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* View Details */}
        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/booking/${booking.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir détails
        </DropdownMenuItem>

        {/* Delete */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
