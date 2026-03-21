<script>
  import { onMount } from 'svelte';
  import GardenMap from './components/GardenMap.svelte';
  import PlantDetail from './components/PlantDetail.svelte';
  import Settings from './components/Settings.svelte';
  import CareProfiles from './components/CareProfiles.svelte';
  import MultiEventForm from './components/MultiEventForm.svelte';
  import TodoList from './components/TodoList.svelte';
  import SearchBar from './components/SearchBar.svelte';
  import Toast from './components/Toast.svelte';
  import BackupBanner from './components/BackupBanner.svelte';
  import UpdateBanner from './components/UpdateBanner.svelte';
  import { currentView, loadPlants, navigateToMap, navigateToSettings, navigateToCareProfiles, navigateToMultiEvent, toasts, activeEventTab } from './lib/stores.js';
  import { initializeSampleData } from './lib/sampleData.js';
  import { migratePlantSectionIds, shouldShowBackupPrompt, seedCareProfiles } from './lib/db.js';
  import { t } from './lib/i18n.js';

  let showBackupBanner = false;
  let showUpdateBanner = false;
  let waitingSW = null;

  onMount(async () => {
    await initializeSampleData();
    await loadPlants();
    const migrated = await migratePlantSectionIds();
    if (migrated) await loadPlants();
    await seedCareProfiles();
    showBackupBanner = await shouldShowBackupPrompt();

    // Detect waiting service worker
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const checkWaiting = (r) => {
          if (r.waiting) {
            waitingSW = r.waiting;
            showUpdateBanner = true;
          }
        };
        checkWaiting(reg);
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW?.addEventListener('statechange', () => {
            if (newSW.state === 'installed') checkWaiting(reg);
          });
        });
      }
    }
  });

  function handleUpdate() {
    if (!waitingSW) return;
    waitingSW.postMessage('SKIP_WAITING');
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    }, { once: true });
  }

  function handleUpdateDismiss() {
    showUpdateBanner = false;
  }
</script>

<div class="app">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      {#if $currentView !== 'map'}
        <button class="btn-icon" on:click={navigateToMap} aria-label={$t('backToMap')}>
          ←
        </button>
      {/if}
      <h1 class="logo">🌱 {$t('appName')}</h1>
    </div>
    
    <div class="header-right">
      {#if $currentView === 'map'}
        <button class="btn-icon" on:click={navigateToMultiEvent} aria-label="Add event to multiple plants" title="Add event to multiple plants">
          📋
        </button>
        <SearchBar />
      {/if}
      <button class="btn-icon" on:click={navigateToSettings} aria-label={$t('settings')}>
        ⚙️
      </button>
    </div>
  </header>

  <!-- Update Banner -->
  {#if showUpdateBanner}
    <UpdateBanner onUpdate={handleUpdate} onDismiss={handleUpdateDismiss} />
  {/if}

  <!-- Backup Banner -->
  {#if showBackupBanner}
    <BackupBanner onDismiss={() => showBackupBanner = false} />
  {/if}

  <!-- Main Content -->
  <main class="main">
    {#if $currentView === 'map'}
      <GardenMap />
    {:else if $currentView === 'detail'}
      <PlantDetail />
    {:else if $currentView === 'settings'}
      <Settings onCareProfiles={navigateToCareProfiles} />
    {:else if $currentView === 'careProfiles'}
      <CareProfiles />
    {:else if $currentView === 'eventPanel'}
      <div class="tab-panel">
        <div class="tab-bar">
          <button
            class="tab-btn {$activeEventTab === 'events' ? 'active' : ''}"
            on:click={() => activeEventTab.set('events')}
          >📋 {$t('eventTab')}</button>
          <button
            class="tab-btn {$activeEventTab === 'todos' ? 'active' : ''}"
            on:click={() => activeEventTab.set('todos')}
          >✅ {$t('todoTab')}</button>
        </div>
        {#if $activeEventTab === 'events'}
          <MultiEventForm />
        {:else}
          <TodoList />
        {/if}
      </div>
    {/if}
  </main>

  <!-- Toast Notifications -->
  {#each $toasts as toast (toast.id)}
    <Toast message={toast.message} type={toast.type} />
  {/each}
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
    color: white;
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .btn-icon {
    background: rgba(255,255,255,0.15);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .btn-icon:hover {
    background: rgba(255,255,255,0.25);
  }

  .main {
    flex: 1;
    overflow-y: auto;
  }

  .tab-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tab-bar {
    display: flex;
    background: white;
    border-bottom: 2px solid #e9ecef;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .tab-btn {
    flex: 1;
    padding: 0.875rem 0.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #888;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -2px;
  }

  .tab-btn.active {
    color: #2d5a27;
    border-bottom-color: #2d5a27;
  }

  .tab-btn:hover:not(.active) {
    color: #555;
    background: #f8f9fa;
  }

  @media (max-width: 480px) {
    .logo {
      font-size: 1rem;
    }
  }
</style>
