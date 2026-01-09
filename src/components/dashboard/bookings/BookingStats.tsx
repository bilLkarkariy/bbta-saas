"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CalendarCheck, AlertTriangle, TrendingUp, Euro, CreditCard, XCircle } from "lucide-react";
import { BookingStats as BookingStatsType } from "@/lib/queries/bookings";

interface BookingStatsProps {
  stats: BookingStatsType;
}

export function BookingStats({ stats }: BookingStatsProps) {
  const statCards = [
    {
      title: "Total ce mois",
      value: stats.totalThisMonth,
      icon: Calendar,
      className: "bg-primary/5 border-primary/10",
      iconClassName: "text-primary",
    },
    {
      title: "En attente",
      value: stats.pendingCount,
      icon: Clock,
      className: "bg-yellow-500/5 border-yellow-500/10",
      iconClassName: "text-yellow-600",
    },
    {
      title: "Aujourd'hui",
      value: stats.todayCount,
      icon: CalendarCheck,
      className: "bg-blue-500/5 border-blue-500/10",
      iconClassName: "text-blue-600",
    },
    {
      title: "7 prochains jours",
      value: stats.upcomingNext7Days,
      icon: TrendingUp,
      className: "bg-green-500/5 border-green-500/10",
      iconClassName: "text-green-600",
    },
    {
      title: "Taux no-show",
      value: `${stats.noShowRate}%`,
      icon: AlertTriangle,
      className:
        stats.noShowRate > 10
          ? "bg-destructive/5 border-destructive/10"
          : "bg-green-500/5 border-green-500/10",
      iconClassName:
        stats.noShowRate > 10 ? "text-destructive" : "text-green-600",
    },
    // Payment stats
    {
      title: "Revenu total",
      value: `${stats.totalRevenue.toFixed(2)}€`,
      icon: Euro,
      className: "bg-emerald-500/5 border-emerald-500/10",
      iconClassName: "text-emerald-600",
    },
    {
      title: "Payés",
      value: stats.paidCount,
      icon: CreditCard,
      className: "bg-green-500/5 border-green-500/10",
      iconClassName: "text-green-600",
    },
    {
      title: "Non payés",
      value: stats.unpaidCount,
      icon: XCircle,
      className: "bg-red-500/5 border-red-500/10",
      iconClassName: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className={`glass shadow-layered border ${stat.className}`}
        >
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-label text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-5 w-5 ${stat.iconClassName}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
