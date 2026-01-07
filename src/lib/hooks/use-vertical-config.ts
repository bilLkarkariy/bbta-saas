// Hook for accessing tenant's vertical configuration

"use client";

import { useMemo } from "react";
import { loadTenantVerticalConfig, type VerticalConfig, type TenantVerticalOverrides } from "@/config/verticals";

interface UseVerticalConfigOptions {
  businessType: string;
  verticalConfig?: TenantVerticalOverrides | null;
}

/**
 * Hook to get the complete vertical config for the current tenant
 */
export function useVerticalConfig({ businessType, verticalConfig }: UseVerticalConfigOptions): VerticalConfig {
  return useMemo(() => {
    return loadTenantVerticalConfig(businessType, verticalConfig);
  }, [businessType, verticalConfig]);
}

/**
 * Hook to check if a feature is enabled for the current tenant
 */
export function useFeatureEnabled(
  businessType: string,
  feature: keyof VerticalConfig["features"],
  verticalConfig?: TenantVerticalOverrides | null
): boolean {
  const config = useVerticalConfig({ businessType, verticalConfig });
  return config.features[feature];
}

/**
 * Hook to get templates filtered by category
 */
export function useTemplatesByCategory(
  businessType: string,
  category: string,
  verticalConfig?: TenantVerticalOverrides | null
) {
  const config = useVerticalConfig({ businessType, verticalConfig });
  return useMemo(() => {
    return config.templates.filter((t) => t.category === category);
  }, [config.templates, category]);
}

/**
 * Hook to get FAQ presets for the current vertical
 */
export function useFaqPresets(
  businessType: string,
  verticalConfig?: TenantVerticalOverrides | null
) {
  const config = useVerticalConfig({ businessType, verticalConfig });
  return config.faqPresets;
}

/**
 * Hook to get service presets for the current vertical
 */
export function useServicePresets(
  businessType: string,
  verticalConfig?: TenantVerticalOverrides | null
) {
  const config = useVerticalConfig({ businessType, verticalConfig });
  return config.servicePresets || [];
}

/**
 * Hook to get onboarding steps for the current vertical
 */
export function useOnboardingSteps(
  businessType: string,
  skipSteps?: string[],
  verticalConfig?: TenantVerticalOverrides | null
) {
  const config = useVerticalConfig({ businessType, verticalConfig });
  return useMemo(() => {
    if (!skipSteps?.length) {
      return config.onboarding;
    }
    return config.onboarding.filter((step) => !skipSteps.includes(step.id));
  }, [config.onboarding, skipSteps]);
}
