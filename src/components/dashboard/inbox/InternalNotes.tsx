"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyNote, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

interface InternalNotesProps {
  conversationId: string;
  canAdd?: boolean;
}

export function InternalNotes({ conversationId, canAdd = true }: InternalNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      });

      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setNewNote("");
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-2">
        <StickyNote className="h-3 w-3 text-amber-500" />
        Notes Internes
        {notes.length > 0 && (
          <span className="text-xs text-slate-400 font-normal">
            ({notes.length})
          </span>
        )}
      </p>
        {/* Add note form */}
        {canAdd && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note interne..."
              className="min-h-[80px] resize-none text-sm"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newNote.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Aucune note pour cette conversation
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-amber-50 border border-amber-100 rounded-lg p-3"
              >
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 bg-amber-200">
                    <AvatarFallback className="text-[10px] text-amber-700">
                      {getInitials(note.user.name, note.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-800">
                        {note.user.name || note.user.email.split("@")[0]}
                      </span>
                      <span className="text-[10px] text-amber-600">
                        {formatDistanceToNow(new Date(note.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
