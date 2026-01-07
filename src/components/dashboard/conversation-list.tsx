"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "@/lib/utils";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Conversation {
  id: string;
  customerPhone: string;
  customerName: string | null;
  status: string;
  priority: string;
  updatedAt: Date;
  assignedTo?: Agent | null;
  messages: {
    content: string;
    createdAt: Date;
  }[];
  _count: {
    messages: number;
  };
}

interface ConversationListProps {
  conversations: Conversation[];
  agents?: Agent[];
  canAssign?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; icon: typeof Clock; className: string }
> = {
  active: {
    label: "Active",
    icon: Clock,
    className: "bg-blue-100 text-blue-700",
  },
  resolved: {
    label: "Résolue",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700",
  },
  escalated: {
    label: "Escaladée",
    icon: AlertCircle,
    className: "bg-orange-100 text-orange-700",
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "Haute", color: "bg-red-100 text-red-700" },
  normal: { label: "Normale", color: "bg-gray-100 text-gray-600" },
  low: { label: "Basse", color: "bg-green-100 text-green-700" },
};

export function ConversationList({
  conversations,
  agents = [],
  canAssign = false,
}: ConversationListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleAssign = async (conversationId: string, agentId: string | null) => {
    setAssigningId(conversationId);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'assignation");
      }

      startTransition(() => router.refresh());
    } finally {
      setAssigningId(null);
    }
  };

  const getInitials = (name: string | null, fallback: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return fallback.slice(0, 2).toUpperCase();
  };

  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Aucune conversation</h3>
        <p className="mt-2 text-gray-500">
          Les conversations apparaitront ici quand vos clients vous enverront
          des messages WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white divide-y">
      {conversations.map((conversation) => {
        const status = statusConfig[conversation.status] || statusConfig.active;
        const StatusIcon = status.icon;
        const lastMessage = conversation.messages[0];
        const priority = priorityConfig[conversation.priority] || priorityConfig.normal;
        const isAssigning = assigningId === conversation.id;

        return (
          <div
            key={conversation.id}
            className={cn(
              "flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors",
              isAssigning && "opacity-50"
            )}
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {getInitials(
                    conversation.customerName,
                    conversation.customerPhone
                  )}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">
                  {conversation.customerName || conversation.customerPhone}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    status.className
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
                {conversation.priority !== "normal" && (
                  <Badge className={cn("text-[10px]", priority.color)}>
                    {priority.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">
                {lastMessage?.content || "Pas de messages"}
              </p>
            </div>

            {/* Assignment Section */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {conversation.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 bg-primary/10">
                    <AvatarFallback className="text-xs text-primary">
                      {getInitials(
                        conversation.assignedTo.name,
                        conversation.assignedTo.email
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-slate-600 hidden sm:block">
                    {conversation.assignedTo.name ||
                      conversation.assignedTo.email.split("@")[0]}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Non assigne
                </span>
              )}

              {canAssign && agents.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={isAssigning}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {conversation.assignedTo && (
                      <DropdownMenuItem
                        onClick={() => handleAssign(conversation.id, null)}
                      >
                        <User className="h-4 w-4 mr-2 text-slate-400" />
                        Retirer l&apos;assignation
                      </DropdownMenuItem>
                    )}
                    {agents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => handleAssign(conversation.id, agent.id)}
                        disabled={conversation.assignedTo?.id === agent.id}
                      >
                        <Avatar className="h-4 w-4 mr-2">
                          <AvatarFallback className="text-[8px]">
                            {getInitials(agent.name, agent.email)}
                          </AvatarFallback>
                        </Avatar>
                        {agent.name || agent.email}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(conversation.updatedAt)}
              </p>
              <p className="text-xs text-gray-400">
                {conversation._count.messages} messages
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
