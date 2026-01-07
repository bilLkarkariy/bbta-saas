"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BreakdownData {
  status?: string;
  intent?: string;
  count: number;
}

interface ConversationBreakdownProps {
  data: BreakdownData[];
  type: "status" | "intent";
  title: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#3B82F6",
  resolved: "#22C55E",
  escalated: "#F97316",
  archived: "#6B7280",
};

const INTENT_COLORS: Record<string, string> = {
  FAQ: "#8B5CF6",
  BOOKING: "#F97316",
  LEAD_CAPTURE: "#22C55E",
  SUPPORT: "#3B82F6",
  ESCALATE: "#EF4444",
  UNKNOWN: "#6B7280",
  GREETING: "#EC4899",
  OTHER: "#71717A",
};

export function ConversationBreakdown({
  data,
  type,
  title,
}: ConversationBreakdownProps) {
  const colors = type === "status" ? STATUS_COLORS : INTENT_COLORS;

  const chartData = data.map((item) => ({
    name: item.status || item.intent || "Unknown",
    value: item.count,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Aucune donnee disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[entry.name] || "#6B7280"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value as number, "Conversations"]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
