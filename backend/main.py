"""
============================================================
 WEEK 2 — FastAPI Backend for Traffic Congestion Dashboard
 File: main.py
 Run: uvicorn main:app --reload --port 8000
============================================================
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from datetime import datetime

from model import load_model, run_dbscan_predict, get_cluster_stats
from schemas import (
    PredictRequest, PredictResponse,
    HotspotResponse, StatsResponse,
    ClusterPoint, HotspotSummary
)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ── App Init ─────────────────────────────────────────────────
app = FastAPI(
    title="🚦 NYC Traffic Congestion API",
    description="DBSCAN-powered congestion hotspot detection for NYC taxi data.",
    version="1.0.0",
    docs_url="/docs",        # Swagger UI  → http://localhost:8000/docs
    redoc_url="/redoc"       # ReDoc UI    → http://localhost:8000/redoc
)

# ── CORS (allow React frontend on port 3000) ─────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model & data on startup ─────────────────────────────
@app.on_event("startup")
async def startup_event():
    print("🚀 Loading DBSCAN model and cluster data...")
    app.state.model_data = load_model()
    print("✅ Model ready!")


# ═══════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
def root():
    return {
        "status":  "running",
        "message": "NYC Traffic Congestion API is live 🚦",
        "docs":    "/docs",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status":    "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": app.state.model_data is not None
    }


# ── /predict ─────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse, tags=["ML Model"])
def predict(request: PredictRequest):
    """
    Run DBSCAN clustering on submitted GPS coordinates.

    Send a list of lat/lon points → get back cluster labels,
    hotspot centroids, and severity scores.
    """
    try:
        result = run_dbscan_predict(
            points      = request.points,
            epsilon_km  = request.epsilon_km,
            min_samples = request.min_samples
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── /hotspots ─────────────────────────────────────────────────
@app.get("/hotspots", response_model=List[HotspotSummary], tags=["Hotspots"])
def get_hotspots(
    limit:    int   = Query(default=20,  ge=1,  le=100, description="Max hotspots to return"),
    severity: str   = Query(default="ALL", description="Filter: HIGH | MEDIUM | LOW | ALL"),
    hour:     Optional[int] = Query(default=None, ge=0, le=23, description="Filter by peak hour")
):
    """
    Return pre-computed congestion hotspots from Week 1 analysis.
    Supports filtering by severity and peak hour.
    """
    df = app.state.model_data["cluster_summary"].copy()

    if severity != "ALL":
        df = df[df["severity"] == severity.upper()]

    if hour is not None:
        df = df[df["peak_hour"] == hour]

    df = df.head(limit)

    return [
        HotspotSummary(
            cluster_id  = int(row["cluster"]),
            center_lat  = float(row["center_lat"]),
            center_lon  = float(row["center_lon"]),
            trip_count  = int(row["trip_count"]),
            avg_speed   = float(row["avg_speed"]),
            avg_duration= float(row["avg_duration"]),
            peak_hour   = int(row["peak_hour"]),
            severity    = str(row["severity"])
        )
        for _, row in df.iterrows()
    ]


# ── /stats ────────────────────────────────────────────────────
@app.get("/stats", response_model=StatsResponse, tags=["Analytics"])
def get_stats():
    """
    Return overall dataset statistics for the dashboard summary cards.
    """
    data = app.state.model_data
    df   = data["cluster_summary"]
    meta = data["meta"]

    return StatsResponse(
        total_trips         = meta["total_trips"],
        congestion_trips    = meta["congestion_trips"],
        congestion_pct      = meta["congestion_pct"],
        total_clusters      = int(len(df)),
        high_severity_zones = int((df["severity"] == "HIGH").sum()),
        med_severity_zones  = int((df["severity"] == "MEDIUM").sum()),
        low_severity_zones  = int((df["severity"] == "LOW").sum()),
        worst_hour          = int(df.groupby("peak_hour")["trip_count"].sum().idxmax()),
        avg_congestion_speed= float(df["avg_speed"].mean().round(2))
    )


# ── /hourly ────────────────────────────────────────────────────
@app.get("/hourly", tags=["Analytics"])
def get_hourly_distribution():
    """
    Returns trip count by hour of day — used for time-series chart.
    """
    data = app.state.model_data
    hourly = data.get("hourly_distribution", {})
    return {
        "hours":  list(hourly.keys()),
        "counts": list(hourly.values()),
        "label":  "Congested Trips by Hour"
    }


# ── /clusters/{cluster_id} ────────────────────────────────────
@app.get("/clusters/{cluster_id}", tags=["Hotspots"])
def get_cluster_detail(cluster_id: int):
    """
    Return detailed info about a specific cluster by ID.
    """
    df = app.state.model_data["cluster_summary"]
    row = df[df["cluster"] == cluster_id]

    if row.empty:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found")

    r = row.iloc[0]
    return {
        "cluster_id":   int(r["cluster"]),
        "center_lat":   float(r["center_lat"]),
        "center_lon":   float(r["center_lon"]),
        "trip_count":   int(r["trip_count"]),
        "avg_speed":    float(r["avg_speed"]),
        "avg_duration": float(r["avg_duration"]),
        "peak_hour":    int(r["peak_hour"]),
        "severity":     str(r["severity"])
    }


# ── /rerun ─────────────────────────────────────────────────────
@app.post("/rerun", tags=["ML Model"])
def rerun_clustering(
    epsilon_km:  float = Query(default=0.3,  ge=0.05, le=2.0),
    min_samples: int   = Query(default=15,   ge=2,    le=100),
    sample_size: int   = Query(default=5000, ge=100,  le=20000)
):
    """
    Re-run DBSCAN with custom parameters on a data sample.
    Used by the Model Explorer panel in the frontend.
    """
    try:
        data   = app.state.model_data
        sample = data["raw_sample"].sample(
            n=min(sample_size, len(data["raw_sample"])), random_state=42
        )
        points = [
            {"lat": row["pickup_latitude"], "lon": row["pickup_longitude"]}
            for _, row in sample.iterrows()
        ]

        result = run_dbscan_predict(
            points=points, epsilon_km=epsilon_km, min_samples=min_samples
        )
        return {
            "epsilon_km":  epsilon_km,
            "min_samples": min_samples,
            "sample_size": sample_size,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
