<script>
  import { createEventDispatcher } from 'svelte';
  import { addEvent, EVENT_TYPES } from '../lib/db.js';
  import { t } from '../lib/i18n.js';

  export let plantId;

  const dispatch = createEventDispatcher();

  let eventType = 'spray';
  let date = new Date().toISOString().split('T')[0];
  let notes = '';
  let isSubmitting = false;

  async function handleSubmit() {
    if (!eventType || !date) return;
    
    isSubmitting = true;
    try {
      await addEvent({
        plantId,
        eventType,
        date,
        notes: notes.trim() || null
      });
      dispatch('saved');
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<form class="event-form" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label for="eventType">Event Type</label>
    <select id="eventType" bind:value={eventType}>
      {#each EVENT_TYPES as type}
        <option value={type.id}>{type.icon} {$t(type.label)}</option>
      {/each}
    </select>
  </div>

  <div class="form-group">
    <label for="date">Date</label>
    <input type="date" id="date" bind:value={date} required />
  </div>

  <div class="form-group">
    <label for="notes">Notes (optional)</label>
    <textarea id="notes" bind:value={notes} rows="2" placeholder="Add any notes..."></textarea>
  </div>

  <div class="form-actions">
    <button type="button" class="btn btn-secondary" on:click={handleCancel}>
      Cancel
    </button>
    <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save Event'}
    </button>
  </div>
</form>

<style>
  .event-form {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .form-group select,
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.625rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9375rem;
  }

  .form-group select:focus,
  .form-group input:focus,
  .form-group textarea:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
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

  .btn-primary:hover:not(:disabled) {
    background: #3d7a37;
  }

  .btn-primary:disabled {
    opacity: 0.6;
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
