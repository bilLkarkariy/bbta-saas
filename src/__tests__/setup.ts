import { vi, beforeEach, afterEach } from "vitest";

// Mock environment variables
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
vi.stubEnv("TWILIO_ACCOUNT_SID", "test-sid");
vi.stubEnv("TWILIO_AUTH_TOKEN", "test-token");
vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-chars-long!");

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});
