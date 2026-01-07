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
import { Plus, Trash2, Tag } from "lucide-react";
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none glass shadow-atmosphere rounded-[24px]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            Gérer les segments
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          {/* Create new tag section */}
          <div className="space-y-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/40 shadow-sm animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="tagName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nom du nouveau segment</Label>
              <div className="flex gap-2">
                <Input
                  id="tagName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Clients VIP, Prospect..."
                  className="bg-white/60 dark:bg-slate-900/60 border-white/20 h-10 flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Button
                  onClick={handleCreate}
                  disabled={isPending || !newName.trim()}
                  className="h-10 px-4 shadow-layered"
                >
                  {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Choix de la couleur</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-full transition-all duration-300 transform hover:scale-110 ${newColor === color ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md" : "opacity-80 hover:opacity-100"
                      }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                    aria-label={`Couleur ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Existing tags section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1 leading-none">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Segments existants</Label>
              <span className="text-[10px] font-bold text-slate-400">{localTags.length} AU TOTAL</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
              {localTags.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">
                    Aucun segment n&apos;a été créé pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {localTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 group hover:shadow-sm transition-all animate-scale-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{tag.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all duration-200"
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

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="glass px-8 h-10 border-white/40 hover:bg-white/60"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
