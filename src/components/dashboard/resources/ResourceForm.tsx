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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Resource {
  id: string;
  name: string;
  type: "staff" | "room" | "equipment";
  color: string | null;
  isActive: boolean;
  workingHours: any;
}

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

export function ResourceForm({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: ResourceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<"staff" | "room" | "equipment">("staff");
  const [color, setColor] = useState("#3B82F6");

  useEffect(() => {
    if (resource) {
      setName(resource.name);
      setType(resource.type);
      setColor(resource.color || "#3B82F6");
    } else {
      setName("");
      setType("staff");
      setColor("#3B82F6");
    }
    setError("");
  }, [resource, open]);

  const validateForm = () => {
    if (!name.trim()) {
      setError("Le nom est requis");
      return false;
    }
    if (!type) {
      setError("Le type est requis");
      return false;
    }
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setError("Format de couleur invalide");
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

    setLoading(true);
    try {
      const url = resource ? `/api/resources/${resource.id}` : "/api/resources";
      const method = resource ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          color: color || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'enregistrement");
      }

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
          <DialogTitle>
            {resource ? "Modifier la ressource" : "Nouvelle ressource"}
          </DialogTitle>
          <DialogDescription>
            {resource
              ? "Modifiez les informations de la ressource"
              : "Ajoutez une nouvelle ressource (personnel, salle, ou équipement)"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              placeholder="Ex: Marie (Coiffeuse), Salle 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)} disabled={loading}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Personnel</SelectItem>
                <SelectItem value="room">Salle</SelectItem>
                <SelectItem value="equipment">Équipement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Couleur (pour le calendrier)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="text"
                placeholder="#3B82F6"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <div
                className="h-10 w-10 rounded border flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className="h-8 w-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: presetColor,
                    borderColor: color === presetColor ? "#000" : "transparent",
                  }}
                  onClick={() => setColor(presetColor)}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

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
              {loading
                ? "Enregistrement..."
                : resource
                  ? "Modifier"
                  : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
