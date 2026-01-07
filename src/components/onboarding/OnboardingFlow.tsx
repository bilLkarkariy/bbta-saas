"use client";

import { useState } from "react";
import { VerticalSelector } from "./VerticalSelector";
import { OnboardingWizard } from "./OnboardingWizard";
import { getVerticalConfig } from "@/config/verticals";
import { completeOnboarding } from "@/app/onboarding/actions";
import type { BusinessVertical, VerticalConfig } from "@/config/verticals/types";

interface OnboardingFlowProps {
  tenantId: string;
}

export function OnboardingFlow({ tenantId }: OnboardingFlowProps) {
  const [selectedVertical, setSelectedVertical] = useState<BusinessVertical | null>(null);
  const [verticalConfig, setVerticalConfig] = useState<VerticalConfig | null>(null);

  const handleVerticalSelect = (vertical: BusinessVertical) => {
    setSelectedVertical(vertical);
    const config = getVerticalConfig(vertical);
    setVerticalConfig(config);
  };

  const handleComplete = async (data: Record<string, unknown>) => {
    const result = await completeOnboarding(data as Parameters<typeof completeOnboarding>[0]);

    if (!result.success) {
      throw new Error(result.error || "Erreur lors de la sauvegarde");
    }
  };

  // Step 1: Select vertical
  if (!selectedVertical || !verticalConfig) {
    return <VerticalSelector onSelect={handleVerticalSelect} />;
  }

  // Step 2: Complete onboarding wizard
  return (
    <OnboardingWizard
      vertical={verticalConfig}
      tenantId={tenantId}
      onComplete={handleComplete}
    />
  );
}

export default OnboardingFlow;
