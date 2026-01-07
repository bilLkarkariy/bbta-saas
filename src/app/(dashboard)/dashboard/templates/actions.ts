"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentTenant } from "@/lib/auth";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  content: z.string().min(1, "Contenu requis"),
  category: z.string().default("general"),
});

// Extract variables from template content
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  const variables = matches.map((m) => m.replace(/\{\{|\}\}/g, ""));
  return [...new Set(variables)]; // Remove duplicates
}

export async function getTemplates(params?: { category?: string; search?: string }) {
  const { tenantId } = await getCurrentTenant();
  const { category, search } = params || {};

  return db.messageTemplate.findMany({
    where: {
      tenantId,
      ...(category && category !== "all" && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { content: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTemplate(formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const validated = templateSchema.safeParse({
    name: formData.get("name"),
    content: formData.get("content"),
    category: formData.get("category") || "general",
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const variables = extractVariables(validated.data.content);

  try {
    const template = await db.messageTemplate.create({
      data: {
        tenantId,
        name: validated.data.name,
        content: validated.data.content,
        category: validated.data.category,
        variables,
      },
    });

    revalidatePath("/dashboard/templates");
    return { success: true, template };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "Un modèle avec ce nom existe déjà" };
    }
    return { error: "Erreur lors de la création" };
  }
}

export async function updateTemplate(id: string, formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const validated = templateSchema.safeParse({
    name: formData.get("name"),
    content: formData.get("content"),
    category: formData.get("category") || "general",
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const variables = extractVariables(validated.data.content);

  try {
    const template = await db.messageTemplate.update({
      where: { id, tenantId },
      data: {
        name: validated.data.name,
        content: validated.data.content,
        category: validated.data.category,
        variables,
      },
    });

    revalidatePath("/dashboard/templates");
    return { success: true, template };
  } catch {
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteTemplate(id: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.messageTemplate.delete({
      where: { id, tenantId },
    });

    revalidatePath("/dashboard/templates");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression" };
  }
}

export async function duplicateTemplate(id: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    const original = await db.messageTemplate.findUnique({
      where: { id, tenantId },
    });

    if (!original) {
      return { error: "Modèle non trouvé" };
    }

    // Find unique name
    let copyNumber = 1;
    let newName = `${original.name} (copie)`;

    while (true) {
      const exists = await db.messageTemplate.findUnique({
        where: { tenantId_name: { tenantId, name: newName } },
      });
      if (!exists) break;
      copyNumber++;
      newName = `${original.name} (copie ${copyNumber})`;
    }

    const template = await db.messageTemplate.create({
      data: {
        tenantId,
        name: newName,
        content: original.content,
        category: original.category,
        variables: original.variables,
      },
    });

    revalidatePath("/dashboard/templates");
    return { success: true, template };
  } catch {
    return { error: "Erreur lors de la duplication" };
  }
}

export async function toggleTemplateActive(id: string, isActive: boolean) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.messageTemplate.update({
      where: { id, tenantId },
      data: { isActive },
    });

    revalidatePath("/dashboard/templates");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la mise à jour" };
  }
}
