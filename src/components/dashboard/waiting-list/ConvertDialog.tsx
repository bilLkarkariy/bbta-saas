"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    id: string;
    customerName: string | null;
    service: string;
    desiredDate: string;
    desiredTime: string | null;
  };
  onConvert: (id: string, date: string, time: string) => Promise<void>;
}

export function ConvertDialog({
  open,
  onOpenChange,
  entry,
  onConvert,
}: ConvertDialogProps) {
  const [date, setDate] = useState(entry.desiredDate);
  const [time, setTime] = useState(entry.desiredTime || "09:00");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onConvert(entry.id, date, time);
      onOpenChange(false);
    } catch (error) {
      console.error("Error converting:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir en Réservation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Client</Label>
            <p className="text-sm text-muted-foreground">
              {entry.customerName || "Client"} - {entry.service}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Heure</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Conversion..." : "Convertir"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
