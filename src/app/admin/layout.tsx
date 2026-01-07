import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { user } = await requireSuperAdmin();

    return (
      <div className="min-h-screen bg-gray-950">
        {/* Admin Header */}
        <header className="border-b border-white/10 bg-gray-900/50 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="text-white font-semibold">Super Admin</span>
                </div>
                <nav className="flex items-center gap-6 ml-8">
                  <Link
                    href="/admin"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Tenants
                  </Link>
                  <Link
                    href="/admin/stats"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Stats
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {user.email}
                </span>
                <Link
                  href="/dashboard"
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    );
  } catch {
    redirect("/dashboard");
  }
}
