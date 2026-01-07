import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, createMockConversation, createMockTenant } from "../../../mocks/db";

describe("Flow Executor", () => {
  beforeEach(() => {
    // Reset mocks
  });

  const mockConversationWithTenant = {
    ...createMockConversation(),
    tenant: createMockTenant(),
  };

  describe("executeFlow()", () => {
    it("returns null when no flow and no suggestion", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: null,
        flowData: null,
      });

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "Hello", null);

      expect(result).toBeNull();
    });

    it("starts new booking flow when suggested", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: null,
        flowData: null,
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversationWithTenant);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "Je voudrais réserver", "booking");

      expect(result).not.toBeNull();
      expect(result?.response).toBeTruthy();
      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentFlow: "booking",
          }),
        })
      );
    });

    it("starts new lead_capture flow when suggested", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: null,
        flowData: null,
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversationWithTenant);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "Je voudrais un devis", "lead_capture");

      expect(result).not.toBeNull();
      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentFlow: "lead_capture",
          }),
        })
      );
    });

    it("continues existing flow", async () => {
      const flowState = {
        type: "booking",
        step: "ask_date",
        data: { service: "Consultation" },
        startedAt: new Date().toISOString(),
        attempts: 0,
      };

      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: "booking",
        flowData: flowState,
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversationWithTenant);
      prismaMock.booking.findFirst.mockResolvedValue(null);
      prismaMock.booking.findMany.mockResolvedValue([]);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "demain", null);

      expect(result).not.toBeNull();
      // Should progress to next step
      expect(prismaMock.conversation.update).toHaveBeenCalled();
    });

    it("handles cancellation keywords", async () => {
      const flowState = {
        type: "booking",
        step: "ask_date",
        data: { service: "Consultation" },
        startedAt: new Date().toISOString(),
        attempts: 0,
      };

      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: "booking",
        flowData: flowState,
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversationWithTenant);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "annule", null);

      expect(result).not.toBeNull();
      expect(result?.flowCancelled).toBe(true);
    });

    it("increments attempts on invalid response", async () => {
      const flowState = {
        type: "booking",
        step: "ask_date",
        data: { service: "Consultation" },
        startedAt: new Date().toISOString(),
        attempts: 0,
      };

      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: "booking",
        flowData: flowState,
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversationWithTenant);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "blabla invalid", null);

      expect(result).not.toBeNull();
      expect(result?.shouldRetry).toBe(true);
      expect(result?.newState?.attempts).toBe(1);
    });

    it("escalates after max attempts", async () => {
      const flowState = {
        type: "booking",
        step: "ask_date",
        data: { service: "Consultation" },
        startedAt: new Date().toISOString(),
        attempts: 2, // At max
      };

      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: "booking",
        flowData: flowState,
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversationWithTenant);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "blabla invalid again", null);

      expect(result).not.toBeNull();
      expect(result?.flowCancelled).toBe(true);
      expect(result?.response).toContain("conseiller");
    });

    it("returns null for non-existent conversation", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("non_existent", "Hello", null);

      expect(result).toBeNull();
    });
  });

  describe("parseFlowState()", () => {
    it("validates flow state schema", async () => {
      const validState = {
        type: "booking",
        step: "ask_date",
        data: {},
        startedAt: new Date().toISOString(),
        attempts: 0,
      };

      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: "booking",
        flowData: validState,
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversationWithTenant);
      prismaMock.booking.findFirst.mockResolvedValue(null);
      prismaMock.booking.findMany.mockResolvedValue([]);

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "demain", null);

      // If parsed correctly, should continue flow
      expect(result).not.toBeNull();
    });

    it("returns null for invalid flow state", async () => {
      const invalidState = {
        type: "invalid_type",
        // Missing required fields
      };

      prismaMock.conversation.findUnique.mockResolvedValue({
        ...mockConversationWithTenant,
        currentFlow: "booking",
        flowData: invalidState,
      });

      const { executeFlow } = await import("@/lib/ai/flows/executor");

      const result = await executeFlow("conv_test123", "Hello", null);

      // Should treat as no active flow since state is invalid
      expect(result).toBeNull();
    });
  });

  describe("hasActiveFlow()", () => {
    it("returns true when flow is active", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...createMockConversation(),
        currentFlow: "booking",
      });

      const { hasActiveFlow } = await import("@/lib/ai/flows/executor");

      const result = await hasActiveFlow("conv_test123");

      expect(result).toBe(true);
    });

    it("returns false when no active flow", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...createMockConversation(),
        currentFlow: null,
      });

      const { hasActiveFlow } = await import("@/lib/ai/flows/executor");

      const result = await hasActiveFlow("conv_test123");

      expect(result).toBe(false);
    });
  });

  describe("getCurrentFlowType()", () => {
    it("returns flow type when active", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...createMockConversation(),
        currentFlow: "lead_capture",
      });

      const { getCurrentFlowType } = await import("@/lib/ai/flows/executor");

      const result = await getCurrentFlowType("conv_test123");

      expect(result).toBe("lead_capture");
    });

    it("returns null when no flow", async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...createMockConversation(),
        currentFlow: null,
      });

      const { getCurrentFlowType } = await import("@/lib/ai/flows/executor");

      const result = await getCurrentFlowType("conv_test123");

      expect(result).toBeNull();
    });
  });

  describe("cancelFlow()", () => {
    it("clears flow state in database", async () => {
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());

      const { cancelFlow } = await import("@/lib/ai/flows/executor");

      await cancelFlow("conv_test123");

      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: "conv_test123" },
        data: expect.objectContaining({
          currentFlow: null,
        }),
      });
    });
  });
});
