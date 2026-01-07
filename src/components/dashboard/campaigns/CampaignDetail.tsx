"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Send, Users, CheckCircle, Eye, MessageSquare, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Recipient {
  id: string;
  status: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  contact: {
    id: string;
    name: string | null;
    phone: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  customMessage: string | null;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount: number;
  scheduledAt: Date | null;
  sentAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  template: { id: string; name: string; content: string } | null;
  segment: { id: string; name: string } | null;
  recipients: Recipient[];
}

interface CampaignDetailProps {
  campaign: Campaign;
}

export function CampaignDetail({ campaign }: CampaignDetailProps) {
  const router = useRouter();

  const messageContent = campaign.template?.content || campaign.customMessage || "";

  // Calculate rates
  const deliveryRate = campaign.totalRecipients > 0
    ? Math.round((campaign.deliveredCount / campaign.totalRecipients) * 100)
    : 0;
  const readRate = campaign.deliveredCount > 0
    ? Math.round((campaign.readCount / campaign.deliveredCount) * 100)
    : 0;
  const replyRate = campaign.deliveredCount > 0
    ? Math.round((campaign.repliedCount / campaign.deliveredCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="text-muted-foreground">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.totalRecipients}</p>
              <p className="text-xs text-muted-foreground">Destinataires</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.deliveredCount}</p>
              <p className="text-xs text-muted-foreground">Livrés ({deliveryRate}%)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.readCount}</p>
              <p className="text-xs text-muted-foreground">Lus ({readRate}%)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.repliedCount}</p>
              <p className="text-xs text-muted-foreground">Réponses ({replyRate}%)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress bars */}
      {campaign.status === "sent" && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux de livraison</span>
                <span className="font-medium">{deliveryRate}%</span>
              </div>
              <Progress value={deliveryRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux de lecture</span>
                <span className="font-medium">{readRate}%</span>
              </div>
              <Progress value={readRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux de réponse</span>
                <span className="font-medium">{replyRate}%</span>
              </div>
              <Progress value={replyRate} className="h-2" />
            </div>
          </div>
        </Card>
      )}

      {/* Message content */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Message</h3>
        {campaign.template && (
          <p className="text-sm text-muted-foreground mb-2">
            Modèle: {campaign.template.name}
          </p>
        )}
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
          {messageContent}
        </div>
      </Card>

      {/* Recipients table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Destinataires</h3>
          {campaign.failedCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {campaign.failedCount} échec{campaign.failedCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Envoyé</TableHead>
              <TableHead>Lu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaign.recipients.map((recipient) => (
              <TableRow key={recipient.id}>
                <TableCell className="font-medium">
                  {recipient.contact.name || "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {recipient.contact.phone}
                </TableCell>
                <TableCell>
                  <StatusBadge status={recipient.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {recipient.sentAt
                    ? formatDistanceToNow(new Date(recipient.sentAt), { addSuffix: true, locale: fr })
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {recipient.readAt
                    ? formatDistanceToNow(new Date(recipient.readAt), { addSuffix: true, locale: fr })
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
