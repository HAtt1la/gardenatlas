<script>
  import { t } from '../lib/i18n.js';
  import { showToast } from '../lib/stores.js';
  import { addSectionPlant } from '../lib/db.js';
  import { loadPlants } from '../lib/stores.js';
  import { PLANT_COLORS } from '../lib/constants.js';

  export let section;
  export let onClose;
  export let onSave;

  let editName = section.name;
  let editColor = section.color ?? '#a8d5a2';

  let showAddForm = false;
  let newName = '';
  let selectedColor = section.color ?? '#a8d5a2';

  const ALL_COLORS = PLANT_COLORS;

  function handleSave() {
    const updated = {
      ...section,
      name: editName.trim() || section.name,
      color: editColor
    };
    onSave(updated);
  }

  async function handleAddPlant() {
    if (!newName.trim()) {
      showToast($t('plantNameRequired'), 'error');
      return;
    }
    // Add at the first free hex — the user can drag it in Arrange mode
    await addSectionPlant(section.instanceId, newName.trim(), selectedColor);
    await loadPlants();
    showToast($t('plantAdded'), 'success');
    newName = '';
    selectedColor = editColor;
    showAddForm = false;
  }

  function cancelAdd() {
    newName = '';
    selectedColor = editColor;
    showAddForm = false;
  }
</script>

<div class="sheet-backdrop"
  role="presentation"
  aria-hidden="true"
  on:click={onClose}
  on:keydown={(e) => e.key === 'Escape' && onClose()}>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="sheet-panel"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:click|stopPropagation
    on:keydown|stopPropagation>
    <div class="drag-handle"></div>

    <h3 class="sheet-title">{$t('editSection')}</h3>

    <div class="sheet-field">
      <label for="sec-name">{$t('sectionName')}</label>
      <input id="sec-name" type="text" bind:value={editName} />
    </div>

    <div class="sheet-field">
      <div class="form-label">{$t('sectionColor')}</div>
      <div class="color-grid">
        {#each ALL_COLORS as c (c.value)}
          <button
            type="button"
            class="color-btn {editColor === c.value ? 'selected' : ''}"
            style="background: {c.value}"
            on:click={() => editColor = c.value}
            title={c.label}
          >
            {#if editColor === c.value}<span class="color-check">✓</span>{/if}
          </button>
        {/each}
      </div>
    </div>

    <p class="hex-hint">{$t('arrangeHint')}</p>

    {#if !showAddForm}
      <button class="btn btn-add-plant" on:click={() => showAddForm = true}>
        + {$t('addPlant')}
      </button>
    {:else}
      <div class="add-plant-inline">
        <div class="add-plant-title">{$t('addNewPlant')}</div>

        <div class="form-group">
          <label for="new-plant-name">{$t('plantName')}</label>
          <input
            id="new-plant-name"
            type="text"
            bind:value={newName}
            class="text-input"
          />
        </div>

        <div class="form-group">
          <div class="form-label">{$t('plantColor')}</div>
          <div class="color-grid">
            {#each ALL_COLORS as c (c.value)}
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

        <div class="add-form-actions">
          <button class="btn btn-secondary" on:click={cancelAdd}>{$t('cancel')}</button>
          <button class="btn btn-primary" on:click={handleAddPlant}>{$t('save')}</button>
        </div>
      </div>
    {/if}

    <div class="sheet-actions">
      <button class="btn btn-secondary" on:click={onClose}>{$t('cancel')}</button>
      <button class="btn btn-primary" on:click={handleSave}>{$t('save')}</button>
    </div>
  </div>
</div>

<style>
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 200;
    display: flex;
    align-items: flex-end;
  }

  .sheet-panel {
    width: 100%;
    background: white;
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
    overflow-y: auto;
    padding: 1rem 1.25rem 2rem;
  }

  .drag-handle {
    width: 40px;
    height: 4px;
    background: #ccc;
    border-radius: 2px;
    margin: 0 auto 1rem;
  }

  .sheet-title {
    font-size: 1rem;
    font-weight: 700;
    color: #2d5a27;
    margin: 0 0 1rem;
  }

  .sheet-field {
    margin-bottom: 1rem;
  }

  .sheet-field label {
    display: block;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.35rem;
  }

  .sheet-field input[type="text"] {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .sheet-field input[type="text"]:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .form-label {
    display: block;
    font-size: 0.8125rem;
    color: #555;
    margin-bottom: 0.3rem;
    font-weight: 500;
  }

  .color-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .color-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    position: relative;
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
    font-size: 0.875rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }

  .btn-add-plant {
    width: 100%;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-add-plant:hover {
    background: linear-gradient(135deg, #3d7a37 0%, #5a9c53 100%);
  }

  .hex-hint {
    font-size: 0.8125rem;
    color: #666;
    margin: 0 0 1rem;
    padding: 0.75rem;
    background: #f8fdf8;
    border-radius: 8px;
    border: 1px solid #c8e6c9;
  }

  .add-plant-inline {
    background: #f8fdf8;
    border: 1.5px solid #c8e6c9;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .add-plant-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #2d5a27;
    margin-bottom: 0.75rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    display: block;
    font-size: 0.8125rem;
    color: #555;
    margin-bottom: 0.3rem;
    font-weight: 500;
  }

  .text-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .text-input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .add-form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .add-form-actions .btn {
    flex: 1;
  }

  .sheet-actions {
    display: flex;
    gap: 0.75rem;
  }

  .sheet-actions .btn {
    flex: 1;
  }

  .btn {
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
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
