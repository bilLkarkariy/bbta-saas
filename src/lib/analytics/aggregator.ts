/**
 * Analytics Aggregator
 *
 * Aggregates daily and hourly analytics from raw conversation and message data.
 * Designed to run as a cron job for daily aggregation.
 */

import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { startOfDay, endOfDay, startOfHour, subDays, subHours, format } from "date-fns";

const log = createLogger("analytics:aggregator");

export interface DailyStats {
  tenantId: string;
  date: Date;
  conversationsTotal: number;
  conversationsNew: number;
  conversationsResolved: number;
  conversationsEscalated: number;
  messagesInbound: number;
  messagesOutbound: number;
  messagesAI: number;
  messagesHuman: number;
  avgResponseTimeMs: number | null;
  avgResponseTimeHuman: number | null;
  botResolutionRate: number | null;
  leadsCapture: number;
  contactsNew: number;
  aiTier1Calls: number;
  aiTier2Calls: number;
  aiTier3Calls: number;
  aiCostEstimate: number;
}

export interface HourlyStats {
  tenantId: string;
  timestamp: Date;
  conversationsActive: number;
  messagesInbound: number;
  messagesOutbound: number;
}

/**
 * Aggregate daily statistics for a tenant
 */
export async function aggregateDailyStats(
  tenantId: string,
  date: Date
): Promise<DailyStats> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  log.info({ tenantId, date: format(dayStart, "yyyy-MM-dd") }, "Aggregating daily stats");

  // Conversation counts
  const [conversationsTotal, conversationsNew, conversationsResolved, conversationsEscalated] =
    await Promise.all([
      db.conversation.count({
        where: {
          tenantId,
          createdAt: { lte: dayEnd },
        },
      }),
      db.conversation.count({
        where: {
          tenantId,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      db.conversation.count({
        where: {
          tenantId,
          status: "resolved",
          updatedAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      db.conversation.count({
        where: {
          tenantId,
          status: "escalated",
          updatedAt: { gte: dayStart, lte: dayEnd },
        },
      }),
    ]);

  // Message counts
  const messages = await db.message.groupBy({
    by: ["direction"],
    where: {
      conversation: { tenantId },
      createdAt: { gte: dayStart, lte: dayEnd },
    },
    _count: true,
  });

  const messagesInbound = messages.find((m) => m.direction === "inbound")?._count || 0;
  const messagesOutbound = messages.find((m) => m.direction === "outbound")?._count || 0;

  // AI vs Human messages (outbound only)
  const aiMessages = await db.message.count({
    where: {
      conversation: { tenantId },
      direction: "outbound",
      tierUsed: { not: null },
      createdAt: { gte: dayStart, lte: dayEnd },
    },
  });
  const messagesAI = aiMessages;
  const messagesHuman = messagesOutbound - aiMessages;

  // AI tier breakdown
  const tierBreakdown = await db.message.groupBy({
    by: ["tierUsed"],
    where: {
      conversation: { tenantId },
      tierUsed: { not: null },
      createdAt: { gte: dayStart, lte: dayEnd },
    },
    _count: true,
  });

  const aiTier1Calls = tierBreakdown.find((t) => t.tierUsed === "TIER_1")?._count || 0;
  const aiTier2Calls = tierBreakdown.find((t) => t.tierUsed === "TIER_2")?._count || 0;
  const aiTier3Calls = tierBreakdown.find((t) => t.tierUsed === "TIER_3")?._count || 0;

  // AI cost estimate from AIUsage table
  const aiUsage = await db.aIUsage.aggregate({
    where: {
      tenantId,
      month: format(dayStart, "yyyy-MM"),
    },
    _sum: { costUsd: true },
  });
  // Rough daily estimate: monthly cost / days in month
  const daysInMonth = new Date(dayStart.getFullYear(), dayStart.getMonth() + 1, 0).getDate();
  const aiCostEstimate = (aiUsage._sum.costUsd || 0) / daysInMonth;

  // Leads captured
  const leadsCapture = await db.conversation.count({
    where: {
      tenantId,
      leadStatus: "new",
      createdAt: { gte: dayStart, lte: dayEnd },
    },
  });

  // New contacts
  const contactsNew = await db.contact.count({
    where: {
      tenantId,
      createdAt: { gte: dayStart, lte: dayEnd },
    },
  });

  // Response time calculation (average time between inbound and first outbound)
  const responseTimes = await db.$queryRaw<{ avg_response_ms: number | null }[]>`
    SELECT AVG(EXTRACT(EPOCH FROM (outbound.created_at - inbound.created_at)) * 1000) as avg_response_ms
    FROM "Message" inbound
    JOIN "Conversation" c ON inbound.conversation_id = c.id
    JOIN LATERAL (
      SELECT created_at
      FROM "Message"
      WHERE conversation_id = inbound.conversation_id
        AND direction = 'outbound'
        AND created_at > inbound.created_at
      ORDER BY created_at ASC
      LIMIT 1
    ) outbound ON true
    WHERE c.tenant_id = ${tenantId}
      AND inbound.direction = 'inbound'
      AND inbound.created_at >= ${dayStart}
      AND inbound.created_at <= ${dayEnd}
  `;
  const avgResponseTimeMs = responseTimes[0]?.avg_response_ms
    ? Math.round(responseTimes[0].avg_response_ms)
    : null;

  // Bot resolution rate (conversations resolved without human involvement)
  const resolvedByBot = await db.conversation.count({
    where: {
      tenantId,
      status: "resolved",
      assignedToId: null,
      updatedAt: { gte: dayStart, lte: dayEnd },
    },
  });
  const botResolutionRate =
    conversationsResolved > 0 ? resolvedByBot / conversationsResolved : null;

  return {
    tenantId,
    date: dayStart,
    conversationsTotal,
    conversationsNew,
    conversationsResolved,
    conversationsEscalated,
    messagesInbound,
    messagesOutbound,
    messagesAI,
    messagesHuman,
    avgResponseTimeMs,
    avgResponseTimeHuman: null, // TODO: Calculate human-only response time
    botResolutionRate,
    leadsCapture,
    contactsNew,
    aiTier1Calls,
    aiTier2Calls,
    aiTier3Calls,
    aiCostEstimate,
  };
}

/**
 * Aggregate hourly statistics for a tenant
 */
export async function aggregateHourlyStats(
  tenantId: string,
  timestamp: Date
): Promise<HourlyStats> {
  const hourStart = startOfHour(timestamp);
  const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000 - 1);

  log.debug({ tenantId, hour: format(hourStart, "yyyy-MM-dd HH:00") }, "Aggregating hourly stats");

  // Active conversations (had messages during this hour)
  const conversationsActive = await db.conversation.count({
    where: {
      tenantId,
      messages: {
        some: {
          createdAt: { gte: hourStart, lte: hourEnd },
        },
      },
    },
  });

  // Message counts
  const messages = await db.message.groupBy({
    by: ["direction"],
    where: {
      conversation: { tenantId },
      createdAt: { gte: hourStart, lte: hourEnd },
    },
    _count: true,
  });

  const messagesInbound = messages.find((m) => m.direction === "inbound")?._count || 0;
  const messagesOutbound = messages.find((m) => m.direction === "outbound")?._count || 0;

  return {
    tenantId,
    timestamp: hourStart,
    conversationsActive,
    messagesInbound,
    messagesOutbound,
  };
}

/**
 * Save daily stats to database (upsert)
 */
export async function saveDailyStats(stats: DailyStats): Promise<void> {
  await db.analyticsDaily.upsert({
    where: {
      tenantId_date: {
        tenantId: stats.tenantId,
        date: stats.date,
      },
    },
    create: stats,
    update: stats,
  });

  log.info(
    { tenantId: stats.tenantId, date: format(stats.date, "yyyy-MM-dd") },
    "Saved daily stats"
  );
}

/**
 * Save hourly stats to database (upsert)
 */
export async function saveHourlyStats(stats: HourlyStats): Promise<void> {
  await db.analyticsHourly.upsert({
    where: {
      tenantId_timestamp: {
        tenantId: stats.tenantId,
        timestamp: stats.timestamp,
      },
    },
    create: stats,
    update: stats,
  });
}

/**
 * Run daily aggregation for all tenants
 * Call this from a cron job (e.g., at midnight)
 */
export async function runDailyAggregation(date?: Date): Promise<void> {
  const targetDate = date || subDays(new Date(), 1); // Yesterday by default

  log.info({ date: format(targetDate, "yyyy-MM-dd") }, "Starting daily aggregation");

  const tenants = await db.tenant.findMany({
    where: { status: { in: ["trial", "active"] } },
    select: { id: true, name: true },
  });

  log.info({ count: tenants.length }, "Found tenants to aggregate");

  for (const tenant of tenants) {
    try {
      const stats = await aggregateDailyStats(tenant.id, targetDate);
      await saveDailyStats(stats);
    } catch (error) {
      log.error(
        { tenantId: tenant.id, error: error instanceof Error ? error.message : String(error) },
        "Failed to aggregate daily stats for tenant"
      );
    }
  }

  log.info({ date: format(targetDate, "yyyy-MM-dd") }, "Daily aggregation complete");
}

/**
 * Run hourly aggregation for all tenants
 * Call this from a cron job (e.g., every hour at :05)
 */
export async function runHourlyAggregation(timestamp?: Date): Promise<void> {
  const targetHour = timestamp || subHours(new Date(), 1); // Previous hour by default

  log.debug({ hour: format(targetHour, "yyyy-MM-dd HH:00") }, "Starting hourly aggregation");

  const tenants = await db.tenant.findMany({
    where: { status: { in: ["trial", "active"] } },
    select: { id: true },
  });

  for (const tenant of tenants) {
    try {
      const stats = await aggregateHourlyStats(tenant.id, targetHour);
      await saveHourlyStats(stats);
    } catch (error) {
      log.error(
        { tenantId: tenant.id, error: error instanceof Error ? error.message : String(error) },
        "Failed to aggregate hourly stats for tenant"
      );
    }
  }

  log.debug({ hour: format(targetHour, "yyyy-MM-dd HH:00") }, "Hourly aggregation complete");
}

/**
 * Backfill analytics for a tenant for a date range
 */
export async function backfillAnalytics(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  log.info(
    {
      tenantId,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    },
    "Starting analytics backfill"
  );

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const stats = await aggregateDailyStats(tenantId, currentDate);
    await saveDailyStats(stats);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  log.info({ tenantId }, "Analytics backfill complete");
}
