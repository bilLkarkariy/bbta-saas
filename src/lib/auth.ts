import { auth } from "@clerk/nextjs/server";
import { db } from "./db";

// Enable debug logging with DEBUG_AUTH=true environment variable
const DEBUG_AUTH = process.env.DEBUG_AUTH === "true";

export async function getCurrentTenant() {
  const start = DEBUG_AUTH ? Date.now() : 0;
  if (DEBUG_AUTH) console.log("[Auth] getCurrentTenant started");

  const { userId } = await auth();
  if (DEBUG_AUTH) console.log(`[Auth] auth() took ${Date.now() - start}ms, userId: ${userId}`);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const dbStart = DEBUG_AUTH ? Date.now() : 0;
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });
  if (DEBUG_AUTH) console.log(`[Auth] db.user.findUnique took ${Date.now() - dbStart}ms`);

  if (!user) {
    throw new Error("User not found");
  }

  if (DEBUG_AUTH) console.log(`[Auth] getCurrentTenant completed in ${Date.now() - start}ms`);
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

// Check if current user is super admin
export async function isSuperAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { superAdmin: true },
  });

  return user?.superAdmin ?? false;
}

// Require super admin access - throws if not super admin
export async function requireSuperAdmin() {
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

  if (!user.superAdmin) {
    throw new Error("Super admin access required");
  }

  return { user, tenant: user.tenant, tenantId: user.tenantId };
}

// Get current user for super admin pages
export async function getCurrentUser() {
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

  return user;
}
