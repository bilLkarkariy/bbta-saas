"use client";

import { Card } from "@/components/ui/card";
import { TwilioCard } from "./TwilioCard";
import { WebhookCard } from "./WebhookCard";

interface Integration {
  id: string;
  type: string;
  name: string;
  status: string;
  lastCheckedAt: Date | null;
  lastError: string | null;
  credentials: unknown;
  config: unknown;
  usageThisMonth: number;
  usageLimit: number | null;
}

interface IntegrationsPageProps {
  integrations: Integration[];
  webhookUrl: string;
}

export function IntegrationsPage({ integrations, webhookUrl }: IntegrationsPageProps) {
  const twilioIntegration = integrations.find((i) => i.type === "twilio");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Intégrations</h1>
        <p className="text-muted-foreground">
          Connectez vos services de messagerie pour envoyer des messages WhatsApp
        </p>
      </div>

      {/* Integration cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <TwilioCard integration={twilioIntegration || null} />
        <WebhookCard webhookUrl={webhookUrl} />
      </div>

      {/* Usage stats */}
      {twilioIntegration && twilioIntegration.status === "connected" && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Utilisation ce mois</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{twilioIntegration.usageThisMonth}</p>
              <p className="text-sm text-muted-foreground">Messages envoyés</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {twilioIntegration.usageLimit ? `${twilioIntegration.usageLimit}` : "∞"}
              </p>
              <p className="text-sm text-muted-foreground">Limite mensuelle</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {twilioIntegration.usageLimit
                  ? `${Math.round((twilioIntegration.usageThisMonth / twilioIntegration.usageLimit) * 100)}%`
                  : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Quota utilisé</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
