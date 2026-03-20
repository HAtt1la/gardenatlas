# Adding a New Section Type

This guide walks through creating a new section type from scratch. The example adds a `herb` section - a simple grid of herb plants with a green-toned color palette.

---

## Overview

Adding a section type requires:

1. A folder `src/sections/<type>/` with two files
2. One entry in `src/sections/index.js`
3. An i18n key for the default section name
4. Sample data entries (optional but recommended)

That's it. No changes to `GardenMap.svelte`, `SectionSheet.svelte`, or `Settings.svelte`.

---

## Step 1 - Create `descriptor.js`

```js
// src/sections/herb/descriptor.js
export default {
  type: 'herb',
  defaultName: 'herbGarden',   // i18n key
  icon: '🌿',
  cardW: 56, cardH: 58, rowGap: 10,
  hasCols: true,   // show columns stepper in section sheet
  hasRows: false,  // no fixed row count - grows as plants are added
  defaultCols: 4,
  defaultRows: null,
  minCols: 1, maxCols: 8,
  minRows: 1, maxRows: 8,
  isBedSection: false,
  wireColor: null,
  emojis: ['🌿', '🌱', '🪴', '🍃', '☘️', '🌾', '🧄', '🧅'],
  colors: ['#27ae60', '#6aaa2a', '#16a085', '#f0c040', '#8b5e3c', '#e07a8e'],
};
```

### Descriptor field reference

| Field | Notes |
|-------|-------|
| `type` | Unique string. Also becomes `plants.type` for plants in this section. No spaces or special chars. |
| `defaultName` | i18n key. Must be added to `src/lib/i18n.js` (step 3). |
| `icon` | Emoji shown in the section header label. |
| `cardW` / `cardH` | Card dimensions in SVG units. Wider sections can use smaller cards. |
| `rowGap` | Vertical gap between card rows (SVG units). |
| `hasCols` | `true` → section sheet shows a columns stepper. |
| `hasRows` | `true` → section sheet shows a rows stepper (for trellis-style fixed grids like grapes). |
| `defaultCols` | Initial column count when the section is first created. |
| `defaultRows` | Initial row count. Use `null` for unlimited (plant count drives height). |
| `minCols/maxCols` | Stepper min/max bounds. |
| `minRows/maxRows` | Stepper min/max bounds. |
| `isBedSection` | `true` only for raised-bed sections - uses a special renderer. |
| `wireColor` | Hex color for a horizontal wire line across each row (grape trellis style). `null` = no wire. |
| `emojis` | Curated emoji picker for this section type. Shown in the add-plant form. |
| `colors` | Curated color picker. |

---

## Step 2 - Create `Renderer.svelte`

The renderer emits SVG elements directly - no wrapper element. For most section types, copy the fruit renderer and adjust the threshold in the `textLength` expression.

```svelte
<!-- src/sections/herb/Renderer.svelte -->
<script>
  export let section;
  export let descriptor;
  export let plants;
  export let secY;
  export let gardenWidth;
  export let onPlantClick;
  export let onPlaceholderClick;
  export let getStatusColor;
  export let colorToTint;
  export let tLabel;

  $: cols = section.cols ?? 1;
  $: step = (gardenWidth - 8) / cols;
  $: x0 = 4 + step / 2;
</script>

{#each plants as plant, i}
  {@const col = i % cols}
  {@const row = Math.floor(i / cols)}
  {@const cx = x0 + col * step}
  {@const ty = secY + 28 + row * (descriptor.cardH + descriptor.rowGap)}
  {#if plant.type === 'placeholder'}
    <g class="plant-marker placeholder-marker"
      on:click={(e) => onPlaceholderClick(plant, e)}
      on:keydown={(e) => e.key === 'Enter' && onPlaceholderClick(plant, e)}
      role="button" tabindex="0">
      <rect x={cx - descriptor.cardW/2} y={ty} width={descriptor.cardW} height={descriptor.cardH}
        rx="7" fill="rgba(200,200,200,0.15)" stroke="#bbb" stroke-width="1" stroke-dasharray="4,3" />
      <text x={cx} y={ty + descriptor.cardH * 0.55} class="placeholder-label">{tLabel('placeholderLabel')}</text>
    </g>
  {:else}
    {@const sc = getStatusColor(plant.id)}
    {@const bg = colorToTint(plant.color)}
    <g class="plant-marker"
      on:click={(e) => onPlantClick(plant, e)}
      on:keydown={(e) => e.key === 'Enter' && onPlantClick(plant, e)}
      role="button" tabindex="0">
      <rect x={cx - descriptor.cardW/2} y={ty} width={descriptor.cardW} height={descriptor.cardH}
        rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
      <rect x={cx + descriptor.cardW/2 - 12} y={ty + 3} width="10" height="10"
        rx="3" fill={sc} class="status-dot" />
      <text x={cx} y={ty + descriptor.cardH * 0.45} class="card-emoji">{plant.emoji || descriptor.icon}</text>
      <text x={cx} y={ty + descriptor.cardH - 8} class="card-label"
        textLength={plant.name.length > 6 ? descriptor.cardW - 6 : null}
        lengthAdjust="spacingAndGlyphs">{plant.name}</text>
    </g>
  {/if}
{/each}

<style>
  .plant-marker { cursor: pointer; }
  .plant-marker:hover .card-bg { filter: brightness(0.93); }
  .plant-marker:focus { outline: none; }
  .plant-marker:focus .card-bg { stroke: #2d5a27; stroke-width: 2; }
  .placeholder-marker { cursor: pointer; opacity: 0.7; }
  .placeholder-marker:hover { opacity: 1; }
  .placeholder-label { font-size: 20px; text-anchor: middle; dominant-baseline: middle; fill: #aaa; font-weight: 700; pointer-events: none; }
  .card-emoji { font-size: 26px; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
  .card-label { font-size: 10px; text-anchor: middle; dominant-baseline: auto; fill: #111; font-weight: 700; pointer-events: none; }
</style>
```

### Reusing an existing renderer

If your section uses a standard card grid (no wire lines, no special layout), you can alias `FruitRenderer` instead of creating a new Svelte file:

```js
// in src/sections/index.js
const HerbRenderer = FruitRenderer;
```

Only create a new `Renderer.svelte` if you need a distinct visual layout.

### Custom layouts

For a wire-trellis layout (like grape), add a horizontal line before each row:

```svelte
{#if col === 0}
  <line x1="4" y1={ty + descriptor.cardH/2} x2={gardenWidth - 4} y2={ty + descriptor.cardH/2}
    stroke={descriptor.wireColor} stroke-width="1.5" opacity="0.3" />
{/if}
```

For a fixed-slot grid (like the raised-bed renderer), implement the layout logic directly and declare only the props you use.

---

## Step 3 - Register in `index.js`

```js
// src/sections/index.js
import fruitDesc     from './fruit/descriptor.js';
import grapeDesc     from './grape/descriptor.js';
import raspberryDesc from './raspberry/descriptor.js';
import bedDesc       from './bed/descriptor.js';
import otherDesc     from './other/descriptor.js';
import herbDesc      from './herb/descriptor.js';        // ← add

import FruitRenderer from './fruit/Renderer.svelte';
import GrapeRenderer from './grape/Renderer.svelte';
import BedRenderer   from './bed/Renderer.svelte';
import HerbRenderer  from './herb/Renderer.svelte';      // ← add (or alias FruitRenderer)

const RaspberryRenderer = FruitRenderer;
const OtherRenderer     = FruitRenderer;

export const SECTION_REGISTRY = [
  { ...fruitDesc,     Renderer: FruitRenderer },
  { ...grapeDesc,     Renderer: GrapeRenderer },
  { ...raspberryDesc, Renderer: RaspberryRenderer },
  { ...bedDesc,       Renderer: BedRenderer },
  { ...otherDesc,     Renderer: OtherRenderer },
  { ...herbDesc,      Renderer: HerbRenderer },           // ← add
];

export const SECTION_BY_TYPE = Object.fromEntries(
  SECTION_REGISTRY.map(d => [d.type, d])
);
```

The order in `SECTION_REGISTRY` also controls the order in the Settings "Add Section" list.

---

## Step 4 - Add the i18n key

Open `src/lib/i18n.js` and add the `defaultName` key to both language objects:

```js
// English
herbGarden: 'Herb Garden',

// Hungarian
herbGarden: 'Gyógynövény kert',
```

---

## Step 5 - Add sample data (optional)

Open `src/lib/sampleData.js`. Sample plants need a `sectionId` that matches the `instanceId` that `DEFAULT_SECTIONS` will assign on first launch.

Check `DEFAULT_SECTIONS` in `db.js` to see the instanceId pattern - it's `'<type>-1'` for the first instance.

```js
// in sampleData.js
{ name: 'Basil', type: 'herb', sectionId: 'herb-1', emoji: '🌿', color: '#27ae60', ... },
{ name: 'Mint',  type: 'herb', sectionId: 'herb-1', emoji: '🌱', color: '#16a085', ... },
```

---

## Step 6 - Add to `DEFAULT_SECTIONS` in `db.js`

If you want the section to appear by default on first install:

```js
// in db.js, DEFAULT_SECTIONS array
{ instanceId: 'herb-1', type: 'herb', name: 'herbGarden', cols: 4 },
```

---

## Step 7 - Verify

```bash
npm run build   # must produce zero errors and zero warnings
npm run dev     # open in browser, check Settings → Add Section shows the new type
                # add the section, add a plant, check map rendering
```

---

## Checklist

- [ ] `src/sections/<type>/descriptor.js` created
- [ ] `src/sections/<type>/Renderer.svelte` created (or renderer aliased)
- [ ] Entry added to `SECTION_REGISTRY` in `index.js`
- [ ] i18n key added to both language objects in `i18n.js`
- [ ] `npm run build` - zero warnings
- [ ] Section appears in Settings add list
- [ ] Plants render correctly on the map
- [ ] Section sheet opens on name tap; columns/rows stepper works if enabled
- [ ] Add Plant form uses the section's emoji and color palette
