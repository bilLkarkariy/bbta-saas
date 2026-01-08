import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  MessageSquare,
  Building2,
  Phone,
  Clock,
  User,
  ChevronRight,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function formatDate(date: Date | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "closed":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "escalated":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default async function AdminConversationsPage() {
  await requireSuperAdmin();

  const conversations = await db.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      tenant: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { messages: true },
      },
    },
    take: 100,
  });

  // Get stats
  const stats = await db.conversation.groupBy({
    by: ["status"],
    _count: true,
  });

  const totalConversations = conversations.length;
  const openCount = stats.find((s) => s.status === "open")?._count || 0;
  const pendingCount = stats.find((s) => s.status === "pending")?._count || 0;
  const escalatedCount = stats.find((s) => s.status === "escalated")?._count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Conversations</h1>
        <p className="text-slate-500 mt-1">
          View and monitor conversations across all tenants
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalConversations}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{openCount}</p>
              <p className="text-xs text-slate-500">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{escalatedCount}</p>
              <p className="text-xs text-slate-500">Escalated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search conversations..."
          className="pl-10 bg-white/80 border-slate-200 text-slate-800"
          disabled
        />
      </div>

      {/* Conversations List */}
      <Card className="bg-white/60 backdrop-blur-sm border-white/50">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            Recent Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/admin/conversations/${conv.id}`}
                className="block"
              >
                <div className="p-4 rounded-xl bg-white/80 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
                        <User className="h-5 w-5 text-white" />
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-800 font-medium">
                            {conv.customerName || conv.customerPhone}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(
                              conv.status
                            )}`}
                          >
                            {conv.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {conv.customerPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conv._count.messages} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(conv.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tenant & Arrow */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                        <Building2 className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm text-indigo-700 font-medium">
                          {conv.tenant.name}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {conversations.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                No conversations yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
