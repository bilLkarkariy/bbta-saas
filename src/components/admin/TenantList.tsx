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
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "pro":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "trial":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "border-white/10 text-gray-400 hover:text-white"
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
              className="bg-gray-900/50 border-white/10 hover:border-white/20 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">
                        {tenant.name}
                      </CardTitle>
                      <p className="text-xs text-gray-500">@{tenant.slug}</p>
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
                <div className="text-sm text-gray-400">
                  <span className="capitalize">{tenant.businessType}</span>
                  {tenant.businessName && (
                    <span className="block text-gray-500 truncate">
                      {tenant.businessName}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Users className="h-4 w-4 mx-auto text-gray-500 mb-1" />
                    <span className="text-white text-sm font-medium">
                      {tenant._count.users}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <MessageSquare className="h-4 w-4 mx-auto text-gray-500 mb-1" />
                    <span className="text-white text-sm font-medium">
                      {tenant._count.conversations}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <HelpCircle className="h-4 w-4 mx-auto text-gray-500 mb-1" />
                    <span className="text-white text-sm font-medium">
                      {tenant._count.faqs}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <Calendar className="h-4 w-4 mx-auto text-gray-500 mb-1" />
                    <span className="text-white text-sm font-medium">
                      {tenant._count.bookings}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Status */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-400">
                      {tenant.whatsappNumber || "Not configured"}
                    </span>
                  </div>
                  {twilioConnected ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/admin/tenants/${tenant.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-white/10 text-gray-400 hover:text-white"
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
                      className="w-full border-indigo-500/30 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
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
        <div className="text-center py-12 text-gray-500">
          No tenants found matching your filter.
        </div>
      )}
    </div>
  );
}
