"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, LucideIcon } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  error?: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: "default" | "card" | "inline";
}

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Impossible de charger les donnees. Veuillez reessayer.",
  icon: Icon = AlertTriangle,
  error,
  onRetry,
  retryLabel = "Reessayer",
  className,
  variant = "default",
}: ErrorStateProps) {
  const errorMessage = typeof error === "string" ? error : error?.message;

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "inline" ? "py-4" : "py-8",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-destructive/10 flex items-center justify-center mb-4",
          variant === "inline" ? "h-10 w-10" : "h-14 w-14"
        )}
      >
        <Icon
          className={cn(
            "text-destructive",
            variant === "inline" ? "h-5 w-5" : "h-7 w-7"
          )}
        />
      </div>

      <h3
        className={cn(
          "font-semibold text-foreground mb-1",
          variant === "inline" ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "text-muted-foreground max-w-sm",
          variant === "inline" ? "text-xs mb-3" : "text-sm mb-4"
        )}
      >
        {description}
      </p>

      {errorMessage && variant !== "inline" && (
        <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1 rounded mb-4 max-w-sm truncate">
          {errorMessage}
        </p>
      )}

      {onRetry && (
        <Button
          variant="outline"
          size={variant === "inline" ? "sm" : "default"}
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={cn("p-6", className)}>
        {content}
      </Card>
    );
  }

  return content;
}
