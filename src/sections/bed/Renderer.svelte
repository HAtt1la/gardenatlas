<script>
  export let descriptor;
  export let plants;
  export let secY;
  export let gardenWidth;
  export let bedPlants;
  export let onPlantClick;
  export let getStatusColor;
</script>

{#each plants as bed, i}
  {@const plantsInBed = bedPlants[bed.id] || []}
  {@const bedW = (gardenWidth - 16) / 3}
  {@const bx = 4 + i * (bedW + 4)}
  {@const sc = getStatusColor(bed.id)}
  <g class="plant-marker"
    on:click={(e) => onPlantClick(bed, e)}
    on:keydown={(e) => e.key === 'Enter' && onPlantClick(bed, e)}
    role="button" tabindex="0">
    <rect x={bx} y={secY + 28} width={bedW} height={descriptor.cardH} rx="6" fill="rgba(93,78,55,0.15)" stroke="#8b6f47" stroke-width="1" class="card-bg" />
    <rect x={bx + bedW - 13} y={secY + 28 + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
    <text x={bx + bedW/2 + 2} y={secY + 28 + 14} class="bed-title">{bed.name}</text>
    {#if plantsInBed.length > 0}
      {#each plantsInBed as plant, idx}
        {@const ex = bx + 14 + (idx % 3) * ((bedW - 14) / 3) + (bedW - 14) / 6}
        {@const ey = secY + 28 + 30 + Math.floor(idx / 3) * 20}
        <text x={ex} y={ey} class="bed-emoji">{plant.emoji || '🌱'}</text>
      {/each}
    {:else}
      <text x={bx + bedW/2 + 2} y={secY + 28 + 38} class="bed-empty">empty</text>
    {/if}
  </g>
{/each}

<style>
  .plant-marker { cursor: pointer; }
  .plant-marker:hover .card-bg { filter: brightness(0.93); }
  .plant-marker:focus { outline: none; }
  .plant-marker:focus .card-bg { stroke: #2d5a27; stroke-width: 2; }
  .bed-title { font-size: 11px; text-anchor: middle; dominant-baseline: auto; fill: #3b2a10; font-weight: 700; pointer-events: none; }
  .bed-emoji { font-size: 16px; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
  .bed-empty { font-size: 10px; fill: #aaa; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
</style>
