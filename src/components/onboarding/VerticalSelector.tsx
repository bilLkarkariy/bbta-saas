"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Wrench, ShoppingBag, Building2, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessVertical } from "@/config/verticals/types";

interface VerticalOption {
  id: BusinessVertical;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: string[];
}

const verticalOptions: VerticalOption[] = [
  {
    id: "beaute",
    name: "Beaute & Bien-etre",
    description: "Salons de coiffure, spas, instituts de beaute",
    icon: Scissors,
    color: "#EC4899",
    features: ["Prise de RDV automatique", "Rappels clients", "Gestion d'equipe"],
  },
  {
    id: "services",
    name: "Services & Artisans",
    description: "Plombiers, electriciens, consultants",
    icon: Wrench,
    color: "#F59E0B",
    features: ["Demandes de devis", "Suivi interventions", "Zone de deplacement"],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Boutiques en ligne, vendeurs",
    icon: ShoppingBag,
    color: "#10B981",
    features: ["Suivi de commandes", "Gestion retours", "Sync Shopify"],
  },
  {
    id: "generic",
    name: "Autre activite",
    description: "Configuration personnalisee",
    icon: Building2,
    color: "#6B7280",
    features: ["Configuration flexible", "Templates personnalises", "Support standard"],
  },
];

interface VerticalSelectorProps {
  onSelect: (vertical: BusinessVertical) => void;
}

export function VerticalSelector({ onSelect }: VerticalSelectorProps) {
  const [selected, setSelected] = useState<BusinessVertical | null>(null);

  const handleSelect = (id: BusinessVertical) => {
    setSelected(id);
  };

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Bienvenue sur Lumelia</h1>
          <p className="text-muted-foreground mt-2">
            Quel type d&apos;activite souhaitez-vous automatiser ?
          </p>
        </div>

        {/* Vertical Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {verticalOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <Card
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary"
                )}
                onClick={() => handleSelect(option.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ backgroundColor: `${option.color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: option.color }} />
                    </div>
                    {isSelected && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: option.color }}
                      >
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{option.name}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {option.features.map((feature, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selected}
            className="px-8"
          >
            Continuer
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VerticalSelector;
