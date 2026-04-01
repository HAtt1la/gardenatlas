<script>
  import { onMount, onDestroy } from 'svelte';
  import { plants, navigateToPlant, loadPlants, showToast } from '../lib/stores.js';
  import { getSections, saveSections, validateColDecrease, applyColDecrease, applyColIncrease, validateRowDecrease, applyRowDecrease, applyRowIncrease, getMainPhotosForPlants } from '../lib/db.js';
  import { t } from '../lib/i18n.js';
  import { getAllPlantHealthStatuses, HEALTH_COLORS } from '../lib/health.js';
  import AddPlantInline from './AddPlantInline.svelte';
  import SectionSheet from './SectionSheet.svelte';

  const CARD_W = 52;
  const CARD_H = 60;
  const ROW_GAP = 10;
  const WIRE_COLOR = '#8d6e63';
  const GARDEN_WIDTH = 360;

  let plantStatuses = {};
  let plantThumbs = {};
  let sections = [];
  let sheetSection = null;
  let convertingPlant = null;

  $: sectionPlantsMap = (() => {
    const map = {};
    for (const sec of sections) {
      const ps = $plants
        .filter(p => p.sectionId === sec.instanceId)
        .sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
      const cols = sec.cols ?? 1;
      map[sec.instanceId] = sec.rows != null ? ps.slice(0, sec.rows * cols) : ps;
    }
    return map;
  })();

  function sectionH(count, cols) {
    return 28 + Math.max(1, Math.ceil(count / cols)) * (CARD_H + ROW_GAP);
  }

  $: sectionYs = (() => {
    const ys = [];
    let y = 20;
    for (const sec of sections) {
      ys.push(y);
      const ps = sectionPlantsMap[sec.instanceId] ?? [];
      y += sectionH(ps.length, sec.cols ?? 1) + 20;
    }
    return ys;
  })();

  $: dynamicHeight = (() => {
    if (sections.length === 0) return 800;
    const last = sections.length - 1;
    const sec = sections[last];
    const ps = sectionPlantsMap[sec.instanceId] ?? [];
    return sectionYs[last] + sectionH(ps.length, sec.cols ?? 1) + 20;
  })();

  $: convertingRowSize = (() => {
    if (!convertingPlant) return null;
    const sec = sections.find(s => s.instanceId === convertingPlant.sectionId);
    const cols = sec?.cols ?? 1;
    const ps = sec ? (sectionPlantsMap[sec.instanceId] ?? []) : [];
    const idx = ps.findIndex(p => p.id === convertingPlant.id);
    if (idx < 0) return cols;
    const row = Math.floor(idx / cols);
    return Math.min(cols, ps.length - row * cols);
  })();

  onMount(async () => {
    sections = await getSections();
  });

  $: if ($plants.length > 0) {
    updateStatuses();
    loadThumbnails();
  }

  async function updateStatuses() {
    plantStatuses = await getAllPlantHealthStatuses($plants);
  }

  async function loadThumbnails() {
    for (const url of Object.values(plantThumbs)) URL.revokeObjectURL(url);
    const ids = $plants.filter(p => p.type !== 'placeholder').map(p => p.id);
    const photos = await getMainPhotosForPlants(ids);
    const newThumbs = {};
    for (const [plantId, photo] of Object.entries(photos)) {
      if (photo?.data) newThumbs[plantId] = URL.createObjectURL(photo.data);
    }
    plantThumbs = newThumbs;
  }

  onDestroy(() => {
    for (const url of Object.values(plantThumbs)) URL.revokeObjectURL(url);
  });

  function getStatusColor(plantId) {
    const s = plantStatuses[plantId]?.status;
    return HEALTH_COLORS[s] ?? HEALTH_COLORS.none;
  }

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

  function handlePlaceholderClick(plant, event) {
    event.stopPropagation();
    convertingPlant = plant;
  }

  function handleConvertCancel() {
    convertingPlant = null;
  }

  async function handleSheetSave(updated) {
    sections = sections.map(s => s.instanceId === updated.instanceId ? updated : s);
    await saveSections(sections);
    showToast($t('sectionSaved'), 'success');
    sheetSection = null;
  }

  async function handleColChange(newCols) {
    const sec = sheetSection;
    const oldCols = sec.cols ?? 1;
    if (newCols < oldCols) {
      const v = await validateColDecrease(sec.instanceId, oldCols, newCols);
      if (!v.ok) return v;
      await applyColDecrease(sec.instanceId, oldCols, newCols);
    } else {
      await applyColIncrease(sec.instanceId, oldCols, newCols);
    }
    sheetSection = { ...sheetSection, cols: newCols };
    await loadPlants();
    return { ok: true };
  }

  async function handleRowChange(newRows) {
    const sec = sheetSection;
    const oldRows = sec.rows ?? 1;
    const cols = sec.cols ?? 1;
    if (newRows < oldRows) {
      const v = await validateRowDecrease(sec.instanceId, cols, oldRows, newRows);
      if (!v.ok) return v;
      await applyRowDecrease(sec.instanceId, cols, oldRows, newRows);
    } else {
      await applyRowIncrease(sec.instanceId, cols, newRows, oldRows);
    }
    sheetSection = { ...sheetSection, rows: newRows };
    await loadPlants();
    return { ok: true };
  }

</script>

<div class="map-container">
  {#if convertingPlant}
    <div class="convert-overlay"
      role="presentation"
      aria-hidden="true"
      on:click={handleConvertCancel}
      on:keydown={(e) => e.key === 'Escape' && handleConvertCancel()}>
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="convert-modal"
        role="dialog"
        on:click|stopPropagation
        on:keydown|stopPropagation>
        <AddPlantInline
          convertMode={true}
          placeholderPlant={convertingPlant}
          rowSize={convertingRowSize}
          onSuccess={handleConvertCancel}
        />
      </div>
    </div>
  {/if}

  {#if sheetSection}
    <SectionSheet
      section={sheetSection}
      onClose={() => sheetSection = null}
      onSave={handleSheetSave}
      onColChange={handleColChange}
      onRowChange={handleRowChange}
    />
  {/if}

  <svg viewBox="0 0 {GARDEN_WIDTH} {dynamicHeight}" class="garden-svg">
    <defs>
      <linearGradient id="label-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0" />
        <stop offset="100%" stop-color="white" stop-opacity="0.88" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect x="0" y="0" width={GARDEN_WIDTH} height={dynamicHeight} fill="#eef6ee" />

    {#each sections as sec, secIdx}
      {@const ps = sectionPlantsMap[sec.instanceId] ?? []}
      {@const secY = sectionYs[secIdx] ?? 0}
      {@const cols = sec.cols ?? 1}
      {@const step = (GARDEN_WIDTH - 8) / cols}
      {@const x0 = 4 + step / 2}

      {#if secIdx > 0}
        <line x1="0" y1={secY - 8} x2={GARDEN_WIDTH} y2={secY - 8} stroke="#b2d8b2" stroke-width="1.5" stroke-dasharray="5,4" />
      {/if}

      <!-- Section background -->
      {@const secH = sectionH(ps.length, cols)}
      <rect x="0" y={secY} width={GARDEN_WIDTH} height={secH} fill={sec.color ?? '#a8d5a2'} opacity="0.12" />

      <!-- Section label - tap to edit -->
      <g class="section-label-btn"
        on:click={() => sheetSection = sec}
        on:keydown={(e) => e.key === 'Enter' && (sheetSection = sec)}
        role="button" tabindex="0">
        <rect x="0" y={secY} width={GARDEN_WIDTH * 0.75} height="22" rx="0" fill="transparent" />
        <text x="6" y={secY + 14} class="section-label">{sec.name}</text>
      </g>

      {#each ps as plant, i}
        {@const col = i % cols}
        {@const row = Math.floor(i / cols)}
        {@const cx = x0 + col * step}
        {@const ty = secY + 28 + row * (CARD_H + ROW_GAP)}
        {#if sec.showWires && col === 0}
          <line x1="4" y1={ty + CARD_H/2} x2={GARDEN_WIDTH - 4} y2={ty + CARD_H/2}
            stroke={WIRE_COLOR} stroke-width="1.5" opacity="0.3" />
        {/if}
        {#if plant.type === 'placeholder'}
          <g class="plant-marker placeholder-marker"
            on:click={(e) => handlePlaceholderClick(plant, e)}
            on:keydown={(e) => e.key === 'Enter' && handlePlaceholderClick(plant, e)}
            role="button" tabindex="0">
            <rect x={cx - CARD_W/2} y={ty} width={CARD_W} height={CARD_H} rx="7" fill="rgba(200,200,200,0.15)" stroke="#bbb" stroke-width="1" stroke-dasharray="4,3" />
            <text x={cx} y={ty + CARD_H * 0.55} class="placeholder-label">{$t('placeholderLabel')}</text>
          </g>
        {:else}
          {@const sc = getStatusColor(plant.id)}
          {@const bg = colorToTint(plant.color)}
          <g class="plant-marker"
            on:click={(e) => handlePlantClick(plant, e)}
            on:keydown={(e) => e.key === 'Enter' && handlePlantClick(plant, e)}
            role="button" tabindex="0">
            <rect x={cx - CARD_W/2} y={ty} width={CARD_W} height={CARD_H} rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
            <rect x={cx + CARD_W/2 - 12} y={ty + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
            {#if plantThumbs[plant.id]}
              <defs>
                <clipPath id="card-clip-{plant.id}">
                  <rect x={cx - CARD_W/2} y={ty} width={CARD_W} height={CARD_H - 14} rx="7" />
                </clipPath>
              </defs>
              <image
                href={plantThumbs[plant.id]}
                x={cx - CARD_W/2} y={ty}
                width={CARD_W} height={CARD_H - 14}
                preserveAspectRatio="xMidYMid slice"
                clip-path="url(#card-clip-{plant.id})"
                class="card-photo" />
            {/if}
            <rect x={cx - CARD_W/2 + 1} y={ty + CARD_H - 16} width={CARD_W - 2} height="15" rx="0" fill="url(#label-fade)" />
            <text x={cx} y={ty + CARD_H - 4} class="card-label"
              textLength={plant.name.length > 6 ? CARD_W - 6 : null}
              lengthAdjust="spacingAndGlyphs">{plant.name}</text>
          </g>
        {/if}
      {/each}
    {/each}
  </svg>

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.good}"></span><span>{$t('health_good')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.fair}"></span><span>{$t('health_fair')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.poor}"></span><span>{$t('health_poor')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.bad}"></span><span>{$t('health_bad')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.none}"></span><span>{$t('noProfile')}</span></div>
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

  .section-label {
    font-size: 14px;
    font-weight: 700;
    fill: #2d5a27;
    pointer-events: none;
  }

  .section-label-btn {
    cursor: pointer;
  }

  .section-label-btn:hover .section-label {
    fill: #4a7c43;
    text-decoration: underline;
  }

  .plant-marker { cursor: pointer; }
  .plant-marker:hover .card-bg { filter: brightness(0.93); }
  .plant-marker:focus { outline: none; }
  .plant-marker:focus .card-bg { stroke: #2d5a27; stroke-width: 2; }
  .placeholder-marker { cursor: pointer; opacity: 0.7; }
  .placeholder-marker:hover { opacity: 1; }
  .placeholder-label { font-size: 20px; text-anchor: middle; dominant-baseline: middle; fill: #aaa; font-weight: 700; pointer-events: none; }
  .card-photo { pointer-events: none; }
  .card-label { font-size: 10px; text-anchor: middle; dominant-baseline: auto; fill: #111; font-weight: 700; pointer-events: none; }

  @media (prefers-color-scheme: dark) {
    .garden-svg { filter: none; }
    .card-label { fill: #111 !important; }
    .section-label { fill: #2d5a27 !important; }
    .placeholder-label { fill: #aaa !important; }
    .legend { background: #1e1e1e; border-color: #333; }
    .legend-item { color: #ccc; }
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

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* Convert placeholder overlay */
  .convert-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .convert-modal {
    width: 100%;
    max-width: 380px;
    max-height: 90vh;
    overflow-y: auto;
  }
</style>
