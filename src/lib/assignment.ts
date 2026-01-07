/**
 * Conversation Assignment Service
 *
 * Handles automatic assignment of conversations to agents based on tenant settings.
 */

import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("assignment");

export type AssignmentStrategy = "manual" | "round_robin" | "least_busy";

interface AvailableAgent {
  id: string;
  name: string | null;
  activeCount: number;
  maxConversations: number;
  lastAssignedAt: Date | null;
}

/**
 * Get available agents for a tenant
 */
async function getAvailableAgents(tenantId: string): Promise<AvailableAgent[]> {
  const agents = await db.user.findMany({
    where: {
      tenantId,
      isAvailable: true,
      role: { in: ["OWNER", "ADMIN", "AGENT"] },
    },
    select: {
      id: true,
      name: true,
      maxConversations: true,
      assignedConversations: {
        where: { status: "active" },
        select: { assignedAt: true },
        orderBy: { assignedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          assignedConversations: {
            where: { status: "active" },
          },
        },
      },
    },
  });

  return agents
    .filter((a) => a._count.assignedConversations < a.maxConversations)
    .map((a) => ({
      id: a.id,
      name: a.name,
      activeCount: a._count.assignedConversations,
      maxConversations: a.maxConversations,
      lastAssignedAt: a.assignedConversations[0]?.assignedAt || null,
    }));
}

/**
 * Select agent using round-robin strategy
 * Assigns to the agent who was assigned longest ago
 */
function selectRoundRobin(agents: AvailableAgent[]): AvailableAgent | null {
  if (agents.length === 0) return null;

  // Sort by last assigned time (oldest first, null = never assigned = priority)
  const sorted = [...agents].sort((a, b) => {
    if (!a.lastAssignedAt && !b.lastAssignedAt) return 0;
    if (!a.lastAssignedAt) return -1;
    if (!b.lastAssignedAt) return 1;
    return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
  });

  return sorted[0];
}

/**
 * Select agent using least-busy strategy
 * Assigns to the agent with the fewest active conversations
 */
function selectLeastBusy(agents: AvailableAgent[]): AvailableAgent | null {
  if (agents.length === 0) return null;

  // Sort by active count (lowest first)
  const sorted = [...agents].sort((a, b) => {
    const aLoad = a.activeCount / a.maxConversations;
    const bLoad = b.activeCount / b.maxConversations;
    return aLoad - bLoad;
  });

  return sorted[0];
}

/**
 * Auto-assign a conversation based on tenant settings
 */
export async function autoAssignConversation(
  tenantId: string,
  conversationId: string
): Promise<{ assigned: boolean; agentId?: string; agentName?: string | null }> {
  // Get tenant settings
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { assignmentStrategy: true, autoAssignOnInbound: true },
  });

  if (!tenant) {
    log.error({ tenantId }, "Tenant not found for auto-assignment");
    return { assigned: false };
  }

  // Check if auto-assign is enabled
  if (!tenant.autoAssignOnInbound) {
    log.debug({ tenantId }, "Auto-assign disabled for tenant");
    return { assigned: false };
  }

  // Skip manual strategy
  if (tenant.assignmentStrategy === "manual") {
    log.debug({ tenantId }, "Manual assignment strategy, skipping auto-assign");
    return { assigned: false };
  }

  // Get available agents
  const agents = await getAvailableAgents(tenantId);

  if (agents.length === 0) {
    log.info({ tenantId }, "No available agents for auto-assignment");
    return { assigned: false };
  }

  // Select agent based on strategy
  let selectedAgent: AvailableAgent | null = null;

  switch (tenant.assignmentStrategy) {
    case "round_robin":
      selectedAgent = selectRoundRobin(agents);
      break;
    case "least_busy":
      selectedAgent = selectLeastBusy(agents);
      break;
    default:
      log.warn({ strategy: tenant.assignmentStrategy }, "Unknown assignment strategy");
      return { assigned: false };
  }

  if (!selectedAgent) {
    log.info({ tenantId }, "No suitable agent found for auto-assignment");
    return { assigned: false };
  }

  // Assign conversation
  await db.conversation.update({
    where: { id: conversationId },
    data: {
      assignedToId: selectedAgent.id,
      assignedAt: new Date(),
    },
  });

  log.info(
    {
      tenantId,
      conversationId,
      agentId: selectedAgent.id,
      strategy: tenant.assignmentStrategy,
    },
    "Auto-assigned conversation"
  );

  return {
    assigned: true,
    agentId: selectedAgent.id,
    agentName: selectedAgent.name,
  };
}

/**
 * Reassign conversations from an unavailable agent
 */
export async function reassignFromAgent(tenantId: string, agentId: string): Promise<number> {
  // Get agent's active conversations
  const conversations = await db.conversation.findMany({
    where: {
      tenantId,
      assignedToId: agentId,
      status: "active",
    },
    select: { id: true },
  });

  if (conversations.length === 0) {
    return 0;
  }

  let reassignedCount = 0;

  for (const conv of conversations) {
    // Unassign first
    await db.conversation.update({
      where: { id: conv.id },
      data: { assignedToId: null, assignedAt: null },
    });

    // Try to auto-assign to another agent
    const result = await autoAssignConversation(tenantId, conv.id);
    if (result.assigned) {
      reassignedCount++;
    }
  }

  log.info(
    { tenantId, agentId, total: conversations.length, reassigned: reassignedCount },
    "Reassigned conversations from agent"
  );

  return reassignedCount;
}

/**
 * Get assignment statistics for a tenant
 */
export async function getAssignmentStats(tenantId: string): Promise<{
  unassigned: number;
  byAgent: { id: string; name: string | null; count: number }[];
}> {
  const [unassigned, byAgent] = await Promise.all([
    db.conversation.count({
      where: {
        tenantId,
        status: "active",
        assignedToId: null,
      },
    }),
    db.user.findMany({
      where: {
        tenantId,
        role: { in: ["OWNER", "ADMIN", "AGENT"] },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            assignedConversations: {
              where: { status: "active" },
            },
          },
        },
      },
    }),
  ]);

  return {
    unassigned,
    byAgent: byAgent.map((a) => ({
      id: a.id,
      name: a.name,
      count: a._count.assignedConversations,
    })),
  };
}
