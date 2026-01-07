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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none glass shadow-atmosphere rounded-[24px]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            Importer des contacts
          </DialogTitle>
          <DialogDescription className="text-slate-500 ml-10">
            Augmentez votre audience en important vos fichiers CSV
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2">
          {step === "upload" && (
            <div className="space-y-6 animate-fade-up">
              <label className="group block relative">
                <div className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-soft">
                  <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="h-8 w-8 text-primary/60" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Cliquez ou glissez votre fichier CSV
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Taille maximale recommandée : 5MB
                  </span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">
                  <AlertCircle className="h-3 w-3" />
                  Guide de formatage
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="font-bold text-slate-600">phone</span> (requis)
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    name (optionnel)
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    email (optionnel)
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    company (optionnel)
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-white/40">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{file?.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {preview.length} CONTACTS DÉTECTÉS
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")} className="h-8 text-xs text-primary hover:bg-primary/5">
                  Changer
                </Button>
              </div>

              {errors.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 animate-pulse-once">
                  <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.length} Avertissement{errors.length > 1 ? "s" : ""}
                  </div>
                  <ul className="text-xs text-slate-500 space-y-1 pl-1">
                    {errors.slice(0, 2).map((err, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mr-0.5">•</span> {err}
                      </li>
                    ))}
                    {errors.length > 2 && <li className="text-slate-400 pl-4">... et {errors.length - 2} autres erreurs mineures.</li>}
                  </ul>
                </div>
              )}

              {preview.length > 0 && (
                <div className="rounded-xl border border-white/20 bg-white/20 dark:bg-slate-900/20 overflow-hidden shadow-sm">
                  <div className="max-h-48 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 dark:bg-slate-800/50 sticky top-0">
                        <tr>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-slate-500 p-3 pl-4">Tel</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-slate-500 p-3">Nom</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-slate-500 p-3 pr-4">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {preview.slice(0, 5).map((contact, i) => (
                          <tr key={i} className="hover:bg-white/20 transition-colors">
                            <td className="p-3 pl-4 font-mono text-xs text-slate-600 dark:text-slate-400">{contact.phone}</td>
                            <td className="p-3 text-xs font-medium text-slate-800 dark:text-slate-200">{contact.name || "—"}</td>
                            <td className="p-3 pr-4 text-xs text-slate-500 truncate">{contact.email || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.length > 5 && (
                    <div className="p-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30 border-t border-white/10">
                      + {preview.length - 5} autres contacts seront importés
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={handleClose} className="px-6 h-11">
                  Annuler
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isPending || preview.length === 0}
                  className="px-8 h-11 shadow-layered hover:shadow-layered-lg transition-all"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Importation...
                    </span>
                  ) : `Confirmer l'importation`}
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-10 animate-scale-in">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 shadow-soft ring-8 ring-emerald-500/5 animate-check-pop">
                <Check className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Importation réussie !</h3>
              <p className="text-sm text-center text-slate-500 max-w-[280px]">
                {preview.length} contacts ont été ajoutés avec succès à votre audience.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
