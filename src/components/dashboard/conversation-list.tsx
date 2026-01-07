"use client";

import { formatDistanceToNow } from "@/lib/utils";
import { MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customerPhone: string;
  customerName: string | null;
  status: string;
  updatedAt: Date;
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

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Aucune conversation</h3>
        <p className="mt-2 text-gray-500">
          Les conversations apparaîtront ici quand vos clients vous enverront
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

        return (
          <div
            key={conversation.id}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {(conversation.customerName || conversation.customerPhone)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
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
              </div>
              <p className="text-sm text-gray-500 truncate">
                {lastMessage?.content || "Pas de messages"}
              </p>
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
