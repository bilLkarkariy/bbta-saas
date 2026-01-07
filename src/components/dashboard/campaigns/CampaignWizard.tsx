"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Check, Users, MessageSquare, Calendar, Send, FileEdit, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppPreview } from "@/components/shared";
import { createCampaign } from "@/app/(dashboard)/dashboard/campaigns/actions";

interface Contact {
  id: string;
  name: string | null;
  phone: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface Segment {
  id: string;
  name: string;
  contactCount: number;
}

interface CampaignWizardProps {
  contacts: Contact[];
  templates: Template[];
  segments: Segment[];
}

type Step = "details" | "audience" | "message" | "schedule" | "review";

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Détails", icon: MessageSquare },
  { id: "audience", label: "Audience", icon: Users },
  { id: "message", label: "Message", icon: MessageSquare },
  { id: "schedule", label: "Planification", icon: Calendar },
  { id: "review", label: "Confirmation", icon: Check },
];

export function CampaignWizard({ contacts, templates, segments }: CampaignWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<Step>("details");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audienceType, setAudienceType] = useState<"all" | "segment" | "manual">("all");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [messageType, setMessageType] = useState<"template" | "custom">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const messageContent = messageType === "template" ? selectedTemplate?.content || "" : customMessage;

  // Get recipient count
  const getRecipientCount = () => {
    if (audienceType === "all") return contacts.length;
    if (audienceType === "segment") {
      const seg = segments.find((s) => s.id === selectedSegmentId);
      return seg?.contactCount || 0;
    }
    return selectedContactIds.size;
  };

  const filteredContacts = contacts.filter(
    (c) =>
      !contactSearch ||
      c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
  );

  const canProceed = () => {
    switch (currentStep) {
      case "details": return name.trim().length > 0;
      case "audience":
        if (audienceType === "segment") return !!selectedSegmentId;
        if (audienceType === "manual") return selectedContactIds.size > 0;
        return true;
      case "message":
        if (messageType === "template") return !!selectedTemplateId;
        return customMessage.trim().length > 0;
      case "schedule":
        if (scheduleType === "later") return !!scheduledAt;
        return true;
      default: return true;
    }
  };

  const handleNext = () => {
    const idx = currentStepIndex;
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id);
  };

  const handleBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) setCurrentStep(steps[idx - 1].id);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (messageType === "template" && selectedTemplateId) {
        formData.append("templateId", selectedTemplateId);
      } else {
        formData.append("customMessage", customMessage);
      }
      if (audienceType === "segment" && selectedSegmentId) {
        formData.append("segmentId", selectedSegmentId);
      } else if (audienceType === "manual") {
        selectedContactIds.forEach((id) => formData.append("contactIds", id));
      } else {
        contacts.forEach((c) => formData.append("contactIds", c.id));
      }
      if (scheduleType === "later" && scheduledAt) {
        formData.append("scheduledAt", scheduledAt);
      }

      const result = await createCampaign(formData);
      if (result.success) {
        toast.success("Campagne créée avec succès !");
        router.push("/dashboard/campaigns");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-1">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-12 w-12 rounded-2xl bg-white/30 border-white/40 hover:bg-white text-slate-500 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Nouvelle campagne</h1>
          <p className="text-slate-500 font-medium">Configurez votre envoi étape par étape</p>
        </div>
      </div>

      {/* Progress Indicators */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1 min-w-[120px]">
            <button
              onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest",
                step.id === currentStep
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                  : idx < currentStepIndex
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-white/30 text-slate-400 border border-white/40"
              )}
              disabled={idx > currentStepIndex}
            >
              <step.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{step.label}</span>
              {idx < currentStepIndex && <Check className="h-3 w-3 ml-1" />}
            </button>
            {idx < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-2 rounded-full", idx < currentStepIndex ? "bg-emerald-400" : "bg-slate-200/50")} />
            )}
          </div>
        ))}
      </nav>

      {/* Main Form Area */}
      <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          <Card className="glass-card p-8 border-none relative overflow-hidden">
            <div className="relative z-10">
              {currentStep === "details" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nom de la campagne</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Promotion de Printemps 2026"
                      className="bg-white/10 border-white/20 focus:bg-white focus:border-primary h-12 rounded-2xl transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Notes & Objectifs</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optionnel : bref résumé pour votre équipe"
                      rows={4}
                      className="bg-white/10 border-white/20 focus:bg-white focus:border-primary rounded-2xl transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              )}

              {currentStep === "audience" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <RadioGroup value={audienceType} onValueChange={(v) => setAudienceType(v as "all" | "segment" | "manual")} className="grid gap-4">
                    <label className={cn(
                      "flex items-start gap-4 p-5 rounded-[24px] border transition-all cursor-pointer",
                      audienceType === "all" ? "bg-white border-white shadow-layered" : "bg-white/10 border-white/20 hover:bg-white/20"
                    )}>
                      <RadioGroupItem value="all" id="all" className="mt-1" />
                      <div className="flex-1">
                        <span className="font-bold text-slate-700 block">Tous les contacts</span>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{contacts.length} destinataires disponibles</p>
                      </div>
                    </label>

                    <div className={cn(
                      "p-5 rounded-[24px] border transition-all",
                      audienceType === "segment" ? "bg-white border-white shadow-layered" : "bg-white/10 border-white/20 hover:bg-white/20"
                    )}>
                      <label className="flex items-start gap-4 cursor-pointer mb-2">
                        <RadioGroupItem value="segment" id="segment" className="mt-1" />
                        <span className="font-bold text-slate-700">Cibler un segment</span>
                      </label>
                      {audienceType === "segment" && segments.length > 0 && (
                        <div className="mt-4 grid gap-2">
                          {segments.map((seg) => (
                            <button
                              key={seg.id}
                              onClick={() => setSelectedSegmentId(seg.id)}
                              className={cn(
                                "flex flex-row items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                selectedSegmentId === seg.id ? "bg-primary/5 border-primary/20 text-primary" : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                              )}
                            >
                              <span>{seg.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/60 text-slate-500 shadow-sm">{seg.contactCount}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={cn(
                      "p-5 rounded-[24px] border transition-all",
                      audienceType === "manual" ? "bg-white border-white shadow-layered" : "bg-white/10 border-white/20 hover:bg-white/20"
                    )}>
                      <label className="flex items-start gap-4 cursor-pointer mb-2">
                        <RadioGroupItem value="manual" id="manual" className="mt-1" />
                        <span className="font-bold text-slate-700">Sélection manuelle</span>
                      </label>
                      {audienceType === "manual" && (
                        <div className="mt-4 space-y-3">
                          <Input
                            placeholder="Chercher par nom ou téléphone..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="bg-slate-50 border-slate-100 rounded-xl"
                          />
                          <ScrollArea className="h-48 rounded-xl border border-slate-100 bg-slate-50/50">
                            <div className="p-2 grid gap-1">
                              {filteredContacts.map((contact) => (
                                <label key={contact.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white transition-all cursor-pointer group">
                                  <Checkbox
                                    checked={selectedContactIds.has(contact.id)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(selectedContactIds);
                                      if (checked) {
                                        newSet.add(contact.id);
                                      } else {
                                        newSet.delete(contact.id);
                                      }
                                      setSelectedContactIds(newSet);
                                    }}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{contact.name || contact.phone}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{contact.phone}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {currentStep === "message" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMessageType("template")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-[20px] border transition-all",
                        messageType === "template" ? "bg-white border-white shadow-layered text-primary" : "bg-white/10 border-white/20 text-slate-400 hover:bg-white/20"
                      )}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs font-black uppercase tracking-wider">Modèle</span>
                    </button>
                    <button
                      onClick={() => setMessageType("custom")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-[20px] border transition-all",
                        messageType === "custom" ? "bg-white border-white shadow-layered text-primary" : "bg-white/10 border-white/20 text-slate-400 hover:bg-white/20"
                      )}
                    >
                      <FileEdit className="h-5 w-5" />
                      <span className="text-xs font-black uppercase tracking-wider">Libre</span>
                    </button>
                  </div>

                  {messageType === "template" ? (
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Charger un modèle</Label>
                      <div className="grid gap-3">
                        {templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => setSelectedTemplateId(tpl.id)}
                            className={cn(
                              "text-left p-4 rounded-2xl border transition-all",
                              selectedTemplateId === tpl.id ? "bg-white border-primary/20 shadow-md scale-[1.01]" : "bg-white/5 shadow-sm hover:bg-white/50 border-white/40"
                            )}
                          >
                            <span className="font-bold text-slate-700 block">{tpl.name}</span>
                            <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">{tpl.content}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Écrire votre message</Label>
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Bonjour {{name}}, ..."
                        rows={8}
                        className="bg-white/10 border-white/20 focus:bg-white focus:border-primary rounded-2xl transition-all font-medium resize-none shadow-inner"
                      />
                      <p className="text-[10px] text-slate-400 italic">Astuce : utilisez <code className="bg-slate-100 px-1 rounded">{"{{name}}"}</code> pour personnaliser le message.</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === "schedule" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <RadioGroup value={scheduleType} onValueChange={(v) => setScheduleType(v as "now" | "later")} className="grid gap-4">
                    <label className={cn(
                      "flex items-start gap-4 p-5 rounded-[24px] border transition-all cursor-pointer",
                      scheduleType === "now" ? "bg-white border-white shadow-layered" : "bg-white/10 border-white/20 hover:bg-white/20"
                    )}>
                      <RadioGroupItem value="now" id="now" className="mt-1" />
                      <div className="flex-1">
                        <span className="font-bold text-slate-700 block">Lancer maintenant</span>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Diffusion immédiate aux contacts sélectionnés</p>
                      </div>
                    </label>

                    <div className={cn(
                      "p-5 rounded-[24px] border transition-all",
                      scheduleType === "later" ? "bg-white border-white shadow-layered" : "bg-white/10 border-white/20 hover:bg-white/20"
                    )}>
                      <label className="flex items-start gap-4 cursor-pointer mb-2">
                        <RadioGroupItem value="later" id="later" className="mt-1" />
                        <span className="font-bold text-slate-700">Planifier au futur</span>
                      </label>
                      {scheduleType === "later" && (
                        <div className="mt-4 pl-8">
                          <Input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="bg-slate-50 border-slate-100 h-11 rounded-xl text-sm font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {currentStep === "review" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-xl font-black tracking-tight text-slate-800 border-b border-white/40 pb-4">Récapitulatif Final</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Nom", value: name },
                      { label: "Audience", value: `${getRecipientCount()} destinataires` },
                      { label: "Format", value: messageType === "template" ? "Modèle" : "Message Libre" },
                      { label: "Départ", value: scheduleType === "now" ? "Immédiat" : "Plus tard" },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/20 p-4 rounded-2xl border border-white/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className="font-bold text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/20 p-5 rounded-3xl border border-white/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Aperçu du texte</p>
                    <p className="text-sm font-medium text-slate-600 italic whitespace-pre-wrap">{messageContent || "Aucun message défini."}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Content actions */}
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/20">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="rounded-xl font-bold text-slate-500 hover:bg-white/60"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              {currentStep === "review" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-12 px-8 rounded-2xl font-bold transition-all active:scale-95"
                >
                  {isPending ? "Création..." : scheduleType === "now" ? "Valider & Envoyer" : "Confirmer la planification"}
                  <Send className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-12 px-8 rounded-2xl font-bold transition-all active:scale-95"
                >
                  Étape suivante
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Preview */}
        <aside className="space-y-6">
          <div className="sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">Live Preview</h3>
            <div className="scale-95 origin-top">
              <WhatsAppPreview
                message={messageContent || "Votre message apparaîtra ici..."}
                variables={{ name: "Marc", date: "Demain", heure: "10h00" }}
              />
            </div>

            <Card className="glass-card mt-6 p-5 border-none">
              <div className="flex items-center gap-3 text-emerald-600 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Conseil IA</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Les messages personnalisés avec <code className="bg-white/40 px-1 rounded">{"{{name}}"}</code> génèrent 40% de réponses en plus.
              </p>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

