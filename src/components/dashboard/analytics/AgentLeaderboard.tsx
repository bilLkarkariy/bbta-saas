"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Users } from "lucide-react";

interface AgentPerformance {
  userId: string;
  userName: string | null;
  conversationsHandled: number;
  messagesCount: number;
  avgResponseTime: number | null;
}

interface AgentLeaderboardProps {
  data: AgentPerformance[];
  loading?: boolean;
}

export function AgentLeaderboard({ data, loading }: AgentLeaderboardProps) {
  if (loading) {
    return (
      <Card className="glass-card border-none">
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="glass-card border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-label flex items-center gap-2">
          <Users className="h-4 w-4" />
          Performance des Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun agent actif
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((agent, index) => (
              <div
                key={agent.userId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-center w-6 text-sm font-bold text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-10 w-10 bg-gradient-to-br from-primary/20 to-primary/40">
                  <AvatarFallback className="text-primary font-semibold text-sm">
                    {getInitials(agent.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-body-strong truncate">
                    {agent.userName || "Agent sans nom"}
                  </div>
                  <div className="flex items-center gap-3 text-meta">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {agent.conversationsHandled} conv.
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {agent.messagesCount} msgs
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {agent.conversationsHandled}
                  </div>
                  <div className="text-micro uppercase tracking-wide">
                    conversations
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
