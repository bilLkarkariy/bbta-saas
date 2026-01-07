// Integration Registry
// Central registry of all available integration providers

import type {
  IntegrationType,
  IntegrationProvider,
  IntegrationCategory,
  CalendarIntegration,
  BookingIntegration,
  EcommerceIntegration,
  ShippingIntegration,
} from "./types";

import { googleCalendarProvider } from "./providers/google-calendar";
import { shopifyProvider } from "./providers/shopify";
import { colissimoProvider } from "./providers/colissimo";

// Type-safe registry of all integration providers
type IntegrationRegistry = {
  // Calendar integrations
  google_calendar: CalendarIntegration;
  // E-commerce integrations
  shopify: EcommerceIntegration;
  // Shipping integrations
  colissimo: ShippingIntegration;
  // Future integrations (placeholder types)
  planity: BookingIntegration;
  treatwell: BookingIntegration;
  calendly: CalendarIntegration;
  woocommerce: EcommerceIntegration;
  chronopost: ShippingIntegration;
  mondial_relay: ShippingIntegration;
  twilio: IntegrationProvider;
  whatsapp_business: IntegrationProvider;
  webhook: IntegrationProvider;
  google_maps: IntegrationProvider;
  notion: IntegrationProvider;
  stripe: IntegrationProvider;
};

// Registered providers
const providers: Partial<IntegrationRegistry> = {
  google_calendar: googleCalendarProvider,
  shopify: shopifyProvider,
  colissimo: colissimoProvider,
};

/**
 * Get an integration provider by type
 */
export function getProvider<T extends IntegrationType>(
  type: T
): IntegrationRegistry[T] | undefined {
  return providers[type] as IntegrationRegistry[T] | undefined;
}

/**
 * Get all available integrations
 */
export function getAllProviders(): IntegrationProvider[] {
  return Object.values(providers).filter(Boolean) as IntegrationProvider[];
}

/**
 * Get integrations by category
 */
export function getProvidersByCategory(category: IntegrationCategory): IntegrationProvider[] {
  return getAllProviders().filter((p) => p.category === category);
}

/**
 * Check if an integration type is available
 */
export function isProviderAvailable(type: IntegrationType): boolean {
  return type in providers && providers[type] !== undefined;
}

/**
 * Get integration metadata for display
 */
export function getIntegrationMetadata() {
  return getAllProviders().map((p) => ({
    type: p.type,
    name: p.name,
    description: p.description,
    category: p.category,
    icon: p.icon,
  }));
}

/**
 * Vertical-specific integrations
 */
export const verticalIntegrations: Record<string, IntegrationType[]> = {
  beaute: ["google_calendar", "planity", "treatwell", "stripe"],
  services: ["google_calendar", "calendly", "google_maps", "notion", "stripe"],
  ecommerce: ["shopify", "woocommerce", "colissimo", "chronopost", "mondial_relay", "stripe"],
  generic: ["google_calendar", "stripe", "webhook"],
};

/**
 * Get recommended integrations for a vertical
 */
export function getRecommendedIntegrations(vertical: string): IntegrationProvider[] {
  const types = verticalIntegrations[vertical] || verticalIntegrations.generic;
  return types
    .map((type) => getProvider(type))
    .filter((p): p is IntegrationProvider => p !== undefined);
}

/**
 * Integration status helpers
 */
export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

export function getStatusColor(status: IntegrationStatus): string {
  switch (status) {
    case "connected":
      return "text-green-600 bg-green-100";
    case "disconnected":
      return "text-slate-600 bg-slate-100";
    case "error":
      return "text-red-600 bg-red-100";
    case "pending":
      return "text-yellow-600 bg-yellow-100";
  }
}

export function getStatusLabel(status: IntegrationStatus): string {
  switch (status) {
    case "connected":
      return "Connecté";
    case "disconnected":
      return "Non connecté";
    case "error":
      return "Erreur";
    case "pending":
      return "En attente";
  }
}
