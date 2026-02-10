<script>
  import { navigateToMap, loadPlants, showToast } from '../lib/stores.js';
  import { addPlant } from '../lib/db.js';
  import { t } from '../lib/i18n.js';

  let plantName = '';
  let selectedEmoji = '🌿';
  
  // Available emojis for plant selection
  const plantEmojis = [
    '🌿', '🌱', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🌹', '🏵️',
    '🥀', '💐', '🎋', '🎍', '☘️', '🍀', '🪴', '🌲',
    '🌳', '🍃', '🍂', '🍁', '🌰', '🥜', '🫘', '🌶️', '🫑', '🧄',
    '🧅', '🥕', '🥔', '🥒', '🫛', '🌽', '🍄', '🥦', '🥬', '🥗'
  ];

  async function handleSubmit() {
    if (!plantName.trim()) {
      showToast($t('plantNameRequired') || 'Plant name is required', 'error');
      return;
    }

    const newPlant = {
      name: plantName.trim(),
      type: 'other',
      emoji: selectedEmoji,
      row: null,
      x: null,
      y: null,
      notes: null
    };

    try {
      await addPlant(newPlant);
      await loadPlants();
      showToast($t('plantAdded') || 'Plant added successfully', 'success');
      navigateToMap();
    } catch (err) {
      console.error('Failed to add plant:', err);
      showToast($t('addPlantFailed') || 'Failed to add plant', 'error');
    }
  }

  function handleCancel() {
    navigateToMap();
  }
</script>

<div class="add-plant-container">
  <h2 class="page-title">{$t('addNewPlant') || 'Add New Plant'}</h2>

  <div class="form-card">
    <div class="form-group">
      <label for="plant-name">{$t('plantName') || 'Plant Name'}</label>
      <input
        type="text"
        id="plant-name"
        bind:value={plantName}
        placeholder={$t('enterPlantName') || 'Enter plant name...'}
        class="text-input"
      />
    </div>

    <div class="form-group">
      <div class="form-label">{$t('chooseEmoji') || 'Choose Icon'}</div>
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
      <div class="form-label">{$t('preview') || 'Preview'}</div>
      <div class="preview-plant">
        <span class="preview-emoji">{selectedEmoji}</span>
        <span class="preview-name">{plantName || ($t('plantName') || 'Plant Name')}</span>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn btn-secondary" on:click={handleCancel}>
        {$t('cancel') || 'Cancel'}
      </button>
      <button class="btn btn-primary" on:click={handleSubmit}>
        {$t('addPlant') || 'Add Plant'}
      </button>
    </div>
  </div>
</div>

<style>
  .add-plant-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .page-title {
    font-size: 1.5rem;
    color: #2d5a27;
    margin: 0 0 1.5rem;
  }

  .form-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.9375rem;
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
    transition: border-color 0.2s;
  }

  .text-input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 0.5rem;
  }

  .emoji-button {
    width: 100%;
    aspect-ratio: 1;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    background: #f8f9fa;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
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
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .preview-section .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #666;
    margin-bottom: 0.75rem;
  }

  .preview-plant {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 2px solid #e9ecef;
  }

  .preview-emoji {
    font-size: 2rem;
  }

  .preview-name {
    font-size: 1rem;
    font-weight: 500;
    color: #333;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
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

  @media (max-width: 480px) {
    .emoji-grid {
      grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
    }

    .emoji-button {
      font-size: 1.25rem;
    }
  }
</style>
