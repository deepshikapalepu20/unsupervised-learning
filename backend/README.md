# 🚦 Week 2 — FastAPI Backend Setup

## Folder Structure

```
week2_backend/
├── main.py            ← FastAPI app + all routes
├── model.py           ← DBSCAN logic + data loading
├── schemas.py         ← Pydantic request/response models
├── requirements.txt   ← Dependencies
├── test_api.py        ← Endpoint tests
└── data/
    ├── cluster_summary.csv    ← FROM WEEK 1 notebook
    └── processed_trips.csv    ← FROM WEEK 1 notebook
```

---

## Step 1: Copy Week 1 Output Files

After running the Week 1 notebook, copy these files into `./data/`:
```
cluster_summary.csv
processed_trips.csv
```

---

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Step 3: Run the Server

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
🚀 Loading DBSCAN model and cluster data...
✅ Model ready!
```

---

## Step 4: Explore the API

| URL | Description |
|-----|-------------|
| http://localhost:8000/docs | Swagger UI (interactive) |
| http://localhost:8000/redoc | ReDoc documentation |
| http://localhost:8000/health | Health check |
| http://localhost:8000/stats | Dashboard summary stats |
| http://localhost:8000/hotspots | All hotspots |
| http://localhost:8000/hotspots?severity=HIGH | High severity only |
| http://localhost:8000/hotspots?hour=8 | Peak-hour filter |
| http://localhost:8000/hourly | Hourly distribution |
| http://localhost:8000/clusters/0 | Cluster detail |
| POST /predict | Run DBSCAN on custom points |
| POST /rerun | Re-run with custom ε / MinPts |

---

## Step 5: Run Tests

```bash
# Make sure server is running first!
python test_api.py
```

---

## API Quick Reference

### POST /predict
```json
{
  "points": [
    {"lat": 40.758, "lon": -73.985},
    {"lat": 40.761, "lon": -73.982}
  ],
  "epsilon_km": 0.3,
  "min_samples": 5
}
```

### POST /rerun (query params)
```
POST /rerun?epsilon_km=0.5&min_samples=20&sample_size=3000
```

---

## Next: Week 3 — React Frontend
The frontend will call these endpoints:
- `GET /hotspots` → Map markers
- `GET /stats` → Summary cards
- `GET /hourly` → Time-series chart
- `POST /rerun` → Model Explorer sliders
