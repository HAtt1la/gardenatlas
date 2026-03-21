<script>
  import { selectedPlant, plantEvents, plantForecast, plantHealth, loadPlantDetails, loadPlants, showToast, navigateToMap } from '../lib/stores.js';
  import { updatePlant, deleteEvent, convertToPlaceholder, isLabelTaken, EVENT_TYPES, getCareProfiles } from '../lib/db.js';
  import { t } from '../lib/i18n.js';
  import { PLANT_COLORS } from '../lib/constants.js';
  import { HEALTH_COLORS } from '../lib/health.js';
  import EventForm from './EventForm.svelte';
  import PhotoGallery from './PhotoGallery.svelte';

  let isEditing = false;
  let editName = '';
  let editNotes = '';
  let editColor = '';
  let editLabel = '';
  let editProfileId = null;
  let labelError = '';
  let showEventForm = false;
  let editingEventId = null;
  let careProfiles = [];

  // Load care profiles for the dropdown
  async function loadCareProfiles() {
    careProfiles = await getCareProfiles();
  }
  loadCareProfiles();

  // Update edit fields when plant changes (but not while actively editing)
  $: if ($selectedPlant && !isEditing) {
    editName = $selectedPlant.name;
    editNotes = $selectedPlant.notes || '';
    editColor = $selectedPlant.color || '';
    editLabel = $selectedPlant.label || '';
    editProfileId = $selectedPlant.profileId ?? null;
    labelError = '';
  }

  // Allow convert-to-placeholder for section plants
  $: canMarkRemoved = $selectedPlant?.type === 'plant';

  async function handleMarkAsRemoved() {
    if (!confirm($t('markAsRemovedConfirm'))) return;
    try {
      await convertToPlaceholder($selectedPlant.id);
      await loadPlants();
      showToast($t('markedAsRemoved'), 'success');
      navigateToMap();
    } catch (err) {
      console.error('Failed to convert plant:', err);
      showToast('Failed to convert plant', 'error');
    }
  }

  async function saveChanges() {
    const trimmedLabel = editLabel.trim();
    if (trimmedLabel && await isLabelTaken(trimmedLabel, $selectedPlant.id)) {
      labelError = $t('labelTaken');
      return;
    }
    await updatePlant($selectedPlant.id, {
      name: editName,
      notes: editNotes,
      color: editColor || null,
      label: trimmedLabel || null,
      profileId: editProfileId || null
    });
    isEditing = false;
    labelError = '';
    // loadPlantDetails also triggers a loadPlants internally via the store
    await loadPlantDetails($selectedPlant.id);
    await loadPlants();
    showToast($t('plantUpdated'), 'success');
  }

  function cancelEdit() {
    editName = $selectedPlant.name;
    editNotes = $selectedPlant.notes || '';
    editLabel = $selectedPlant.label || '';
    editProfileId = $selectedPlant.profileId ?? null;
    labelError = '';
    isEditing = false;
  }

  async function handleEventAdded() {
    await loadPlantDetails($selectedPlant.id);
    showEventForm = false;
    showToast($t('eventSaved'), 'success');
  }

  async function handleEventUpdated() {
    await loadPlantDetails($selectedPlant.id);
    editingEventId = null;
    showToast($t('eventUpdated'), 'success');
  }

  async function handleDeleteEvent(eventId) {
    if (confirm($t('confirmDeleteEvent'))) {
      await deleteEvent(eventId);
      await loadPlantDetails($selectedPlant.id);
      showToast($t('eventDeleted'), 'success');
    }
  }

  function getEventType(typeId) {
    return EVENT_TYPES.find(e => e.id === typeId) || { label: typeId, icon: '📌' };
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
</script>

{#if $selectedPlant}
  <div class="detail-container">
    <!-- Plant Header -->
    <div class="plant-header">
      <div class="plant-icon">
        {#if (isEditing ? (editColor || $selectedPlant.color) : $selectedPlant.color)}
          <span class="plant-color-preview" style="background: {isEditing ? (editColor || $selectedPlant.color) : $selectedPlant.color}"></span>
        {/if}
      </div>
      <div class="plant-info">
        {#if isEditing}
          <input
            type="text"
            bind:value={editName}
            class="edit-input"
            placeholder={$t('plantName')}
          />
          <div class="label-edit-row">
            <span class="label-prefix">{$t('plantLabel')}:</span>
            <input
              type="text"
              bind:value={editLabel}
              class="edit-input-label"
              placeholder={$t('plantLabelPlaceholder')}
            />
          </div>
          {#if labelError}
            <p class="label-error">{labelError}</p>
          {/if}
        {:else}
          <h2 class="plant-name">{$selectedPlant.name}</h2>
          <div class="plant-meta">
            <span class="plant-label-badge">#{$selectedPlant.label ?? $selectedPlant.id}</span>
          </div>
        {/if}
      </div>
      
      {#if !isEditing}
        <button class="btn-edit" on:click={() => isEditing = true}>✏️</button>
      {/if}
    </div>

    <!-- Photo Gallery -->
    <PhotoGallery plantId={$selectedPlant.id} />

    <!-- Forecast Card -->
    {#if $plantForecast}
      <div class="forecast-card status-{$plantForecast.status}">
        <div class="forecast-icon">💨</div>
        <div class="forecast-info">
          <div class="forecast-label">{$t('nextSpray')}</div>
          {#if $plantForecast.status === 'never'}
            <div class="forecast-value">{$t('neverSprayed')}</div>
          {:else}
            <div class="forecast-value">{formatDate($plantForecast.date)}</div>
            <div class="forecast-days">
              {#if $plantForecast.daysUntil < 0}
                {Math.abs($plantForecast.daysUntil)} {$t('daysOverdue')}
              {:else if $plantForecast.daysUntil === 0}
                {$t('today')}
              {:else}
                {$t('inDays', { days: $plantForecast.daysUntil })}
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Notes Section -->
    {#if isEditing}
      <div class="section">
        <h3 class="section-title">{$t('notes')}</h3>
        <textarea 
          bind:value={editNotes} 
          class="edit-textarea"
          placeholder="Add notes about this plant..."
          rows="3"
        ></textarea>
        
        <!-- Color Picker -->
        <div class="emoji-picker">
          <div class="section-title">{$t('plantColor')}</div>
          <div class="color-grid">
            {#each PLANT_COLORS as c}
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

        <!-- Care Profile Picker -->
        <div class="emoji-picker">
          <div class="section-title">{$t('assignProfile')}</div>
          <select class="profile-select" bind:value={editProfileId}>
            <option value={null}>{$t('noProfile')}</option>
            {#each careProfiles as profile}
              <option value={profile.id}>{profile.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="edit-actions">
          <button class="btn btn-secondary" on:click={cancelEdit}>{$t('cancel')}</button>
          <button class="btn btn-primary" on:click={saveChanges}>{$t('save')}</button>
        </div>
      </div>
    {:else}
      <div class="section">
        <h3 class="section-title">{$t('notes')}</h3>
        {#if $selectedPlant.notes}
          <p class="notes-text">{$selectedPlant.notes}</p>
        {:else}
          <p class="notes-empty">{$t('noNotesYet')}</p>
        {/if}
      </div>

      <!-- Health Breakdown -->
      {#if $plantHealth && !$plantHealth.noProfile}
        {@const hcolor = HEALTH_COLORS[$plantHealth.status]}
        <div class="section health-section">
          <div class="health-header">
            <h3 class="section-title" style="margin:0">{$t('plantHealth')}</h3>
            <span class="health-badge" style="background:{hcolor}">{$t('health_' + $plantHealth.status)}</span>
          </div>
          {#if $plantHealth.issues.length === 0}
            <p class="health-ok">✓ {$t('healthAllGood')}</p>
          {:else}
            <div class="health-issues">
              {#each $plantHealth.issues as issue}
                <div class="health-issue {issue.overdue ? 'issue-overdue' : 'issue-pending'}">
                  <span class="issue-icon">{issue.action === 'spray' ? '💨' : issue.action === 'prune' ? '✂️' : '💧'}</span>
                  <div class="issue-body">
                    <span class="issue-purpose">{issue.purpose}</span>
                    {#if issue.product}
                      <span class="issue-product">{issue.product}</span>
                    {/if}
                    <span class="issue-due">{issue.overdue ? $t('issueOverdue') : $t('issueDueBy', { date: formatDate(issue.dueDate) })}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}

    <!-- Events Timeline -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">{$t('eventHistory')}</h3>
        <button class="btn btn-primary btn-sm" on:click={() => showEventForm = true}>
          + {$t('addEvent')}
        </button>
      </div>

      {#if showEventForm}
        <EventForm 
          plantId={$selectedPlant.id} 
          on:saved={handleEventAdded}
          on:cancel={() => showEventForm = false}
        />
      {/if}

      {#if $plantEvents.length > 0}
        <div class="timeline">
          {#each $plantEvents as event}
            {@const eventType = getEventType(event.eventType)}
            <div class="timeline-item">
              {#if editingEventId === event.id}
                <div class="timeline-edit">
                  <EventForm
                    plantId={$selectedPlant.id}
                    event={event}
                    on:updated={handleEventUpdated}
                    on:cancel={() => editingEventId = null}
                  />
                </div>
              {:else}
                <div class="timeline-icon">{eventType.icon}</div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-type">{$t(eventType.label)}</span>
                    <span class="timeline-date">{formatDate(event.date)}</span>
                  </div>
                  {#if event.notes}
                    <p class="timeline-notes">{event.notes}</p>
                  {/if}
                </div>
                <button
                  class="btn-icon"
                  on:click={() => editingEventId = event.id}
                  aria-label={$t('editEvent')}
                >✏️</button>
                <button
                  class="btn-delete"
                  on:click={() => handleDeleteEvent(event.id)}
                  aria-label={$t('delete')}
                >🗑️</button>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">{$t('noEvents')}</p>
      {/if}
    </div>

    <!-- Danger Zone -->
    {#if canMarkRemoved}
      <div class="section danger-zone">
        <h3 class="section-title danger-title">{$t('dangerZone')}</h3>
        <p class="danger-description">{$t('markAsRemovedConfirm')}</p>
        <button class="btn btn-danger" on:click={handleMarkAsRemoved}>
          🪓 {$t('markAsRemoved')}
        </button>
      </div>
    {/if}
  </div>
{:else}
  <div class="empty-state">{$t('plantNotFound')}</div>
{/if}

<style>
  .detail-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .plant-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
  }

  .plant-icon {
    font-size: 3rem;
  }

  .plant-info {
    flex: 1;
  }

  .plant-name {
    font-size: 1.5rem;
    margin: 0 0 0.25rem;
    color: #2d5a27;
  }

  .plant-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: #666;
  }

  .plant-label-badge {
    font-weight: 600;
    color: #2d5a27;
    font-size: 1rem;
  }

  .label-edit-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.35rem;
  }

  .label-prefix {
    font-size: 0.8125rem;
    color: #666;
    white-space: nowrap;
  }

  .edit-input-label {
    width: 100px;
    padding: 0.35rem 0.5rem;
    font-size: 0.9375rem;
    border: 2px solid #2d5a27;
    border-radius: 8px;
  }

  .label-error {
    font-size: 0.8125rem;
    color: #e74c3c;
    margin: 0.25rem 0 0;
  }

  .btn-edit {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
  }

  .forecast-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .forecast-card.status-ok {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  }

  .forecast-card.status-soon {
    background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  }

  .forecast-card.status-overdue {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  }

  .forecast-card.status-never {
    background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
  }

  .forecast-icon {
    font-size: 2rem;
  }

  .forecast-info {
    flex: 1;
  }

  .forecast-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .forecast-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
  }

  .forecast-days {
    font-size: 0.875rem;
    color: #666;
  }

  .section {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1rem;
    color: #2d5a27;
    margin: 0 0 0.75rem;
  }

  .section-header .section-title {
    margin: 0;
  }

  .notes-text {
    color: #666;
    line-height: 1.5;
    margin: 0;
  }

  .notes-empty {
    color: #999;
    font-style: italic;
    line-height: 1.5;
    margin: 0;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .timeline-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
    align-items: flex-start;
  }

  .timeline-icon {
    font-size: 1.25rem;
  }

  .timeline-content {
    flex: 1;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .timeline-type {
    font-weight: 600;
    color: #333;
  }

  .timeline-date {
    font-size: 0.75rem;
    color: #666;
  }

  .timeline-notes {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
  }

  .btn-delete {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .btn-delete:hover {
    opacity: 1;
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
    font-size: 0.9rem;
  }

  .btn-icon:hover {
    opacity: 1;
  }

  .timeline-edit {
    width: 100%;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
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

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .btn-danger {
    background: #e74c3c;
    color: white;
  }

  .btn-danger:hover {
    background: #c0392b;
  }

  .danger-zone {
    border: 2px solid #e74c3c;
    background: #fef5f5;
  }

  .danger-title {
    color: #e74c3c;
  }

  .danger-description {
    color: #666;
    font-size: 0.875rem;
    margin: 0 0 1rem;
    line-height: 1.5;
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

  .emoji-picker {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .emoji-picker .section-title {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #333;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }

  .emoji-grid.vine-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .color-grid {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .color-btn {
    width: 44px;
    height: 44px;
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
    font-size: 1.1rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }

  .plant-color-preview {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    font-size: 1.75rem;
  }

  .emoji-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    font-size: 1.5rem;
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .emoji-btn:hover {
    border-color: #2d5a27;
    background: #f0faf0;
    transform: scale(1.1);
  }

  .emoji-btn.selected {
    border-color: #2d5a27;
    background: #2d5a27;
    box-shadow: inset 0 0 0 2px white;
  }

  .empty-state {
    text-align: center;
    color: #666;
    padding: 2rem;
  }

  .profile-select {
    width: 100%;
    padding: 0.625rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9375rem;
    background: white;
  }

  .profile-select:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .health-section {
    padding-bottom: 0.75rem;
  }

  .health-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .health-badge {
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .health-ok {
    color: #27ae60;
    font-weight: 600;
    margin: 0;
    font-size: 0.9375rem;
  }

  .health-issues {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .health-issue {
    display: flex;
    gap: 0.625rem;
    padding: 0.625rem;
    border-radius: 8px;
    align-items: flex-start;
  }

  .issue-overdue {
    background: #fdf0f0;
    border-left: 3px solid #e74c3c;
  }

  .issue-pending {
    background: #fffbf0;
    border-left: 3px solid #f0c040;
  }

  .issue-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .issue-body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .issue-purpose {
    font-weight: 600;
    font-size: 0.875rem;
    color: #333;
  }

  .issue-product {
    font-size: 0.8125rem;
    color: #666;
    font-style: italic;
  }

  .issue-due {
    font-size: 0.75rem;
    color: #888;
  }
</style>
