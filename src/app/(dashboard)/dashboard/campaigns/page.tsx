import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { CampaignsPage } from "@/components/dashboard/campaigns/CampaignsPage";

export default async function CampaignsRoute() {
  const { tenantId } = await getCurrentTenant();

  const campaigns = await db.campaign.findMany({
    where: { tenantId },
    include: {
      template: { select: { name: true } },
      segment: { select: { name: true } },
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <CampaignsPage initialCampaigns={campaigns} />;
}
