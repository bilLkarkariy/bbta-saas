"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, DoorOpen, Wrench } from "lucide-react";
import { ResourceList } from "@/components/dashboard/resources/ResourceList";
import { ResourceForm } from "@/components/dashboard/resources/ResourceForm";
import { Badge } from "@/components/ui/badge";

interface Resource {
  id: string;
  name: string;
  type: "staff" | "room" | "equipment";
  color: string | null;
  isActive: boolean;
  workingHours: any;
  createdAt: Date;
  updatedAt: Date;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);

      const res = await fetch(`/api/resources?${params}`);
      if (!res.ok) throw new Error("Failed to fetch resources");

      const data = await res.json();
      setResources(data.resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleCreateSuccess = () => {
    fetchResources();
    setFormOpen(false);
    setEditingResource(null);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette ressource ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete resource");
      }

      fetchResources();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) throw new Error("Failed to update resource");

      fetchResources();
    } catch (error) {
      console.error("Error toggling resource:", error);
    }
  };

  // Count by type
  const counts = {
    all: resources.length,
    staff: resources.filter((r) => r.type === "staff").length,
    room: resources.filter((r) => r.type === "room").length,
    equipment: resources.filter((r) => r.type === "equipment").length,
  };

  return (
    <div className="w-full max-w-full space-y-[var(--dashboard-section-gap)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ressources
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez votre équipe, salles et équipements
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingResource(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle ressource
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`glass shadow-layered cursor-pointer transition-all hover:shadow-elevated ${
            filterType === "all" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setFilterType("all")}
        >
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toutes</p>
                <p className="text-2xl font-bold">{counts.all}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Total
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`glass shadow-layered cursor-pointer transition-all hover:shadow-elevated ${
            filterType === "staff" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setFilterType("staff")}
        >
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Personnel</p>
                <p className="text-2xl font-bold">{counts.staff}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`glass shadow-layered cursor-pointer transition-all hover:shadow-elevated ${
            filterType === "room" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setFilterType("room")}
        >
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Salles</p>
                <p className="text-2xl font-bold">{counts.room}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DoorOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`glass shadow-layered cursor-pointer transition-all hover:shadow-elevated ${
            filterType === "equipment" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setFilterType("equipment")}
        >
          <CardContent className="p-[var(--dashboard-card-padding)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Équipements</p>
                <p className="text-2xl font-bold">{counts.equipment}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource List */}
      <ResourceList
        resources={resources}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {/* Resource Form Dialog */}
      <ResourceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={editingResource}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
