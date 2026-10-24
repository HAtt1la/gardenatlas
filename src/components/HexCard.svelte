<script>
  import { HEX_SIZE, HEX_W, HEX_H, hexPath, colorToTint } from '../lib/hex.js';

  export let plant;            // plant record { name, color }
  export let thumb = null;     // object URL for main photo (optional)
  export let status = '#95a5a6'; // status dot color
  export let dragging = false; // elevated ghost style while dragging
</script>

{#if thumb}
  <clipPath id="hexclip-{plant.id}-{dragging ? 'g' : 's'}">
    <path d={hexPath(HEX_SIZE - 1.5)} />
  </clipPath>
  <image
    href={thumb}
    x={-HEX_W / 2}
    y={-HEX_SIZE}
    width={HEX_W}
    height={HEX_H}
    preserveAspectRatio="xMidYMid slice"
    clip-path="url(#hexclip-{plant.id}-{dragging ? 'g' : 's'})"
  />
  <path d={hexPath(HEX_SIZE)} fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.75" />
{:else}
  <path d={hexPath(HEX_SIZE)} fill={colorToTint(plant.color)} stroke="#8ba38b" stroke-width="1" />
{/if}


<!-- Name: white halo keeps it readable over photos; sits in the widest band -->
<text
  x="0"
  y="11"
  class="hex-label"
  textLength={plant.name && plant.name.length > 8 ? HEX_W - 6 : null}
  lengthAdjust="spacingAndGlyphs">{plant.name}</text>

<!-- Status dot: top point of the hex -->
<circle cx="0" cy={-HEX_SIZE + 7} r="4" fill={status} stroke="white" stroke-width="0.75" />

<style>
  .hex-label {
    font-size: 10.5px;
    text-anchor: middle;
    fill: #111;
    font-weight: 700;
    pointer-events: none;
    paint-order: stroke;
    stroke: rgba(255, 255, 255, 0.9);
    stroke-width: 2.5px;
    stroke-linejoin: round;
  }
</style>
