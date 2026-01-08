import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationList } from "@/components/dashboard/conversation-list";
import { MessageSquare } from "lucide-react";

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
      <header className="space-y-2 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Conversations</h1>
        </div>
        <p className="text-body text-muted-foreground ml-13">
          Gérez vos conversations WhatsApp avec vos clients
        </p>
      </header>

      <div className="animate-fade-up stagger-2">
        <ConversationList
          conversations={conversations}
          agents={agents}
          canAssign={canAssign}
        />
      </div>
    </div>
  );
}
