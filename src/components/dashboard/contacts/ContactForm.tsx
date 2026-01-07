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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le contact" : "Nouveau contact"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33612345678"
              {...register("phone", {
                required: "Numéro requis",
                pattern: {
                  value: /^\+?[1-9]\d{6,14}$/,
                  message: "Format invalide (ex: +33612345678)"
                }
              })}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" placeholder="Jean Dupont" {...register("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jean@exemple.fr"
              {...register("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <Input id="company" placeholder="Acme Inc." {...register("company")} />
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTags?.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <Badge
                      variant="outline"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  </label>
                ))}
              </div>
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
