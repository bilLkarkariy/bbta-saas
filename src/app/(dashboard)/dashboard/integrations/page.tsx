import { getIntegrations, getWebhookUrl } from "./actions";
import { IntegrationsPage } from "@/components/dashboard/integrations/IntegrationsPage";

export default async function IntegrationsRoute() {
  const [integrations, webhookUrl] = await Promise.all([
    getIntegrations(),
    getWebhookUrl(),
  ]);

  return <IntegrationsPage integrations={integrations} webhookUrl={webhookUrl} />;
}
