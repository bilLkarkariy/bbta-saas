"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholder for charts
function ChartLoadingPlaceholder({ height = 300 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height }}>
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}

// Lazy load ConversationChart
export const LazyConversationChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/ConversationChart").then(
      (mod) => mod.ConversationChart
    ),
  {
    loading: () => <ChartLoadingPlaceholder height={300} />,
    ssr: false,
  }
);

// Lazy load AIUsageChart
export const LazyAIUsageChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/AIUsageChart").then(
      (mod) => mod.AIUsageChart
    ),
  {
    loading: () => <ChartLoadingPlaceholder height={300} />,
    ssr: false,
  }
);

// Lazy load ConversationBreakdown
export const LazyConversationBreakdown = dynamic(
  () =>
    import("@/components/dashboard/analytics/ConversationBreakdown").then(
      (mod) => mod.ConversationBreakdown
    ),
  {
    loading: () => <ChartLoadingPlaceholder height={250} />,
    ssr: false,
  }
);

// Lazy load HeatmapChart
export const LazyHeatmapChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/HeatmapChart").then(
      (mod) => mod.HeatmapChart
    ),
  {
    loading: () => <ChartLoadingPlaceholder height={200} />,
    ssr: false,
  }
);

// Lazy load ResolutionTimeChart
export const LazyResolutionTimeChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/ResolutionTimeChart").then(
      (mod) => mod.ResolutionTimeChart
    ),
  {
    loading: () => <ChartLoadingPlaceholder height={200} />,
    ssr: false,
  }
);

// Lazy load ChartWidget (dashboard overview chart)
export const LazyChartWidget = dynamic(
  () =>
    import("@/components/dashboard/ChartWidget").then((mod) => mod.ChartWidget),
  {
    loading: () => <ChartLoadingPlaceholder height={350} />,
    ssr: false,
  }
);
