<script>
  import { onMount } from 'svelte';
  import { plants, loadPlants, showToast, navigateToMap } from '../lib/stores.js';
  import { addEvent, EVENT_TYPES, getSections } from '../lib/db.js';
  import { SECTION_BY_TYPE } from '../sections/index.js';
  import { t } from '../lib/i18n.js';

  let eventType = 'spray';
  let date = new Date().toISOString().split('T')[0];
  let notes = '';
  let selectedPlantIds = new Set();
  let isSubmitting = false;
  let expandedSections = {};
  let sections = [];

  onMount(async () => {
    sections = await getSections();
  });

  // Group plants by sectionId, matching the map's rendering order
  $: plantsBySectionId = (() => {
    const map = {};
    for (const p of $plants) {
      if (p.type === 'placeholder') continue;
      const key = p.sectionId ?? p.type;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  })();

  // Sections that have at least one plant, in map order
  $: activeSections = sections.filter(s => (plantsBySectionId[s.instanceId]?.length ?? 0) > 0);

  $: sectionSelected = Object.fromEntries(
    activeSections.map(s => {
      const ps = plantsBySectionId[s.instanceId] ?? [];
      return [s.instanceId, ps.length > 0 && ps.every(p => selectedPlantIds.has(p.id))];
    })
  );

  $: sectionPartial = Object.fromEntries(
    activeSections.map(s => {
      const ps = plantsBySectionId[s.instanceId] ?? [];
      return [s.instanceId, ps.some(p => selectedPlantIds.has(p.id)) && !sectionSelected[s.instanceId]];
    })
  );

  $: canSubmit = selectedPlantIds.size > 0 && eventType && date;

  function selectSection(instanceId, event) {
    event.stopPropagation();
    const ps = plantsBySectionId[instanceId] ?? [];
    if (sectionSelected[instanceId]) {
      ps.forEach(p => selectedPlantIds.delete(p.id));
    } else {
      ps.forEach(p => selectedPlantIds.add(p.id));
    }
    selectedPlantIds = new Set(selectedPlantIds);
  }

  function togglePlant(plantId) {
    if (selectedPlantIds.has(plantId)) {
      selectedPlantIds.delete(plantId);
    } else {
      selectedPlantIds.add(plantId);
    }
    selectedPlantIds = new Set(selectedPlantIds);
  }

  function toggleSectionExpanded(instanceId, event) {
    event.stopPropagation();
    expandedSections[instanceId] = !expandedSections[instanceId];
    expandedSections = { ...expandedSections };
  }

  function selectAll() {
    selectedPlantIds = new Set($plants.filter(p => p.type !== 'placeholder').map(p => p.id));
  }

  function deselectAll() {
    selectedPlantIds = new Set();
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    isSubmitting = true;
    try {
      let successCount = 0;
      for (const plantId of selectedPlantIds) {
        await addEvent({ plantId, eventType, date, notes: notes.trim() || null });
        successCount++;
      }
      await loadPlants();
      showToast(`Event added to ${successCount} plant${successCount !== 1 ? 's' : ''}`, 'success');
      navigateToMap();
    } catch (err) {
      console.error('Failed to add event:', err);
      showToast('Failed to add event', 'error');
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    navigateToMap();
  }
</script>

<div class="multi-event-container">
  <h2 class="page-title">Add Event to Multiple Plants</h2>

  <div class="form-card">
    <!-- Event Type -->
    <div class="form-group">
      <label for="eventType">Event Type</label>
      <select id="eventType" bind:value={eventType}>
        {#each EVENT_TYPES as type}
          <option value={type.id}>{type.icon} {$t(type.label)}</option>
        {/each}
      </select>
    </div>

    <!-- Date -->
    <div class="form-group">
      <label for="date">Date</label>
      <input type="date" id="date" bind:value={date} required />
    </div>

    <!-- Notes -->
    <div class="form-group">
      <label for="notes">Notes (optional)</label>
      <textarea
        id="notes"
        bind:value={notes}
        rows="3"
        placeholder="Add any notes about this event..."
      ></textarea>
    </div>

    <!-- Plant Selection by Section -->
    <div class="form-group">
      <div class="plants-header">
        <span>Select Plants ({selectedPlantIds.size}/{$plants.filter(p => p.type !== 'placeholder').length})</span>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button type="button" class="quick-btn" on:click={selectAll}>
          Select All
        </button>
        <button type="button" class="quick-btn" on:click={deselectAll}>
          Clear Selection
        </button>
      </div>

      <!-- Sections -->
      <div class="sections-list">
        {#each activeSections as sec}
          {@const d = SECTION_BY_TYPE[sec.type]}
          {@const sectionPlants = plantsBySectionId[sec.instanceId] ?? []}
          <div class="section-group">
            <!-- Section Header -->
            <div class="section-header">
              <input
                type="checkbox"
                checked={sectionSelected[sec.instanceId]}
                indeterminate={sectionPartial[sec.instanceId]}
                on:click={(e) => selectSection(sec.instanceId, e)}
                aria-label={`Toggle ${$t(sec.name)}`}
              />
              <span class="section-icon">{d.icon}</span>
              <span class="section-name">{$t(sec.name)}</span>
              <span class="section-count">{sectionPlants.length}</span>
              <button
                type="button"
                class="expand-btn"
                on:click={(e) => toggleSectionExpanded(sec.instanceId, e)}
                aria-label={`${expandedSections[sec.instanceId] ? 'Collapse' : 'Expand'} ${$t(sec.name)}`}
              >
                <span class="expand-icon">
                  {expandedSections[sec.instanceId] ? '▼' : '▶'}
                </span>
              </button>
            </div>

            <!-- Section Plants (Collapsible) -->
            {#if expandedSections[sec.instanceId]}
              <div class="plants-in-section">
                {#each sectionPlants as plant (plant.id)}
                  <div class="plant-item">
                    <input
                      type="checkbox"
                      id="plant-{plant.id}"
                      checked={selectedPlantIds.has(plant.id)}
                      on:change={() => togglePlant(plant.id)}
                    />
                    <label for="plant-{plant.id}" class="plant-label">
                      <span class="plant-emoji">{plant.emoji || d.icon}</span>
                      <span class="plant-name">{plant.name}</span>
                    </label>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}

        {#if activeSections.length === 0}
          <div class="no-results">
            No plants available
          </div>
        {/if}
      </div>

      {#if selectedPlantIds.size === 0}
        <div class="warning-message">
          ⚠️ Please select at least one plant or section
        </div>
      {/if}
    </div>

    <!-- Form Actions -->
    <div class="form-actions">
      <button class="btn btn-secondary" on:click={handleCancel}>
        Cancel
      </button>
      <button class="btn btn-primary" disabled={!canSubmit || isSubmitting} on:click={handleSubmit}>
        {isSubmitting ? 'Saving...' : `Add Event to ${selectedPlantIds.size} Plant${selectedPlantIds.size !== 1 ? 's' : ''}`}
      </button>
    </div>
  </div>
</div>

<style>
  .multi-event-container {
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

  .form-group select,
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
  }

  .form-group select:focus,
  .form-group input:focus,
  .form-group textarea:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .plants-header {
    display: block;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .quick-actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .quick-btn {
    flex: 1;
    padding: 0.5rem;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .quick-btn:hover {
    background: #e0e0e0;
  }

  .sections-list {
    border: 2px solid #e9ecef;
    border-radius: 8px;
    background: #f8f9fa;
    overflow: hidden;
  }

  .section-group {
    border-bottom: 1px solid #e9ecef;
  }

  .section-group:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fff;
    user-select: none;
    transition: background 0.2s;
  }

  .section-header:hover {
    background: #f0f0f0;
  }

  .section-header input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #2d5a27;
    flex-shrink: 0;
  }

  .section-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .section-name {
    font-weight: 600;
    color: #2d5a27;
    flex: 1;
  }

  .section-count {
    font-size: 0.75rem;
    background: #e8f5e9;
    color: #2d5a27;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
  }

  .expand-btn {
    background: none;
    border: none;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .expand-btn:hover {
    background: #e9ecef;
  }

  .expand-icon {
    font-size: 0.875rem;
    color: #999;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .plants-in-section {
    background: #f8f9fa;
    padding: 0.5rem;
    border-top: 1px solid #e9ecef;
  }

  .plant-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 6px;
    transition: background 0.2s;
    margin-bottom: 0.25rem;
  }

  .plant-item:last-child {
    margin-bottom: 0;
  }

  .plant-item:hover {
    background: #e9ecef;
  }

  .plant-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #2d5a27;
    flex-shrink: 0;
  }

  .plant-label {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  .plant-emoji {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .plant-name {
    font-weight: 500;
    color: #333;
  }

  .no-results {
    padding: 2rem 1rem;
    text-align: center;
    color: #999;
  }

  .warning-message {
    padding: 0.75rem;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 6px;
    color: #856404;
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
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

  .btn-primary:hover:not(:disabled) {
    background: #3d7a37;
  }

  .btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #e9ecef;
    color: #333;
  }

  .btn-secondary:hover {
    background: #dee2e6;
  }
</style>
