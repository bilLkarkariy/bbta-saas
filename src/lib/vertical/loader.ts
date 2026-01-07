// Vertical Configuration Loader
// Loads and merges vertical config based on tenant's business type

import type {
  BusinessVertical,
  VerticalConfig,
  TenantVerticalOverrides,
  VerticalTemplate,
  VerticalFlow,
} from "@/config/verticals/types";
import { baseConfig } from "@/config/verticals/base";
import { beauteConfig } from "@/config/verticals/beaute";
import { servicesConfig } from "@/config/verticals/services";
import { ecommerceConfig } from "@/config/verticals/ecommerce";

/**
 * Map of business types to vertical configs
 */
const verticalConfigs: Record<BusinessVertical, VerticalConfig> = {
  generic: baseConfig,
  beaute: beauteConfig,
  services: servicesConfig,
  ecommerce: ecommerceConfig,
};

/**
 * Legacy business type mapping
 * Maps old businessType values to vertical IDs
 */
const businessTypeMapping: Record<string, BusinessVertical> = {
  // Direct mappings
  beaute: "beaute",
  beauty: "beaute",
  salon: "beaute",
  spa: "beaute",
  coiffeur: "beaute",
  coiffure: "beaute",
  esthetique: "beaute",

  services: "services",
  service: "services",
  artisan: "services",
  plombier: "services",
  electricien: "services",
  consultant: "services",

  ecommerce: "ecommerce",
  "e-commerce": "ecommerce",
  boutique: "ecommerce",
  shop: "ecommerce",
  magasin: "ecommerce",

  // Default to generic
  generic: "generic",
  restaurant: "generic",
  other: "generic",
};

/**
 * Resolve business type string to vertical ID
 */
export function resolveVertical(businessType: string): BusinessVertical {
  const normalized = businessType.toLowerCase().trim();
  return businessTypeMapping[normalized] || "generic";
}

/**
 * Get vertical config by business type
 */
export function getVerticalConfig(businessType: string): VerticalConfig {
  const verticalId = resolveVertical(businessType);
  return verticalConfigs[verticalId];
}

/**
 * Get vertical config by ID
 */
export function getVerticalConfigById(verticalId: BusinessVertical): VerticalConfig {
  return verticalConfigs[verticalId];
}

/**
 * Get all available verticals
 */
export function getAllVerticals(): { id: BusinessVertical; name: string; description: string }[] {
  return Object.values(verticalConfigs).map((config) => ({
    id: config.id,
    name: config.name,
    description: config.description,
  }));
}

/**
 * Merge tenant-specific overrides with vertical config
 */
export function mergeVerticalConfig(
  verticalConfig: VerticalConfig,
  overrides?: TenantVerticalOverrides | null
): VerticalConfig {
  if (!overrides) {
    return verticalConfig;
  }

  let mergedConfig = { ...verticalConfig };

  // Merge templates
  if (overrides.templates) {
    let templates = [...verticalConfig.templates];

    // Remove templates by ID
    if (overrides.templates.remove) {
      templates = templates.filter(
        (t) => !overrides.templates!.remove!.includes(t.id)
      );
    }

    // Add custom templates
    if (overrides.templates.add) {
      templates = [...templates, ...overrides.templates.add];
    }

    mergedConfig = { ...mergedConfig, templates };
  }

  // Disable flows
  if (overrides.flows?.disable) {
    const disabledFlows = overrides.flows.disable;
    const flows = verticalConfig.flows.filter(
      (f) => !disabledFlows.includes(f.id)
    );
    mergedConfig = { ...mergedConfig, flows };
  }

  // Merge branding
  if (overrides.branding) {
    mergedConfig = {
      ...mergedConfig,
      branding: { ...verticalConfig.branding, ...overrides.branding },
    };
  }

  // Merge features
  if (overrides.features) {
    mergedConfig = {
      ...mergedConfig,
      features: { ...verticalConfig.features, ...overrides.features },
    };
  }

  return mergedConfig;
}

/**
 * Load complete vertical config for a tenant
 */
export function loadTenantVerticalConfig(
  businessType: string,
  tenantOverrides?: TenantVerticalOverrides | null
): VerticalConfig {
  const baseVerticalConfig = getVerticalConfig(businessType);
  return mergeVerticalConfig(baseVerticalConfig, tenantOverrides);
}

/**
 * Get templates for a specific category
 */
export function getTemplatesByCategory(
  config: VerticalConfig,
  category: VerticalTemplate["category"]
): VerticalTemplate[] {
  return config.templates.filter((t) => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(
  config: VerticalConfig,
  templateId: string
): VerticalTemplate | undefined {
  return config.templates.find((t) => t.id === templateId);
}

/**
 * Get flow by ID
 */
export function getFlowById(
  config: VerticalConfig,
  flowId: string
): VerticalFlow | undefined {
  return config.flows.find((f) => f.id === flowId);
}

/**
 * Get flow by trigger intent
 */
export function getFlowByIntent(
  config: VerticalConfig,
  intent: string
): VerticalFlow | undefined {
  return config.flows.find((f) => f.triggerIntent === intent);
}

/**
 * Check if a feature is enabled for a vertical
 */
export function isFeatureEnabled(
  config: VerticalConfig,
  feature: keyof VerticalConfig["features"]
): boolean {
  return config.features[feature];
}

/**
 * Get navigation items with vertical-specific modifications
 */
export function getFilteredNavItems<T extends { href: string }>(
  navItems: T[],
  config: VerticalConfig
): T[] {
  if (!config.hiddenNavItems?.length) {
    return navItems;
  }
  return navItems.filter((item) => !config.hiddenNavItems!.includes(item.href));
}

/**
 * Get FAQ presets for a vertical
 */
export function getFaqPresets(config: VerticalConfig) {
  return config.faqPresets;
}

/**
 * Get service presets for a vertical (if available)
 */
export function getServicePresets(config: VerticalConfig) {
  return config.servicePresets || [];
}

/**
 * Interpolate variables in a template string
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

/**
 * Get onboarding steps for a vertical
 */
export function getOnboardingSteps(config: VerticalConfig) {
  return config.onboarding;
}

/**
 * Filter onboarding steps (skip specific steps)
 */
export function getFilteredOnboardingSteps(
  config: VerticalConfig,
  skipSteps?: string[]
) {
  if (!skipSteps?.length) {
    return config.onboarding;
  }
  return config.onboarding.filter((step) => !skipSteps.includes(step.id));
}

// Export types for convenience
export type { BusinessVertical, VerticalConfig, TenantVerticalOverrides };
