"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Une erreur s&apos;est produite
            </h1>
            <p className="mt-2 text-gray-600">
              Nous avons ete informes et travaillons a resoudre le probleme.
            </p>
            {error.digest && (
              <p className="mt-1 text-sm text-gray-400">
                Reference: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={reset} variant="default">
              Reessayer
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              Retour a l&apos;accueil
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
