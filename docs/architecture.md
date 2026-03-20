# GardenAtlas - Architecture

## Overview

GardenAtlas is an offline-first PWA. There is no backend, no API, no user accounts. All data lives in IndexedDB in the user's browser. The app is a Svelte 4 SPA built with Vite, deployed to GitHub Pages.

---

## Key Design Principles

- **Offline-first** - service worker caches the app shell on first load; every feature works without internet
- **Local-only data** - IndexedDB via Dexie.js; export/import is the sync mechanism
- **Modular sections** - garden sections are plug-in units (`descriptor.js` + `Renderer.svelte`); adding a new type requires only a new folder and two lines in `index.js`
- **SVG map** - the garden is rendered as a single SVG; section renderers emit SVG fragments directly
- **No router library** - navigation is conditional rendering controlled by stores

---

## Application Layers

```
┌──────────────────────────────────────────────┐
│  Svelte Components (UI layer)                │
│  App.svelte → views → GardenMap / Detail     │
├──────────────────────────────────────────────┤
│  Svelte Stores (shared state)                │
│  plants, currentView, currentPlant, toast    │
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
| `type` | string | `fruit`, `grape`, `raspberry`, `bed`, `other`, `placeholder` |
| `sectionId` | string | e.g. `'grape-1'`, `'fruit-1'` - links plant to a section instance |
| `emoji` | string | display emoji |
| `color` | hex string | variety color, used as card background tint |
| `bedId` | number\|null | for plants belonging to a raised bed |
| `sortOrder` | number\|null | column position within a row (grapes) |

### events

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `plantId` | number | foreign key → plants |
| `eventType` | string | `spray`, `prune`, `plant`, `flower`, `harvest`, `crop`, `fertilize` |
| `date` | ISO string | event date |
| `notes` | string\|null | optional notes |
| `modifiedAt` | ISO string | last write timestamp |

### settings

Key-value store. Notable keys:
- `sections` - JSON array of section instance objects
- `sprayIntervalGrape`, `sprayIntervalFruit`, etc. - integers (days)
- `language` - `'en'` or `'hu'`
- `lastBackupPrompt` - ISO string

### photos

| Field | Type | Notes |
|-------|------|-------|
| `id` | auto-increment | primary key |
| `plantId` | number | foreign key → plants |
| `isMain` | 0\|1 | 1 = shown large in detail view |
| `data` | Blob | JPEG compressed to max 800px / 70% quality |

---

## Schema Migrations

Dexie uses versioned upgrade blocks. **Never modify an existing `db.version(N)` block** - always add a new `db.version(N+1)`. Current version: **8**.

---

## Section System

Sections are the core extensibility unit. Each section type lives in `src/sections/<type>/`:

```
src/sections/
  index.js              ← registry
  fruit/
    descriptor.js       ← metadata (card dimensions, cols/rows config, emojis, colors)
    Renderer.svelte     ← SVG fragment renderer
  grape/
    descriptor.js
    Renderer.svelte
  raspberry/
    descriptor.js       ← uses FruitRenderer (aliased in index.js)
  bed/
    descriptor.js
    Renderer.svelte
  other/
    descriptor.js       ← uses FruitRenderer (aliased in index.js)
```

`GardenMap.svelte` renders sections with `<svelte:component this={d.Renderer} .../>`. All sections receive the same prop set; unused props are simply declared and ignored.

### Descriptor fields

| Field | Type | Purpose |
|-------|------|---------|
| `type` | string | unique identifier, matches `plants.type` |
| `defaultName` | string | i18n key for the section name |
| `icon` | emoji | shown in section label and as fallback plant icon |
| `cardW` | number | card width in SVG units |
| `cardH` | number | card height in SVG units |
| `rowGap` | number | vertical gap between card rows |
| `hasCols` | bool | whether the section sheet shows the columns stepper |
| `hasRows` | bool | whether the section sheet shows the rows stepper |
| `defaultCols` | number\|null | initial column count |
| `defaultRows` | number\|null | initial row count (null = unlimited) |
| `minCols/maxCols` | number\|null | stepper bounds |
| `minRows/maxRows` | number\|null | stepper bounds |
| `isBedSection` | bool | `true` → special raised-bed rendering |
| `wireColor` | hex\|null | horizontal wire line color (grape only) |
| `emojis` | string[] | curated emoji palette for this section type |
| `colors` | hex[] | curated color palette for this section type |

### Section instances

The `settings` key `sections` stores an array of section instances. Each instance:

```json
{
  "instanceId": "grape-1",
  "type": "grape",
  "name": "grapevines",
  "cols": 5,
  "rows": 4
}
```

Multiple instances of the same `type` are supported (e.g. two grape sections). Each has a unique `instanceId`.

---

## Garden Map Rendering

`GardenMap.svelte` owns the SVG canvas. For each section it:

1. Looks up the descriptor from `SECTION_BY_TYPE`
2. Filters and slices plants by `sectionId` and `rows * cols` limit
3. Computes Y position reactively (`$: sectionYs`) from accumulated section heights
4. Renders a label (tappable → opens `SectionSheet`)
5. Delegates plant card rendering to `<svelte:component this={d.Renderer} .../>`

SVG viewBox is fixed at `360` units wide; height is computed dynamically.

---

## State Management

| Store | Type | Purpose |
|-------|------|---------|
| `plants` | writable | loaded plant array; refreshed via `loadPlants()` |
| `currentView` | writable | `'map'`, `'plant'`, `'settings'`, `'todo'` |
| `currentPlant` | writable | plant id currently open in detail view |
| `toast` | writable | `{ message, type }` for the toast component |

Components call `db.js` functions directly in `onMount` for local data. Shared reactive data goes through stores.

---

## Forecast Logic

`calculateNextSpray(plantId)` in `db.js`:

1. Finds the most recent `spray` event for the plant
2. Reads the spray interval for the plant's type from settings
3. Returns `{ nextDate, status }` where status is `'ok'`, `'soon'` (within 3 days), or `'overdue'`

Status is visualised as a colored dot in the top-right corner of each map card.

---

## Offline / PWA

The service worker (`public/sw.js`) caches the app shell on install and serves it from cache on subsequent loads. Cache is versioned; a new deploy bumps the version string and purges the old cache.

Data never leaves the device unless the user explicitly exports it.

---

## CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| `deploy.yml` | push to `main` | build + deploy to GitHub Pages |
| `pr-check.yml` | pull request | lint + build, reports bundle size |
| `release.yml` | `v*` tag | creates GitHub Release with `dist/` zip |
