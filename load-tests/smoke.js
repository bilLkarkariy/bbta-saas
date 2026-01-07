import http from "k6/http";
import { check, sleep } from "k6";

// Smoke test - quick validation of basic functionality
export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% under 2s
    http_req_failed: ["rate<0.1"],     // Error rate < 10%
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:3000";

export default function () {
  // Test landing page
  const landingRes = http.get(`${BASE_URL}/`);
  check(landingRes, {
    "landing page status 200": (r) => r.status === 200,
    "landing page loads fast": (r) => r.timings.duration < 2000,
  });

  sleep(0.5);

  // Test health endpoint if exists
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "health check OK": (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.5);

  // Test sign-in page
  const signInRes = http.get(`${BASE_URL}/sign-in`);
  check(signInRes, {
    "sign-in page loads": (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || "";
  const lines = [];

  lines.push(`${indent}Smoke Test Summary`);
  lines.push(`${indent}==================`);
  lines.push(`${indent}Total requests: ${data.metrics.http_reqs.values.count}`);
  lines.push(`${indent}Failed requests: ${data.metrics.http_req_failed.values.passes}`);
  lines.push(`${indent}Avg response time: ${Math.round(data.metrics.http_req_duration.values.avg)}ms`);
  lines.push(`${indent}P95 response time: ${Math.round(data.metrics.http_req_duration.values["p(95)"])}ms`);

  return lines.join("\n");
}
