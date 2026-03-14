<script>
  import { onMount } from 'svelte';
  import { plants, navigateToPlant } from '../lib/stores.js';
  import { calculateNextSpray, getPlantsInBed } from '../lib/db.js';
  import { t } from '../lib/i18n.js';
  import AddPlantInline from './AddPlantInline.svelte';

  let plantStatuses = {};
  let bedPlants = {};
  let showAddPlant = false;

  // Narrower viewBox = bigger rendering on phone screens
  const GARDEN_WIDTH = 360;

  // ── Card dimensions ──────────────────────────────────────────
  // Trees: 6 per row in left ~290px, raspberry column in right ~65px
  const RASP_COL_W  = 64;                              // width reserved for raspberry column
  const TREE_AREA_W = GARDEN_WIDTH - RASP_COL_W;       // 296px for trees
  const TREE_W      = 44;
  const TREE_H      = 60;
  const TREE_COLS   = 6;
  const TREE_STEP   = TREE_AREA_W / TREE_COLS;         // ~49.3
  const TREE_X0     = TREE_STEP / 2;                   // center of col 0

  // Raspberries: right column
  const RASP_W  = 52;
  const RASP_H  = 60;
  const RASP_X  = TREE_AREA_W + RASP_COL_W / 2;       // center of rasp column

  // Grapes & herbs: 5 per row
  const VINE_W    = 62;
  const VINE_H    = 58;
  const VINE_COLS = 5;
  const VINE_STEP = (GARDEN_WIDTH - 8) / VINE_COLS;    // ~70.4
  const VINE_X0   = 4 + VINE_STEP / 2;

  // Row vertical spacing (top of card to top of next card)
  const TREE_ROW_STEP = TREE_H + 10;
  const VINE_ROW_STEP = VINE_H + 14;

  // Section Y positions
  const SEC_TREES_Y = 20;

  // Derived section positions (reactive — depend on tree count)
  $: treeRows     = Math.ceil(trees.length / TREE_COLS);
  $: SEC_GRAPES_Y = SEC_TREES_Y + 28 + treeRows * TREE_ROW_STEP + 12;

  // Grape rows with beds gap between row 2 and row 3
  $: GR0 = SEC_GRAPES_Y + 28;
  $: GR1 = GR0 + VINE_ROW_STEP;
  $: GR2 = GR1 + VINE_ROW_STEP;
  $: BEDS_Y    = GR2 + VINE_H + 14;
  $: GR3 = BEDS_Y + 68;
  $: SEC_OTHER_Y = GR3 + VINE_H + 20;

  // Dynamic total height
  $: otherRows     = Math.max(1, Math.ceil(otherPlants.length / VINE_COLS));
  $: dynamicHeight = SEC_OTHER_Y + 28 + otherRows * (VINE_H + 14) + 16;

  function grapeRowY(row) {
    if (row === 0) return GR0;
    if (row === 1) return GR1;
    if (row === 2) return GR2;
    return GR3;
  }

  $: grapes      = $plants.filter(p => p.type === 'grape').slice(0, 20);
  $: beds        = $plants.filter(p => p.type === 'bed');
  $: trees       = $plants.filter(p => p.type === 'fruit');
  $: raspberries = $plants.filter(p => p.type === 'raspberry');
  $: otherPlants = $plants.filter(p => p.type === 'other');

  onMount(async () => {
    for (const plant of $plants) {
      const forecast = await calculateNextSpray(plant.id);
      if (forecast) plantStatuses[plant.id] = forecast.status;
    }
    plantStatuses = { ...plantStatuses };
    await loadBedPlants();
  });

  $: if ($plants.length > 0) {
    updateStatuses();
    loadBedPlants();
  }

  async function updateStatuses() {
    const newStatuses = {};
    for (const plant of $plants) {
      const forecast = await calculateNextSpray(plant.id);
      if (forecast) newStatuses[plant.id] = forecast.status;
    }
    plantStatuses = newStatuses;
  }

  async function loadBedPlants() {
    const newBedPlants = {};
    for (const bed of $plants.filter(p => p.type === 'bed')) {
      const ps = await getPlantsInBed(bed.id);
      newBedPlants[bed.id] = ps.slice(0, 6);
    }
    bedPlants = { ...newBedPlants };
  }

  function getStatusColor(plantId) {
    switch (plantStatuses[plantId]) {
      case 'overdue': return '#e74c3c';
      case 'soon':    return '#f39c12';
      case 'ok':      return '#27ae60';
      default:        return '#95a5a6';
    }
  }

  // Convert a hex color to a very light tint for card background
  function colorToTint(hex) {
    if (!hex) return 'rgba(255,255,255,0.82)';
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},0.18)`;
  }

  function handlePlantClick(plant, event) {
    event.stopPropagation();
    navigateToPlant(plant.id);
  }
</script>

<div class="map-container">
  <svg viewBox="0 0 {GARDEN_WIDTH} {dynamicHeight}" class="garden-svg">
    <!-- Background -->
    <rect x="0" y="0" width={GARDEN_WIDTH} height={dynamicHeight} fill="#eef6ee" />

    <!-- Vertical divider: trees | raspberry column -->
    <line x1={TREE_AREA_W} y1={SEC_TREES_Y} x2={TREE_AREA_W} y2={SEC_GRAPES_Y - 8} stroke="#b2d8b2" stroke-width="1.5" stroke-dasharray="5,4" />

    <!-- Horizontal section dividers -->
    <line x1="0" y1={SEC_GRAPES_Y - 8} x2={GARDEN_WIDTH} y2={SEC_GRAPES_Y - 8} stroke="#b2d8b2" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="0" y1={SEC_OTHER_Y - 8}  x2={GARDEN_WIDTH} y2={SEC_OTHER_Y - 8}  stroke="#b2d8b2" stroke-width="1.5" stroke-dasharray="5,4" />

    <!-- Section labels -->
    <text x="6" y={SEC_TREES_Y + 14}  class="section-label">🌳 {$t('fruitTrees')}</text>
    <text x="6" y={SEC_GRAPES_Y + 18} class="section-label">🍇 {$t('grapevines')}</text>
    <text x="6" y={SEC_OTHER_Y + 18}  class="section-label">🌿 {$t('herbsFlowers')}</text>

    <!-- ── Fruit Trees ── -->
    {#each trees as tree, i}
      {@const col = i % TREE_COLS}
      {@const row = Math.floor(i / TREE_COLS)}
      {@const cx = TREE_X0 + col * TREE_STEP}
      {@const ty = SEC_TREES_Y + 22 + row * TREE_ROW_STEP}
      {@const sc = getStatusColor(tree.id)}
      {@const bg = colorToTint(tree.color)}
      <g class="plant-marker"
        on:click={(e) => handlePlantClick(tree, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(tree, e)}
        role="button" tabindex="0">
        <!-- Card background -->
        <rect x={cx - TREE_W/2} y={ty} width={TREE_W} height={TREE_H} rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
        <!-- Status dot (top-right corner) -->
        <rect x={cx + TREE_W/2 - 12} y={ty + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
        <!-- Emoji -->
        <text x={cx} y={ty + TREE_H * 0.45} class="card-emoji">{tree.emoji || '🌳'}</text>
        <!-- Name -->
        <text x={cx} y={ty + TREE_H - 8} class="card-label">{tree.name}</text>
      </g>
    {/each}

    <!-- ── Raspberries (right-side column) ── -->
    <!-- Vertical trellis line behind cards -->
    <line
      x1={RASP_X} y1={SEC_TREES_Y + 22}
      x2={RASP_X} y2={SEC_TREES_Y + 22 + raspberries.length * RASP_H + (raspberries.length - 1) * 10}
      stroke="#c2185b" stroke-width="1.5" opacity="0.25"
    />
    {#each raspberries as raspberry, i}
      {@const ty = SEC_TREES_Y + 22 + i * (RASP_H + 10)}
      {@const sc = getStatusColor(raspberry.id)}
      {@const bg = colorToTint(raspberry.color)}
      <g class="plant-marker"
        on:click={(e) => handlePlantClick(raspberry, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(raspberry, e)}
        role="button" tabindex="0">
        <rect x={RASP_X - RASP_W/2} y={ty} width={RASP_W} height={RASP_H} rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
        <rect x={RASP_X + RASP_W/2 - 12} y={ty + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
        <text x={RASP_X} y={ty + RASP_H * 0.45} class="card-emoji">{raspberry.emoji || '🍓'}</text>
        <text x={RASP_X} y={ty + RASP_H - 8} class="card-label">{raspberry.name}</text>
      </g>
    {/each}

    <!-- ── Grapevines rows 0, 1, 2 (above beds) ── -->
    {#each grapes.slice(0, 15) as grape, i}
      {@const row = Math.floor(i / VINE_COLS)}
      {@const col = i % VINE_COLS}
      {@const cx = VINE_X0 + col * VINE_STEP}
      {@const ty = grapeRowY(row)}
      {@const sc = getStatusColor(grape.id)}
      {@const bg = colorToTint(grape.color)}
      <!-- Trellis wire (draw once per row, for col 0) -->
      {#if col === 0}
        <line x1="4" y1={ty + VINE_H/2} x2={GARDEN_WIDTH - 4} y2={ty + VINE_H/2}
          stroke="#8d6e63" stroke-width="1.5" opacity="0.3" />
      {/if}
      <g class="plant-marker"
        on:click={(e) => handlePlantClick(grape, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(grape, e)}
        role="button" tabindex="0">
        <rect x={cx - VINE_W/2} y={ty} width={VINE_W} height={VINE_H} rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
        <rect x={cx + VINE_W/2 - 12} y={ty + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
        <text x={cx} y={ty + VINE_H * 0.45} class="card-emoji">🍇</text>
        <text x={cx} y={ty + VINE_H - 8} class="card-label">{grape.name}</text>
      </g>
    {/each}

    <!-- ── Raised Beds (between grape row 2 and row 3) ── -->
    <text x="6" y={BEDS_Y - 6} class="section-label-small">🥬 {$t('raisedBeds')}</text>
    {#each beds as bed, i}
      {@const plantsInBed = bedPlants[bed.id] || []}
      <!-- 3 beds evenly across full width -->
      {@const bedW = (GARDEN_WIDTH - 16) / 3}
      {@const bx = 4 + i * (bedW + 4)}
      {@const sc = getStatusColor(bed.id)}
      <g class="plant-marker"
        on:click={(e) => handlePlantClick(bed, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(bed, e)}
        role="button" tabindex="0">
        <!-- Bed card: soil-brown tint -->
        <rect x={bx} y={BEDS_Y} width={bedW} height="58" rx="6" fill="rgba(93,78,55,0.15)" stroke="#8b6f47" stroke-width="1" class="card-bg" />
        <!-- Status dot (top-right corner) -->
        <rect x={bx + bedW - 13} y={BEDS_Y + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
        <!-- Bed name -->
        <text x={bx + bedW/2 + 2} y={BEDS_Y + 14} class="bed-title">{bed.name}</text>
        <!-- Plant emojis (up to 6, two rows of 3) -->
        {#if plantsInBed.length > 0}
          {#each plantsInBed as plant, idx}
            {@const ex = bx + 14 + (idx % 3) * ((bedW - 14) / 3) + (bedW - 14) / 6}
            {@const ey = BEDS_Y + 30 + Math.floor(idx / 3) * 20}
            <text x={ex} y={ey} class="bed-emoji">{plant.emoji || '🌱'}</text>
          {/each}
        {:else}
          <text x={bx + bedW/2 + 2} y={BEDS_Y + 38} class="bed-empty">empty</text>
        {/if}
      </g>
    {/each}

    <!-- ── Grapevines row 3 (below beds) ── -->
    {#each grapes.slice(15) as grape, i}
      {@const col = i % VINE_COLS}
      {@const cx = VINE_X0 + col * VINE_STEP}
      {@const ty = GR3}
      {@const sc = getStatusColor(grape.id)}
      {@const bg = colorToTint(grape.color)}
      {#if col === 0}
        <line x1="4" y1={ty + VINE_H/2} x2={GARDEN_WIDTH - 4} y2={ty + VINE_H/2}
          stroke="#8d6e63" stroke-width="1.5" opacity="0.3" />
      {/if}
      <g class="plant-marker"
        on:click={(e) => handlePlantClick(grape, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(grape, e)}
        role="button" tabindex="0">
        <rect x={cx - VINE_W/2} y={ty} width={VINE_W} height={VINE_H} rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
        <rect x={cx + VINE_W/2 - 12} y={ty + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
        <text x={cx} y={ty + VINE_H * 0.45} class="card-emoji">🍇</text>
        <text x={cx} y={ty + VINE_H - 8} class="card-label">{grape.name}</text>
      </g>
    {/each}

    <!-- ── Herbs & Flowers ── -->
    {#each otherPlants as plant, i}
      {@const row = Math.floor(i / VINE_COLS)}
      {@const col = i % VINE_COLS}
      {@const cx = VINE_X0 + col * VINE_STEP}
      {@const ty = SEC_OTHER_Y + 22 + row * (VINE_H + 14)}
      {@const sc = getStatusColor(plant.id)}
      {@const bg = colorToTint(plant.color)}
      <g class="plant-marker"
        on:click={(e) => handlePlantClick(plant, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(plant, e)}
        role="button" tabindex="0">
        <rect x={cx - VINE_W/2} y={ty} width={VINE_W} height={VINE_H} rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
        <rect x={cx + VINE_W/2 - 12} y={ty + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
        <text x={cx} y={ty + VINE_H * 0.45} class="card-emoji">{plant.emoji || '🌿'}</text>
        <text x={cx} y={ty + VINE_H - 8} class="card-label">{plant.name}</text>
      </g>
    {/each}
  </svg>

  <!-- Add Plant Button -->
  {#if !showAddPlant}
    <div class="add-plant-section">
      <button class="btn-add-plant" on:click={() => showAddPlant = true}>
        <span class="add-icon">+</span>
        <span>{$t('addNewPlant')}</span>
      </button>
    </div>
  {:else}
    <div class="add-plant-section form-wrapper">
      <AddPlantInline bedId={null} onSuccess={() => { showAddPlant = false; }} />
    </div>
  {/if}

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item"><span class="legend-dot" style="background:#27ae60"></span><span>{$t('ok')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:#f39c12"></span><span>{$t('soon')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:#e74c3c"></span><span>{$t('overdue')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:#95a5a6"></span><span>{$t('noData')}</span></div>
  </div>
</div>

<style>
  .map-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .garden-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .plant-marker {
    cursor: pointer;
  }

  .plant-marker:hover .card-bg {
    filter: brightness(0.93);
  }

  .plant-marker:focus {
    outline: none;
  }

  .plant-marker:focus .card-bg {
    stroke: #2d5a27;
    stroke-width: 2;
  }

  .section-label {
    font-size: 14px;
    font-weight: 700;
    fill: #2d5a27;
    pointer-events: none;
  }

  .section-label-small {
    font-size: 12px;
    font-weight: 700;
    fill: #2d5a27;
    pointer-events: none;
  }

  /* Large emoji centered in card */
  .card-emoji {
    font-size: 26px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  /* Plant name at bottom of card */
  .card-label {
    font-size: 10px;
    text-anchor: middle;
    dominant-baseline: auto;
    fill: #111;
    font-weight: 700;
    pointer-events: none;
  }

  /* Bed section */
  .bed-title {
    font-size: 11px;
    text-anchor: middle;
    dominant-baseline: auto;
    fill: #3b2a10;
    font-weight: 700;
    pointer-events: none;
  }

  .bed-emoji {
    font-size: 16px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  .bed-empty {
    font-size: 10px;
    fill: #aaa;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  /* Legend */
  .legend {
    display: flex;
    gap: 1rem;
    padding: 0.6rem 1rem;
    background: white;
    justify-content: center;
    border-top: 1px solid #e0e0e0;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: #444;
    font-weight: 500;
  }

  /* Legend dot matches the card status dot shape */
  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .add-plant-section {
    margin: 0.75rem 1rem;
  }

  .add-plant-section.form-wrapper {
    margin: 0.75rem 1rem;
  }

  .btn-add-plant {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .btn-add-plant:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .btn-add-plant:active {
    transform: translateY(0);
  }

  .add-icon {
    font-size: 1.5rem;
    font-weight: 300;
  }
</style>
