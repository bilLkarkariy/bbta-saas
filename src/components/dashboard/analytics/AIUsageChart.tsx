"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface AIUsageChartProps {
  data: { tier: string; count: number; cost: number }[];
  loading?: boolean;
}

const COLORS = {
  tier1: "#10b981", // emerald
  tier2: "#3b82f6", // blue
  tier3: "#8b5cf6", // violet
};

const TIER_LABELS: Record<string, string> = {
  tier1: "Tier 1 (Rapide)",
  tier2: "Tier 2 (Standard)",
  tier3: "Tier 3 (Avance)",
};

export function AIUsageChart({ data, loading }: AIUsageChartProps) {
  if (loading) {
    return (
      <Card className="glass-card border-none">
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="h-[300px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
  const totalRequests = data.reduce((sum, d) => sum + d.count, 0);

  const chartData = data.map((d) => ({
    name: TIER_LABELS[d.tier] || d.tier,
    value: d.count,
    cost: d.cost,
    color: COLORS[d.tier as keyof typeof COLORS] || "#94a3b8",
  }));

  return (
    <Card className="glass-card border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-label">
          Usage IA par Tier
        </CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <div className="text-stat-secondary text-foreground">
              {totalRequests.toLocaleString("fr-FR")}
            </div>
            <div className="text-meta">requetes</div>
          </div>
          <div className="border-l pl-4">
            <div className="text-stat-secondary text-foreground">
              {totalCost.toLocaleString("fr-FR", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-meta">cout total</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[250px]">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Aucune donnee disponible
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value, name, props) => [
                  <>
                    <span className="font-bold">
                      {(value as number).toLocaleString("fr-FR")}
                    </span>{" "}
                    requetes
                    <br />
                    <span className="text-muted-foreground">
                      Cout:{" "}
                      {(props.payload as { cost: number }).cost.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  </>,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-body">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
