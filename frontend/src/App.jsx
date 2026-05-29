/**
 * App.jsx — Root layout with tab-based navigation
 * Tabs: Dashboard | Live Map | Analytics | Model Explorer
 */

import React, { useState } from "react";
import Header      from "./components/Header";
import StatsCards  from "./components/StatsCards";
import MapView     from "./components/MapView";
import HourlyChart from "./components/HourlyChart";
import HotspotTable from "./components/HotspotTable";
import ModelExplorer from "./components/ModelExplorer";

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, sub, children }) {
  return (
    <section className="space-y-3">
      {(title || sub) && (
        <div className="flex items-baseline gap-3">
          {title && (
            <h2 className="font-display text-xl tracking-widest text-white">{title}</h2>
          )}
          {sub && (
            <span className="text-xs font-mono text-slate-600 uppercase tracking-widest">
              {sub}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// ── Tab: Dashboard ────────────────────────────────────────────
function DashboardTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Section title="OVERVIEW" sub="Key performance indicators">
        <StatsCards />
      </Section>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="LIVE MAP" sub="Congestion hotspots">
          <MapView />
        </Section>
        <div className="space-y-4">
          <Section title="TIME PATTERN" sub="Trips by hour">
            <HourlyChart />
          </Section>
        </div>
      </div>

      <Section title="HOTSPOT ZONES" sub="All clusters">
        <HotspotTable />
      </Section>
    </div>
  );
}

// ── Tab: Live Map ─────────────────────────────────────────────
function MapTab() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="LIVE MAP" sub="Full-screen congestion view">
        <div className="h-[calc(100vh-12rem)]">
          <MapView />
        </div>
      </Section>
    </div>
  );
}

// ── Tab: Analytics ────────────────────────────────────────────
function AnalyticsTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Section title="OVERVIEW" sub="Key performance indicators">
        <StatsCards />
      </Section>
      <Section title="HOURLY CONGESTION" sub="Trip distribution by hour">
        <HourlyChart />
      </Section>
      <Section title="HOTSPOT TABLE" sub="All detected zones">
        <HotspotTable />
      </Section>
    </div>
  );
}

// ── Tab: Model Explorer ───────────────────────────────────────
function ExplorerTab() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="MODEL EXPLORER" sub="Re-run DBSCAN with custom parameters">
        <div className="card border-amber/10 mb-4">
          <p className="text-xs font-mono text-slate-500 leading-relaxed">
            <span className="text-amber">How it works:</span> This panel calls{" "}
            <code className="text-cool bg-surface px-1 rounded">POST /rerun</code> on
            your FastAPI backend with the selected parameters. DBSCAN re-clusters a
            sample of congestion trips in real time — watch how epsilon and MinPts
            affect cluster count, noise, and silhouette score.
          </p>
        </div>
        <ModelExplorer />
      </Section>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");

  const tabContent = {
    dashboard: <DashboardTab />,
    map:       <MapTab />,
    analytics: <AnalyticsTab />,
    explorer:  <ExplorerTab />,
  };

  return (
    <div className="min-h-screen bg-void">
      <Header activeTab={tab} setActiveTab={setTab} />

      {/* ── Page hero strip ──────────────────────── */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber/5 via-transparent to-heat/5 pointer-events-none" />
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl tracking-widest">
              <span className="gradient-text">NYC CONGESTION</span>
              <span className="text-slate-500 ml-3 text-xl">INTELLIGENCE</span>
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1">
              DBSCAN · Isolation Forest · Haversine Clustering · NYC Taxi Dataset
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        {tabContent[tab]}
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-border mt-12 py-4">
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between
                        flex-wrap gap-2">
          <span className="text-xs font-mono text-slate-600">
            TrafficOps v1.0 · DBSCAN Congestion Intelligence · NYC Taxi Dataset
          </span>
          <span className="text-xs font-mono text-slate-700">
            Backend: FastAPI · ML: scikit-learn · Maps: Leaflet · Charts: Recharts
          </span>
        </div>
      </footer>
    </div>
  );
}
