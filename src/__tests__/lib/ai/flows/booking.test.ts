import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock, createMockConversation, createMockTenant, createMockBooking } from "../../../mocks/db";

// We need to test the booking flow's helper functions
// Since they're not exported, we'll test them through the flow behavior

describe("Booking Flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set to January 10, 2026, 10:00 AM Paris time
    vi.setSystemTime(new Date("2026-01-10T10:00:00+01:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Date parsing", () => {
    // Import the flow to access step validation
    it("handles 'demain' correctly", async () => {
      // Tomorrow from Jan 10, 2026 should be Jan 11, 2026
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant(), timezone: "Europe/Paris" },
        conversation: { ...createMockConversation() },
        currentData: {},
        message: "demain",
      };

      const step = BOOKING_FLOW.steps.ask_date;
      const result = await step.validate("demain", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("2026-01-11");
    });

    it("handles day names (lundi)", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant(), timezone: "Europe/Paris" },
        conversation: { ...createMockConversation() },
        currentData: {},
        message: "lundi",
      };

      const step = BOOKING_FLOW.steps.ask_date;
      const result = await step.validate("lundi", context);

      expect(result.valid).toBe(true);
      // Jan 10, 2026 is a Saturday, so next Monday is Jan 12
      expect(result.extractedValue).toBe("2026-01-12");
    });

    it("handles explicit dates (15/01)", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant(), timezone: "Europe/Paris" },
        conversation: { ...createMockConversation() },
        currentData: {},
        message: "15/01",
      };

      const step = BOOKING_FLOW.steps.ask_date;
      const result = await step.validate("15/01", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("2026-01-15");
    });

    it("rejects past dates", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant(), timezone: "Europe/Paris" },
        conversation: { ...createMockConversation() },
        currentData: {},
        message: "05/01/2026",
      };

      const step = BOOKING_FLOW.steps.ask_date;
      const result = await step.validate("05/01/2026", context);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain("passée");
    });

    it("handles aujourd'hui", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant(), timezone: "Europe/Paris" },
        conversation: { ...createMockConversation() },
        currentData: {},
        message: "aujourd'hui",
      };

      const step = BOOKING_FLOW.steps.ask_date;
      const result = await step.validate("aujourd'hui", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("2026-01-10");
    });
  });

  describe("Time parsing", () => {
    it("handles 14h format", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      prismaMock.booking.findFirst.mockResolvedValue(null);
      prismaMock.booking.findMany.mockResolvedValue([]);

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: { date: "2026-01-15" },
        message: "14h",
      };

      const step = BOOKING_FLOW.steps.ask_time;
      const result = await step.validate("14h", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("14:00");
    });

    it("handles 10h30 format", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      prismaMock.booking.findFirst.mockResolvedValue(null);

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: { date: "2026-01-15" },
        message: "10h30",
      };

      const step = BOOKING_FLOW.steps.ask_time;
      const result = await step.validate("10h30", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("10:30");
    });

    it("handles midi keyword", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      prismaMock.booking.findFirst.mockResolvedValue(null);

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: { date: "2026-01-15" },
        message: "à midi",
      };

      const step = BOOKING_FLOW.steps.ask_time;
      const result = await step.validate("à midi", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("12:00");
    });

    it("rejects unavailable slot", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      // Mock existing booking at 14:00
      prismaMock.booking.findFirst.mockResolvedValue(createMockBooking({ time: "14:00" }));
      prismaMock.booking.findMany.mockResolvedValue([createMockBooking({ time: "14:00" })]);

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: { date: "2026-01-15" },
        message: "14h",
      };

      const step = BOOKING_FLOW.steps.ask_time;
      const result = await step.validate("14h", context);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain("disponible");
    });
  });

  describe("Availability checking", () => {
    it("returns true for empty slot", async () => {
      prismaMock.booking.findFirst.mockResolvedValue(null);

      // Test via the validation which internally checks availability
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: { date: "2026-01-15" },
        message: "14h",
      };

      const step = BOOKING_FLOW.steps.ask_time;
      const result = await step.validate("14h", context);

      expect(result.valid).toBe(true);
    });

    it("filters booked times from available slots", async () => {
      prismaMock.booking.findMany.mockResolvedValue([
        createMockBooking({ time: "10:00" }),
        createMockBooking({ time: "14:00" }),
      ]);

      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: { date: "2026-01-15" },
        message: "",
      };

      const step = BOOKING_FLOW.steps.ask_time;
      const prompt = await step.prompt(context);

      // Should not include 10:00 and 14:00 in available slots
      expect(prompt).not.toContain("10:00");
      expect(prompt).not.toContain("14:00");
      // Should include other slots
      expect(prompt).toContain("09:00");
    });
  });

  describe("Flow completion", () => {
    it("creates booking in database on completion", async () => {
      prismaMock.booking.create.mockResolvedValue(createMockBooking());
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());

      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: {
          service: "Consultation",
          date: "2026-01-15",
          time: "14:00",
          name: "Jean Test",
          confirmed: true,
        },
        message: "oui",
      };

      const response = await BOOKING_FLOW.onComplete(context.currentData, context);

      expect(prismaMock.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          service: "Consultation",
          date: "2026-01-15",
          time: "14:00",
          customerName: "Jean Test",
          status: "confirmed",
        }),
      });
      expect(response).toContain("confirmée");
    });

    it("clears flow state on cancellation", async () => {
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());

      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation() },
        currentData: {},
        message: "annule",
      };

      await BOOKING_FLOW.onCancel(context);

      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: context.conversation.id },
        data: expect.objectContaining({
          currentFlow: null,
        }),
      });
    });
  });

  describe("Name validation", () => {
    it("accepts confirmation when name is known", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation(), customerName: "Jean Dupont" },
        currentData: {},
        message: "oui",
      };

      const step = BOOKING_FLOW.steps.ask_name;
      const result = await step.validate("oui", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("Jean Dupont");
    });

    it("extracts new name when provided", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant() },
        conversation: { ...createMockConversation(), customerName: null },
        currentData: {},
        message: "Marie Martin",
      };

      const step = BOOKING_FLOW.steps.ask_name;
      const result = await step.validate("Marie Martin", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("Marie Martin");
    });
  });

  describe("Service extraction", () => {
    it("extracts service name from response", async () => {
      const { BOOKING_FLOW } = await import("@/lib/ai/flows/booking");

      const context = {
        tenant: { ...createMockTenant(), services: ["Consultation", "Massage"] },
        conversation: { ...createMockConversation() },
        currentData: {},
        message: "Je voudrais une consultation",
      };

      const step = BOOKING_FLOW.steps.ask_service;
      const result = await step.validate("Je voudrais une consultation", context);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toContain("consultation");
    });
  });
});
