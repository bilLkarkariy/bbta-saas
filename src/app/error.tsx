"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error tracking service (Sentry, etc.)
    console.error("Application error:", error);

    // If Sentry is configured, uncomment:
    // Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E6EE] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        {/* Error message */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Une erreur est survenue
        </h1>
        <p className="text-slate-600 mb-2">
          Nous sommes desoles, quelque chose s&apos;est mal passe.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono mb-6">
            Code: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reessayer
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.location.href = "/"}
          >
            <Home className="h-4 w-4" />
            Retour a l&apos;accueil
          </Button>
        </div>

        {/* Additional help */}
        <p className="mt-8 text-sm text-slate-500">
          Si le probleme persiste, contactez notre support a{" "}
          <a
            href="mailto:support@lumelia.io"
            className="text-primary hover:underline"
          >
            support@lumelia.io
          </a>
        </p>
      </div>
    </div>
  );
}
