<script>
  import { addPlant, addPlantToBed } from '../lib/db.js';
  import { loadPlants, showToast } from '../lib/stores.js';
  import { t } from '../lib/i18n.js';

  export let bedId = null; // If provided, adds plant to bed; otherwise creates new "other" plant
  export let onSuccess = null; // Optional callback after successful addition
  export let plantEmojis = [
    '🌿', '🌱', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🌹', '🏵️',
    '🥀', '💐', '🎍', '☘️','🌲',
    '🌳', '🌶️', '🫑', '🧄',
    '🧅', '🥕', '🥔', '🥒', '🌽', '🥦', '🥬'
  ];

  let newPlantName = '';
  let selectedEmoji = '🌿';
  let newPlantAmount = 1;

  async function handleAddPlant() {
    if (!newPlantName.trim()) {
      showToast($t('plantNameRequired'), 'error');
      return;
    }

    try {
      if (bedId) {
        // Adding to a bed
        await addPlantToBed(bedId, {
          name: newPlantName.trim(),
          emoji: selectedEmoji,
          amount: newPlantAmount,
          notes: null
        });
      } else {
        // Creating a new "other" plant
        const newPlant = {
          name: newPlantName.trim(),
          type: 'other',
          emoji: selectedEmoji,
          row: null,
          x: null,
          y: null,
          notes: null
        };
        await addPlant(newPlant);
      }

      await loadPlants();
      showToast($t('plantAdded'), 'success');
      
      // Reset form
      newPlantName = '';
      selectedEmoji = '🌿';
      newPlantAmount = 1;

      // Call callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to add plant:', err);
      showToast($t('addPlantFailed'), 'error');
    }
  }

  function handleCancel() {
    newPlantName = '';
    selectedEmoji = '🌿';
    newPlantAmount = 1;
    if (onSuccess) {
      onSuccess(); // Trigger callback to close form
    }
  }
</script>

<div class="add-plant-form">
  <h3 class="form-title">{bedId ? $t('addPlantToBed') : $t('addNewPlant')}</h3>
  
  <div class="form-group">
    <label for="new-plant-name">{$t('plantName')}</label>
    <input
      type="text"
      id="new-plant-name"
      bind:value={newPlantName}
      placeholder={bedId ? $t('exampleBedPlants') : $t('exampleOtherPlants')}
      class="text-input"
    />
  </div>

  {#if bedId}
    <div class="form-group">
      <label for="new-plant-amount">{$t('amount')}</label>
      <input
        type="number"
        id="new-plant-amount"
        bind:value={newPlantAmount}
        min="1"
        max="99"
        class="text-input"
      />
    </div>
  {/if}

  <div class="form-group">
    <div class="form-label">{$t('chooseEmoji')}</div>
    <div class="emoji-grid">
      {#each plantEmojis as emoji}
        <button
          type="button"
          class="emoji-button {selectedEmoji === emoji ? 'selected' : ''}"
          on:click={() => selectedEmoji = emoji}
        >
          {emoji}
        </button>
      {/each}
    </div>
  </div>

  <div class="preview-section">
    <div class="form-label">{$t('preview')}</div>
    <div class="preview-plant">
      <span class="preview-emoji">{selectedEmoji}</span>
      <span class="preview-name">{newPlantName || ($t('plantName') || 'Plant Name')}</span>
    </div>
  </div>

  <div class="form-actions">
    <button class="btn btn-secondary" on:click={handleCancel}>
      {$t('cancel')}
    </button>
    <button class="btn btn-primary" on:click={handleAddPlant}>
      {$t('addPlant')}
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
  }

  .text-input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
    gap: 0.5rem;
  }

  .emoji-button {
    aspect-ratio: 1;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    background: #f8f9fa;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .emoji-button:hover {
    background: #e9ecef;
    border-color: #2d5a27;
  }

  .emoji-button.selected {
    background: #e8f5e9;
    border-color: #2d5a27;
    border-width: 3px;
  }

  .preview-section {
    margin-bottom: 1rem;
  }

  .preview-plant {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .preview-emoji {
    font-size: 2rem;
  }

  .preview-name {
    font-size: 1rem;
    color: #333;
    font-weight: 500;
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
