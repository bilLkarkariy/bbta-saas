"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChevronDown, Calendar } from "lucide-react";

// French day names
const weeklyData = [
  { name: "Lun", value: 4000 },
  { name: "Mar", value: 3000 },
  { name: "Mer", value: 2000 },
  { name: "Jeu", value: 2780 },
  { name: "Ven", value: 1890 },
  { name: "Sam", value: 2390 },
  { name: "Dim", value: 3490 },
];

const monthlyData = [
  { name: "S1", value: 12000 },
  { name: "S2", value: 15000 },
  { name: "S3", value: 11000 },
  { name: "S4", value: 18000 },
];

type Period = "7days" | "30days";

const periodConfig = {
  "7days": { label: "7 derniers jours", data: weeklyData },
  "30days": { label: "30 derniers jours", data: monthlyData },
};

export function ChartWidget() {
  const [period, setPeriod] = useState<Period>("7days");
  const data = periodConfig[period].data;
  const totalMessages = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="glass-card flex-1 min-h-[400px] flex flex-col relative overflow-hidden group border-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-400 tracking-widest uppercase">
            Activité Hebdomadaire
          </CardTitle>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 bg-white/60 border-none hover:bg-white text-slate-600 font-semibold text-xs gap-1.5 rounded-lg shadow-sm transition-all"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {periodConfig[period].label}
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                onClick={() => setPeriod("7days")}
                className={period === "7days" ? "bg-primary/5 text-primary font-semibold" : ""}
              >
                7 derniers jours
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPeriod("30days")}
                className={period === "30days" ? "bg-primary/5 text-primary font-semibold" : ""}
              >
                30 derniers jours
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-baseline gap-3 mt-3">
          <h2
            className="text-5xl font-bold tracking-tight text-slate-800 tabular-nums"
            aria-label={`${totalMessages.toLocaleString('fr-FR')} messages`}
          >
            {totalMessages.toLocaleString('fr-FR')}
          </h2>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shadow-sm">
            ↑ 12%
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 relative z-10 pt-4">
        <div
          className="absolute inset-0 pb-6 pr-6 pl-2"
          role="img"
          aria-label="Graphique d'activité"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'oklch(0.55 0.02 260)', fontSize: 11, fontWeight: 600 }}
                dy={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 20px 40px -15px rgba(30, 58, 138, 0.1)',
                  padding: '16px',
                }}
                itemStyle={{ color: 'oklch(0.25 0.015 260)', fontWeight: 700, fontSize: '14px' }}
                cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '4 4', opacity: 0.3 }}
                formatter={(value) => [`${(value as number).toLocaleString('fr-FR')}`, 'Messages']}
                labelStyle={{ color: 'oklch(0.45 0.015 260)', marginBottom: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 8, strokeWidth: 4, stroke: 'white', fill: 'var(--primary)', fillOpacity: 1 }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
