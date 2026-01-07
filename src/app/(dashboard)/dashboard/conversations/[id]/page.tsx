import { notFound } from "next/navigation";
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

  return <ConversationDetail conversation={conversationData} />;
}
