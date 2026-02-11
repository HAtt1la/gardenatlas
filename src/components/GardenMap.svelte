<script>
  import { onMount } from 'svelte';
  import { plants, navigateToPlant, loadPlants } from '../lib/stores.js';
  import { calculateNextSpray, getPlantsInBed } from '../lib/db.js';
  import { t } from '../lib/i18n.js';
  import AddPlantInline from './AddPlantInline.svelte';

  let plantStatuses = {};
  let bedPlants = {}; // Store plants for each bed
  let isLoadingBedPlants = false;
  let showAddPlant = false;

  // Garden dimensions (visual units)
  const GARDEN_WIDTH = 400;
  const GARDEN_HEIGHT = 950;
  
  // Layout sections
  const SECTIONS = {
    trees: { y: 30, labelKey: 'fruitTrees' },
    beds: { y: 355, labelKey: 'raisedBeds' },
    grapes: { y: 460, labelKey: 'grapevines' },
    other: { y: 650, labelKey: 'herbsFlowers' }
  };

  $: grapes = $plants.filter(p => p.type === 'grape').slice(0, 20); // Only show first 20 vines (4 rows)
  $: beds = $plants.filter(p => p.type === 'bed');
  $: trees = $plants.filter(p => p.type === 'fruit');
  $: otherPlants = $plants.filter(p => p.type === 'other');

  onMount(async () => {
    // Calculate spray status for all plants
    for (const plant of $plants) {
      const forecast = await calculateNextSpray(plant.id);
      if (forecast) {
        plantStatuses[plant.id] = forecast.status;
      }
    }
    plantStatuses = plantStatuses;
    
    // Load plants for each bed
    await loadBedPlants();
  });

  // Update statuses when plants change
  $: if ($plants.length > 0) {
    updateStatuses();
    loadBedPlants(); // Also reload bed plants when plants change
  }

  async function updateStatuses() {
    const newStatuses = {};
    for (const plant of $plants) {
      const forecast = await calculateNextSpray(plant.id);
      if (forecast) {
        newStatuses[plant.id] = forecast.status;
      }
    }
    plantStatuses = newStatuses;
  }

  async function loadBedPlants() {
    const newBedPlants = {};
    const currentBeds = $plants.filter(p => p.type === 'bed');
    for (const bed of currentBeds) {
      const plants = await getPlantsInBed(bed.id);
      console.log(`Bed ${bed.id} (${bed.name}):`, plants.length, 'plants', plants);
      newBedPlants[bed.id] = plants.slice(0, 5); // Max 5 plants per bed
    }
    bedPlants = { ...newBedPlants }; // Force reactivity with spread
    console.log('Updated bedPlants:', bedPlants);
  }

  function getStatusColor(plantId) {
    const status = plantStatuses[plantId];
    switch (status) {
      case 'overdue': return '#e74c3c';
      case 'soon': return '#f39c12';
      case 'ok': return '#27ae60';
      default: return '#95a5a6';
    }
  }

  function handlePlantClick(plant, event) {
    event.stopPropagation();
    navigateToPlant(plant.id);
  }
</script>

<div class="map-container">
  <svg viewBox="0 0 {GARDEN_WIDTH} {GARDEN_HEIGHT}" class="garden-svg">
    <!-- Background -->
    <rect x="0" y="0" width={GARDEN_WIDTH} height={GARDEN_HEIGHT} fill="#e8f5e9" />
    
    <!-- Section labels -->
    <text x="10" y={SECTIONS.trees.y - 10} class="section-label">🌳 {$t(SECTIONS.trees.labelKey)}</text>
    <text x="10" y={SECTIONS.beds.y - 10} class="section-label">🥬 {$t(SECTIONS.beds.labelKey)}</text>
    <text x="10" y={SECTIONS.grapes.y - 10} class="section-label">🍇 {$t(SECTIONS.grapes.labelKey)}</text>
    <text x="10" y={SECTIONS.other.y - 10} class="section-label">🌿 {$t(SECTIONS.other.labelKey)}</text>
    
    <!-- Section dividers -->
    <line x1="0" y1="330" x2={GARDEN_WIDTH} y2="330" stroke="#c8e6c9" stroke-width="2" stroke-dasharray="5,5" />
    <line x1="0" y1="430" x2={GARDEN_WIDTH} y2="430" stroke="#c8e6c9" stroke-width="2" stroke-dasharray="5,5" />
    <line x1="0" y1="640" x2={GARDEN_WIDTH} y2="640" stroke="#c8e6c9" stroke-width="2" stroke-dasharray="5,5" />
    
    <!-- Fruit Trees (top section) -->
    {#each trees as tree, i}
      <g 
        class="plant-marker"
        on:click={(e) => handlePlantClick(tree, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(tree, e)}
        role="button"
        tabindex="0"
      >
        <g transform="translate({tree.x || (30 + i * 35)}, {tree.y || SECTIONS.trees.y + 40})">
          <circle r="18" fill={getStatusColor(tree.id)} opacity="0.3" class="marker-glow" />
          <circle r="12" fill={getStatusColor(tree.id)} class="marker-circle" />
          <text y="4" class="plant-icon">{tree.emoji || '🌳'}</text>
          <text y="28" class="plant-label">{tree.name}</text>
          <text y="40" class="plant-id">#{tree.id}</text>
        </g>
      </g>
    {/each}
    
    <!-- Raised Beds (middle section) -->
    {#each beds as bed, i}
      {@const plantsInBed = bedPlants[bed.id] || []}
      <g 
        class="plant-marker"
        on:click={(e) => handlePlantClick(bed, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(bed, e)}
        role="button"
        tabindex="0"
      >
        <g transform="translate({bed.x || (100 + i * 200)}, {bed.y || SECTIONS.beds.y + 35})">
          <rect x="-65" y="-30" width="130" height="60" rx="5" fill={getStatusColor(bed.id)} opacity="0.3" class="marker-glow" />
          <rect x="-60" y="-25" width="120" height="50" rx="3" fill={getStatusColor(bed.id)} class="marker-rect" />
          
          <!-- Show plant emojis in bed -->
          {#if plantsInBed.length > 0}
            {#each plantsInBed as plant, idx}
              <text x={-40 + idx * 24} y="5" class="bed-plant-icon">{plant.emoji || '🌱'}</text>
            {/each}
          {/if}
          
          <text y="48" class="plant-label">{bed.name}</text>
          <text y="62" class="plant-id">#{bed.id}</text>
        </g>
      </g>
    {/each}
    
    <!-- Grapevines (bottom section - 4 rows, 5 per row) -->
    {#each grapes as grape, i}
      {@const row = Math.floor(i / 5)}
      {@const col = i % 5}
      <g 
        class="plant-marker"
        on:click={(e) => handlePlantClick(grape, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(grape, e)}
        role="button"
        tabindex="0"
      >
        <g transform="translate({50 + col * 75}, {SECTIONS.grapes.y + 25 + row * 35})">
          <circle r="14" fill={getStatusColor(grape.id)} opacity="0.3" class="marker-glow" />
          <circle r="10" fill={getStatusColor(grape.id)} class="marker-circle" />
          <text y="3" class="plant-icon-small">{grape.emoji || '🍇'}</text>
          <text x="18" y="4" class="plant-label-small">{grape.name}</text>
        </g>
      </g>
    {/each}
    
    <!-- Grape row lines -->
    {#each Array(4) as _, row}
      <line 
        x1="30" 
        y1={SECTIONS.grapes.y + 25 + row * 35} 
        x2={GARDEN_WIDTH - 30} 
        y2={SECTIONS.grapes.y + 25 + row * 35} 
        stroke="#8d6e63" 
        stroke-width="1" 
        opacity="0.3"
      />
    {/each}
    
    <!-- Other Plants (Herbs & Flowers - 5 per row, unlimited rows) -->
    {#each otherPlants as plant, i}
      {@const row = Math.floor(i / 5)}
      {@const col = i % 5}
      <g 
        class="plant-marker"
        on:click={(e) => handlePlantClick(plant, e)}
        on:keydown={(e) => e.key === 'Enter' && handlePlantClick(plant, e)}
        role="button"
        tabindex="0"
      >
        <g transform="translate({50 + col * 75}, {SECTIONS.other.y + 20 + row * 40})">
          <circle r="12" fill={getStatusColor(plant.id)} opacity="0.3" class="marker-glow" />
          <circle r="9" fill={getStatusColor(plant.id)} class="marker-circle" />
          <text y="3.5" class="plant-icon-medium">{plant.emoji || '🌿'}</text>
          <text y="25" class="plant-label-small">{plant.name}</text>
        </g>
      </g>
    {/each}
  </svg>
  
  <!-- Add Plant Section -->
  {#if !showAddPlant}
    <div class="add-plant-section">
      <button class="btn-add-plant" on:click={() => showAddPlant = true}>
        <span class="add-icon">+</span>
        <span>{$t('addNewPlant')}</span>
      </button>
    </div>
  {:else}
    <div class="add-plant-section form-wrapper">
      <AddPlantInline 
        bedId={null}
        onSuccess={() => { showAddPlant = false; }}
      />
    </div>
  {/if}
  
  <!-- Legend -->
  <div class="legend">
    <div class="legend-item">
      <span class="legend-dot" style="background: #27ae60"></span>
      <span>{$t('ok')}</span>
    </div>
    <div class="legend-item">
      <span class="legend-dot" style="background: #f39c12"></span>
      <span>{$t('soon')}</span>
    </div>
    <div class="legend-item">
      <span class="legend-dot" style="background: #e74c3c"></span>
      <span>{$t('overdue')}</span>
    </div>
    <div class="legend-item">
      <span class="legend-dot" style="background: #95a5a6"></span>
      <span>{$t('noData')}</span>
    </div>
  </div>
</div>

<style>
  .map-container {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .garden-svg {
    width: 100%;
    max-width: 500px;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    background: white;
  }

  .plant-marker {
    cursor: pointer;
  }

  .plant-marker:hover .marker-circle,
  .plant-marker:hover .marker-rect {
    filter: brightness(1.15);
  }

  .plant-marker:hover .marker-glow {
    opacity: 0.5 !important;
  }

  .plant-marker:focus {
    outline: none;
  }

  .plant-marker:focus .marker-circle,
  .plant-marker:focus .marker-rect {
    stroke: #333;
    stroke-width: 2;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    fill: #2d5a27;
    pointer-events: none;
  }

  .plant-icon {
    font-size: 20px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  .plant-icon-small {
    font-size: 20px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  .plant-icon-medium {
    font-size: 18px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  .bed-plant-icon {
    font-size: 16px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  .plant-label {
    font-size: 8px;
    text-anchor: middle;
    fill: #333;
    font-weight: 500;
    pointer-events: none;
  }

  .plant-label-small {
    font-size: 7px;
    text-anchor: start;
    fill: #333;
    pointer-events: none;
  }

  .plant-id {
    font-size: 6px;
    text-anchor: middle;
    fill: #666;
    pointer-events: none;
  }

  .legend {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #666;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .add-plant-section {
    margin-top: 1rem;
    width: 100%;
    max-width: 500px;
  }

  .add-plant-section.form-wrapper {
    margin-top: 1rem;
    width: 100%;
    max-width: 500px;
    padding: 0 1rem;
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

  @media (max-width: 480px) {
    .legend {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>
