<script>
  import { t } from '../lib/i18n.js';

  export let onUpdate;
  export let onDismiss;
</script>

<div class="update-banner">
  <span class="banner-text">🔄 {$t('updateAvailable')}</span>
  <div class="banner-actions">
    <button class="btn-update" on:click={onUpdate}>{$t('updateNow')}</button>
    <button class="btn-later" on:click={onDismiss}>{$t('updateLater')}</button>
  </div>
</div>

<style>
  .update-banner {
    background: #e8f5e9;
    border-bottom: 2px solid #2d5a27;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .banner-text {
    font-size: 0.875rem;
    color: #1b5e20;
    flex: 1;
    min-width: 0;
  }

  .banner-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .btn-update {
    background: #2d5a27;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-update:hover {
    background: #3d7a37;
  }

  .btn-later {
    background: transparent;
    color: #2d5a27;
    border: 1px solid #a5c8a0;
    border-radius: 6px;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-later:hover {
    background: #c8e6c9;
  }
</style>
