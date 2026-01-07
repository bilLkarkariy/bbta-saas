import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { prismaMock, createMockFAQ } from "../../mocks/db";
import { mockAIClientResponse, resetAIMocks } from "../../mocks/ai";
import { resetAuthMocks } from "../../mocks/auth";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getCurrentTenant: vi.fn(),
}));

describe("FAQ Import Endpoint", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetAIMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/faq/import", () => {
    it("returns 400 without authentication", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockRejectedValue(new Error("Not authenticated"));

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({ faqs: [] }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(400);
    });

    it("validates import schema - requires faqs array", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(400);
    });

    it("validates import schema - requires at least one FAQ", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({ faqs: [] }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Au moins une FAQ");
    });

    it("validates FAQ item - question minimum length", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [{ question: "Hi", answer: "This is a valid answer length" }],
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("5 caractères");
    });

    it("validates FAQ item - answer minimum length", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [{ question: "What are your hours?", answer: "9-5" }],
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("10 caractères");
    });

    it("detects and skips duplicate FAQs", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      // Mock existing FAQ
      prismaMock.fAQ.findMany.mockResolvedValue([
        createMockFAQ({ question: "Quels sont vos horaires ?" }),
      ] as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [
            {
              question: "Quels sont vos horaires ?", // Duplicate (case insensitive)
              answer: "Nous sommes ouverts de 9h à 18h.",
            },
          ],
          extractKeywords: false,
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.skipped).toBe(1);
      expect(body.details[0].status).toBe("skipped");
      expect(body.details[0].error).toContain("similaire existante");
    });

    it("imports valid FAQs successfully", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.fAQ.findMany.mockResolvedValue([]);
      prismaMock.fAQ.create.mockResolvedValue(createMockFAQ() as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [
            {
              question: "Quels sont vos horaires ?",
              answer: "Nous sommes ouverts de 9h à 18h.",
              category: "Informations",
            },
          ],
          extractKeywords: false,
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.imported).toBe(1);
      expect(body.failed).toBe(0);
      expect(body.skipped).toBe(0);
    });

    it("extracts keywords when enabled", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.fAQ.findMany.mockResolvedValue([]);
      prismaMock.fAQ.create.mockResolvedValue(createMockFAQ() as never);

      // Mock AI keyword extraction
      mockAIClientResponse(JSON.stringify({ keywords: ["horaires", "ouverture"] }));

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [
            {
              question: "Quels sont vos horaires ?",
              answer: "Nous sommes ouverts de 9h à 18h.",
            },
          ],
          extractKeywords: true,
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.imported).toBe(1);
    });

    it("uses provided keywords without extraction", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.fAQ.findMany.mockResolvedValue([]);
      prismaMock.fAQ.create.mockResolvedValue(createMockFAQ() as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [
            {
              question: "Quels sont vos horaires ?",
              answer: "Nous sommes ouverts de 9h à 18h.",
              keywords: ["custom", "keywords"],
            },
          ],
          extractKeywords: true, // Even with true, should use provided keywords
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(200);

      // Verify keywords were passed to create
      expect(prismaMock.fAQ.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          keywords: ["custom", "keywords"],
        }),
      });
    });

    it("handles multiple FAQs with mixed results", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.fAQ.findMany.mockResolvedValue([
        createMockFAQ({ question: "Existing FAQ?" }),
      ] as never);

      let createCallCount = 0;
      prismaMock.fAQ.create.mockImplementation(() => {
        createCallCount++;
        if (createCallCount === 2) {
          throw new Error("DB constraint violation");
        }
        return Promise.resolve(createMockFAQ() as never);
      });

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [
            { question: "New FAQ 1?", answer: "Answer for FAQ 1" },
            { question: "Existing FAQ?", answer: "Duplicate answer" }, // Skipped
            { question: "New FAQ 2?", answer: "Answer for FAQ 2" }, // Will fail
            { question: "New FAQ 3?", answer: "Answer for FAQ 3" }, // Success
          ],
          extractKeywords: false,
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.imported).toBe(2); // FAQ 1 and FAQ 3
      expect(body.skipped).toBe(1); // Duplicate
      expect(body.failed).toBe(1); // FAQ 2
      expect(body.details).toHaveLength(4);
    });

    it("returns import summary with details", async () => {
      const { getCurrentTenant } = await import("@/lib/auth");
      vi.mocked(getCurrentTenant).mockResolvedValue({
        tenantId: "tenant-123",
        user: { id: "user-1" },
      } as never);

      prismaMock.fAQ.findMany.mockResolvedValue([]);
      prismaMock.fAQ.create.mockResolvedValue(createMockFAQ() as never);

      const { POST } = await import("@/app/api/faq/import/route");

      const req = new Request("http://localhost/api/faq/import", {
        method: "POST",
        body: JSON.stringify({
          faqs: [
            {
              question: "Test question one?",
              answer: "Test answer for question one.",
            },
          ],
          extractKeywords: false,
        }),
      });

      const response = await POST(req as never);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body).toHaveProperty("imported");
      expect(body).toHaveProperty("failed");
      expect(body).toHaveProperty("skipped");
      expect(body).toHaveProperty("errors");
      expect(body).toHaveProperty("details");
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details[0]).toHaveProperty("question");
      expect(body.details[0]).toHaveProperty("status");
    });
  });

  describe("GET /api/faq/import", () => {
    it("returns import template", async () => {
      const { GET } = await import("@/app/api/faq/import/route");

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body).toHaveProperty("description");
      expect(body).toHaveProperty("format");
      expect(body).toHaveProperty("notes");
      expect(body.format.faqs).toBeDefined();
      expect(Array.isArray(body.format.faqs)).toBe(true);
    });

    it("template includes example FAQs", async () => {
      const { GET } = await import("@/app/api/faq/import/route");

      const response = await GET();
      const body = await response.json();

      const exampleFAQ = body.format.faqs[0];
      expect(exampleFAQ).toHaveProperty("question");
      expect(exampleFAQ).toHaveProperty("answer");
    });

    it("template includes helpful notes", async () => {
      const { GET } = await import("@/app/api/faq/import/route");

      const response = await GET();
      const body = await response.json();

      expect(Array.isArray(body.notes)).toBe(true);
      expect(body.notes.length).toBeGreaterThan(0);
    });
  });
});
