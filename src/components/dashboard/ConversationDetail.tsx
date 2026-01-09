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
  Mail,
  Target,
  Bot,
  MessageSquare,
  Loader2,
  Sparkles,
} from "lucide-react";
import { InternalNotes } from "./inbox/InternalNotes";
import { cn } from "@/lib/utils";

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
        return <Check className="h-3 w-3" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3" />;
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

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] w-full gap-[var(--dashboard-section-gap)] max-w-full">
      {/* Messages Panel */}
      <Card className="flex flex-col w-full overflow-hidden glass shadow-layered" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* Conversation Header */}
        <CardHeader className="border-b border-border shrink-0 p-[var(--dashboard-card-padding)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {conversation.customerPhone}
                </span>
              </div>

              {conversation.leadScore !== null && conversation.leadScore !== undefined && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                    conversation.leadScore >= 70
                      ? "bg-success/10 text-success border border-success/20"
                      : conversation.leadScore >= 40
                        ? "bg-warning/10 text-warning border border-warning/20"
                        : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  <Target className="h-3 w-3" />
                  <span>{conversation.leadScore}</span>
                </div>
              )}
            </div>

            <Badge
              variant={
                conversation.status === "active"
                  ? "default"
                  : conversation.status === "escalated"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs font-medium"
            >
              {conversation.status === "active" ? "Active" : conversation.status === "escalated" ? "Escaladée" : "Résolue"}
            </Badge>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin flex flex-col gap-[var(--dashboard-card-gap)] p-[var(--dashboard-card-padding)]"
          style={{ minHeight: 0 }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-6 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <MessageSquare className="h-12 w-12 text-primary/60" />
              </div>
              <h3 className="text-body-strong text-foreground mb-1">Aucun message</h3>
              <p className="text-meta text-muted-foreground">La conversation commence ici</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.direction === "outbound" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 py-3 transition-all duration-200",
                      message.direction === "outbound"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border shadow-sm"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm leading-relaxed whitespace-pre-wrap break-words",
                        message.direction === "inbound" && "text-foreground"
                      )}
                      dangerouslySetInnerHTML={{ __html: sanitizeContent(message.content) }}
                    />

                    <div
                      className={cn(
                        "flex items-center flex-wrap gap-2 text-xs mt-2",
                        message.direction === "outbound"
                          ? "justify-end text-primary-foreground/70"
                          : "justify-start text-muted-foreground"
                      )}
                    >
                      <span>{formatMessageTime(message.createdAt)}</span>

                      {message.direction === "outbound" && message.intent && (
                        <span className="px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[10px] font-medium">
                          {message.intent}
                        </span>
                      )}

                      {message.direction === "outbound" && message.tierUsed && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span className="text-[10px]">{message.tierUsed.replace("TIER_", "T")}</span>
                        </span>
                      )}

                      {message.direction === "outbound" && (
                        <span>{getStatusIcon(message.status)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Reply Input */}
        <div className="border-t border-border shrink-0 p-[var(--dashboard-card-padding)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <Input
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Écrire un message..."
              disabled={sending}
              className="flex-1 h-11 text-sm transition-all"
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="h-11 w-11 shrink-0 transition-all"
            >
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
      <Card className="hidden lg:flex lg:flex-col w-full glass shadow-layered overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <CardHeader className="border-b border-border shrink-0 p-[var(--dashboard-card-padding)]">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-primary" />
            Informations client
          </CardTitle>
        </CardHeader>
        <CardContent
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin flex flex-col gap-[var(--dashboard-card-gap)] p-[var(--dashboard-card-padding)]"
          style={{ minHeight: 0 }}
        >
          {/* Contact Info */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-label">Téléphone</p>
              </div>
              <p className="text-body-strong">{conversation.customerPhone}</p>
            </div>

            {conversation.customerName && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Nom</p>
                  </div>
                  <p className="text-body-strong">{conversation.customerName}</p>
                </div>
              </>
            )}

            {conversation.customerEmail && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Email</p>
                  </div>
                  <p className="text-body-strong break-all">{conversation.customerEmail}</p>
                </div>
              </>
            )}
          </div>

          {/* Status & Lead Info */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="space-y-1.5">
              <p className="text-label">Statut</p>
              <Badge
                variant={
                  conversation.status === "active"
                    ? "default"
                    : conversation.status === "escalated"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs font-medium"
              >
                {conversation.status === "active" ? "Active" : conversation.status === "escalated" ? "Escaladée" : "Résolue"}
              </Badge>
            </div>

            {conversation.currentFlow && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Flow actif</p>
                  </div>
                  <p className="text-body-strong">{conversation.currentFlow}</p>
                </div>
              </>
            )}

            {conversation.leadStatus && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Lead Status</p>
                  </div>
                  <p className="text-body-strong">{conversation.leadStatus}</p>
                </div>
              </>
            )}

            {conversation.leadScore !== null && conversation.leadScore !== undefined && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-label">Score Lead</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {conversation.leadScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-700",
                        conversation.leadScore >= 70
                          ? "bg-success"
                          : conversation.leadScore >= 40
                            ? "bg-warning"
                            : "bg-muted-foreground"
                      )}
                      style={{ width: `${conversation.leadScore}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-label">Créé le</p>
              </div>
              <p className="text-body-strong">
                {new Date(conversation.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-label">Dernier message</p>
              </div>
              <p className="text-body-strong">
                {new Date(conversation.lastMessageAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-label">Total Messages</p>
              <p className="text-2xl font-bold text-primary">{messages.length}</p>
            </div>
          </div>

          {/* Internal Notes */}
          <InternalNotes conversationId={conversation.id} />
        </CardContent>
      </Card>
    </div>
  );
}
