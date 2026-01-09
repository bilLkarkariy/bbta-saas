"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw } from "lucide-react";

interface CreateBookingDialogProps {
  onSuccess: () => void;
}

export function CreateBookingDialog({ onSuccess }: CreateBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [resourceId, setResourceId] = useState<string>("");

  // Recurring booking state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  // Resources
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Fetch resources when dialog opens
  useEffect(() => {
    if (open) {
      fetchResources();
    }
  }, [open]);

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const res = await fetch("/api/resources");
      if (!res.ok) throw new Error("Failed to fetch resources");
      const data = await res.json();
      setResources(data.resources.filter((r: any) => r.isActive));
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoadingResources(false);
    }
  };

  const resetForm = () => {
    setCustomerPhone("");
    setCustomerName("");
    setService("");
    setDate("");
    setTime("");
    setNotes("");
    setResourceId("");
    setIsRecurring(false);
    setRecurrenceRule("weekly");
    setRecurrenceEndDate("");
    setError("");
  };

  const validateForm = () => {
    if (!customerPhone.trim()) {
      setError("Le numéro de téléphone est requis");
      return false;
    }

    if (!/^\+?[\d\s-]+$/.test(customerPhone)) {
      setError("Format de téléphone invalide");
      return false;
    }

    if (!service.trim()) {
      setError("Le service est requis");
      return false;
    }

    if (!date) {
      setError("La date est requise");
      return false;
    }

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      setError("La date ne peut pas être dans le passé");
      return false;
    }

    if (!time) {
      setError("L'heure est requise");
      return false;
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError("Format d'heure invalide (HH:MM)");
      return false;
    }

    // Recurring booking validation
    if (isRecurring) {
      if (!recurrenceEndDate) {
        setError("La date de fin de récurrence est requise");
        return false;
      }

      const endDate = new Date(recurrenceEndDate);
      const startDate = new Date(date);

      if (endDate <= startDate) {
        setError("La date de fin doit être après la date de début");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Choose endpoint based on recurring or not
      const endpoint = isRecurring ? "/api/bookings/recurring" : "/api/bookings";

      const payload: any = {
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim() || null,
        service: service.trim(),
        date,
        time,
        notes: notes.trim() || null,
        resourceId: resourceId || null,
      };

      // Add recurring fields if applicable
      if (isRecurring) {
        payload.recurrenceRule = recurrenceRule;
        payload.recurrenceEndDate = recurrenceEndDate;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de la création");
      }

      // Success
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une réservation</DialogTitle>
          <DialogDescription>
            Ajouter une réservation manuellement depuis le dashboard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Téléphone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du client</Label>
            <Input
              id="name"
              type="text"
              placeholder="Marie Dupont"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label htmlFor="service">
              Service <span className="text-destructive">*</span>
            </Label>
            <Input
              id="service"
              type="text"
              placeholder="Coupe + Couleur"
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
            />
          </div>

          {/* Resource */}
          {resources.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="resource">Ressource (optionnel)</Label>
              <Select value={resourceId} onValueChange={setResourceId} disabled={loadingResources}>
                <SelectTrigger id="resource">
                  <SelectValue placeholder="Choisir une ressource..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune ressource</SelectItem>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type === "staff" ? "Personnel" : resource.type === "room" ? "Salle" : "Équipement"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                Heure <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Informations supplémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Recurring Booking */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                <RefreshCw className="h-4 w-4" />
                Réservation récurrente
              </Label>
            </div>

            {isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="recurrence">
                    Récurrence <span className="text-destructive">*</span>
                  </Label>
                  <Select value={recurrenceRule} onValueChange={(value: any) => setRecurrenceRule(value)}>
                    <SelectTrigger id="recurrence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire (chaque semaine)</SelectItem>
                      <SelectItem value="biweekly">Bimensuelle (toutes les 2 semaines)</SelectItem>
                      <SelectItem value="monthly">Mensuelle (chaque mois)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">
                    Date de fin <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={date || new Date().toISOString().split("T")[0]}
                    required={isRecurring}
                  />
                  <p className="text-xs text-muted-foreground">
                    Les réservations seront créées jusqu'à cette date (max 52 occurrences)
                  </p>
                </div>
              </div>
            )}
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
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Création..." : "Créer la réservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
