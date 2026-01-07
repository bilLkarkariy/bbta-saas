import { getWizardData } from "../actions";
import { CampaignWizard } from "@/components/dashboard/campaigns/CampaignWizard";

export default async function NewCampaignRoute() {
  const { contacts, templates, segments } = await getWizardData();

  return (
    <CampaignWizard
      contacts={contacts}
      templates={templates}
      segments={segments}
    />
  );
}
