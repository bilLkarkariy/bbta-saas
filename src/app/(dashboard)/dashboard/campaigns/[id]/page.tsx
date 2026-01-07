import { notFound } from "next/navigation";
import { getCampaign } from "../actions";
import { CampaignDetail } from "@/components/dashboard/campaigns/CampaignDetail";

interface CampaignDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailRoute({ params }: CampaignDetailRouteProps) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  if (!campaign) {
    notFound();
  }

  return <CampaignDetail campaign={campaign} />;
}
