"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { SearchInput, EmptyState, ConfirmDialog } from "@/components/shared";
import { TemplateCard } from "./TemplateCard";
import { TemplateForm } from "./TemplateForm";
import {
  deleteTemplate,
  duplicateTemplate,
  toggleTemplateActive,
} from "@/app/(dashboard)/dashboard/templates/actions";

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

interface TemplatesPageProps {
  initialTemplates: Template[];
}

const categories = [
  { value: "all", label: "Toutes" },
  { value: "general", label: "Général" },
  { value: "marketing", label: "Marketing" },
  { value: "utility", label: "Utilitaire" },
  { value: "authentication", label: "Authentification" },
];

export function TemplatesPage({ initialTemplates }: TemplatesPageProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter templates locally
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !search ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.content.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deletingId) return;

    startTransition(async () => {
      const result = await deleteTemplate(deletingId);
      if (result.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== deletingId));
        toast.success("Modèle supprimé");
      } else {
        toast.error(result.error);
      }
      setShowDeleteConfirm(false);
      setDeletingId(null);
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const result = await duplicateTemplate(id);
      if (result.success && result.template) {
        setTemplates((prev) => [result.template as Template, ...prev]);
        toast.success("Modèle dupliqué");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleTemplateActive(id, isActive);
      if (result.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive } : t))
        );
        toast.success(isActive ? "Modèle activé" : "Modèle désactivé");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleFormSuccess = (template: Template) => {
    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
    } else {
      setTemplates((prev) => [template, ...prev]);
    }
    setShowForm(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modèles</h1>
          <p className="text-muted-foreground">
            {templates.length} modèle{templates.length !== 1 ? "s" : ""} de message
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau modèle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Rechercher un modèle..."
          value={search}
          onChange={setSearch}
          className="w-64"
        />
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className="text-xs"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun modèle"
          description={
            search || selectedCategory !== "all"
              ? "Aucun modèle ne correspond à vos critères."
              : "Créez votre premier modèle de message pour gagner du temps."
          }
          action={
            !search && selectedCategory === "all"
              ? { label: "Créer un modèle", onClick: () => setShowForm(true) }
              : undefined
          }
          className="py-16"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => {
                setEditingTemplate(template);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(template.id)}
              onDuplicate={() => handleDuplicate(template.id)}
              onToggleActive={(isActive) => handleToggleActive(template.id, isActive)}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TemplateForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer le modèle"
        description="Cette action est irréversible. Le modèle sera définitivement supprimé."
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
