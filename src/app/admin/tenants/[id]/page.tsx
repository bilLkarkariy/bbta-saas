import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { TenantConfig } from "@/components/admin/TenantConfig";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clerkId: true,
        },
      },
      faqs: {
        orderBy: { createdAt: "desc" },
      },
      integrations: true,
      _count: {
        select: {
          conversations: true,
          bookings: true,
          contacts: true,
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  return <TenantConfig tenant={tenant} />;
}
