<script>
  import { t } from '../lib/i18n.js';
  import { showToast } from '../lib/stores.js';
  import { addSectionPlant } from '../lib/db.js';
  import { loadPlants } from '../lib/stores.js';

  export let section;      // instance { instanceId, type, name, cols?, rows? }
  export let descriptor;   // SECTION_BY_TYPE[section.type]
  export let onClose;      // () => void
  export let onSave;       // (updatedSection) => void
  export let onColChange;  // async (newCols) => { ok, blockingPlants? }
  export let onRowChange;  // async (newRows) => { ok, blockingPlants? }

  let editName = section.name;
  let editCols = section.cols ?? descriptor.defaultCols ?? 1;
  let editRows = section.rows ?? descriptor.defaultRows ?? 1;

  let showAddForm = false;
  let newName = '';
  let selectedEmoji = (descriptor.emojis ?? ['🌿'])[0];
  let selectedColor = (descriptor.colors ?? ['#27ae60'])[0];

  const ALL_COLORS = [
    { label: 'Red',       value: '#c0392b' },
    { label: 'Orange',    value: '#e67e22' },
    { label: 'Yellow',    value: '#f0c040' },
    { label: 'Lime',      value: '#6aaa2a' },
    { label: 'Green',     value: '#27ae60' },
    { label: 'Teal',      value: '#16a085' },
    { label: 'Sky',       value: '#2980b9' },
    { label: 'Lavender',  value: '#8e44ad' },
    { label: 'Pink',      value: '#e07a8e' },
    { label: 'Brown',     value: '#8b5e3c' },
    { label: 'Slate',     value: '#7f8c8d' },
    { label: 'Gold',      value: '#d4c46e' },
  ];

  $: plantEmojis = descriptor.emojis ?? ['🌿'];
  $: plantColors = descriptor.colors
    ? descriptor.colors.map(v => ALL_COLORS.find(c => c.value === v) ?? { label: v, value: v })
    : ALL_COLORS;

  async function decreaseCols() {
    if (editCols <= (descriptor.minCols ?? 1)) return;
    const result = await onColChange(editCols - 1);
    if (!result.ok) {
      showToast($t('layoutColsBlocked').replace('{n}', result.blockingPlants.length), 'error');
    } else {
      editCols -= 1;
    }
  }

  async function increaseCols() {
    if (editCols >= (descriptor.maxCols ?? 12)) return;
    await onColChange(editCols + 1);
    editCols += 1;
  }

  async function decreaseRows() {
    if (editRows <= (descriptor.minRows ?? 1)) return;
    const result = await onRowChange(editRows - 1);
    if (!result.ok) {
      showToast($t('layoutRowsBlocked').replace('{n}', result.blockingPlants.length), 'error');
    } else {
      editRows -= 1;
    }
  }

  async function increaseRows() {
    if (editRows >= (descriptor.maxRows ?? 8)) return;
    await onRowChange(editRows + 1);
    editRows += 1;
  }

  function handleSave() {
    const updated = { ...section, name: editName.trim() || section.name, cols: editCols, rows: editRows };
    onSave(updated);
  }

  async function handleAddPlant() {
    if (!newName.trim()) {
      showToast($t('plantNameRequired'), 'error');
      return;
    }
    await addSectionPlant(section.instanceId, section.type, newName.trim(), selectedEmoji, selectedColor);
    await loadPlants();
    showToast($t('plantAdded'), 'success');
    newName = '';
    selectedEmoji = (descriptor.emojis ?? ['🌿'])[0];
    selectedColor = (descriptor.colors ?? ['#27ae60'])[0];
    showAddForm = false;
  }

  function cancelAdd() {
    newName = '';
    selectedEmoji = (descriptor.emojis ?? ['🌿'])[0];
    selectedColor = (descriptor.colors ?? ['#27ae60'])[0];
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

    {#if descriptor.hasCols}
      <div class="sheet-field stepper-row">
        <span class="stepper-label">{$t('colsLabel')}</span>
        <div class="stepper">
          <button class="stepper-btn" on:click={decreaseCols} disabled={editCols <= (descriptor.minCols ?? 1)}>−</button>
          <span class="stepper-val">{editCols}</span>
          <button class="stepper-btn" on:click={increaseCols} disabled={editCols >= (descriptor.maxCols ?? 12)}>+</button>
        </div>
      </div>
    {/if}

    {#if descriptor.hasRows}
      <div class="sheet-field stepper-row">
        <span class="stepper-label">{$t('rowsLabel')}</span>
        <div class="stepper">
          <button class="stepper-btn" on:click={decreaseRows} disabled={editRows <= (descriptor.minRows ?? 1)}>−</button>
          <span class="stepper-val">{editRows}</span>
          <button class="stepper-btn" on:click={increaseRows} disabled={editRows >= (descriptor.maxRows ?? 8)}>+</button>
        </div>
      </div>
    {/if}

    {#if !descriptor.isBedSection}
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
              placeholder={descriptor.icon}
              class="text-input"
            />
          </div>

          <div class="form-group">
            <div class="form-label">{$t('chooseEmoji')}</div>
            <div class="emoji-grid">
              {#each plantEmojis as emoji}
                <button
                  type="button"
                  class="emoji-button {selectedEmoji === emoji ? 'selected' : ''}"
                  on:click={() => selectedEmoji = emoji}
                >{emoji}</button>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <div class="form-label">{$t('plantColor')}</div>
            <div class="color-grid">
              {#each plantColors as c}
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

  .sheet-field input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .sheet-field input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .stepper-row {
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

  .form-label {
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

  .emoji-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .emoji-button {
    width: 42px;
    height: 42px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    background: #f8f9fa;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .emoji-button.selected {
    background: #e8f5e9;
    border-color: #2d5a27;
    border-width: 3px;
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
