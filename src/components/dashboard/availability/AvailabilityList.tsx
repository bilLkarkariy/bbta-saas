"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  resourceId: string | null;
  isActive: boolean;
  resource?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface AvailabilityListProps {
  availabilities: Availability[];
  loading: boolean;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function AvailabilityList({
  availabilities,
  loading,
  onDelete,
  onToggle,
}: AvailabilityListProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (availabilities.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun horaire défini. Ajoutez vos horaires d'ouverture.
      </div>
    );
  }

  // Group by day of week
  const byDay: Record<number, Availability[]> = {};
  availabilities.forEach((avail) => {
    if (!byDay[avail.dayOfWeek]) {
      byDay[avail.dayOfWeek] = [];
    }
    byDay[avail.dayOfWeek].push(avail);
  });

  return (
    <div className="divide-y divide-border">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => {
        const dayAvailabilities = byDay[day] || [];
        return (
          <div key={day} className="p-4">
            <h3 className="font-semibold mb-3">{DAYS[day]}</h3>
            {dayAvailabilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Fermé</p>
            ) : (
              <div className="space-y-2">
                {dayAvailabilities.map((avail) => (
                  <div
                    key={avail.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {avail.startTime} - {avail.endTime}
                      </span>
                      {avail.resource && (
                        <Badge variant="secondary" className="text-xs">
                          {avail.resource.name}
                        </Badge>
                      )}
                      {!avail.isActive && (
                        <Badge variant="secondary" className="text-xs bg-muted">
                          Inactif
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onToggle(avail.id, avail.isActive)}
                      >
                        {avail.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(avail.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
