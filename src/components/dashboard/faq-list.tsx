"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, HelpCircle, X, Check } from "lucide-react";
import { createFAQ, updateFAQ, deleteFAQ } from "@/app/(dashboard)/dashboard/faq/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  createdAt: Date;
}

interface FAQListProps {
  faqs: FAQ[];
  tenantId: string;
}

const categories = [
  { value: "general", label: "Général" },
  { value: "horaires", label: "Horaires" },
  { value: "tarifs", label: "Tarifs" },
  { value: "services", label: "Services" },
  { value: "reservation", label: "Réservation" },
];

export function FAQList({ faqs }: FAQListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    const result = await createFAQ(formData);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("FAQ créée avec succès");
      setIsAdding(false);
    }
  }

  async function handleUpdate(id: string, formData: FormData) {
    setIsSubmitting(true);
    const result = await updateFAQ(id, formData);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("FAQ mise à jour");
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette FAQ ?")) return;

    const result = await deleteFAQ(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("FAQ supprimée");
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsAdding(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Ajouter une FAQ
      </button>

      {isAdding && (
        <FAQForm
          onSubmit={handleCreate}
          onCancel={() => setIsAdding(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {faqs.length === 0 && !isAdding ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Aucune FAQ</h3>
          <p className="mt-2 text-gray-500">
            Ajoutez des questions fréquentes pour que l&apos;IA puisse répondre
            automatiquement à vos clients.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {faqs.map((faq) =>
            editingId === faq.id ? (
              <div key={faq.id} className="p-4">
                <FAQForm
                  faq={faq}
                  onSubmit={(formData) => handleUpdate(faq.id, formData)}
                  onCancel={() => setEditingId(null)}
                  isSubmitting={isSubmitting}
                />
              </div>
            ) : (
              <div
                key={faq.id}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {categories.find((c) => c.value === faq.category)?.label ||
                        faq.category}
                    </span>
                  </div>
                  <p className="font-medium">{faq.question}</p>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {faq.answer}
                  </p>
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  <button
                    onClick={() => setEditingId(faq.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function FAQForm({
  faq,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  faq?: FAQ;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  return (
    <form action={onSubmit} className="rounded-lg border bg-white p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Catégorie
        </label>
        <select
          name="category"
          defaultValue={faq?.category || "general"}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question
        </label>
        <input
          type="text"
          name="question"
          defaultValue={faq?.question}
          placeholder="Ex: Quels sont vos horaires d'ouverture ?"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Réponse
        </label>
        <textarea
          name="answer"
          defaultValue={faq?.answer}
          placeholder="Ex: Nous sommes ouverts du lundi au samedi de 9h à 19h."
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition-colors",
            isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
          )}
        >
          <Check className="h-4 w-4" />
          {faq ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}
