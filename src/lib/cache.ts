/**
 * Server-side In-Memory Cache for Tenant Data
 *
 * Provides simple in-memory caching for frequently accessed tenant data
 * with TTL-based expiration. For production, consider using Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL values in milliseconds
const TTL = {
  FAQ: 5 * 60 * 1000, // 5 minutes
  TENANT_SETTINGS: 5 * 60 * 1000, // 5 minutes
  TENANT_INFO: 10 * 60 * 1000, // 10 minutes
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 2 * 60 * 1000, // 2 minutes
  LONG: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Get a cached value
 */
export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set a cached value
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number = TTL.MEDIUM): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Delete a cached value
 */
export function cacheDelete(key: string): boolean {
  return cache.delete(key);
}

/**
 * Delete all cached values matching a pattern (prefix)
 */
export function cacheDeletePattern(prefix: string): number {
  let deleted = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      deleted++;
    }
  }
  return deleted;
}

/**
 * Clear all cache entries for a tenant
 */
export function cacheClearTenant(tenantId: string): number {
  return cacheDeletePattern(`tenant:${tenantId}:`);
}

/**
 * Clear entire cache
 */
export function cacheClearAll(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function cacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// Cache key builders
export const cacheKeys = {
  faq: (tenantId: string) => `tenant:${tenantId}:faq`,
  faqById: (tenantId: string, faqId: string) => `tenant:${tenantId}:faq:${faqId}`,
  tenantSettings: (tenantId: string) => `tenant:${tenantId}:settings`,
  tenantInfo: (tenantId: string) => `tenant:${tenantId}:info`,
  tenantByPhone: (phone: string) => `phone:${phone}:tenant`,
};

/**
 * Cached FAQ lookup for a tenant
 */
export async function getCachedFAQs<T>(
  tenantId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = cacheKeys.faq(tenantId);
  const cached = cacheGet<T>(key);

  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  cacheSet(key, data, TTL.FAQ);
  return data;
}

/**
 * Cached tenant settings lookup
 */
export async function getCachedTenantSettings<T>(
  tenantId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = cacheKeys.tenantSettings(tenantId);
  const cached = cacheGet<T>(key);

  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  cacheSet(key, data, TTL.TENANT_SETTINGS);
  return data;
}

/**
 * Invalidate FAQ cache when FAQs are updated
 */
export function invalidateFAQCache(tenantId: string): void {
  cacheDeletePattern(`tenant:${tenantId}:faq`);
}

/**
 * Invalidate tenant settings cache when settings are updated
 */
export function invalidateTenantSettingsCache(tenantId: string): void {
  cacheDelete(cacheKeys.tenantSettings(tenantId));
}

/**
 * Cached function wrapper
 * Wraps any async function with caching
 */
export function withCache<T, Args extends unknown[]>(
  keyFn: (...args: Args) => string,
  ttlMs: number = TTL.MEDIUM
) {
  return function (fetchFn: (...args: Args) => Promise<T>) {
    return async function (...args: Args): Promise<T> {
      const key = keyFn(...args);
      const cached = cacheGet<T>(key);

      if (cached !== null) {
        return cached;
      }

      const data = await fetchFn(...args);
      cacheSet(key, data, ttlMs);
      return data;
    };
  };
}

export { TTL };
