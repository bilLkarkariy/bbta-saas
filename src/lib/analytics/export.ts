/**
 * Analytics Export Utilities
 *
 * Functions for generating CSV and JSON exports of analytics data.
 */

export interface ExportRow {
  date: string;
  conversationsNew: number;
  conversationsResolved: number;
  conversationsEscalated: number;
  messagesInbound: number;
  messagesOutbound: number;
  avgResponseTimeMs: number | null;
  botResolutionRate: number | null;
  aiTier1Calls: number;
  aiTier2Calls: number;
  aiTier3Calls: number;
  aiCostEstimate: number;
}

/**
 * Generate CSV content from data array
 */
export function generateCSV(data: ExportRow[]): string {
  if (data.length === 0) {
    return "";
  }

  const headers = [
    "Date",
    "Nouvelles Conversations",
    "Conversations Resolues",
    "Conversations Escaladees",
    "Messages Entrants",
    "Messages Sortants",
    "Temps de Reponse Moyen (ms)",
    "Taux Resolution Bot",
    "Appels AI Tier 1",
    "Appels AI Tier 2",
    "Appels AI Tier 3",
    "Cout AI Estime (USD)",
  ];

  const rows = data.map((row) =>
    [
      row.date,
      row.conversationsNew,
      row.conversationsResolved,
      row.conversationsEscalated,
      row.messagesInbound,
      row.messagesOutbound,
      row.avgResponseTimeMs ?? "",
      row.botResolutionRate !== null
        ? (row.botResolutionRate * 100).toFixed(1)
        : "",
      row.aiTier1Calls,
      row.aiTier2Calls,
      row.aiTier3Calls,
      row.aiCostEstimate.toFixed(4),
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generate JSON content from data array
 */
export function generateJSON(data: ExportRow[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      period: {
        start: data[0]?.date,
        end: data[data.length - 1]?.date,
      },
      summary: {
        totalConversations: data.reduce(
          (sum, r) => sum + r.conversationsNew,
          0
        ),
        totalMessages: data.reduce(
          (sum, r) => sum + r.messagesInbound + r.messagesOutbound,
          0
        ),
        totalAICalls: data.reduce(
          (sum, r) => sum + r.aiTier1Calls + r.aiTier2Calls + r.aiTier3Calls,
          0
        ),
        totalAICost: data.reduce((sum, r) => sum + r.aiCostEstimate, 0),
      },
      dailyData: data.map((row) => ({
        date: row.date,
        conversations: {
          new: row.conversationsNew,
          resolved: row.conversationsResolved,
          escalated: row.conversationsEscalated,
        },
        messages: {
          inbound: row.messagesInbound,
          outbound: row.messagesOutbound,
        },
        performance: {
          avgResponseTimeMs: row.avgResponseTimeMs,
          botResolutionRate: row.botResolutionRate,
        },
        ai: {
          tier1Calls: row.aiTier1Calls,
          tier2Calls: row.aiTier2Calls,
          tier3Calls: row.aiTier3Calls,
          costEstimate: row.aiCostEstimate,
        },
      })),
    },
    null,
    2
  );
}

/**
 * Generate filename for export
 */
export function generateFilename(
  tenantName: string,
  format: "csv" | "json",
  startDate: string,
  endDate: string
): string {
  const sanitizedName = tenantName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `lumelia-analytics-${sanitizedName}-${startDate}-to-${endDate}.${format}`;
}
