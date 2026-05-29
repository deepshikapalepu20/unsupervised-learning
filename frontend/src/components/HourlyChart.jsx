/**
 * components/HourlyChart.jsx
 * Area + bar chart for congestion trip distribution by hour
 */

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { BarChart2, TrendingUp } from "lucide-react";
import { useHourly } from "../hooks/useTrafficData";

const PEAK_HOURS = [7, 8, 9, 16, 17, 18, 19];

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-amber mb-1">{`${label}:00 – ${label + 1}:00`}</div>
      <div className="text-white">{val?.toLocaleString()} trips</div>
      {PEAK_HOURS.includes(Number(label)) && (
        <div className="text-heat mt-0.5">⚠ Peak window</div>
      )}
    </div>
  );
}

export default function HourlyChart() {
  const { data, loading, error } = useHourly();
  const [type, setType] = useState("area");

  if (loading) return (
    <div className="card h-[300px] animate-pulse">
      <div className="w-40 h-4 bg-muted rounded mb-6" />
      <div className="h-48 bg-muted/40 rounded" />
    </div>
  );

  if (error) return (
    <div className="card border-danger/30 text-danger text-sm font-mono p-4">⚠ {error}</div>
  );

  const chartData = (data?.hours || []).map((h, i) => ({
    hour:  h,
    count: data.counts[i],
    peak:  PEAK_HOURS.includes(h),
  }));

  const maxHour  = chartData.reduce((a, b) => (b.count > a.count ? b : a), { count: 0 });

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg tracking-wider text-white">
            HOURLY CONGESTION
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Peak at{" "}
            <span className="text-amber">{maxHour.hour}:00</span>
            {" "}— {maxHour.count?.toLocaleString()} trips
          </p>
        </div>
        <div className="flex gap-1">
          {[
            { id: "area", Icon: TrendingUp },
            { id: "bar",  Icon: BarChart2  },
          ].map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`p-1.5 rounded border transition-all
                ${type === id
                  ? "bg-amber/10 border-amber/30 text-amber"
                  : "border-border text-slate-500 hover:text-white"}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        {type === "area" ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2733" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={(h) => `${h}h`}
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Peak hour shading */}
            {PEAK_HOURS.map((h) => (
              <ReferenceLine key={h} x={h} stroke="#FF4500" strokeOpacity={0.15} strokeWidth={8} />
            ))}
            <Area
              type="monotone"
              dataKey="count"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#F59E0B", stroke: "#080A0F", strokeWidth: 2 }}
            />
          </AreaChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2733" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={(h) => `${h}h`}
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              radius={[3, 3, 0, 0]}
              fill="#F59E0B"
              opacity={0.75}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Peak hour legend */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <span className="w-3 h-3 rounded-sm bg-heat/20 border border-heat/30 block" />
        <span className="text-xs font-mono text-slate-500">Peak windows: 7–10 AM · 4–8 PM</span>
      </div>
    </div>
  );
}
