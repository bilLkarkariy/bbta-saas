"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  ShoppingBag,
  Package,
  MapPin,
  CreditCard,
  Plug,
  Check,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntegrationProvider, IntegrationCategory } from "@/lib/integrations/types";
import { getStatusColor, getStatusLabel, type IntegrationStatus } from "@/lib/integrations/registry";

const categoryIcons: Record<IntegrationCategory, React.ElementType> = {
  messaging: Plug,
  calendar: Calendar,
  booking: Calendar,
  crm: Plug,
  payment: CreditCard,
  shipping: Package,
  ecommerce: ShoppingBag,
  maps: MapPin,
};

interface IntegrationCardProps {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastCheckedAt?: Date | null;
  onConnect: (credentials: Record<string, string>) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onTest?: () => Promise<void>;
}

export function IntegrationCard({
  provider,
  status,
  lastCheckedAt,
  onConnect,
  onDisconnect,
  onTest,
}: IntegrationCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CategoryIcon = categoryIcons[provider.category] || Plug;

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onConnect(credentials);
      setShowDialog(false);
      setCredentials({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await onDisconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    setIsLoading(true);
    try {
      await onTest();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className={cn(
        "transition-all",
        status === "connected" && "border-green-200 bg-green-50/30"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                status === "connected" ? "bg-green-100" : "bg-muted"
              )}>
                <CategoryIcon className={cn(
                  "h-5 w-5",
                  status === "connected" ? "text-green-600" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <CardTitle className="text-base">{provider.name}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {provider.description}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs", getStatusColor(status))}
            >
              {status === "connected" && <Check className="h-3 w-3 mr-1" />}
              {status === "error" && <X className="h-3 w-3 mr-1" />}
              {getStatusLabel(status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {lastCheckedAt && (
              <p className="text-xs text-muted-foreground">
                Dernière vérification : {lastCheckedAt.toLocaleDateString("fr-FR")}
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              {status === "connected" ? (
                <>
                  {onTest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTest}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Tester"
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Déconnecter
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowDialog(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Connecter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5" />
              Connecter {provider.name}
            </DialogTitle>
            <DialogDescription>
              Entrez vos identifiants pour connecter {provider.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {provider.credentialFields.map((field) => (
              <div key={String(field.key)} className="space-y-2">
                <Label htmlFor={String(field.key)}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={String(field.key)}
                  type={field.type === "password" ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={credentials[String(field.key)] || ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      [String(field.key)]: e.target.value,
                    }))
                  }
                />
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Connecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Quick action button for integration setup
interface IntegrationQuickActionProps {
  provider: IntegrationProvider;
  onClick: () => void;
}

export function IntegrationQuickAction({ provider, onClick }: IntegrationQuickActionProps) {
  const CategoryIcon = categoryIcons[provider.category] || Plug;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left w-full"
    >
      <div className="p-2 rounded-lg bg-muted">
        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{provider.name}</p>
        <p className="text-xs text-muted-foreground truncate">{provider.description}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
