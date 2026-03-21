# GardenAtlas — Architecture

## Overview

GardenAtlas is an offline-first PWA. There is no backend, no API, no user accounts. All data lives in IndexedDB in the user's browser. The app is a Svelte 4 SPA built with Vite, deployed to GitHub Pages.

---

## Key Design Principles

- **Offline-first** — service worker caches the app shell on first load; every feature works without internet
- **Local-only data** — IndexedDB via Dexie.js; export/import is the sync mechanism
- **Unified sections** — all garden sections share one configurable template `{ instanceId, name, cols, rows, color, showWires }`; no type-specific descriptors or renderers
- **SVG map** — the garden is rendered as a single inline SVG; section and plant card rendering is fully inlined in `GardenMap.svelte`
- **No router library** — navigation is conditional rendering controlled by stores

---

## Application Layers

```
┌──────────────────────────────────────────────┐
│  Svelte Components (UI layer)                │
│  App.svelte → views → GardenMap / Detail     │
├──────────────────────────────────────────────┤
│  Svelte Stores (shared state)                │
│  plants, currentView, selectedPlantId, toast │
├──────────────────────────────────────────────┤
│  db.js (data layer)                          │
│  Dexie schema, migrations, CRUD, forecasts   │
├──────────────────────────────────────────────┤
│  IndexedDB (persistence)                     │
└──────────────────────────────────────────────┘
```

---

## Data Model

### plants

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `name` | string | display name |
| `type` | string | `'plant'` or `'placeholder'` |
| `sectionId` | string | links plant to a section instance (e.g. `'section-1'`) |
| `color` | hex string | card background tint color |
| `label` | string\|null | user-editable garden label (sorszám); unique index; defaults to id on creation |
| `sortOrder` | number\|null | explicit column position within a row (set when user repositions a placeholder) |

### events

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `plantId` | number | foreign key → plants |
| `eventType` | string | `spray`, `pruned`, `planted`, `flowering`, `harvested`, `crop`, `sickness` |
| `date` | ISO string | event date |
| `notes` | string\|null | optional notes |
| `modifiedAt` | ISO string | last write timestamp |

### settings

Key-value store. Notable keys:

| Key | Value |
|-----|-------|
| `sections` | JSON array of section instance objects |
| `sprayIntervals` | integer (days) — single global spray interval |
| `language` | `'en'` or `'hu'` |
| `lastBackupAt` | ISO string |
| `backupSnoozedUntil` | ISO string |

### photos

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `plantId` | number | foreign key → plants |
| `isMain` | 0\|1 | 1 = shown prominently in detail view and as card thumbnail |
| `data` | Blob | JPEG compressed to max 800px / 70% quality |

### todos

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `text` | string | task description |
| `createdAt` | ISO string | |
| `doneAt` | ISO string\|null | set when marked complete |

---

## Schema

Current version: **1** (reset from v8→v9 legacy chain in the unified section refactor).

Never modify an existing `db.version(N)` block — always add a new `db.version(N+1)`.

---

## Section System

Sections are stored as a JSON array in the `settings` table under the key `'sections'`. Each section instance:

```json
{
  "instanceId": "section-1",
  "name": "Fruit Trees",
  "cols": 6,
  "rows": 1,
  "color": "#a8d5a2",
  "showWires": false
}
```

| Field | Notes |
|-------|-------|
| `instanceId` | unique string, links `plants.sectionId` |
| `name` | free text, user-editable |
| `cols` | 1–8, number of cards per row |
| `rows` | 1–8, fixed row count (1 = unbounded single row) |
| `color` | hex, used as section background tint and plant card tint |
| `showWires` | boolean, draws SVG horizontal lines between rows (trellis/cordon display) |

`DEFAULT_SECTIONS` in `db.js` defines the five sections seeded on first install.

---

## Garden Map Rendering

`GardenMap.svelte` owns the SVG canvas. All rendering is inlined — no separate renderer components. For each section it:

1. Filters `$plants` by `sectionId`, sorts by `sortOrder ?? id`
2. Computes Y position reactively from accumulated section heights
3. Draws a section background rect (tinted with `sec.color`)
4. Renders a tappable section label → opens `SectionSheet`
5. Iterates plants: renders either a dashed placeholder card or a real plant card
6. Wire lines: `{#if sec.showWires && col === 0}` SVG `<line>` per row

Constants: `CARD_W = 52`, `CARD_H = 60`, `ROW_GAP = 10`, `WIRE_COLOR = '#8d6e63'`, `GARDEN_WIDTH = 360`.

Plant card layers (bottom to top):
1. Background rect — `colorToTint(plant.color)` fill
2. Status dot — top-right corner, colored by spray forecast
3. Photo (if available) — clipped to card bounds
4. Label fade gradient — transparent→white at card bottom
5. Plant name text

---

## State Management

| Store | Type | Purpose |
|-------|------|---------|
| `plants` | writable | full plant array; refreshed via `loadPlants()` |
| `currentView` | writable | `'map'`, `'detail'`, `'settings'`, `'eventPanel'` |
| `selectedPlantId` | writable | id of plant open in detail view |
| `searchQuery` | writable | current search string |
| `activeEventTab` | writable | `'events'` or `'todos'` in the event panel |
| `toasts` | writable | array of `{ id, message, type }` |
| `plantEvents` | writable | events for currently selected plant |
| `plantForecast` | writable | forecast for currently selected plant |

Components call `db.js` functions directly in `onMount` for local data. Shared reactive data goes through stores.

---

## Forecast Logic

`calculateNextSpray(plantId)` in `db.js`:

1. Finds the most recent `spray` event for the plant
2. Reads the global spray interval from settings (`sprayIntervals`, default `DEFAULT_SPRAY_DAYS = 14`)
3. Returns `{ status, date, daysUntil }` where status is `'never'`, `'ok'`, `'soon'` (≤3 days), or `'overdue'`

Status is visualised as a colored dot in the top-right corner of each map card.

---

## PWA / Offline

The service worker (`public/sw.js`) uses:
- **Install**: caches app shell assets; does **not** call `skipWaiting()` — waits for user confirmation
- **Activate**: cleans old caches, claims clients
- **Fetch**: network-first for navigation (HTML), stale-while-revalidate for assets
- **Message**: listens for `'SKIP_WAITING'` from the app to activate a waiting SW

`App.svelte` detects a waiting SW on mount and shows `UpdateBanner` — user chooses "Update now" (triggers reload) or "Later".

Data never leaves the device unless the user explicitly exports it.

---

## CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| `deploy.yml` | push to `main` | build + deploy to GitHub Pages |
| `pr-check.yml` | pull request | lint + build, reports bundle size |
| `release.yml` | `v*` tag | creates GitHub Release with `dist/` zip |
