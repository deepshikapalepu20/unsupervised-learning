/**
 * components/ModelExplorer.jsx
 * Interactive DBSCAN parameter tuning — sliders call POST /rerun
 */

import React, { useState, useCallback } from "react";
import { Play, RefreshCw, Info } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis,
  ZAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useModelExplorer } from "../hooks/useTrafficData";

const SEVERITY_COLORS = {
  HIGH:   "#EF4444",
  MEDIUM: "#F59E0B",
  LOW:    "#22C55E",
};

function Slider({ label, value, min, max, step, onChange, unit, hint }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-mono text-slate-300">{label}</span>
          {hint && <p className="text-xs text-slate-600 mt-0.5">{hint}</p>}
        </div>
        <span className="text-sm font-mono text-amber bg-amber/10 border border-amber/20
                         px-2 py-0.5 rounded tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] font-mono text-slate-600">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, sub, color = "#F59E0B" }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3 text-center">
      <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="stat-value text-2xl" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] font-mono text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ModelExplorer() {
  const [epsilon,     setEpsilon]     = useState(0.3);
  const [minSamples,  setMinSamples]  = useState(15);
  const [sampleSize,  setSampleSize]  = useState(5000);

  const { result, loading, error, run } = useModelExplorer();

  const handleRun = useCallback(() => {
    run(epsilon, minSamples, sampleSize);
  }, [epsilon, minSamples, sampleSize, run]);

  // Build scatter data from centroids
  const scatterData = result?.centroids?.map((c) => ({
    x:    c.center_lon,
    y:    c.center_lat,
    z:    c.point_count,
    sev:  c.severity,
    id:   c.cluster_id,
  })) || [];

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">

        {/* ── Controls ──────────────────────────────── */}
        <div className="card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wider text-white">
              MODEL EXPLORER
            </h3>
            <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
              <Info size={12} />
              <span>Tune DBSCAN live</span>
            </div>
          </div>

          <Slider
            label="Epsilon (ε)"
            value={epsilon}
            min={0.1} max={1.5} step={0.05}
            onChange={setEpsilon}
            unit=" km"
            hint="Search radius — larger = fewer, bigger clusters"
          />
          <Slider
            label="Min Samples"
            value={minSamples}
            min={5} max={50} step={1}
            onChange={setMinSamples}
            unit=""
            hint="Min points to form a cluster core"
          />
          <Slider
            label="Sample Size"
            value={sampleSize}
            min={1000} max={20000} step={1000}
            onChange={setSampleSize}
            unit=" pts"
            hint="More points = slower but more accurate"
          />

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full py-3 rounded-lg font-mono text-sm font-medium
                       bg-amber text-void hover:bg-amber/90
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 transition-all
                       active:scale-[0.98]"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Running DBSCAN...
              </>
            ) : (
              <>
                <Play size={15} />
                Run Clustering
              </>
            )}
          </button>

          {error && (
            <div className="text-danger text-xs font-mono bg-danger/10 border
                            border-danger/20 rounded p-2">
              ⚠ {error}
            </div>
          )}

          {/* ── Parameter guide ───────────────────── */}
          <div className="bg-surface border border-border rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Parameter Guide
            </p>
            <div className="space-y-1.5 text-xs font-mono text-slate-500">
              <div>
                <span className="text-amber">ε small</span> → many small clusters, high noise
              </div>
              <div>
                <span className="text-amber">ε large</span> → few mega-clusters, low noise
              </div>
              <div>
                <span className="text-cool">MinPts high</span> → only dense zones clustered
              </div>
              <div>
                <span className="text-safe">Target</span>: noise &lt; 30%, silhouette &gt; 0.3
              </div>
            </div>
          </div>
        </div>

        {/* ── Results ───────────────────────────────── */}
        <div className="card">
          <h3 className="font-display text-lg tracking-wider text-white mb-4">
            CLUSTER RESULTS
          </h3>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <Play size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-mono">Press Run Clustering to see results</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-2 border-amber border-t-transparent
                              rounded-full animate-spin" />
              <p className="text-sm font-mono text-amber">Computing clusters...</p>
              <p className="text-xs font-mono text-slate-600">
                ε={epsilon} km · MinPts={minSamples} · {sampleSize} points
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-fade-in">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-2">
                <ResultCard label="Clusters"        value={result.n_clusters}                  color="#F59E0B" />
                <ResultCard label="Noise %"         value={`${result.noise_pct}%`}             color={result.noise_pct > 40 ? "#EF4444" : "#22C55E"} />
                <ResultCard
                  label="Silhouette"
                  value={result.silhouette_score?.toFixed(3) ?? "N/A"}
                  sub={
                    result.silhouette_score
                      ? result.silhouette_score > 0.5 ? "Excellent"
                      : result.silhouette_score > 0.3 ? "Good"
                      : "Weak"
                      : "—"
                  }
                  color={
                    result.silhouette_score > 0.5 ? "#22C55E"
                    : result.silhouette_score > 0.3 ? "#F59E0B"
                    : "#EF4444"
                  }
                />
                <ResultCard label="Noise pts"       value={result.n_noise?.toLocaleString()}  color="#64748b" />
              </div>

              {/* Scatter plot of centroids */}
              {scatterData.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-slate-500 mb-2">
                    Centroid Map ({scatterData.length} clusters)
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis
                        dataKey="x" type="number" domain={[-74.05, -73.75]}
                        tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        tickFormatter={(v) => v.toFixed(2)}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        dataKey="y" type="number" domain={[40.60, 40.90]}
                        tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        tickFormatter={(v) => v.toFixed(2)}
                        axisLine={false} tickLine={false}
                      />
                      <ZAxis dataKey="z" range={[30, 300]} />
                      <Tooltip
                        cursor={false}
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono">
                              <div className="text-amber">Cluster #{d.id}</div>
                              <div className="text-slate-400">{d.z} points · {d.sev}</div>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={scatterData} isAnimationActive={false}>
                        {scatterData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={SEVERITY_COLORS[entry.sev] || "#F59E0B"}
                            fillOpacity={0.75}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
