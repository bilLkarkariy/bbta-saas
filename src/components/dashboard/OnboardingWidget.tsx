"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Rocket, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OnboardingWidgetProps {
  faqCount?: number;
  whatsappConnected?: boolean;
  hasCampaign?: boolean;
  hasContacts?: boolean;
}

export function OnboardingWidget({
  faqCount = 0,
  whatsappConnected = false,
  hasCampaign = false,
  hasContacts = false,
}: OnboardingWidgetProps) {
  // Initialize state based on props but allow local toggle for demo purposes
  const [steps, setSteps] = useState([
    { id: 'whatsapp', label: "Connecter WhatsApp", done: whatsappConnected, action: "Connecter" },
    { id: 'faq', label: "Ajouter des FAQs", done: faqCount > 0, action: "Ajouter" },
    { id: 'campaign', label: "Creer premiere campagne", done: hasCampaign, action: "Creer" },
    { id: 'contacts', label: "Importer des contacts", done: hasContacts, action: "Importer" },
  ]);

  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  // Simulate completing a step
  const handleAction = (id: string) => {
    setJustCompleted(id);
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: true } : s));

    // Reset animation state after it completes
    setTimeout(() => setJustCompleted(null), 300);
  };

  return (
    <Card className="glass-card flex-1 h-full flex flex-col overflow-hidden border-none">
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-widest uppercase">
            <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
            Bien Demarrer
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/40 rounded-lg text-slate-400" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-3 pt-3">
          <div className="flex-1 h-2.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full shadow-sm transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-600 tabular-nums min-w-[2.5rem] text-right" aria-hidden="true">
            {Math.round(progress)}%
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="animate-accordion-down pt-0 pb-6">
          <ul className="space-y-1" role="list" aria-label="Etapes de configuration">
            {steps.map((step) => (
              <li key={step.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300",
                  "bg-white/30 hover:bg-white hover:shadow-md group/item"
                )}
              >
                <button
                  onClick={() => !step.done && handleAction(step.id)}
                  className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
                  disabled={step.done}
                  aria-label={step.done ? `${step.label} - termine` : `Marquer ${step.label} comme termine`}
                >
                  {step.done ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <CheckCircle
                        className={cn(
                          "h-3.5 w-3.5 text-emerald-500",
                          step.id === justCompleted && "animate-check-pop"
                        )}
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-200 group-hover/item:border-primary/30 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-semibold transition-colors duration-300",
                      step.done ? "line-through text-slate-400 decoration-slate-300" : "text-slate-600"
                    )}
                  >
                    {step.label}
                  </span>

                  {!step.done && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 rounded-lg text-[11px] font-bold text-primary hover:bg-primary hover:text-white group/btn ml-2 transition-all shadow-tactile hover:shadow-lg hover:shadow-primary/20"
                      onClick={() => handleAction(step.id)}
                    >
                      {step.action}
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
