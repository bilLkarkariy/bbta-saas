import { vi } from "vitest";
import { createMockUser, createMockTenant } from "./db";

// Default mock auth result
export function createMockAuthResult(overrides = {}) {
  const tenant = createMockTenant();
  const user = createMockUser();
  return {
    user,
    tenant,
    tenantId: tenant.id,
    ...overrides,
  };
}

// Create mock auth functions
export const mockGetCurrentTenant = vi.fn();

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  getCurrentTenant: mockGetCurrentTenant,
  requireTenant: mockGetCurrentTenant,
  getOptionalTenant: vi.fn().mockImplementation(async () => {
    try {
      return await mockGetCurrentTenant();
    } catch {
      return null;
    }
  }),
}));

// Helper to setup authenticated user
export function mockAuthenticated(overrides = {}) {
  const result = createMockAuthResult(overrides);
  mockGetCurrentTenant.mockResolvedValue(result);
  return result;
}

// Helper to setup unauthenticated
export function mockUnauthenticated() {
  mockGetCurrentTenant.mockRejectedValue(new Error("Unauthorized"));
}

// Helper to setup user not found
export function mockUserNotFound() {
  mockGetCurrentTenant.mockRejectedValue(new Error("User not found"));
}

// Reset auth mocks
export function resetAuthMocks() {
  mockGetCurrentTenant.mockReset();
}
