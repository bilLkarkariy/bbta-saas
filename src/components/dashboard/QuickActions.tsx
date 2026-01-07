"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const router = useRouter();

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Cmd (Mac) or Ctrl (Windows)
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          router.push('/dashboard/campaigns/new');
          break;
        case 'k':
          e.preventDefault();
          router.push('/dashboard/contacts/new');
          break;
        case 't':
          e.preventDefault();
          router.push('/dashboard/templates');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const actions = [
    {
      label: "Nouvelle Campagne",
      icon: Plus,
      color: "from-primary/20 to-primary/10 text-primary ring-primary/20",
      href: "/dashboard/campaigns/new",
      shortcut: "⌘N"
    },
    {
      label: "Ajouter Contact",
      icon: UserPlus,
      color: "from-emerald-500/20 to-emerald-500/10 text-emerald-600 ring-emerald-500/20",
      href: "/dashboard/contacts/new",
      shortcut: "⌘K"
    },
    {
      label: "Utiliser Modèle",
      icon: FileText,
      color: "from-blue-500/20 to-blue-500/10 text-blue-600 ring-blue-500/20",
      href: "/dashboard/templates",
      shortcut: "⌘T"
    },
  ];

  return (
    <Card className="glass-card h-full overflow-hidden relative border-none">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500 fill-amber-500/20" aria-hidden="true" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 relative z-10 px-6 pb-6">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant="outline"
            className="w-full justify-between group h-16 border-transparent hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 bg-white/40 hover:bg-white backdrop-blur-md rounded-2xl p-4 shadow-sm"
            onClick={() => router.push(action.href)}
            aria-label={`${action.label} (${action.shortcut})`}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br ring-1 ring-white/60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                action.color
              )}>
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-bold text-sm text-slate-700">{action.label}</span>
            </div>

            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 font-mono text-[10px] font-black text-slate-400 opacity-70 group-hover:opacity-100 group-hover:bg-white transition-all shadow-inner">
              {action.shortcut}
            </kbd>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
