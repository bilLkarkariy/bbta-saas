/**
 * Metrics Collection
 *
 * Simple metrics collector for tracking performance and usage.
 * In production, this can be extended to send to DataDog, CloudWatch, etc.
 */

import { createLogger } from "./logger";

const log = createLogger("metrics");

export interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

class MetricsCollector {
  private buffer: Metric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxBufferSize = 100;
  private flushIntervalMs = 60000; // 1 minute

  constructor() {
    // Start flush interval in production
    if (process.env.NODE_ENV === "production" && typeof setInterval !== "undefined") {
      this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
    }
  }

  /**
   * Record a metric
   */
  record(name: string, value: number, tags: Record<string, string> = {}) {
    this.buffer.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    });

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, tags: Record<string, string> = {}) {
    this.record(name, 1, { ...tags, type: "counter" });
  }

  /**
   * Record a timing metric
   */
  timing(name: string, durationMs: number, tags: Record<string, string> = {}) {
    this.record(name, durationMs, { ...tags, unit: "ms", type: "timing" });
  }

  /**
   * Create a timer that records duration when stopped
   */
  startTimer(name: string, tags: Record<string, string> = {}) {
    const start = Date.now();

    return (extraTags?: Record<string, string>) => {
      const duration = Date.now() - start;
      this.timing(name, duration, { ...tags, ...extraTags });
      return duration;
    };
  }

  /**
   * Flush buffered metrics
   */
  async flush() {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    // Log metrics (in production, send to metrics backend)
    if (process.env.NODE_ENV === "development") {
      log.debug({ count: metrics.length }, "Flushing metrics");
    } else {
      // Group by name for summary logging
      const grouped = metrics.reduce(
        (acc, m) => {
          if (!acc[m.name]) acc[m.name] = [];
          acc[m.name].push(m);
          return acc;
        },
        {} as Record<string, Metric[]>
      );

      for (const [name, items] of Object.entries(grouped)) {
        const values = items.map((i) => i.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        log.info(
          {
            metric: name,
            count: items.length,
            avg: Math.round(avg * 100) / 100,
            min,
            max,
          },
          `Metric: ${name}`
        );
      }
    }

    // TODO: Send to external metrics service
    // await sendToDatadog(metrics);
    // await sendToCloudWatch(metrics);
  }

  /**
   * Stop the collector and flush remaining metrics
   */
  async stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Convenience functions
export const recordMetric = (name: string, value: number, tags?: Record<string, string>) =>
  metrics.record(name, value, tags);

export const incrementMetric = (name: string, tags?: Record<string, string>) =>
  metrics.increment(name, tags);

export const startMetricTimer = (name: string, tags?: Record<string, string>) =>
  metrics.startTimer(name, tags);

// Pre-defined metric names for consistency
export const MetricNames = {
  // AI metrics
  AI_REQUEST: "ai.request",
  AI_RESPONSE_TIME: "ai.response.time",
  AI_TOKENS_INPUT: "ai.tokens.input",
  AI_TOKENS_OUTPUT: "ai.tokens.output",
  AI_ERROR: "ai.error",

  // Webhook metrics
  WEBHOOK_RECEIVED: "webhook.received",
  WEBHOOK_PROCESSING_TIME: "webhook.processing.time",
  WEBHOOK_ERROR: "webhook.error",

  // Message metrics
  MESSAGE_INBOUND: "message.inbound",
  MESSAGE_OUTBOUND: "message.outbound",
  MESSAGE_SEND_ERROR: "message.send.error",

  // Database metrics
  DB_QUERY_TIME: "db.query.time",
  DB_ERROR: "db.error",

  // API metrics
  API_REQUEST: "api.request",
  API_RESPONSE_TIME: "api.response.time",
  API_ERROR: "api.error",
} as const;
