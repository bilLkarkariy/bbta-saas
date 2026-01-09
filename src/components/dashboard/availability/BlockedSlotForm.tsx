"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlockedSlotFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BlockedSlotForm({
  open,
  onOpenChange,
  onSuccess,
}: BlockedSlotFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");
  const [reason, setReason] = useState("");
  const [resources, setResources] = useState<any[]>([]);
  const [resourceId, setResourceId] = useState("");

  useEffect(() => {
    if (open) {
      fetchResources();
      // Set default date to today
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources");
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources.filter((r: any) => r.isActive));
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (startTime >= endTime) {
      setError("L'heure de fin doit être après l'heure de début");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          reason: reason || null,
          resourceId: resourceId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la création");

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
          <DialogTitle>Bloquer un créneau</DialogTitle>
          <DialogDescription>
            Bloquez un créneau spécifique (congé, maintenance, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Heure de début *</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Heure de fin *</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Raison (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Congé, Maintenance, Formation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {resources.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="resource">Ressource (optionnel)</Label>
              <Select value={resourceId} onValueChange={setResourceId}>
                <SelectTrigger id="resource">
                  <SelectValue placeholder="Toutes les ressources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les ressources</SelectItem>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Bloquer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
