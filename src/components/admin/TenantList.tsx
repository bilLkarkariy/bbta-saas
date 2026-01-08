"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  MessageSquare,
  HelpCircle,
  Calendar,
  Phone,
  Settings,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TenantWithCounts = {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  businessName: string | null;
  whatsappNumber: string | null;
  plan: string;
  status: string;
  createdAt: Date;
  _count: {
    users: number;
    conversations: number;
    faqs: number;
    bookings: number;
  };
  integrations: { status: string }[];
};

export function TenantList({ tenants }: { tenants: TenantWithCounts[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filteredTenants = tenants.filter((tenant) => {
    if (filter === "all") return true;
    if (filter === "active") return tenant.status === "active";
    if (filter === "trial") return tenant.status === "trial";
    if (filter === "connected")
      return tenant.integrations.some((i) => i.status === "connected");
    return true;
  });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "pro":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "trial":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {["all", "active", "trial", "connected"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-slate-800 hover:bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tenant Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTenants.map((tenant) => {
          const twilioConnected = tenant.integrations.some(
            (i) => i.status === "connected"
          );

          return (
            <Card
              key={tenant.id}
              className="bg-white/60 backdrop-blur-sm border-white/50 hover:border-slate-200 hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-800 text-base">
                        {tenant.name}
                      </CardTitle>
                      <p className="text-xs text-slate-400">@{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${getPlanBadgeColor(
                        tenant.plan
                      )}`}
                    >
                      {tenant.plan}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadgeColor(
                        tenant.status
                      )}`}
                    >
                      {tenant.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Info */}
                <div className="text-sm text-slate-500">
                  <span className="capitalize">{tenant.businessType}</span>
                  {tenant.businessName && (
                    <span className="block text-slate-400 truncate">
                      {tenant.businessName}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-50/80">
                    <Users className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <span className="text-slate-700 text-sm font-medium">
                      {tenant._count.users}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50/80">
                    <MessageSquare className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <span className="text-slate-700 text-sm font-medium">
                      {tenant._count.conversations}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50/80">
                    <HelpCircle className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <span className="text-slate-700 text-sm font-medium">
                      {tenant._count.faqs}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50/80">
                    <Calendar className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <span className="text-slate-700 text-sm font-medium">
                      {tenant._count.bookings}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Status */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-500">
                      {tenant.whatsappNumber || "Not configured"}
                    </span>
                  </div>
                  {twilioConnected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-300" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/admin/tenants/${tenant.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </Link>
                  <Link
                    href={`/admin/tenants/${tenant.id}/impersonate`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-indigo-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View As
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No tenants found matching your filter.
        </div>
      )}
    </div>
  );
}
