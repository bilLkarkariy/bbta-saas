import { db } from "@/lib/db";

// TODO: Replace with Redis for production multi-instance deployments
// In-memory cache will not work correctly in serverless environments (Vercel)
// See: https://upstash.com/docs/redis/quickstarts/nextjs

type TenantWithFAQs = Awaited<ReturnType<typeof fetchTenant>>;
const tenantCache = new Map<string, { tenant: TenantWithFAQs | null; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for found tenants
const NEGATIVE_CACHE_TTL = 60 * 1000; // 1 minute for missing tenants (prevents DB spam)

async function fetchTenant(normalized: string) {
  return db.tenant.findFirst({
    where: {
      OR: [
        { whatsappNumber: normalized },
        { whatsappNumber: `+${normalized}` },
        { whatsappNumber: normalized.replace('+', '') },
      ],
    },
    include: {
      faqs: {
        where: { isActive: true },
      },
    },
  });
}

export async function resolveTenantByPhone(businessPhone: string) {
  // Normalize the phone number
  const normalized = businessPhone
    .replace(/\s+/g, '')
    .replace('whatsapp:', '');

  // Check cache (including negative cache for null results)
  const cached = tenantCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  // Query database
  const tenant = await fetchTenant(normalized);

  // Cache result (including null to prevent repeated lookups for invalid numbers)
  tenantCache.set(normalized, {
    tenant,
    expiresAt: Date.now() + (tenant ? CACHE_TTL : NEGATIVE_CACHE_TTL),
  });

  return tenant;
}

export function invalidateTenantCache(tenantId: string) {
  for (const [key, value] of tenantCache.entries()) {
    if (value.tenant?.id === tenantId) {
      tenantCache.delete(key);
    }
  }
}

export function clearTenantCache() {
  tenantCache.clear();
}
