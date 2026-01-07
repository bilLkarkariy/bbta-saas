"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    <Card className="glass-card p-5 group/card border-none relative overflow-hidden">
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-slate-700 truncate text-base">{campaign.name}</h3>
            <StatusBadge status={campaign.status} />
          </div>

          {campaign.description && (
            <p className="text-sm text-slate-500 mb-4 line-clamp-1 max-w-2xl">
              {campaign.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/30 text-slate-500">
              <Users className="h-3.5 w-3.5" />
              {campaign._count.recipients} destinataires
            </span>
            {campaign.template && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/30 text-slate-500">
                <MessageSquare className="h-3.5 w-3.5" />
                {campaign.template.name}
              </span>
            )}
            {campaign.scheduledAt && campaign.status === "scheduled" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="h-3.5 w-3.5" />
                Planifiée {formatDistanceToNow(new Date(campaign.scheduledAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            )}
            {campaign.sentAt && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
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
            <Button
              size="sm"
              onClick={onSend}
              disabled={disabled}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Send className="h-4 w-4 mr-2" />
              Lancer
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/60 rounded-xl" disabled={disabled}>
                <MoreHorizontal className="h-5 w-5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-white/40 shadow-xl min-w-[180px]">
              <DropdownMenuItem onClick={onView} className="hover:bg-white/80 rounded-lg py-2 cursor-pointer">
                <Eye className="h-4 w-4 mr-2 text-slate-500" />
                Voir les détails
              </DropdownMenuItem>
              {!isSent && (
                <DropdownMenuItem onClick={onEdit} className="hover:bg-white/80 rounded-lg py-2 cursor-pointer">
                  <Pencil className="h-4 w-4 mr-2 text-slate-500" />
                  Modifier
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem onClick={onCancel} className="hover:bg-white/80 rounded-lg py-2 cursor-pointer text-amber-600">
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/40" />
              <DropdownMenuItem onClick={onDelete} className="text-destructive hover:bg-red-50 hover:text-red-600 rounded-lg py-2 cursor-pointer">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Analytics for sent campaigns */}
      {isSent && campaign.totalRecipients > 0 && (
        <div className="mt-6 pt-5 border-t border-white/40">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Envoyés", value: campaign.sentCount, color: "slate" },
              { label: "Livrés", value: campaign.deliveredCount, color: "emerald", rate: deliveryRate },
              { label: "Lus", value: campaign.readCount, color: "blue", rate: readRate },
              { label: "Réponses", value: campaign.repliedCount, color: "violet" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/30 hover:bg-white p-3 rounded-2xl transition-all duration-300 group/stat">
                <p className={cn(
                  "text-xl font-bold transition-all",
                  stat.color === "emerald" && "text-emerald-600",
                  stat.color === "blue" && "text-blue-600",
                  stat.color === "violet" && "text-violet-600",
                  stat.color === "slate" && "text-slate-600"
                )}>
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-1">
                <span className="text-slate-400">Taux de livraison</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{deliveryRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  style={{ width: `${deliveryRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-1">
                <span className="text-slate-400">Taux de lecture</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{readRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  style={{ width: `${readRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
