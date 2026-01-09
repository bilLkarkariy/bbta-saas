"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, FileText } from "lucide-react";

interface BookingDetailClientProps {
  bookingId: string;
  initialNotes: string | null;
}

export function BookingDetailClient({
  bookingId,
  initialNotes,
}: BookingDetailClientProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error("Failed to update notes");

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating notes:", error);
      alert("Erreur: Impossible de mettre à jour les notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(initialNotes || "");
    setIsEditing(false);
  };

  return (
    <Card className="glass shadow-layered">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-heading flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-[var(--dashboard-card-padding)]">
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajoutez des notes sur cette réservation..."
              rows={6}
              className="glass"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-body">
            {notes ? (
              <p className="whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-muted-foreground">Aucune note</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
