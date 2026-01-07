import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ConversationAnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-52" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Charts Row 1 - Status & Intent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>

      {/* Resolution Time */}
      <Card className="p-6">
        <Skeleton className="h-5 w-56 mb-4" />
        <Skeleton className="h-72 w-full" />
      </Card>

      {/* Heatmap */}
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </Card>
    </div>
  );
}
