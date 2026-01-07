/**
 * Database Utilities
 *
 * Helper functions for database operations including:
 * - Query timing and logging
 * - Slow query detection
 * - Common query patterns
 */

// Threshold in ms for slow query warning
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || "100", 10);
const LOG_QUERIES = process.env.LOG_DB_QUERIES === "true";

/**
 * Wrap a database query with timing and logging
 */
export async function timedQuery<T>(
  name: string,
  queryFn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - start;

    if (LOG_QUERIES || duration > SLOW_QUERY_THRESHOLD) {
      const tagStr = tags ? ` [${Object.entries(tags).map(([k, v]) => `${k}=${v}`).join(", ")}]` : "";
      const level = duration > SLOW_QUERY_THRESHOLD ? "warn" : "debug";

      if (level === "warn") {
        console.warn(`[DB SLOW] ${name}${tagStr} took ${duration}ms`);
      } else if (LOG_QUERIES) {
        console.log(`[DB] ${name}${tagStr} took ${duration}ms`);
      }
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[DB ERROR] ${name} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Generate a date range for queries
 */
export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Standard pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Standard pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Apply pagination to a count and data query
 */
export function getPaginationParams(options: PaginationOptions = {}): {
  skip: number;
  take: number;
} {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Build paginated result from data and count
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));

  return {
    data,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

/**
 * Common select patterns for optimized queries
 */
export const selectPatterns = {
  // Minimal user info for lists
  userMinimal: {
    id: true,
    name: true,
    email: true,
  },

  // User with role
  userWithRole: {
    id: true,
    name: true,
    email: true,
    role: true,
  },

  // Conversation list item
  conversationListItem: {
    id: true,
    customerPhone: true,
    customerName: true,
    status: true,
    lastMessageAt: true,
    priority: true,
    tags: true,
    assignedToId: true,
    createdAt: true,
    updatedAt: true,
  },

  // Contact list item
  contactListItem: {
    id: true,
    phone: true,
    name: true,
    email: true,
    source: true,
    lastContactAt: true,
    isOptedOut: true,
    createdAt: true,
  },
};
