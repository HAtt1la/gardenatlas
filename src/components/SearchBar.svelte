<script>
  import { searchQuery, searchResults, navigateToPlant } from '../lib/stores.js';
  import { t } from '../lib/i18n.js';

  let isExpanded = false;
  let inputRef;

  function handleFocus() {
    isExpanded = true;
  }

  function handleBlur() {
    setTimeout(() => {
      isExpanded = false;
    }, 200);
  }

  function handleSelect(plant) {
    navigateToPlant(plant.id);
    $searchQuery = '';
    isExpanded = false;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      $searchQuery = '';
      isExpanded = false;
      inputRef?.blur();
    }
  }
</script>

<div class="search-container" class:expanded={isExpanded}>
  <div class="search-input-wrapper">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      bind:value={$searchQuery}
      bind:this={inputRef}
      placeholder={$t('searchPlaceholder')}
      on:focus={handleFocus}
      on:blur={handleBlur}
      on:keydown={handleKeydown}
      class="search-input"
    />
    {#if $searchQuery}
      <button class="clear-btn" on:click={() => $searchQuery = ''}>×</button>
    {/if}
  </div>

  {#if isExpanded && $searchQuery && $searchResults.length > 0}
    <ul class="search-results">
      {#each $searchResults as plant}
        <li>
          <button class="result-item" on:click={() => handleSelect(plant)}>
            <span class="result-id">#{plant.id}</span>
            <span class="result-name">{plant.name}</span>
            <span class="result-type">{plant.type}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else if isExpanded && $searchQuery && $searchResults.length === 0}
    <div class="no-results">No plants found</div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 0 0.5rem;
    transition: background 0.2s, width 0.2s;
    width: 150px;
  }

  .search-container.expanded .search-input-wrapper {
    background: rgba(255,255,255,0.95);
    width: 200px;
  }

  .search-icon {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .search-input {
    border: none;
    background: transparent;
    padding: 0.5rem;
    font-size: 0.875rem;
    color: white;
    width: 100%;
    outline: none;
  }

  .search-input::placeholder {
    color: rgba(255,255,255,0.7);
  }

  .search-container.expanded .search-input {
    color: #333;
  }

  .search-container.expanded .search-input::placeholder {
    color: #999;
  }

  .clear-btn {
    background: none;
    border: none;
    color: #666;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    margin-top: 0.5rem;
    list-style: none;
    padding: 0.5rem 0;
    z-index: 200;
    max-height: 300px;
    overflow-y: auto;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .result-item:hover {
    background: #f0f0f0;
  }

  .result-id {
    font-weight: 600;
    color: #2d5a27;
    min-width: 40px;
  }

  .result-name {
    flex: 1;
    color: #333;
  }

  .result-type {
    font-size: 0.75rem;
    color: #999;
    text-transform: capitalize;
  }

  .no-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    margin-top: 0.5rem;
    padding: 1rem;
    text-align: center;
    color: #666;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    .search-input-wrapper {
      width: 120px;
    }
    
    .search-container.expanded .search-input-wrapper {
      width: 160px;
    }
  }
</style>
