import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import { WelcomeIllustration } from "@/components/dashboard/WelcomeIllustration";
import { IconMessages, IconContacts, IconTarget, IconCalendar } from "@/components/dashboard/DashboardIcons";
import { OnboardingWidget } from "@/components/dashboard/OnboardingWidget";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Bell, Plus } from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function DashboardPage() {
  const { user, tenant, tenantId } = await getCurrentTenant();
  const firstName = user.name?.split(" ")[0] || "there";

  // Fetch real stats from database
  const [conversationCount, faqCount, contactCount] = await Promise.all([
    db.conversation.count({ where: { tenantId } }),
    db.fAQ.count({ where: { tenantId } }),
    // TODO: Add Contact model
    Promise.resolve(0),
  ]);

  // Calculate response rate (placeholder for now)
  const responseRate = conversationCount > 0 ? 98.5 : 100;

  return (
    <main className="space-y-6 p-6 relative min-h-full" aria-labelledby="dashboard-heading">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 animate-fade-up stagger-1">
        <div className="flex items-center gap-6">
          <div className="hidden md:block w-28 h-20 shrink-0 -my-2">
            <WelcomeIllustration className="w-full h-full drop-shadow-lg" />
          </div>
          <div>
            <p className="text-label mb-1">Tableau de bord</p>
            <h1 id="dashboard-heading" className="text-2xl font-bold tracking-tight">
              {getGreeting()}, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Voici l'essentiel de votre activité.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex"
            aria-label="Notifications - 3 non lues"
          >
            <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
            Notifications
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
              aria-hidden="true"
            >
              3
            </Badge>
          </Button>
          <Button size="sm" className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Action Rapide
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <section aria-labelledby="kpi-heading" className="relative z-10 animate-fade-up stagger-2">
        <h2 id="kpi-heading" className="sr-only">Indicateurs clés de performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Messages"
            value={conversationCount.toLocaleString('fr-FR')}
            trend="12.5%"
            trendUp={true}
            icon={<IconMessages className="h-5 w-5" />}
          />
          <StatsCard
            title="Contacts"
            value={contactCount.toLocaleString('fr-FR')}
            trend="+23"
            trendUp={true}
            icon={<IconContacts className="h-5 w-5" />}
            description="Contacts actifs"
          />
          <StatsCard
            title="Taux de Réponse"
            value={`${responseRate}%`}
            trend="2.1%"
            trendUp={true}
            icon={<IconTarget className="h-5 w-5" />}
          />
          <StatsCard
            title="Rendez-vous"
            value="0"
            icon={<IconCalendar className="h-5 w-5" />}
            description="Prévus aujourd'hui"
          />
        </div>
      </section>

      {/* Charts & Onboarding */}
      <section aria-labelledby="activity-heading" className="relative z-10 animate-fade-up stagger-3">
        <h2 id="activity-heading" className="sr-only">Activité et progression</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-full">
            <ChartWidget />
          </div>
          <div className="lg:col-span-1 h-full">
            <OnboardingWidget faqCount={faqCount} />
          </div>
        </div>
      </section>

      {/* Recent Activity & Quick Actions */}
      <section aria-labelledby="recent-heading" className="relative z-10 animate-fade-up stagger-4">
        <h2 id="recent-heading" className="sr-only">Conversations récentes et actions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-full">
            <RecentConversations />
          </div>
          <div className="lg:col-span-1 h-full">
            <QuickActions />
          </div>
        </div>
      </section>
    </main>
  );
}
