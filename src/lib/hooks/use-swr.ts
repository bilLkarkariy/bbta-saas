"use client";

/**
 * Custom SWR hooks for common data fetching patterns
 *
 * Provides typed, pre-configured hooks for different data types
 * with appropriate caching strategies.
 */

import useSWR, { SWRConfiguration, mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { authFetcher, postFetcher, swrConfig, cacheKeys } from "@/lib/fetcher";

/**
 * Hook for fetching team members
 */
export function useTeam(options?: SWRConfiguration) {
  return useSWR<{
    members: Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      isAvailable: boolean;
    }>;
  }>(cacheKeys.team(), authFetcher, {
    ...swrConfig.team,
    ...options,
  });
}

/**
 * Hook for fetching analytics data
 */
export function useAnalytics(days = 30, options?: SWRConfiguration) {
  return useSWR<{
    totalConversations: number;
    activeConversations: number;
    messagesTotal: number;
    avgResponseTime: number | null;
    botResolutionRate: number | null;
    leadsCapture: number;
  }>(cacheKeys.analytics(days), authFetcher, {
    ...swrConfig.analytics,
    ...options,
  });
}

/**
 * Hook for fetching conversations (real-time updates)
 */
export function useConversations(tenantId?: string, options?: SWRConfiguration) {
  return useSWR<{
    conversations: Array<{
      id: string;
      customerPhone: string;
      customerName: string | null;
      status: string;
      lastMessageAt: Date;
      assignedTo: { name: string | null; email: string } | null;
    }>;
  }>(cacheKeys.conversations(tenantId), authFetcher, {
    ...swrConfig.realtime,
    ...options,
  });
}

/**
 * Hook for fetching a single conversation with messages
 */
export function useConversation(id: string, options?: SWRConfiguration) {
  return useSWR<{
    conversation: {
      id: string;
      customerPhone: string;
      customerName: string | null;
      status: string;
      messages: Array<{
        id: string;
        content: string;
        direction: string;
        createdAt: Date;
      }>;
    };
  }>(id ? cacheKeys.conversation(id) : null, authFetcher, {
    ...swrConfig.realtime,
    ...options,
  });
}

/**
 * Hook for sending a message (mutation)
 */
export function useSendMessage(conversationId: string) {
  return useSWRMutation(
    `/api/conversations/${conversationId}/reply`,
    postFetcher,
    {
      onSuccess: () => {
        // Revalidate conversation data after sending
        mutate(cacheKeys.conversation(conversationId));
      },
    }
  );
}

/**
 * Hook for updating team member
 */
export function useUpdateTeamMember(memberId: string) {
  return useSWRMutation(
    `/api/team/${memberId}`,
    async (url: string, { arg }: { arg: Record<string, unknown> }) => {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update team member");
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate team data after update
        mutate(cacheKeys.team());
      },
    }
  );
}

/**
 * Utility to manually revalidate specific cache keys
 */
export const revalidateCache = {
  team: () => mutate(cacheKeys.team()),
  analytics: (days = 30) => mutate(cacheKeys.analytics(days)),
  conversations: (tenantId?: string) => mutate(cacheKeys.conversations(tenantId)),
  conversation: (id: string) => mutate(cacheKeys.conversation(id)),
  all: () => mutate(() => true, undefined, { revalidate: true }),
};
