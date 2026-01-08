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

export default async function AnalyticsPage() {
  const { tenant } = await getCurrentTenant();

  // Fetch all analytics data in parallel
  const [metrics, conversationsTrend, intentDistribution, agentPerformance] =
    await Promise.all([
      getDashboardMetrics(tenant.id),
      getConversationsTrend(tenant.id, 30),
      getConversationsByIntent(tenant.id),
      getAgentPerformance(tenant.id),
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
          <Link href="/dashboard/analytics/conversations">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Conversations
            </Button>
          </Link>
          <ExportButton days={30} />
          <span className="text-sm text-slate-500 hidden sm:inline">
            Derniers 30 jours
          </span>
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
