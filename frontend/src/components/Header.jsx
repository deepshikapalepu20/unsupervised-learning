/**
 * components/Header.jsx
 * Top navigation bar with live status indicator
 */

import React, { useState, useEffect } from "react";
import { Radio, MapPin, AlertTriangle, Menu, X } from "lucide-react";

export default function Header({ activeTab, setActiveTab }) {
  const [time, setTime]     = useState(new Date());
  const [open, setOpen]     = useState(false);

  const tabs = [
    { id: "dashboard",  label: "Dashboard"      },
    { id: "map",        label: "Live Map"        },
    { id: "analytics",  label: "Analytics"       },
    { id: "explorer",   label: "Model Explorer"  },
  ];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-void/90 backdrop-blur-md border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* ── Logo ────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <MapPin size={20} className="text-amber" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-heat animate-pulse-slow" />
          </div>
          <div>
            <span className="font-display text-xl text-white tracking-widest">
              TRAFFIC<span className="text-amber">OPS</span>
            </span>
            <span className="hidden sm:block text-[10px] font-mono text-muted ml-1 tracking-widest uppercase">
              NYC Congestion Intelligence
            </span>
          </div>
        </div>

        {/* ── Nav (desktop) ────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-1.5 text-sm font-body rounded transition-all duration-200
                ${activeTab === tab.id
                  ? "bg-amber/10 text-amber border border-amber/30"
                  : "text-slate-400 hover:text-white hover:bg-surface"}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Right: status + time ─────────────────── */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-surface border border-border rounded px-3 py-1.5">
            <span className="pulse-dot" />
            <span className="text-xs font-mono text-safe">LIVE</span>
          </div>
          <div className="text-xs font-mono text-slate-500">
            {time.toLocaleTimeString("en-US", { hour12: false })}
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-warn">
            <AlertTriangle size={12} />
            <span>NYC — DBSCAN v1.0</span>
          </div>
        </div>

        {/* ── Mobile menu toggle ────────────────────── */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile nav ──────────────────────────────── */}
      {open && (
        <div className="md:hidden border-t border-border bg-panel px-4 py-3 flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setOpen(false); }}
              className={`
                text-left px-3 py-2 rounded text-sm transition-all
                ${activeTab === tab.id
                  ? "bg-amber/10 text-amber"
                  : "text-slate-400 hover:text-white"}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
