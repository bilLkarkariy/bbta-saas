"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Phone, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/dashboard/bookings/BookingStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function CustomerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const phone = decodeURIComponent(params.phone as string);

  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [phone]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/customers/${encodeURIComponent(phone)}/history`
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching customer history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-full flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="w-full max-w-full flex items-center justify-center py-12">
        <p className="text-muted-foreground">Client introuvable</p>
      </div>
    );
  }

  const stats = history.stats;

  return (
    <div className="w-full max-w-full space-y-[var(--dashboard-section-gap)]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/booking">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {history.customerName || "Client"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {history.customerPhone}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass shadow-layered">
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-layered">
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Complétées</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedBookings}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-layered">
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No-show</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.noShowCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.noShowRate}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-layered">
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Service favori</p>
                <p className="text-sm font-semibold line-clamp-2">
                  {stats.favoriteService || "—"}
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking History */}
      <Card className="glass shadow-layered">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-heading">Historique des réservations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.bookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucune réservation
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/booking/${booking.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{booking.service}</span>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          {new Date(booking.date).toLocaleDateString("fr-FR")}
                        </span>
                        <span>{booking.time}</span>
                        {booking.resource && (
                          <Badge variant="secondary" className="text-xs">
                            {booking.resource.name}
                          </Badge>
                        )}
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground">
                          {booking.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(booking.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
