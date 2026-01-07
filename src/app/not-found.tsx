import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, MessageSquare, BarChart3, Users } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E6EE] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 visual */}
        <div className="mb-8">
          <div className="text-9xl font-black text-slate-200 select-none">
            404
          </div>
          <div className="relative -mt-8">
            <Search className="h-16 w-16 text-slate-400 mx-auto" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Page introuvable
        </h1>
        <p className="text-slate-600 mb-8">
          Oups ! La page que vous recherchez n&apos;existe pas ou a ete deplacee.
        </p>

        {/* Quick links */}
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500 mb-4">
            Peut-etre cherchiez-vous :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-3 rounded-lg bg-white/50 hover:bg-white/80 border border-white/60 transition-colors group"
            >
              <BarChart3 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-700">Dashboard</span>
            </Link>
            <Link
              href="/dashboard/conversations"
              className="flex items-center gap-2 p-3 rounded-lg bg-white/50 hover:bg-white/80 border border-white/60 transition-colors group"
            >
              <MessageSquare className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-700">Conversations</span>
            </Link>
            <Link
              href="/dashboard/contacts"
              className="flex items-center gap-2 p-3 rounded-lg bg-white/50 hover:bg-white/80 border border-white/60 transition-colors group"
            >
              <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-700">Contacts</span>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
