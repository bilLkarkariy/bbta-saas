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
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingActions } from "./BookingActions";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

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
  isRecurring?: boolean;
  recurrenceRule?: string;
}

interface BookingListProps {
  bookings: Booking[];
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReschedule?: () => void;
  loading?: boolean;
}

export function BookingList({
  bookings,
  onStatusUpdate,
  onDelete,
  onReschedule,
  loading,
}: BookingListProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card className="glass shadow-layered">
        <CardContent className="p-[var(--dashboard-card-padding)]">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des réservations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="glass shadow-layered">
        <CardContent className="p-[var(--dashboard-card-padding)]">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune réservation trouvée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass shadow-layered overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-label">Date</TableHead>
                <TableHead className="text-label">Heure</TableHead>
                <TableHead className="text-label">Client</TableHead>
                <TableHead className="text-label">Service</TableHead>
                <TableHead className="text-label">Statut</TableHead>
                <TableHead className="text-label text-center">Rappel</TableHead>
                <TableHead className="text-label text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/booking/${booking.id}`)}
                >
                  <TableCell className="font-medium">
                    {new Date(booking.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{booking.time}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {booking.customerName || "—"}
                      </p>
                      <Link
                        href={`/dashboard/customers/${encodeURIComponent(booking.customerPhone)}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {booking.customerPhone}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{booking.service}</span>
                      {booking.isRecurring && (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {booking.recurrenceRule === "weekly"
                            ? "Hebdo"
                            : booking.recurrenceRule === "biweekly"
                            ? "Bimensuel"
                            : booking.recurrenceRule === "monthly"
                            ? "Mensuel"
                            : "Récurrent"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {booking.reminderSent ? (
                      <Badge
                        variant="default"
                        className="bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Envoyé
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted/50">
                        <XCircle className="h-3 w-3 mr-1" />
                        Non envoyé
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <BookingActions
                      booking={{
                        ...booking,
                        reminderSent: booking.reminderSent,
                      }}
                      onStatusUpdate={onStatusUpdate}
                      onDelete={onDelete}
                      onReschedule={onReschedule}
                      onReminderSent={onReschedule}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
