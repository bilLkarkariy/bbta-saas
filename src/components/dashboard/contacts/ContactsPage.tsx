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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            {totalCount} contact{totalCount !== 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Rechercher un contact..."
          value={search}
          onChange={setSearch}
          className="w-64"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-2" />
              {selectedTag ? tags.find((t) => t.id === selectedTag)?.name : "Tous les tags"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedTag(null)}>
              Tous les tags
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
        <Button variant="ghost" size="sm" onClick={() => setShowTagManager(true)}>
          Gérer les tags
        </Button>

        {selectedIds.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredContacts.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={Users}
            title="Aucun contact"
            description={search || selectedTag ? "Aucun contact ne correspond à vos critères." : "Commencez par ajouter votre premier contact."}
            action={
              !search && !selectedTag
                ? { label: "Ajouter un contact", onClick: () => setShowForm(true) }
                : undefined
            }
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Tout sélectionner" />
                </TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleOne(contact.id)}
                      aria-label={`Sélectionner ${contact.name || contact.phone}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contact.name || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.company || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {contact.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingContact(contact);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
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
        </Card>
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
        description="Cette action est irréversible. Le contact sera définitivement supprimé."
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
