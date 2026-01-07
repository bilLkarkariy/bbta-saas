/**
 * SWR Fetcher & Caching Utilities
 *
 * Provides standardized data fetching with caching for client-side data.
 * Uses SWR (stale-while-revalidate) for optimal performance.
 */

/**
 * Default fetcher for SWR
 * Handles JSON responses and throws on errors
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object
    (error as Error & { info: unknown; status: number }).info = await res
      .json()
      .catch(() => null);
    (error as Error & { info: unknown; status: number }).status = res.status;
    throw error;
  }

  return res.json();
}

/**
 * Fetcher with credentials for authenticated endpoints
 */
export async function authFetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    (error as Error & { info: unknown; status: number }).info = await res
      .json()
      .catch(() => null);
    (error as Error & { info: unknown; status: number }).status = res.status;
    throw error;
  }

  return res.json();
}

/**
 * POST fetcher for mutations
 */
export async function postFetcher<T = unknown>(
  url: string,
  { arg }: { arg: Record<string, unknown> }
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
    credentials: "include",
  });

  if (!res.ok) {
    const error = new Error("An error occurred while posting the data.");
    (error as Error & { info: unknown; status: number }).info = await res
      .json()
      .catch(() => null);
    (error as Error & { info: unknown; status: number }).status = res.status;
    throw error;
  }

  return res.json();
}

/**
 * SWR Configuration presets for different data types
 */
export const swrConfig = {
  // Default config - good balance between freshness and performance
  default: {
    revalidateOnFocus: true,
    dedupingInterval: 2000, // 2 seconds
    focusThrottleInterval: 5000, // 5 seconds
  },

  // Real-time data - frequent updates needed
  realtime: {
    refreshInterval: 5000, // 5 seconds
    revalidateOnFocus: true,
    dedupingInterval: 1000,
  },

  // Static data - rarely changes
  static: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
    refreshInterval: 0, // never auto-refresh
  },

  // Dashboard data - balance freshness with performance
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  },

  // Team data - moderate update frequency
  team: {
    refreshInterval: 60000, // 1 minute
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  },

  // Analytics data - can be slightly stale
  analytics: {
    refreshInterval: 120000, // 2 minutes
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  },
};

/**
 * Cache key generators for consistent cache management
 */
export const cacheKeys = {
  conversations: (tenantId?: string) =>
    tenantId ? `/api/conversations?tenantId=${tenantId}` : "/api/conversations",
  conversation: (id: string) => `/api/conversations/${id}`,
  team: () => "/api/team",
  teamMember: (id: string) => `/api/team/${id}`,
  analytics: (days = 30) => `/api/analytics?days=${days}`,
  faq: (tenantId?: string) =>
    tenantId ? `/api/faq?tenantId=${tenantId}` : "/api/faq",
};

/**
 * Helper to generate cache headers for API routes
 */
export function getCacheHeaders(options: {
  type: "static" | "dynamic" | "revalidate";
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
}): Record<string, string> {
  switch (options.type) {
    case "static":
      return {
        "Cache-Control": `public, max-age=${options.maxAge || 3600}, s-maxage=${options.sMaxAge || 86400}`,
      };
    case "revalidate":
      return {
        "Cache-Control": `public, max-age=${options.maxAge || 60}, s-maxage=${options.sMaxAge || 300}, stale-while-revalidate=${options.staleWhileRevalidate || 600}`,
      };
    case "dynamic":
    default:
      return {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      };
  }
}
