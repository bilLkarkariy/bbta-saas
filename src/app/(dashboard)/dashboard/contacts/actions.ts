"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentTenant } from "@/lib/auth";
import { z } from "zod";

const contactSchema = z.object({
  phone: z.string().min(1, "Numéro requis"),
  name: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function getContacts(params?: {
  search?: string;
  tagId?: string;
  page?: number;
  limit?: number;
}) {
  const { tenantId } = await getCurrentTenant();
  const { search, tagId, page = 1, limit = 50 } = params || {};

  const where = {
    tenantId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(tagId && {
      tags: { some: { id: tagId } },
    }),
  };

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: { tags: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.contact.count({ where }),
  ]);

  return { contacts, total, pages: Math.ceil(total / limit) };
}

export async function createContact(formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const tagIds = formData.getAll("tags") as string[];
  const validated = contactSchema.safeParse({
    phone: formData.get("phone"),
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    company: formData.get("company") || undefined,
    tags: tagIds,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    // Validate that all tags belong to the current tenant before connecting
    if (tagIds.length > 0) {
      const validTags = await db.tag.findMany({
        where: { id: { in: tagIds }, tenantId },
        select: { id: true },
      });
      const validTagIds = validTags.map((t) => t.id);
      // Filter out any tags that don't belong to this tenant
      tagIds.length = 0;
      tagIds.push(...validTagIds);
    }

    await db.contact.create({
      data: {
        tenantId,
        phone: validated.data.phone,
        name: validated.data.name,
        email: validated.data.email || null,
        company: validated.data.company,
        source: "manual",
        ...(tagIds.length > 0 && {
          tags: { connect: tagIds.map((id) => ({ id })) },
        }),
      },
    });

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "Ce numéro existe déjà" };
    }
    return { error: "Erreur lors de la création" };
  }
}

export async function updateContact(id: string, formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const tagIds = formData.getAll("tags") as string[];
  const validated = contactSchema.safeParse({
    phone: formData.get("phone"),
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    company: formData.get("company") || undefined,
    tags: tagIds,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    // Validate that all tags belong to the current tenant before setting
    let validTagIds: string[] = [];
    if (tagIds.length > 0) {
      const validTags = await db.tag.findMany({
        where: { id: { in: tagIds }, tenantId },
        select: { id: true },
      });
      validTagIds = validTags.map((t) => t.id);
    }

    await db.contact.update({
      where: { id, tenantId },
      data: {
        phone: validated.data.phone,
        name: validated.data.name,
        email: validated.data.email || null,
        company: validated.data.company,
        tags: { set: validTagIds.map((id) => ({ id })) },
      },
    });

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteContact(id: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.contact.delete({
      where: { id, tenantId },
    });

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression" };
  }
}

export async function deleteContacts(ids: string[]) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.contact.deleteMany({
      where: { id: { in: ids }, tenantId },
    });

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression" };
  }
}

// Tags
export async function getTags() {
  const { tenantId } = await getCurrentTenant();
  return db.tag.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export async function createTag(formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const name = formData.get("name") as string;
  const color = formData.get("color") as string || "#3B82F6";

  if (!name) {
    return { error: "Nom requis" };
  }

  try {
    const tag = await db.tag.create({
      data: { tenantId, name, color },
    });

    revalidatePath("/dashboard/contacts");
    return { success: true, tag };
  } catch {
    return { error: "Ce tag existe déjà" };
  }
}

export async function deleteTag(id: string) {
  const { tenantId } = await getCurrentTenant();

  try {
    await db.tag.delete({
      where: { id, tenantId },
    });

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression" };
  }
}

// Import CSV
export async function importContacts(contacts: Array<{ phone: string; name?: string; email?: string; company?: string }>) {
  const { tenantId } = await getCurrentTenant();

  try {
    const results = await Promise.allSettled(
      contacts.map((contact) =>
        db.contact.upsert({
          where: { tenantId_phone: { tenantId, phone: contact.phone } },
          create: { tenantId, ...contact, source: "import" },
          update: { name: contact.name, email: contact.email, company: contact.company },
        })
      )
    );

    const created = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    revalidatePath("/dashboard/contacts");
    return { success: true, created, failed };
  } catch {
    return { error: "Erreur lors de l'import" };
  }
}
