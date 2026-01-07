"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusVariant = "default" | "success" | "warning" | "error" | "info";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  error: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

// French status mappings
const statusLabels: Record<string, { label: string; variant: StatusVariant }> = {
  // Campaign statuses
  draft: { label: "Brouillon", variant: "default" },
  scheduled: { label: "Planifiée", variant: "info" },
  sending: { label: "En cours", variant: "warning" },
  sent: { label: "Envoyée", variant: "success" },
  cancelled: { label: "Annulée", variant: "error" },
  // Message statuses
  pending: { label: "En attente", variant: "default" },
  delivered: { label: "Livré", variant: "success" },
  read: { label: "Lu", variant: "success" },
  replied: { label: "Répondu", variant: "success" },
  failed: { label: "Échoué", variant: "error" },
  // Integration statuses
  connected: { label: "Connecté", variant: "success" },
  disconnected: { label: "Déconnecté", variant: "default" },
  error: { label: "Erreur", variant: "error" },
  // Template statuses
  approved: { label: "Approuvé", variant: "success" },
  rejected: { label: "Rejeté", variant: "error" },
  // Contact statuses
  active: { label: "Actif", variant: "success" },
  opted_out: { label: "Désinscrit", variant: "error" },
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const mapping = statusLabels[status.toLowerCase()];
  const label = mapping?.label || status;
  const finalVariant = variant || mapping?.variant || "default";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs",
        variantStyles[finalVariant],
        className
      )}
    >
      {label}
    </Badge>
  );
}
