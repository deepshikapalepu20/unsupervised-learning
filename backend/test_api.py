"""
test_api.py — Test all API endpoints using httpx
Run: python test_api.py  (make sure uvicorn is running first)
"""

import httpx
import json
import random

BASE_URL = "http://localhost:8000"

def print_section(title: str):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print(f"{'='*55}")

def print_result(label: str, data):
    print(f"\n✅ {label}")
    print(json.dumps(data, indent=2)[:600])  # Truncate long outputs


# ── Test 1: Health Check ──────────────────────────────────────
print_section("TEST 1: Health Check")
r = httpx.get(f"{BASE_URL}/health")
print_result("GET /health", r.json())


# ── Test 2: Stats ─────────────────────────────────────────────
print_section("TEST 2: Dashboard Stats")
r = httpx.get(f"{BASE_URL}/stats")
print_result("GET /stats", r.json())


# ── Test 3: All Hotspots ──────────────────────────────────────
print_section("TEST 3: Top 5 Hotspots")
r = httpx.get(f"{BASE_URL}/hotspots?limit=5")
data = r.json()
print_result(f"GET /hotspots (returned {len(data)} hotspots)", data[:2])


# ── Test 4: Filter by Severity ────────────────────────────────
print_section("TEST 4: HIGH Severity Hotspots")
r = httpx.get(f"{BASE_URL}/hotspots?severity=HIGH&limit=3")
print_result("GET /hotspots?severity=HIGH", r.json())


# ── Test 5: Filter by Hour ────────────────────────────────────
print_section("TEST 5: Peak Hour 8AM Hotspots")
r = httpx.get(f"{BASE_URL}/hotspots?hour=8&limit=5")
print_result("GET /hotspots?hour=8", r.json())


# ── Test 6: Hourly Distribution ───────────────────────────────
print_section("TEST 6: Hourly Distribution")
r = httpx.get(f"{BASE_URL}/hourly")
data = r.json()
print(f"✅ Hours: {data['hours'][:6]}...")
print(f"   Counts: {data['counts'][:6]}...")


# ── Test 7: Predict Endpoint ──────────────────────────────────
print_section("TEST 7: /predict with GPS Points")

# Simulate congestion points around Times Square / Midtown
midtown_points = [
    {"lat": 40.7580 + random.uniform(-0.01, 0.01),
     "lon": -73.9855 + random.uniform(-0.01, 0.01)}
    for _ in range(50)
]

payload = {
    "points":      midtown_points,
    "epsilon_km":  0.3,
    "min_samples": 5
}

r = httpx.post(f"{BASE_URL}/predict", json=payload)
result = r.json()
print_result("POST /predict", {
    "n_clusters":       result["n_clusters"],
    "n_noise":          result["n_noise"],
    "noise_pct":        result["noise_pct"],
    "silhouette_score": result["silhouette_score"],
    "centroids_found":  len(result["centroids"])
})


# ── Test 8: Re-run Clustering ─────────────────────────────────
print_section("TEST 8: /rerun with Custom Parameters")
r = httpx.post(
    f"{BASE_URL}/rerun",
    params={"epsilon_km": 0.5, "min_samples": 20, "sample_size": 2000},
    timeout=60
)
result = r.json()
print_result("POST /rerun (ε=0.5, MinPts=20)", {
    "epsilon_km":  result.get("epsilon_km"),
    "min_samples": result.get("min_samples"),
    "n_clusters":  result.get("n_clusters"),
    "noise_pct":   result.get("noise_pct")
})


# ── Test 9: Cluster Detail ────────────────────────────────────
print_section("TEST 9: Cluster Detail by ID")
r = httpx.get(f"{BASE_URL}/clusters/0")
print_result("GET /clusters/0", r.json())


# ── Summary ───────────────────────────────────────────────────
print(f"\n{'='*55}")
print("  ALL TESTS COMPLETE ✅")
print(f"{'='*55}")
print("  Visit http://localhost:8000/docs for full Swagger UI")
