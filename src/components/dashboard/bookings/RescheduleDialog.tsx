"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";

interface Booking {
  id: string;
  customerName: string | null;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  status: string;
}

interface RescheduleDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RescheduleDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [newDate, setNewDate] = useState(booking.date);
  const [newTime, setNewTime] = useState(booking.time);

  const validateForm = () => {
    if (!newDate) {
      setError("La date est requise");
      return false;
    }

    const bookingDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      setError("La date ne peut pas être dans le passé");
      return false;
    }

    if (!newTime) {
      setError("L'heure est requise");
      return false;
    }

    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      setError("Format d'heure invalide (HH:MM)");
      return false;
    }

    // Check if date/time changed
    if (newDate === booking.date && newTime === booking.time) {
      setError("Veuillez choisir une nouvelle date ou heure");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    // Confirm reprogrammation
    const confirmed = confirm(
      `Reprogrammer cette réservation du ${new Date(booking.date).toLocaleDateString("fr-FR")} à ${booking.time} vers le ${new Date(newDate).toLocaleDateString("fr-FR")} à ${newTime} ?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de la reprogrammation");
      }

      // Success
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reprogrammer la réservation</DialogTitle>
          <DialogDescription>
            Modifier la date et l'heure de cette réservation
          </DialogDescription>
        </DialogHeader>

        {/* Current info */}
        <div className="rounded-lg bg-muted/30 p-4 space-y-2 border border-border">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Actuel:</span>
            <span>
              {new Date(booking.date).toLocaleDateString("fr-FR")} à {booking.time}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {booking.customerName || booking.customerPhone} - {booking.service}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">
                Nouvelle date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-time">
                Nouvelle heure <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Reprogrammation..." : "Reprogrammer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
