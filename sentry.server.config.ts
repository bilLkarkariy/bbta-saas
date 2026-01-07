import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Debug mode for development
  debug: false,

  // Environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-api-key"];
    }

    // Remove sensitive user data
    if (event.user) {
      // Keep only id for correlation
      event.user = { id: event.user.id };
    }

    return event;
  },

  // Ignore expected errors
  ignoreErrors: [
    // Auth errors (expected)
    "User not found",
    "Unauthorized",
    // Rate limiting (expected)
    "Rate limit exceeded",
    // Validation errors (expected)
    "Invalid request",
  ],
});
