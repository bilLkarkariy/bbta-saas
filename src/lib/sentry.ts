import * as Sentry from "@sentry/nextjs";

/**
 * Capture an error with tenant context
 */
export function captureError(
  error: Error,
  context?: {
    tenantId?: string;
    userId?: string;
    conversationId?: string;
    action?: string;
    extra?: Record<string, unknown>;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tenantId) {
      scope.setTag("tenant_id", context.tenantId);
    }
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    if (context?.conversationId) {
      scope.setTag("conversation_id", context.conversationId);
    }
    if (context?.action) {
      scope.setTag("action", context.action);
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: {
    tenantId?: string;
    userId?: string;
    extra?: Record<string, unknown>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context?.tenantId) {
      scope.setTag("tenant_id", context.tenantId);
    }
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    Sentry.captureMessage(message);
  });
}

/**
 * Create a Sentry transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Set user context for Sentry
 */
export function setUserContext(userId: string, tenantId: string) {
  Sentry.setUser({ id: userId });
  Sentry.setTag("tenant_id", tenantId);
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}

/**
 * Wrap async function with error capturing
 */
export async function withErrorCapture<T>(
  fn: () => Promise<T>,
  context?: {
    action: string;
    tenantId?: string;
    userId?: string;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      action: context?.action,
      tenantId: context?.tenantId,
      userId: context?.userId,
    });
    throw error;
  }
}
