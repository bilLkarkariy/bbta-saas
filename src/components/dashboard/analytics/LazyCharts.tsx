"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for charts
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card className="glass-card border-none">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent style={{ height }}>
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  );
}

// Loading skeleton for pie charts
function PieChartSkeleton() {
  return (
    <Card className="glass-card border-none">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <div className="relative">
          <Skeleton className="h-48 w-48 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-24 w-24 rounded-full bg-background" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Lazy load ConversationChart
export const LazyConversationChart = dynamic(
  () => import("./ConversationChart").then((mod) => mod.ConversationChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Lazy load AIUsageChart
export const LazyAIUsageChart = dynamic(
  () => import("./AIUsageChart").then((mod) => mod.AIUsageChart),
  {
    loading: () => <PieChartSkeleton />,
    ssr: false,
  }
);

// Lazy load ConversationBreakdown
export const LazyConversationBreakdown = dynamic(
  () => import("./ConversationBreakdown").then((mod) => mod.ConversationBreakdown),
  {
    loading: () => <PieChartSkeleton />,
    ssr: false,
  }
);
