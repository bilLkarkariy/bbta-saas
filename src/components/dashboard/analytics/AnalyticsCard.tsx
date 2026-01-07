"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  loading?: boolean;
  format?: "number" | "currency" | "percent" | "time";
}

export function AnalyticsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  description,
  loading,
  format = "number",
}: AnalyticsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(val);
      case "percent":
        return `${val.toFixed(1)}%`;
      case "time":
        // Convert ms to human readable
        if (val < 1000) return `${val}ms`;
        if (val < 60000) return `${(val / 1000).toFixed(1)}s`;
        return `${Math.round(val / 60000)}min`;
      default:
        return val.toLocaleString("fr-FR");
    }
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0)
      return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <Card className="glass-card border-none">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-none hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-label flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-stat-secondary text-foreground">
          {formatValue(value)}
        </div>
        {(change !== undefined || description) && (
          <div className="mt-1 flex items-center gap-2">
            {change !== undefined && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                  change > 0
                    ? "bg-success/10 text-success"
                    : change < 0
                    ? "bg-error/10 text-error"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {getTrendIcon()}
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
                {changeLabel && (
                  <span className="text-muted-foreground ml-1">{changeLabel}</span>
                )}
              </span>
            )}
            {description && (
              <span className="text-meta">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
