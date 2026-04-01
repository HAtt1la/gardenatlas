# GardenAtlas - Architecture

## Overview

GardenAtlas is an offline-first PWA. There is no backend, no API, no user accounts. All data lives in IndexedDB in the user's browser. The app is a Svelte 4 SPA built with Vite, deployed to GitHub Pages.

---

## Key Design Principles

- **Offline-first** - service worker caches the app shell on first load; every feature works without internet
- **Local-only data** - IndexedDB via Dexie.js; export/import is the sync mechanism
- **Unified sections** - all garden sections share one configurable template `{ instanceId, name, cols, rows, color, showWires }`; no type-specific descriptors or renderers
- **SVG map** - the garden is rendered as a single inline SVG; section and plant card rendering is fully inlined in `GardenMap.svelte`
- **No router library** - navigation is conditional rendering controlled by stores

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
│  health.js (health engine)                   │
│  Derives open tasks + health status          │
├──────────────────────────────────────────────┤
│  db.js (data layer)                          │
│  Dexie schema, migrations, CRUD, seed data   │
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
| `type` | string | `'grape'`, `'fruit'`, `'raspberry'`, `'bed'`, `'other'`, or `'placeholder'` |
| `sectionId` | string | links plant to a section instance |
| `color` | hex string | card background tint color |
| `label` | string\|null | user-editable garden label (sorszám); unique index; defaults to id on creation |
| `sortOrder` | number\|null | explicit column position within a row |
| `profileId` | number\|null | foreign key → careProfiles (one care profile per plant) |

### events

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `plantId` | number | foreign key → plants |
| `eventType` | string | `spray`, `pruned`, `planted`, `flowering`, `harvested`, `crop`, `sickness`, `watered`, `other` |
| `date` | ISO string | event date |
| `notes` | string\|null | optional notes |
| `modifiedAt` | ISO string | last write timestamp |
| `source` | string\|null | reserved for system-written events (e.g. `'system:missed'`) |

### settings

Key-value store. Notable keys:

| Key | Value |
|-----|-------|
| `sections` | JSON array of section instance objects |
| `sprayIntervals` | integer (days) - single global spray interval |
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

### careProfiles

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `name` | string | profile name (e.g. "Apple tree") |
| `description` | string\|null | optional description |
| `isBuiltin` | boolean | built-in profiles cannot be deleted |

### careRules

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `profileId` | number | foreign key → careProfiles |
| `trigger` | string | `'season'`, `'event:flowering'`, `'event:sickness'`, `'event:pruned'` |
| `triggerMonths` | number[] | months (1–12) active, used when `trigger === 'season'` |
| `action` | string | `'spray'`, `'prune'`, `'water'` |
| `product` | string\|null | optional product name |
| `purpose` | string | human-readable reason for this rule |
| `windowDays` | number | days after trigger before rule expires (sickness rules never expire by time) |

---

## Schema

Current version: **2**.

Never modify an existing `db.version(N)` block - always add a new `db.version(N+1)`.

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

`DEFAULT_SECTIONS` in `db.js` defines the seven sections seeded on first install.

---

## Garden Map Rendering

`GardenMap.svelte` owns the SVG canvas. All rendering is inlined - no separate renderer components. For each section it:

1. Filters `$plants` by `sectionId`, sorts by `sortOrder ?? id`
2. Computes Y position reactively from accumulated section heights
3. Draws a section background rect (tinted with `sec.color`)
4. Renders a tappable section label → opens `SectionSheet`
5. Iterates plants: renders either a dashed placeholder card or a real plant card
6. Wire lines: `{#if sec.showWires && col === 0}` SVG `<line>` per row

Constants: `CARD_W = 52`, `CARD_H = 60`, `ROW_GAP = 10`, `WIRE_COLOR = '#8d6e63'`, `GARDEN_WIDTH = 360`.

Plant card layers (bottom to top):
1. Background rect - `colorToTint(plant.color)` fill
2. Photo (if available) - clipped to card bounds
3. Status dot - top-right corner, colored by **health system** (`good`/`fair`/`poor`/`bad`/`none`)
4. Label fade gradient - transparent→white at card bottom
5. Plant name text

---

## Health System

`src/lib/health.js` derives plant health at runtime - no separate stored table.

### How health is computed (`getPlantHealth(plantId)`)

1. Load the plant's assigned care profile and its rules
2. For each rule, check if its trigger is currently active:
   - `season`: current month is in `rule.triggerMonths`
   - `event:flowering` / `event:pruned`: found such an event within `windowDays` of today
   - `event:sickness`: found a sickness event with no matching spray after it (persistent, no time expiry)
3. If trigger is active, check if the required action was recorded within `windowDays`
4. If not → open issue
5. Count open issues → `0=good`, `1=fair`, `2=poor`, `≥3=bad`; no profile → `none`

### HEALTH_COLORS

```js
export const HEALTH_COLORS = {
  good: '#27ae60',   // green
  fair: '#f0c040',   // yellow
  poor: '#e67e22',   // orange
  bad:  '#e74c3c',   // red
  none: '#95a5a6'    // grey
};
```

### Built-in profiles

Seven profiles are seeded by `seedCareProfiles()` in `db.js` (called on app mount): Grape, Apple, Pear, Plum, Cherry, Raspberry, Rose. Profiles with `isBuiltin: true` cannot be deleted but can be edited.

---

## State Management

| Store | Type | Purpose |
|-------|------|---------|
| `plants` | writable | full plant array; refreshed via `loadPlants()` |
| `currentView` | writable | `'map'`, `'detail'`, `'settings'`, `'careProfiles'`, `'eventPanel'` |
| `selectedPlantId` | writable | id of plant open in detail view |
| `searchQuery` | writable | current search string |
| `activeEventTab` | writable | `'events'` or `'todos'` in the event panel |
| `toasts` | writable | array of `{ id, message, type }` |
| `plantEvents` | writable | events for currently selected plant |
| `plantForecast` | writable | spray forecast for currently selected plant |
| `plantHealth` | writable | health result `{ status, issues, noProfile }` for currently selected plant |

Navigation helpers: `navigateToMap()`, `navigateToSettings()`, `navigateToCareProfiles()`, `navigateToMultiEvent()`, `navigateToTodos()`.

Components call `db.js` functions directly in `onMount` for local data. Shared reactive data goes through stores.

---

## Forecast

`calculateNextSpray(plantId)` in `db.js` is still exported and used by `PlantDetail` to show the next spray date. It reads the most recent `spray` event and the global `sprayIntervals` setting. Status: `'never'`, `'ok'`, `'soon'` (≤3 days), `'overdue'`.

The **map status dot** uses the health system (`health.js`), not this forecast.

---

## PWA / Offline

The service worker (`public/sw.js`) uses:
- **Install**: caches app shell assets; does **not** call `skipWaiting()` - waits for user confirmation
- **Activate**: cleans old caches, claims clients
- **Fetch**: network-first for navigation (HTML), stale-while-revalidate for assets
- **Message**: listens for `'SKIP_WAITING'` from the app to activate a waiting SW

`App.svelte` detects a waiting SW on mount and shows `UpdateBanner` - user chooses "Update now" (triggers reload) or "Later".

Data never leaves the device unless the user explicitly exports it.

---

## CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| `deploy.yml` | push to `main` | build + deploy to GitHub Pages |
| `pr-check.yml` | pull request | lint + build, reports bundle size |
| `release.yml` | `v*` tag | creates GitHub Release with `dist/` zip |
