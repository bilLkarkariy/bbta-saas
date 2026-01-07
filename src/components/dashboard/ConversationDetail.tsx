"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Phone,
  User,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  ArrowLeft,
  Mail,
  Target,
  Bot,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { InternalNotes } from "./inbox/InternalNotes";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Sanitize user-generated content to prevent XSS
function sanitizeContent(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  status: string;
  intent?: string | null;
  confidence?: number | null;
  tierUsed?: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerPhone: string;
  customerName?: string | null;
  customerEmail?: string | null;
  status: string;
  currentFlow?: string | null;
  leadStatus?: string | null;
  leadScore?: number | null;
  createdAt: string;
  lastMessageAt: string;
  messages: Message[];
}

interface ConversationDetailProps {
  conversation: Conversation;
}

export function ConversationDetail({ conversation }: ConversationDetailProps) {
  const [messages, setMessages] = useState(conversation.messages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time updates via SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/conversations/stream");

    eventSource.onmessage = (event) => {
      try {
        // Ignore heartbeat comments
        if (event.data.startsWith(":")) return;

        const data = JSON.parse(event.data);

        if (data.type === "new_message" && data.data.conversationId === conversation.id) {
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m.id === data.data.id)) return prev;
            return [...prev, data.data];
          });
        }

        if (data.type === "typing_start" && data.data.conversationId === conversation.id) {
          setIsTyping(true);
        }

        if (data.type === "typing_stop" && data.data.conversationId === conversation.id) {
          setIsTyping(false);
        }
      } catch (e) {
        console.error("Error parsing SSE event:", e);
      }
    };

    return () => eventSource.close();
  }, [conversation.id]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async () => {
    try {
      await fetch(`/api/conversations/${conversation.id}/typing`, {
        method: "POST",
      });
    } catch {
      // Ignore errors
    }
  }, [conversation.id]);

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value);

    // Send typing indicator
    if (value.length > 0) {
      sendTypingIndicator();

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/conversations/${conversation.id}/typing`, {
            method: "DELETE",
          });
        } catch {
          // Ignore errors
        }
      }, 2000);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) {
        // Restore message on failure
        setNewMessage(messageContent);
        console.error("Failed to send message");
      }
    } catch (error) {
      setNewMessage(messageContent);
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Get status icon for message
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Get intent badge variant
  const getIntentBadgeVariant = (intent: string) => {
    switch (intent) {
      case "FAQ":
        return "default";
      case "BOOKING":
        return "secondary";
      case "LEAD_CAPTURE":
        return "outline";
      case "SUPPORT":
        return "destructive";
      case "ESCALATE":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Customer initials
  const initials = conversation.customerName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 p-6">
      {/* Messages Panel */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/conversations">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {conversation.customerName || conversation.customerPhone}
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {conversation.customerPhone}
                </p>
              </div>
            </div>
            <Badge
              variant={
                conversation.status === "active"
                  ? "default"
                  : conversation.status === "escalated"
                    ? "destructive"
                    : "secondary"
              }
            >
              {conversation.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3" />
              <p>Aucun message pour le moment</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.direction === "outbound" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 space-y-1",
                    message.direction === "outbound"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p
                      className="text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: sanitizeContent(message.content) }}
                    />

                  {/* Message metadata */}
                  <div
                    className={cn(
                      "flex items-center gap-2 text-[10px]",
                      message.direction === "outbound" ? "justify-end" : "justify-start"
                    )}
                  >
                    <span className="opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {/* Intent badge for outbound */}
                    {message.direction === "outbound" && message.intent && (
                      <Badge
                        variant={getIntentBadgeVariant(message.intent)}
                        className="h-4 text-[8px] px-1"
                      >
                        {message.intent}
                      </Badge>
                    )}

                    {/* Tier indicator */}
                    {message.direction === "outbound" && message.tierUsed && (
                      <span className="opacity-50 flex items-center gap-0.5">
                        <Bot className="h-2.5 w-2.5" />
                        {message.tierUsed.replace("TIER_", "T")}
                      </span>
                    )}

                    {/* Status icon for outbound */}
                    {message.direction === "outbound" && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Reply Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Écrire un message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Customer Info Sidebar */}
      <Card className="w-80 shrink-0 overflow-auto">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone */}
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Téléphone
            </p>
            <p className="text-sm font-medium">{conversation.customerPhone}</p>
          </div>

          {/* Name */}
          {conversation.customerName && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
                <User className="h-3 w-3" />
                Nom
              </p>
              <p className="text-sm font-medium">{conversation.customerName}</p>
            </div>
          )}

          {/* Email */}
          {conversation.customerEmail && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </p>
              <p className="text-sm font-medium">{conversation.customerEmail}</p>
            </div>
          )}

          <Separator />

          {/* Status */}
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Statut</p>
            <Badge
              variant={
                conversation.status === "active"
                  ? "default"
                  : conversation.status === "escalated"
                    ? "destructive"
                    : "secondary"
              }
              className="mt-1"
            >
              {conversation.status}
            </Badge>
          </div>

          {/* Active Flow */}
          {conversation.currentFlow && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Flow actif</p>
              <Badge variant="outline" className="mt-1">
                {conversation.currentFlow}
              </Badge>
            </div>
          )}

          {/* Lead Status */}
          {conversation.leadStatus && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
                <Target className="h-3 w-3" />
                Lead Status
              </p>
              <Badge variant="secondary" className="mt-1">
                {conversation.leadStatus}
              </Badge>
            </div>
          )}

          {/* Lead Score */}
          {conversation.leadScore !== null && conversation.leadScore !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Score Lead</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      conversation.leadScore >= 70
                        ? "bg-green-500"
                        : conversation.leadScore >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    )}
                    style={{ width: `${conversation.leadScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{conversation.leadScore}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Timestamps */}
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Créé le
            </p>
            <p className="text-sm">
              {new Date(conversation.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Dernier message</p>
            <p className="text-sm">
              {new Date(conversation.lastMessageAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Message count */}
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Messages
            </p>
            <p className="text-sm font-medium">{messages.length}</p>
          </div>

          <Separator />

          {/* Internal Notes */}
          <InternalNotes conversationId={conversation.id} />
        </CardContent>
      </Card>
    </div>
  );
}
