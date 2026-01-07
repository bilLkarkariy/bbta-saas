import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationList } from "@/components/dashboard/conversation-list";

export default async function ConversationsPage() {
  const { tenant, user } = await getCurrentTenant();

  // Fetch conversations with assignee info (paginated for performance)
  const conversations = await db.conversation.findMany({
    where: { tenantId: tenant.id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          direction: true,
          createdAt: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100, // Limit to most recent 100 conversations for performance
  });

  // Fetch available agents for assignment dropdown
  const agents = await db.user.findMany({
    where: {
      tenantId: tenant.id,
      role: { in: ["AGENT", "ADMIN", "OWNER"] },
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  // Check if user can assign (admin or owner)
  const canAssign = user.role === "OWNER" || user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Conversations</h2>
        <p className="text-gray-500">
          Gerez vos conversations WhatsApp avec vos clients
        </p>
      </div>

      <ConversationList
        conversations={conversations}
        agents={agents}
        canAssign={canAssign}
      />
    </div>
  );
}
