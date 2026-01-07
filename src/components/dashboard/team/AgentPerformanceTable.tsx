"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpDown,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentStats {
  userId: string;
  name: string | null;
  email: string;
  conversationsHandled: number;
  conversationsResolved: number;
  conversationsEscalated: number;
  messagesResponded: number;
  avgResponseTimeMs: number | null;
  resolutionRate: number;
  currentWorkload: number;
  maxConversations: number;
  isAvailable: boolean;
}

interface AgentPerformanceTableProps {
  agents: AgentStats[];
}

type SortKey = "name" | "conversationsHandled" | "resolutionRate" | "avgResponseTimeMs" | "messagesResponded";
type SortOrder = "asc" | "desc";

// Moved outside component to avoid React Compiler warning
function SortHeader({
  label,
  sortKeyName,
  currentSortKey,
  onSort,
  className,
}: {
  label: string;
  sortKeyName: SortKey;
  currentSortKey: SortKey;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  return (
    <TableHead className={cn("cursor-pointer select-none", className)}>
      <button
        className="flex items-center gap-1 hover:text-foreground"
        onClick={() => onSort(sortKeyName)}
      >
        {label}
        <ArrowUpDown
          className={cn(
            "h-3 w-3",
            currentSortKey === sortKeyName ? "text-foreground" : "text-muted-foreground/50"
          )}
        />
      </button>
    </TableHead>
  );
}

export function AgentPerformanceTable({ agents }: AgentPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("conversationsHandled");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedAgents = [...agents].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    switch (sortKey) {
      case "name":
        aVal = a.name || a.email;
        bVal = b.name || b.email;
        break;
      case "avgResponseTimeMs":
        aVal = a.avgResponseTimeMs ?? Infinity;
        bVal = b.avgResponseTimeMs ?? Infinity;
        break;
      default:
        aVal = a[sortKey];
        bVal = b[sortKey];
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return "-";
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
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

  // Find top performer
  const topPerformerId =
    agents.length > 0
      ? agents.reduce((top, agent) =>
          agent.conversationsHandled > (top?.conversationsHandled || 0)
            ? agent
            : top
        ).userId
      : null;

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Agent" sortKeyName="name" currentSortKey={sortKey} onSort={handleSort} />
            <SortHeader label="Conversations" sortKeyName="conversationsHandled" currentSortKey={sortKey} onSort={handleSort} className="text-center" />
            <SortHeader label="Messages" sortKeyName="messagesResponded" currentSortKey={sortKey} onSort={handleSort} className="text-center" />
            <SortHeader label="Temps de réponse" sortKeyName="avgResponseTimeMs" currentSortKey={sortKey} onSort={handleSort} className="text-center" />
            <SortHeader label="Taux résolution" sortKeyName="resolutionRate" currentSortKey={sortKey} onSort={handleSort} className="text-center" />
            <TableHead className="text-center">Charge actuelle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Aucun agent dans l&apos;équipe
              </TableCell>
            </TableRow>
          ) : (
            sortedAgents.map((agent) => {
              const isTopPerformer = agent.userId === topPerformerId && agent.conversationsHandled > 0;
              const workloadPercent = (agent.currentWorkload / agent.maxConversations) * 100;

              return (
                <TableRow
                  key={agent.userId}
                  className={cn(isTopPerformer && "bg-green-50/50")}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(agent.name, agent.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {agent.name || agent.email.split("@")[0]}
                          </span>
                          {isTopPerformer && (
                            <Badge variant="outline" className="h-5 text-[10px] text-green-600 border-green-300">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Top
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {agent.email}
                        </span>
                      </div>
                      {!agent.isAvailable && (
                        <Badge variant="secondary" className="text-[10px]">
                          Indisponible
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{agent.conversationsHandled}</span>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {agent.conversationsResolved}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          {agent.conversationsEscalated}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold">{agent.messagesResponded}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={cn(
                          "font-semibold",
                          agent.avgResponseTimeMs !== null &&
                            agent.avgResponseTimeMs < 60000 &&
                            "text-green-600",
                          agent.avgResponseTimeMs !== null &&
                            agent.avgResponseTimeMs > 300000 &&
                            "text-orange-600"
                        )}
                      >
                        {formatResponseTime(agent.avgResponseTimeMs)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          "font-semibold",
                          agent.resolutionRate >= 0.8 && "text-green-600",
                          agent.resolutionRate < 0.5 && "text-orange-600"
                        )}
                      >
                        {Math.round(agent.resolutionRate * 100)}%
                      </span>
                      <Progress
                        value={agent.resolutionRate * 100}
                        className="h-1 w-16"
                      />
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm">
                        {agent.currentWorkload}/{agent.maxConversations}
                      </span>
                      <Progress
                        value={workloadPercent}
                        className={cn(
                          "h-1 w-16",
                          workloadPercent >= 80 && "[&>div]:bg-orange-500",
                          workloadPercent >= 100 && "[&>div]:bg-red-500"
                        )}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
