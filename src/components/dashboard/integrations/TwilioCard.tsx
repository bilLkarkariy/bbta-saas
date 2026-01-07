"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Unplug, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, ConfirmDialog } from "@/components/shared";
import {
  updateTwilioCredentials,
  testTwilioConnection,
  disconnectIntegration,
} from "@/app/(dashboard)/dashboard/integrations/actions";

interface Integration {
  id: string;
  type: string;
  name: string;
  status: string;
  lastCheckedAt: Date | null;
  lastError: string | null;
  credentials: unknown;
  config: unknown;
}

interface TwilioCardProps {
  integration: Integration | null;
}

export function TwilioCard({ integration }: TwilioCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(
    (integration?.config as { whatsappNumber?: string })?.whatsappNumber || ""
  );

  const isConnected = integration?.status === "connected";
  const hasCredentials = !!(integration?.credentials);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("accountSid", accountSid);
      formData.append("authToken", authToken);
      formData.append("whatsappNumber", whatsappNumber);

      const result = await updateTwilioCredentials(formData);

      if (result.success) {
        toast.success("Identifiants sauvegardés");
        setAccountSid("");
        setAuthToken("");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleTest = () => {
    setIsTesting(true);
    startTransition(async () => {
      const result = await testTwilioConnection();

      if (result.success) {
        toast.success(`Connecté à ${result.account}`);
      } else {
        toast.error(result.error);
      }
      setIsTesting(false);
    });
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectIntegration("twilio");

      if (result.success) {
        toast.success("Déconnecté");
      } else {
        toast.error(result.error);
      }
      setShowDisconnectConfirm(false);
    });
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#F22F46]/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-[#F22F46]" />
            </div>
            <div>
              <h3 className="font-semibold">Twilio WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Envoyez des messages via WhatsApp Business API
              </p>
            </div>
          </div>
          <StatusBadge status={integration?.status || "disconnected"} />
        </div>

        {integration?.lastError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {integration.lastError}
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Connecté et opérationnel</span>
            </div>

            <div className="space-y-2">
              <Label>Numéro WhatsApp</Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+33612345678"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isPending || isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  "Tester la connexion"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDisconnectConfirm(true)}
                disabled={isPending}
              >
                <Unplug className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountSid">Account SID</Label>
              <Input
                id="accountSid"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">Numéro WhatsApp</Label>
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+33612345678"
              />
              <p className="text-xs text-muted-foreground">
                Le numéro configuré dans votre sandbox Twilio WhatsApp
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isPending || !accountSid || !authToken}
                className="flex-1"
              >
                {isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              {hasCredentials && (
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={isPending || isTesting}
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tester"}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Trouvez vos identifiants dans la{" "}
              <a
                href="https://console.twilio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console Twilio
              </a>
            </p>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
        title="Déconnecter Twilio"
        description="Voulez-vous vraiment déconnecter Twilio ? Vos identifiants seront supprimés."
        confirmLabel="Déconnecter"
        onConfirm={handleDisconnect}
        variant="destructive"
      />
    </>
  );
}
