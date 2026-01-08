import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationDetail } from "@/components/dashboard/ConversationDetail";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { tenantId } = await getCurrentTenant();
  const { id } = await params;

  const conversation = await db.conversation.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  // Transform to match component interface
  const conversationData = {
    id: conversation.id,
    customerPhone: conversation.customerPhone,
    customerName: conversation.customerName,
    customerEmail: conversation.customerEmail,
    status: conversation.status,
    currentFlow: conversation.currentFlow,
    leadStatus: conversation.leadStatus,
    leadScore: conversation.leadScore,
    createdAt: conversation.createdAt.toISOString(),
    lastMessageAt: conversation.lastMessageAt?.toISOString() || conversation.createdAt.toISOString(),
    messages: conversation.messages.map((msg) => ({
      id: msg.id,
      direction: msg.direction as "inbound" | "outbound",
      content: msg.content,
      status: msg.status,
      intent: msg.intent,
      confidence: msg.confidence,
      tierUsed: msg.tierUsed,
      createdAt: msg.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4 animate-fade-up stagger-1">
        <Link href="/dashboard/conversations">
          <Button variant="ghost" size="icon" className="shrink-0 hover:bg-primary/5 border border-border/50 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
        </Link>
        <div className="flex-1">
          <p className="text-label mb-1">Conversation</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {conversationData.customerName || conversationData.customerPhone}
          </h1>
          <p className="text-meta mt-1">
            Messagerie WhatsApp en temps réel
          </p>
        </div>
      </header>

      {/* Conversation Detail - fixed height */}
      <div className="h-[calc(100vh-16rem)] animate-fade-up stagger-2">
        <ConversationDetail conversation={conversationData} />
      </div>
    </div>
  );
}
