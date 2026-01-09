import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Phone, MessageSquare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getCurrentTenant } from "@/lib/auth";
import { getBookingById } from "@/lib/queries/bookings";
import { BookingStatusBadge } from "@/components/dashboard/bookings/BookingStatusBadge";
import { BookingDetailClient } from "@/components/dashboard/bookings/BookingDetailClient";
import { BookingDetailActions } from "@/components/dashboard/bookings/BookingDetailActions";
import { PaymentTracking } from "@/components/dashboard/bookings/PaymentTracking";
import { RecurringSeriesInfo } from "@/components/dashboard/bookings/RecurringSeriesInfo";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { tenantId } = await getCurrentTenant();
  const { id } = await params;

  const booking = await getBookingById(id, tenantId);

  if (!booking) {
    notFound();
  }

  return (
    <div className="w-full max-w-full space-y-[var(--dashboard-section-gap)]">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/booking">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Détails de la réservation
            </h1>
            <p className="text-sm text-muted-foreground">
              {booking.customerName || booking.customerPhone}
            </p>
          </div>
        </div>
        <BookingDetailActions
          booking={{
            id: booking.id,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            service: booking.service,
            date: booking.date,
            time: booking.time,
            status: booking.status,
          }}
        />
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[var(--dashboard-section-gap)]">
        {/* Main Content */}
        <div className="space-y-[var(--dashboard-section-gap)]">
          {/* Booking Info Card */}
          <Card className="glass shadow-layered">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading">Informations</CardTitle>
                <BookingStatusBadge status={booking.status as any} />
              </div>
            </CardHeader>
            <CardContent className="p-[var(--dashboard-card-padding)] space-y-6">
              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Date</p>
                  </div>
                  <p className="text-body-strong">
                    {new Date(booking.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Heure</p>
                  </div>
                  <p className="text-body-strong">{booking.time}</p>
                </div>
              </div>

              <Separator />

              {/* Service */}
              <div className="space-y-1.5">
                <p className="text-label">Service</p>
                <p className="text-body-strong">{booking.service}</p>
              </div>

              {/* Resource */}
              {booking.resource && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-label">Ressource</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.resource.color && (
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: booking.resource.color }}
                        />
                      )}
                      <p className="text-body-strong">{booking.resource.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {booking.resource.type === "staff" ? "Personnel" :
                         booking.resource.type === "room" ? "Salle" : "Équipement"}
                      </Badge>
                    </div>
                  </div>
                </>
              )}

              {/* Reminder Status */}
              <Separator />
              <div className="space-y-1.5">
                <p className="text-label">Statut du rappel</p>
                <p className="text-body-strong">
                  {booking.reminderSent ? (
                    <span className="text-green-600">
                      Envoyé le{" "}
                      {booking.reminderSentAt
                        ? new Date(booking.reminderSentAt).toLocaleString("fr-FR")
                        : "—"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Non envoyé</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card - Client Component */}
          <BookingDetailClient bookingId={booking.id} initialNotes={booking.notes} />

          {/* Conversation Card */}
          {booking.conversation && (
            <Card className="glass shadow-layered">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-heading flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversation liée
                </CardTitle>
              </CardHeader>
              <CardContent className="p-[var(--dashboard-card-padding)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-strong">{booking.conversation.customerPhone}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.conversation.messages.length} message(s)
                    </p>
                  </div>
                  <Link href={`/dashboard/conversations/${booking.conversation.id}`}>
                    <Button variant="outline" size="sm">
                      Voir conversation
                    </Button>
                  </Link>
                </div>

                {/* Recent Messages */}
                {booking.conversation.messages.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-label">Messages récents</p>
                      {booking.conversation.messages.slice(0, 3).map((message) => (
                        <div
                          key={message.id}
                          className="text-sm p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <p className="text-body">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.createdAt).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-[var(--dashboard-section-gap)]">
          {/* Payment Tracking */}
          <PaymentTracking
            bookingId={booking.id}
            initialAmount={booking.amount ? Number(booking.amount) : null}
            initialCurrency={booking.currency}
            initialPaymentStatus={booking.paymentStatus}
            initialPaymentMethod={booking.paymentMethod}
            initialPaidAt={booking.paidAt}
          />

          {/* Recurring Series Info */}
          <RecurringSeriesInfo
            bookingId={booking.id}
            isRecurring={booking.isRecurring || false}
            recurrenceRule={booking.recurrenceRule || undefined}
            recurrenceEndDate={booking.recurrenceEndDate || undefined}
            isParent={!booking.parentBookingId}
            parentBookingId={booking.parentBookingId || undefined}
          />

          {/* Customer Info */}
          <Card className="glass shadow-layered">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-heading">Client</CardTitle>
            </CardHeader>
            <CardContent className="p-[var(--dashboard-card-padding)] space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-label">Nom</p>
                </div>
                <p className="text-body-strong">
                  {booking.customerName || "Non renseigné"}
                </p>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-label">Téléphone</p>
                </div>
                <p className="text-body-strong">{booking.customerPhone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="glass shadow-layered">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-heading">Historique</CardTitle>
            </CardHeader>
            <CardContent className="p-[var(--dashboard-card-padding)] space-y-3">
              <div className="space-y-1">
                <p className="text-label">Créée le</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(booking.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-label">Dernière mise à jour</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(booking.updatedAt).toLocaleString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
