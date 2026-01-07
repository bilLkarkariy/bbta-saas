import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateCSV,
  generateJSON,
  generateFilename,
  type ExportRow,
} from "@/lib/analytics/export";
import { subDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    const formatParam = searchParams.get("format") || "csv";
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (formatParam !== "csv" && formatParam !== "json") {
      return NextResponse.json(
        { error: "Format must be csv or json" },
        { status: 400 }
      );
    }

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Days must be between 1 and 365" },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Fetch analytics data
    const analytics = await db.analyticsDaily.findMany({
      where: {
        tenantId: tenant.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Transform to export format
    const data: ExportRow[] = analytics.map((row) => ({
      date: format(row.date, "yyyy-MM-dd"),
      conversationsNew: row.conversationsNew,
      conversationsResolved: row.conversationsResolved,
      conversationsEscalated: row.conversationsEscalated,
      messagesInbound: row.messagesInbound,
      messagesOutbound: row.messagesOutbound,
      avgResponseTimeMs: row.avgResponseTimeMs,
      botResolutionRate: row.botResolutionRate,
      aiTier1Calls: row.aiTier1Calls,
      aiTier2Calls: row.aiTier2Calls,
      aiTier3Calls: row.aiTier3Calls,
      aiCostEstimate: row.aiCostEstimate,
    }));

    // Generate content based on format
    const content =
      formatParam === "csv" ? generateCSV(data) : generateJSON(data);

    const filename = generateFilename(
      tenant.name,
      formatParam,
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd")
    );

    const contentType =
      formatParam === "csv" ? "text/csv; charset=utf-8" : "application/json";

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
