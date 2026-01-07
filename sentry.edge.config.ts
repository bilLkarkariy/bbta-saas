import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring - lower for edge
  tracesSampleRate: 0.05, // 5% of transactions

  // Debug mode for development
  debug: false,

  // Environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
