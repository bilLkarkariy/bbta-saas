"use client";

import { useState, useEffect, useCallback } from "react";
import { BookingStats } from "@/components/dashboard/bookings/BookingStats";
import { BookingFilters } from "@/components/dashboard/bookings/BookingFilters";
import { BookingList } from "@/components/dashboard/bookings/BookingList";
import { BookingCalendar } from "@/components/dashboard/bookings/BookingCalendar";
import { CreateBookingDialog } from "@/components/dashboard/bookings/CreateBookingDialog";
import { Button } from "@/components/ui/button";
import { List, Calendar as CalendarIcon, Download } from "lucide-react";
import { BookingStats as BookingStatsType } from "@/lib/queries/bookings";

interface Booking {
  id: string;
  customerPhone: string;
  customerName: string | null;
  service: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  reminderSent: boolean;
  createdAt: Date;
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // Fetch bookings with filters
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (search) params.append("search", search);

      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");

      const data = await res.json();
      setBookings(data.bookings);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentStatusFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/stats");
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

  // Handle successful booking creation
  const handleBookingCreated = useCallback(() => {
    fetchBookings();
    fetchStats();
  }, [fetchBookings, fetchStats]);

  // Handle status update
  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update booking");

      // Optimistic update
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: status as any } : b))
      );

      // Refresh stats
      const statsRes = await fetch("/api/bookings/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Erreur: Impossible de mettre à jour la réservation");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete booking");

      // Remove from list
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setTotal((prev) => prev - 1);

      // Refresh stats
      const statsRes = await fetch("/api/bookings/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Erreur: Impossible de supprimer la réservation");
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    if (search) params.append("search", search);

    window.open(`/api/bookings/export?${params}`, "_blank");
  };

  return (
    <div className="w-full max-w-full space-y-[var(--dashboard-section-gap)]">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Réservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos réservations et rendez-vous clients
          </p>
        </div>
        <CreateBookingDialog onSuccess={handleBookingCreated} />
      </div>

      {/* Stats */}
      {stats && <BookingStats stats={stats} />}

      {/* View Mode Toggle & Filters */}
      <div className="flex items-center justify-between gap-4">
        <BookingFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          paymentStatusFilter={paymentStatusFilter}
          setPaymentStatusFilter={setPaymentStatusFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          search={search}
          setSearch={setSearch}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Liste
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Calendrier
          </Button>
        </div>
      </div>

      {/* Results Count (Liste only) */}
      {viewMode === "list" && (
        <div className="text-sm text-muted-foreground">
          {loading ? (
            "Chargement..."
          ) : (
            <>
              {total} réservation{total !== 1 ? "s" : ""} trouvée
              {total !== 1 ? "s" : ""}
            </>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === "list" ? (
        <BookingList
          bookings={bookings}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          onReschedule={handleBookingCreated}
          loading={loading}
        />
      ) : (
        <BookingCalendar bookings={bookings} />
      )}
    </div>
  );
}
