import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  getDashboardMetrics,
  getConversationsTrend,
  getMessagesTrend,
  getConversationsByStatus,
  getAITierBreakdown,
  getResponseTimeTrend,
  getTopFAQs,
  getLeadFunnel,
  getHourlyActivity,
} from "@/lib/analytics/queries";
import { getCacheHeaders } from "@/lib/fetcher";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCurrentTenant();
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get("type") || "dashboard";
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    const start = subDays(new Date(), days);
    const end = new Date();
    const range = { start, end };

    // Cache headers for analytics - can be slightly stale (60s client, 300s CDN)
    const cacheHeaders = getCacheHeaders({
      type: "revalidate",
      maxAge: 60,
      sMaxAge: 300,
      staleWhileRevalidate: 600,
    });

    switch (type) {
      case "dashboard": {
        const metrics = await getDashboardMetrics(tenant.id, range);
        return NextResponse.json(metrics, { headers: cacheHeaders });
      }

      case "conversations-trend": {
        const trend = await getConversationsTrend(tenant.id, days);
        return NextResponse.json(trend, { headers: cacheHeaders });
      }

      case "messages-trend": {
        const trend = await getMessagesTrend(tenant.id, days);
        return NextResponse.json(trend, { headers: cacheHeaders });
      }

      case "conversations-status": {
        const status = await getConversationsByStatus(tenant.id);
        return NextResponse.json(status, { headers: cacheHeaders });
      }

      case "ai-usage": {
        const month = searchParams.get("month") || undefined;
        const usage = await getAITierBreakdown(tenant.id, month);
        return NextResponse.json(usage, { headers: cacheHeaders });
      }

      case "response-time": {
        const trend = await getResponseTimeTrend(tenant.id, days);
        return NextResponse.json(trend, { headers: cacheHeaders });
      }

      case "top-faqs": {
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const faqs = await getTopFAQs(tenant.id, limit);
        return NextResponse.json(faqs, { headers: cacheHeaders });
      }

      case "lead-funnel": {
        const funnel = await getLeadFunnel(tenant.id, range);
        return NextResponse.json(funnel, { headers: cacheHeaders });
      }

      case "hourly-activity": {
        const activity = await getHourlyActivity(tenant.id, days);
        return NextResponse.json(activity, { headers: cacheHeaders });
      }

      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
