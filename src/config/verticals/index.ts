// Vertical Configurations Index
// Re-exports all vertical configs and types

export * from "./types";
export { baseConfig } from "./base";
export { beauteConfig } from "./beaute";
export { servicesConfig } from "./services";
export { ecommerceConfig } from "./ecommerce";

// Re-export loader utilities
export {
  resolveVertical,
  getVerticalConfig,
  getVerticalConfigById,
  getAllVerticals,
  mergeVerticalConfig,
  loadTenantVerticalConfig,
  getTemplatesByCategory,
  getTemplateById,
  getFlowById,
  getFlowByIntent,
  isFeatureEnabled,
  getFilteredNavItems,
  getFaqPresets,
  getServicePresets,
  interpolateTemplate,
  getOnboardingSteps,
  getFilteredOnboardingSteps,
} from "@/lib/vertical/loader";
