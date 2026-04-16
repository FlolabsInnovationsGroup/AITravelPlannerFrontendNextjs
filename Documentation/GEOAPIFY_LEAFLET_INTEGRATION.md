# Geoapify and Leaflet integration

This document describes how the AI Travel Planner **Next.js** app combines **Leaflet** (interactive map) with **Geoapify** (raster map tiles). Use it to onboard engineers or to reproduce the setup in another environment.

---

## What each piece does

| Layer | Role |
|--------|------|
| **Leaflet** | Client-side map engine: pan, zoom, markers, popups, polylines. |
| **react-leaflet** | React bindings for Leaflet (`MapContainer`, `TileLayer`, `Marker`, etc.). |
| **Geoapify** | Hosted **map tiles** (PNG) via the [Map Tiles API](https://apidocs.geoapify.com/docs/maps/map-tiles/). The API key is appended to tile URLs; Leaflet requests tiles as the user pans and zooms. |

Geoapify does **not** replace Leaflet here—it **powers the basemap** behind Leaflet. Location data (pins, routes) comes from your backend/session logic; the map only visualizes it.

---

## Dependencies

From `package.json`:

- `leaflet` (^1.9.x)
- `react-leaflet` (^4.2.x)

Leaflet’s CSS is imported in the map component (`leaflet/dist/leaflet.css`).

---

## Environment variables

### Frontend (required for the map to render)

The map reads the key at build/runtime as:

- **`NEXT_PUBLIC_GEOAPIFY_API_KEY`**

Set it in `.env.local` (local dev) and in your hosting provider’s environment for production builds. The `NEXT_PUBLIC_` prefix is required so Next.js can expose the value to browser code.

`next.config.mjs` maps this into the client bundle via the `env` block so the key is available as `process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY` in components.

If the key is missing, `LeafletMap.tsx` shows a **“Geoapify API key not configured”** placeholder instead of initializing the map.

### Backend / deployment

The root repo’s AWS deploy workflow may inject **`GEOAPIFY_API_KEY`** (no `NEXT_PUBLIC_`) into the server `.env`. That is separate from the Next.js client key. The **travel map UI** only uses **`NEXT_PUBLIC_GEOAPIFY_API_KEY`** unless you add server-side Geoapify calls later.

**Team tip:** Use [Geoapify domain / HTTP referrer restrictions](https://apidocs.geoapify.com/docs/maps/map-tiles/) on the key you expose to the browser, and keep a different key for any server-only usage.

---

## Where the code lives

| File | Purpose |
|------|---------|
| `src/components/features/map/LeafletMap.tsx` | Main map: `MapContainer`, `TileLayer` (Geoapify URL), markers, route polyline, fit-bounds, empty states. |
| `src/components/features/map/LeafletMapWrapper.tsx` | `dynamic(..., { ssr: false })` so Leaflet never runs on the server. |
| `src/components/features/map/MapThemes.ts` | Theme names → Geoapify **tile style** ids and `getTileUrl(theme, apiKey)`. |
| `src/components/features/map/ThemeSelector.tsx` | UI to switch themes (propagates theme name to the map). |
| `src/components/features/map/ProfessionalMapMarkers.ts` | Marker styling (emoji, colors) by location type. |
| `src/components/features/map/RightMapPanel.tsx` | Session locations, filters, wires `LeafletMap` + theme. |
| `next.config.mjs` | `NEXT_PUBLIC_GEOAPIFY_API_KEY` in `env`; webpack chunk group `maps` for `leaflet` / `react-leaflet`; `reactStrictMode: false` to reduce Leaflet double-mount issues in dev. |

---

## How Geoapify tiles are wired

`MapThemes.ts` builds a standard **XYZ tile URL** for Geoapify:

```text
https://maps.geoapify.com/v1/tile/{style}/{z}/{x}/{y}.png?apiKey={KEY}
```

Each **theme** maps to a Geoapify style id, for example:

- `modern` → `osm-bright`
- `dark` → `dark-matter`
- `minimalist` → `positron`
- `vibrant` → `osm-bright-smooth`
- `ocean` → `positron-blue`

`LeafletMap.tsx` passes `getTileUrl(theme, geoapifyKey)` into react-leaflet’s `<TileLayer url={...} />` and sets **attribution** to credit Geoapify and OpenStreetMap contributors (required by typical tile usage terms).

---

## How Leaflet is used

1. **`MapContainer`** — Initial center (first valid location or NYC fallback), zoom, scroll wheel zoom, unique `id` per mount to avoid “map container already initialized” when React remounts (e.g. Strict Mode / navigation).
2. **`TileLayer`** — Geoapify raster tiles, `maxZoom={20}`.
3. **`FitBoundsUpdater`** — When locations change, fits the map to all valid coordinates with padding.
4. **`Marker` + `Popup`** — Custom `L.divIcon` markers from `ProfessionalMapMarkers` / `getMarkerConfig`.
5. **`Polyline`** — Optional route between origin, waypoints, and destination when `routeData` is provided.
6. **Empty state** — If there are no markers and no route, shows guidance to use chat first.

---

## Next.js integration notes

1. **No SSR for the map** — `LeafletMapWrapper` uses `dynamic(..., { ssr: false })` because Leaflet touches `window` and the DOM.
2. **`reactStrictMode: false`** in `next.config.mjs` — Mitigates Leaflet/react-leaflet issues tied to double mounting in development.
3. **Webpack** — A dedicated `splitChunks` group named `maps` bundles `leaflet` and `react-leaflet` for clearer caching and chunk behavior.
4. **Heavy panel loading** — `ChatPageContent` can load `RightMapPanel` with `dynamic` + loading UI so the initial chat bundle stays smaller.

---

## Operational checklist for new environments

1. Create a Geoapify project and copy the API key.
2. Set **`NEXT_PUBLIC_GEOAPIFY_API_KEY`** in `.env.local` (dev) and in CI/production for the Next app.
3. Run `pnpm install` / `npm install`, then `pnpm dev` / `npm run dev`.
4. Open the travel map in the app and confirm tiles load and attribution appears on the map.
5. If tiles are blank, verify the key, network tab for `maps.geoapify.com` (401/403 often mean key or referrer restrictions), and that you rebuilt after changing env vars.

---

## Related (not Geoapify)

`ProfessionalMapStyles.ts` contains JSON style objects in the **Google Maps** style format. They are **not** applied to Geoapify raster tiles in the current Leaflet path; themes for the basemap come from **`MapThemes.ts`** and Geoapify’s style ids only.

---

*Last aligned with the implementation in `AITravelPlannerFrontendNextjs` (Leaflet + Geoapify tile layer).*
