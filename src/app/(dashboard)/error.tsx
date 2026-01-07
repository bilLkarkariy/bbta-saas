"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to error tracking service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E6EE] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center glass-card">
        {/* Error icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        {/* Error message */}
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Erreur du tableau de bord
        </h1>
        <p className="text-slate-600 mb-2">
          Une erreur est survenue lors du chargement de cette section.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono mb-6">
            Reference: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Recharger la page
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <Home className="h-4 w-4" />
            Retour au dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => router.push("/")}
          >
            <LogOut className="h-4 w-4" />
            Deconnexion
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-6 text-xs text-slate-400">
          Si le probleme persiste, rafraichissez la page ou contactez le support.
        </p>
      </Card>
    </div>
  );
}
