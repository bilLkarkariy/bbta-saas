import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <main className="space-y-6 p-6">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Skeleton className="hidden md:block w-28 h-20 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 hidden md:flex" />
          <Skeleton className="h-9 w-32" />
        </div>
      </header>

      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </Card>
          ))}
        </div>
      </section>

      {/* Charts & Onboarding */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </Card>
          <Card className="lg:col-span-1 p-6">
            <Skeleton className="h-5 w-36 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="h-2 w-full rounded-full mt-4" />
          </Card>
        </div>
      </section>

      {/* Recent Activity & Quick Actions */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-1 p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
