"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar } from "lucide-react";

interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  resourceId: string | null;
  resource?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface BlockedSlotsListProps {
  blockedSlots: BlockedSlot[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function BlockedSlotsList({
  blockedSlots,
  loading,
  onDelete,
}: BlockedSlotsListProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (blockedSlots.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun créneau bloqué
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {blockedSlots.map((slot) => (
        <div
          key={slot.id}
          className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {new Date(slot.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <span className="text-muted-foreground">
                {slot.startTime} - {slot.endTime}
              </span>
            </div>
            {slot.reason && (
              <p className="text-sm text-muted-foreground pl-6">{slot.reason}</p>
            )}
            {slot.resource && (
              <Badge variant="secondary" className="text-xs ml-6">
                {slot.resource.name}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(slot.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
