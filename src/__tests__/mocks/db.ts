import { vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";

// Create deep mock of Prisma client
export const prismaMock = mockDeep<PrismaClient>();

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: prismaMock,
}));

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Helper to create mock conversation
export function createMockConversation(overrides = {}) {
  return {
    id: "conv_test123",
    tenantId: "tenant_test123",
    customerPhone: "+33612345678",
    customerName: "Jean Test",
    customerEmail: null,
    status: "active",
    currentFlow: null,
    currentStep: null,
    flowData: null,
    leadStatus: null,
    leadScore: null,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    // New fields from Phase 3
    assignedToId: null,
    assignedAt: null,
    priority: "normal",
    tags: [],
    ...overrides,
  };
}

// Helper to create mock message
export function createMockMessage(overrides = {}) {
  return {
    id: "msg_test123",
    conversationId: "conv_test123",
    direction: "inbound" as const,
    content: "Bonjour, je voudrais un rendez-vous",
    messageType: "text",
    status: "received",
    twilioSid: "SM123456",
    intent: null,
    confidence: null,
    tierUsed: null,
    faqMatchId: null,
    inputTokens: null,
    outputTokens: null,
    costUsd: null,
    metadata: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// Helper to create mock tenant
export function createMockTenant(overrides = {}) {
  return {
    id: "tenant_test123",
    clerkId: "clerk_test123",
    name: "Test Business",
    slug: "test-business",
    businessType: "Restaurant",
    whatsappNumber: "+33612345678",
    twilioSid: null,
    address: null,
    city: null,
    timezone: "Europe/Paris",
    services: ["Réservation", "Commande", "Information"],
    businessHours: "09:00-18:00",
    pricing: null,
    plan: "starter",
    status: "trial",
    trialEndsAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    assignmentStrategy: "manual",
    autoAssignOnInbound: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create mock FAQ
export function createMockFAQ(overrides = {}) {
  return {
    id: "faq_test123",
    tenantId: "tenant_test123",
    question: "Quels sont vos horaires ?",
    answer: "Nous sommes ouverts de 9h à 18h du lundi au vendredi.",
    category: "Horaires",
    keywords: ["horaires", "ouverture", "heure"],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create mock booking
export function createMockBooking(overrides = {}) {
  return {
    id: "booking_test123",
    tenantId: "tenant_test123",
    conversationId: "conv_test123",
    customerPhone: "+33612345678",
    customerName: "Jean Test",
    service: "Consultation",
    date: "2026-01-15",
    time: "14:00",
    resourceId: null,
    status: "confirmed",
    notes: null,
    reminderSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create mock contact
export function createMockContact(overrides = {}) {
  return {
    id: "contact_test123",
    tenantId: "tenant_test123",
    phone: "+33612345678",
    name: "Jean Test",
    email: "jean@test.com",
    company: null,
    source: "whatsapp",
    customFields: {},
    lastContactAt: new Date(),
    messageCount: 0,
    isOptedOut: false,
    optedOutAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create mock user
export function createMockUser(overrides = {}) {
  return {
    id: "user_test123",
    clerkId: "clerk_user123",
    tenantId: "tenant_test123",
    email: "user@test.com",
    name: "Test User",
    role: "AGENT" as const,
    isAvailable: true,
    maxConversations: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
