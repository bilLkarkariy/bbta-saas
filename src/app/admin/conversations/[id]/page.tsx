import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Building2,
  Phone,
  Clock,
  User,
  Bot,
  UserCircle,
  Calendar,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("fr-FR", {
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

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();

  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      tenant: {
        select: { id: true, name: true, slug: true, businessType: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  // Group messages by date
  const messagesByDate = conversation.messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString("fr-FR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as Record<string, typeof conversation.messages>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/conversations">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-800 hover:bg-white/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">
                {conversation.customerName || conversation.customerPhone}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(
                  conversation.status
                )}`}
              >
                {conversation.status}
              </span>
            </div>
            <p className="text-slate-500 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {conversation.customerPhone}
            </p>
          </div>
        </div>
        <Link href={`/admin/tenants/${conversation.tenant.id}`}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors">
            <Building2 className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-indigo-700 font-medium">
              {conversation.tenant.name}
            </span>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversation Info */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-slate-800 text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Customer
                </span>
                <span className="text-sm text-slate-800 font-medium">
                  {conversation.customerName || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </span>
                <span className="text-sm text-slate-800 font-medium">
                  {conversation.customerPhone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </span>
                <span className="text-sm text-slate-800 font-medium">
                  {conversation.messages.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <span className="text-sm text-slate-800 font-medium">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last Message
                </span>
                <span className="text-sm text-slate-800 font-medium">
                  {formatDate(conversation.lastMessageAt)}
                </span>
              </div>
{/* Intent is stored per message, show most recent if available */}
              {conversation.messages.length > 0 &&
                conversation.messages[conversation.messages.length - 1].intent && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Last Intent
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 border border-purple-200">
                      {conversation.messages[conversation.messages.length - 1].intent}
                    </span>
                  </div>
                )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-400 mb-2">Tenant</p>
              <Link
                href={`/admin/tenants/${conversation.tenant.id}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors"
              >
                <Building2 className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-slate-800 font-medium">
                    {conversation.tenant.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    @{conversation.tenant.slug}
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              Messages ({conversation.messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
              {Object.entries(messagesByDate).map(([date, messages]) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.direction === "outbound"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] ${
                            msg.direction === "outbound"
                              ? "order-1"
                              : "order-2"
                          }`}
                        >
                          <div
                            className={`p-3 rounded-2xl ${
                              msg.direction === "outbound"
                                ? "bg-indigo-500 text-white rounded-br-md"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-2 mt-1 text-xs text-slate-400 ${
                              msg.direction === "outbound"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            {msg.direction === "outbound" ? (
                              <Bot className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            <span>{formatTime(msg.createdAt)}</span>
                            {msg.tierUsed && (
                              <span className="text-slate-300">
                                {msg.tierUsed}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {conversation.messages.length === 0 && (
                <p className="text-center text-slate-400 py-8">
                  No messages in this conversation
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
