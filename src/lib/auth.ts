import { auth } from "@clerk/nextjs/server";
import { db } from "./db";

export async function getCurrentTenant() {
  console.log("[Auth] getCurrentTenant started");
  const start = Date.now();

  const { userId } = await auth();
  console.log(`[Auth] auth() took ${Date.now() - start}ms, userId: ${userId}`);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const dbStart = Date.now();
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });
  console.log(`[Auth] db.user.findUnique took ${Date.now() - dbStart}ms`);

  if (!user) {
    throw new Error("User not found");
  }

  console.log(`[Auth] getCurrentTenant completed in ${Date.now() - start}ms`);
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
