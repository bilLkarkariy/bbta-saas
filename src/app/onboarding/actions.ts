"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { BusinessVertical } from "@/config/verticals/types";

export interface OnboardingData {
  verticalId: BusinessVertical;
  selections: Record<string, string[]>;
  completedAt: string;
  [key: string]: unknown;
}

/**
 * Save onboarding data and mark tenant as onboarded
 */
export async function completeOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Non authentifié" };
    }

    // Find user and their tenant
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { tenant: true },
    });

    if (!user || !user.tenant) {
      return { success: false, error: "Utilisateur ou entreprise non trouvé" };
    }

    const tenantId = user.tenantId;

    // Build tenant update data
    const updateData: Record<string, unknown> = {
      onboardingCompleted: true,
      businessType: data.verticalId,
      verticalConfig: data,
    };

    // Extract business info if present
    if (data.salonName || data.businessName || data.shopName) {
      updateData.businessName = data.salonName || data.businessName || data.shopName;
    }

    if (data.address) {
      updateData.address = data.address;
    }

    if (data.phone) {
      updateData.phone = data.phone;
    }

    // Update tenant
    await db.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    // Import selected services if present
    const serviceSelections = data.selections?.["services-setup"];
    if (serviceSelections && serviceSelections.length > 0) {
      // Services would be imported here based on vertical
      console.log("[Onboarding] Services selected:", serviceSelections);
    }

    // Import selected FAQs if present
    const faqSelections = data.selections?.["faq-setup"];
    if (faqSelections && faqSelections.length > 0) {
      // FAQs would be imported here
      console.log("[Onboarding] FAQs selected:", faqSelections);
    }

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[Onboarding] Error completing onboarding:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Get tenant's current onboarding status
 */
export async function getOnboardingStatus(): Promise<{
  isComplete: boolean;
  vertical: BusinessVertical | null;
  tenantId: string | null;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { isComplete: false, vertical: null, tenantId: null };
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { tenant: true },
    });

    if (!user || !user.tenant) {
      return { isComplete: false, vertical: null, tenantId: null };
    }

    return {
      isComplete: user.tenant.onboardingCompleted || false,
      vertical: (user.tenant.businessType as BusinessVertical) || null,
      tenantId: user.tenant.id,
    };
  } catch {
    return { isComplete: false, vertical: null, tenantId: null };
  }
}
