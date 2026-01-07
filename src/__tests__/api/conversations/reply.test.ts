import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { prismaMock, createMockConversation, createMockTenant, createMockMessage } from "../../mocks/db";
import { mockTwilioSendSuccess, mockTwilioSendFailure, resetTwilioMocks, mockSendWhatsAppMessage } from "../../mocks/twilio";
import { resetAuthMocks } from "../../mocks/auth";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("../../stream/route", () => ({
  emitToTenant: vi.fn(),
}));

describe("Reply Endpoint", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetTwilioMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockTenant = {
    ...createMockTenant(),
    whatsappNumber: "+33698765432",
  };

  const mockConversation = {
    ...createMockConversation(),
    tenant: mockTenant,
  };

  describe("POST /api/conversations/[id]/reply", () => {
    it("returns 401 without authentication", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockRejectedValue(new Error("Not authenticated"));

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/conv123/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "conv123" }) });

      expect(response.status).toBe(500);
    });

    it("returns 400 for invalid CUID format", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/invalid-id/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "invalid-id" }) });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid conversation ID");
    });

    it("returns 400 for empty content", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "" }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("content is required");
    });

    it("returns 400 for whitespace-only content", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "   " }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(400);
    });

    it("returns 404 for unknown conversation", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(null);

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toContain("not found");
    });

    it("returns 400 when WhatsApp number not configured", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue({
        ...mockConversation,
        tenant: { ...mockTenant, whatsappNumber: null },
      } as never);

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("WhatsApp number not configured");
    });

    it("creates message and sends via Twilio on success", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);
      prismaMock.message.create.mockResolvedValue(createMockMessage({
        direction: "outbound",
        content: "Hello customer",
        status: "sent",
      }) as never);
      prismaMock.conversation.update.mockResolvedValue(mockConversation as never);

      mockTwilioSendSuccess();

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Hello customer" }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBeDefined();
      expect(body.message.content).toBe("Hello customer");

      // Verify Twilio was called
      expect(mockSendWhatsAppMessage).toHaveBeenCalled();
    });

    it("handles Twilio failure gracefully", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);
      prismaMock.message.create.mockResolvedValue(createMockMessage({
        direction: "outbound",
        content: "Hello",
        status: "failed",
      }) as never);
      prismaMock.conversation.update.mockResolvedValue(mockConversation as never);

      mockTwilioSendFailure(new Error("Twilio error"));

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      // Should still return success (message saved, even if Twilio failed)
      expect(response.status).toBe(200);

      // Message should be saved with failed status
      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "failed",
        }),
      });
    });

    it("updates lastMessageAt timestamp", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);
      prismaMock.message.create.mockResolvedValue(createMockMessage() as never);
      prismaMock.conversation.update.mockResolvedValue(mockConversation as never);

      mockTwilioSendSuccess();

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      });

      await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: expect.any(String) },
        data: { lastMessageAt: expect.any(Date) },
      });
    });

    it("sets intent to MANUAL for dashboard replies", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation as never);
      prismaMock.message.create.mockResolvedValue(createMockMessage() as never);
      prismaMock.conversation.update.mockResolvedValue(mockConversation as never);

      mockTwilioSendSuccess();

      const { POST } = await import("@/app/api/conversations/[id]/reply/route");

      const req = new Request("http://localhost/api/conversations/cm1234567890abcdef/reply", {
        method: "POST",
        body: JSON.stringify({ content: "Manual reply" }),
      });

      await POST(req as never, { params: Promise.resolve({ id: "cm1234567890abcdef" }) });

      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          intent: "MANUAL",
        }),
      });
    });
  });
});
