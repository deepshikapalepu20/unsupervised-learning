/**
 * components/StatsCards.jsx
 * Row of KPI summary cards fetched from GET /stats
 */

import React from "react";
import { Car, AlertTriangle, MapPin, Clock, Gauge, TrendingUp } from "lucide-react";
import { useStats } from "../hooks/useTrafficData";

function StatCard({ icon: Icon, label, value, sub, color = "amber", delay = 0 }) {
  const colors = {
    amber:  { icon: "text-amber",  ring: "border-amber/20",  glow: "bg-amber/5"  },
    heat:   { icon: "text-heat",   ring: "border-heat/20",   glow: "bg-heat/5"   },
    cool:   { icon: "text-cool",   ring: "border-cool/20",   glow: "bg-cool/5"   },
    safe:   { icon: "text-safe",   ring: "border-safe/20",   glow: "bg-safe/5"   },
    warn:   { icon: "text-warn",   ring: "border-warn/20",   glow: "bg-warn/5"   },
    danger: { icon: "text-danger", ring: "border-danger/20", glow: "bg-danger/5" },
  };
  const c = colors[color];

  return (
    <div
      className={`card ${c.ring} ${c.glow} animate-slide-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-md bg-surface border border-border`}>
          <Icon size={16} className={c.icon} />
        </div>
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className={`stat-value text-3xl ${c.icon}`}>{value}</div>
      {sub && (
        <div className="text-xs text-slate-500 mt-1 font-mono">{sub}</div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="w-8 h-8 bg-muted rounded mb-3" />
      <div className="w-20 h-8 bg-muted rounded mb-2" />
      <div className="w-28 h-3 bg-muted rounded" />
    </div>
  );
}

export default function StatsCards() {
  const { data, loading, error } = useStats();

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (error) return (
    <div className="card border-danger/30 text-danger text-sm font-mono p-4">
      ⚠ Failed to load stats: {error}
    </div>
  );

  const fmt   = (n)   => n?.toLocaleString() ?? "—";
  const hour  = (h)   => `${h}:00 – ${h + 1}:00`;
  const speed = (s)   => `${s?.toFixed(1)} km/h`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard icon={Car}          label="Total Trips"      value={fmt(data.total_trips)}         sub="in dataset"               color="cool"   delay={0}   />
      <StatCard icon={AlertTriangle} label="Congested"       value={fmt(data.congestion_trips)}    sub={`${data.congestion_pct?.toFixed(1)}% of all trips`} color="heat" delay={80} />
      <StatCard icon={MapPin}        label="Clusters"        value={fmt(data.total_clusters)}      sub="hotspot zones"            color="amber"  delay={160} />
      <StatCard icon={TrendingUp}    label="High Severity"   value={fmt(data.high_severity_zones)} sub="critical zones"           color="danger" delay={240} />
      <StatCard icon={Clock}         label="Worst Hour"      value={hour(data.worst_hour)}         sub="peak congestion window"   color="warn"   delay={320} />
      <StatCard icon={Gauge}         label="Avg Speed"       value={speed(data.avg_congestion_speed)} sub="in congested zones"    color="safe"   delay={400} />
    </div>
  );
}
