"""
model.py — DBSCAN model logic, data loading, prediction
"""

import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.metrics import silhouette_score
from pathlib import Path
from typing import List, Dict, Any

# ── Paths ─────────────────────────────────────────────────────
DATA_DIR        = Path(__file__).parent / "data"
CLUSTER_SUMMARY = DATA_DIR / "cluster_summary.csv"
PROCESSED_TRIPS = DATA_DIR / "processed_trips.csv"


def load_model() -> Dict[str, Any]:
    """
    Load pre-computed cluster data from Week 1 outputs.
    Place cluster_summary.csv and processed_trips.csv in ./data/
    """
    if not CLUSTER_SUMMARY.exists():
        raise FileNotFoundError(
            f"cluster_summary.csv not found at {CLUSTER_SUMMARY}\n"
            "Run the Week 1 notebook first to generate this file!"
        )

    # ── Load cluster summary ──────────────────────────────────
    cluster_df = pd.read_csv(CLUSTER_SUMMARY)

    # ── Recalculate severity using percentiles of actual data ─
    q33 = cluster_df["trip_count"].quantile(0.33)
    q66 = cluster_df["trip_count"].quantile(0.66)

    def assign_severity(count):
        if count >= q66:
            return "HIGH"
        elif count >= q33:
            return "MEDIUM"
        else:
            return "LOW"

    cluster_df["severity"] = cluster_df["trip_count"].apply(assign_severity)

    # ── Load raw trips for re-run endpoint ───────────────────
    raw_sample = None
    if PROCESSED_TRIPS.exists():
        raw_sample = pd.read_csv(PROCESSED_TRIPS, usecols=[
            "pickup_latitude", "pickup_longitude", "speed_kmh", "hour"
        ])
        print(f"   Loaded {len(raw_sample):,} processed trips")

    # ── Compute hourly distribution ───────────────────────────
    hourly = {}
    if raw_sample is not None and "hour" in raw_sample.columns:
        hourly_series = raw_sample.groupby("hour").size()
        hourly = {int(k): int(v) for k, v in hourly_series.items()}
    elif "peak_hour" in cluster_df.columns:
        hourly_series = cluster_df.groupby("peak_hour")["trip_count"].sum()
        hourly = {int(k): int(v) for k, v in hourly_series.items()}

    # ── Meta statistics ───────────────────────────────────────
    total = int(cluster_df["trip_count"].sum())
    meta = {
        "total_trips":      total,
        "congestion_trips": total,
        "congestion_pct":   round(100 * total / max(total, 1), 1),
    }

    print(f"   Loaded {len(cluster_df)} clusters")
    return {
        "cluster_summary":     cluster_df,
        "raw_sample":          raw_sample,
        "hourly_distribution": hourly,
        "meta":                meta,
    }


def run_dbscan_predict(
    points:      List[Dict],
    epsilon_km:  float = 0.3,
    min_samples: int   = 15
) -> Dict[str, Any]:
    """
    Run DBSCAN on a given list of GPS points.

    Args:
        points:      [{"lat": ..., "lon": ...}, ...]
        epsilon_km:  Search radius in kilometers
        min_samples: Min points to form a cluster

    Returns:
        Dict with cluster labels, centroids, silhouette score, stats
    """
    coords = np.array([[p["lat"], p["lon"]] for p in points])
    coords_rad = np.radians(coords)
    epsilon_rad = epsilon_km / 6371.0

    # ── Run DBSCAN ────────────────────────────────────────────
    db = DBSCAN(
        eps=epsilon_rad,
        min_samples=min_samples,
        algorithm="ball_tree",
        metric="haversine",
        n_jobs=-1
    )
    labels = db.fit_predict(coords_rad)

    # ── Stats ─────────────────────────────────────────────────
    unique_labels = set(labels)
    n_clusters    = len(unique_labels) - (1 if -1 in unique_labels else 0)
    n_noise       = int(np.sum(labels == -1))
    noise_pct     = round(100 * n_noise / len(labels), 2)

    # ── Silhouette Score ──────────────────────────────────────
    sil_score = None
    non_noise_mask = labels != -1
    if n_clusters > 1 and non_noise_mask.sum() > 10:
        try:
            sil_score = round(float(silhouette_score(
                coords[non_noise_mask], labels[non_noise_mask], metric="euclidean"
            )), 4)
        except Exception:
            pass

    # ── Per-point output ──────────────────────────────────────
    point_results = [
        {
            "lat":        float(coords[i, 0]),
            "lon":        float(coords[i, 1]),
            "cluster_id": int(labels[i]),
            "is_noise":   bool(labels[i] == -1)
        }
        for i in range(len(coords))
    ]

    # ── Centroids (severity via percentiles of this run) ──────
    valid_cids = sorted(c for c in unique_labels if c != -1)
    counts = [int((labels == cid).sum()) for cid in valid_cids]
    count_arr = np.array(counts) if counts else np.array([0])
    c_q33 = float(np.percentile(count_arr, 33))
    c_q66 = float(np.percentile(count_arr, 66))

    centroids = []
    for cid, count in zip(valid_cids, counts):
        mask  = labels == cid
        c_lat = float(coords[mask, 0].mean())
        c_lon = float(coords[mask, 1].mean())

        if count >= c_q66:
            severity = "HIGH"
        elif count >= c_q33:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        centroids.append({
            "cluster_id":  int(cid),
            "center_lat":  round(c_lat, 6),
            "center_lon":  round(c_lon, 6),
            "point_count": count,
            "severity":    severity
        })

    return {
        "n_clusters":       n_clusters,
        "n_noise":          n_noise,
        "noise_pct":        noise_pct,
        "silhouette_score": sil_score,
        "points":           point_results,
        "centroids":        centroids,
        "epsilon_km":       epsilon_km,
        "min_samples":      min_samples
    }


def get_cluster_stats(cluster_df: pd.DataFrame) -> Dict:
    """Return quick stats from the cluster summary dataframe."""
    return {
        "total":  len(cluster_df),
        "high":   int((cluster_df["severity"] == "HIGH").sum()),
        "medium": int((cluster_df["severity"] == "MEDIUM").sum()),
        "low":    int((cluster_df["severity"] == "LOW").sum()),
    }