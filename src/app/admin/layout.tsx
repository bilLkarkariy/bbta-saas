import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import Link from "next/link";
import { Shield, BarChart3, Building2, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { user } = await requireSuperAdmin();

    return (
      <div className="h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E6EE] relative overflow-hidden grain flex flex-col">
        {/* Ambient Lighting - Admin uses red/orange tint */}
        <div className="absolute top-[20%] right-[-5%] w-[600px] h-[600px] bg-red-300/15 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-200/10 rounded-full blur-[100px] pointer-events-none z-0" />

        {/* Admin Header Bar */}
        <header className="relative z-20 border-b border-red-200/50 bg-white/60 backdrop-blur-xl shrink-0">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Admin Badge */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Super Admin</span>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Tenants
                    </Button>
                  </Link>
                  <Link href="/admin/conversations">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Conversations
                    </Button>
                  </Link>
                  <Link href="/admin/stats">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Stats
                    </Button>
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">{user.email}</span>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    );
  } catch {
    redirect("/dashboard");
  }
}
