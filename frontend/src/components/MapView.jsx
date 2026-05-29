/**
 * components/MapView.jsx
 * Interactive Leaflet map with congestion hotspot markers
 */

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Filter } from "lucide-react";
import { useHotspots } from "../hooks/useTrafficData";
import "leaflet/dist/leaflet.css";

// ── Severity config ───────────────────────────────────────────
const SEV = {
  HIGH:   { color: "#EF4444", fill: "#EF4444", label: "High",   minR: 14, maxR: 28 },
  MEDIUM: { color: "#F59E0B", fill: "#F59E0B", label: "Medium", minR: 9,  maxR: 18 },
  LOW:    { color: "#22C55E", fill: "#22C55E", label: "Low",    minR: 5,  maxR: 12 },
};

function scaleRadius(count, min = 5, max = 40) {
  const clamped = Math.min(Math.max(count, 10), 2000);
  return min + ((clamped - 10) / (2000 - 10)) * (max - min);
}

// Recenter map button
function RecenterButton({ center }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(center, 12)}
      className="absolute bottom-10 right-3 z-[999] bg-panel border border-border
                 text-xs font-mono text-slate-400 hover:text-amber px-2 py-1 rounded
                 transition-colors"
    >
      ⊕ Reset View
    </button>
  );
}

export default function MapView() {
  const [severity, setSeverity]     = useState("ALL");
  const [hoveredId, setHoveredId]   = useState(null);

  const { data: hotspots, loading, error } = useHotspots(
    severity !== "ALL" ? { severity } : {}
  );

  const center = [40.7128, -74.006];

  return (
    <div className="card p-0 overflow-hidden h-[600px] relative">

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-[999] flex items-center gap-2">
        <div className="bg-panel/90 backdrop-blur border border-border rounded-lg px-3 py-2
                        flex items-center gap-2">
          <Filter size={13} className="text-amber" />
          <span className="text-xs font-mono text-slate-400 mr-1">SEVERITY</span>
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`text-xs font-mono px-2 py-0.5 rounded transition-all
                ${severity === s
                  ? "bg-amber/20 text-amber border border-amber/40"
                  : "text-slate-500 hover:text-white"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Count badge */}
        <div className="bg-panel/90 backdrop-blur border border-border rounded-lg px-3 py-2">
          <span className="text-xs font-mono text-slate-400">
            {loading ? "..." : `${hotspots.length} zones`}
          </span>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────── */}
      <div className="absolute bottom-8 left-3 z-[999] bg-panel/90 backdrop-blur
                      border border-border rounded-lg p-3 space-y-1.5">
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
          Severity
        </div>
        {Object.entries(SEV).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full block"
              style={{ background: val.fill, opacity: 0.85 }}
            />
            <span className="text-xs font-mono text-slate-400">{val.label}</span>
          </div>
        ))}
      </div>

      {/* ── Loading overlay ──────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 z-[998] bg-void/60 backdrop-blur-sm
                        flex items-center justify-center">
          <div className="flex items-center gap-3 bg-panel border border-border
                          rounded-lg px-4 py-3">
            <div className="w-4 h-4 border-2 border-amber border-t-transparent
                            rounded-full animate-spin" />
            <span className="text-sm font-mono text-amber">Loading hotspots...</span>
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────── */}
      {error && (
        <div className="absolute inset-0 z-[998] flex items-center justify-center">
          <div className="card border-danger/30 text-danger text-sm font-mono p-4 max-w-sm">
            ⚠ {error}
            <div className="text-slate-500 text-xs mt-1">Is the FastAPI backend running?</div>
          </div>
        </div>
      )}

      {/* ── Map ──────────────────────────────────────────── */}
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          maxZoom={19}
        />

        {hotspots.map((h) => {
          const sev    = SEV[h.severity] || SEV.LOW;
          const radius = scaleRadius(h.trip_count);
          const isHov  = hoveredId === h.cluster_id;

          return (
            <CircleMarker
              key={h.cluster_id}
              center={[h.center_lat, h.center_lon]}
              radius={isHov ? radius + 4 : radius}
              pathOptions={{
                color:       sev.color,
                fillColor:   sev.fill,
                fillOpacity: isHov ? 0.85 : 0.55,
                weight:      isHov ? 2 : 1,
                opacity:     0.9,
              }}
              eventHandlers={{
                mouseover: () => setHoveredId(h.cluster_id),
                mouseout:  () => setHoveredId(null),
              }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[160px]">
                  <div className="font-display text-base tracking-wider text-amber">
                    CLUSTER #{h.cluster_id}
                  </div>
                  <div className="border-t border-border pt-1.5 space-y-1">
                    <Row label="Severity"     value={h.severity}                 color={sev.color} />
                    <Row label="Trips"        value={h.trip_count.toLocaleString()} />
                    <Row label="Avg Speed"    value={`${h.avg_speed.toFixed(1)} km/h`} />
                    <Row label="Avg Duration" value={`${h.avg_duration} min`}    />
                    <Row label="Peak Hour"    value={`${h.peak_hour}:00`}        />
                    <Row label="Coords"       value={`${h.center_lat.toFixed(4)}, ${h.center_lon.toFixed(4)}`} />
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <RecenterButton center={center} />
      </MapContainer>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex justify-between gap-3">
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ color: color || "#e2e8f0", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}
