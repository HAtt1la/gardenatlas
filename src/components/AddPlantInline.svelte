<script>
  import { convertPlaceholder } from '../lib/db.js';
  import { loadPlants, showToast } from '../lib/stores.js';
  import { t } from '../lib/i18n.js';
  import { PLANT_COLORS } from '../lib/constants.js';

  export let onSuccess = null;
  export let convertMode = false;
  export let placeholderPlant = null;
  export let rowSize = null;

  const ALL_COLORS = PLANT_COLORS;

  let newPlantName = '';
  let selectedColor = '#27ae60';
  let selectedPosition = null;

  async function handleAddPlant() {
    if (!newPlantName.trim()) {
      showToast($t('plantNameRequired'), 'error');
      return;
    }

    try {
      if (convertMode && placeholderPlant) {
        await convertPlaceholder(
          placeholderPlant.id,
          newPlantName.trim(),
          selectedColor,
          selectedPosition
        );
      }

      await loadPlants();
      showToast($t('plantAdded'), 'success');

      newPlantName = '';
      selectedColor = '#27ae60';
      selectedPosition = null;

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to add plant:', err);
      showToast($t('addPlantFailed'), 'error');
    }
  }

  function handleCancel() {
    newPlantName = '';
    selectedColor = '#27ae60';
    selectedPosition = null;
    if (onSuccess) onSuccess();
  }
</script>

<div class="add-plant-form">
  <h3 class="form-title">
    {$t('convertPlaceholder')}
  </h3>

  <div class="form-group">
    <label for="new-plant-name">{$t('plantName')}</label>
    <input
      type="text"
      id="new-plant-name"
      bind:value={newPlantName}
      class="text-input"
    />
  </div>

  {#if convertMode && rowSize != null && rowSize > 1}
    <div class="form-group">
      <label for="plant-position">{$t('columnPosition', { n: rowSize })}</label>
      <input
        type="number"
        id="plant-position"
        bind:value={selectedPosition}
        min="1"
        max={rowSize}
        placeholder={$t('columnPositionHint')}
        class="text-input"
      />
    </div>
  {/if}

  <div class="form-group">
    <div class="form-label">{$t('plantColor')}</div>
    <div class="color-grid">
      {#each ALL_COLORS as c}
        <button
          type="button"
          class="color-btn {selectedColor === c.value ? 'selected' : ''}"
          style="background: {c.value}"
          on:click={() => selectedColor = c.value}
          title={c.label}
        >
          {#if selectedColor === c.value}<span class="color-check">✓</span>{/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="form-actions">
    <button class="btn btn-secondary" on:click={handleCancel}>
      {$t('cancel')}
    </button>
    <button class="btn btn-primary" on:click={handleAddPlant}>
      {$t('save')}
    </button>
  </div>
</div>

<style>
  .add-plant-form {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .form-title {
    font-size: 1.125rem;
    color: #2d5a27;
    margin: 0 0 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .text-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .text-input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .color-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .color-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    position: relative;
    transition: transform 0.15s, border-color 0.15s;
  }

  .color-btn:hover {
    transform: scale(1.15);
  }

  .color-btn.selected {
    border-color: #333;
  }

  .color-check {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
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
