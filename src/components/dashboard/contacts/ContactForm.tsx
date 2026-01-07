"use client";

import { useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { createContact, updateContact } from "@/app/(dashboard)/dashboard/contacts/actions";

interface Contact {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  createdAt: Date;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  tags: Tag[];
  onSuccess: (contact: Contact) => void;
}

interface FormData {
  phone: string;
  name: string;
  email: string;
  company: string;
  tags: string[];
}

export function ContactForm({ open, onOpenChange, contact, tags, onSuccess }: ContactFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!contact;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      phone: contact?.phone || "",
      name: contact?.name || "",
      email: contact?.email || "",
      company: contact?.company || "",
      tags: contact?.tags.map((t) => t.id) || [],
    },
  });

  const selectedTags = watch("tags");

  // Reset form when contact changes (switching between edit targets)
  useEffect(() => {
    reset({
      phone: contact?.phone || "",
      name: contact?.name || "",
      email: contact?.email || "",
      company: contact?.company || "",
      tags: contact?.tags.map((t) => t.id) || [],
    });
  }, [contact, reset]);

  const toggleTag = (tagId: string) => {
    const current = selectedTags || [];
    if (current.includes(tagId)) {
      setValue("tags", current.filter((id) => id !== tagId));
    } else {
      setValue("tags", [...current, tagId]);
    }
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("phone", data.phone);
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("company", data.company);
      data.tags.forEach((tagId) => formData.append("tags", tagId));

      const result = isEditing
        ? await updateContact(contact.id, formData)
        : await createContact(formData);

      if (result.success) {
        toast.success(isEditing ? "Contact modifié" : "Contact créé");
        onSuccess({
          id: contact?.id || "new",
          phone: data.phone,
          name: data.name || null,
          email: data.email || null,
          company: data.company || null,
          tags: tags.filter((t) => data.tags.includes(t.id)),
          createdAt: contact?.createdAt || new Date(),
        });
        reset();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none glass shadow-atmosphere rounded-[24px]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEditing ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
            </div>
            {isEditing ? "Modifier le contact" : "Nouveau contact"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/40 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Téléphone <span className="text-primary">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  className="bg-white/60 dark:bg-slate-900/60 border-white/20 focus:border-primary/50 transition-all h-11"
                  {...register("phone", {
                    required: "Numéro requis",
                    pattern: {
                      value: /^\+?[1-9]\d{6,14}$/,
                      message: "Format invalide (ex: +33612345678)"
                    }
                  })}
                />
                {errors.phone && (
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-tight ml-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nom complet</Label>
                <Input id="name" placeholder="ex: Jean Dupont" className="bg-white/60 dark:bg-slate-900/60 border-white/20 h-11" {...register("name")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ex: jean@entreprise.fr"
                className="bg-white/60 dark:bg-slate-900/60 border-white/20 h-11"
                {...register("email")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Entreprise</Label>
              <Input id="company" placeholder="ex: Lumelia Inc." className="bg-white/60 dark:bg-slate-900/60 border-white/20 h-11" {...register("company")} />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Assigner des tags</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-white/10 max-h-32 overflow-y-auto scrollbar-thin">
                {tags.map((tag) => {
                  const isSelected = selectedTags?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isSelected
                          ? 'shadow-sm ring-1 ring-inset translate-y-[1px]'
                          : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent'}
                      `}
                      style={{
                        borderColor: isSelected ? tag.color : 'transparent',
                        backgroundColor: isSelected ? `${tag.color}15` : undefined,
                        color: isSelected ? tag.color : undefined
                      }}
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="px-6 h-11 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-8 h-11 shadow-layered hover:shadow-layered-lg transition-all"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Patience...
                </span>
              ) : isEditing ? "Enregistrer les modifications" : "Créer le contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
