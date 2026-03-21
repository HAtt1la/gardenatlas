<script>
  import { t } from '../lib/i18n.js';
  import { showToast } from '../lib/stores.js';
  import { addSectionPlant } from '../lib/db.js';
  import { loadPlants } from '../lib/stores.js';
  import { PLANT_COLORS } from '../lib/constants.js';

  export let section;      // instance { instanceId, name, cols, rows, color, showWires }
  export let onClose;      // () => void
  export let onSave;       // (updatedSection) => void
  export let onColChange;  // async (newCols) => { ok, blockingPlants? }
  export let onRowChange;  // async (newRows) => { ok, blockingPlants? }

  let editName = section.name;
  let editCols = section.cols ?? 1;
  let editRows = section.rows ?? 1;
  let editColor = section.color ?? '#a8d5a2';
  let editShowWires = section.showWires ?? false;

  let showAddForm = false;
  let newName = '';
  let selectedColor = section.color ?? '#a8d5a2';

  const MIN_COLS = 1;
  const MAX_COLS = 8;
  const MIN_ROWS = 1;
  const MAX_ROWS = 8;

  const ALL_COLORS = PLANT_COLORS;

  async function decreaseCols() {
    if (editCols <= MIN_COLS) return;
    const result = await onColChange(editCols - 1);
    if (!result.ok) {
      showToast($t('layoutColsBlocked').replace('{n}', result.blockingPlants.length), 'error');
    } else {
      editCols -= 1;
    }
  }

  async function increaseCols() {
    if (editCols >= MAX_COLS) return;
    await onColChange(editCols + 1);
    editCols += 1;
  }

  async function decreaseRows() {
    if (editRows <= MIN_ROWS) return;
    const result = await onRowChange(editRows - 1);
    if (!result.ok) {
      showToast($t('layoutRowsBlocked').replace('{n}', result.blockingPlants.length), 'error');
    } else {
      editRows -= 1;
    }
  }

  async function increaseRows() {
    if (editRows >= MAX_ROWS) return;
    await onRowChange(editRows + 1);
    editRows += 1;
  }

  function handleSave() {
    const updated = {
      ...section,
      name: editName.trim() || section.name,
      cols: editCols,
      rows: editRows,
      color: editColor,
      showWires: editShowWires
    };
    onSave(updated);
  }

  async function handleAddPlant() {
    if (!newName.trim()) {
      showToast($t('plantNameRequired'), 'error');
      return;
    }
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
    on:click|stopPropagation
    on:keydown|stopPropagation>
    <div class="drag-handle"></div>

    <h3 class="sheet-title">{$t('editSection')}</h3>

    <div class="sheet-field">
      <label for="sec-name">{$t('sectionName')}</label>
      <input id="sec-name" type="text" bind:value={editName} />
    </div>

    <div class="sheet-field stepper-row">
      <span class="stepper-label">{$t('colsLabel')}</span>
      <div class="stepper">
        <button class="stepper-btn" on:click={decreaseCols} disabled={editCols <= MIN_COLS}>−</button>
        <span class="stepper-val">{editCols}</span>
        <button class="stepper-btn" on:click={increaseCols} disabled={editCols >= MAX_COLS}>+</button>
      </div>
    </div>

    <div class="sheet-field stepper-row">
      <span class="stepper-label">{$t('rowsLabel')}</span>
      <div class="stepper">
        <button class="stepper-btn" on:click={decreaseRows} disabled={editRows <= MIN_ROWS}>−</button>
        <span class="stepper-val">{editRows}</span>
        <button class="stepper-btn" on:click={increaseRows} disabled={editRows >= MAX_ROWS}>+</button>
      </div>
    </div>

    <div class="sheet-field">
      <div class="form-label">{$t('sectionColor')}</div>
      <div class="color-grid">
        {#each ALL_COLORS as c}
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

    <div class="sheet-field toggle-row">
      <span class="stepper-label">{$t('showWires')}</span>
      <label class="toggle">
        <input type="checkbox" bind:checked={editShowWires} />
        <span class="toggle-slider"></span>
      </label>
    </div>

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

  .stepper-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stepper-label {
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stepper-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #e9ecef;
    background: #f8f9fa;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .stepper-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .stepper-val {
    font-size: 1.125rem;
    font-weight: 700;
    min-width: 2ch;
    text-align: center;
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

  /* Toggle switch */
  .toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #ccc;
    border-radius: 24px;
    transition: background 0.2s;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .toggle input:checked + .toggle-slider {
    background: #2d5a27;
  }

  .toggle input:checked + .toggle-slider::before {
    transform: translateX(20px);
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
