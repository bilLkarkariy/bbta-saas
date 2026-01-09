"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Bell, CheckCircle2 } from "lucide-react";
import { WaitingListTable } from "@/components/dashboard/waiting-list/WaitingListTable";
import { WaitingListFilters } from "@/components/dashboard/waiting-list/WaitingListFilters";
import { CreateWaitingListDialog } from "@/components/dashboard/waiting-list/CreateWaitingListDialog";

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

interface Stats {
  totalWaiting: number;
  notifiedCount: number;
  convertedThisMonth: number;
  byDate: { date: string; count: number }[];
}

export default function WaitingListPage() {
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("waiting");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFilter) params.append("desiredDate", dateFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/waiting-list?${params}`);
      if (!res.ok) throw new Error("Failed to fetch waiting list");

      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching waiting list:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/waiting-list/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle notify
  const handleNotify = async (id: string) => {
    try {
      const res = await fetch(`/api/waiting-list/${id}/notify`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send notification");
      }

      alert("Notification envoyée avec succès!");
      fetchEntries();
      fetchStats();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      alert("Erreur: " + error.message);
    }
  };

  // Handle convert
  const handleConvert = async (id: string, date: string, time: string) => {
    try {
      const res = await fetch(`/api/waiting-list/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to convert to booking");
      }

      alert("Converti en réservation!");
      fetchEntries();
      fetchStats();
    } catch (error: any) {
      console.error("Error converting to booking:", error);
      alert("Erreur: " + error.message);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entrée?")) return;

    try {
      const res = await fetch(`/api/waiting-list/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete entry");

      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => prev - 1);
      fetchStats();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Erreur: Impossible de supprimer l'entrée");
    }
  };

  return (
    <div className="w-full max-w-full space-y-[var(--dashboard-section-gap)]">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Liste d'Attente
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les demandes de réservation quand vous êtes complet
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter à la liste
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass shadow-layered border bg-blue-500/5 border-blue-500/10">
            <CardContent className="p-[var(--dashboard-card-padding)]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-label text-muted-foreground">En attente</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalWaiting}
                  </p>
                </div>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-layered border bg-yellow-500/5 border-yellow-500/10">
            <CardContent className="p-[var(--dashboard-card-padding)]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-label text-muted-foreground">Notifiés (7j)</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.notifiedCount}
                  </p>
                </div>
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-layered border bg-green-500/5 border-green-500/10">
            <CardContent className="p-[var(--dashboard-card-padding)]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-label text-muted-foreground">Convertis ce mois</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.convertedThisMonth}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-layered border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Par date</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-1">
                {stats.byDate.slice(0, 3).map((item) => (
                  <div key={item.date} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <WaitingListFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        search={search}
        setSearch={setSearch}
      />

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {loading ? (
          "Chargement..."
        ) : (
          <>
            {total} entrée{total !== 1 ? "s" : ""} trouvée{total !== 1 ? "s" : ""}
          </>
        )}
      </div>

      {/* Table */}
      <WaitingListTable
        entries={entries}
        loading={loading}
        onNotify={handleNotify}
        onConvert={handleConvert}
        onDelete={handleDelete}
        onRefresh={fetchEntries}
      />

      {/* Create Dialog */}
      <CreateWaitingListDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchEntries();
          fetchStats();
        }}
      />
    </div>
  );
}
