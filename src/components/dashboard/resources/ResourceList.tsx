"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ToggleLeft, ToggleRight, Users, DoorOpen, Wrench } from "lucide-react";

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

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const typeConfig = {
  staff: { icon: Users, label: "Personnel", color: "text-blue-600 bg-blue-500/10" },
  room: { icon: DoorOpen, label: "Salle", color: "text-green-600 bg-green-500/10" },
  equipment: { icon: Wrench, label: "Équipement", color: "text-purple-600 bg-purple-500/10" },
};

export function ResourceList({
  resources,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: ResourceListProps) {
  if (loading) {
    return (
      <Card className="glass shadow-layered">
        <CardContent className="p-[var(--dashboard-card-padding)]">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des ressources...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resources.length === 0) {
    return (
      <Card className="glass shadow-layered">
        <CardContent className="p-[var(--dashboard-card-padding)]">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune ressource trouvée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass shadow-layered overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-label">Nom</TableHead>
                <TableHead className="text-label">Type</TableHead>
                <TableHead className="text-label">Couleur</TableHead>
                <TableHead className="text-label">Statut</TableHead>
                <TableHead className="text-label text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => {
                const TypeIcon = typeConfig[resource.type].icon;
                return (
                  <TableRow
                    key={resource.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <Badge className={typeConfig[resource.type].color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeConfig[resource.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resource.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: resource.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {resource.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {resource.isActive ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted/50">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onToggleActive(resource.id, resource.isActive)}
                          title={resource.isActive ? "Désactiver" : "Activer"}
                        >
                          {resource.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(resource)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
