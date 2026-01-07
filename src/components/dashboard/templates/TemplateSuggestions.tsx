"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Calendar,
  Bell,
  Heart,
  ShoppingBag,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerticalTemplate, TemplateCategory } from "@/config/verticals/types";

interface TemplateSuggestionsProps {
  suggestions: VerticalTemplate[];
  onSelect: (template: VerticalTemplate) => void;
  existingTemplateNames: string[];
  className?: string;
}

const categoryIcons: Record<TemplateCategory, React.ElementType> = {
  greeting: MessageSquare,
  booking: Calendar,
  reminder: Bell,
  followup: Heart,
  promotional: Megaphone,
  quote: MessageSquare,
  order: ShoppingBag,
  payment: ShoppingBag,
  return: ShoppingBag,
  support: MessageSquare,
};

const categoryLabels: Record<TemplateCategory, string> = {
  greeting: "Accueil",
  booking: "Réservation",
  reminder: "Rappel",
  followup: "Suivi",
  promotional: "Promo",
  quote: "Devis",
  order: "Commande",
  payment: "Paiement",
  return: "Retour",
  support: "Support",
};

const categoryColors: Record<TemplateCategory, string> = {
  greeting: "bg-blue-100 text-blue-800",
  booking: "bg-purple-100 text-purple-800",
  reminder: "bg-yellow-100 text-yellow-800",
  followup: "bg-pink-100 text-pink-800",
  promotional: "bg-orange-100 text-orange-800",
  quote: "bg-emerald-100 text-emerald-800",
  order: "bg-green-100 text-green-800",
  payment: "bg-teal-100 text-teal-800",
  return: "bg-red-100 text-red-800",
  support: "bg-slate-100 text-slate-800",
};

export function TemplateSuggestions({
  suggestions,
  onSelect,
  existingTemplateNames,
  className,
}: TemplateSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");

  // Filter out already existing templates
  const availableSuggestions = suggestions.filter(
    (s) => !existingTemplateNames.includes(s.name)
  );

  // Group by category
  const categoryCounts = availableSuggestions.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.keys(categoryCounts) as TemplateCategory[];

  // Filter by selected category
  const filteredSuggestions = selectedCategory === "all"
    ? availableSuggestions
    : availableSuggestions.filter((s) => s.category === selectedCategory);

  if (availableSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border-dashed border-primary/20 bg-primary/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Modèles suggérés</CardTitle>
              <CardDescription className="text-xs">
                {availableSuggestions.length} modèle{availableSuggestions.length > 1 ? "s" : ""} recommandé{availableSuggestions.length > 1 ? "s" : ""} pour votre activité
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Category filter */}
          <div className="flex items-center gap-1 mb-4 flex-wrap">
            <Button
              variant={selectedCategory === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="h-7 text-xs"
            >
              Tous ({availableSuggestions.length})
            </Button>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat];
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="h-7 text-xs gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {categoryLabels[cat]} ({categoryCounts[cat]})
                </Button>
              );
            })}
          </div>

          {/* Suggestions grid */}
          <ScrollArea className="max-h-80">
            <div className="grid gap-2 md:grid-cols-2">
              {filteredSuggestions.map((template) => (
                <SuggestionCard
                  key={template.id}
                  template={template}
                  onSelect={() => onSelect(template)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

interface SuggestionCardProps {
  template: VerticalTemplate;
  onSelect: () => void;
}

function SuggestionCard({ template, onSelect }: SuggestionCardProps) {
  const Icon = categoryIcons[template.category];

  return (
    <div className="group relative p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-xs font-normal", categoryColors[template.category])}>
              <Icon className="h-3 w-3 mr-1" />
              {categoryLabels[template.category]}
            </Badge>
          </div>
          <h4 className="font-medium text-sm truncate">{template.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {template.content.replace(/\{\{(\w+)\}\}/g, "[$1]")}
          </p>
          {template.variables.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {template.variables.slice(0, 3).map((v) => (
                <code key={v} className="text-[10px] px-1 py-0.5 bg-muted rounded">
                  {v}
                </code>
              ))}
              {template.variables.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{template.variables.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onSelect}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
