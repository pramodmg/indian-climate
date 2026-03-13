# India Climate App Starter

This project gives you a ready-to-build foundation for an India-focused climate app.
It includes a custom React + TypeScript dashboard UI, city presets from across India,
and a live data service that pulls weather and PM2.5 data from Open-Meteo (with
fallback values if a request fails).

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

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
