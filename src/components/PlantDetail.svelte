<script>
  import { selectedPlant, plantEvents, plantForecast, loadPlantDetails, loadPlants, showToast, navigateToMap } from '../lib/stores.js';
  import { updatePlant, addEvent, deleteEvent, deletePlant, EVENT_TYPES, PLANT_TYPES } from '../lib/db.js';
  import EventForm from './EventForm.svelte';
  import PhotoGallery from './PhotoGallery.svelte';

  let isEditing = false;
  let editName = '';
  let editNotes = '';
  let showEventForm = false;
  let lastPlantId = null;

  // Update edit fields when plant changes (but not while actively editing)
  $: if ($selectedPlant && !isEditing) {
    if ($selectedPlant.id !== lastPlantId) {
      lastPlantId = $selectedPlant.id;
    }
    editName = $selectedPlant.name;
    editNotes = $selectedPlant.notes || '';
  }

  $: plantType = PLANT_TYPES.find(t => t.id === $selectedPlant?.type);
  
  // Only allow delete for bed plants and herbs/flowers (type 'other')
  // Trees and vines are permanent and shouldn't be deleted
  $: canDelete = $selectedPlant?.type === 'bed-plant' || $selectedPlant?.type === 'other';

  async function saveChanges() {
    await updatePlant($selectedPlant.id, {
      name: editName,
      notes: editNotes
    });
    isEditing = false;
    await loadPlants();
    await loadPlantDetails($selectedPlant.id);
    showToast('Plant updated', 'success');
  }

  function cancelEdit() {
    editName = $selectedPlant.name;
    editNotes = $selectedPlant.notes || '';
    isEditing = false;
  }

  async function handleEventAdded() {
    await loadPlantDetails($selectedPlant.id);
    showEventForm = false;
    showToast('Event added', 'success');
  }

  async function handleDeleteEvent(eventId) {
    if (confirm('Delete this event?')) {
      await deleteEvent(eventId);
      await loadPlantDetails($selectedPlant.id);
      showToast('Event deleted', 'success');
    }
  }

  async function handleDeletePlant() {
    const plantName = $selectedPlant.name;
    if (confirm(`Are you sure you want to delete "${plantName}"? This will also delete all associated events and cannot be undone.`)) {
      try {
        await deletePlant($selectedPlant.id);
        await loadPlants();
        showToast(`"${plantName}" deleted`, 'success');
        navigateToMap();
      } catch (err) {
        console.error('Failed to delete plant:', err);
        showToast('Failed to delete plant', 'error');
      }
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
      <div class="plant-icon">{$selectedPlant.emoji || plantType?.icon || '🌿'}</div>
      <div class="plant-info">
        {#if isEditing}
          <input 
            type="text" 
            bind:value={editName} 
            class="edit-input"
            placeholder="Plant name"
          />
        {:else}
          <h2 class="plant-name">{$selectedPlant.name}</h2>
        {/if}
        <div class="plant-meta">
          <span class="plant-id">ID: #{$selectedPlant.id}</span>
          <span class="plant-type">{plantType?.label || $selectedPlant.type}</span>
        </div>
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
          <div class="forecast-label">Next Spray</div>
          {#if $plantForecast.status === 'never'}
            <div class="forecast-value">Never sprayed</div>
          {:else}
            <div class="forecast-value">{formatDate($plantForecast.date)}</div>
            <div class="forecast-days">
              {#if $plantForecast.daysUntil < 0}
                {Math.abs($plantForecast.daysUntil)} days overdue
              {:else if $plantForecast.daysUntil === 0}
                Today
              {:else}
                In {$plantForecast.daysUntil} days
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Notes Section -->
    {#if isEditing}
      <div class="section">
        <h3 class="section-title">Notes</h3>
        <textarea 
          bind:value={editNotes} 
          class="edit-textarea"
          placeholder="Add notes about this plant..."
          rows="3"
        ></textarea>
        <div class="edit-actions">
          <button class="btn btn-secondary" on:click={cancelEdit}>Cancel</button>
          <button class="btn btn-primary" on:click={saveChanges}>Save</button>
        </div>
      </div>
    {:else}
      <div class="section">
        <h3 class="section-title">Notes</h3>
        {#if $selectedPlant.notes}
          <p class="notes-text">{$selectedPlant.notes}</p>
        {:else}
          <p class="notes-empty">No notes yet. Click the edit button above to add notes.</p>
        {/if}
      </div>
    {/if}

    <!-- Events Timeline -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">Event History</h3>
        <button class="btn btn-primary btn-sm" on:click={() => showEventForm = true}>
          + Add Event
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
              <div class="timeline-icon">{eventType.icon}</div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">{eventType.label}</span>
                  <span class="timeline-date">{formatDate(event.date)}</span>
                </div>
                {#if event.notes}
                  <p class="timeline-notes">{event.notes}</p>
                {/if}
              </div>
              <button 
                class="btn-delete" 
                on:click={() => handleDeleteEvent(event.id)}
                aria-label="Delete event"
              >
                🗑️
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">No events recorded yet</p>
      {/if}
    </div>

    <!-- Danger Zone (only for bed plants and herbs/flowers) -->
    {#if canDelete}
      <div class="section danger-zone">
        <h3 class="section-title danger-title">Danger Zone</h3>
        <p class="danger-description">Once you delete a plant, there is no going back. All events will also be deleted.</p>
        <button class="btn btn-danger" on:click={handleDeletePlant}>
          🗑️ Delete Plant
        </button>
      </div>
    {/if}
  </div>
{:else}
  <div class="empty-state">Plant not found</div>
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

  .plant-id {
    font-weight: 600;
    color: #2d5a27;
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

  .empty-state {
    text-align: center;
    color: #666;
    padding: 2rem;
  }
</style>
