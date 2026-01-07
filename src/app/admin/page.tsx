import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { TenantList } from "@/components/admin/TenantList";

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
          <h1 className="text-2xl font-bold text-white">Tenant Management</h1>
          <p className="text-gray-400 mt-1">
            Manage all tenants and their configurations
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-gray-400 text-sm">Total Tenants:</span>
          <span className="text-white font-semibold">{tenants.length}</span>
        </div>
      </div>

      <TenantList tenants={tenants} />
    </div>
  );
}
