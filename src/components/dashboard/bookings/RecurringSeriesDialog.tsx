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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { RefreshCw, Edit, Trash2, XCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface RecurringSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  onSuccess?: () => void;
}

interface SeriesData {
  parent: any;
  occurrences: any[];
  total: number;
}

export function RecurringSeriesDialog({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
}: RecurringSeriesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<SeriesData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (open && bookingId) {
      fetchSeries();
    }
  }, [open, bookingId]);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/series`);
      if (!res.ok) throw new Error("Failed to fetch series");
      const data = await res.json();
      setSeries(data);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de charger la série",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/series`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete series");

      const data = await res.json();

      toast.success("Série supprimée", {
        description: `${data.deleted} occurrence(s) future(s) supprimée(s)`,
      });

      setDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de supprimer la série",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSeries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/series`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!res.ok) throw new Error("Failed to cancel series");

      const data = await res.json();

      toast.success("Série annulée", {
        description: `${data.updated} occurrence(s) future(s) annulée(s)`,
      });

      setCancelDialogOpen(false);
      fetchSeries(); // Refresh to show updated statuses
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible d'annuler la série",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const futureOccurrences = series?.occurrences.filter(
    (occ) => new Date(occ.date) >= new Date(new Date().toISOString().split("T")[0])
  ) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Série de réservations récurrentes
            </DialogTitle>
            <DialogDescription>
              Gérer toutes les occurrences de cette réservation récurrente
            </DialogDescription>
          </DialogHeader>

          {loading && !series && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement de la série...</p>
            </div>
          )}

          {series && (
            <div className="space-y-6">
              {/* Series Info */}
              <Card className="p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-medium">{series.parent.service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">
                      {series.parent.customerName || series.parent.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Récurrence</p>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {getRecurrenceLabel(series.parent.recurrenceRule)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total occurrences</p>
                    <p className="font-medium">{series.total} réservations</p>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={loading || futureOccurrences.length === 0}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Annuler toutes les occurrences futures
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading || futureOccurrences.length === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer toutes les occurrences futures
                </Button>
              </div>

              {futureOccurrences.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-600">Aucune occurrence future</p>
                      <p className="text-sm text-muted-foreground">
                        Toutes les occurrences de cette série sont dans le passé.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Occurrences Table */}
              <div>
                <h3 className="text-sm font-medium mb-3">Toutes les occurrences ({series.total})</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Ressource</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {series.occurrences.map((occurrence, index) => {
                        const isParent = occurrence.id === series.parent.id;
                        const isPast = new Date(occurrence.date) < new Date(new Date().toISOString().split("T")[0]);

                        return (
                          <TableRow key={occurrence.id} className={isPast ? "opacity-50" : ""}>
                            <TableCell>
                              {isParent ? (
                                <Badge variant="secondary" className="text-xs">
                                  Parent
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">#{index}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {new Date(occurrence.date).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>{occurrence.time}</TableCell>
                            <TableCell>
                              <BookingStatusBadge status={occurrence.status} />
                            </TableCell>
                            <TableCell>
                              {occurrence.resource ? (
                                <span className="text-sm">{occurrence.resource.name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les occurrences futures ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement toutes les occurrences futures de cette série
              récurrente. Les occurrences passées seront conservées. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeries}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler les occurrences futures ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action marquera toutes les occurrences futures comme annulées. Les occurrences
              passées ne seront pas affectées. Vous pourrez toujours modifier le statut
              individuellement par la suite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSeries} disabled={loading}>
              {loading ? "Annulation..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
