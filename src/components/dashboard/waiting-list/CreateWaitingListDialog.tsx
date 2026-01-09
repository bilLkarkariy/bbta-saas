"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateWaitingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateWaitingListDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWaitingListDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerPhone: "",
    customerName: "",
    service: "",
    desiredDate: "",
    desiredTime: "",
    notes: "",
    priority: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priority: parseInt(formData.priority),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create entry");
      }

      // Reset form
      setFormData({
        customerPhone: "",
        customerName: "",
        service: "",
        desiredDate: "",
        desiredTime: "",
        notes: "",
        priority: "0",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating entry:", error);
      alert("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter à la Liste d'Attente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Téléphone *</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
              placeholder="+33 6 12 34 56 78"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Nom</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              placeholder="Jean Dupont"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Input
              id="service"
              value={formData.service}
              onChange={(e) =>
                setFormData({ ...formData, service: e.target.value })
              }
              placeholder="Coupe"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desiredDate">Date souhaitée *</Label>
              <Input
                id="desiredDate"
                type="date"
                value={formData.desiredDate}
                onChange={(e) =>
                  setFormData({ ...formData, desiredDate: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desiredTime">Heure</Label>
              <Input
                id="desiredTime"
                type="time"
                value={formData.desiredTime}
                onChange={(e) =>
                  setFormData({ ...formData, desiredTime: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Input
              id="priority"
              type="number"
              min="0"
              max="10"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              0 = normale, plus élevé = plus prioritaire
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Informations complémentaires..."
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Création..." : "Ajouter"}
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
