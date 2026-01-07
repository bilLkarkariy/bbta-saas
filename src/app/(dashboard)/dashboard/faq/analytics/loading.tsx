import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function FAQAnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div>
            <Skeleton className="h-8 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-8 w-20" />
          </Card>
        ))}
      </div>

      {/* Most Asked FAQs */}
      <Card className="p-6">
        <Skeleton className="h-5 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <Skeleton className="h-4 w-64" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-2 w-32 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  );
}
