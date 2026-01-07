import { getCurrentTenant } from "@/lib/auth";
import {
  getConversationsByStatus,
  getConversationsByIntent,
  getResolutionTimeDistribution,
  getActivityHeatmap,
  getDashboardMetrics,
} from "@/lib/analytics/queries";
import { LazyConversationBreakdown } from "@/components/dashboard/analytics";
import { HeatmapChart } from "@/components/dashboard/analytics/HeatmapChart";
import { ResolutionTimeChart } from "@/components/dashboard/analytics/ResolutionTimeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, MessageSquare, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default async function ConversationAnalyticsPage() {
  const { tenant } = await getCurrentTenant();

  const [statusData, intentData, resolutionData, heatmapData, metrics] =
    await Promise.all([
      getConversationsByStatus(tenant.id),
      getConversationsByIntent(tenant.id),
      getResolutionTimeDistribution(tenant.id, 30),
      getActivityHeatmap(tenant.id, 30),
      getDashboardMetrics(tenant.id),
    ]);

  // Calculate derived metrics
  const totalConversations = statusData.reduce((sum, s) => sum + s.count, 0);
  const resolvedCount =
    statusData.find((s) => s.status === "resolved")?.count || 0;
  const escalatedCount =
    statusData.find((s) => s.status === "escalated")?.count || 0;
  const activeCount =
    statusData.find((s) => s.status === "active")?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/analytics">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Analyse des conversations</h2>
          <p className="text-gray-500">
            Analyse detaillee de vos conversations WhatsApp
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Conversations
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount} actives actuellement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalConversations > 0
                ? Math.round((resolvedCount / totalConversations) * 100)
                : 0}
              % du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escaladees</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {escalatedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalConversations > 0
                ? Math.round((escalatedCount / totalConversations) * 100)
                : 0}
              % du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Temps de reponse
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgResponseTime
                ? `${Math.round(metrics.avgResponseTime / 60000)}min`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Moyenne (30j)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <LazyConversationBreakdown
          data={statusData}
          type="status"
          title="Repartition par statut"
        />
        <LazyConversationBreakdown
          data={intentData}
          type="intent"
          title="Repartition par intention"
        />
      </div>

      {/* Charts Row 2: Heatmap */}
      <HeatmapChart data={heatmapData} />

      {/* Charts Row 3: Resolution Time */}
      <ResolutionTimeChart data={resolutionData} />
    </div>
  );
}
