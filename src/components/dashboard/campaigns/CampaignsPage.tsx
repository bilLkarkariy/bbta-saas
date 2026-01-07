"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Send, Clock, CheckCircle, XCircle, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ConfirmDialog } from "@/components/shared";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campagnes</h1>
          <p className="text-muted-foreground">
            Gérez vos campagnes de messages broadcast
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/campaigns/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={selectedStatus === tab.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedStatus(tab.value)}
            className="whitespace-nowrap"
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
            {statusCounts[tab.value] > 0 && (
              <span className="ml-2 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {statusCounts[tab.value]}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Campaigns list */}
      {filteredCampaigns.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne"
            description={
              selectedStatus !== "all"
                ? "Aucune campagne avec ce statut."
                : "Créez votre première campagne pour envoyer des messages à vos contacts."
            }
            action={
              selectedStatus === "all"
                ? {
                    label: "Créer une campagne",
                    onClick: () => router.push("/dashboard/campaigns/new"),
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
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
        description={`Voulez-vous envoyer cette campagne maintenant ? Les messages seront envoyés à ${
          campaigns.find((c) => c.id === sendingId)?._count.recipients || 0
        } destinataires.`}
        confirmLabel="Envoyer"
        onConfirm={confirmSend}
      />
    </div>
  );
}
