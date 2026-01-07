"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface StatsCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  description?: string;
  chartData?: { value: number }[];
  variant?: "default" | "elevated" | "premium" | "glass";
}

export function StatsCard({
  title,
  value,
  trend,
  trendUp,
  icon,
  description,
  chartData,
  variant = "default"
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;

  // Simple count-up animation with cleanup
  useEffect(() => {
    let animationId: number;
    const start = 0;
    const end = numericValue;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);

      const current = Math.floor(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [numericValue]);

  // Format display value back to string (preserving generic formatting if simple number)
  // Note: detailed formatting vs string preservation is tricky without a formatter prop, 
  // but for this specific "1,247" style we can just simulate locale string if it was numeric.
  const formattedValue = isNaN(Number(value.replace(/,/g, '')))
    ? value
    : displayValue.toLocaleString('fr-FR') + (value.includes('%') ? '%' : '');

  return (
    <Card
      className="glass-card p-6 overflow-hidden border-none group relative"
      role="article"
      aria-label={`${title}: ${value}${trend ? `, tendance ${trendUp ? 'positive' : 'negative'} de ${trend}` : ''}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between pr-4">
            <p className="text-xs font-bold text-slate-400 group-hover:text-primary transition-colors tracking-widest uppercase">
              {title}
            </p>
            {/* Sparkline (if data provided) */}
            {chartData && (
              <div className="h-8 w-16 opacity-50 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={trendUp === true ? "#10b981" : "#f43f5e"}
                      fill={trendUp === true ? "#10b981" : "#f43f5e"}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold tracking-tight text-slate-800 transition-all duration-300">
              {formattedValue}
            </h3>
          </div>
          {(trend || description) && (
            <div className="flex flex-col gap-1">
              {trend && (
                <div className="flex items-center text-xs">
                  <span
                    className={cn(
                      "font-bold px-2 py-0.5 rounded-lg flex items-center gap-1",
                      trendUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                    )}
                  >
                    {trendUp ? "↑" : "↓"} {trend}
                  </span>
                  <span className="text-slate-400 ml-2 text-[10px] uppercase font-semibold tracking-wider">
                    vs mois dernier
                  </span>
                </div>
              )}
              {description && (
                <p className="text-xs text-slate-400 font-medium opacity-80">{description}</p>
              )}
            </div>
          )}
        </div>
        <div
          className="h-14 w-14 rounded-full bg-gradient-to-b from-white to-slate-50 flex items-center justify-center text-primary shadow-sm border border-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
