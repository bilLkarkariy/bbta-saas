"use client";

import { useState, useCallback, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { importContacts } from "@/app/(dashboard)/dashboard/contacts/actions";
import { toast } from "sonner";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (count: number) => void;
}

interface ParsedContact {
  phone: string;
  name?: string;
  email?: string;
  company?: string;
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedContact[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  const parseCSV = useCallback((text: string): { contacts: ParsedContact[]; errors: string[] } => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      return { contacts: [], errors: ["Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données"] };
    }

    const header = lines[0].toLowerCase().split(/[,;]/);
    const phoneIdx = header.findIndex((h) => h.includes("phone") || h.includes("tel") || h.includes("mobile"));
    const nameIdx = header.findIndex((h) => h.includes("name") || h.includes("nom"));
    const emailIdx = header.findIndex((h) => h.includes("email") || h.includes("mail"));
    const companyIdx = header.findIndex((h) => h.includes("company") || h.includes("entreprise") || h.includes("societe"));

    if (phoneIdx === -1) {
      return { contacts: [], errors: ["Colonne 'phone' ou 'tel' requise"] };
    }

    const contacts: ParsedContact[] = [];
    const parseErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/);
      const phone = values[phoneIdx]?.trim().replace(/[^0-9+]/g, "");

      if (!phone) {
        parseErrors.push(`Ligne ${i + 1}: numéro de téléphone manquant`);
        continue;
      }

      contacts.push({
        phone,
        name: nameIdx >= 0 ? values[nameIdx]?.trim() : undefined,
        email: emailIdx >= 0 ? values[emailIdx]?.trim() : undefined,
        company: companyIdx >= 0 ? values[companyIdx]?.trim() : undefined,
      });
    }

    return { contacts, errors: parseErrors };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { contacts, errors } = parseCSV(text);
      setPreview(contacts);
      setErrors(errors);
      setStep("preview");
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (preview.length === 0) return;

    startTransition(async () => {
      const result = await importContacts(preview);

      if (result.success) {
        setStep("done");
        setTimeout(() => {
          onSuccess(result.created || 0);
          handleClose();
        }, 1500);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setStep("upload");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des contacts</DialogTitle>
          <DialogDescription>
            Importez vos contacts depuis un fichier CSV
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Glissez un fichier CSV ou cliquez pour sélectionner
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Format attendu (colonnes):</p>
              <p>phone (requis), name, email, company</p>
              <p>Séparateur: virgule ou point-virgule</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span className="font-medium">{file?.name}</span>
              <span className="text-muted-foreground">
                ({preview.length} contacts détectés)
              </span>
            </div>

            {errors.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mb-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.length} avertissement{errors.length > 1 ? "s" : ""}
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {errors.length > 3 && <li>... et {errors.length - 3} autres</li>}
                </ul>
              </div>
            )}

            {preview.length > 0 && (
              <div className="max-h-48 overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Téléphone</th>
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((contact, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono text-xs">{contact.phone}</td>
                        <td className="p-2">{contact.name || "—"}</td>
                        <td className="p-2 text-muted-foreground">{contact.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="p-2 text-center text-xs text-muted-foreground border-t">
                    ... et {preview.length - 10} autres contacts
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleImport} disabled={isPending || preview.length === 0}>
                {isPending ? "Import en cours..." : `Importer ${preview.length} contacts`}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-lg font-medium">Import terminé</p>
            <p className="text-sm text-muted-foreground">
              {preview.length} contacts ont été importés avec succès
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
