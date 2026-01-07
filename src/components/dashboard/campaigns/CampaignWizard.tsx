"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Check, Users, MessageSquare, Calendar, Send } from "lucide-react";
import { toast } from "sonner";
import { SearchInput, WhatsAppPreview } from "@/components/shared";
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

  // Filter contacts for manual selection
  const filteredContacts = contacts.filter(
    (c) =>
      !contactSearch ||
      c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
  );

  const canProceed = () => {
    switch (currentStep) {
      case "details":
        return name.trim().length > 0;
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
      default:
        return true;
    }
  };

  const handleNext = () => {
    const idx = currentStepIndex;
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1].id);
    }
  };

  const handleBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(steps[idx - 1].id);
    }
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
        // All contacts
        contacts.forEach((c) => formData.append("contactIds", c.id));
      }

      if (scheduleType === "later" && scheduledAt) {
        formData.append("scheduledAt", scheduledAt);
      }

      const result = await createCampaign(formData);

      if (result.success) {
        toast.success("Campagne créée");
        router.push("/dashboard/campaigns");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle campagne</h1>
          <p className="text-muted-foreground">
            Étape {currentStepIndex + 1} sur {steps.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                step.id === currentStep
                  ? "bg-primary text-primary-foreground"
                  : idx < currentStepIndex
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
              disabled={idx > currentStepIndex}
            >
              <step.icon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${idx < currentStepIndex ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="p-6">
        {currentStep === "details" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la campagne *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Promotion janvier 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objectif et notes sur cette campagne..."
                rows={3}
              />
            </div>
          </div>
        )}

        {currentStep === "audience" && (
          <div className="space-y-4">
            <RadioGroup value={audienceType} onValueChange={(v) => setAudienceType(v as typeof audienceType)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex-1 cursor-pointer">
                  <span className="font-medium">Tous les contacts</span>
                  <p className="text-sm text-muted-foreground">{contacts.length} contacts</p>
                </Label>
              </div>

              {segments.length > 0 && (
                <div className="p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="segment" id="segment" />
                    <Label htmlFor="segment" className="font-medium cursor-pointer">Segment</Label>
                  </div>
                  {audienceType === "segment" && (
                    <div className="mt-3 pl-6 space-y-2">
                      {segments.map((seg) => (
                        <button
                          key={seg.id}
                          onClick={() => setSelectedSegmentId(seg.id)}
                          className={`w-full text-left p-2 rounded border ${
                            selectedSegmentId === seg.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <span className="font-medium">{seg.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({seg.contactCount})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 rounded-lg border hover:bg-muted/50">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-medium cursor-pointer">Sélection manuelle</Label>
                </div>
                {audienceType === "manual" && (
                  <div className="mt-3 pl-6 space-y-2">
                    <SearchInput
                      placeholder="Rechercher..."
                      value={contactSearch}
                      onChange={setContactSearch}
                      className="mb-2"
                    />
                    <ScrollArea className="h-48 border rounded">
                      <div className="p-2 space-y-1">
                        {filteredContacts.map((contact) => (
                          <label
                            key={contact.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          >
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
                            <span className="font-medium">{contact.name || contact.phone}</span>
                            <span className="text-sm text-muted-foreground">{contact.phone}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                    <p className="text-sm text-muted-foreground">
                      {selectedContactIds.size} contact{selectedContactIds.size !== 1 ? "s" : ""} sélectionné{selectedContactIds.size !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>
        )}

        {currentStep === "message" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <RadioGroup value={messageType} onValueChange={(v) => setMessageType(v as typeof messageType)}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="template" id="template" />
                  <Label htmlFor="template" className="font-medium cursor-pointer">Utiliser un modèle</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="font-medium cursor-pointer">Message personnalisé</Label>
                </div>
              </RadioGroup>

              {messageType === "template" && (
                <div className="space-y-2">
                  <Label>Sélectionner un modèle</Label>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`w-full text-left p-3 rounded border ${
                          selectedTemplateId === tpl.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="font-medium">{tpl.name}</span>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{tpl.content}</p>
                      </button>
                    ))}
                    {templates.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">Aucun modèle disponible</p>
                    )}
                  </div>
                </div>
              )}

              {messageType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customMessage">Message</Label>
                  <Textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Bonjour {{name}}, ..."
                    rows={6}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Aperçu</Label>
              <WhatsAppPreview
                message={messageContent || "Votre message apparaîtra ici..."}
                variables={{ name: "Jean", date: "15 janvier", heure: "14h30" }}
              />
            </div>
          </div>
        )}

        {currentStep === "schedule" && (
          <div className="space-y-4">
            <RadioGroup value={scheduleType} onValueChange={(v) => setScheduleType(v as typeof scheduleType)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="flex-1 cursor-pointer">
                  <span className="font-medium">Envoyer maintenant</span>
                  <p className="text-sm text-muted-foreground">La campagne sera envoyée dès sa création</p>
                </Label>
              </div>
              <div className="p-3 rounded-lg border hover:bg-muted/50">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="later" id="later" />
                  <Label htmlFor="later" className="font-medium cursor-pointer">Planifier pour plus tard</Label>
                </div>
                {scheduleType === "later" && (
                  <div className="mt-3 pl-6">
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>
        )}

        {currentStep === "review" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Récapitulatif</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{name}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Destinataires</p>
                <p className="font-medium">{getRecipientCount()} contact{getRecipientCount() !== 1 ? "s" : ""}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="font-medium">
                  {messageType === "template" ? selectedTemplate?.name : "Message personnalisé"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Envoi</p>
                <p className="font-medium">
                  {scheduleType === "now" ? "Immédiat" : `Planifié: ${new Date(scheduledAt).toLocaleString("fr-FR")}`}
                </p>
              </div>
            </div>

            <WhatsAppPreview
              message={messageContent}
              variables={{ name: "Jean", date: "15 janvier", heure: "14h30" }}
            />
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStepIndex === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {currentStep === "review" ? (
          <Button onClick={handleSubmit} disabled={isPending}>
            <Send className="h-4 w-4 mr-2" />
            {isPending ? "Création..." : scheduleType === "now" ? "Créer et envoyer" : "Planifier"}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Continuer
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
