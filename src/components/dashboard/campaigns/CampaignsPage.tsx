"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Megaphone, Plus, Clock, CheckCircle, XCircle, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { CampaignCard } from "./CampaignCard";
import { deleteCampaign, sendCampaign, cancelCampaign } from "@/app/(dashboard)/dashboard/campaigns/actions";

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

interface CampaignsPageProps {
  initialCampaigns: Campaign[];
}

const statusTabs = [
  { value: "all", label: "Toutes", icon: Megaphone },
  { value: "draft", label: "Brouillons", icon: FileEdit },
  { value: "scheduled", label: "Planifiées", icon: Clock },
  { value: "sent", label: "Envoyées", icon: CheckCircle },
  { value: "cancelled", label: "Annulées", icon: XCircle },
];

export function CampaignsPage({ initialCampaigns }: CampaignsPageProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredCampaigns = campaigns.filter(
    (c) => selectedStatus === "all" || c.status === selectedStatus
  );

  const statusCounts = campaigns.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      acc.all++;
      return acc;
    },
    { all: 0 } as Record<string, number>
  );

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deletingId) return;

    startTransition(async () => {
      const result = await deleteCampaign(deletingId);
      if (result.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== deletingId));
        toast.success("Campagne supprimée");
      } else {
        toast.error(result.error);
      }
      setShowDeleteConfirm(false);
      setDeletingId(null);
    });
  };

  const handleSend = (id: string) => {
    setSendingId(id);
    setShowSendConfirm(true);
  };

  const confirmSend = () => {
    if (!sendingId) return;

    startTransition(async () => {
      const result = await sendCampaign(sendingId);
      if (result.success) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === sendingId ? { ...c, status: "sent" } : c))
        );
        toast.success("Campagne envoyée");
      } else {
        toast.error(result.error);
      }
      setShowSendConfirm(false);
      setSendingId(null);
    });
  };

  const handleCancel = (id: string) => {
    startTransition(async () => {
      const result = await cancelCampaign(id);
      if (result.success) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "cancelled" } : c))
        );
        toast.success("Campagne annulée");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-800">Campagnes</h1>
          <p className="text-slate-500 font-medium">
            Gérez vos campagnes broadcast et analysez vos performances.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/campaigns/new")}
          className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-12 px-6 rounded-2xl font-bold transition-all active:scale-95 group"
        >
          <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 border",
              selectedStatus === tab.value
                ? "bg-white shadow-layered border-white text-primary"
                : "bg-white/30 border-white/40 text-slate-400 hover:bg-white/50 hover:border-white/60"
            )}
          >
            <tab.icon className={cn("h-4 w-4", selectedStatus === tab.value ? "text-primary" : "text-slate-400")} />
            {tab.label}
            {statusCounts[tab.value] > 0 && (
              <span className={cn(
                "ml-1 text-[10px] px-2 py-0.5 rounded-full font-black",
                selectedStatus === tab.value ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"
              )}>
                {statusCounts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Campaigns list */}
      {filteredCampaigns.length === 0 ? (
        <Card className="glass-card p-12 flex flex-col items-center text-center border-none">
          <div className="h-20 w-20 rounded-[28px] bg-primary/10 flex items-center justify-center mb-6 shadow-layered">
            <Megaphone className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {selectedStatus !== "all" ? "Aucun résultat" : "Prêt à lancer votre première campagne ?"}
          </h3>
          <p className="text-slate-500 max-w-sm mb-8 font-medium">
            {selectedStatus !== "all"
              ? "Aucune campagne ne correspond à ce filtre actuellement."
              : "Créez une campagne en quelques clics et touchez vos clients directement sur WhatsApp."}
          </p>
          {selectedStatus === "all" && (
            <Button
              onClick={() => router.push("/dashboard/campaigns/new")}
              className="bg-white hover:bg-slate-50 text-slate-800 border-white shadow-xl h-11 px-8 rounded-xl font-bold"
            >
              C&apos;est parti
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onView={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
              onEdit={() => router.push(`/dashboard/campaigns/${campaign.id}/edit`)}
              onSend={() => handleSend(campaign.id)}
              onCancel={() => handleCancel(campaign.id)}
              onDelete={() => handleDelete(campaign.id)}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer la campagne"
        description="Cette action est irréversible. La campagne et ses statistiques seront définitivement supprimées."
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      <ConfirmDialog
        open={showSendConfirm}
        onOpenChange={setShowSendConfirm}
        title="Envoyer la campagne"
        description={`Voulez-vous envoyer cette campagne maintenant ? Les messages seront envoyés à ${campaigns.find((c) => c.id === sendingId)?._count.recipients || 0
          } destinataires.`}
        confirmLabel="Lancer maintenant"
        onConfirm={confirmSend}
      />
    </div>
  );
}
