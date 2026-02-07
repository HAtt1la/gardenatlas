<script>
  import { showToast, loadPlants } from '../lib/stores.js';
  import { exportData, importData, getSetting, setSetting, DEFAULT_INTERVALS } from '../lib/db.js';
  import { currentLanguage, setLanguage, t } from '../lib/i18n.js';

  let sprayIntervals = { ...DEFAULT_INTERVALS };
  let fileInput;
  let isExporting = false;
  let isImporting = false;

  // Load saved intervals
  async function loadSettings() {
    const saved = await getSetting('sprayIntervals');
    if (saved) {
      sprayIntervals = { ...DEFAULT_INTERVALS, ...saved };
    }
  }
  loadSettings();

  async function saveIntervals() {
    await setSetting('sprayIntervals', sprayIntervals);
    showToast($t('settingsSaved'), 'success');
  }
  
  function handleLanguageChange(lang) {
    setLanguage(lang);
    showToast($t('settingsSaved'), 'success');
  }

  async function handleExport() {
    isExporting = true;
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
      showToast($t('dataExported'), 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast($t('exportFailed'), 'error');
    } finally {
      isExporting = false;
    }
  }

  function handleImportClick() {
    fileInput?.click();
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    isImporting = true;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.plants || !data.events) {
        throw new Error('Invalid backup file format');
      }

      const confirmMsg = $t('confirmImport')
        .replace('{plants}', data.plants.length)
        .replace('{events}', data.events.length);
      
      if (!confirm(confirmMsg)) {
        return;
      }

      await importData(data);
      await loadPlants();
      showToast($t('dataImported'), 'success');
    } catch (err) {
      console.error('Import failed:', err);
      showToast($t('importFailed') + ': ' + err.message, 'error');
    } finally {
      isImporting = false;
      if (fileInput) fileInput.value = '';
    }
  }

  async function handleClearData() {
    if (!confirm($t('confirmClearAll'))) {
      return;
    }
    if (!confirm($t('confirmClearAllSecond'))) {
      return;
    }

    try {
      await importData({ plants: [], events: [], settings: [] });
      await loadPlants();
      showToast($t('allDataCleared'), 'success');
    } catch (err) {
      showToast($t('clearFailed'), 'error');
    }
  }
</script>

<div class="settings-container">
  <h2 class="page-title">{$t('settingsTitle')}</h2>

  <!-- Language Selection -->
  <section class="section">
    <h3 class="section-title">{$t('language')}</h3>
    <p class="section-desc">Choose your preferred language</p>
    
    <div class="language-options">
      <button 
        class="language-option {$currentLanguage === 'en' ? 'active' : ''}"
        on:click={() => handleLanguageChange('en')}
      >
        <span class="flag">🇬🇧</span>
        <span>{$t('english')}</span>
      </button>
      <button 
        class="language-option {$currentLanguage === 'hu' ? 'active' : ''}"
        on:click={() => handleLanguageChange('hu')}
      >
        <span class="flag">🇭🇺</span>
        <span>{$t('hungarian')}</span>
      </button>
    </div>
  </section>

  <!-- Spray Intervals -->
  <section class="section">
    <h3 class="section-title">{$t('sprayIntervals')}</h3>
    <p class="section-desc">{$t('sprayIntervalsDesc')}</p>
    
    <div class="interval-list">
      <div class="interval-item">
        <label for="grape-interval">🍇 {$t('grapevines')}</label>
        <div class="interval-input-wrapper">
          <input 
            type="number" 
            id="grape-interval"
            bind:value={sprayIntervals.grape.spray}
            min="1"
            max="365"
          />
          <span class="interval-unit">{$t('days')}</span>
        </div>
      </div>
      
      <div class="interval-item">
        <label for="fruit-interval">🌳 {$t('fruitTrees')}</label>
        <div class="interval-input-wrapper">
          <input 
            type="number" 
            id="fruit-interval"
            bind:value={sprayIntervals.fruit.spray}
            min="1"
            max="365"
          />
          <span class="interval-unit">{$t('days')}</span>
        </div>
      </div>
    </div>
    
    <button class="btn btn-primary" on:click={saveIntervals}>
      {$t('saveSettings')}
    </button>
  </section>

  <!-- Data Management -->
  <section class="section">
    <h3 class="section-title">{$t('dataManagement')}</h3>
    
    <div class="data-actions">
      <div class="action-card">
        <div class="action-icon">📤</div>
        <div class="action-info">
          <h4>{$t('exportData')}</h4>
          <p>{$t('exportDataDesc')}</p>
        </div>
        <button 
          class="btn btn-secondary" 
          on:click={handleExport}
          disabled={isExporting}
        >
          {isExporting ? $t('exporting') : $t('exportButton')}
        </button>
      </div>

      <div class="action-card">
        <div class="action-icon">📥</div>
        <div class="action-info">
          <h4>{$t('importData')}</h4>
          <p>{$t('importDataDesc')}</p>
        </div>
        <button 
          class="btn btn-secondary" 
          on:click={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? $t('importing') : $t('importButton')}
        </button>
        <input 
          type="file" 
          accept=".json"
          bind:this={fileInput}
          on:change={handleFileSelect}
          class="hidden-file-input"
        />
      </div>

      <div class="action-card danger">
        <div class="action-icon">⚠️</div>
        <div class="action-info">
          <h4>{$t('clearAllData')}</h4>
          <p>{$t('clearAllDataDesc')}</p>
        </div>
        <button class="btn btn-danger" on:click={handleClearData}>
          {$t('clearButton')}
        </button>
      </div>
    </div>
  </section>

  <!-- About -->
  <section class="section">
    <h3 class="section-title">{$t('aboutApp')}</h3>
    <div class="about-info">
      <p><strong>{$t('appName')}</strong> v1.0.0</p>
      <p>{$t('aboutDesc')}</p>
      <p class="about-note">💡 {$currentLanguage === 'en' ? 'Tip: Add this app to your home screen for quick access!' : 'Tipp: Add hozzá ezt az alkalmazást a kezdőképernyődre a gyors hozzáféréshez!'}</p>
    </div>
  </section>
</div>

<style>
  .settings-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .page-title {
    font-size: 1.5rem;
    color: #2d5a27;
    margin: 0 0 1.5rem;
  }

  .section {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .section-title {
    font-size: 1rem;
    color: #333;
    margin: 0 0 0.25rem;
  }

  .section-desc {
    font-size: 0.875rem;
    color: #666;
    margin: 0 0 1rem;
  }

  .interval-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .interval-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .interval-item label {
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .interval-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .interval-input-wrapper input {
    width: 70px;
    padding: 0.5rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    text-align: center;
  }

  .interval-input-wrapper input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .interval-unit {
    font-size: 0.875rem;
    color: #666;
  }

  .language-options {
    display: flex;
    gap: 0.75rem;
  }

  .language-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
  }

  .language-option:hover {
    background: #e9ecef;
    border-color: #2d5a27;
  }

  .language-option.active {
    background: #e8f5e9;
    border-color: #2d5a27;
    color: #2d5a27;
  }

  .language-option .flag {
    font-size: 2rem;
  }

  .data-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .action-card.danger {
    background: #fff5f5;
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .action-info {
    flex: 1;
  }

  .action-info h4 {
    font-size: 0.9375rem;
    margin: 0 0 0.25rem;
    color: #333;
  }

  .action-info p {
    font-size: 0.75rem;
    color: #666;
    margin: 0;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 0.2s;
    white-space: nowrap;
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

  .btn-secondary:hover:not(:disabled) {
    background: #dee2e6;
  }

  .btn-danger {
    background: #e74c3c;
    color: white;
  }

  .btn-danger:hover {
    background: #c0392b;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hidden-file-input {
    display: none;
  }

  .about-info {
    font-size: 0.875rem;
    color: #666;
  }

  .about-info p {
    margin: 0 0 0.5rem;
  }

  .about-note {
    background: #e8f5e9;
    padding: 0.75rem;
    border-radius: 8px;
    color: #2d5a27;
    margin-top: 1rem !important;
  }
</style>
