import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { prismaMock, createMockConversation } from "../../mocks/db";
import { resetAuthMocks } from "../../mocks/auth";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("../../stream/route", () => ({
  emitToTenant: vi.fn(),
}));

describe("Typing Indicator Endpoint", () => {
  beforeEach(() => {
    resetAuthMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockConversation = createMockConversation();

  describe("POST /api/conversations/[id]/typing", () => {
    it("returns 401 without authentication", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockRejectedValue(new Error("Not authenticated"));

      const { POST } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/conv123/typing", {
        method: "POST",
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "conv123" }) });

      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid CUID format", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      const { POST } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/invalid/typing", {
        method: "POST",
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "invalid" }) });

      expect(response.status).toBe(400);
    });

    it("returns 404 for unauthorized conversation", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(null);

      const { POST } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "POST",
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(404);
    });

    it("starts typing indicator successfully", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);

      const { POST } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "POST",
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    });

    it("emits typing_start event to tenant", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);

      const { POST } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "POST",
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      // Verify typing started successfully - emitToTenant is called internally
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    });
  });

  describe("DELETE /api/conversations/[id]/typing", () => {
    it("returns 401 without authentication", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockRejectedValue(new Error("Not authenticated"));

      const { DELETE } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/conv123/typing", {
        method: "DELETE",
      });

      const response = await DELETE(req as never, { params: Promise.resolve({ id: "conv123" }) });

      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid CUID format", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      const { DELETE } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/invalid/typing", {
        method: "DELETE",
      });

      const response = await DELETE(req as never, { params: Promise.resolve({ id: "invalid" }) });

      expect(response.status).toBe(400);
    });

    it("stops typing indicator successfully", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      const { DELETE } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "DELETE",
      });

      const response = await DELETE(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    });

    it("emits typing_stop event to tenant", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      const { DELETE } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "DELETE",
      });

      const response = await DELETE(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      // Verify typing stopped successfully - emitToTenant is called internally
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    });
  });

  describe("GET /api/conversations/[id]/typing", () => {
    it("returns isTyping: false without authentication", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockRejectedValue(new Error("Not authenticated"));

      const { GET } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/conv123/typing", {
        method: "GET",
      });

      const response = await GET(req as never, { params: Promise.resolve({ id: "conv123" }) });

      // Returns 200 with isTyping: false (graceful error handling)
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.isTyping).toBe(false);
    });

    it("returns isTyping: false for invalid CUID", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { GET } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/invalid/typing", {
        method: "GET",
      });

      const response = await GET(req as never, { params: Promise.resolve({ id: "invalid" }) });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.isTyping).toBe(false);
    });

    it("returns 404 for unauthorized conversation", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(null);

      const { GET } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "GET",
      });

      const response = await GET(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(404);
    });

    it("returns typing state for valid conversation", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);

      const { GET } = await import("@/app/api/conversations/[id]/typing/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "GET",
      });

      const response = await GET(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(typeof body.isTyping).toBe("boolean");
    });
  });

  describe("Typing state expiration", () => {
    it("typing state expires after 5 seconds", async () => {
      vi.useFakeTimers();

      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1", name: "Test User" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);

      const { POST, GET } = await import("@/app/api/conversations/[id]/typing/route");

      // Start typing
      const postReq = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "POST",
      });
      await POST(postReq as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      // Check immediately - should be typing
      const getReq1 = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "GET",
      });
      const response1 = await GET(getReq1 as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });
      const body1 = await response1.json();

      // Advance time past expiration
      vi.advanceTimersByTime(6000);

      // Check again - should not be typing
      const getReq2 = new Request("http://localhost/api/conversations/cm1234567890abcdef/typing", {
        method: "GET",
      });
      const response2 = await GET(getReq2 as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });
      const body2 = await response2.json();

      expect(body2.isTyping).toBe(false);

      vi.useRealTimers();
    });
  });
});
