"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Webhook, Info } from "lucide-react";
import { CopyButton } from "@/components/shared";

interface WebhookCardProps {
  webhookUrl: string;
}

export function WebhookCard({ webhookUrl }: WebhookCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Webhook className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Webhook</h3>
          <p className="text-sm text-muted-foreground">
            URL à configurer dans Twilio pour recevoir les messages
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>URL du webhook</Label>
          <div className="flex items-center gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-sm" />
            <CopyButton value={webhookUrl} />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Configuration Twilio</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Allez dans la console Twilio</li>
                <li>Messaging {">"} Settings {">"} WhatsApp sandbox</li>
                <li>Copiez l&apos;URL ci-dessus dans &quot;When a message comes in&quot;</li>
                <li>Méthode: POST</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-sm">
            <span className="font-medium">Conseil:</span> Pour le développement local, utilisez{" "}
            <a
              href="https://ngrok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ngrok
            </a>{" "}
            pour exposer votre serveur local.
          </p>
        </div>
      </div>
    </Card>
  );
}
