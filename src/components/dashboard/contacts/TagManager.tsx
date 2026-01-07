"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createTag, deleteTag } from "@/app/(dashboard)/dashboard/contacts/actions";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
}

const colors = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export function TagManager({ open, onOpenChange, tags }: TagManagerProps) {
  const [localTags, setLocalTags] = useState(tags);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(colors[0]);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!newName.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("color", newColor);

      const result = await createTag(formData);

      if (result.success && result.tag) {
        setLocalTags((prev) => [...prev, result.tag!]);
        setNewName("");
        setNewColor(colors[Math.floor(Math.random() * colors.length)]);
        toast.success("Tag créé");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTag(id);

      if (result.success) {
        setLocalTags((prev) => prev.filter((t) => t.id !== id));
        toast.success("Tag supprimé");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new tag */}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="tagName">Nouveau tag</Label>
              <Input
                id="tagName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="VIP, Prospect..."
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-md transition-all ${
                      newColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                    aria-label={`Couleur ${color}`}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={isPending || !newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Existing tags */}
          <div className="space-y-2">
            <Label>Tags existants</Label>
            {localTags.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun tag créé
              </p>
            ) : (
              <div className="space-y-2">
                {localTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <Badge
                      variant="outline"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(tag.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
