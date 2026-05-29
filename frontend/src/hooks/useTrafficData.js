/**
 * hooks/useTrafficData.js
 * Custom React hooks for fetching all backend data
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchStats, fetchHotspots, fetchHourly, rerunClustering,
} from "../api/client";

// ── useStats ──────────────────────────────────────────────────
export function useStats() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ── useHotspots ───────────────────────────────────────────────
export function useHotspots(filters = {}) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchHotspots({ limit: 50, ...filters })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

// ── useHourly ─────────────────────────────────────────────────
export function useHourly() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchHourly()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ── useModelExplorer ──────────────────────────────────────────
export function useModelExplorer() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (epsilon, minSamples, sampleSize = 5000) => {
    setLoading(true);
    setError(null);
    try {
      const data = await rerunClustering(epsilon, minSamples, sampleSize);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, run };
}
