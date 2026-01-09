"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye } from "lucide-react";
import { RecurringSeriesDialog } from "./RecurringSeriesDialog";

interface RecurringSeriesInfoProps {
  bookingId: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  isParent: boolean;
  parentBookingId?: string;
  onUpdate?: () => void;
}

export function RecurringSeriesInfo({
  bookingId,
  isRecurring,
  recurrenceRule,
  recurrenceEndDate,
  isParent,
  parentBookingId,
  onUpdate,
}: RecurringSeriesInfoProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isRecurring) {
    return null;
  }

  const getRecurrenceLabel = (rule: string) => {
    switch (rule) {
      case "weekly":
        return "Hebdomadaire";
      case "biweekly":
        return "Bimensuelle";
      case "monthly":
        return "Mensuelle";
      default:
        return rule;
    }
  };

  return (
    <>
      <Card className="glass shadow-layered">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-heading flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Réservation Récurrente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-[var(--dashboard-card-padding)] space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-label mb-1.5">Type de récurrence</p>
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-600 border-blue-500/20"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {recurrenceRule && getRecurrenceLabel(recurrenceRule)}
              </Badge>
            </div>

            {recurrenceEndDate && (
              <div>
                <p className="text-label mb-1.5">Date de fin</p>
                <p className="text-body-strong">
                  {new Date(recurrenceEndDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            <div>
              <p className="text-label mb-1.5">Position dans la série</p>
              <Badge variant="secondary">
                {isParent ? "Réservation parente" : "Occurrence de la série"}
              </Badge>
            </div>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir toute la série
          </Button>
        </CardContent>
      </Card>

      <RecurringSeriesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bookingId={parentBookingId || bookingId}
        onSuccess={onUpdate}
      />
    </>
  );
}
