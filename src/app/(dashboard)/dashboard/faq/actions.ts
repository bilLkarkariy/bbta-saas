"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateFAQCache } from "@/lib/cache";

export async function createFAQ(formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const category = (formData.get("category") as string) || "general";

  if (!question || !answer) {
    return { error: "Question et réponse sont requises" };
  }

  await db.fAQ.create({
    data: {
      tenantId,
      question,
      answer,
      category,
    },
  });

  // Invalidate cache and revalidate path
  invalidateFAQCache(tenantId);
  revalidatePath("/dashboard/faq");
  return { success: true };
}

export async function updateFAQ(id: string, formData: FormData) {
  const { tenantId } = await getCurrentTenant();

  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const category = (formData.get("category") as string) || "general";

  if (!question || !answer) {
    return { error: "Question et réponse sont requises" };
  }

  // Verify ownership
  const faq = await db.fAQ.findFirst({
    where: { id, tenantId },
  });

  if (!faq) {
    return { error: "FAQ non trouvée" };
  }

  await db.fAQ.update({
    where: { id },
    data: {
      question,
      answer,
      category,
    },
  });

  // Invalidate cache and revalidate path
  invalidateFAQCache(tenantId);
  revalidatePath("/dashboard/faq");
  return { success: true };
}

export async function deleteFAQ(id: string) {
  const { tenantId } = await getCurrentTenant();

  // Verify ownership
  const faq = await db.fAQ.findFirst({
    where: { id, tenantId },
  });

  if (!faq) {
    return { error: "FAQ non trouvée" };
  }

  await db.fAQ.delete({
    where: { id },
  });

  // Invalidate cache and revalidate path
  invalidateFAQCache(tenantId);
  revalidatePath("/dashboard/faq");
  return { success: true };
}
