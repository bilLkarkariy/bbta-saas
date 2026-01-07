"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, ArrowRight, Check } from "lucide-react";

interface ConversationItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
    color: string;
    isOnline?: boolean;
  };
  lastMessage: string;
  time: string;
  unread?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isTyping?: boolean;
}

// TODO: Replace with real data from API
const conversations: ConversationItem[] = [
  {
    id: "1",
    user: { name: "Marie Dupont", initials: "MD", color: "bg-pink-500/10 text-pink-600", isOnline: true },
    lastMessage: "Bonjour, est-ce que vous avez des disponibilites pour...",
    time: "2 min",
    unread: true,
  },
  {
    id: "2",
    user: { name: "Jean Pierre", initials: "JP", color: "bg-blue-500/10 text-blue-600", isOnline: false },
    lastMessage: "Merci pour votre reponse rapide!",
    time: "15 min",
    unread: false,
    status: 'read'
  },
  {
    id: "3",
    user: { name: "Sophie Martin", initials: "SM", color: "bg-emerald-500/10 text-emerald-600", isOnline: true },
    lastMessage: "",
    time: "...",
    unread: false,
    isTyping: true
  },
  {
    id: "4",
    user: { name: "Paul Rogers", initials: "PR", color: "bg-amber-500/10 text-amber-600" },
    lastMessage: "Pouvez-vous m'envoyer la facture?",
    time: "2h",
    unread: false,
    status: 'delivered'
  },
  {
    id: "5",
    user: { name: "Luc Bernard", initials: "LB", color: "bg-violet-500/10 text-violet-600" },
    lastMessage: "C'est parfait, on fait comme ca.",
    time: "Hier",
    unread: false,
    status: 'sent'
  },
  {
    id: "6",
    user: { name: "Anne Claire", initials: "AC", color: "bg-rose-500/10 text-rose-600" },
    lastMessage: "Je vous recontacte la semaine prochaine.",
    time: "Hier",
    unread: false,
    status: 'read'
  },
  {
    id: "7",
    user: { name: "Marc Dubois", initials: "MD", color: "bg-cyan-500/10 text-cyan-600" },
    lastMessage: "Bien recu, merci!",
    time: "2j",
    unread: false,
    status: 'read'
  },
  {
    id: "8",
    user: { name: "Julie Moreau", initials: "JM", color: "bg-indigo-500/10 text-indigo-600" },
    lastMessage: "Le devis est parfait.",
    time: "3j",
    unread: false,
    status: 'read'
  },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <MessageSquare className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-body-strong">Aucune conversation</p>
      <p className="text-meta mt-1">
        Vos conversations recentes apparaitront ici.
      </p>
    </div>
  );
}

export function RecentConversations() {
  const router = useRouter();
  const hasConversations = conversations.length > 0;

  const handleConversationClick = (id: string) => {
    router.push(`/dashboard/conversations?conversation=${id}`);
  };

  const handleViewAll = () => {
    router.push("/dashboard/conversations");
  };

  const getStatusIcon = (status?: ConversationItem['status']) => {
    if (!status) return null;
    if (status === 'sent') return <Check className="h-3 w-3 text-muted-foreground/60" />;
    if (status === 'delivered') return (
      <div className="flex -space-x-1.5">
        <Check className="h-3 w-3 text-muted-foreground/60" />
        <Check className="h-3 w-3 text-muted-foreground/60" />
      </div>
    );
    if (status === 'read') return (
      <div className="flex -space-x-1.5">
        <Check className="h-3 w-3 text-blue-500" />
        <Check className="h-3 w-3 text-blue-500" />
      </div>
    );
    return null;
  };

  return (
    <Card className="glass-card h-full overflow-hidden relative border-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-6">
        <CardTitle className="text-xs font-bold text-slate-400 tracking-widest uppercase">Conversations Récentes</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-white/40 text-slate-400 hover:text-primary transition-all shadow-inner"
          onClick={handleViewAll}
          aria-label="Voir toutes les conversations"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {!hasConversations ? (
          <EmptyState />
        ) : (
          <ul className="space-y-1">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => handleConversationClick(conv.id)}
                  className="relative flex items-center gap-4 w-full text-left group px-4 py-3.5 rounded-2xl transition-all duration-300 bg-white/30 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:scale-[1.01] focus:outline-none focus-visible:bg-white"
                >
                  {/* Avatar Container */}
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                      <AvatarFallback className={cn("text-sm font-bold", conv.user.color)}>
                        {conv.user.initials}
                      </AvatarFallback>
                    </Avatar>
                    {conv.user.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-sm font-bold transition-colors truncate",
                        conv.unread ? "text-slate-800" : "text-slate-500 group-hover:text-slate-800"
                      )}>
                        {conv.user.name}
                      </p>
                      <span className={cn(
                        "text-[10px] font-bold tracking-tight whitespace-nowrap",
                        conv.unread ? "text-primary" : "text-slate-400 group-hover:text-slate-500"
                      )}>
                        {conv.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                        {/* Status Icon */}
                        {!conv.unread && !conv.isTyping && (
                          <span className="shrink-0 scale-90">{getStatusIcon(conv.status)}</span>
                        )}

                        <p className={cn(
                          "text-xs truncate flex-1",
                          conv.isTyping ? "text-primary font-bold flex items-center gap-1" : "text-slate-500/80 font-medium",
                          conv.unread && "text-slate-700 font-bold"
                        )}>
                          {conv.isTyping ? (
                            <>
                              <span className="animate-pulse">Écrit</span>
                              <span className="flex gap-0.5">
                                <span className="block w-0.5 h-0.5 rounded-full bg-primary animate-bounce" />
                                <span className="block w-0.5 h-0.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                                <span className="block w-0.5 h-0.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                              </span>
                            </>
                          ) : (
                            conv.lastMessage
                          )}
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {conv.unread && (
                        <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-md animate-fade-in px-1">
                          1
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
