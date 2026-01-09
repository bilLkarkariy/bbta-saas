import { Badge } from "@/components/ui/badge";
import { Clock, Check, X, CheckCircle, AlertTriangle } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "En attente",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  confirmed: {
    label: "Confirmé",
    variant: "default" as const,
    icon: Check,
    className: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  },
  cancelled: {
    label: "Annulé",
    variant: "destructive" as const,
    icon: X,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  completed: {
    label: "Terminé",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  no_show: {
    label: "No-show",
    variant: "secondary" as const,
    icon: AlertTriangle,
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
};

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className || ""}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
