# 🗺️ Week 3 — React Frontend Setup

## Folder Structure

```
week3_frontend/
├── index.html
├── package.json
├── vite.config.js         ← proxies /api → localhost:8000
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx             ← Root layout + tab routing
    ├── index.css           ← Global styles + Tailwind
    ├── api/
    │   └── client.js       ← All Axios API calls
    ├── hooks/
    │   └── useTrafficData.js  ← Custom React hooks
    └── components/
        ├── Header.jsx         ← Navbar + live clock
        ├── StatsCards.jsx     ← KPI summary cards
        ├── MapView.jsx        ← Leaflet interactive map
        ├── HourlyChart.jsx    ← Area/bar chart (Recharts)
        ├── HotspotTable.jsx   ← Sortable paginated table
        └── ModelExplorer.jsx  ← DBSCAN slider panel
```

---

## Step 1: Prerequisites

- Node.js 18+ installed
- Week 2 FastAPI backend running on `http://localhost:8000`

---

## Step 2: Install & Run

```bash
cd week3_frontend
npm install
npm run dev
```

Open: **http://localhost:3000**

---

## Step 3: Make sure the backend is running

```bash
# In a separate terminal (week2_backend folder):
uvicorn main:app --reload --port 8000
```

The Vite config proxies all `/api/*` requests to `http://localhost:8000`.

---

## Pages / Tabs

| Tab | Route | Description |
|-----|-------|-------------|
| Dashboard | default | Stats + map + chart + table |
| Live Map | map | Full-screen Leaflet map |
| Analytics | analytics | Charts + full table |
| Model Explorer | explorer | Live DBSCAN slider panel |

---

## API Connections

| Component | Endpoint | Method |
|-----------|----------|--------|
| StatsCards | `/stats` | GET |
| MapView | `/hotspots` | GET |
| HourlyChart | `/hourly` | GET |
| HotspotTable | `/hotspots` | GET |
| ModelExplorer | `/rerun` | POST |

---

## Build for Production

```bash
npm run build
# Output in ./dist — deploy to Vercel, Netlify, etc.
```

---

## Next: Week 4 — Connect + Deploy

- Connect frontend ↔ backend on the same deployment
- Deploy backend on **Render** (free tier)
- Deploy frontend on **Vercel** (free tier)
- Set `VITE_API_BASE_URL` env variable
