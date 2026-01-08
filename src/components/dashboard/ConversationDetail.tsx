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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 h-full overflow-hidden">
      {/* Messages Panel */}
      <Card className="flex flex-col overflow-hidden animate-fade-up stagger-1 h-full card-premium shadow-layered">
        {/* Conversation Header */}
        <CardHeader className="border-b border-border/50 px-6 py-4 bg-gradient-to-b from-background/50 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1.5 border border-border/50">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  {conversation.customerPhone}
                </p>
              </div>
              {conversation.leadScore !== null && conversation.leadScore !== undefined && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] h-6 px-2.5 font-semibold shadow-sm",
                    conversation.leadScore >= 70
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : conversation.leadScore >= 40
                        ? "bg-amber-50 text-amber-700 border-amber-200/60"
                        : "bg-slate-50 text-slate-600 border-slate-200/60"
                  )}
                >
                  <Target className="h-2.5 w-2.5 mr-1" />
                  Score: {conversation.leadScore}
                </Badge>
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
              className="font-semibold px-4 py-1.5 shadow-sm"
            >
              {conversation.status === "active" ? "Active" : conversation.status === "escalated" ? "Escaladée" : "Résolue"}
            </Badge>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6 bg-gradient-to-b from-muted/5 to-transparent">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-fade-in">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-full p-6 border border-primary/20">
                  <MessageSquare className="h-12 w-12 text-primary/60" />
                </div>
              </div>
              <p className="text-lg font-semibold tracking-tight">Aucun message</p>
              <p className="text-sm text-muted-foreground/70">La conversation commence ici</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex animate-fade-up",
                    message.direction === "outbound" ? "justify-end" : "justify-start"
                  )}
                  style={{ animationDelay: `${index <= 7 ? index * 40 : 300}ms` }}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-5 py-3.5 space-y-2 transition-all duration-300 hover:scale-[1.01]",
                      message.direction === "outbound"
                        ? "bg-gradient-to-br from-primary via-primary to-primary/95 text-primary-foreground glow-primary"
                        : "card-premium hover:shadow-layered-lg bg-gradient-to-br from-card to-muted/5"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm leading-relaxed whitespace-pre-wrap",
                        message.direction === "inbound" && "text-slate-700"
                      )}
                      dangerouslySetInnerHTML={{ __html: sanitizeContent(message.content) }}
                    />

                    {/* Message metadata */}
                    <div
                      className={cn(
                        "flex items-center gap-2 text-[11px] font-medium",
                        message.direction === "outbound" ? "justify-end text-white/70" : "justify-start text-slate-500"
                      )}
                    >
                      <span>{formatMessageTime(message.createdAt)}</span>

                      {/* Intent badge for outbound */}
                      {message.direction === "outbound" && message.intent && (
                        <Badge
                          variant={getIntentBadgeVariant(message.intent)}
                          className="h-4.5 text-[9px] px-1.5 bg-white/20 border-white/30 text-white"
                        >
                          {message.intent}
                        </Badge>
                      )}

                      {/* AI Tier indicator */}
                      {message.direction === "outbound" && message.tierUsed && (
                        <span className="flex items-center gap-1 opacity-70">
                          <Sparkles className="h-3 w-3" />
                          {message.tierUsed.replace("TIER_", "T")}
                        </span>
                      )}

                      {/* Status icon for outbound */}
                      {message.direction === "outbound" && (
                        <span className="opacity-70">{getStatusIcon(message.status)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="card-premium bg-gradient-to-br from-card to-muted/5 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-sm shadow-primary/30" style={{ animationDelay: "0ms" }} />
                      <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-sm shadow-primary/30" style={{ animationDelay: "150ms" }} />
                      <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-sm shadow-primary/30" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Reply Input */}
        <div className="border-t border-border/50 bg-gradient-to-b from-transparent to-muted/5 px-6 py-5 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-3"
          >
            <Input
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Écrire un message..."
              disabled={sending}
              className="flex-1 h-12 bg-card border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl shadow-sm focus:shadow-md"
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl glow-soft transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Customer Info Sidebar */}
      <Card className="overflow-hidden animate-fade-up stagger-2 hidden lg:block h-full card-premium shadow-layered">
        <CardHeader className="border-b border-border/50 px-6 py-4 bg-gradient-to-b from-primary/5 to-transparent">
          <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-tight text-foreground">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <User className="h-4 w-4 text-primary" />
            </div>
            Informations client
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6 overflow-y-auto scrollbar-thin max-h-[calc(100vh-16rem)]">
          {/* Contact Info */}
          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10">
            {/* Phone */}
            <div className="space-y-2">
              <p className="text-label flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-primary" />
                Téléphone
              </p>
              <p className="text-body-strong">{conversation.customerPhone}</p>
            </div>

            {/* Name */}
            {conversation.customerName && (
              <div className="space-y-2">
                <p className="text-label flex items-center gap-1.5">
                  <User className="h-3 w-3 text-primary" />
                  Nom
                </p>
                <p className="text-body-strong">{conversation.customerName}</p>
              </div>
            )}

            {/* Email */}
            {conversation.customerEmail && (
              <div className="space-y-2">
                <p className="text-label flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-primary" />
                  Email
                </p>
                <p className="text-body-strong break-all">{conversation.customerEmail}</p>
              </div>
            )}
          </div>

          <Separator className="my-5" />

          {/* Conversation Status */}
          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <p className="text-label">Statut</p>
              <Badge
                variant={
                  conversation.status === "active"
                    ? "default"
                    : conversation.status === "escalated"
                      ? "destructive"
                      : "secondary"
                }
                className="font-medium"
              >
                {conversation.status === "active" ? "Active" : conversation.status === "escalated" ? "Escaladée" : "Résolue"}
              </Badge>
            </div>

            {/* Active Flow */}
            {conversation.currentFlow && (
              <div className="space-y-2">
                <p className="text-label">Flow actif</p>
                <Badge variant="outline" className="font-medium">
                  {conversation.currentFlow}
                </Badge>
              </div>
            )}

            {/* Lead Status */}
            {conversation.leadStatus && (
              <div className="space-y-2">
                <p className="text-label flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Lead Status
                </p>
                <Badge variant="secondary" className="font-medium">
                  {conversation.leadStatus}
                </Badge>
              </div>
            )}

            {/* Lead Score */}
            {conversation.leadScore !== null && conversation.leadScore !== undefined && (
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                <p className="text-label flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-primary" />
                  Score Lead
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-stat text-foreground">
                      {conversation.leadScore}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">/ 100</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner ring-1 ring-border/50">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 animate-scale-in",
                        conversation.leadScore >= 70
                          ? "bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30"
                          : conversation.leadScore >= 40
                            ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-lg shadow-amber-500/30"
                            : "bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 shadow-lg shadow-slate-500/20"
                      )}
                      style={{ width: `${conversation.leadScore}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-5" />

          {/* Timeline */}
          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-muted/20 to-transparent border border-border/50">
            {/* Created */}
            <div className="space-y-2">
              <p className="text-label flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" />
                Créé le
              </p>
              <p className="text-body font-medium">
                {new Date(conversation.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Last message */}
            <div className="space-y-2">
              <p className="text-label flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 text-primary" />
                Dernier message
              </p>
              <p className="text-body font-medium">
                {new Date(conversation.lastMessageAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Message count */}
            <div className="space-y-2">
              <p className="text-label">Total Messages</p>
              <p className="text-stat-secondary text-primary">{messages.length}</p>
            </div>
          </div>

          <Separator className="my-5" />

          {/* Internal Notes */}
          <InternalNotes conversationId={conversation.id} />
        </CardContent>
      </Card>
    </div>
  );
}
