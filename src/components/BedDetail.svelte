<script>
  import { onMount } from 'svelte';
  import { selectedPlant, loadPlants, showToast, navigateToPlantDetail } from '../lib/stores.js';
  import { getPlantsInBed, addPlantToBed, deletePlant, updatePlant, getPlantCareStatus } from '../lib/db.js';
  import { t } from '../lib/i18n.js';
  import AddPlantInline from './AddPlantInline.svelte';

  let bedPlants = [];
  let plantStatuses = {};
  let showAddPlant = false;
  let isEditing = false;
  let editName = '';
  let editNotes = '';
  let lastPlantId = null;

  const MAX_BED_PLANTS = 5;

  $: if ($selectedPlant?.id) {
    loadBedPlants();
  }

  // Update edit fields when plant changes (but not while actively editing)
  $: if ($selectedPlant && !isEditing) {
    if ($selectedPlant.id !== lastPlantId) {
      lastPlantId = $selectedPlant.id;
    }
    editName = $selectedPlant.name;
    editNotes = $selectedPlant.notes || '';
  }

  $: canAddMorePlants = bedPlants.length < MAX_BED_PLANTS;

  async function loadBedPlants() {
    if (!$selectedPlant?.id) return;
    bedPlants = await getPlantsInBed($selectedPlant.id);
    
    // Load status for each plant
    for (const plant of bedPlants) {
      plantStatuses[plant.id] = await getPlantCareStatus(plant.id);
    }
    plantStatuses = { ...plantStatuses }; // Trigger reactivity
  }

  async function handleAddPlantSuccess() {
    await loadBedPlants();
    showAddPlant = false;
  }

  async function saveBedChanges() {
    try {
      await updatePlant($selectedPlant.id, {
        name: editName,
        notes: editNotes
      });
      isEditing = false;
      await loadPlants();
      showToast('Bed updated', 'success');
    } catch (err) {
      console.error('Failed to update bed:', err);
      showToast('Failed to update bed', 'error');
    }
  }

  function cancelEdit() {
    editName = $selectedPlant.name;
    editNotes = $selectedPlant.notes || '';
    isEditing = false;
  }

  function handlePlantClick(plant) {
    navigateToPlantDetail(plant);
  }

  function getStatusColor(status) {
    switch(status) {
      case 'healthy': return '#4caf50'; // Green
      case 'attention': return '#ff9800'; // Orange/Yellow
      case 'neglected': return '#f44336'; // Red
      default: return '#9e9e9e'; // Gray
    }
  }
</script>

{#if $selectedPlant}
  <div class="bed-detail-container">
    <!-- Bed Header -->
    <div class="bed-header">
      <div class="bed-icon">🥬</div>
      <div class="bed-info">
        {#if isEditing}
          <input 
            type="text" 
            bind:value={editName} 
            class="edit-input"
            placeholder="Bed name"
          />
        {:else}
          <h2 class="bed-name">{$selectedPlant.name}</h2>
        {/if}
        <div class="bed-meta">
          <span class="plant-count">{bedPlants.length}/{MAX_BED_PLANTS} plants</span>
        </div>
      </div>
      
      {#if !isEditing}
        <button class="btn-edit" on:click={() => isEditing = true}>✏️</button>
      {/if}
    </div>

    <!-- Bed Visualization (Top View) -->
    <div class="bed-view-section">
      <h3 class="section-title">{$t('bedLayout')}</h3>
      
      <div class="bed-container">
        <!-- Brown border frame -->
        <div class="bed-border">
          <div class="bed-soil">
            <!-- Plant spots (5 horizontal) -->
            <div class="plant-spots">
              {#each Array(MAX_BED_PLANTS) as _, index}
                {@const plant = bedPlants[index]}
                
                {#if plant}
                  <button 
                    class="plant-spot filled"
                    on:click={() => handlePlantClick(plant)}
                  >
                    <!-- Status color ring -->
                    <div 
                      class="status-ring" 
                      style="border-color: {getStatusColor(plantStatuses[plant.id] || 'default')}"
                    ></div>
                    
                    <!-- Plant emoji -->
                    <div class="plant-emoji">{plant.emoji}</div>
                    
                    <!-- Plant name -->
                    <div class="plant-name">{plant.name}</div>
                    
                    <!-- Amount -->
                    <div class="plant-amount">×{plant.amount || 1}</div>
                  </button>
                {:else}
                  <div class="plant-spot empty">
                    <div class="empty-indicator">⊕</div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bed Notes -->
    {#if isEditing}
      <div class="section">
        <h3 class="section-title">{$t('bedNotes')}</h3>
        <textarea 
          bind:value={editNotes} 
          class="edit-textarea"
          placeholder="Add notes about this bed (e.g., soil type, amendments, rotation plan)..."
          rows="3"
        ></textarea>
        <div class="edit-actions">
          <button class="btn btn-secondary" on:click={cancelEdit}>Cancel</button>
          <button class="btn btn-primary" on:click={saveBedChanges}>Save</button>
        </div>
      </div>
    {:else if $selectedPlant.notes}
      <div class="section">
        <h3 class="section-title">{$t('bedNotes')}</h3>
        <p class="notes-text">{$selectedPlant.notes}</p>
      </div>
    {/if}

    <!-- Add Plant Section -->
    <div class="add-plant-section">
      {#if !showAddPlant}
        <button 
          class="btn-add-plant" 
          on:click={() => showAddPlant = true}
          disabled={!canAddMorePlants}
        >
          <span class="add-icon">+</span>
          <span>{canAddMorePlants ? $t('addPlantToBed') : `${$t('bedFull')} (${MAX_BED_PLANTS}/${MAX_BED_PLANTS})`}</span>
        </button>
      {:else}
        <AddPlantInline 
          bedId={$selectedPlant.id}
          onSuccess={handleAddPlantSuccess}
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  .bed-detail-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .bed-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
  }

  .bed-icon {
    font-size: 3rem;
  }

  .bed-info {
    flex: 1;
  }

  .bed-name {
    font-size: 1.5rem;
    margin: 0 0 0.25rem;
    color: #2d5a27;
  }

  .bed-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
  }

  .plant-count {
    color: #666;
    font-weight: 500;
  }

  .btn-edit {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
  }

  .section {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .section-title {
    font-size: 1rem;
    color: #2d5a27;
    margin: 0 0 0.75rem;
    font-weight: 600;
  }

  .notes-text {
    color: #666;
    line-height: 1.5;
    margin: 0;
  }

  .edit-input {
    width: 100%;
    padding: 0.5rem;
    font-size: 1.25rem;
    border: 2px solid #2d5a27;
    border-radius: 8px;
    margin-bottom: 0.25rem;
  }

  .edit-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.875rem;
    resize: vertical;
  }

  .edit-textarea:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  /* Bed Visualization Styles */
  .bed-view-section {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .bed-container {
    margin-top: 0.75rem;
  }

  .bed-border {
    background: #8b6f47; /* Brown border */
    border-radius: 8px;
    padding: 15px;
  }

  .bed-soil {
    background: #5d4e37; /* Dark soil color */
    border-radius: 5px;
    padding: 20px;
  }

  .plant-spots {
    display: flex;
    justify-content: space-around;
    gap: 15px;
  }

  .plant-spot {
    flex: 1;
    aspect-ratio: 1;
    max-width: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    background: none;
    border: none;
    cursor: default;
    padding: 0;
  }

  .plant-spot.filled {
    cursor: pointer;
    transition: transform 0.2s;
  }

  .plant-spot.filled:hover {
    transform: translateY(-4px);
  }

  .plant-spot.empty {
    background: rgba(74, 63, 47, 0.5);
    border-radius: 8px;
    border: 2px dashed #8b7355;
  }

  .status-ring {
    position: absolute;
    top: -5%;
    left: -5%;
    right: -5%;
    bottom: 25%;
    border: 4px solid #4caf50;
    border-radius: 50%;
    pointer-events: none;
  }

  .plant-emoji {
    font-size: 2.5rem;
    margin-bottom: 0.25rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  .plant-name {
    font-size: 0.7rem;
    color: white;
    font-weight: 600;
    text-align: center;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plant-amount {
    font-size: 0.75rem;
    color: #ffd54f;
    font-weight: 700;
    margin-top: 0.125rem;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }

  .empty-indicator {
    font-size: 2rem;
    color: #8b7355;
    opacity: 0.4;
  }

  /* Add Plant Form */
  .add-plant-section {
    margin-bottom: 1rem;
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

  .btn-add-plant:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .btn-add-plant:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-icon {
    font-size: 1.5rem;
    font-weight: 300;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 500;
    transition: background 0.2s;
  }

  .btn-primary {
    background: #2d5a27;
    color: white;
  }

  .btn-primary:hover {
    background: #3d7a37;
  }

  .btn-secondary {
    background: #e9ecef;
    color: #333;
  }

  .btn-secondary:hover {
    background: #dee2e6;
  }
</style>
