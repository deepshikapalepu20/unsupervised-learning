"""
schemas.py — Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional


# ── Request Models ────────────────────────────────────────────

class GPSPoint(BaseModel):
    lat: float = Field(..., ge=40.4, le=41.0, description="Latitude (NYC range)")
    lon: float = Field(..., ge=-74.3, le=-73.7, description="Longitude (NYC range)")


class PredictRequest(BaseModel):
    points:      List[GPSPoint] = Field(..., min_items=10, description="List of GPS coordinates")
    epsilon_km:  float          = Field(default=0.3,  ge=0.05, le=2.0)
    min_samples: int            = Field(default=15,   ge=2,    le=100)

    class Config:
        json_schema_extra = {
            "example": {
                "points": [
                    {"lat": 40.7580, "lon": -73.9855},
                    {"lat": 40.7589, "lon": -73.9851},
                    {"lat": 40.7571, "lon": -73.9862}
                ],
                "epsilon_km":  0.3,
                "min_samples": 5
            }
        }


# ── Response Models ───────────────────────────────────────────

class ClusterPoint(BaseModel):
    lat:        float
    lon:        float
    cluster_id: int
    is_noise:   bool


class ClusterCentroid(BaseModel):
    cluster_id: int
    center_lat: float
    center_lon: float
    point_count: int
    severity:   str


class PredictResponse(BaseModel):
    n_clusters:      int
    n_noise:         int
    noise_pct:       float
    silhouette_score: Optional[float]
    points:          List[ClusterPoint]
    centroids:       List[ClusterCentroid]
    epsilon_km:      float
    min_samples:     int


#  ADD THIS CLASS (FIXES YOUR ERROR)

class HotspotResponse(BaseModel):
    cluster: int
    center_lat: float
    center_lon: float
    trip_count: int
    avg_speed: float
    avg_duration: float
    peak_hour: int
    severity: str


# (Optional — keep your existing one too)

class HotspotSummary(BaseModel):
    cluster_id:   int
    center_lat:   float
    center_lon:   float
    trip_count:   int
    avg_speed:    float
    avg_duration: float
    peak_hour:    int
    severity:     str


class StatsResponse(BaseModel):
    total_trips:          int
    congestion_trips:     int
    congestion_pct:       float
    total_clusters:       int
    high_severity_zones:  int
    med_severity_zones:   int
    low_severity_zones:   int
    worst_hour:           int
    avg_congestion_speed: float