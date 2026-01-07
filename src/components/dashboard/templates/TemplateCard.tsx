"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Copy, Trash2, MessageSquare } from "lucide-react";
import { StatusBadge } from "@/components/shared";

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  whatsappStatus: string;
  isActive: boolean;
  usageCount: number;
}

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleActive: (isActive: boolean) => void;
  disabled?: boolean;
}

const categoryLabels: Record<string, string> = {
  general: "Général",
  marketing: "Marketing",
  utility: "Utilitaire",
  authentication: "Authentification",
};

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  disabled,
}: TemplateCardProps) {
  // Truncate content for preview
  const previewContent =
    template.content.length > 120
      ? template.content.substring(0, 120) + "..."
      : template.content;


  return (
    <Card className="p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{template.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[template.category] || template.category}
            </Badge>
            {template.whatsappStatus !== "draft" && (
              <StatusBadge status={template.whatsappStatus} />
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={disabled}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content preview - safe rendering without dangerouslySetInnerHTML */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {previewContent.split(/(\{\{\w+\}\})/).map((part, i) =>
          part.match(/^\{\{\w+\}\}$/) ? (
            <span key={i} className="text-primary font-medium">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {template.variables.map((variable) => (
            <span
              key={variable}
              className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
            >
              {variable}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span>{template.usageCount} utilisation{template.usageCount !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {template.isActive ? "Actif" : "Inactif"}
          </span>
          <Switch
            checked={template.isActive}
            onCheckedChange={onToggleActive}
            disabled={disabled}
            aria-label={template.isActive ? "Désactiver le modèle" : "Activer le modèle"}
          />
        </div>
      </div>
    </Card>
  );
}
