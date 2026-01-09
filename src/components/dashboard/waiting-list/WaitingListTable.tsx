"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Trash2, Clock } from "lucide-react";
import { useState } from "react";
import { ConvertDialog } from "./ConvertDialog";

interface WaitingListEntry {
  id: string;
  customerPhone: string;
  customerName: string | null;
  service: string;
  desiredDate: string;
  desiredTime: string | null;
  status: "waiting" | "notified" | "converted" | "cancelled";
  priority: number;
  notifiedAt: Date | null;
  notificationCount: number;
  notes: string | null;
  createdAt: Date;
  resource?: {
    id: string;
    name: string;
    type: string;
    color: string | null;
  } | null;
}

interface WaitingListTableProps {
  entries: WaitingListEntry[];
  loading: boolean;
  onNotify: (id: string) => Promise<void>;
  onConvert: (id: string, date: string, time: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export function WaitingListTable({
  entries,
  loading,
  onNotify,
  onConvert,
  onDelete,
  onRefresh,
}: WaitingListTableProps) {
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">En attente</Badge>;
      case "notified":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Notifié</Badge>;
      case "converted":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Converti</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="glass shadow-layered">
        <CardContent className="p-[var(--dashboard-card-padding)]">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="glass shadow-layered">
        <CardContent className="p-[var(--dashboard-card-padding)]">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune entrée trouvée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass shadow-layered overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-label">Client</TableHead>
                  <TableHead className="text-label">Service</TableHead>
                  <TableHead className="text-label">Date souhaitée</TableHead>
                  <TableHead className="text-label">Heure</TableHead>
                  <TableHead className="text-label">Statut</TableHead>
                  <TableHead className="text-label">Priorité</TableHead>
                  <TableHead className="text-label text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{entry.customerName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{entry.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{entry.service}</TableCell>
                    <TableCell>
                      {new Date(entry.desiredDate).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      {entry.desiredTime || <span className="text-muted-foreground">Flexible</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      {entry.priority > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          Priorité {entry.priority}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Normale</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === "waiting" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNotify(entry.id)}
                              className="flex items-center gap-1"
                            >
                              <Bell className="h-3 w-3" />
                              Notifier
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedEntry(entry);
                                setConvertDialogOpen(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Convertir
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(entry.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedEntry && (
        <ConvertDialog
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
          entry={selectedEntry}
          onConvert={onConvert}
        />
      )}
    </>
  );
}
