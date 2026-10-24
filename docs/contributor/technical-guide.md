# Contributor Technical Guide

This document covers the internals you need to understand before contributing to GardenAtlas.

---

## Prerequisites

- Node.js 18+
- Familiarity with Svelte 4 and ES modules
- Basic understanding of IndexedDB / Dexie.js

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run lint     # ESLint (flat config)
npm run build    # production build
```

There is no test framework. Verify changes with `npm run build` (zero warnings) and manual testing in the browser.

---

## Repository Layout

```
src/
  main.js              # SW registration, Svelte mount
  App.svelte           # routing shell + SW update detection
  lib/
    db.js              # ALL database logic + care profile seed
    health.js          # health engine - derives status from rules + events
    stores.js          # shared reactive state
    i18n.js            # translations (EN/HU)
    sampleData.js      # first-launch seed data
  components/          # UI components
public/
  sw.js                # service worker
  manifest.json        # PWA manifest
docs/
  architecture.md
  contributor/
  user/
```

---

## Key Files

### `src/lib/db.js`

Everything that touches IndexedDB lives here. No component should import Dexie directly.

Structure:
- **Schema** - `db.version(N).stores(...)` blocks. **Never modify existing blocks.** Add a new `db.version(N+1)` for every schema change.
- **CRUD** - exported async functions (`addPlant`, `updatePlant`, `deletePlant`, `addEvent`, `updateEvent`, `deleteCareProfile`, etc.)
- **Section helpers** - `getSections`, `saveSections`, `addSectionPlant`, `addPlaceholderPlant`, `convertPlaceholder`, `validateColDecrease`, `applyColDecrease`, `applyColIncrease`, `validateRowDecrease`, `applyRowDecrease`, `applyRowIncrease`
- **Label helpers** - `isLabelTaken(label, excludeId)` - unique plant label validation
- **Care profile helpers** - `getCareProfiles`, `getCareProfile`, `getCareRulesForProfile`, `addCareProfile`, `updateCareProfile`, `deleteCareProfile`, `addCareRule`, `updateCareRule`, `deleteCareRule`, `seedCareProfiles`
- **Forecast** - `calculateNextSpray(plantId)` returns `{ nextDate, status, daysUntil }`
- **Backup** - `exportData`, `importData`, `shouldShowBackupPrompt`

Current schema version: **3**.

#### Adding a DB migration

```js
// Always add at the END of db.js - never edit existing version blocks
db.version(3).stores({
  plants: '++id, name, type, sectionId, color, &label, profileId, yourNewIndex',
}).upgrade(tx => {
  // optional data migration
});
```

### `src/lib/health.js`

Health engine. Does not touch IndexedDB directly - it calls `db.js` helpers.

```js
export async function getPlantHealth(plantId)
// Returns { status: 'good'|'fair'|'poor'|'bad'|null, issues: [...], noProfile: boolean }
// Derives open care tasks from careRules + events at runtime

export async function getAllPlantHealthStatuses(plants)
// Batch version → { [plantId]: { status, issueCount } }

export const HEALTH_COLORS
// { good, fair, poor, bad, none } hex color map
```

### `src/lib/stores.js`

```js
export const plants           // writable - full plant array
export const currentView      // writable - 'map'|'detail'|'settings'|'careProfiles'|'eventPanel'
export const selectedPlantId  // writable - id of plant open in detail view
export const searchQuery      // writable - current search string
export const activeEventTab   // writable - 'events'|'todos'
export const toasts           // writable - array of { id, message, type }
export const plantEvents      // writable - events for selected plant
export const plantForecast    // writable - spray forecast for selected plant
export const plantHealth      // writable - health result { status, issues, noProfile }

export async function loadPlants()              // refreshes $plants from DB
export function navigateToMap()
export function navigateToSettings()
export function navigateToCareProfiles()
export function navigateToMultiEvent()
export function navigateToTodos()
export function showToast(msg, type)            // brief notification
```

Components call `loadPlants()` after any write to keep the map in sync.

### `src/lib/i18n.js`

```js
import { t } from '../lib/i18n.js';
// $t('key') in template, t('key') in script
```

Translations are plain objects inside `i18n.js` - one for `en`, one for `hu`. Add new keys to both objects. Missing key returns the key string (never throws).

Parameter interpolation: use `{paramName}` placeholders in translation strings. Pass values as `$t('key', { paramName: value })`.

---

## Section System

Sections are stored as a JSON array under the `sections` settings key. There is no section type registry - all sections use the same configurable shape:

```json
{
  "instanceId": "section-1",
  "name": "Fruit Trees",
  "color": "#a8d5a2"
}
```

| Field | Notes |
|-------|-------|
| `instanceId` | unique string - links `plants.sectionId` |
| `name` | free text, user-editable |
| `color` | hex - section background tint + plant card accent |

Since the hexagonal layout (schema v4), placement is per-plant axial hex coordinates, so sections no longer carry `cols`/`rows`/`showWires`. `getAllSections()` strips those legacy fields from stored sections for backwards compatibility, and `Settings.svelte` still creates new sections with them before the strip - harmless, but do not build new features on these fields.

Layout behavior is per-section: `GardenMap.svelte` bounds each hex cluster and centers it in the section strip; wide clusters overflow horizontally and are reached by panning (see Zoom & pan below).

`DEFAULT_SECTIONS` in `db.js` defines the seven sections seeded on first install.

---

## Component Conventions

### SVG rendering

`GardenMap.svelte` owns the single `<svg>` element; `HexCard.svelte` renders each plant hexagon. Constants at the top of the map script:

```js
const GARDEN_WIDTH = 360;   // viewBox width at zoom 1
const SECTION_HEADER_H = 28;
const SECTION_GAP = 18;
const DRAG_THRESHOLD = 5;   // px until a press counts as a drag
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
```

The `viewBox` is the visible window onto the garden: `vx, vy, GARDEN_WIDTH/zoom, totalHeight/zoom`. Because the element height follows the aspect ratio, `getScreenCTM()` maps pointer events straight to world coordinates at any zoom - hit-testing (`svgPointToHex`) never needs to undo the zoom manually.

For each section the map:
1. Filters `$plants` by `sectionId`, maps each to hex pixel space via `axialToPixel`
2. Bounds the hex cluster in hex space, centers it in the strip (`offsetX/offsetY`), renders background rect tinted with `sec.color` at `opacity 0.12`
3. Renders a tappable section label (opens `SectionSheet`)
4. Renders each plant as a positioned `<g>` with `HexCard`
5. In Arrange mode additionally draws hoverHex snap highlight + drag ghost

Plant hex card layers (bottom to top): hexagon clip (`hexPath`) → tint fill → photo (if any) → status dot (health system color) at the top vertex → name text with white halo (`paint-order: stroke`).

### Plant labels (sorszám)

Each plant has a `label` field - a user-editable string for physical garden markers, stored with a unique index (`&label` in Dexie). Call `isLabelTaken(label, excludeId)` before saving. Plants created without a label have `label: null` - IndexedDB skips null keys in unique indexes, so any number of unlabeled plants can coexist.

### Reactivity

- Use `$:` reactive declarations for derived values that depend on multiple reactive inputs
- `{@const}` inside `{#each}` does **not** auto-track Svelte store dependencies - compute in `$:` at component level instead
- After any DB write, call `loadPlants()` to refresh `$plants`

### Dark mode

There are no dark-mode overrides - the app renders light only (`<meta name="color-scheme" content="light">` in `index.html`). Plant name text in SVG uses explicit fills (`#111`), never `currentColor`.

---

## PWA / Service Worker

`public/sw.js` uses network-first for navigation, stale-while-revalidate for assets. It does **not** call `self.skipWaiting()` on install - it waits for a `'SKIP_WAITING'` message from the app.

`App.svelte` detects a waiting SW on mount and shows `UpdateBanner`. When the user taps "Update now", the app posts `'SKIP_WAITING'` to the waiting SW, then reloads on `controllerchange`.

---

## Linting

```bash
npm run lint
```

ESLint flat config. Fix all warnings before opening a PR - the `pr-check.yml` CI workflow runs lint + build and will fail on errors.

---

## Care Profiles

Care profiles are the knowledge base for plant health. Each plant can have one profile assigned via `plant.profileId`.

### Structure

- **`careProfiles`** - named rule sets (`{ id, name, description, isBuiltin }`)
- **`careRules`** - individual rules per profile:
  - `trigger`: `'season'` | `'event:flowering'` | `'event:sickness'` | `'event:pruned'`
  - `triggerMonths`: array of months 1–12 (only for `'season'` trigger)
  - `action`: `'spray'` | `'prune'` | `'water'`
  - `purpose`: human-readable reason
  - `product`: optional product name
  - `windowDays`: window for action to satisfy the rule (sickness rules never expire by time)

### Built-in profiles

`seedCareProfiles()` in `db.js` inserts 7 profiles on first run (idempotent - skips if they already exist). Built-in profiles have `isBuiltin: true` and cannot be deleted.

### UI

`CareProfiles.svelte` provides the full CRUD interface (navigated to from Settings). Accessible via `navigateToCareProfiles()`.

---

## Release Process

1. Update version in `README.md`
2. Merge to `main` (triggers auto-deploy to GitHub Pages)
3. Tag the release - this triggers `release.yml` and creates a GitHub Release with a `dist/` zip

## Hexagonal Grid Layout

Every plant carries axial hex coordinates `(q, r)` — sections are containment and grouping only; placement is per-plant. Pointy-top hexes (vertex up/down): a constant `r` renders as a straight horizontal row of hexes (grapevines read as rows on the wires), while fruit trees can be placed freely anywhere on the map.

**Hex utilities** (`src/lib/hex.js`):
- Pointy-top geometry: `HEX_SIZE = 30` (radius center → vertex), `HEX_W = √3·size`, `HEX_H = 2·size`
- `axialToPixel()` / `pixelToAxial()` conversions with cube-round `axialRound()`
- `hexNeighbors()`, `hexDistance()`, `findFreeHex()` (spiral search for the nearest unoccupied cell)
- `hexPath()` for SVG rendering, `colorToTint()` for card fills

**Database** (`src/lib/db.js`):
- Schema v4: `q`, `r` on plants, compound index `[sectionId+q+r]`
- `ensureHexPositions()`: idempotent startup self-heal — missing coords assigned, overlaps re-placed
- Placeholder system and row/col layout helpers removed (`removePlant()` = delete)
- `movePlantToHex()`, `addPlantAtHex()`, `addSectionPlant()`

**Components**:
- `GardenMap.svelte` + `HexCard.svelte`: hexagonal card rendering with drag & drop, see Component Conventions below
- `SectionSheet.svelte`: name + color only (plus an inline add-plant form)
- `AddPlantInline.svelte`: opens on an empty hex under the cursor
- `PlantDetail.svelte`: "Remove plant" deletes instead of converting placeholders

See the dated entries below for the full change history of the migration.

## Fixed — hexagonal rendering & drag (2026-10-24)

**Why hexes overlapped:** `hexPath()` drew a flat-top hexagon (vertices at
0°/60°/120°, width = 2·size) while `axialToPixel()` used pointy-top spacing
(width √3·size). Cards were 9% wider than their allotted column — every
card clipped into its horizontal neighbor.

Fixes:
- `src/lib/hex.js` — rewritten: true pointy-top geometry (`HEX_SIZE=26`
  at first; later raised to `30` — see the 2026-10-24 zoom/pan entry),
  `HEX_W=sqrt(3)*s`, `HEX_H=2*s`, correct cube (`axialRound`)
  rounding, `findFreeHex()` spiral search for the nearest free cell,
  `colorToTint()` helper. Verified: bounding box width equals column
  spacing; all 6 neighbors are exactly `HEX_W` away → perfect honeycomb.
- `src/components/HexCard.svelte` — new shared hex-card renderer
  (photo clipped to hex, white-halo name text via `paint-order: stroke`,
  status dot at the top vertex). Used by the map and the drag ghost.
- `src/components/GardenMap.svelte` — rewritten:
  - section layout computes the *cluster bounds in hex space* (card extents,
    not centers) and centers it in the section strip — originally scaled wide
    clusters down to fit; this was dropped later (see 2026-10-24 zoom/pan
    entry) because it made hexes tiny on phones;
  - drag & drop switched to **pointer events** (works on touch + mouse),
    with pointer capture, a drag threshold, a snapped ghost card and a
    green/red highlight showing whether the target hex is free/occupied;
  - drops onto an occupied cell snap to the *nearest free hex* instead of
    stacking; plants can also be dragged across sections;
  - tapping an empty hex in Arrange mode opens the add-plant form
    (`AddPlantInline`) instead of silently creating a plant named `newPlant`;
  - the click that follows a drag is suppressed.
- `src/lib/db.js` — `ensureHexPositions()` (idempotent startup
  normalizer; any plant missing `q`/`r` gets a non-colliding position),
  `movePlantToHex(id, sectionId, q, r)` supports cross-section moves,
  `addSectionPlant()` now places new plants at the first free hex,
  removed the legacy `convertToPlaceholder()` shim (replace = delete:
  `removePlant()`).
- `src/App.svelte` — calls `ensureHexPositions()` once on startup and
  reloads plants if anything was written.
- `src/lib/sampleData.js` — all sample plants carry `q`/`r` (grapevines in
  straight pointy-top rows, fruit trees scattered organically).
- i18n — added `arrange`, `done`, `arrangeHint` (EN/HU); "Mark as removed"
  → "Remove plant" wording now matches the real delete behavior.

Remaining work:
- polish: keyboard-accessible arrange mode, undo for accidental moves
  (pinch-zoom/pan was delivered — see 2026-10-24 zoom/pan entry)

## Zoom & pan for the hex map + bigger hexes (2026-10-24)

After real-world testing, the fruit cluster (a 6-wide staggered block ≈520
world px) was being scaled down to ~60% to fit the 360-px canvas — hexes were
barely readable on a phone. Two-part fix:

- **Bigger base hexes:** `HEX_SIZE` 26 → 30 (`src/lib/hex.js`); HexCard label
  9 → 10.5 px, status dot slightly larger.
- **No more auto-scaling down:** the per-section fit-to-width scale was
  removed. Sections render their clusters at full hex size; wide clusters
  simply extend past the initial 360-px viewport and become reachable by
  panning. Section tint rectangles/separators now span the cluster extents
  (`bgX`/`bgR` per layout) so the tint follows the content.
- **Zoom & pan via a dynamic viewBox "window":** the SVG's `viewBox` is
  `vx, vy, GARDEN_WIDTH/zoom, totalHeight/zoom`. Element height auto keeps
  the box constant (aspect unchanged), so `getScreenCTM()` maps every
  pointer event straight to world coordinates — `svgPointToHex()` and the
  whole drag/drop path work **unchanged at any zoom level**.
  - pinch (two pointers, anchored on the finger midpoint), ctrl/alt+wheel
    (anchored at the cursor), double-click/double-tap (toggle 1 ↔ 2.4×),
    +/−/⌖ buttons (`zoomBy`, `resetView`), zoom clamped 0.5–4×;
  - one-finger pan: horizontal only at zoom 1 in normal mode (vertical page
    scrolling is kept via `touch-action: pan-y`), full pan while zoomed or
    arranging (`touch-action: none` when `editMode || zoom > 1`);
  - plant drags take precedence: a second finger while dragging is ignored;
    pan/pinch set `suppressClickUntil` so a pan never triggers navigation or
    the add-plant modal, and a double-tap guard keeps double-tap zoom from
    opening the add form;
  - zoom buttons overlay bottom-right of the map with i18n labels
    (`zoomIn`/`zoomOut`/`resetView`, EN/HU).

## PWA install fix (2026-10-24)

The app was never installable: `index.html` linked the manifest with an
absolute path (`/manifest.json`), which 404s under the `/gardenatlas/` base
both in dev and on GitHub Pages — no manifest, no install prompt
("Create shortcut" only). Manifest and icons are now base-relative
(`manifest.json`, `icon.svg`, `icon-192.png`) and `manifest.json` gained the
recommended `"id": "/gardenatlas/"`. Note: installing still requires a
secure context — localhost (desktop) and any HTTPS deployment work; opening
the dev server over plain HTTP from a LAN IP (phone testing) cannot install
by design.

## Old backup compatibility (2026-10-24)

Backups exported by pre-hex versions (schema ≤ v3) load with every plant
stacked on hex (0,0) — plants carry no `q`/`r` at all. Hardened both the
app and the data path:

- `src/lib/db.js — ensureHexPositions()` now resolves **overlaps**, not
  just missing coordinates: plants sharing a cell are re-placed on the
  nearest free hex (ring search from `findFreeHex()`). Idempotent — runs
  on every startup from `App.svelte` onMount.
- `src/lib/db.js — importData()` calls the new `healImportedData()` after
  the raw bulk-add: re-homes plants whose `sectionId` no longer exists to
  the first section, strips obsolete `sortOrder` fields, then runs
  `ensureHexPositions()`. Old backups import cleanly with no reload.
- `.temp/convert-backup.mjs` — standalone converter that produces a
  hex-compatible backup file offline. Reproduces the original row layout
  on the hex grid (row size = the section's old `cols`), re-homes orphan
  sections ("Bed A/B/C" placeholders found under the defunct `bed-1` id
  moved into "Magaságyás"), strips `sortOrder` and the old `cols/rows/
  showWires` section fields, validates uniqueness of every hex cell, and
  preserves events/photos/settings untouched.

Result for the 2026-10-24 backup (98 plants, 366 events, 56 photos):
`.temp/gardenatlas-backup-2026-10-24-hex.json` — import this via
Settings → Import. Grapevines stay in straight rows of 6, fruit trees
land in a 6×9 block that can be rearranged in Arrange mode.
