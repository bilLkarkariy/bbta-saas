import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from "web-vitals";

const vitalsUrl = "https://vitals.vercel-insights.com/v1/vitals";

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType: string;
  };
};

function getConnectionSpeed() {
  if (typeof navigator === "undefined") return "";
  const nav = navigator as NavigatorWithConnection;
  return nav?.connection?.effectiveType || "";
}

interface VitalsOptions {
  analyticsId: string;
  debug?: boolean;
}

interface VitalsBody {
  dsn: string;
  id: string;
  page: string;
  href: string;
  event_name: string;
  value: string;
  speed: string;
}

function sendToAnalytics(metric: Metric, options: VitalsOptions) {
  const body: VitalsBody = {
    dsn: options.analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  };

  if (options.debug) {
    console.log("[Web Vitals]", metric.name, metric.value);
  }

  // Send via Beacon API if available, otherwise fetch
  const blob = new Blob([new URLSearchParams(body as unknown as Record<string, string>).toString()], {
    type: "application/x-www-form-urlencoded",
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, blob);
  } else {
    fetch(vitalsUrl, {
      body: blob,
      method: "POST",
      credentials: "omit",
      keepalive: true,
    });
  }
}

export function reportWebVitals(options: VitalsOptions) {
  try {
    onCLS((metric) => sendToAnalytics(metric, options));
    onFCP((metric) => sendToAnalytics(metric, options));
    onINP((metric) => sendToAnalytics(metric, options));
    onLCP((metric) => sendToAnalytics(metric, options));
    onTTFB((metric) => sendToAnalytics(metric, options));
  } catch (error) {
    console.error("Web Vitals error:", error);
  }
}

// Thresholds for Core Web Vitals (as of 2024)
export const WEB_VITALS_THRESHOLDS = {
  LCP: {
    good: 2500, // ms
    needsImprovement: 4000, // ms
  },
  INP: {
    good: 200, // ms
    needsImprovement: 500, // ms
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800, // ms
    needsImprovement: 3000, // ms
  },
  TTFB: {
    good: 800, // ms
    needsImprovement: 1800, // ms
  },
} as const;

export function getVitalRating(name: keyof typeof WEB_VITALS_THRESHOLDS, value: number): "good" | "needs-improvement" | "poor" {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.needsImprovement) return "needs-improvement";
  return "poor";
}
