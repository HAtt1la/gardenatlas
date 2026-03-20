<script>
  export let section;
  export let descriptor;
  export let plants;
  export let secY;
  export let gardenWidth;
  export let onPlantClick;
  export let onPlaceholderClick;
  export let getStatusColor;
  export let colorToTint;
  export let tLabel;

  $: cols = section.cols ?? 1;
  $: step = (gardenWidth - 8) / cols;
  $: x0 = 4 + step / 2;
</script>

{#each plants as plant, i}
  {@const col = i % cols}
  {@const row = Math.floor(i / cols)}
  {@const cx = x0 + col * step}
  {@const ty = secY + 28 + row * (descriptor.cardH + descriptor.rowGap)}
  {#if plant.type === 'placeholder'}
    <g class="plant-marker placeholder-marker"
      on:click={(e) => onPlaceholderClick(plant, e)}
      on:keydown={(e) => e.key === 'Enter' && onPlaceholderClick(plant, e)}
      role="button" tabindex="0">
      <rect x={cx - descriptor.cardW/2} y={ty} width={descriptor.cardW} height={descriptor.cardH} rx="7" fill="rgba(200,200,200,0.15)" stroke="#bbb" stroke-width="1" stroke-dasharray="4,3" />
      <text x={cx} y={ty + descriptor.cardH * 0.55} class="placeholder-label">{tLabel('placeholderLabel')}</text>
    </g>
  {:else}
    {@const sc = getStatusColor(plant.id)}
    {@const bg = colorToTint(plant.color)}
    <g class="plant-marker"
      on:click={(e) => onPlantClick(plant, e)}
      on:keydown={(e) => e.key === 'Enter' && onPlantClick(plant, e)}
      role="button" tabindex="0">
      <rect x={cx - descriptor.cardW/2} y={ty} width={descriptor.cardW} height={descriptor.cardH} rx="7" fill={bg} stroke="#ccc" stroke-width="0.5" class="card-bg" />
      <rect x={cx + descriptor.cardW/2 - 12} y={ty + 3} width="10" height="10" rx="3" fill={sc} class="status-dot" />
      <text x={cx} y={ty + descriptor.cardH * 0.45} class="card-emoji">{plant.emoji || descriptor.icon}</text>
      <text x={cx} y={ty + descriptor.cardH - 8} class="card-label"
        textLength={plant.name.length > 6 ? descriptor.cardW - 6 : null}
        lengthAdjust="spacingAndGlyphs">{plant.name}</text>
    </g>
  {/if}
{/each}

<style>
  .plant-marker { cursor: pointer; }
  .plant-marker:hover .card-bg { filter: brightness(0.93); }
  .plant-marker:focus { outline: none; }
  .plant-marker:focus .card-bg { stroke: #2d5a27; stroke-width: 2; }
  .placeholder-marker { cursor: pointer; opacity: 0.7; }
  .placeholder-marker:hover { opacity: 1; }
  .placeholder-label { font-size: 20px; text-anchor: middle; dominant-baseline: middle; fill: #aaa; font-weight: 700; pointer-events: none; }
  .card-emoji { font-size: 26px; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
  .card-label { font-size: 10px; text-anchor: middle; dominant-baseline: auto; fill: #111; font-weight: 700; pointer-events: none; }
</style>
