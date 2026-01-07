"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ResolutionTimeData {
  bucket: string;
  count: number;
}

interface ResolutionTimeChartProps {
  data: ResolutionTimeData[];
}

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Calculate statistics
  const fastResolutions = data
    .filter((d) => d.bucket.includes("min") && !d.bucket.includes("30"))
    .reduce((sum, d) => sum + d.count, 0);
  const fastRate = total > 0 ? (fastResolutions / total) * 100 : 0;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Distribution du temps de resolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Aucune conversation resolue
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Distribution du temps de resolution
        </CardTitle>
        <CardDescription>
          {fastRate.toFixed(0)}% des conversations resolues en moins de 30 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal">
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [value as number, "Conversations"]}
                labelStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-2xl font-bold text-success">
              {fastResolutions}
            </div>
            <div className="text-meta">
              Resolution rapide (&lt; 30min)
            </div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-meta">
              Total resolues
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
