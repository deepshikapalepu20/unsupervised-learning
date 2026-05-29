#  Urban Traffic Congestion Hotspot Discovery
# Project: DBSCAN-based Clustering on NYC Taxi Data
# %% ── CELL 1: Install Dependencies ────────────────────────
# !pip install pandas numpy matplotlib seaborn scikit-learn folium plotly
# Imports ──────────────────────────────────────

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import seaborn as sns
import folium
from folium.plugins import HeatMap, MarkerCluster
import plotly.express as px
import plotly.graph_objects as go

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.neighbors import NearestNeighbors

import warnings
warnings.filterwarnings("ignore")

print("All libraries loaded successfully!")


# %% ── CELL 3: Load Dataset ─────────────────────────────────
# Dataset: NYC Taxi Trip Duration
# Download from: https://www.kaggle.com/competitions/nyc-taxi-trip-duration/data
# Place 'train.csv' in the same folder as this notebook.

df = pd.read_csv("train.csv")

print(f"Shape       : {df.shape}")
print(f"Columns     : {list(df.columns)}")
print(f"\nFirst 3 rows:")
df.head(3)


# %% ── CELL 4: Basic EDA ─────────────────────────────────────

print("=" * 50)
print("BASIC DATASET INFO")
print("=" * 50)

print("\n Data Types:")
print(df.dtypes)

print("\n Null Values:")
print(df.isnull().sum())

print("\n Statistical Summary:")
df.describe()


# %% ── CELL 5: Data Cleaning ─────────────────────────────────

# Convert datetime
df["pickup_datetime"] = pd.to_datetime(df["pickup_datetime"])

# Extract time features
df["hour"]       = df["pickup_datetime"].dt.hour
df["day_of_week"]= df["pickup_datetime"].dt.dayofweek  # 0=Monday
df["month"]      = df["pickup_datetime"].dt.month
df["day_name"]   = df["pickup_datetime"].dt.day_name()

# ── Remove obvious GPS outliers (NYC bounding box) ──────────
nyc_bounds = {
    "lat_min": 40.4774, "lat_max": 40.9176,
    "lon_min": -74.2591, "lon_max": -73.7004
}

before = len(df)
df = df[
    (df["pickup_latitude"].between(nyc_bounds["lat_min"], nyc_bounds["lat_max"])) &
    (df["pickup_longitude"].between(nyc_bounds["lon_min"], nyc_bounds["lon_max"])) &
    (df["dropoff_latitude"].between(nyc_bounds["lat_min"], nyc_bounds["lat_max"])) &
    (df["dropoff_longitude"].between(nyc_bounds["lon_min"], nyc_bounds["lon_max"]))
]

# ── Remove trips with 0 or negative duration ────────────────
df = df[df["trip_duration"] > 0]

# ── Remove extreme duration outliers (> 5 hrs) ──────────────
df = df[df["trip_duration"] < 18000]

print(f"Removed {before - len(df):,} outlier rows.")
print(f"Clean dataset size: {len(df):,} rows")


# %% ── CELL 6: Feature Engineering ──────────────────────────

# ── Calculate trip distance using Haversine formula ─────────
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    return 2 * R * np.arcsin(np.sqrt(a))

df["distance_km"] = haversine(
    df["pickup_latitude"], df["pickup_longitude"],
    df["dropoff_latitude"], df["dropoff_longitude"]
)

# ── Calculate average speed (km/h) ─────────────────────────
df["speed_kmh"] = (df["distance_km"] / (df["trip_duration"] / 3600)).round(2)

# ── Filter: Keep only trips with very low speed (congestion) ─
# Speed < 10 km/h = stop-and-go or gridlock
congestion_df = df[
    (df["speed_kmh"] > 0) &
    (df["speed_kmh"] < 10) &
    (df["distance_km"] > 0.2)   # ignore micro-trips
].copy()

print(f"Total trips         : {len(df):,}")
print(f"Congestion trips    : {len(congestion_df):,}")
print(f"Congestion %        : {100*len(congestion_df)/len(df):.1f}%")
print(f"\nSpeed stats (congestion trips):")
print(congestion_df["speed_kmh"].describe())


# %% ── CELL 7: EDA Visualizations ────────────────────────────

fig, axes = plt.subplots(2, 2, figsize=(16, 10))
fig.suptitle("NYC Taxi — Exploratory Data Analysis", fontsize=16, fontweight="bold")

# 1. Trip duration distribution
axes[0, 0].hist(df["trip_duration"] / 60, bins=80, color="#4A90D9", edgecolor="white", alpha=0.85)
axes[0, 0].set_title("Trip Duration Distribution (minutes)")
axes[0, 0].set_xlabel("Duration (min)")
axes[0, 0].set_ylabel("Count")
axes[0, 0].axvline(df["trip_duration"].median()/60, color="red", linestyle="--", label="Median")
axes[0, 0].legend()

# 2. Speed distribution
axes[0, 1].hist(df["speed_kmh"].clip(0, 80), bins=80, color="#E87040", edgecolor="white", alpha=0.85)
axes[0, 1].set_title("Speed Distribution (km/h)")
axes[0, 1].set_xlabel("Speed (km/h)")
axes[0, 1].axvline(10, color="red", linestyle="--", label="Congestion threshold (10 km/h)")
axes[0, 1].legend()

# 3. Hourly trip volume
hourly = df.groupby("hour").size().reset_index(name="count")
axes[1, 0].bar(hourly["hour"], hourly["count"], color="#5BA85E", edgecolor="white")
axes[1, 0].set_title("Trip Volume by Hour of Day")
axes[1, 0].set_xlabel("Hour")
axes[1, 0].set_ylabel("Number of Trips")
axes[1, 0].set_xticks(range(24))

# 4. Congestion trips by hour
hourly_cong = congestion_df.groupby("hour").size().reset_index(name="count")
axes[1, 1].bar(hourly_cong["hour"], hourly_cong["count"], color="#C0392B", edgecolor="white")
axes[1, 1].set_title("Congestion Trips by Hour of Day")
axes[1, 1].set_xlabel("Hour")
axes[1, 1].set_ylabel("Congested Trips")
axes[1, 1].set_xticks(range(24))

plt.tight_layout()
plt.savefig("eda_overview.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: eda_overview.png")


# %% ── CELL 8: Pickup Density Heatmap ────────────────────────

# Scatter plot of congestion pickup points
plt.figure(figsize=(12, 10))
plt.scatter(
    congestion_df["pickup_longitude"],
    congestion_df["pickup_latitude"],
    alpha=0.05, s=1, c="#FF4500"
)
plt.title("Congestion Pickup Point Density — NYC", fontsize=14, fontweight="bold")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.xlim(-74.05, -73.75)
plt.ylim(40.60, 40.90)
plt.tight_layout()
plt.savefig("congestion_scatter.png", dpi=150, bbox_inches="tight")
plt.show()
print(" Saved: congestion_scatter.png")


# %% ── CELL 9: Sample for DBSCAN (Performance) ───────────────
# Using a stratified time sample to keep it manageable

# Focus on peak hours (7-10am, 4-8pm) for most interesting congestion
peak = congestion_df[congestion_df["hour"].isin([7, 8, 9, 16, 17, 18, 19])]

# Sample 30,000 points for clustering
sample_df = peak.sample(n=min(30000, len(peak)), random_state=42).reset_index(drop=True)

# Extract coordinates
coords = sample_df[["pickup_latitude", "pickup_longitude"]].values

print(f"Sample size for DBSCAN: {len(sample_df):,} points")
print(f"Coordinate range:")
print(f"  Lat: {coords[:,0].min():.4f} → {coords[:,0].max():.4f}")
print(f"  Lon: {coords[:,1].min():.4f} → {coords[:,1].max():.4f}")


# %% ── CELL 10: K-Distance Plot (Finding Optimal Epsilon) ────
# The "elbow" in the K-distance plot suggests the best epsilon

print("⏳ Computing k-distances... (may take ~30 seconds)")

k = 10  # MinPts - 1
neighbors = NearestNeighbors(n_neighbors=k, metric="haversine")
neighbors.fit(np.radians(coords))  # haversine needs radians
distances, _ = neighbors.kneighbors(np.radians(coords))

# Sort distances to kth neighbor
k_distances = np.sort(distances[:, k-1])[::-1]

# Convert from radians to km (Earth radius = 6371 km)
k_distances_km = k_distances * 6371

plt.figure(figsize=(12, 5))
plt.plot(k_distances_km, color="#2980B9", linewidth=1.5)
plt.xlabel("Points sorted by distance", fontsize=12)
plt.ylabel(f"{k}-NN Distance (km)", fontsize=12)
plt.title("K-Distance Plot — Find the Elbow for Optimal Epsilon", fontsize=13, fontweight="bold")
plt.axhline(y=0.3, color="red", linestyle="--", alpha=0.7, label="Suggested ε = 0.3 km")
plt.axhline(y=0.5, color="orange", linestyle="--", alpha=0.7, label="Try ε = 0.5 km")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("k_distance_plot.png", dpi=150, bbox_inches="tight")
plt.show()
print("✅ Saved: k_distance_plot.png")
print("💡 Look for the 'elbow' — that distance is your optimal epsilon.")


# %% ── CELL 11: DBSCAN Clustering ────────────────────────────

# ── TUNE THESE PARAMETERS ───────────────────────────────────
EPSILON_KM = 0.3    # radius in km — adjust based on k-distance plot
MIN_SAMPLES = 15    # minimum points to form a dense cluster
# ────────────────────────────────────────────────────────────

# Convert epsilon from km to radians for haversine metric
epsilon_rad = EPSILON_KM / 6371.0

print(f"Running DBSCAN with ε={EPSILON_KM} km, MinPts={MIN_SAMPLES}...")
print("⏳ This may take 1–2 minutes...")

dbscan = DBSCAN(
    eps=epsilon_rad,
    min_samples=MIN_SAMPLES,
    algorithm="ball_tree",
    metric="haversine",
    n_jobs=-1
)

coords_rad = np.radians(coords)
labels = dbscan.fit_predict(coords_rad)

sample_df["cluster"] = labels

# ── Results Summary ─────────────────────────────────────────
n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
n_noise    = np.sum(labels == -1)
noise_pct  = 100 * n_noise / len(labels)

print(f"\n{'='*40}")
print(f"DBSCAN RESULTS")
print(f"{'='*40}")
print(f"Total clusters found : {n_clusters}")
print(f"Noise points         : {n_noise:,} ({noise_pct:.1f}%)")
print(f"Clustered points     : {len(labels) - n_noise:,}")

# Cluster size distribution
cluster_sizes = sample_df[sample_df["cluster"] != -1].groupby("cluster").size()
print(f"\nCluster size stats:")
print(cluster_sizes.describe())


# %% ── CELL 12: Silhouette Score ─────────────────────────────
# Measures how well-separated clusters are (-1 to 1, higher is better)

non_noise = sample_df[sample_df["cluster"] != -1]

if len(non_noise) > 1000 and n_clusters > 1:
    # Sample for speed
    eval_sample = non_noise.sample(n=5000, random_state=42)
    eval_coords = eval_sample[["pickup_latitude", "pickup_longitude"]].values
    eval_labels = eval_sample["cluster"].values

    score = silhouette_score(eval_coords, eval_labels, metric="euclidean")
    print(f"✅ Silhouette Score: {score:.4f}")
    print(f"   → {'Excellent' if score > 0.5 else 'Good' if score > 0.3 else 'Acceptable'} cluster separation")
    print(f"   (Scale: <0 = wrong, 0–0.3 = weak, 0.3–0.5 = good, >0.5 = excellent)")
else:
    print("⚠️ Too few clusters or points for silhouette evaluation.")


# %% ── CELL 13: Epsilon Sensitivity Analysis ─────────────────
# Run DBSCAN across multiple epsilon values to compare results

epsilon_values = [0.1, 0.2, 0.3, 0.5, 0.7, 1.0]
results = []

for eps_km in epsilon_values:
    eps_rad = eps_km / 6371.0
    db = DBSCAN(eps=eps_rad, min_samples=MIN_SAMPLES,
                algorithm="ball_tree", metric="haversine", n_jobs=-1)
    lbl = db.fit_predict(coords_rad)
    n_c = len(set(lbl)) - (1 if -1 in lbl else 0)
    n_ns = np.sum(lbl == -1)
    results.append({
        "Epsilon (km)": eps_km,
        "Clusters": n_c,
        "Noise Points": n_ns,
        "Noise %": round(100 * n_ns / len(lbl), 1)
    })

results_df = pd.DataFrame(results)
print("Epsilon Sensitivity Analysis:")
print(results_df.to_string(index=False))

# Plot
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
fig.suptitle("DBSCAN Epsilon Sensitivity", fontsize=14, fontweight="bold")

ax1.plot(results_df["Epsilon (km)"], results_df["Clusters"], "bo-", linewidth=2, markersize=8)
ax1.set_xlabel("Epsilon (km)")
ax1.set_ylabel("Number of Clusters")
ax1.set_title("Clusters vs Epsilon")
ax1.grid(True, alpha=0.3)

ax2.plot(results_df["Epsilon (km)"], results_df["Noise %"], "rs-", linewidth=2, markersize=8)
ax2.set_xlabel("Epsilon (km)")
ax2.set_ylabel("Noise %")
ax2.set_title("Noise % vs Epsilon")
ax2.grid(True, alpha=0.3)
ax2.axhline(y=20, color="green", linestyle="--", label="20% noise (target)")
ax2.legend()

plt.tight_layout()
plt.savefig("epsilon_sensitivity.png", dpi=150, bbox_inches="tight")
plt.show()
print("✅ Saved: epsilon_sensitivity.png")


# %% ── CELL 14: Visualize Clusters (Matplotlib) ──────────────

# Get top N clusters by size
top_n = 15
top_clusters = (
    sample_df[sample_df["cluster"] != -1]
    .groupby("cluster").size()
    .nlargest(top_n)
    .index.tolist()
)

plot_df = sample_df[sample_df["cluster"].isin(top_clusters)].copy()
colors = cm.tab20(np.linspace(0, 1, top_n))

plt.figure(figsize=(13, 11))
for i, cid in enumerate(top_clusters):
    mask = plot_df["cluster"] == cid
    pts  = plot_df[mask]
    plt.scatter(
        pts["pickup_longitude"], pts["pickup_latitude"],
        s=5, alpha=0.4, color=colors[i], label=f"Cluster {cid}"
    )

# Noise
noise = sample_df[sample_df["cluster"] == -1]
plt.scatter(noise["pickup_longitude"], noise["pickup_latitude"],
            s=1, alpha=0.05, color="gray", label="Noise")

plt.title(f"DBSCAN Congestion Clusters — NYC (Top {top_n})", fontsize=14, fontweight="bold")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.xlim(-74.05, -73.75)
plt.ylim(40.60, 40.90)
plt.legend(markerscale=4, bbox_to_anchor=(1.01, 1), loc="upper left", fontsize=8)
plt.tight_layout()
plt.savefig("dbscan_clusters_map.png", dpi=150, bbox_inches="tight")
plt.show()
print("✅ Saved: dbscan_clusters_map.png")


# %% ── CELL 15: Interactive Folium Map ───────────────────────
# This generates an interactive HTML map — open in browser!

print("⏳ Generating interactive Folium map...")

# Cluster centroids
cluster_info = (
    sample_df[sample_df["cluster"] != -1]
    .groupby("cluster")
    .agg(
        center_lat=("pickup_latitude",  "mean"),
        center_lon=("pickup_longitude", "mean"),
        count      =("cluster",          "size"),
        avg_speed  =("speed_kmh",        "mean")
    )
    .reset_index()
    .sort_values("count", ascending=False)
    .head(30)  # Top 30 hotspots
)

# Base map centered on NYC
m = folium.Map(location=[40.7128, -74.0060], zoom_start=12, tiles="CartoDB dark_matter")

# ── Heatmap layer ────────────────────────────────────────────
heat_data = sample_df[["pickup_latitude", "pickup_longitude"]].values.tolist()
HeatMap(heat_data, radius=8, blur=12, min_opacity=0.3).add_to(m)

# ── Cluster markers ──────────────────────────────────────────
for _, row in cluster_info.iterrows():
    size   = int(row["count"])
    radius = max(8, min(30, size // 30))

    folium.CircleMarker(
        location=[row["center_lat"], row["center_lon"]],
        radius=radius,
        color="#FF4500",
        fill=True,
        fill_color="#FF6347",
        fill_opacity=0.7,
        popup=folium.Popup(
            f"""<b>Cluster #{int(row['cluster'])}</b><br>
            📍 Points: {size:,}<br>
            🚗 Avg Speed: {row['avg_speed']:.1f} km/h<br>
            ⚠️ Severity: {'HIGH' if size > 500 else 'MEDIUM' if size > 200 else 'LOW'}""",
            max_width=200
        ),
        tooltip=f"Cluster {int(row['cluster'])} | {size} trips | {row['avg_speed']:.1f} km/h"
    ).add_to(m)

# Save
m.save("nyc_congestion_hotspots.html")
print("✅ Saved: nyc_congestion_hotspots.html")
print("   → Open this file in your browser to see the interactive map!")


# %% ── CELL 16: Export Cluster Data for Backend ──────────────
# Save processed data for Week 2 (FastAPI backend)

# Full cluster summary
cluster_summary = (
    sample_df[sample_df["cluster"] != -1]
    .groupby("cluster")
    .agg(
        center_lat  =("pickup_latitude",  "mean"),
        center_lon  =("pickup_longitude", "mean"),
        trip_count  =("cluster",          "size"),
        avg_speed   =("speed_kmh",        "mean"),
        avg_duration=("trip_duration",    lambda x: round(x.mean()/60, 1)),
        peak_hour   =("hour", lambda x: x.mode()[0])
    )
    .reset_index()
    .sort_values("trip_count", ascending=False)
)

cluster_summary["severity"] = pd.cut(
    cluster_summary["trip_count"],
    bins=[0, 100, 400, np.inf],
    labels=["LOW", "MEDIUM", "HIGH"]
)

cluster_summary.to_csv("cluster_summary.csv", index=False)
sample_df.to_csv("processed_trips.csv", index=False)

print("✅ Exported:")
print("   → cluster_summary.csv   (use in FastAPI backend)")
print("   → processed_trips.csv   (full clustered trip data)")
print(f"\nTop 10 Congestion Hotspots:")
print(cluster_summary.head(10).to_string(index=False))


# %% ── CELL 17: Summary Dashboard ────────────────────────────

print("\n" + "="*55)
print("       WEEK 1 COMPLETE — PROJECT SUMMARY")
print("="*55)
print(f"  Dataset size          : {len(df):,} trips")
print(f"  Congestion trips      : {len(congestion_df):,} ({100*len(congestion_df)/len(df):.1f}%)")
print(f"  DBSCAN ε (km)         : {EPSILON_KM}")
print(f"  DBSCAN MinPts         : {MIN_SAMPLES}")
print(f"  Clusters found        : {n_clusters}")
print(f"  Noise points          : {n_noise:,} ({noise_pct:.1f}%)")
print("="*55)
print("\n📁 Files generated:")
print("   eda_overview.png          → EDA charts")
print("   congestion_scatter.png    → Pickup density")
print("   k_distance_plot.png       → Epsilon tuning guide")
print("   epsilon_sensitivity.png   → Parameter comparison")
print("   dbscan_clusters_map.png   → Static cluster map")
print("   nyc_congestion_hotspots.html → Interactive map")
print("   cluster_summary.csv       → For FastAPI backend")
print("   processed_trips.csv       → Full labeled data")
print("\n🚀 Next: Week 2 — Build FastAPI backend with /predict endpoint")
