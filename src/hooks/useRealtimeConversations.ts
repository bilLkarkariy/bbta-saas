"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface RealtimeEvent {
  type:
    | "new_message"
    | "status_change"
    | "conversation_update"
    | "connected"
    | "heartbeat"
    | "typing_start"
    | "typing_stop";
  data?: unknown;
}

interface Message {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  content: string;
  status: string;
  intent?: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerPhone: string;
  customerName?: string | null;
  status: string;
  lastMessageAt: string;
  messages?: Message[];
  unreadCount?: number;
}

interface TypingState {
  conversationId: string;
  userId: string;
  userName?: string;
  expiresAt: number;
}

interface UseRealtimeConversationsOptions {
  onNewMessage?: (message: Message) => void;
  onStatusChange?: (conversationId: string, status: string) => void;
  onTypingStart?: (data: { conversationId: string; userId: string; userName?: string }) => void;
  onTypingStop?: (data: { conversationId: string; userId: string }) => void;
}

interface UseRealtimeConversationsReturn {
  conversations: Conversation[];
  connected: boolean;
  error: string | null;
  reconnecting: boolean;
  typingStates: Map<string, TypingState>;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export function useRealtimeConversations(
  initialConversations: Conversation[] = [],
  options: UseRealtimeConversationsOptions = {}
): UseRealtimeConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [typingStates, setTypingStates] = useState<Map<string, TypingState>>(new Map());

  const optionsRef = useRef(options);

  // Update ref in effect to avoid accessing during render
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Clean up expired typing states
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingStates((prev) => {
        const updated = new Map(prev);
        let changed = false;
        for (const [key, state] of updated.entries()) {
          if (state.expiresAt < now) {
            updated.delete(key);
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle new message
  const handleNewMessage = useCallback((message: Message) => {
    setConversations((prev) => {
      const conversationIndex = prev.findIndex((c) => c.id === message.conversationId);

      if (conversationIndex === -1) {
        // New conversation, trigger refresh or add placeholder
        return prev;
      }

      const updated = [...prev];
      const conversation = { ...updated[conversationIndex] };

      // Add message to conversation
      conversation.messages = [...(conversation.messages || []), message];
      conversation.lastMessageAt = message.createdAt;

      // Increment unread count for inbound messages
      if (message.direction === "inbound") {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }

      // Move to top of list
      updated.splice(conversationIndex, 1);
      updated.unshift(conversation);

      return updated;
    });

    optionsRef.current.onNewMessage?.(message);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback(
    (data: { conversationId: string; status: string }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversationId ? { ...c, status: data.status } : c))
      );

      optionsRef.current.onStatusChange?.(data.conversationId, data.status);
    },
    []
  );

  // Handle conversation update
  const handleConversationUpdate = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === conversation.id);
      if (index === -1) {
        // New conversation
        return [conversation, ...prev];
      }
      const updated = [...prev];
      updated[index] = { ...updated[index], ...conversation };
      return updated;
    });
  }, []);

  // Handle typing start
  const handleTypingStart = useCallback(
    (data: { conversationId: string; userId: string; userName?: string }) => {
      setTypingStates((prev) => {
        const updated = new Map(prev);
        updated.set(data.conversationId, {
          ...data,
          expiresAt: Date.now() + 5000, // 5 seconds
        });
        return updated;
      });

      optionsRef.current.onTypingStart?.(data);
    },
    []
  );

  // Handle typing stop
  const handleTypingStop = useCallback(
    (data: { conversationId: string; userId: string }) => {
      setTypingStates((prev) => {
        const updated = new Map(prev);
        updated.delete(data.conversationId);
        return updated;
      });

      optionsRef.current.onTypingStop?.(data);
    },
    []
  );

  // SSE connection
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let mounted = true;

    const connect = () => {
      if (!mounted) return;

      eventSource = new EventSource("/api/conversations/stream");

      eventSource.onopen = () => {
        if (!mounted) return;
        setConnected(true);
        setError(null);
        setReconnecting(false);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        if (!mounted) return;

        try {
          // Ignore comment-style heartbeats
          if (event.data.startsWith(":")) return;

          const data: RealtimeEvent = JSON.parse(event.data);

          switch (data.type) {
            case "connected":
              setConnected(true);
              break;

            case "new_message":
              handleNewMessage(data.data as Message);
              break;

            case "status_change":
              handleStatusChange(data.data as { conversationId: string; status: string });
              break;

            case "conversation_update":
              handleConversationUpdate(data.data as Conversation);
              break;

            case "typing_start":
              handleTypingStart(
                data.data as { conversationId: string; userId: string; userName?: string }
              );
              break;

            case "typing_stop":
              handleTypingStop(data.data as { conversationId: string; userId: string });
              break;

            case "heartbeat":
              // Keep-alive, no action needed
              break;
          }
        } catch (e) {
          console.error("[SSE] Error parsing event:", e);
        }
      };

      eventSource.onerror = () => {
        if (!mounted) return;

        setConnected(false);
        eventSource?.close();
        eventSource = null;

        // Exponential backoff for reconnection
        reconnectAttemptsRef.current++;

        if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
          setReconnecting(true);

          console.log(
            `[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeout = setTimeout(connect, delay);
        } else {
          setError("Connexion perdue. Veuillez rafraîchir la page.");
          setReconnecting(false);
        }
      };
    };

    connect();

    return () => {
      mounted = false;
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [handleNewMessage, handleStatusChange, handleConversationUpdate, handleTypingStart, handleTypingStop]);

  // Public methods
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conversation.id);
      if (exists) return prev;
      return [conversation, ...prev];
    });
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  return {
    conversations,
    connected,
    error,
    reconnecting,
    typingStates,
    addConversation,
    updateConversation,
    setConversations,
  };
}
