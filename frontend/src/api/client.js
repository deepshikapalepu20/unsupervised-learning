/**
 * api/client.js
 * Centralized Axios calls to the FastAPI backend (Week 2)
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/api",          // proxied by Vite → http://localhost:8000
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Interceptors ──────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || "API Error";
    return Promise.reject(new Error(msg));
  }
);

// ── Endpoints ─────────────────────────────────────────────────

/** Dashboard summary cards */
export const fetchStats = () => api.get("/stats");

/** Congestion hotspot markers */
export const fetchHotspots = (params = {}) => api.get("/hotspots", { params });

/** Hourly trip distribution */
export const fetchHourly = () => api.get("/hourly");

/** Cluster detail by ID */
export const fetchCluster = (id) => api.get(`/clusters/${id}`);

/** Re-run DBSCAN with custom params */
export const rerunClustering = (epsilon_km, min_samples, sample_size = 5000) =>
  api.post("/rerun", null, {
    params: { epsilon_km, min_samples, sample_size },
    timeout: 60000,
  });

/** Run DBSCAN on submitted GPS points */
export const predictClusters = (points, epsilon_km = 0.3, min_samples = 15) =>
  api.post("/predict", { points, epsilon_km, min_samples });

export default api;
