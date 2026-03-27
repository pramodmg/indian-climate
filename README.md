# India Climate App

A full-stack React + TypeScript climate intelligence dashboard for India, with live weather and air quality data, an interactive map overlay, real-time threshold alerts, and a backend API with caching and user accounts.
# India Climate App Starter

This project gives you a ready-to-build foundation for an India-focused climate app.
It includes a custom React + TypeScript dashboard UI, city presets from across India,
and a live data service that pulls weather and PM2.5 data from Open-Meteo (with
fallback values if a request fails).

## Quick start

```bash
npm install
npm run dev            # frontend dev server (Vite)
npm run server:dev     # backend API server (Express, port 8787)
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## What's included

### Frontend
- **City selector** — India cities (Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Guwahati, Jaipur) plus international cities (New York, London, Singapore, Tokyo, Sydney, Nairobi) grouped by region
- **Live climate snapshot** — temperature, humidity, wind, rainfall, PM2.5, AQI, and risk level via Open-Meteo with offline fallback; backend-cached feed as intermediate source
- **3-day forecast table**
- **India map view** — interactive Leaflet map with state and district polygon overlays; color-coded by heatwave pressure, flood pressure, or air quality pressure; fly-to on city change
- **Real alerts module** — automatic threshold evaluation for heatwave (watch ≥37 C / warning ≥40 C / emergency ≥44 C), flood (watch ≥60 % / warning ≥75 % / emergency ≥90 %), and air quality (watch ≥35 µg/m³ / warning ≥60 µg/m³ / emergency ≥90 µg/m³)
- **Alert preferences panel** — authenticated users can filter alerts by minimum severity (watch / warning / emergency) and toggle individual alert categories (heatwave, flood, air quality); preferences synced with the backend
- **Adaptation checklist panel**
- **User account panel** — register, login, and session restore via the backend API

### Backend (`server/`)
- `GET /api/health` — liveness check
- `POST /api/auth/register` — create account (bcrypt password hash, JWT response)
- `POST /api/auth/login` — authenticate; returns JWT
- `GET /api/auth/me` — return current user (Bearer token)
- `GET /api/user/alert-preferences` — fetch saved alert preferences for the authenticated user
- `PUT /api/user/alert-preferences` — update alert preferences (minSeverity, enabledTypes)
- `GET /api/climate/snapshot?cityId=` — cached climate snapshot (10 min TTL, Open-Meteo upstream)
- `GET /api/alerts/realtime?cityId=` — evaluate threshold alerts for a city
## Included out of the box

- India city selector with climate-zone metadata
- Live climate snapshot service with fallback mode
- 3-day outlook table
- Adaptation checklist panel to seed product features
- Responsive layout for desktop and mobile

## Project structure

```text
src/
  components/
    AlertPreferencesPanel.tsx # per-user alert filter preferences (severity + categories)
    AlertsPanel.tsx           # realtime threshold alerts panel
    AuthPanel.tsx             # user login / register / session panel
    CitySelector.tsx
    ForecastTable.tsx
    IndiaMapView.tsx          # Leaflet map with state + district overlays
    MetricCard.tsx
  data/
    indiaCities.ts            # India cities + international cities (allClimateCities export)
    indiaOverlays.ts          # state and district boundary + metric data
  pages/
    ClimateDashboard.tsx
  services/
    alertEngine.ts            # client-side threshold evaluation
    backendApi.ts             # typed fetch client for the backend
    climateApi.ts             # direct Open-Meteo fetch (fallback path)
  types/
    climate.ts
server/
  index.js                    # Express entry point
  config.js                   # port, JWT secret, cache TTL
  middleware/auth.js           # Bearer JWT verification middleware
  services/
    alertService.js
    climateService.js          # caching climate fetch
    userStore.js               # JSON file-based user store (stores alertPreferences per user)
  data/
    cities.js                  # India + international city definitions
    users.json
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8787` | Backend API base URL for the frontend |
| `API_PORT` | `8787` | Port the backend server listens on |
| `CACHE_TTL_SECONDS` | `600` | Climate snapshot cache lifetime |
| `JWT_SECRET` | *(insecure default)* | **Replace before deploying** |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite frontend dev server |
| `npm run build` | Type-check and create production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run server` | Start Express backend |
| `npm run server:dev` | Start backend with `--watch` hot-reload |

    CitySelector.tsx
    ForecastTable.tsx
    MetricCard.tsx
  data/
    indiaCities.ts
  pages/
    ClimateDashboard.tsx
  services/
    climateApi.ts
  types/
    climate.ts
  App.tsx
  App.css
  index.css
```

## Suggested next milestones

1. Add district-level map layers (flood, heat, drought, air quality).
2. Add historical trends (season over season, anomaly tracking).
3. Add user roles (citizen, city planner, state admin).
4. Add alerts via SMS/WhatsApp/email integrations.
5. Add backend caching for API reliability and rate control.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Type-check and create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
