<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { getPhotosForPlant, getMainPhotoForPlant, addPhotoToPlant, deletePhoto, setMainPhoto } from '../lib/db.js';
  import { showToast } from '../lib/stores.js';
  import { t } from '../lib/i18n.js';

  export let plantId;

  const dispatch = createEventDispatcher();

  let photos = [];
  let mainPhoto = null;
  let showGallery = false;
  let loading = false;
  let fileInput;

  const MAX_PHOTOS = 3;

  onMount(() => {
    loadPhotos();
  });

  // Reload when plantId changes
  $: if (plantId) {
    loadPhotos();
  }

  async function loadPhotos() {
    photos = await getPhotosForPlant(plantId);
    mainPhoto = await getMainPhotoForPlant(plantId);
  }

  function getPhotoUrl(photo) {
    if (!photo?.data) return null;
    return URL.createObjectURL(photo.data);
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (photos.length >= MAX_PHOTOS) {
      showToast($t('maxPhotosReached'), 'error');
      return;
    }

    loading = true;
    try {
      await addPhotoToPlant(plantId, file);
      await loadPhotos();
      showToast($t('photoAdded'), 'success');
      dispatch('photoChange');
    } catch (err) {
      console.error('Failed to add photo:', err);
      showToast(err.message || 'Failed to add photo', 'error');
    } finally {
      loading = false;
      // Reset input so same file can be selected again
      if (fileInput) fileInput.value = '';
    }
  }

  async function handleSetMain(photoId) {
    await setMainPhoto(photoId);
    await loadPhotos();
    showToast($t('photoSetAsMain'), 'success');
    showGallery = false;
    dispatch('photoChange');
  }

  async function handleDelete(photoId) {
    if (confirm($t('confirmDeletePhoto'))) {
      await deletePhoto(photoId);
      await loadPhotos();
      showToast($t('photoDeleted'), 'success');
      dispatch('photoChange');
    }
  }

  function openGallery() {
    if (photos.length > 0) {
      showGallery = true;
    }
  }

  function closeGallery() {
    showGallery = false;
  }

  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="photo-section">
  <!-- Main Photo Display -->
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <div class="main-photo-container" on:click={openGallery} role="button" tabindex="0">
    {#if mainPhoto}
      {@const photoUrl = getPhotoUrl(mainPhoto)}
      {#if photoUrl}
        <!-- svelte-ignore a11y-img-redundant-alt -->
        <img src={photoUrl} alt="Plant photo" class="main-photo" />
        {#if photos.length > 1}
          <div class="photo-count">{photos.length} 📷</div>
        {/if}
      {/if}
    {:else}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
      <div class="no-photo" on:click|stopPropagation={triggerFileInput} role="button" tabindex="0">
        <span class="no-photo-icon">📷</span>
        <span class="no-photo-text">{$t('addPhoto')}</span>
      </div>
    {/if}
  </div>

  <!-- Hidden File Input -->
  <input 
    type="file" 
    accept="image/*" 
    bind:this={fileInput}
    on:change={handleFileSelect}
    class="hidden-input"
  />

  <!-- Add Photo Button (when there's at least one photo but less than max) -->
  {#if mainPhoto && photos.length < MAX_PHOTOS}
    <button class="btn-add-photo" on:click={triggerFileInput} disabled={loading}>
      {loading ? '...' : '+ ' + $t('addPhoto')}
    </button>
  {/if}
</div>

<!-- Gallery Modal -->
{#if showGallery}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <div class="gallery-overlay" on:click={closeGallery} role="button" tabindex="0">
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
    <div class="gallery-modal" on:click|stopPropagation role="dialog">
      <div class="gallery-header">
        <h3>{$t('photos')} ({photos.length}/{MAX_PHOTOS})</h3>
        <button class="btn-close" on:click={closeGallery}>✕</button>
      </div>
      
      <p class="gallery-hint">{$t('tapToSelectMain')}</p>
      
      <div class="gallery-grid">
        {#each photos as photo (photo.id)}
          {@const photoUrl = getPhotoUrl(photo)}
          <div class="gallery-item" class:is-main={photo.isMain === 1}>
            {#if photoUrl}
              <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions a11y-img-redundant-alt -->
              <button class="gallery-photo-btn" on:click={() => handleSetMain(photo.id)}>
                <img src={photoUrl} alt="Plant photo" class="gallery-photo" />
              </button>
            {/if}
            {#if photo.isMain === 1}
              <div class="main-badge">★</div>
            {/if}
            <button 
              class="btn-delete-photo" 
              on:click|stopPropagation={() => handleDelete(photo.id)}
              aria-label={$t('deletePhoto')}
            >
              🗑️
            </button>
          </div>
        {/each}
        
        <!-- Add Photo Slot -->
        {#if photos.length < MAX_PHOTOS}
          <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
          <div class="gallery-item add-slot" on:click={triggerFileInput} role="button" tabindex="0">
            <span class="add-icon">+</span>
            <span class="add-text">{$t('addPhoto')}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .photo-section {
    margin-bottom: 1rem;
  }

  .main-photo-container {
    width: 100%;
    height: 300px;
    border-radius: 12px;
    overflow: hidden;
    background: #e8e8e8;
    cursor: pointer;
    position: relative;
  }

  .main-photo {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .photo-count {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
  }

  .no-photo {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    cursor: pointer;
    transition: background 0.2s;
  }

  .no-photo:hover {
    background: #e8e8e8;
  }

  .no-photo-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  .no-photo-text {
    font-size: 0.875rem;
  }

  .hidden-input {
    display: none;
  }

  .btn-add-photo {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    background: #f0f0f0;
    border: 2px dashed #ccc;
    border-radius: 8px;
    color: #666;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add-photo:hover:not(:disabled) {
    background: #e8e8e8;
    border-color: #2d5a27;
    color: #2d5a27;
  }

  .btn-add-photo:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Gallery Modal */
  .gallery-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .gallery-modal {
    background: white;
    border-radius: 16px;
    padding: 1rem;
    width: 100%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .gallery-header h3 {
    margin: 0;
    color: #2d5a27;
    font-size: 1.125rem;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    color: #666;
  }

  .gallery-hint {
    color: #999;
    font-size: 0.75rem;
    margin: 0 0 1rem;
    text-align: center;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .gallery-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    background: #f0f0f0;
  }

  .gallery-item.is-main {
    border: 3px solid #2d5a27;
  }

  .gallery-photo-btn {
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .gallery-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }

  .main-badge {
    position: absolute;
    top: 4px;
    left: 4px;
    background: #2d5a27;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .btn-delete-photo {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: background 0.2s;
  }

  .btn-delete-photo:hover {
    background: #f8d7da;
  }

  .add-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed #ccc;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-slot:hover {
    border-color: #2d5a27;
    background: #f0fff0;
  }

  .add-icon {
    font-size: 2rem;
    color: #999;
    line-height: 1;
  }

  .add-text {
    font-size: 0.75rem;
    color: #999;
    margin-top: 0.25rem;
  }
</style>
