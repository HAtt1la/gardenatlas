<script>
  import { onMount } from 'svelte';
  import GardenMap from './components/GardenMap.svelte';
  import PlantDetail from './components/PlantDetail.svelte';
  import BedDetail from './components/BedDetail.svelte';
  import Settings from './components/Settings.svelte';
  import AddPlantForm from './components/AddPlantForm.svelte';
  import SearchBar from './components/SearchBar.svelte';
  import Toast from './components/Toast.svelte';
  import { currentView, loadPlants, navigateToMap, navigateToSettings, toasts, selectedPlant } from './lib/stores.js';
  import { initializeSampleData } from './lib/sampleData.js';
  import { t } from './lib/i18n.js';

  onMount(async () => {
    await initializeSampleData();
    await loadPlants();
  });

  // Determine if current plant is a bed
  $: isBedView = $currentView === 'detail' && $selectedPlant?.type === 'bed';
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
        <SearchBar />
      {/if}
      <button class="btn-icon" on:click={navigateToSettings} aria-label={$t('settings')}>
        ⚙️
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main">
    {#if $currentView === 'map'}
      <GardenMap />
    {:else if $currentView === 'detail'}
      {#if isBedView}
        <BedDetail />
      {:else}
        <PlantDetail />
      {/if}
    {:else if $currentView === 'settings'}
      <Settings />
    {:else if $currentView === 'addPlant'}
      <AddPlantForm />
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

  @media (max-width: 480px) {
    .logo {
      font-size: 1rem;
    }
  }
</style>
