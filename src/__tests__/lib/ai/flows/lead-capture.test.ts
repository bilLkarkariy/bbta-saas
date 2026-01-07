import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, createMockConversation, createMockTenant, createMockContact } from "../../../mocks/db";

describe("Lead Capture Flow", () => {
  describe("Email validation", () => {
    it("validates correct email format", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_email;
      const result = await step.validate("jean@example.com", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("jean@example.com");
    });

    it("rejects invalid email format", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_email;
      const result = await step.validate("invalid-email", {} as never);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain("valide");
    });

    it("normalizes email to lowercase", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_email;
      const result = await step.validate("Jean@Example.COM", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("jean@example.com");
    });
  });

  describe("Phone validation", () => {
    it("validates French phone number", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        conversation: { ...createMockConversation(), customerPhone: null },
      };

      const step = LEAD_CAPTURE_FLOW.steps.ask_phone;
      const result = await step.validate("+33612345678", context as never);

      expect(result.valid).toBe(true);
    });

    it("validates phone with spaces", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        conversation: { ...createMockConversation(), customerPhone: null },
      };

      const step = LEAD_CAPTURE_FLOW.steps.ask_phone;
      const result = await step.validate("06 12 34 56 78", context as never);

      expect(result.valid).toBe(true);
    });

    it("accepts existing WhatsApp number", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        conversation: { ...createMockConversation(), customerPhone: "+33612345678" },
      };

      const step = LEAD_CAPTURE_FLOW.steps.ask_phone;
      const result = await step.validate("oui", context as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("+33612345678");
    });

    it("rejects invalid phone", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        conversation: { ...createMockConversation(), customerPhone: null },
      };

      const step = LEAD_CAPTURE_FLOW.steps.ask_phone;
      const result = await step.validate("123", context as never);

      expect(result.valid).toBe(false);
    });
  });

  describe("Contact method branching", () => {
    it("routes to email step for email choice", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_contact;
      const result = await step.validate("email", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("email");

      const nextStep = step.next({ contact_method: "email" });
      expect(nextStep).toBe("ask_email");
    });

    it("routes to phone step for phone choice", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_contact;
      const result = await step.validate("téléphone", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("phone");

      const nextStep = step.next({ contact_method: "phone" });
      expect(nextStep).toBe("ask_phone");
    });

    it("routes to email first for both choice", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_contact;
      const result = await step.validate("les deux", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("both");

      const nextStep = step.next({ contact_method: "both" });
      expect(nextStep).toBe("ask_email");
    });

    it("routes from email to phone for both choice", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_email;
      const nextStep = step.next({ contact_method: "both" });

      expect(nextStep).toBe("ask_phone");
    });
  });

  describe("Interest capture", () => {
    it("captures interest from first step", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        tenant: { ...createMockTenant(), services: ["Service A", "Service B"] },
      };

      const step = LEAD_CAPTURE_FLOW.steps.ask_interest;
      const result = await step.validate("Je suis intéressé par le Service A", context as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toContain("Service A");
    });

    it("rejects too short interest", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_interest;
      const result = await step.validate("ok", {} as never);

      expect(result.valid).toBe(false);
    });
  });

  describe("Availability capture", () => {
    it("recognizes matin", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_availability;
      const result = await step.validate("le matin", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toContain("matin");
    });

    it("recognizes après-midi", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_availability;
      const result = await step.validate("après-midi", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toContain("après-midi");
    });

    it("recognizes flexible availability", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const step = LEAD_CAPTURE_FLOW.steps.ask_availability;
      const result = await step.validate("n'importe quand", {} as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("flexible");
    });
  });

  describe("Flow completion", () => {
    it("creates contact in database", async () => {
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());
      prismaMock.contact.upsert.mockResolvedValue(createMockContact());

      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        tenant: createMockTenant(),
        conversation: createMockConversation(),
        currentData: {
          interest: "Service A",
          name: "Jean Dupont",
          contact_method: "email",
          email: "jean@example.com",
          availability: "matin",
          confirmed: true,
        },
        message: "oui",
      };

      await LEAD_CAPTURE_FLOW.onComplete(context.currentData, context as never);

      expect(prismaMock.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            name: "Jean Dupont",
            email: "jean@example.com",
          }),
        })
      );
    });

    it("updates existing contact", async () => {
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());
      prismaMock.contact.upsert.mockResolvedValue(createMockContact());

      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        tenant: createMockTenant(),
        conversation: createMockConversation(),
        currentData: {
          interest: "Updated interest",
          name: "Jean Updated",
          contact_method: "phone",
          phone: "+33612345678",
          availability: "flexible",
          confirmed: true,
        },
        message: "oui",
      };

      await LEAD_CAPTURE_FLOW.onComplete(context.currentData, context as never);

      expect(prismaMock.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            name: "Jean Updated",
          }),
        })
      );
    });

    it("assigns lead score of 70", async () => {
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());
      prismaMock.contact.upsert.mockResolvedValue(createMockContact());

      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        tenant: createMockTenant(),
        conversation: createMockConversation(),
        currentData: {
          interest: "Service",
          name: "Jean",
          contact_method: "email",
          email: "j@e.com",
          availability: "matin",
          confirmed: true,
        },
        message: "oui",
      };

      await LEAD_CAPTURE_FLOW.onComplete(context.currentData, context as never);

      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadScore: 70,
          }),
        })
      );
    });

    it("stores custom fields", async () => {
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());
      prismaMock.contact.upsert.mockResolvedValue(createMockContact());

      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        tenant: createMockTenant(),
        conversation: createMockConversation(),
        currentData: {
          interest: "Specific interest",
          name: "Jean",
          contact_method: "email",
          email: "j@e.com",
          availability: "flexible",
          confirmed: true,
        },
        message: "oui",
      };

      await LEAD_CAPTURE_FLOW.onComplete(context.currentData, context as never);

      expect(prismaMock.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            customFields: expect.objectContaining({
              interest: "Specific interest",
              availability: "flexible",
            }),
          }),
        })
      );
    });
  });

  describe("Flow cancellation", () => {
    it("clears flow state on cancel", async () => {
      prismaMock.conversation.update.mockResolvedValue(createMockConversation());

      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        tenant: createMockTenant(),
        conversation: createMockConversation(),
        currentData: {},
        message: "annule",
      };

      await LEAD_CAPTURE_FLOW.onCancel(context as never);

      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: context.conversation.id },
        data: expect.objectContaining({
          currentFlow: null,
        }),
      });
    });
  });

  describe("Name step", () => {
    it("confirms existing customer name", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        conversation: { ...createMockConversation(), customerName: "Jean Dupont" },
      };

      const step = LEAD_CAPTURE_FLOW.steps.ask_name;
      const result = await step.validate("oui c'est ça", context as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("Jean Dupont");
    });

    it("captures new name", async () => {
      const { LEAD_CAPTURE_FLOW } = await import("@/lib/ai/flows/lead-capture");

      const context = {
        conversation: { ...createMockConversation(), customerName: null },
      };

      const step = LEAD_CAPTURE_FLOW.steps.ask_name;
      const result = await step.validate("Marie Martin", context as never);

      expect(result.valid).toBe(true);
      expect(result.extractedValue).toBe("Marie Martin");
    });
  });
});
