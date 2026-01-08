"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MessageSquare,
  Calendar,
  Users,
  HelpCircle,
  Phone,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TenantData = {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  businessName: string | null;
  whatsappNumber: string | null;
  plan: string;
  status: string;
  conversations: {
    id: string;
    customerPhone: string;
    customerName: string | null;
    status: string;
    lastMessageAt: Date | null;
    _count: { messages: number };
  }[];
  faqs: {
    id: string;
    question: string;
    answer: string;
    isActive: boolean;
  }[];
  bookings: {
    id: string;
    customerName: string;
    service: string;
    date: Date;
    status: string;
  }[];
  users: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  }[];
  _count: {
    conversations: number;
    faqs: number;
    bookings: number;
    contacts: number;
  };
};

export default function ImpersonatePage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        const res = await fetch(`/api/admin/tenants/${params.id}`);
        if (!res.ok) {
          throw new Error("Failed to load tenant");
        }
        const data = await res.json();
        setTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || "Tenant not found"}</p>
        <Button
          variant="outline"
          className="mt-4 border-slate-200 text-slate-600 hover:text-slate-900"
          onClick={() => router.push("/admin")}
        >
          Back to Admin
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "confirmed":
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-800 hover:bg-white/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Viewing: {tenant.name}
            </h1>
            <p className="text-slate-500">
              @{tenant.slug} • {tenant.plan} plan
            </p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
          Preview Mode
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {tenant._count.conversations}
              </p>
              <p className="text-xs text-slate-500">Conversations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {tenant._count.faqs}
              </p>
              <p className="text-xs text-slate-500">FAQs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {tenant._count.bookings}
              </p>
              <p className="text-xs text-slate-500">Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {tenant._count.contacts}
              </p>
              <p className="text-xs text-slate-500">Contacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Status */}
      <Card className="bg-white/60 backdrop-blur-sm border-white/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-slate-800 font-medium">WhatsApp</p>
              <p className="text-sm text-slate-500">
                {tenant.whatsappNumber || "Not configured"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tenant.whatsappNumber ? (
              <span className="flex items-center gap-1 text-green-700 text-sm">
                <CheckCircle className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 text-sm">
                <XCircle className="h-4 w-4" />
                Not connected
              </span>
            )}
            <Link href={`/admin/tenants/${tenant.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white"
              >
                Configure
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Conversations */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenant.conversations.slice(0, 5).map((conv) => (
                <div
                  key={conv.id}
                  className="p-3 rounded-xl bg-white/80 border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-800 font-medium">
                        {conv.customerName || conv.customerPhone}
                      </p>
                      <p className="text-xs text-slate-400">
                        {conv._count.messages} messages
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                        conv.status
                      )}`}
                    >
                      {conv.status}
                    </span>
                  </div>
                </div>
              ))}
              {tenant.conversations.length === 0 && (
                <p className="text-center text-slate-400 py-4">
                  No conversations yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-green-500" />
              FAQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenant.faqs.slice(0, 5).map((faq) => (
                <div
                  key={faq.id}
                  className="p-3 rounded-xl bg-white/80 border border-slate-200"
                >
                  <p className="text-slate-800 text-sm font-medium truncate">
                    {faq.question}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {faq.answer}
                  </p>
                </div>
              ))}
              {tenant.faqs.length === 0 && (
                <p className="text-center text-slate-400 py-4">No FAQs yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenant.users.map((user) => (
                <div
                  key={user.id}
                  className="p-3 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-medium">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-800 text-sm">
                        {user.name || "No name"}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase font-medium">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenant.bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="p-3 rounded-xl bg-white/80 border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">
                        {booking.customerName}
                      </p>
                      <p className="text-xs text-slate-400">{booking.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        {new Date(booking.date).toLocaleDateString("fr-FR")}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {tenant.bookings.length === 0 && (
                <p className="text-center text-slate-400 py-4">No bookings yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
