"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, Upload, MoreHorizontal, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { SearchInput, EmptyState, ConfirmDialog } from "@/components/shared";
import { ContactForm } from "./ContactForm";
import { TagManager } from "./TagManager";
import { ImportDialog } from "./ImportDialog";
import { deleteContact, deleteContacts } from "@/app/(dashboard)/dashboard/contacts/actions";

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

interface ContactsPageProps {
  initialContacts: Contact[];
  tags: Tag[];
  totalCount: number;
}

export function ContactsPage({ initialContacts, tags, totalCount }: ContactsPageProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter contacts locally
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      !search ||
      contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone.includes(search) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.company?.toLowerCase().includes(search.toLowerCase());

    const matchesTag = !selectedTag || contact.tags.some((t) => t.id === selectedTag);

    return matchesSearch && matchesTag;
  });

  const allSelected = filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.has(c.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deletingId) return;

    startTransition(async () => {
      const result = await deleteContact(deletingId);
      if (result.success) {
        setContacts((prev) => prev.filter((c) => c.id !== deletingId));
        toast.success("Contact supprimé");
      } else {
        toast.error(result.error);
      }
      setShowDeleteConfirm(false);
      setDeletingId(null);
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      const result = await deleteContacts(Array.from(selectedIds));
      if (result.success) {
        setContacts((prev) => prev.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        toast.success(`${selectedIds.size} contacts supprimés`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleFormSuccess = (contact: Contact) => {
    if (editingContact) {
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
    } else {
      setContacts((prev) => [contact, ...prev]);
    }
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-label text-primary/80">Gestion d&apos;audience</p>
          <h1 className="text-stat-secondary text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-primary/40" />
            Contacts
          </h1>
          <p className="text-meta">
            {totalCount} contact{totalCount !== 1 ? "s" : ""} au total dans votre base
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowImport(true)}
            className="glass transition-all hover:bg-white/50"
          >
            <Upload className="h-4 w-4 mr-2 text-primary" />
            Importer
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="shadow-layered hover:shadow-layered-lg transition-all duration-300 px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Contact
          </Button>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-4 relative group">
          <SearchInput
            placeholder="Rechercher par nom, email ou mobile..."
            value={search}
            onChange={setSearch}
            className="w-full bg-white/50 border-white/40 focus:bg-white transition-all shadow-sm group-hover:shadow-md h-11"
          />
        </div>

        <div className="lg:col-span-8 flex flex-wrap items-center gap-3 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 px-4 glass border-white/20">
                <Tag className="h-4 w-4 mr-2 text-primary/60" />
                {selectedTag ? tags.find((t) => t.id === selectedTag)?.name : "Tous les segments"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass border-white/20">
              <DropdownMenuItem onClick={() => setSelectedTag(null)}>
                Tous les segments
              </DropdownMenuItem>
              {tags.map((tag) => (
                <DropdownMenuItem key={tag.id} onClick={() => setSelectedTag(tag.id)}>
                  <span
                    className="h-2 w-2 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTagManager(true)}
            className="text-primary hover:text-primary/80 hover:bg-primary/5 h-10 px-4 transition-colors font-medium"
          >
            Paramétrer les tags
          </Button>

          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isPending}
              className="h-10 px-4 shadow-layered animate-scale-in"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      {filteredContacts.length === 0 ? (
        <Card className="glass-card p-12 text-center border-dashed border-2">
          <EmptyState
            icon={Users}
            title="Votre carnet d'adresses est vide"
            description={search || selectedTag ? "Désolé, nous n'avons trouvé aucun contact correspondant à votre recherche." : "Ajoutez manuellement vos contacts ou importez un fichier CSV pour commencer vos campagnes."}
            action={
              !search && !selectedTag
                ? { label: "Créer mon premier contact", onClick: () => setShowForm(true) }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="glass-card border-none ring-1 ring-white/40 overflow-hidden shadow-atmosphere animate-fade-in stagger-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-white/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 py-5 pl-6">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Tout sélectionner" />
                  </TableHead>
                  <TableHead className="font-bold text-slate-800 dark:text-slate-200">Contact</TableHead>
                  <TableHead className="font-bold text-slate-800 dark:text-slate-200">Téléphone</TableHead>
                  <TableHead className="font-bold text-slate-800 dark:text-slate-200 hidden md:table-cell">Entreprise</TableHead>
                  <TableHead className="font-bold text-slate-800 dark:text-slate-200">Tags</TableHead>
                  <TableHead className="w-12 pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="group border-b border-slate-100/50 dark:border-slate-800/10 hover:bg-slate-50/50 dark:hover:bg-slate-800/5 transition-colors"
                  >
                    <TableCell className="pl-6 py-4">
                      <Checkbox
                        checked={selectedIds.has(contact.id)}
                        onCheckedChange={() => toggleOne(contact.id)}
                        aria-label={`Sélectionner ${contact.name || contact.phone}`}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {contact.name || "Contact sans nom"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {contact.email || "Aucun email"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm tracking-tight text-slate-600 dark:text-slate-400 py-4">
                      {contact.phone}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 py-4 hidden md:table-cell">
                      {contact.company ? (
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                          {contact.company}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {contact.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider font-bold h-5 px-2 bg-white/5 border-none shadow-sm"
                            style={{ backgroundColor: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {contact.tags.length === 0 && (
                          <span className="text-xs text-slate-300 italic">Aucun tag</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/80"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingContact(contact);
                              setShowForm(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="h-4 w-4 mr-2 text-primary/60" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer hover:bg-destructive/5"
                            onClick={() => handleDelete(contact.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-white/10 flex justify-between items-center px-8">
            <span className="text-xs text-slate-400">
              Affichage de {filteredContacts.length} sur {totalCount} contacts
            </span>
            {/* Pagination can be added here if needed */}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ContactForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingContact(null);
        }}
        contact={editingContact}
        tags={tags}
        onSuccess={handleFormSuccess}
      />

      <TagManager
        open={showTagManager}
        onOpenChange={setShowTagManager}
        tags={tags}
      />

      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={(count) => {
          toast.success(`${count} contacts importés`);
          // Refresh page to get new data
          window.location.reload();
        }}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer le contact"
        description="Cette action est irréversible. Le contact sera définitivement retiré de votre base de données."
        confirmLabel="Supprimer définitivement"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
