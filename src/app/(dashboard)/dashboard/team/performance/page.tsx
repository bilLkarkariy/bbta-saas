import { getCurrentTenant } from "@/lib/auth";
import { getAgentStats } from "@/lib/analytics/agent-stats";
import { AgentPerformanceTable } from "@/components/dashboard/team/AgentPerformanceTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, TrendingUp, MessageSquare, Clock } from "lucide-react";

export default async function TeamPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { tenant } = await getCurrentTenant();
  const params = await searchParams;
  const period = parseInt(params.period || "30", 10);

  const stats = await getAgentStats(tenant.id, { period });

  // Calculate team totals
  const totals = stats.reduce(
    (acc, agent) => ({
      conversations: acc.conversations + agent.conversationsHandled,
      resolved: acc.resolved + agent.conversationsResolved,
      escalated: acc.escalated + agent.conversationsEscalated,
      messages: acc.messages + agent.messagesResponded,
    }),
    { conversations: 0, resolved: 0, escalated: 0, messages: 0 }
  );

  const avgResponseTimes = stats
    .map((a) => a.avgResponseTimeMs)
    .filter((t): t is number => t !== null);
  const teamAvgResponseTime =
    avgResponseTimes.length > 0
      ? Math.round(avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length)
      : null;

  const teamResolutionRate =
    totals.resolved + totals.escalated > 0
      ? totals.resolved / (totals.resolved + totals.escalated)
      : 0;

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return "-";
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}min`;
    return `${Math.round(ms / 3600000)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/team">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Performance de l&apos;équipe</h2>
            <p className="text-gray-500">
              Suivez les métriques de performance de vos agents
            </p>
          </div>
        </div>
      </div>

      {/* Period Tabs */}
      <Tabs defaultValue={period.toString()} className="w-full">
        <TabsList>
          <TabsTrigger value="7" asChild>
            <Link href="?period=7">7 jours</Link>
          </TabsTrigger>
          <TabsTrigger value="30" asChild>
            <Link href="?period=30">30 jours</Link>
          </TabsTrigger>
          <TabsTrigger value="90" asChild>
            <Link href="?period=90">90 jours</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={period.toString()} className="mt-6">
          {/* Team Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversations traitées
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.conversations}</div>
                <p className="text-xs text-muted-foreground">
                  {totals.resolved} résolues · {totals.escalated} escaladées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Messages envoyés
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.messages}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.length > 0
                    ? Math.round(totals.messages / stats.length)
                    : 0}{" "}
                  moy. par agent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Temps de réponse
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatResponseTime(teamAvgResponseTime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Moyenne de l&apos;équipe
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taux de résolution
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(teamResolutionRate * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Résolu vs. escaladé
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance par agent</CardTitle>
              <CardDescription>
                Cliquez sur les en-têtes de colonnes pour trier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentPerformanceTable agents={stats} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
