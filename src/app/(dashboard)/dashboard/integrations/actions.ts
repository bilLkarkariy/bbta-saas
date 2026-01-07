"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentTenant } from "@/lib/auth";
import { encrypt, decrypt, isEncrypted } from "@/lib/encryption";

export async function getIntegrations() {
  const { tenantId } = await getCurrentTenant();

  const integrations = await db.integration.findMany({
    where: { tenantId },
    orderBy: { type: "asc" },
  });

  // If no integrations exist, create default ones
  if (integrations.length === 0) {
    const defaults = [
      { type: "twilio", name: "Twilio WhatsApp" },
    ];

    await db.integration.createMany({
      data: defaults.map((d) => ({
        tenantId,
        type: d.type,
        name: d.name,
        status: "disconnected",
      })),
    });

    return db.integration.findMany({
      where: { tenantId },
      orderBy: { type: "asc" },
    });
  }

  return integrations;
}

export async function updateTwilioCredentials(formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const accountSid = formData.get("accountSid") as string;
  const authToken = formData.get("authToken") as string;
  const whatsappNumber = formData.get("whatsappNumber") as string;

  if (!accountSid || !authToken) {
    return { error: "Identifiants requis" };
  }

  try {
    // Encrypt sensitive credentials before storing
    const encryptedAuthToken = encrypt(authToken);

    await db.integration.upsert({
      where: { tenantId_type: { tenantId, type: "twilio" } },
      create: {
        tenantId,
        type: "twilio",
        name: "Twilio WhatsApp",
        status: "disconnected",
        credentials: { accountSid, authToken: encryptedAuthToken },
        config: { whatsappNumber },
      },
      update: {
        credentials: { accountSid, authToken: encryptedAuthToken },
        config: { whatsappNumber },
        status: "disconnected", // Will be updated after test
      },
    });

    // Also update tenant's WhatsApp number
    if (whatsappNumber) {
      await db.tenant.update({
        where: { id: tenantId },
        data: { whatsappNumber, twilioSid: accountSid },
      });
    }

    revalidatePath("/dashboard/integrations");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la sauvegarde" };
  }
}

export async function testTwilioConnection() {
  const { tenantId } = await getCurrentTenant();

  try {
    const integration = await db.integration.findUnique({
      where: { tenantId_type: { tenantId, type: "twilio" } },
    });

    if (!integration?.credentials) {
      return { error: "Aucun identifiant configuré" };
    }

    const credentials = integration.credentials as {
      accountSid: string;
      authToken: string;
    };

    // Decrypt auth token if encrypted
    const authToken = isEncrypted(credentials.authToken)
      ? decrypt(credentials.authToken)
      : credentials.authToken;
    const accountSid = credentials.accountSid;

    // Test connection by fetching account info
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      await db.integration.update({
        where: { id: integration.id },
        data: {
          status: "error",
          lastError: "Identifiants invalides",
          lastCheckedAt: new Date(),
        },
      });
      return { error: "Identifiants invalides" };
    }

    const accountData = await response.json();

    // Update integration status
    await db.integration.update({
      where: { id: integration.id },
      data: {
        status: "connected",
        lastError: null,
        lastCheckedAt: new Date(),
        config: {
          ...((integration.config as object) || {}),
          accountName: accountData.friendly_name,
          accountStatus: accountData.status,
        },
      },
    });

    revalidatePath("/dashboard/integrations");
    return { success: true, account: accountData.friendly_name };
  } catch {
    return { error: "Erreur de connexion" };
  }
}

export async function disconnectIntegration(type: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.integration.update({
      where: { tenantId_type: { tenantId, type } },
      data: {
        status: "disconnected",
        credentials: undefined,
        lastError: null,
      },
    });

    if (type === "twilio") {
      await db.tenant.update({
        where: { id: tenantId },
        data: { whatsappNumber: null, twilioSid: null },
      });
    }

    revalidatePath("/dashboard/integrations");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la déconnexion" };
  }
}

export async function getWebhookUrl() {
  // In production, this would be the actual webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com";
  return `${baseUrl}/api/webhooks/twilio`;
}
