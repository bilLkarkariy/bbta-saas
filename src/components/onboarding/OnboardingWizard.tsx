"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Scissors,
  Wrench,
  ShoppingBag,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerticalConfig, OnboardingStep, BusinessVertical } from "@/config/verticals/types";

interface OnboardingWizardProps {
  vertical: VerticalConfig;
  tenantId: string;
  onComplete: (data: Record<string, unknown>) => Promise<void>;
}

const verticalIcons: Record<BusinessVertical, React.ElementType> = {
  beaute: Scissors,
  services: Wrench,
  ecommerce: ShoppingBag,
  generic: Building2,
};

export function OnboardingWizard({ vertical, onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = vertical.onboarding;
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;
  const VerticalIcon = verticalIcons[vertical.id] || Building2;

  const updateFormData = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleListItem = useCallback((stepId: string, value: string) => {
    setSelectedItems((prev) => {
      const current = prev[stepId] || [];
      if (current.includes(value)) {
        return { ...prev, [stepId]: current.filter((v) => v !== value) };
      }
      return { ...prev, [stepId]: [...current, value] };
    });
  }, []);

  const canProceed = useCallback(() => {
    if (!currentStep) return false;

    if (currentStep.type === "form" && currentStep.fields) {
      return currentStep.fields
        .filter((f) => f.required)
        .every((f) => {
          const value = formData[f.key];
          return value !== undefined && value !== "";
        });
    }

    if (currentStep.type === "list") {
      const selected = selectedItems[currentStep.id] || [];
      return selected.length > 0;
    }

    // connect and import types can always proceed
    return true;
  }, [currentStep, formData, selectedItems]);

  const handleNext = async () => {
    if (isLastStep) {
      setIsSubmitting(true);
      setError(null);

      try {
        // Merge form data with selected items
        const allData = {
          ...formData,
          selections: selectedItems,
          verticalId: vertical.id,
          completedAt: new Date().toISOString(),
        };

        await onComplete(allData);
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setIsSubmitting(false);
      }
    } else {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  const handleSkip = () => {
    if (!isLastStep) {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const renderFormField = (field: NonNullable<OnboardingStep["fields"]>[number]) => {
    const value = (formData[field.key] as string) || "";

    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.key}
            value={value}
            onChange={(e) => updateFormData(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.key}
            value={value}
            onChange={(e) => updateFormData(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={(v) => updateFormData(field.key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Sélectionner..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "time":
        return (
          <Input
            id={field.key}
            type="text"
            value={value}
            onChange={(e) => updateFormData(field.key, e.target.value)}
            placeholder={field.placeholder || "9h - 18h"}
          />
        );

      default:
        return (
          <Input
            id={field.key}
            value={value}
            onChange={(e) => updateFormData(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    switch (currentStep.type) {
      case "form":
        return (
          <div className="space-y-4">
            {currentStep.fields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderFormField(field)}
              </div>
            ))}
          </div>
        );

      case "list":
        const selected = selectedItems[currentStep.id] || [];
        return (
          <div className="space-y-3">
            {currentStep.prefilledOptions?.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selected.includes(option.value)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                )}
                onClick={() => toggleListItem(currentStep.id, option.value)}
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleListItem(currentStep.id, option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
          </div>
        );

      case "connect":
        return (
          <div className="space-y-4">
            <div className="p-6 rounded-lg border-2 border-dashed text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium">Connexion WhatsApp</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous pourrez connecter votre numéro WhatsApp Business depuis les paramètres
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Cette étape peut être complétée plus tard depuis le dashboard
            </p>
          </div>
        );

      case "import":
        return (
          <div className="space-y-4">
            <div className="p-6 rounded-lg border-2 border-dashed text-center">
              <p className="font-medium">Importer des données</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous pourrez importer vos données existantes depuis les paramètres
              </p>
              <Button variant="outline" className="mt-4" disabled>
                Choisir un fichier
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Cette étape peut être complétée plus tard depuis le dashboard
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${vertical.branding.accentColor}20` }}
          >
            <VerticalIcon
              className="h-8 w-8"
              style={{ color: vertical.branding.accentColor }}
            />
          </div>
          <h1 className="text-2xl font-bold">{vertical.name}</h1>
          <p className="text-muted-foreground mt-1">{vertical.branding.tagline}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>
              Étape {currentStepIndex + 1} sur {steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentStep?.title}</CardTitle>
            <CardDescription>{currentStep?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="flex gap-2">
            {!isLastStep && currentStep?.type !== "form" && (
              <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                Passer
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              style={
                canProceed()
                  ? { backgroundColor: vertical.branding.accentColor }
                  : undefined
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isLastStep ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {isLastStep ? "Terminer" : "Suivant"}
            </Button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 mt-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentStepIndex
                  ? "bg-primary"
                  : index < currentStepIndex
                    ? "bg-primary/60"
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
