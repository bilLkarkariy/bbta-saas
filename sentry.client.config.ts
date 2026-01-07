import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session replay for debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions

  // Debug mode for development
  debug: false,

  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }

    // Filter out development errors
    if (
      event.exception?.values?.some(
        (e) =>
          e.value?.includes("HMR") ||
          e.value?.includes("Fast Refresh") ||
          e.value?.includes("webpack")
      )
    ) {
      return null;
    }

    return event;
  },

  // Ignore common browser errors
  ignoreErrors: [
    // Browser extensions
    "chrome-extension://",
    "moz-extension://",
    // Network errors
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // User-triggered navigation
    "Navigation cancelled",
    "cancelled",
    // Common browser issues
    "ResizeObserver loop",
    "Non-Error promise rejection",
  ],
});
