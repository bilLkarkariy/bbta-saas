"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { WhatsAppPreview } from "@/components/shared";
import { createTemplate, updateTemplate } from "@/app/(dashboard)/dashboard/templates/actions";

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  whatsappStatus: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSuccess: (template: Template) => void;
}

const categories = [
  { value: "general", label: "Général" },
  { value: "marketing", label: "Marketing" },
  { value: "utility", label: "Utilitaire" },
  { value: "authentication", label: "Authentification" },
];

// Sample values for preview
const sampleVariables: Record<string, string> = {
  name: "Jean",
  prenom: "Jean",
  nom: "Dupont",
  email: "jean@exemple.fr",
  company: "Acme Inc.",
  entreprise: "Acme Inc.",
  date: "15 janvier 2026",
  heure: "14h30",
  time: "14:30",
  montant: "150€",
  service: "Coupe & Couleur",
};

export function TemplateForm({ open, onOpenChange, template, onSuccess }: TemplateFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!template;

  const [name, setName] = useState(template?.name || "");
  const [content, setContent] = useState(template?.content || "");
  const [category, setCategory] = useState(template?.category || "general");

  // Extract variables from content
  const variables = useMemo(() => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
  }, [content]);

  // Reset form when dialog opens with different template
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(template?.name || "");
      setContent(template?.content || "");
      setCategory(template?.category || "general");
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !content.trim()) {
      toast.error("Nom et contenu requis");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("content", content);
      formData.append("category", category);

      const result = isEditing
        ? await updateTemplate(template.id, formData)
        : await createTemplate(formData);

      if (result.success && result.template) {
        toast.success(isEditing ? "Modèle modifié" : "Modèle créé");
        onSuccess(result.template as Template);
        setName("");
        setContent("");
        setCategory("general");
      } else {
        toast.error(result.error);
      }
    });
  };

  const insertVariable = (varName: string) => {
    const insertion = `{{${varName}}}`;
    setContent((prev) => prev + insertion);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le modèle" : "Nouveau modèle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du modèle *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Confirmation de rendez-vous"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bonjour {{name}}, votre rendez-vous est confirmé pour le {{date}} à {{heure}}."
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Utilisez {"{{variable}}"} pour insérer des variables dynamiques
            </p>
          </div>

          {/* Quick variable insertion */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Variables courantes</Label>
            <div className="flex flex-wrap gap-1">
              {["name", "prenom", "date", "heure", "service", "montant"].map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 font-mono"
                  onClick={() => insertVariable(v)}
                >
                  {`{{${v}}}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Detected variables */}
          {variables.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Variables détectées</Label>
              <div className="flex flex-wrap gap-1">
                {variables.map((v) => (
                  <span
                    key={v}
                    className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-mono"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {content && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Aperçu WhatsApp</Label>
              <WhatsAppPreview message={content} variables={sampleVariables} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "..." : isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
