import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { TemplatesPage } from "@/components/dashboard/templates/TemplatesPage";

export default async function TemplatesRoute() {
  const { tenantId } = await getCurrentTenant();

  const templates = await db.messageTemplate.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return <TemplatesPage initialTemplates={templates} />;
}
