import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Bot,
  UserCheck,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentTenant } from "@/lib/auth";
import {
  getDashboardMetrics,
  getConversationsTrend,
  getConversationsByIntent,
  getAgentPerformance,
} from "@/lib/analytics/queries";
import {
  AnalyticsCard,
  LazyConversationChart,
  LazyConversationBreakdown,
  AgentLeaderboard,
} from "@/components/dashboard/analytics";
import { ExportButton } from "@/components/dashboard/analytics/ExportButton";
import { PeriodSelector } from "@/components/dashboard/analytics/PeriodSelector";

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { tenant } = await getCurrentTenant();
  const params = await searchParams;
  const period = parseInt(params.period || "30");

  // Create date range for analytics queries
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - period);
  const dateRange = { start, end: now };

  // Fetch all analytics data in parallel
  const [metrics, conversationsTrend, intentDistribution, agentPerformance] =
    await Promise.all([
      getDashboardMetrics(tenant.id, dateRange),
      getConversationsTrend(tenant.id, period),
      getConversationsByIntent(tenant.id, period),
      getAgentPerformance(tenant.id, dateRange),
    ]);

  // Calculate change percentages (mock for now - would need historical data)
  const conversationChange = 12.5;
  const messageChange = 8.3;
  const responseTimeChange = -15.2; // negative is good

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelector />
          <Link href="/dashboard/analytics/conversations">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Conversations
            </Button>
          </Link>
          <ExportButton days={period} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Conversations"
          value={metrics.totalConversations}
          change={conversationChange}
          icon={<MessageSquare className="h-4 w-4" />}
          description={`${metrics.activeConversations} actives`}
        />
        <AnalyticsCard
          title="Messages"
          value={metrics.messagesTotal}
          change={messageChange}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <AnalyticsCard
          title="Temps de reponse"
          value={metrics.avgResponseTime || 0}
          change={responseTimeChange}
          icon={<Clock className="h-4 w-4" />}
          format="time"
        />
        <AnalyticsCard
          title="Resolution Bot"
          value={metrics.botResolutionRate || 0}
          icon={<Bot className="h-4 w-4" />}
          format="percent"
          description="sans escalade"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazyConversationChart
          data={conversationsTrend}
          title="Nouvelles Conversations"
        />
        <LazyConversationBreakdown
          data={intentDistribution}
          type="intent"
          title="Répartition des Demandes"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AgentLeaderboard data={agentPerformance} />
        </div>
        <div className="space-y-4">
          <AnalyticsCard
            title="Leads Captures"
            value={metrics.leadsCapture}
            icon={<UserCheck className="h-4 w-4" />}
            description="ce mois"
          />
          <AnalyticsCard
            title="Taux de Conversion"
            value={
              metrics.totalConversations > 0
                ? (metrics.leadsCapture / metrics.totalConversations) * 100
                : 0
            }
            format="percent"
            icon={<Users className="h-4 w-4" />}
            description="leads / conversations"
          />
        </div>
      </div>
    </div>
  );
}
