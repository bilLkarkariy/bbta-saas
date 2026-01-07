export type FlowType = "booking" | "lead_capture" | "quote_request" | "order_tracking" | "return_request";

// Map intents to flow types
export const INTENT_TO_FLOW: Record<string, FlowType | undefined> = {
  BOOKING: "booking",
  LEAD_CAPTURE: "lead_capture",
  QUOTE_REQUEST: "quote_request",
  ORDER_TRACKING: "order_tracking",
  RETURN_REQUEST: "return_request",
};

export interface FlowState {
  type: FlowType;
  step: string;
  data: Record<string, unknown>;
  startedAt: Date;
  attempts: number;
}

export interface FlowContext {
  tenant: {
    id: string;
    name: string;
    businessType: string;
    timezone: string;
    services?: string[];
    businessHours?: string;
  };
  conversation: {
    id: string;
    customerPhone: string;
    customerName?: string | null;
  };
  currentData: Record<string, unknown>;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errorMessage?: string;
  extractedValue?: unknown;
}

export interface FlowStep {
  id: string;
  prompt: (context: FlowContext) => string | Promise<string>;
  validate: (response: string, context: FlowContext) => ValidationResult | Promise<ValidationResult>;
  next: (data: Record<string, unknown>) => string | null;
}

export interface FlowDefinition {
  type: FlowType;
  maxAttempts: number;
  steps: Record<string, FlowStep>;
  onComplete: (data: Record<string, unknown>, context: FlowContext) => Promise<string>;
  onCancel: (context: FlowContext) => Promise<string>;
}
