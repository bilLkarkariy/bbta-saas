"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  bookingId?: string;
  booking?: {
    id: string;
    customerName: string | null;
    customerPhone: string;
    service: string;
    date: string;
    time: string;
    status: string;
  };
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch notifications when opening
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Connect to SSE for real-time updates (only once on mount)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/notifications/stream");

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "unread_count") {
          setUnreadCount(data.count);
        } else if (data.type === "new_notification") {
          setUnreadCount((prev) => prev + 1);
          // Note: fetchNotifications() is handled separately in the popover open effect
        }
      };

      eventSource.onerror = () => {
        console.error("SSE connection error");
        eventSource?.close();
        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      eventSource?.close();
    };
  }, []); // Empty dependency array - only connect once

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Erreur lors du marquage comme lu");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      toast.success("Toutes les notifications marquées comme lues");
    } catch (error) {
      toast.error("Erreur lors du marquage");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.bookingId) {
      router.push(`/dashboard/booking/${notification.bookingId}`);
      setOpen(false);

      if (!notification.isRead) {
        handleMarkAsRead(notification.id);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    // Return different icons based on notification type
    return <Bell className="h-4 w-4" />;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_booking":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "booking_cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "booking_updated":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "no_show":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout marquer lu
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group ${
                    !notification.isRead ? "bg-muted/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className={`mt-1 ${getNotificationColor(notification.type)}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>

                      {notification.booking && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {notification.booking.customerName || notification.booking.customerPhone} •{" "}
                          {notification.booking.service}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
