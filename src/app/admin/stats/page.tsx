import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Building2,
  Users,
  MessageSquare,
  Calendar,
  HelpCircle,
  TrendingUp,
  Phone,
  UserCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminStatsPage() {
  await requireSuperAdmin();

  // Fetch global stats
  const [
    tenantCount,
    userCount,
    conversationCount,
    messageCount,
    faqCount,
    bookingCount,
    contactCount,
    connectedTwilioCount,
  ] = await Promise.all([
    db.tenant.count(),
    db.user.count(),
    db.conversation.count(),
    db.message.count(),
    db.fAQ.count(),
    db.booking.count(),
    db.contact.count(),
    db.integration.count({ where: { type: "twilio", status: "connected" } }),
  ]);

  // Get recent tenants
  const recentTenants = await db.tenant.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      plan: true,
      createdAt: true,
      _count: { select: { conversations: true } },
    },
  });

  // Get top tenants by conversations
  const topTenants = await db.tenant.findMany({
    take: 5,
    orderBy: { conversations: { _count: "desc" } },
    select: {
      id: true,
      name: true,
      plan: true,
      _count: { select: { conversations: true, users: true } },
    },
  });

  const stats = [
    {
      label: "Total Tenants",
      value: tenantCount,
      icon: Building2,
      color: "from-indigo-500 to-purple-500",
      shadow: "shadow-indigo-500/20",
    },
    {
      label: "Total Users",
      value: userCount,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Conversations",
      value: conversationCount,
      icon: MessageSquare,
      color: "from-green-500 to-emerald-500",
      shadow: "shadow-green-500/20",
    },
    {
      label: "Messages",
      value: messageCount,
      icon: TrendingUp,
      color: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/20",
    },
    {
      label: "FAQs",
      value: faqCount,
      icon: HelpCircle,
      color: "from-pink-500 to-rose-500",
      shadow: "shadow-pink-500/20",
    },
    {
      label: "Bookings",
      value: bookingCount,
      icon: Calendar,
      color: "from-violet-500 to-purple-500",
      shadow: "shadow-violet-500/20",
    },
    {
      label: "Contacts",
      value: contactCount,
      icon: UserCircle,
      color: "from-teal-500 to-cyan-500",
      shadow: "shadow-teal-500/20",
    },
    {
      label: "Twilio Connected",
      value: connectedTwilioCount,
      icon: Phone,
      color: "from-red-500 to-orange-500",
      shadow: "shadow-red-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Statistics</h1>
        <p className="text-slate-500 mt-1">
          Global overview of all tenants and usage
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-white/60 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" />
              Recent Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-slate-200"
                >
                  <div>
                    <p className="text-slate-800 font-medium">{tenant.name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {tenant.plan}
                    </span>
                    <span className="text-sm text-slate-500">
                      {tenant._count.conversations} conv.
                    </span>
                  </div>
                </div>
              ))}
              {recentTenants.length === 0 && (
                <p className="text-center text-slate-400 py-4">No tenants yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Tenants */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Tenants by Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTenants.map((tenant, index) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-slate-800 font-medium">{tenant.name}</p>
                      <p className="text-xs text-slate-400">
                        {tenant._count.users} users
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">
                    {tenant._count.conversations}
                  </span>
                </div>
              ))}
              {topTenants.length === 0 && (
                <p className="text-center text-slate-400 py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
