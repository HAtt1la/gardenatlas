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

Current schema version: **2**.

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
  "cols": 6,
  "rows": 1,
  "color": "#a8d5a2",
  "showWires": false
}
```

| Field | Notes |
|-------|-------|
| `instanceId` | unique string - links `plants.sectionId` |
| `name` | free text, user-editable |
| `cols` | 1–8, cards per row |
| `rows` | 1–8, fixed row count (1 = single unbounded row) |
| `color` | hex - section background tint + plant card accent |
| `showWires` | boolean - draws horizontal SVG lines between rows |

`DEFAULT_SECTIONS` in `db.js` defines the seven sections seeded on first install.

---

## Component Conventions

### SVG rendering

`GardenMap.svelte` owns the single `<svg>` element. All section and plant card rendering is inlined - no separate renderer components. Constants at the top of the script:

```js
const CARD_W = 52;
const CARD_H = 60;
const ROW_GAP = 10;
const WIRE_COLOR = '#8d6e63';
const GARDEN_WIDTH = 360;
```

For each section the map:
1. Filters `$plants` by `sectionId`, sorts by `sortOrder ?? id`
2. Computes Y offset from accumulated section heights
3. Draws a background rect (tinted with `sec.color` at `opacity=0.12`)
4. Renders a tappable section label
5. Iterates plants: placeholder cards (dashed) or real plant cards
6. Wire lines: `{#if sec.showWires && col === 0}` SVG `<line>` per row

Plant card layers (bottom to top): background rect → photo (if any) → status dot (health system color) → gradient fade → name text.

### Plant labels (sorszám)

Each plant has a `label` field - a user-editable string for physical garden markers, stored with a unique index (`&label` in Dexie). Call `isLabelTaken(label, excludeId)` before saving. Placeholders have `label: null`.

### Reactivity

- Use `$:` reactive declarations for derived values that depend on multiple reactive inputs
- `{@const}` inside `{#each}` does **not** auto-track Svelte store dependencies - compute in `$:` at component level instead
- After any DB write, call `loadPlants()` to refresh `$plants`

### Dark mode

Plant name text in SVG is locked to dark color with `@media (prefers-color-scheme: dark)` overrides in `GardenMap.svelte`. Do not use `currentColor` for SVG text fills - always use explicit hex values.

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
