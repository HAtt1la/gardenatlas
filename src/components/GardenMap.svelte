<script>
  import { onMount, onDestroy } from 'svelte';
  import { plants, navigateToPlant, loadPlants, showToast } from '../lib/stores.js';
  import { calculateNextSpray, getPlantsInBed, getSections, saveSections, validateColDecrease, applyColDecrease, applyColIncrease, validateRowDecrease, applyRowDecrease, applyRowIncrease, getMainPhotosForPlants } from '../lib/db.js';
  import { SECTION_BY_TYPE } from '../sections/index.js';
  import { t } from '../lib/i18n.js';
  import AddPlantInline from './AddPlantInline.svelte';
  import SectionSheet from './SectionSheet.svelte';

  let plantStatuses = {};
  let bedPlants = {};
  let plantThumbs = {};

  let sections = [];
  let sheetSection = null;

  // Convert form state
  let convertingPlant = null;

  const GARDEN_WIDTH = 360;

  // Reactive plants map: sectionId → array of plants for that section
  $: sectionPlantsMap = (() => {
    const map = {};
    for (const sec of sections) {
      if (sec.type === 'bed') {
        map[sec.instanceId] = $plants.filter(p => p.type === 'bed');
      } else {
        const ps = $plants
          .filter(p => p.sectionId === sec.instanceId)
          .sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
        const cols = sec.cols ?? 1;
        map[sec.instanceId] = sec.rows != null ? ps.slice(0, sec.rows * cols) : ps;
      }
    }
    return map;
  })();

  function sectionH(count, cols, cardH, rowGap) {
    return 28 + Math.max(1, Math.ceil(count / cols)) * (cardH + rowGap);
  }

  function effectiveCols(sec) {
    const d = SECTION_BY_TYPE[sec.type];
    if (d.isBedSection) return 3;
    return sec.cols ?? d.defaultCols ?? 1;
  }

  $: sectionYs = (() => {
    const ys = [];
    let y = 20;
    for (const sec of sections) {
      ys.push(y);
      const d = SECTION_BY_TYPE[sec.type];
      const ps = sectionPlantsMap[sec.instanceId] ?? [];
      y += sectionH(ps.length, effectiveCols(sec), d.cardH, d.rowGap) + 20;
    }
    return ys;
  })();

  $: dynamicHeight = (() => {
    if (sections.length === 0) return 800;
    const last = sections.length - 1;
    const sec = sections[last];
    const d = SECTION_BY_TYPE[sec.type];
    const ps = sectionPlantsMap[sec.instanceId] ?? [];
    return sectionYs[last] + sectionH(ps.length, effectiveCols(sec), d.cardH, d.rowGap) + 20;
  })();

  $: convertingRowSize = (() => {
    if (!convertingPlant) return null;
    const type = convertingPlant.placeholderFor;
    const sec = sections.find(s => s.type === type);
    const cols = sec?.cols ?? 1;
    const ps = sec ? (sectionPlantsMap[sec.instanceId] ?? []) : [];
    const idx = ps.findIndex(p => p.id === convertingPlant.id);
    if (idx < 0) return cols;
    const row = Math.floor(idx / cols);
    return Math.min(cols, ps.length - row * cols);
  })();

  onMount(async () => {
    sections = await getSections();
    for (const plant of $plants) {
      const forecast = await calculateNextSpray(plant.id);
      if (forecast) plantStatuses[plant.id] = forecast.status;
    }
    plantStatuses = { ...plantStatuses };
    await loadBedPlants();
    await loadThumbnails();
  });

  $: if ($plants.length > 0) {
    updateStatuses();
    loadBedPlants();
    loadThumbnails();
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
    switch (plantStatuses[plantId]) {
      case 'overdue': return '#e74c3c';
      case 'soon':    return '#f39c12';
      case 'ok':      return '#27ae60';
      default:        return '#95a5a6';
    }
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
    const oldCols = sec.cols ?? SECTION_BY_TYPE[sec.type].defaultCols;
    if (newCols < oldCols) {
      const v = await validateColDecrease(sec.instanceId, oldCols, newCols);
      if (!v.ok) return v;
      await applyColDecrease(sec.instanceId, oldCols, newCols);
    } else {
      await applyColIncrease(sec.instanceId, sec.type, oldCols, newCols);
    }
    sheetSection = { ...sheetSection, cols: newCols };
    await loadPlants();
    return { ok: true };
  }

  async function handleRowChange(newRows) {
    const sec = sheetSection;
    const oldRows = sec.rows ?? SECTION_BY_TYPE[sec.type].defaultRows ?? 1;
    const cols = sec.cols ?? SECTION_BY_TYPE[sec.type].defaultCols ?? 1;
    if (newRows < oldRows) {
      const v = await validateRowDecrease(sec.instanceId, cols, oldRows, newRows);
      if (!v.ok) return v;
      await applyRowDecrease(sec.instanceId, cols, oldRows, newRows);
    } else {
      await applyRowIncrease(sec.instanceId, sec.type, cols, newRows, oldRows);
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
          plantEmojis={SECTION_BY_TYPE[convertingPlant.placeholderFor]?.emojis}
          plantColors={SECTION_BY_TYPE[convertingPlant.placeholderFor]?.colors}
          onSuccess={handleConvertCancel}
        />
      </div>
    </div>
  {/if}

  {#if sheetSection}
    <SectionSheet
      section={sheetSection}
      descriptor={SECTION_BY_TYPE[sheetSection.type]}
      onClose={() => sheetSection = null}
      onSave={handleSheetSave}
      onColChange={handleColChange}
      onRowChange={handleRowChange}
    />
  {/if}

  <svg viewBox="0 0 {GARDEN_WIDTH} {dynamicHeight}" class="garden-svg">
    <!-- Background -->
    <rect x="0" y="0" width={GARDEN_WIDTH} height={dynamicHeight} fill="#eef6ee" />

    {#each sections as sec, secIdx}
      {@const d = SECTION_BY_TYPE[sec.type]}
      {@const ps = sectionPlantsMap[sec.instanceId] ?? []}
      {@const secY = sectionYs[secIdx] ?? 0}

      {#if secIdx > 0}
        <line x1="0" y1={secY - 8} x2={GARDEN_WIDTH} y2={secY - 8} stroke="#b2d8b2" stroke-width="1.5" stroke-dasharray="5,4" />
      {/if}

      <!-- Section label - tap to edit -->
      <g class="section-label-btn"
        on:click={() => sheetSection = sec}
        on:keydown={(e) => e.key === 'Enter' && (sheetSection = sec)}
        role="button" tabindex="0">
        <rect x="0" y={secY} width={GARDEN_WIDTH * 0.75} height="22" rx="0" fill="transparent" />
        <text x="6" y={secY + 14} class="section-label">{d.icon} {$t(sec.name)}</text>
      </g>

      <svelte:component this={d.Renderer}
        section={sec}
        descriptor={d}
        plants={ps}
        {secY}
        gardenWidth={GARDEN_WIDTH}
        {plantStatuses}
        {plantThumbs}
        {bedPlants}
        onPlantClick={handlePlantClick}
        onPlaceholderClick={handlePlaceholderClick}
        {getStatusColor}
        {colorToTint}
        tLabel={$t}
      />
    {/each}
  </svg>

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
