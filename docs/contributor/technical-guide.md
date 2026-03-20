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
  App.svelte           # routing shell
  lib/
    db.js              # ALL database logic
    stores.js          # shared reactive state
    i18n.js            # translations
    sampleData.js      # first-launch seed data
  components/          # UI components
  sections/            # modular section system (see below)
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
- **Schema** - `db.version(N).stores(...)` blocks, one per migration. **Never modify existing blocks.**
- **CRUD** - exported async functions (`addPlant`, `updatePlant`, `deletePlant`, `addEvent`, etc.)
- **Section helpers** - `getSections`, `saveSections`, `addSectionPlant`, `addPlaceholderPlant`, `convertPlaceholder`, `validateColDecrease`, `applyColDecrease`, `applyColIncrease`, `validateRowDecrease`, `applyRowDecrease`, `applyRowIncrease`
- **Forecast** - `calculateNextSpray(plantId)` returns `{ nextDate, status }`
- **Migration helpers** - `migratePlantSectionIds()` (run once from `App.svelte` on first load after v8 upgrade)
- **Backup** - `exportData`, `importData`, `shouldShowBackupPrompt`

#### Adding a DB migration

```js
// Always add at the END of db.js - never edit existing version blocks
db.version(9).stores({
  plants: '++id, name, type, sectionId, [plantId+eventType], bedId, yourNewIndex',
}).upgrade(tx => {
  // optional data migration
});
```

### `src/lib/stores.js`

```js
export const plants        // writable - full plant array
export const currentView   // writable - 'map'|'plant'|'settings'|'todo'
export const currentPlant  // writable - plant id
export const toast         // writable - { message, type }

export async function loadPlants()          // refreshes $plants from DB
export function navigateToPlant(id)        // sets view + plant
export function showToast(msg, type)       // brief notification
```

Components call `loadPlants()` after any write to keep the map in sync.

### `src/lib/i18n.js`

```js
import { t } from '../lib/i18n.js';
// $t('key') in template, t('key') in script
```

Translations are plain objects at the top of `i18n.js` - one for `en`, one for `hu`. Add new keys to both objects. Missing key returns the key string (never throws).

### `src/sections/index.js`

The section registry. Imports all descriptors and renderers; exports `SECTION_REGISTRY` (array) and `SECTION_BY_TYPE` (object keyed by `type`). To register a new section type, add two import lines and one entry to `SECTION_REGISTRY`. See [Adding Sections](./adding-sections.md).

---

## Component Conventions

### SVG rendering

`GardenMap.svelte` contains a single `<svg>` element. Section renderers (`Renderer.svelte` files) emit SVG children directly - no wrapping `<div>` or `<section>`. All coordinates are in SVG user units (viewBox `360` wide).

### Reactivity

- Use `$:` reactive declarations for derived values that depend on multiple reactive inputs
- Avoid calling reactive-dependent functions from `{@const}` inside `{#each}` - `{@const}` does not auto-track dependencies, causing stale values. Compute everything in a `$:` block at the component level
- `$plants` is the Svelte store. After any write to DB call `loadPlants()` to refresh it

### Component props (section renderers)

All renderers receive the same prop set from `GardenMap`. Declare only the props you use; unused ones are safe to omit (Svelte passes them silently, no error). The full set:

```js
export let section;            // { instanceId, type, name, cols?, rows? }
export let descriptor;         // descriptor object from descriptor.js
export let plants;             // filtered, sliced plant array for this section
export let secY;               // Y offset in SVG
export let gardenWidth;        // 360 (constant)
export let bedPlants;          // { [bedId]: plant[] } - only used by BedRenderer
export let onPlantClick;       // (plant, event) => void
export let onPlaceholderClick; // (plant, event) => void
export let getStatusColor;     // (plantId) => '#hex'
export let colorToTint;        // (hex) => 'rgba(...)'
export let tLabel;             // $t function
```

---

## Section System Deep Dive

Each section type is a folder with two files:

```
src/sections/<type>/
  descriptor.js    ← plain JS object, exported as default
  Renderer.svelte  ← SVG fragment component
```

### Plant–section relationship

Each plant row in the `plants` table has a `sectionId` field (e.g. `'grape-1'`). This is the `instanceId` of the section instance stored in the `sections` settings key. Multiple section instances of the same type are supported - they have the same `type` but different `instanceId` values.

### Section instances (stored in settings)

```json
[
  { "instanceId": "fruit-1", "type": "fruit", "name": "fruitTrees", "cols": 6 },
  { "instanceId": "grape-1", "type": "grape", "name": "grapevines", "cols": 5, "rows": 4 },
  { "instanceId": "grape-2", "type": "grape", "name": "grapevines", "cols": 5, "rows": 2 }
]
```

### Placeholder plants

When a section grows (cols/rows increase), placeholder plants fill the new empty slots. They have `type: 'placeholder'` and `placeholderFor: '<section-type>'`. Tapping a placeholder opens `AddPlantInline` in convert mode - it replaces the placeholder record in-place via `convertPlaceholder()`.

---

## Adding a Section Type

See [Adding Sections](./adding-sections.md) for a complete walkthrough.

---

## Git Workflow

```bash
# Always use the wrapper script - it injects the correct author identity
.git/git-push.sh commit -m "feat: ..."
.git/git-push.sh push
.git/git-push.sh acp "commit message"   # add + commit + push in one step
```

Never use plain `git push` - the wrapper sets `GIT_AUTHOR_NAME/EMAIL` to the `HAtt1la` account.

---

## Linting

```bash
npm run lint
```

ESLint flat config. Fix all warnings before opening a PR - the `pr-check.yml` CI workflow runs lint + build and will fail on errors.

---

## Release Process

1. Update version in `README.md`
2. Merge to `main` (triggers auto-deploy to GitHub Pages)
3. Tag the release:
   ```bash
   git tag v1.2.0
   push v1.2.0
   ```
   This triggers `release.yml` and creates a GitHub Release with a `dist/` zip.
