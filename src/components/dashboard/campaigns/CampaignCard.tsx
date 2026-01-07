"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  XCircle,
  Trash2,
  Users,
  CheckCircle,
  MessageSquare,
  Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/shared";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount: number;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  template: { name: string } | null;
  segment: { name: string } | null;
  _count: { recipients: number };
}

interface CampaignCardProps {
  campaign: Campaign;
  onView: () => void;
  onEdit: () => void;
  onSend: () => void;
  onCancel: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function CampaignCard({
  campaign,
  onView,
  onEdit,
  onSend,
  onCancel,
  onDelete,
  disabled,
}: CampaignCardProps) {
  const isSent = campaign.status === "sent" || campaign.status === "sending";
  const canSend = campaign.status === "draft" || campaign.status === "scheduled";
  const canCancel = campaign.status === "scheduled";

  // Calculate delivery progress
  const deliveryRate = campaign.totalRecipients > 0
    ? Math.round((campaign.deliveredCount / campaign.totalRecipients) * 100)
    : 0;

  const readRate = campaign.deliveredCount > 0
    ? Math.round((campaign.readCount / campaign.deliveredCount) * 100)
    : 0;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{campaign.name}</h3>
            <StatusBadge status={campaign.status} />
          </div>

          {campaign.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {campaign.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {campaign._count.recipients} destinataire{campaign._count.recipients !== 1 ? "s" : ""}
            </span>
            {campaign.template && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {campaign.template.name}
              </span>
            )}
            {campaign.scheduledAt && campaign.status === "scheduled" && (
              <span className="flex items-center gap-1 text-primary">
                <Clock className="h-3 w-3" />
                Planifiée pour {formatDistanceToNow(new Date(campaign.scheduledAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            )}
            {campaign.sentAt && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Envoyée {formatDistanceToNow(new Date(campaign.sentAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSend && (
            <Button size="sm" onClick={onSend} disabled={disabled}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              {!isSent && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem onClick={onCancel}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Analytics for sent campaigns */}
      {isSent && campaign.totalRecipients > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{campaign.sentCount}</p>
              <p className="text-xs text-muted-foreground">Envoyés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{campaign.deliveredCount}</p>
              <p className="text-xs text-muted-foreground">Livrés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{campaign.readCount}</p>
              <p className="text-xs text-muted-foreground">Lus</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">{campaign.repliedCount}</p>
              <p className="text-xs text-muted-foreground">Réponses</p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Taux de livraison</span>
              <span className="font-medium">{deliveryRate}%</span>
            </div>
            <Progress value={deliveryRate} className="h-1.5" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Taux de lecture</span>
              <span className="font-medium">{readRate}%</span>
            </div>
            <Progress value={readRate} className="h-1.5" />
          </div>
        </div>
      )}
    </Card>
  );
}
