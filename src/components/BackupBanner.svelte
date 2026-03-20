<script>
  import { exportData, recordBackupDone, snoozeBackupPrompt } from '../lib/db.js';
  import { showToast } from '../lib/stores.js';
  import { t } from '../lib/i18n.js';

  export let onDismiss;

  async function handleDownload() {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gardenatlas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await recordBackupDone();
      showToast($t('dataExported'), 'success');
    } catch {
      showToast($t('exportFailed'), 'error');
    }
    onDismiss();
  }

  async function handleLater() {
    await snoozeBackupPrompt();
    onDismiss();
  }
</script>

<div class="backup-banner">
  <span class="banner-text">💾 {$t('backupBannerText')}</span>
  <div class="banner-actions">
    <button class="btn-download" on:click={handleDownload}>{$t('backupBannerDownload')}</button>
    <button class="btn-later" on:click={handleLater}>{$t('backupBannerLater')}</button>
  </div>
</div>

<style>
  .backup-banner {
    background: #fff8e1;
    border-bottom: 2px solid #f9a825;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .banner-text {
    font-size: 0.875rem;
    color: #5d4037;
    flex: 1;
    min-width: 0;
  }

  .banner-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .btn-download {
    background: #f9a825;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-download:hover {
    background: #f57f17;
  }

  .btn-later {
    background: transparent;
    color: #795548;
    border: 1px solid #bcaaa4;
    border-radius: 6px;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-later:hover {
    background: #efebe9;
  }
</style>
