# Adding a New Section Type

This guide walks through creating a new section type from scratch. The example adds a `herb` section - a simple grid of herb plants with a green-toned color palette.

---

## Overview

Adding a section type requires:

1. A folder `src/sections/<type>/` with two files
2. One entry in `src/sections/index.js`

That's it. No other files need to be touched — translations, spray intervals, and the Settings UI all update automatically from the descriptor.

---

## Step 1 - Create `descriptor.js`

```js
// src/sections/herb/descriptor.js
export default {
  type: 'herb',
  defaultName: 'herbGarden',   // key used internally to identify section instances
  icon: '🌿',
  cardW: 56, cardH: 58, rowGap: 10,
  hasCols: true,   // show columns stepper in section sheet
  hasRows: false,  // no fixed row count - grows as plants are added
  defaultCols: 4,
  defaultRows: null,
  minCols: 1, maxCols: 6,
  minRows: 1, maxRows: 8,
  isBedSection: false,
  wireColor: null,
  defaultSprayDays: null,   // set to a number (e.g. 14) to enable spray tracking
  labels: {
    en: { section: 'Herb Garden', type: 'Herb' },
    hu: { section: 'Gyógynövény kert', type: 'Gyógynövény' },
  },
  emojis: ['🌿', '🌱', '🪴', '🍃', '☘️', '🌾', '🧄', '🧅'],
  colors: ['#27ae60', '#6aaa2a', '#16a085', '#f0c040', '#8b5e3c', '#e07a8e'],
};
```

### Descriptor field reference

| Field | Notes |
|-------|-------|
| `type` | Unique string. Also becomes `plants.type` for plants in this section. No spaces or special chars. |
| `defaultName` | Internal key used as the default section instance name. Must be unique across all section types. |
| `icon` | Emoji shown in the section header label. |
| `cardW` / `cardH` | Card dimensions in SVG units. Max safe columns = `floor(352 / cardW)`. |
| `rowGap` | Vertical gap between card rows (SVG units). |
| `hasCols` | `true` → section sheet shows a columns stepper. |
| `hasRows` | `true` → section sheet shows a rows stepper (for trellis-style fixed grids like grapes). |
| `defaultCols` | Initial column count when the section is first created. |
| `defaultRows` | Initial row count. Use `null` for unlimited (plant count drives height). |
| `minCols/maxCols` | Stepper min/max bounds. Set `maxCols` to `floor(352 / cardW)` to prevent card overlap. |
| `minRows/maxRows` | Stepper min/max bounds. |
| `isBedSection` | `true` only for raised-bed sections - uses a special renderer. |
| `wireColor` | Hex color for a horizontal wire line across each row (grape trellis style). `null` = no wire. |
| `defaultSprayDays` | Default spray interval in days. `null` disables spray tracking for this type. When set, the section automatically appears in Settings → Spray Intervals. |
| `labels` | Display names per language. **Both `en` and `hu` are required.** `section` = section header / settings label. `type` = plant type label in plant detail view. |
| `emojis` | Curated emoji picker for this section type. Shown in the add-plant form. |
| `colors` | Curated color picker. |

---

## Step 2 - Create `Renderer.svelte`

The renderer emits SVG elements directly - no wrapper element. For most section types, the fruit renderer layout works as-is — alias it in `index.js` instead of creating a new file (see Step 3).

Only create a new `Renderer.svelte` if you need a distinct visual layout (e.g. wire lines, fixed-slot grid).

If you do need a custom renderer, copy `src/sections/fruit/Renderer.svelte` and adjust as needed. All renderers receive the same prop set from `GardenMap`:

```js
export let section;            // { instanceId, type, name, cols?, rows? }
export let descriptor;         // descriptor object from descriptor.js
export let plants;             // filtered, sliced plant array for this section
export let secY;               // Y offset in SVG
export let gardenWidth;        // 360 (constant)
export let plantThumbs;        // { [plantId]: objectURL } - photo thumbnails
export let onPlantClick;       // (plant, event) => void
export let onPlaceholderClick; // (plant, event) => void
export let getStatusColor;     // (plantId) => '#hex'
export let colorToTint;        // (hex) => 'rgba(...)'
export let tLabel;             // $t function
```

For a wire-trellis layout (like grape), add a horizontal line before each row:

```svelte
{#if col === 0}
  <line x1="4" y1={ty + descriptor.cardH/2} x2={gardenWidth - 4} y2={ty + descriptor.cardH/2}
    stroke={descriptor.wireColor} stroke-width="1.5" opacity="0.3" />
{/if}
```

---

## Step 3 - Register in `index.js` ← only required change outside the section folder

```js
// src/sections/index.js
import fruitDesc     from './fruit/descriptor.js';
// ... existing imports ...
import herbDesc      from './herb/descriptor.js';        // ← add

import FruitRenderer from './fruit/Renderer.svelte';
// ... existing imports ...
import HerbRenderer  from './herb/Renderer.svelte';      // ← add (or alias below)

const RaspberryRenderer = FruitRenderer;
const OtherRenderer     = FruitRenderer;
const ShrubRenderer     = FruitRenderer;
const HerbRenderer      = FruitRenderer;                 // ← alias if no custom renderer needed

export const SECTION_REGISTRY = [
  { ...fruitDesc,     Renderer: FruitRenderer },
  // ... existing entries ...
  { ...herbDesc,      Renderer: HerbRenderer },           // ← add
];
```

**That's all.** After this one edit:
- The section appears in Settings → Add Section list
- Section names (`herbGarden`) are registered in EN and HU translations automatically
- Plant type labels (`herb`) are registered automatically
- If `defaultSprayDays` is set, the section appears in Settings → Spray Intervals automatically

---

## Step 4 - Add sample data (optional)

Open `src/lib/sampleData.js`. Sample plants need a `sectionId` that matches the `instanceId` that `DEFAULT_SECTIONS` will assign on first launch.

Check `DEFAULT_SECTIONS` in `db.js` to see the instanceId pattern - it's `'<type>-1'` for the first instance.

```js
// in sampleData.js
{ name: 'Basil', type: 'herb', sectionId: 'herb-1', emoji: '🌿', color: '#27ae60', ... },
{ name: 'Mint',  type: 'herb', sectionId: 'herb-1', emoji: '🌱', color: '#16a085', ... },
```

---

## Step 5 - Add to `DEFAULT_SECTIONS` in `db.js` (optional)

If you want the section to appear by default on first install:

```js
// in db.js, DEFAULT_SECTIONS array
{ instanceId: 'herb-1', type: 'herb', name: 'herbGarden', cols: 4 },
```

---

## Step 6 - Verify

```bash
npm run build   # must produce zero errors and zero warnings
npm run dev     # open in browser, check Settings → Add Section shows the new type
                # add the section, add a plant, check map rendering
```

---

## Checklist

- [ ] `src/sections/<type>/descriptor.js` created with `labels` (both `en` and `hu`) and `defaultSprayDays`
- [ ] `src/sections/<type>/Renderer.svelte` created **or** renderer aliased in `index.js`
- [ ] Entry added to `SECTION_REGISTRY` in `src/sections/index.js` ← **only required change outside the section folder**
- [ ] `npm run build` - zero warnings
- [ ] Section appears in Settings add list
- [ ] Section name displays correctly in EN and HU
- [ ] Plants render correctly on the map
- [ ] Section sheet opens on name tap; columns/rows stepper works if enabled
- [ ] Add Plant form uses the section's emoji and color palette
- [ ] If `defaultSprayDays` is non-null: section appears in Settings → Spray Intervals
