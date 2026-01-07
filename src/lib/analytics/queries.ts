/**
 * Analytics Queries
 *
 * Query functions for retrieving analytics data for dashboards and reports.
 */

import { db } from "@/lib/db";
import { startOfDay, endOfDay, subDays, subMonths, format } from "date-fns";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DashboardMetrics {
  totalConversations: number;
  activeConversations: number;
  messagesTotal: number;
  avgResponseTime: number | null;
  botResolutionRate: number | null;
  leadsCapture: number;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface ConversationsByStatus {
  status: string;
  count: number;
}

export interface MessagesByDirection {
  direction: string;
  count: number;
}

export interface AITierBreakdown {
  tier: string;
  count: number;
  cost: number;
}

/**
 * Get dashboard summary metrics for a tenant
 */
export async function getDashboardMetrics(
  tenantId: string,
  range?: DateRange
): Promise<DashboardMetrics> {
  const now = new Date();
  const start = range?.start || subDays(now, 30);
  const end = range?.end || now;

  const [totalConversations, activeConversations, messagesTotal, avgResponseTime, botResolutionRate, leadsCapture] =
    await Promise.all([
      // Total conversations
      db.conversation.count({
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
        },
      }),

      // Active conversations
      db.conversation.count({
        where: {
          tenantId,
          status: "active",
        },
      }),

      // Total messages
      db.message.count({
        where: {
          conversation: { tenantId },
          createdAt: { gte: start, lte: end },
        },
      }),

      // Average response time from daily analytics
      db.analyticsDaily
        .aggregate({
          where: {
            tenantId,
            date: { gte: startOfDay(start), lte: endOfDay(end) },
            avgResponseTimeMs: { not: null },
          },
          _avg: { avgResponseTimeMs: true },
        })
        .then((r) => r._avg.avgResponseTimeMs),

      // Bot resolution rate from daily analytics
      db.analyticsDaily
        .aggregate({
          where: {
            tenantId,
            date: { gte: startOfDay(start), lte: endOfDay(end) },
            botResolutionRate: { not: null },
          },
          _avg: { botResolutionRate: true },
        })
        .then((r) => r._avg.botResolutionRate),

      // Leads captured
      db.conversation.count({
        where: {
          tenantId,
          leadStatus: { in: ["new", "qualified"] },
          createdAt: { gte: start, lte: end },
        },
      }),
    ]);

  return {
    totalConversations,
    activeConversations,
    messagesTotal,
    avgResponseTime,
    botResolutionRate,
    leadsCapture,
  };
}

/**
 * Get conversations trend data
 */
export async function getConversationsTrend(
  tenantId: string,
  days: number = 30
): Promise<TrendData[]> {
  const start = startOfDay(subDays(new Date(), days));

  const analytics = await db.analyticsDaily.findMany({
    where: {
      tenantId,
      date: { gte: start },
    },
    orderBy: { date: "asc" },
    select: { date: true, conversationsNew: true },
  });

  return analytics.map((a) => ({
    date: format(a.date, "yyyy-MM-dd"),
    value: a.conversationsNew,
  }));
}

/**
 * Get messages trend data
 */
export async function getMessagesTrend(
  tenantId: string,
  days: number = 30
): Promise<{ inbound: TrendData[]; outbound: TrendData[] }> {
  const start = startOfDay(subDays(new Date(), days));

  const analytics = await db.analyticsDaily.findMany({
    where: {
      tenantId,
      date: { gte: start },
    },
    orderBy: { date: "asc" },
    select: { date: true, messagesInbound: true, messagesOutbound: true },
  });

  return {
    inbound: analytics.map((a) => ({
      date: format(a.date, "yyyy-MM-dd"),
      value: a.messagesInbound,
    })),
    outbound: analytics.map((a) => ({
      date: format(a.date, "yyyy-MM-dd"),
      value: a.messagesOutbound,
    })),
  };
}

/**
 * Get conversations grouped by status
 */
export async function getConversationsByStatus(
  tenantId: string
): Promise<ConversationsByStatus[]> {
  const result = await db.conversation.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: true,
  });

  return result.map((r) => ({
    status: r.status,
    count: r._count,
  }));
}

/**
 * Get hourly activity for heatmap
 */
export async function getHourlyActivity(
  tenantId: string,
  days: number = 7
): Promise<{ hour: number; dayOfWeek: number; count: number }[]> {
  const start = subDays(new Date(), days);

  const hourlyData = await db.analyticsHourly.findMany({
    where: {
      tenantId,
      timestamp: { gte: start },
    },
    select: { timestamp: true, messagesInbound: true },
  });

  // Group by hour of day and day of week
  const heatmap: Record<string, number> = {};
  for (const h of hourlyData) {
    const hour = h.timestamp.getHours();
    const dayOfWeek = h.timestamp.getDay();
    const key = `${dayOfWeek}-${hour}`;
    heatmap[key] = (heatmap[key] || 0) + h.messagesInbound;
  }

  const result: { hour: number; dayOfWeek: number; count: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        hour,
        dayOfWeek: day,
        count: heatmap[`${day}-${hour}`] || 0,
      });
    }
  }

  return result;
}

/**
 * Get AI usage breakdown by tier
 */
export async function getAITierBreakdown(
  tenantId: string,
  month?: string
): Promise<AITierBreakdown[]> {
  const targetMonth = month || format(new Date(), "yyyy-MM");

  const usage = await db.aIUsage.findMany({
    where: {
      tenantId,
      month: targetMonth,
    },
    select: { tier: true, requestCount: true, costUsd: true },
  });

  // Group by tier
  const tiers: Record<string, { count: number; cost: number }> = {};
  for (const u of usage) {
    if (!tiers[u.tier]) {
      tiers[u.tier] = { count: 0, cost: 0 };
    }
    tiers[u.tier].count += u.requestCount;
    tiers[u.tier].cost += u.costUsd;
  }

  return Object.entries(tiers).map(([tier, data]) => ({
    tier,
    count: data.count,
    cost: data.cost,
  }));
}

/**
 * Get response time trend
 */
export async function getResponseTimeTrend(
  tenantId: string,
  days: number = 30
): Promise<TrendData[]> {
  const start = startOfDay(subDays(new Date(), days));

  const analytics = await db.analyticsDaily.findMany({
    where: {
      tenantId,
      date: { gte: start },
      avgResponseTimeMs: { not: null },
    },
    orderBy: { date: "asc" },
    select: { date: true, avgResponseTimeMs: true },
  });

  return analytics.map((a) => ({
    date: format(a.date, "yyyy-MM-dd"),
    value: a.avgResponseTimeMs || 0,
  }));
}

/**
 * Get top performing FAQs
 */
export async function getTopFAQs(
  tenantId: string,
  limit: number = 10
): Promise<{ id: string; question: string; usageCount: number }[]> {
  const faqs = await db.fAQ.findMany({
    where: { tenantId, isActive: true },
    orderBy: { usageCount: "desc" },
    take: limit,
    select: { id: true, question: true, usageCount: true },
  });

  return faqs;
}

/**
 * Get lead funnel metrics
 */
export async function getLeadFunnel(
  tenantId: string,
  range?: DateRange
): Promise<{ status: string; count: number }[]> {
  const start = range?.start || subMonths(new Date(), 1);
  const end = range?.end || new Date();

  const result = await db.conversation.groupBy({
    by: ["leadStatus"],
    where: {
      tenantId,
      leadStatus: { not: null },
      createdAt: { gte: start, lte: end },
    },
    _count: true,
  });

  return result.map((r) => ({
    status: r.leadStatus || "unknown",
    count: r._count,
  }));
}

/**
 * Get agent performance metrics
 */
export async function getAgentPerformance(
  tenantId: string,
  range?: DateRange
): Promise<
  {
    userId: string;
    userName: string | null;
    conversationsHandled: number;
    messagesCount: number;
    avgResponseTime: number | null;
  }[]
> {
  const start = range?.start || subDays(new Date(), 30);
  const end = range?.end || new Date();

  // Get agents with conversation counts
  const agents = await db.user.findMany({
    where: { tenantId, role: { in: ["AGENT", "ADMIN", "OWNER"] } },
    select: {
      id: true,
      name: true,
      assignedConversations: {
        where: {
          updatedAt: { gte: start, lte: end },
        },
        select: { id: true },
      },
    },
  });

  const performance = await Promise.all(
    agents.map(async (agent) => {
      const messagesCount = await db.message.count({
        where: {
          conversation: {
            tenantId,
            assignedToId: agent.id,
          },
          direction: "outbound",
          tierUsed: null, // Human messages only
          createdAt: { gte: start, lte: end },
        },
      });

      return {
        userId: agent.id,
        userName: agent.name,
        conversationsHandled: agent.assignedConversations.length,
        messagesCount,
        avgResponseTime: null, // TODO: Calculate per-agent response time
      };
    })
  );

  return performance.sort((a, b) => b.conversationsHandled - a.conversationsHandled);
}

/**
 * Get conversations grouped by intent
 */
export async function getConversationsByIntent(
  tenantId: string
): Promise<{ intent: string; count: number }[]> {
  // Get intents from messages
  const result = await db.message.groupBy({
    by: ["intent"],
    where: {
      conversation: { tenantId },
      intent: { not: null },
      direction: "outbound",
    },
    _count: true,
    orderBy: { _count: { intent: "desc" } },
    take: 10,
  });

  return result.map((r) => ({
    intent: r.intent || "UNKNOWN",
    count: r._count,
  }));
}

/**
 * Get resolution time distribution
 */
export async function getResolutionTimeDistribution(
  tenantId: string,
  days: number = 30
): Promise<{ bucket: string; count: number }[]> {
  const start = subDays(new Date(), days);

  // Get resolved conversations
  const conversations = await db.conversation.findMany({
    where: {
      tenantId,
      status: "resolved",
      updatedAt: { gte: start },
    },
    select: {
      createdAt: true,
      lastMessageAt: true,
    },
    take: 500,
  });

  // Calculate resolution times and bucket them
  const buckets: Record<string, number> = {
    "< 5min": 0,
    "5-15min": 0,
    "15-30min": 0,
    "30min-1h": 0,
    "1-4h": 0,
    "4-24h": 0,
    "> 24h": 0,
  };

  for (const conv of conversations) {
    const resolutionMs =
      (conv.lastMessageAt?.getTime() || conv.createdAt.getTime()) -
      conv.createdAt.getTime();
    const resolutionMin = resolutionMs / 60000;

    if (resolutionMin < 5) buckets["< 5min"]++;
    else if (resolutionMin < 15) buckets["5-15min"]++;
    else if (resolutionMin < 30) buckets["15-30min"]++;
    else if (resolutionMin < 60) buckets["30min-1h"]++;
    else if (resolutionMin < 240) buckets["1-4h"]++;
    else if (resolutionMin < 1440) buckets["4-24h"]++;
    else buckets["> 24h"]++;
  }

  return Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }));
}

/**
 * Get activity heatmap data (messages by hour and day of week)
 */
export async function getActivityHeatmap(
  tenantId: string,
  days: number = 30
): Promise<{ dayOfWeek: number; hour: number; value: number }[]> {
  const start = subDays(new Date(), days);

  // Get messages with timestamps
  const messages = await db.message.findMany({
    where: {
      conversation: { tenantId },
      direction: "inbound",
      createdAt: { gte: start },
    },
    select: { createdAt: true },
    take: 5000,
  });

  // Aggregate by day of week and hour
  const heatmap: Record<string, number> = {};

  for (const msg of messages) {
    const day = msg.createdAt.getDay();
    const hour = msg.createdAt.getHours();
    const key = `${day}-${hour}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  }

  // Generate full matrix
  const result: { dayOfWeek: number; hour: number; value: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        dayOfWeek: day,
        hour,
        value: heatmap[`${day}-${hour}`] || 0,
      });
    }
  }

  return result;
}

/**
 * Get monthly summary for billing/reporting
 */
export async function getMonthlySummary(
  tenantId: string,
  month: string
): Promise<{
  totalConversations: number;
  totalMessages: number;
  aiRequestsTotal: number;
  aiCostTotal: number;
  peakHour: number | null;
}> {
  const [year, monthNum] = month.split("-").map(Number);
  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0, 23, 59, 59);

  const [dailyAgg, aiUsage, hourlyPeak] = await Promise.all([
    db.analyticsDaily.aggregate({
      where: {
        tenantId,
        date: { gte: start, lte: end },
      },
      _sum: {
        conversationsNew: true,
        messagesInbound: true,
        messagesOutbound: true,
      },
    }),
    db.aIUsage.aggregate({
      where: {
        tenantId,
        month,
      },
      _sum: {
        requestCount: true,
        costUsd: true,
      },
    }),
    db.analyticsHourly.groupBy({
      by: ["timestamp"],
      where: {
        tenantId,
        timestamp: { gte: start, lte: end },
      },
      _sum: { messagesInbound: true },
      orderBy: { _sum: { messagesInbound: "desc" } },
      take: 1,
    }),
  ]);

  return {
    totalConversations: dailyAgg._sum.conversationsNew || 0,
    totalMessages:
      (dailyAgg._sum.messagesInbound || 0) + (dailyAgg._sum.messagesOutbound || 0),
    aiRequestsTotal: aiUsage._sum.requestCount || 0,
    aiCostTotal: aiUsage._sum.costUsd || 0,
    peakHour: hourlyPeak[0]?.timestamp.getHours() ?? null,
  };
}
