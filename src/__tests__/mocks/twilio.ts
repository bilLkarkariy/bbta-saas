import { vi } from "vitest";

// Mock Twilio send result
export function createMockTwilioResult(overrides = {}) {
  return {
    sid: "SM" + Math.random().toString(36).substring(2, 15),
    status: "sent",
    dateCreated: new Date(),
    dateSent: new Date(),
    ...overrides,
  };
}

// Create mock Twilio functions
export const mockSendWhatsAppMessage = vi.fn();
export const mockVerifyTwilioSignature = vi.fn();

// Mock the Twilio module
vi.mock("@/lib/twilio", () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
  verifyTwilioSignature: mockVerifyTwilioSignature,
}));

// Helper to setup successful send
export function mockTwilioSendSuccess(sid?: string) {
  const result = createMockTwilioResult(sid ? { sid } : {});
  mockSendWhatsAppMessage.mockResolvedValue(result);
  return result;
}

// Helper to setup send failure
export function mockTwilioSendFailure(error: Error) {
  mockSendWhatsAppMessage.mockRejectedValue(error);
}

// Helper to setup signature verification
export function mockTwilioSignatureValid(valid: boolean = true) {
  mockVerifyTwilioSignature.mockReturnValue(valid);
}

// Reset Twilio mocks
export function resetTwilioMocks() {
  mockSendWhatsAppMessage.mockReset();
  mockVerifyTwilioSignature.mockReset();
}
