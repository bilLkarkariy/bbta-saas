import { auth } from "@clerk/nextjs/server";
import { db } from "./db";

export async function getCurrentTenant() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    user,
    tenant: user.tenant,
    tenantId: user.tenantId,
  };
}

// For API routes - throws if not authenticated
export async function requireTenant() {
  const { tenant, tenantId, user } = await getCurrentTenant();
  return { tenant, tenantId, user };
}

// For optional auth - returns null if not authenticated
export async function getOptionalTenant() {
  try {
    return await getCurrentTenant();
  } catch {
    return null;
  }
}
