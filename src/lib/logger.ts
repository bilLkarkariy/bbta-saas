/**
 * Structured Logging Infrastructure
 *
 * Uses pino for high-performance JSON logging in production
 * and pino-pretty for human-readable logs in development.
 */

import pino from "pino";

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// Configure pino options
const pinoOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version || "0.1.0",
  },
  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "token",
      "apiKey",
      "authorization",
      "cookie",
      "secret",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
  // Custom timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
};

// In test mode, disable logging
if (isTest) {
  pinoOptions.level = "silent";
}

// Create base logger
export const logger = pino(
  pinoOptions,
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      })
    : undefined
);

/**
 * Create a child logger with context
 *
 * @example
 * const log = createLogger("webhook:twilio");
 * log.info({ messageId }, "Processing inbound message");
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Pre-configured loggers for common contexts
 */
export const loggers = {
  webhook: createLogger("webhook"),
  ai: createLogger("ai"),
  db: createLogger("db"),
  auth: createLogger("auth"),
  api: createLogger("api"),
};

/**
 * Request logging helper
 */
export interface RequestLogData {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  tenantId?: string;
  userId?: string;
}

export function logRequest(data: RequestLogData) {
  const log = createLogger("request");

  // Don't log health checks
  if (data.path === "/api/health") {
    return;
  }

  const level = data.statusCode >= 500 ? "error" : data.statusCode >= 400 ? "warn" : "info";

  log[level](
    {
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      duration: `${data.duration}ms`,
      tenantId: data.tenantId,
      userId: data.userId,
    },
    `${data.method} ${data.path} ${data.statusCode} ${data.duration}ms`
  );
}

/**
 * Performance timing helper
 *
 * @example
 * const done = startTimer("ai.response");
 * await generateResponse();
 * done({ tier: "1" }); // Logs duration automatically
 */
export function startTimer(name: string) {
  const start = Date.now();
  const log = createLogger("perf");

  return (extra?: Record<string, unknown>) => {
    const duration = Date.now() - start;
    log.info(
      {
        metric: name,
        duration,
        ...extra,
      },
      `${name}: ${duration}ms`
    );
    return duration;
  };
}

/**
 * Error logging helper with consistent format
 */
export function logError(
  context: string,
  error: Error | unknown,
  extra?: Record<string, unknown>
) {
  const log = createLogger(context);

  if (error instanceof Error) {
    log.error(
      {
        err: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        ...extra,
      },
      error.message
    );
  } else {
    log.error(
      {
        err: String(error),
        ...extra,
      },
      "Unknown error"
    );
  }
}

// Export types
export type Logger = ReturnType<typeof createLogger>;
