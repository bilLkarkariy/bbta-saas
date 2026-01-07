"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeatmapData {
  dayOfWeek: number;
  hour: number;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title?: string;
  description?: string;
}

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapChart({
  data,
  title = "Activite par heure",
  description = "Messages entrants par jour et heure",
}: HeatmapChartProps) {
  // Find max value for color scaling
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Create a map for quick lookup
  const valueMap = new Map<string, number>();
  for (const d of data) {
    valueMap.set(`${d.dayOfWeek}-${d.hour}`, d.value);
  }

  const getIntensity = (value: number) => {
    if (value === 0) return "bg-muted";
    const ratio = value / maxValue;
    if (ratio < 0.2) return "bg-primary/10";
    if (ratio < 0.4) return "bg-primary/25";
    if (ratio < 0.6) return "bg-primary/50";
    if (ratio < 0.8) return "bg-primary/75";
    return "bg-primary";
  };

  const totalMessages = data.reduce((sum, d) => sum + d.value, 0);

  // Find peak hour and day
  const peak = data.reduce(
    (max, d) => (d.value > max.value ? d : max),
    { dayOfWeek: 0, hour: 0, value: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hours header */}
            <div className="flex items-center gap-0.5 mb-1">
              <div className="w-10" /> {/* Spacer for day labels */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-[10px] text-muted-foreground"
                >
                  {hour % 6 === 0 ? `${hour}h` : ""}
                </div>
              ))}
            </div>

            {/* Grid */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-0.5 mb-0.5">
                <div className="w-10 text-xs text-muted-foreground pr-2">
                  {day}
                </div>
                {HOURS.map((hour) => {
                  const value = valueMap.get(`${dayIndex}-${hour}`) || 0;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "flex-1 aspect-square rounded-sm transition-colors",
                        getIntensity(value),
                        "hover:ring-2 hover:ring-primary cursor-pointer"
                      )}
                      title={`${day} ${hour}h: ${value} messages`}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-between mt-4 text-meta">
              <div className="flex items-center gap-2">
                <span>Moins</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded-sm bg-muted" />
                  <div className="w-4 h-4 rounded-sm bg-primary/10" />
                  <div className="w-4 h-4 rounded-sm bg-primary/25" />
                  <div className="w-4 h-4 rounded-sm bg-primary/50" />
                  <div className="w-4 h-4 rounded-sm bg-primary/75" />
                  <div className="w-4 h-4 rounded-sm bg-primary" />
                </div>
                <span>Plus</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Total: {totalMessages} messages</span>
                {peak.value > 0 && (
                  <span>
                    Pic: {DAYS[peak.dayOfWeek]} {peak.hour}h ({peak.value})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
