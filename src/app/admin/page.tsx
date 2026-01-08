import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { TenantList } from "@/components/admin/TenantList";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  await requireSuperAdmin();

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          conversations: true,
          faqs: true,
          bookings: true,
        },
      },
      integrations: {
        where: { type: "twilio" },
        select: { status: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenant Management</h1>
          <p className="text-slate-500 mt-1">
            Manage all tenants and their configurations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <span className="text-slate-500 text-sm">Total Tenants:</span>
            <span className="text-slate-800 font-semibold">{tenants.length}</span>
          </div>
          <Link href="/admin/tenants/new">
            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/20">
              <Plus className="h-4 w-4 mr-2" />
              New Tenant
            </Button>
          </Link>
        </div>
      </div>

      <TenantList tenants={tenants} />
    </div>
  );
}
