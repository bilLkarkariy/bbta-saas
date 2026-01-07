import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationList } from "@/components/dashboard/conversation-list";

export default async function ConversationsPage() {
  const { tenantId } = await getCurrentTenant();

  const conversations = await db.conversation.findMany({
    where: { tenantId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Conversations</h2>
        <p className="text-gray-500">
          Gérez vos conversations WhatsApp avec vos clients
        </p>
      </div>

      <ConversationList conversations={conversations} />
    </div>
  );
}
