"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Settings, BarChart3 } from "lucide-react";
import { TeamMemberCard } from "./TeamMemberCard";

type UserRole = "OWNER" | "ADMIN" | "AGENT" | "VIEWER";
type AssignmentStrategy = "manual" | "round_robin" | "least_busy";

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

interface TeamPageProps {
  members: TeamMember[];
  currentUser: TeamMember;
  assignmentStrategy: AssignmentStrategy;
  autoAssignOnInbound: boolean;
}

export function TeamPage({
  members,
  currentUser,
  assignmentStrategy: initialStrategy,
  autoAssignOnInbound: initialAutoAssign,
}: TeamPageProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [strategy, setStrategy] = useState(initialStrategy);
  const [autoAssign, setAutoAssign] = useState(initialAutoAssign);

  const updateMemberRole = async (memberId: string, role: UserRole) => {
    const res = await fetch(`/api/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Erreur lors de la mise a jour");
    }

    startTransition(() => router.refresh());
  };

  const updateMemberAvailability = async (
    memberId: string,
    isAvailable: boolean
  ) => {
    const res = await fetch(`/api/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Erreur lors de la mise a jour");
    }

    startTransition(() => router.refresh());
  };

  const removeMember = async (memberId: string) => {
    const res = await fetch(`/api/team/${memberId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Erreur lors de la suppression");
    }

    startTransition(() => router.refresh());
  };

  const updateSettings = async (
    newStrategy?: AssignmentStrategy,
    newAutoAssign?: boolean
  ) => {
    // TODO: Implement tenant settings update API
    if (newStrategy) setStrategy(newStrategy);
    if (newAutoAssign !== undefined) setAutoAssign(newAutoAssign);
  };

  const isOwner = currentUser.role === "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-slate-500">
            Gerez les membres de votre equipe et leurs permissions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/team/performance">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance
            </Button>
          </Link>
          {isOwner && (
            <Button size="sm" disabled>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter
            </Button>
          )}
        </div>
      </div>

      {/* Assignment Settings */}
      {isOwner && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold">Parametres d&apos;assignation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                Strategie d&apos;assignation
              </label>
              <Select
                value={strategy}
                onValueChange={(v) =>
                  updateSettings(v as AssignmentStrategy, undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="least_busy">Moins charge</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                {strategy === "manual" && "Assignez manuellement les conversations"}
                {strategy === "round_robin" && "Distribution alternee entre agents"}
                {strategy === "least_busy" && "Assigne a l'agent avec le moins de conversations"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                Auto-assignation
              </label>
              <Select
                value={autoAssign ? "enabled" : "disabled"}
                onValueChange={(v) => updateSettings(undefined, v === "enabled")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Active</SelectItem>
                  <SelectItem value="disabled">Desactivee</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                {autoAssign
                  ? "Les nouvelles conversations sont assignees automatiquement"
                  : "Les conversations restent non-assignees jusqu'a action manuelle"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Team Members */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-600">
          Membres ({members.length})
        </h2>
        {members.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            currentUserRole={currentUser.role}
            currentUserId={currentUser.id}
            onUpdateRole={updateMemberRole}
            onUpdateAvailability={updateMemberAvailability}
            onRemove={removeMember}
          />
        ))}
      </div>
    </div>
  );
}
