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
      <div className="card-premium p-12 text-center animate-fade-up">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
          <MessageSquare className="relative mx-auto h-12 w-12 text-primary/40" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Aucune conversation</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Les conversations apparaitront ici quand vos clients vous enverront
          des messages WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="card-premium divide-y divide-border/50">
      {conversations.map((conversation, index) => {
        const status = statusConfig[conversation.status] || statusConfig.active;
        const StatusIcon = status.icon;
        const lastMessage = conversation.messages[0];
        const priority = priorityConfig[conversation.priority] || priorityConfig.normal;
        const isAssigning = assigningId === conversation.id;

        return (
          <div
            key={conversation.id}
            onClick={() => router.push(`/dashboard/conversations/${conversation.id}`)}
            className={cn(
              "flex items-center gap-4 p-4 hover:bg-primary/5 transition-all duration-300 cursor-pointer group animate-fade-up",
              "hover:shadow-sm hover:pl-6",
              isAssigning && "opacity-50 pointer-events-none"
            )}
            style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
          >
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                <AvatarFallback className="text-sm font-semibold text-primary bg-transparent">
                  {getInitials(
                    conversation.customerName,
                    conversation.customerPhone
                  )}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-body-strong truncate">
                  {conversation.customerName || conversation.customerPhone}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "inline-flex items-center gap-1 h-5 px-2 text-[10px] font-semibold border shadow-sm",
                    status.className
                  )}
                >
                  <StatusIcon className="h-2.5 w-2.5" />
                  {status.label}
                </Badge>
                {conversation.priority !== "normal" && (
                  <Badge
                    variant="outline"
                    className={cn("h-5 text-[10px] font-semibold border shadow-sm", priority.color)}
                  >
                    {priority.label}
                  </Badge>
                )}
              </div>
              <p className="text-meta mt-1 truncate">
                {lastMessage?.content || "Pas de messages"}
              </p>
            </div>

            {/* Assignment Section */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {conversation.assignedTo ? (
                <div className="flex items-center gap-2 bg-primary/5 rounded-full px-2.5 py-1 border border-primary/10">
                  <Avatar className="h-5 w-5 bg-primary/10 ring-1 ring-primary/20">
                    <AvatarFallback className="text-[9px] font-semibold text-primary">
                      {getInitials(
                        conversation.assignedTo.name,
                        conversation.assignedTo.email
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] font-medium text-primary hidden sm:block">
                    {conversation.assignedTo.name ||
                      conversation.assignedTo.email.split("@")[0]}
                  </span>
                </div>
              ) : (
                <span className="text-micro text-muted-foreground flex items-center gap-1 px-2 py-1">
                  <User className="h-3 w-3" />
                  Non assigné
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
                      onClick={(e) => e.stopPropagation()}
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

            <div className="flex-shrink-0 text-right space-y-1">
              <p className="text-micro text-muted-foreground font-medium">
                {formatDistanceToNow(conversation.updatedAt)}
              </p>
              <div className="flex items-center justify-end gap-1">
                <MessageSquare className="h-3 w-3 text-muted-foreground/60" />
                <p className="text-micro text-muted-foreground/80 font-medium tabular-nums">
                  {conversation._count.messages}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
