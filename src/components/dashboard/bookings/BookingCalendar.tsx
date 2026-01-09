"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

interface BookingCalendarProps {
  bookings: Booking[];
  onDateClick?: (date: string) => void;
}

export function BookingCalendar({ bookings, onDateClick }: BookingCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar data
  const { year, month, firstDay, daysInMonth, daysInPreviousMonth } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();

    return { year, month, firstDay, daysInMonth, daysInPreviousMonth };
  }, [currentDate]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      if (!grouped[booking.date]) {
        grouped[booking.date] = [];
      }
      grouped[booking.date].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Array<{
      date: number;
      isCurrentMonth: boolean;
      dateString: string;
      isToday: boolean;
    }> = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPreviousMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        dateString: date.toISOString().split("T")[0],
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const dateString = date.toISOString().split("T")[0];
      days.push({
        date: day,
        isCurrentMonth: true,
        dateString,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Next month days to fill grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        dateString: date.toISOString().split("T")[0],
        isToday: false,
      });
    }

    return days;
  }, [year, month, firstDay, daysInMonth, daysInPreviousMonth]);

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  return (
    <Card className="glass shadow-layered">
      <CardHeader className="border-b border-border p-[var(--dashboard-card-padding)]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, idx) => {
            const dayBookings = bookingsByDate[day.dateString] || [];
            const hasBookings = dayBookings.length > 0;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r border-border cursor-pointer hover:bg-muted/30 transition-colors",
                  !day.isCurrentMonth && "bg-muted/10 text-muted-foreground",
                  day.isToday && "bg-primary/5",
                  idx % 7 === 6 && "border-r-0"
                )}
                onClick={() => onDateClick && onDateClick(day.dateString)}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium mb-1",
                    day.isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {day.date}
                </div>

                {/* Bookings */}
                {hasBookings && (
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="text-xs p-1 rounded bg-muted/50 border border-border hover:border-primary transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/booking/${booking.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium truncate">
                            {booking.time}
                          </span>
                          <BookingStatusBadge
                            status={booking.status}
                            className="scale-75 origin-right"
                          />
                        </div>
                        <div className="text-muted-foreground truncate">
                          {booking.customerName || booking.customerPhone}
                        </div>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-center text-muted-foreground">
                        +{dayBookings.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
