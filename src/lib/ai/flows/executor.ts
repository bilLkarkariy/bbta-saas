import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { FlowState, FlowContext, FlowDefinition, FlowType } from "./types";
import { BOOKING_FLOW } from "./booking";
import { LEAD_CAPTURE_FLOW } from "./lead-capture";
import { QUOTE_REQUEST_FLOW } from "./quote-request";
import { ORDER_TRACKING_FLOW } from "./order-tracking";

const FLOWS: Record<FlowType, FlowDefinition> = {
  booking: BOOKING_FLOW,
  lead_capture: LEAD_CAPTURE_FLOW,
  quote_request: QUOTE_REQUEST_FLOW,
  order_tracking: ORDER_TRACKING_FLOW,
  return_request: LEAD_CAPTURE_FLOW, // Fallback to lead capture for returns (can be specialized later)
};

// Zod schema for validating flow state from database
const FlowStateSchema = z.object({
  type: z.enum(["booking", "lead_capture", "quote_request", "order_tracking", "return_request"]),
  step: z.string(),
  data: z.record(z.string(), z.unknown()),
  startedAt: z.string().or(z.date()),
  attempts: z.number().int().min(0),
});

// Parse and validate flow state from database
function parseFlowState(data: unknown): FlowState | null {
  if (!data || typeof data !== "object") return null;

  const result = FlowStateSchema.safeParse(data);
  if (!result.success) {
    console.error("[Flow] Invalid flow state in database:", result.error.issues);
    return null;
  }

  return {
    type: result.data.type,
    step: result.data.step,
    data: result.data.data as Record<string, unknown>,
    startedAt: typeof result.data.startedAt === "string"
      ? new Date(result.data.startedAt)
      : result.data.startedAt,
    attempts: result.data.attempts,
  };
}

// Helper to convert FlowState to JSON-safe format for Prisma
function flowStateToJson(state: FlowState): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify({
    type: state.type,
    step: state.step,
    data: state.data,
    startedAt: state.startedAt instanceof Date ? state.startedAt.toISOString() : state.startedAt,
    attempts: state.attempts,
  })) as Prisma.InputJsonValue;
}

export interface FlowExecutionResult {
  response: string;
  flowComplete?: boolean;
  flowCancelled?: boolean;
  shouldRetry?: boolean;
  newState?: FlowState;
}

interface ConversationWithTenant {
  id: string;
  tenantId: string;
  customerPhone: string;
  customerName: string | null;
  currentFlow: string | null;
  flowData: unknown;
  tenant: {
    id: string;
    name: string;
    businessType: string;
    timezone: string;
    services: string[];
    businessHours: string | null;
  };
}

export async function executeFlow(
  conversationId: string,
  message: string,
  suggestedFlow?: FlowType | null
): Promise<FlowExecutionResult | null> {
  // Get conversation with tenant
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          businessType: true,
          timezone: true,
          services: true,
          businessHours: true,
        },
      },
    },
  }) as ConversationWithTenant | null;

  if (!conversation) return null;

  // Validate flow state from database
  const currentState = parseFlowState(conversation.flowData);

  // No active flow and no suggestion
  if (!currentState && !suggestedFlow) {
    return null;
  }

  // Start new flow
  if (!currentState && suggestedFlow) {
    return startFlow(conversation, suggestedFlow, message);
  }

  // Continue existing flow
  return continueFlow(conversation, currentState!, message);
}

async function startFlow(
  conversation: ConversationWithTenant,
  flowType: FlowType,
  message: string
): Promise<FlowExecutionResult> {
  const flow = FLOWS[flowType];
  const firstStepId = Object.keys(flow.steps)[0];
  const firstStep = flow.steps[firstStepId];

  const state: FlowState = {
    type: flowType,
    step: firstStepId,
    data: {},
    startedAt: new Date(),
    attempts: 0,
  };

  // Save flow state
  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      currentFlow: flowType,
      flowData: flowStateToJson(state),
    },
  });

  const context: FlowContext = {
    tenant: {
      id: conversation.tenant.id,
      name: conversation.tenant.name,
      businessType: conversation.tenant.businessType,
      timezone: conversation.tenant.timezone,
      services: conversation.tenant.services,
      businessHours: conversation.tenant.businessHours || undefined,
    },
    conversation: {
      id: conversation.id,
      customerPhone: conversation.customerPhone,
      customerName: conversation.customerName,
    },
    currentData: {},
    message,
  };

  // Get the first prompt
  const prompt = await Promise.resolve(firstStep.prompt(context));

  return {
    response: prompt,
    newState: state,
  };
}

async function continueFlow(
  conversation: ConversationWithTenant,
  state: FlowState,
  message: string
): Promise<FlowExecutionResult> {
  const flow = FLOWS[state.type];
  const currentStep = flow.steps[state.step];

  if (!currentStep) {
    // Invalid step, cancel flow
    const cancelContext = buildContext(conversation, state.data, message);
    const cancelResponse = await flow.onCancel(cancelContext);
    return {
      response: cancelResponse,
      flowCancelled: true,
    };
  }

  const context = buildContext(conversation, state.data, message);

  // Check for cancellation keywords
  const loweredMessage = message.toLowerCase();
  if (loweredMessage.match(/\b(annule|stop|quitter|abandon|arrête|arrete)\b/)) {
    const cancelResponse = await flow.onCancel(context);
    return {
      response: cancelResponse,
      flowCancelled: true,
    };
  }

  // Validate response
  const validation = await Promise.resolve(currentStep.validate(message, context));

  if (!validation.valid) {
    // Increment attempts
    const newAttempts = state.attempts + 1;

    if (newAttempts >= flow.maxAttempts) {
      await flow.onCancel(context);
      return {
        response: "Je suis désolé, je n'arrive pas à comprendre. Un conseiller va prendre le relais sous peu. 🙏",
        flowCancelled: true,
      };
    }

    // Update attempts
    const newState: FlowState = { ...state, attempts: newAttempts };
    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        flowData: flowStateToJson(newState),
      },
    });

    return {
      response: validation.errorMessage || "Je n'ai pas compris, pouvez-vous reformuler ?",
      shouldRetry: true,
      newState,
    };
  }

  // Update data with extracted value
  const stepKey = currentStep.id.replace("ask_", "");
  const newData = {
    ...state.data,
    [stepKey]: validation.extractedValue,
  };

  // Determine next step
  const nextStepId = currentStep.next(newData);

  // Flow complete
  if (!nextStepId) {
    const completeResponse = await flow.onComplete(newData, { ...context, currentData: newData });
    return {
      response: completeResponse,
      flowComplete: true,
    };
  }

  // Check if next step exists
  const nextStep = flow.steps[nextStepId];
  if (!nextStep) {
    // Flow complete (no more steps)
    const completeResponse = await flow.onComplete(newData, { ...context, currentData: newData });
    return {
      response: completeResponse,
      flowComplete: true,
    };
  }

  // Continue to next step
  const newState: FlowState = {
    ...state,
    step: nextStepId,
    data: newData,
    attempts: 0,
  };

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      flowData: flowStateToJson(newState),
    },
  });

  const nextContext = { ...context, currentData: newData };
  const nextPrompt = await Promise.resolve(nextStep.prompt(nextContext));

  return {
    response: nextPrompt,
    newState,
  };
}

function buildContext(
  conversation: ConversationWithTenant,
  data: Record<string, unknown>,
  message: string
): FlowContext {
  return {
    tenant: {
      id: conversation.tenant.id,
      name: conversation.tenant.name,
      businessType: conversation.tenant.businessType,
      timezone: conversation.tenant.timezone,
      services: conversation.tenant.services,
      businessHours: conversation.tenant.businessHours || undefined,
    },
    conversation: {
      id: conversation.id,
      customerPhone: conversation.customerPhone,
      customerName: conversation.customerName,
    },
    currentData: data,
    message,
  };
}

// Helper to check if a conversation has an active flow
export async function hasActiveFlow(conversationId: string): Promise<boolean> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { currentFlow: true },
  });
  return !!conversation?.currentFlow;
}

// Helper to get current flow type
export async function getCurrentFlowType(conversationId: string): Promise<FlowType | null> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { currentFlow: true },
  });
  return (conversation?.currentFlow as FlowType) || null;
}

// Cancel a flow manually
export async function cancelFlow(conversationId: string): Promise<void> {
  await db.conversation.update({
    where: { id: conversationId },
    data: {
      currentFlow: null,
      flowData: Prisma.JsonNull,
    },
  });
}
