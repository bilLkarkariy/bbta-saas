"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Send, Users, CheckCircle, Eye, MessageSquare, AlertCircle, FileEdit, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-12 w-12 rounded-2xl bg-white/30 border-white/40 hover:bg-white text-slate-500 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-800">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="text-slate-500 font-medium mt-1">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Destinataires", value: campaign.totalRecipients, icon: Users, color: "primary", bg: "bg-primary/10", text: "text-primary" },
          { label: "Livrés", value: campaign.deliveredCount, icon: CheckCircle, color: "emerald", bg: "bg-emerald-500/10", text: "text-emerald-500", suffix: `${deliveryRate}%` },
          { label: "Lus", value: campaign.readCount, icon: Eye, color: "blue", bg: "bg-blue-500/10", text: "text-blue-500", suffix: `${readRate}%` },
          { label: "Réponses", value: campaign.repliedCount, icon: MessageSquare, color: "violet", bg: "bg-violet-500/10", text: "text-violet-500", suffix: `${replyRate}%` },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card p-5 border-none group hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.text)} />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-700">{stat.value}</p>
                  {stat.suffix && <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-white/60 shadow-sm", stat.text)}>{stat.suffix}</span>}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
        <div className="space-y-8">
          {/* Progress bars */}
          {campaign.status === "sent" && (
            <Card className="glass-card p-8 border-none">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 border-b border-white/20 pb-4">Performance Directe</h3>
              <div className="space-y-6">
                {[
                  { label: "Taux de livraison", value: deliveryRate, color: "emerald" },
                  { label: "Taux de lecture", value: readRate, color: "blue" },
                  { label: "Taux de réponse", value: replyRate, color: "violet" },
                ].map((p) => (
                  <div key={p.label} className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-sm font-bold text-slate-600">{p.label}</span>
                      <span className={cn("text-xs font-black px-2 py-1 rounded-lg bg-white/60 shadow-sm", `text-${p.color}-600`)}>{p.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", `bg-${p.color}-500 shadow-[0_0_8px_rgba(var(--${p.color}-500),0.3)]`)}
                        style={{ width: `${p.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recipients table */}
          <Card className="glass-card p-6 border-none">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Suivi Destinataires</h3>
              {campaign.failedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {campaign.failedCount} échecs
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/40 overflow-hidden bg-white/20">
              <Table>
                <TableHeader className="bg-white/40">
                  <TableRow className="hover:bg-transparent border-white/40">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">Contact</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Statut</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Dernière Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.recipients.map((recipient) => (
                    <TableRow key={recipient.id} className="hover:bg-white/40 border-white/20 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{recipient.contact.name || "Appelant Inconnu"}</span>
                          <span className="text-[11px] text-slate-400 font-medium font-mono tracking-tight">{recipient.contact.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={recipient.status} />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-500">
                            {recipient.readAt ? "Message lu" : recipient.deliveredAt ? "Livré" : recipient.sentAt ? "Envoyé" : "En attente"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {recipient.readAt
                              ? formatDistanceToNow(new Date(recipient.readAt), { addSuffix: true, locale: fr })
                              : recipient.sentAt
                                ? formatDistanceToNow(new Date(recipient.sentAt), { addSuffix: true, locale: fr })
                                : "—"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaign.recipients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center text-slate-400 font-medium italic">
                        Aucun destinataire pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card p-6 border-none">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 border-b border-white/20 pb-4">Configuration</h3>

            {campaign.template && (
              <div className="mb-6 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Modèle utilisé</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{campaign.template.name}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contenu du message</span>
              <div className="bg-white/40 rounded-2xl p-5 border border-white/60 relative group">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileEdit className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                  &quot;{messageContent}&quot;
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <Card className="bg-white/20 p-4 border border-white/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Créée le</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{new Date(campaign.createdAt).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </Card>

              {campaign.sentAt && (
                <Card className="bg-white/20 p-4 border border-white/40 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Send className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Envoyée le</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{new Date(campaign.sentAt).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          <Card className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-2xl shadow-indigo-200 border-none relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-black mb-2 leading-tight">Campagne Optimal</h4>
              <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">
                Votre taux de lecture dépasse la moyenne du secteur de 15%. Continuez comme ça !
              </p>
              <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl h-11 border-none shadow-lg">
                Exporter PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
