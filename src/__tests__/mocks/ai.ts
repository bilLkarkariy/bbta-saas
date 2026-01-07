import { vi } from "vitest";

// Mock AI response factory
export function createMockAIResponse(content: string) {
  return {
    id: "chatcmpl-test123",
    object: "chat.completion",
    created: Date.now(),
    model: "gpt-4",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  };
}

// Mock router result JSON
export function createMockRouterJSON(overrides = {}) {
  return JSON.stringify({
    intent: "FAQ",
    confidence: 0.9,
    tier_needed: 1,
    entities: {},
    should_continue_flow: false,
    suggested_flow: null,
    reasoning: "Simple FAQ question",
    ...overrides,
  });
}

// Create mock AI client
export const mockAIClient = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

// Mock the AI module
vi.mock("@/lib/ai", () => ({
  getAIClient: () => mockAIClient,
  MODELS: {
    TIER_1: "x-ai/grok-4.1-fast",
    TIER_2: "anthropic/claude-sonnet-4.5",
    TIER_3: "anthropic/claude-opus-4.5",
  },
}));

// Queue of responses for sequential mocking
let responseQueue: string[] = [];

// Helper to setup AI mock response (queues multiple responses)
export function mockAIClientResponse(content: string) {
  responseQueue.push(content);
  mockAIClient.chat.completions.create.mockImplementation(() => {
    const nextContent = responseQueue.shift() || content;
    return Promise.resolve(createMockAIResponse(nextContent));
  });
}

// Helper to setup AI mock error
export function mockAIClientError(error: Error) {
  mockAIClient.chat.completions.create.mockRejectedValue(error);
}

// Reset AI mocks
export function resetAIMocks() {
  mockAIClient.chat.completions.create.mockReset();
  responseQueue = [];
}
