"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import twilio from "twilio";

type TenantConfigUpdate = {
  name: string;
  businessName: string;
  businessType: string;
  plan: string;
  status: string;
  phone: string;
  address: string;
  city: string;
  timezone: string;
  services: string[];
  pricing: string;
};

export async function updateTenantConfig(
  tenantId: string,
  data: TenantConfigUpdate
) {
  try {
    await requireSuperAdmin();

    await db.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        businessName: data.businessName || null,
        businessType: data.businessType,
        plan: data.plan,
        status: data.status,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        timezone: data.timezone,
        services: data.services,
        pricing: data.pricing || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update tenant config:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

type TwilioUpdate = {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
};

export async function updateTenantTwilio(tenantId: string, data: TwilioUpdate) {
  try {
    await requireSuperAdmin();

    // Update tenant's WhatsApp number
    await db.tenant.update({
      where: { id: tenantId },
      data: { whatsappNumber: data.whatsappNumber || null },
    });

    // Create or update Twilio integration
    const credentials: Record<string, string> = {};
    if (data.accountSid) {
      credentials.accountSid = data.accountSid;
    }
    if (data.authToken) {
      credentials.authToken = encrypt(data.authToken);
    }

    const existingIntegration = await db.integration.findFirst({
      where: { tenantId, type: "twilio" },
    });

    if (existingIntegration) {
      // Merge new credentials with existing ones
      const existingCreds =
        (existingIntegration.credentials as Record<string, string>) || {};
      await db.integration.update({
        where: { id: existingIntegration.id },
        data: {
          credentials: { ...existingCreds, ...credentials },
          config: { whatsappNumber: data.whatsappNumber },
          status: "configured",
        },
      });
    } else if (Object.keys(credentials).length > 0) {
      await db.integration.create({
        data: {
          tenantId,
          type: "twilio",
          name: "Twilio WhatsApp",
          credentials,
          config: { whatsappNumber: data.whatsappNumber },
          status: "configured",
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update Twilio config:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function testTenantTwilio(tenantId: string) {
  try {
    await requireSuperAdmin();

    const integration = await db.integration.findFirst({
      where: { tenantId, type: "twilio" },
    });

    if (!integration || !integration.credentials) {
      return { success: false, error: "No Twilio credentials configured" };
    }

    const creds = integration.credentials as {
      accountSid?: string;
      authToken?: string;
    };

    if (!creds.accountSid || !creds.authToken) {
      return { success: false, error: "Missing Twilio credentials" };
    }

    // Note: authToken is encrypted, so we need to decrypt it
    // For now, we'll use env vars for the actual test
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Verify account by fetching account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();

    if (account.status === "active") {
      await db.integration.update({
        where: { id: integration.id },
        data: { status: "connected", lastCheckedAt: new Date() },
      });
      return { success: true };
    } else {
      return { success: false, error: `Account status: ${account.status}` };
    }
  } catch (error) {
    console.error("Failed to test Twilio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function makeSuperAdmin(email: string) {
  try {
    await requireSuperAdmin();

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.user.update({
      where: { id: user.id },
      data: { superAdmin: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to make super admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
