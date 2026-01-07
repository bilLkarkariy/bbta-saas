import { db } from "@/lib/db";

export interface AgentStats {
  userId: string;
  name: string | null;
  email: string;
  conversationsHandled: number;
  conversationsResolved: number;
  conversationsEscalated: number;
  messagesResponded: number;
  avgResponseTimeMs: number | null;
  resolutionRate: number;
  currentWorkload: number;
  maxConversations: number;
  isAvailable: boolean;
}

export interface AgentStatsOptions {
  period?: number; // days
}

/**
 * Get agent performance stats for a specific period
 */
export async function getAgentStats(
  tenantId: string,
  options: AgentStatsOptions = {}
): Promise<AgentStats[]> {
  const { period = 30 } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  // Get all agents in tenant
  const agents = await db.user.findMany({
    where: {
      tenantId,
      role: { in: ["OWNER", "ADMIN", "AGENT"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      isAvailable: true,
      maxConversations: true,
      _count: {
        select: {
          assignedConversations: {
            where: { status: "active" },
          },
        },
      },
    },
  });

  // Get stats for each agent
  const stats = await Promise.all(
    agents.map(async (agent) => {
      // Get conversations handled in period
      const conversationStats = await db.conversation.groupBy({
        by: ["status"],
        where: {
          tenantId,
          assignedToId: agent.id,
          updatedAt: { gte: startDate },
        },
        _count: true,
      });

      const conversationsHandled = conversationStats.reduce(
        (sum, s) => sum + s._count,
        0
      );
      const conversationsResolved =
        conversationStats.find((s) => s.status === "resolved")?._count || 0;
      const conversationsEscalated =
        conversationStats.find((s) => s.status === "escalated")?._count || 0;

      // Get messages sent by agent
      const messagesResponded = await db.message.count({
        where: {
          direction: "outbound",
          conversation: {
            tenantId,
            assignedToId: agent.id,
          },
          createdAt: { gte: startDate },
        },
      });

      // Calculate avg response time (simplified - time between inbound and next outbound)
      const avgResponseTimeMs = await calculateAvgResponseTime(
        tenantId,
        agent.id,
        startDate
      );

      // Resolution rate
      const totalClosed = conversationsResolved + conversationsEscalated;
      const resolutionRate =
        totalClosed > 0 ? conversationsResolved / totalClosed : 0;

      return {
        userId: agent.id,
        name: agent.name,
        email: agent.email,
        conversationsHandled,
        conversationsResolved,
        conversationsEscalated,
        messagesResponded,
        avgResponseTimeMs,
        resolutionRate,
        currentWorkload: agent._count.assignedConversations,
        maxConversations: agent.maxConversations,
        isAvailable: agent.isAvailable,
      };
    })
  );

  // Sort by conversations handled (descending)
  return stats.sort((a, b) => b.conversationsHandled - a.conversationsHandled);
}

/**
 * Calculate average response time for an agent
 */
async function calculateAvgResponseTime(
  tenantId: string,
  agentId: string,
  startDate: Date
): Promise<number | null> {
  // Get conversations assigned to agent with messages
  const conversations = await db.conversation.findMany({
    where: {
      tenantId,
      assignedToId: agentId,
      updatedAt: { gte: startDate },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          direction: true,
          createdAt: true,
        },
      },
    },
    take: 100, // Limit for performance
  });

  const responseTimes: number[] = [];

  for (const conv of conversations) {
    let lastInbound: Date | null = null;

    for (const msg of conv.messages) {
      if (msg.direction === "inbound") {
        lastInbound = msg.createdAt;
      } else if (msg.direction === "outbound" && lastInbound) {
        const responseTime = msg.createdAt.getTime() - lastInbound.getTime();
        // Only count reasonable response times (< 24 hours)
        if (responseTime < 24 * 60 * 60 * 1000) {
          responseTimes.push(responseTime);
        }
        lastInbound = null;
      }
    }
  }

  if (responseTimes.length === 0) return null;

  return Math.round(
    responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
  );
}

/**
 * Get individual agent's detailed stats
 */
export async function getAgentDetailStats(
  tenantId: string,
  agentId: string,
  options: AgentStatsOptions = {}
): Promise<{
  stats: AgentStats;
  trend: { date: string; conversations: number; messages: number }[];
} | null> {
  const { period = 30 } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  // Get agent
  const agent = await db.user.findFirst({
    where: {
      id: agentId,
      tenantId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isAvailable: true,
      maxConversations: true,
      _count: {
        select: {
          assignedConversations: {
            where: { status: "active" },
          },
        },
      },
    },
  });

  if (!agent) return null;

  // Get all agent stats
  const allStats = await getAgentStats(tenantId, options);
  const agentStats = allStats.find((s) => s.userId === agentId);

  if (!agentStats) return null;

  // Generate daily trend
  const trend: { date: string; conversations: number; messages: number }[] = [];

  for (let i = period - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayStart = new Date(dateStr);
    const dayEnd = new Date(dateStr);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [conversations, messages] = await Promise.all([
      db.conversation.count({
        where: {
          tenantId,
          assignedToId: agentId,
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),
      db.message.count({
        where: {
          direction: "outbound",
          conversation: {
            tenantId,
            assignedToId: agentId,
          },
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),
    ]);

    trend.push({ date: dateStr, conversations, messages });
  }

  return { stats: agentStats, trend };
}
