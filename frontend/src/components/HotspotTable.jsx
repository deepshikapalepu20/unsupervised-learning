/**
 * components/HotspotTable.jsx
 * Sortable table of congestion hotspots from GET /hotspots
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useHotspots } from "../hooks/useTrafficData";

const COLS = [
  { key: "cluster_id",   label: "#",        align: "left"  },
  { key: "severity",     label: "Severity", align: "left"  },
  { key: "trip_count",   label: "Trips",    align: "right" },
  { key: "avg_speed",    label: "Avg Speed",align: "right" },
  { key: "avg_duration", label: "Avg Dur",  align: "right" },
  { key: "peak_hour",    label: "Peak Hr",  align: "right" },
  { key: "center_lat",   label: "Lat",      align: "right" },
  { key: "center_lon",   label: "Lon",      align: "right" },
];

function SeverityBadge({ s }) {
  const map = { HIGH: "badge-high", MEDIUM: "badge-medium", LOW: "badge-low" };
  return <span className={map[s] || "badge-low"}>{s}</span>;
}

function SortIcon({ col, sortCol, dir }) {
  if (sortCol !== col) return <ChevronsUpDown size={12} className="text-slate-600" />;
  return dir === "asc"
    ? <ChevronUp size={12} className="text-amber" />
    : <ChevronDown size={12} className="text-amber" />;
}

export default function HotspotTable() {
  const [severity,  setSeverity]  = useState("ALL");
  const [sortCol,   setSortCol]   = useState("trip_count");
  const [sortDir,   setSortDir]   = useState("desc");
  const [page,      setPage]      = useState(0);
  const PAGE_SIZE = 10;

  const { data, loading, error } = useHotspots(
    severity !== "ALL" ? { severity, limit: 100 } : { limit: 100 }
  );

  const sorted = [...(data || [])].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const pages  = Math.ceil(sorted.length / PAGE_SIZE);
  const paged  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key) => {
    if (sortCol === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(key); setSortDir("desc"); }
    setPage(0);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-display text-lg tracking-wider text-white">HOTSPOT TABLE</h3>
          <p className="text-xs font-mono text-slate-500">
            {sorted.length} zones · click column to sort
          </p>
        </div>
        <div className="flex gap-1">
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <button
              key={s}
              onClick={() => { setSeverity(s); setPage(0); }}
              className={`text-xs font-mono px-2.5 py-1 rounded border transition-all
                ${severity === s
                  ? "bg-amber/10 border-amber/30 text-amber"
                  : "border-border text-slate-500 hover:text-white"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center text-amber font-mono text-sm">
          <div className="w-4 h-4 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-danger text-sm font-mono py-4">⚠ {error}</div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border">
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`
                        px-4 py-2.5 text-xs font-mono text-slate-500 uppercase tracking-widest
                        cursor-pointer select-none hover:text-amber transition-colors whitespace-nowrap
                        text-${col.align}
                      `}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon col={col.key} sortCol={sortCol} dir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((h, i) => (
                  <tr
                    key={h.cluster_id}
                    className={`border-b border-border/50 hover:bg-surface/50 transition-colors
                      ${i % 2 === 0 ? "bg-transparent" : "bg-surface/20"}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-400 text-xs">
                      #{h.cluster_id}
                    </td>
                    <td className="px-4 py-2.5">
                      <SeverityBadge s={h.severity} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-white">
                      {h.trip_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-cool text-xs">
                      {h.avg_speed.toFixed(1)} km/h
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-400 text-xs">
                      {h.avg_duration} min
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-warn text-xs">
                      {h.peak_hour}:00
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500 text-xs">
                      {h.center_lat.toFixed(4)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500 text-xs">
                      {h.center_lon.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className="text-xs font-mono text-slate-500">
                Page {page + 1} of {pages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-xs font-mono border border-border rounded
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:border-amber hover:text-amber transition-colors"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= pages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs font-mono border border-border rounded
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:border-amber hover:text-amber transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
