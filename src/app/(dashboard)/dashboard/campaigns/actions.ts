"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentTenant } from "@/lib/auth";
import { z } from "zod";

const campaignSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  templateId: z.string().optional(),
  customMessage: z.string().optional(),
  segmentId: z.string().optional(),
  contactIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
});

export async function getCampaigns(params?: { status?: string }) {
  const { tenantId } = await getCurrentTenant();
  const { status } = params || {};

  return db.campaign.findMany({
    where: {
      tenantId,
      ...(status && status !== "all" && { status }),
    },
    include: {
      template: { select: { name: true } },
      segment: { select: { name: true } },
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCampaign(id: string) {
  const { tenantId } = await getCurrentTenant();

  return db.campaign.findUnique({
    where: { id, tenantId },
    include: {
      template: true,
      segment: true,
      recipients: {
        include: { contact: true },
        orderBy: { sentAt: "desc" },
        take: 100,
      },
    },
  });
}

export async function createCampaign(formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const contactIds = formData.getAll("contactIds") as string[];
  const validated = campaignSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    templateId: formData.get("templateId") || undefined,
    customMessage: formData.get("customMessage") || undefined,
    segmentId: formData.get("segmentId") || undefined,
    contactIds,
    scheduledAt: formData.get("scheduledAt") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { scheduledAt, contactIds: ids, ...data } = validated.data;

  try {
    // Get contacts to add as recipients
    let recipientContactIds = ids || [];

    // If segment is selected, get contacts from segment (for now, get all contacts)
    if (data.segmentId && recipientContactIds.length === 0) {
      const contacts = await db.contact.findMany({
        where: { tenantId },
        select: { id: true },
        take: 1000,
      });
      recipientContactIds = contacts.map((c) => c.id);
    }

    const campaign = await db.campaign.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        templateId: data.templateId || null,
        customMessage: data.customMessage,
        segmentId: data.segmentId || null,
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients: recipientContactIds.length,
        recipients: {
          create: recipientContactIds.map((contactId) => ({
            contactId,
            status: "pending",
          })),
        },
      },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true, campaign };
  } catch (error) {
    console.error("Campaign creation error:", error);
    return { error: "Erreur lors de la création" };
  }
}

export async function updateCampaign(id: string, formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const validated = campaignSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    templateId: formData.get("templateId") || undefined,
    customMessage: formData.get("customMessage") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { scheduledAt, ...data } = validated.data;

  try {
    const campaign = await db.campaign.update({
      where: { id, tenantId },
      data: {
        name: data.name,
        description: data.description,
        templateId: data.templateId || null,
        customMessage: data.customMessage,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true, campaign };
  } catch {
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteCampaign(id: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.campaign.delete({
      where: { id, tenantId },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression" };
  }
}

export async function sendCampaign(id: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    // Get campaign with recipients
    const campaign = await db.campaign.findUnique({
      where: { id, tenantId },
      include: {
        template: true,
        recipients: { include: { contact: true } },
      },
    });

    if (!campaign) {
      return { error: "Campagne non trouvée" };
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return { error: "Cette campagne ne peut pas être envoyée" };
    }

    // Update status to sending
    await db.campaign.update({
      where: { id },
      data: { status: "sending", sentAt: new Date() },
    });

    // In a real implementation, you would:
    // 1. Queue messages to be sent via Twilio
    // 2. Update recipient statuses as messages are sent
    // 3. Handle webhooks for delivery status updates

    // For now, simulate sending by marking all as sent
    await db.campaignRecipient.updateMany({
      where: { campaignId: id },
      data: { status: "sent", sentAt: new Date() },
    });

    await db.campaign.update({
      where: { id },
      data: {
        status: "sent",
        completedAt: new Date(),
        sentCount: campaign.recipients.length,
      },
    });

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${id}`);
    return { success: true };
  } catch {
    return { error: "Erreur lors de l'envoi" };
  }
}

export async function cancelCampaign(id: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.campaign.update({
      where: { id, tenantId },
      data: { status: "cancelled" },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch {
    return { error: "Erreur lors de l'annulation" };
  }
}

// Get data for campaign creation wizard
export async function getWizardData() {
  const { tenantId } = await getCurrentTenant();

  const [contacts, templates, segments] = await Promise.all([
    db.contact.findMany({
      where: { tenantId, isOptedOut: false },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    db.messageTemplate.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, content: true, variables: true },
      orderBy: { name: "asc" },
    }),
    db.segment.findMany({
      where: { tenantId },
      select: { id: true, name: true, contactCount: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { contacts, templates, segments };
}
