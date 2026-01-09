"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilityList } from "@/components/dashboard/availability/AvailabilityList";
import { AvailabilityForm } from "@/components/dashboard/availability/AvailabilityForm";
import { BlockedSlotsList } from "@/components/dashboard/availability/BlockedSlotsList";
import { BlockedSlotForm } from "@/components/dashboard/availability/BlockedSlotForm";

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  resourceId: string | null;
  isActive: boolean;
  resource?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  resourceId: string | null;
  resource?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export default function AvailabilitySettingsPage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFormOpen, setAvailabilityFormOpen] = useState(false);
  const [blockedSlotFormOpen, setBlockedSlotFormOpen] = useState(false);

  const fetchAvailabilities = useCallback(async () => {
    try {
      const res = await fetch("/api/availability");
      if (!res.ok) throw new Error("Failed to fetch availabilities");
      const data = await res.json();
      setAvailabilities(data.availabilities);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
    }
  }, []);

  const fetchBlockedSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/blocked-slots");
      if (!res.ok) throw new Error("Failed to fetch blocked slots");
      const data = await res.json();
      setBlockedSlots(data.blockedSlots);
    } catch (error) {
      console.error("Error fetching blocked slots:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAvailabilities(), fetchBlockedSlots()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchAvailabilities, fetchBlockedSlots]);

  const handleAvailabilityDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette règle ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/availability/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete availability");

      fetchAvailabilities();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAvailabilityToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/availability/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) throw new Error("Failed to update availability");

      fetchAvailabilities();
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  const handleBlockedSlotDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce créneau bloqué ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/blocked-slots/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete blocked slot");

      fetchBlockedSlots();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="w-full max-w-full space-y-[var(--dashboard-section-gap)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Disponibilités
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez vos horaires d'ouverture et créneaux bloqués
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="working-hours" className="w-full">
        <TabsList>
          <TabsTrigger value="working-hours">Horaires d'ouverture</TabsTrigger>
          <TabsTrigger value="blocked-slots">Créneaux bloqués</TabsTrigger>
        </TabsList>

        {/* Working Hours Tab */}
        <TabsContent value="working-hours" className="space-y-4">
          <Card className="glass shadow-layered">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading">Horaires par jour</CardTitle>
                <Button
                  onClick={() => setAvailabilityFormOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un horaire
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AvailabilityList
                availabilities={availabilities}
                loading={loading}
                onDelete={handleAvailabilityDelete}
                onToggle={handleAvailabilityToggle}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked Slots Tab */}
        <TabsContent value="blocked-slots" className="space-y-4">
          <Card className="glass shadow-layered">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading">Créneaux bloqués</CardTitle>
                <Button
                  onClick={() => setBlockedSlotFormOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Bloquer un créneau
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <BlockedSlotsList
                blockedSlots={blockedSlots}
                loading={loading}
                onDelete={handleBlockedSlotDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <AvailabilityForm
        open={availabilityFormOpen}
        onOpenChange={setAvailabilityFormOpen}
        onSuccess={() => {
          fetchAvailabilities();
          setAvailabilityFormOpen(false);
        }}
      />

      <BlockedSlotForm
        open={blockedSlotFormOpen}
        onOpenChange={setBlockedSlotFormOpen}
        onSuccess={() => {
          fetchBlockedSlots();
          setBlockedSlotFormOpen(false);
        }}
      />
    </div>
  );
}
