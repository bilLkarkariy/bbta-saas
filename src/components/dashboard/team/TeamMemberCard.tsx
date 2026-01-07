"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Shield,
  User,
  Eye,
  Crown,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "OWNER" | "ADMIN" | "AGENT" | "VIEWER";

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isAvailable: boolean;
  maxConversations: number;
  _count?: {
    assignedConversations: number;
  };
}

interface TeamMemberCardProps {
  member: TeamMember;
  currentUserRole: UserRole;
  currentUserId: string;
  onUpdateRole: (memberId: string, role: UserRole) => Promise<void>;
  onUpdateAvailability: (memberId: string, isAvailable: boolean) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}

const roleConfig: Record<
  UserRole,
  { label: string; icon: typeof User; color: string }
> = {
  OWNER: {
    label: "Proprietaire",
    icon: Crown,
    color: "bg-amber-100 text-amber-700",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    color: "bg-purple-100 text-purple-700",
  },
  AGENT: {
    label: "Agent",
    icon: User,
    color: "bg-blue-100 text-blue-700",
  },
  VIEWER: {
    label: "Lecteur",
    icon: Eye,
    color: "bg-gray-100 text-gray-700",
  },
};

export function TeamMemberCard({
  member,
  currentUserRole,
  currentUserId,
  onUpdateRole,
  onUpdateAvailability,
  onRemove,
}: TeamMemberCardProps) {
  const [loading, setLoading] = useState(false);
  const isSelf = member.id === currentUserId;
  const isOwner = currentUserRole === "OWNER";
  const canManage = isOwner && !isSelf && member.role !== "OWNER";
  const canUpdateAvailability = isSelf || isOwner || currentUserRole === "ADMIN";

  const role = roleConfig[member.role];
  const RoleIcon = role.icon;

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

  const handleAvailabilityChange = async (checked: boolean) => {
    setLoading(true);
    try {
      await onUpdateAvailability(member.id, checked);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setLoading(true);
    try {
      await onUpdateRole(member.id, newRole);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Supprimer ${member.name || member.email} de l'equipe ?`)) {
      return;
    }
    setLoading(true);
    try {
      await onRemove(member.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "p-4 transition-all",
        loading && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/40">
          <AvatarFallback className="text-primary font-semibold">
            {getInitials(member.name, member.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">
              {member.name || member.email}
            </h3>
            {isSelf && (
              <Badge variant="outline" className="text-[10px]">
                Vous
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{member.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn("text-xs", role.color)}>
              <RoleIcon className="h-3 w-3 mr-1" />
              {role.label}
            </Badge>
            {member._count && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {member._count.assignedConversations} conv.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {member.role !== "OWNER" && member.role !== "VIEWER" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Disponible</span>
              <Switch
                checked={member.isAvailable}
                onCheckedChange={handleAvailabilityChange}
                disabled={!canUpdateAvailability || loading}
              />
            </div>
          )}

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange("ADMIN")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Definir comme Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("AGENT")}>
                  <User className="h-4 w-4 mr-2" />
                  Definir comme Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("VIEWER")}>
                  <Eye className="h-4 w-4 mr-2" />
                  Definir comme Lecteur
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleRemove}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
}
