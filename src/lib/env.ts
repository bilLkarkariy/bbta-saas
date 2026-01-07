/**
 * Environment Variable Validation
 *
 * Validates required environment variables and provides typed access.
 */

import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "Clerk publishable key required"),
  CLERK_SECRET_KEY: z.string().min(1, "Clerk secret key required"),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // OpenRouter AI
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  AI_TIER_1_MODEL: z.string().default("x-ai/grok-3-fast"),
  AI_TIER_2_MODEL: z.string().default("anthropic/claude-sonnet-4"),
  AI_TIER_3_MODEL: z.string().default("anthropic/claude-opus-4"),

  // Twilio (optional in dev)
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC").optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Build-time flag
  SKIP_ENV_VALIDATION: z.string().optional(),
});

// Type for validated environment
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Env {
  // Skip validation during CI/CD build if explicitly requested
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, msgs]) => `  ${field}: ${(msgs || []).join(", ")}`)
      .join("\n");

    console.error("Invalid environment variables:\n" + errorMessages);

    if (process.env.NODE_ENV === "development") {
      console.error("\nTip: Copy .env.example to .env.local and fill in the values");
    }

    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Export validated env (lazy evaluation for build time)
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

// For convenience in server code
export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});

// Type-safe config accessors
export const config = {
  get isDev() {
    return getEnv().NODE_ENV === "development";
  },
  get isProd() {
    return getEnv().NODE_ENV === "production";
  },
  get isTest() {
    return getEnv().NODE_ENV === "test";
  },

  app: {
    get url() {
      return getEnv().NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    },
  },

  ai: {
    get tier1Model() {
      return getEnv().AI_TIER_1_MODEL;
    },
    get tier2Model() {
      return getEnv().AI_TIER_2_MODEL;
    },
    get tier3Model() {
      return getEnv().AI_TIER_3_MODEL;
    },
  },

  features: {
    get hasTwilio() {
      const e = getEnv();
      return !!(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN);
    },
    get hasAI() {
      return !!getEnv().OPENROUTER_API_KEY;
    },
    get hasRedis() {
      return !!getEnv().REDIS_URL;
    },
    get hasSentry() {
      return !!getEnv().SENTRY_DSN;
    },
    get hasEncryption() {
      return !!getEnv().ENCRYPTION_KEY;
    },
  },
};
