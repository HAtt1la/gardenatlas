<script>
  import { onMount, onDestroy } from 'svelte';
  import { plants, navigateToPlant, loadPlants, showToast } from '../lib/stores.js';
  import { getSections, saveSections, getMainPhotosForPlants, movePlantToHex } from '../lib/db.js';
  import { t } from '../lib/i18n.js';
  import { getAllPlantHealthStatuses, HEALTH_COLORS } from '../lib/health.js';
  import {
    axialToPixel, pixelToAxial, hexPath, HEX_SIZE, HEX_W, HEX_H, findFreeHex
  } from '../lib/hex.js';
  import HexCard from './HexCard.svelte';
  import SectionSheet from './SectionSheet.svelte';
  import AddPlantInline from './AddPlantInline.svelte';

  const GARDEN_WIDTH = 360;
  const SECTION_HEADER_H = 28;
  const SECTION_GAP = 18;
  const DRAG_THRESHOLD = 5;            // px until a press counts as a drag
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;

  let plantStatuses = {};
  let plantThumbs = {};
  let sections = [];
  let sheetSection = null;
  let editMode = false;
  let svgEl = null;                    // <svg> element

  // ── zoom & pan: the viewBox is the visible window into the garden ─────
  // World (svg-user) coordinates never change; zoom shrinks the window and
  // (vx, vy) position it. Element height auto follows the aspect ratio, so
  // getScreenCTM() maps pointer events straight to world coordinates and
  // all drag/hit-test math works unchanged at any zoom level.
  let view = { zoom: 1, vx: 0, vy: 0 };

  // drag state: plant is being moved
  let dragging = null;                 // { plant, svg, pointerId, startClient, moved }
  let hoverHex = null;                 // { x, y, q, r, free } — snap target (section-group coords)
  // "add plant" flow: clicked an empty hex
  let addingAt = null;                 // { sectionId, q, r }
  let suppressClickUntil = 0;          // timestamp — ignore the click right after a drag/pan/pinch
  let lastTap = { t: 0, x: 0, y: 0 };  // double-tap guard so zooming never opens "add plant"

  // pointer-tracking for pinch / pan
  const pointers = new Map();          // pointerId → { x, y } (client coords)
  let panInfo = null;                  // { id, startX, startY, vx0, vy0, moved }
  let pinch = null;                    // { d0, z0, wx, wy, rect }

  // Edge auto-scroll: while a plant is being dragged past the top or bottom
  // viewport edge, the page keeps scrolling so far sections stay reachable.
  let lastPointerClient = null;        // finger position during an active drag
  let dragScrollRaf = 0;               // auto-scroll animation frame handle
  const AUTO_SCROLL_BAND = 56;         // px margin at viewport top/bottom
  const AUTO_SCROLL_SPEED = 18;        // max px scrolled per frame

  $: safePlants = $plants ?? [];

  $: sectionPlantsMap = (() => {
    const map = {};
    for (const sec of sections) {
      map[sec.instanceId] = safePlants.filter(p => p.sectionId === sec.instanceId && p.type !== 'placeholder');
    }
    return map;
  })();

  // Per-section layout: cluster bounds in hex space + render transform.
  // Plants are drawn inside <g transform="translate(offset)">, so hit-testing
  // subtracts the offset — no per-section scale: hexes are always full size
  // and wide clusters simply extend past the initial viewport (pan/zoom).
  $: sectionLayouts = (() => {
    const layouts = [];
    let y = 8;
    for (const sec of sections) {
      const ps = sectionPlantsMap[sec.instanceId] ?? [];
      const pts = ps.map(p => ({ plant: p, ...axialToPixel(p.q ?? 0, p.r ?? 0) }));

      let minX = -HEX_W / 2, maxX = HEX_W / 2, minY = -HEX_H / 2, maxY = HEX_H / 2;
      if (pts.length) {
        minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity;
        for (const pt of pts) {
          minX = Math.min(minX, pt.x - HEX_W / 2);
          maxX = Math.max(maxX, pt.x + HEX_W / 2);
          minY = Math.min(minY, pt.y - HEX_H / 2);
          maxY = Math.max(maxY, pt.y + HEX_H / 2);
        }
      }
      const contentW = Math.max(80, maxX - minX);
      const contentH = Math.max(70, maxY - minY);
      const offsetX = (GARDEN_WIDTH - contentW) / 2 - minX;
      const offsetY = y + SECTION_HEADER_H - minY;
      const height = SECTION_HEADER_H + contentH;

      layouts.push({
        section: sec, y, height, offsetX, offsetY, plants: pts,
        bgX: Math.min(0, offsetX + minX),        // section background extent
        bgR: Math.max(GARDEN_WIDTH, offsetX + maxX)
      });
      y += height + SECTION_GAP;
    }
    return layouts;
  })();

  // Overall horizontal extent of the garden (may exceed the viewport width)
  $: extX = (() => {
    let min = 0, max = GARDEN_WIDTH;
    for (const l of sectionLayouts) {
      min = Math.min(min, l.bgX);
      max = Math.max(max, l.bgR);
    }
    return { min, max };
  })();

  $: totalHeight = sectionLayouts.length
    ? sectionLayouts[sectionLayouts.length - 1].y + sectionLayouts[sectionLayouts.length - 1].height + 20
    : 220;

  // Window size in world units for the current zoom
  $: vw = GARDEN_WIDTH / view.zoom;
  $: vh = totalHeight / view.zoom;

  onMount(() => {
    const onWheel = (e) => handleWheel(e);
    // non-passive so we can preventDefault and take over ctrl+wheel zoom
    svgEl?.addEventListener('wheel', onWheel, { passive: false });
    // keep the snap preview under the finger when the page scrolls during a drag
    const onScroll = () => {
      if (dragging?.moved && lastPointerClient) updateHoverHex(lastPointerClient);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      svgEl?.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      stopDragAutoScroll();
    };
  });

  onMount(async () => {
    sections = await getSections();
  });

  $: if ($plants) {
    getAllPlantHealthStatuses(safePlants).then(s => { plantStatuses = s; });
    loadThumbnails();
  }

  async function loadThumbnails() {
    const ids = safePlants.filter(p => p.type !== 'placeholder').map(p => p.id);
    const photos = await getMainPhotosForPlants(ids);
    const newThumbs = {};
    for (const [plantId, photo] of Object.entries(photos)) {
      if (photo?.data) newThumbs[plantId] = URL.createObjectURL(photo.data);
    }
    // swap after building new URLs so revoked ones are never in use
    const old = plantThumbs;
    plantThumbs = newThumbs;
    for (const url of Object.values(old)) URL.revokeObjectURL(url);
  }

  onDestroy(() => {
    for (const url of Object.values(plantThumbs)) URL.revokeObjectURL(url);
  });

  // ── coordinate helpers ─────────────────────────────────────────────────
  /** Convert a browser pointer event to SVG-world coords (viewBox-aware). */
  function eventToSvg(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
  }

  /** Clamp a desired window x so content stays reachable. */
  function clampVx(v, vwNow) {
    const span = extX.max - extX.min;
    if (vwNow >= span) return (extX.min + extX.max - vwNow) / 2;
    return Math.min(Math.max(v, extX.min - 12), extX.max - vwNow + 12);
  }

  /** Clamp a desired window y so content stays reachable. */
  function clampVy(v, vhNow) {
    if (vhNow >= totalHeight) return (totalHeight - vhNow) / 2;
    return Math.min(Math.max(v, 0), totalHeight - vhNow);
  }

  /** Zoom keeping the world point `sp` at its current screen position. */
  function setZoomAt(sp, zNew) {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zNew));
    if (z === view.zoom) return;
    const vwNow = GARDEN_WIDTH / z;
    const vhNow = totalHeight / z;
    view = {
      zoom: z,
      vx: clampVx(sp.x - (sp.x - view.vx) * view.zoom / z, vwNow),
      vy: clampVy(sp.y - (sp.y - view.vy) * view.zoom / z, vhNow)
    };
  }

  function zoomBy(factor) {
    const cx = view.vx + vw / 2;
    const cy = view.vy + vh / 2;
    setZoomAt({ x: cx, y: cy }, view.zoom * factor);
  }

  function resetView() {
    view = { zoom: 1, vx: 0, vy: 0 };
  }

  function handleWheel(event) {
    // plain wheel = page scroll, unless a modifier is held or already zoomed
    if (!(event.ctrlKey || event.metaKey || event.altKey) && view.zoom <= 1) return;
    event.preventDefault();
    const sp = eventToSvg(svgEl, event.clientX, event.clientY);
    setZoomAt(sp, view.zoom * Math.exp(-event.deltaY * 0.0022));
  }

  function handleDblClick(event) {
    const sp = eventToSvg(svgEl, event.clientX, event.clientY);
    setZoomAt(sp, view.zoom > 1.01 ? 1 : 2.4);
    suppressClickUntil = Date.now() + 350;
  }

  // ── find the section + hex under an SVG point ─────────────────────────
  function svgPointToHex(sp) {
    const layout = sectionLayouts.find(l => sp.y >= l.y && sp.y <= l.y + l.height);
    if (!layout) return null;
    const hx = sp.x - layout.offsetX;
    const hy = sp.y - layout.offsetY;
    const { q, r } = pixelToAxial(hx, hy);
    return { layout, q, r };
  }

  function isOccupied(sectionId, q, r, excludePlantId = null) {
    return (sectionPlantsMap[sectionId] ?? [])
      .some(p => p.id !== excludePlantId && (p.q ?? 0) === q && (p.r ?? 0) === r);
  }

  // ── drag & drop (pointer events: mouse + touch) ───────────────────────
  function handleCardPointerDown(plant, event) {
    if (!editMode) return;
    event.preventDefault();
    event.stopPropagation();             // keep the map pan/pinch out of it
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    try { svg.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    dragging = {
      plant, svg, moved: false,
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY }
    };
  }

  function handleSvgPointerDown(event) {
    if (dragging) return;                // a plant drag owns all gestures
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try { svgEl.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    if (pointers.size >= 2) {
      if (!pinch) startPinch();
    } else {
      panInfo = {
        id: event.pointerId,
        startX: event.clientX, startY: event.clientY,
        vx0: view.vx, vy0: view.vy,
        moved: false
      };
    }
  }

  function startPinch() {
    const ps = [...pointers.values()];
    const rect = svgEl.getBoundingClientRect();
    const midX = (ps[0].x + ps[1].x) / 2;
    const midY = (ps[0].y + ps[1].y) / 2;
    const sp = eventToSvg(svgEl, midX, midY);   // world point under the fingers
    pinch = {
      d0: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) || 1,
      z0: view.zoom,
      wx: sp.x, wy: sp.y,
      rect
    };
    panInfo = null;
  }

  function updatePinch() {
    const ps = [...pointers.values()];
    if (ps.length < 2) return;
    const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.z0 * d / pinch.d0));
    const vwNow = GARDEN_WIDTH / z;
    const vhNow = totalHeight / z;
    const relX = (ps[0].x + ps[1].x) / 2 - pinch.rect.left;
    const relY = (ps[0].y + ps[1].y) / 2 - pinch.rect.top;
    view = {
      zoom: z,
      vx: clampVx(pinch.wx - relX * (vwNow / pinch.rect.width), vwNow),
      vy: clampVy(pinch.wy - relY * (vhNow / pinch.rect.height), vhNow)
    };
  }

  function updatePan(event) {
    const rect = svgEl.getBoundingClientRect();
    const vwNow = GARDEN_WIDTH / view.zoom;
    const vhNow = totalHeight / view.zoom;
    const du = (event.clientX - panInfo.startX) * (vwNow / rect.width);
    const dv = (event.clientY - panInfo.startY) * (vhNow / rect.height);
    // vertical map panning only when the page isn't scrolling instead
    const canPanY = editMode || view.zoom > 1;
    view = {
      zoom: view.zoom,
      vx: clampVx(panInfo.vx0 - du, vwNow),
      vy: clampVy(canPanY ? panInfo.vy0 - dv : panInfo.vy0, vhNow)
    };
    if (Math.abs(du) > 2 || (canPanY && Math.abs(dv) > 2)) panInfo.moved = true;
  }

  /** Re-evaluate the snap target for the given finger position (world → hex). */
  function updateHoverHex(client) {
    const hit = svgPointToHex(eventToSvg(dragging.svg, client.x, client.y));
    if (!hit) {
      hoverHex = null;
      return;
    }
    const free = !isOccupied(hit.layout.section.instanceId, hit.q, hit.r, dragging.plant.id);
    hoverHex = { ...axialToPixel(hit.q, hit.r), q: hit.q, r: hit.r, free, layout: hit.layout };
  }

  function dragAutoScrollFrame() {
    if (!dragging || !dragging.moved || !lastPointerClient) {
      dragScrollRaf = 0;
      return;
    }
    const y = lastPointerClient.y;
    const h = window.innerHeight;
    let dy = 0;
    if (y < AUTO_SCROLL_BAND) {
      dy = -Math.round(AUTO_SCROLL_SPEED * (1 - y / AUTO_SCROLL_BAND));
    } else if (h - y < AUTO_SCROLL_BAND) {
      dy = Math.round(AUTO_SCROLL_SPEED * (1 - (h - y) / AUTO_SCROLL_BAND));
    }
    if (dy !== 0) window.scrollBy(0, dy);
    dragScrollRaf = requestAnimationFrame(dragAutoScrollFrame);
  }

  function ensureDragAutoScroll() {
    if (!dragScrollRaf) dragScrollRaf = requestAnimationFrame(dragAutoScrollFrame);
  }

  function stopDragAutoScroll() {
    if (dragScrollRaf) {
      cancelAnimationFrame(dragScrollRaf);
      dragScrollRaf = 0;
    }
    lastPointerClient = null;
  }

  function handleSvgPointerMove(event) {
    const entry = pointers.get(event.pointerId);
    if (entry) {
      entry.x = event.clientX;
      entry.y = event.clientY;
    }

    if (dragging) {
      const start = dragging.startClient;
      if (!dragging.moved &&
          Math.abs(event.clientX - start.x) <= DRAG_THRESHOLD &&
          Math.abs(event.clientY - start.y) <= DRAG_THRESHOLD) return;
      dragging.moved = true;
      lastPointerClient = { x: event.clientX, y: event.clientY };

      updateHoverHex(event);
      ensureDragAutoScroll();
      return;
    }

    if (!entry) return;

    if (pointers.size >= 2) {
      if (pinch) updatePinch();
      else startPinch();
    } else if (panInfo && panInfo.id === event.pointerId) {
      updatePan(event);
    }
  }

  async function handleSvgPointerUp(event) {
    pointers.delete(event.pointerId);

    if (pinch && pointers.size < 2) {
      pinch = null;
      suppressClickUntil = Date.now() + 350;
    }
    if (panInfo && panInfo.id === event.pointerId) {
      if (panInfo.moved) suppressClickUntil = Date.now() + 350;
      panInfo = null;
    }

    if (!dragging) return;
    if (event.pointerId !== dragging.pointerId) return; // a stray finger lifted
    const { plant, moved } = dragging;
    dragging = null;
    stopDragAutoScroll();

    if (!moved) return; // simple press — nothing to do
    // ignore the synthetic click that follows the pointerup
    suppressClickUntil = Date.now() + 350;

    const hit = svgPointToHex(eventToSvg(svgEl, event.clientX, event.clientY));
    hoverHex = null;

    const sectionId = hit
      ? hit.layout.section.instanceId
      : plant.sectionId;
    let q = hit ? hit.q : (plant.q ?? 0);
    let r = hit ? hit.r : (plant.r ?? 0);

    // if the target is taken, park the plant on the nearest free hex
    if (isOccupied(sectionId, q, r, plant.id)) {
      const occupied = new Set(
        (sectionPlantsMap[sectionId] ?? [])
          .filter(p => p.id !== plant.id)
          .map(p => `${p.q ?? 0},${p.r ?? 0}`)
      );
      const free = findFreeHex(occupied, q, r);
      if (!free) return;
      q = free.q;
      r = free.r;
    }

    // skip no-op moves
    if (sectionId === plant.sectionId && q === (plant.q ?? 0) && r === (plant.r ?? 0)) return;

    await movePlantToHex(plant.id, sectionId, q, r);
    await loadPlants();
  }

  function handleSvgPointerCancel(event) {
    pointers.delete(event.pointerId);
    if (pinch && pointers.size < 2) pinch = null;
    if (panInfo && panInfo.id === event.pointerId) panInfo = null;
    if (dragging && event.pointerId === dragging.pointerId) {
      dragging = null;
      stopDragAutoScroll();
      hoverHex = null;
    }
  }

  // ── add plant on empty hex ─────────────────────────────────────────────
  async function handleSvgClick(event) {
    if (!editMode || Date.now() < suppressClickUntil) return;
    const now = Date.now();
    if (now - lastTap.t < 350 &&
        Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30) {
      // double-tap: the dblclick handler zooms, don't open "add plant"
      lastTap = { t: 0, x: 0, y: 0 };
      return;
    }
    lastTap = { t: now, x: event.clientX, y: event.clientY };

    const hit = svgPointToHex(eventToSvg(event.currentTarget, event.clientX, event.clientY));
    if (!hit) return;
    if (isOccupied(hit.layout.section.instanceId, hit.q, hit.r)) return;
    addingAt = { sectionId: hit.layout.section.instanceId, q: hit.q, r: hit.r };
  }

  function handleKeydown(event) {
    if (event.key !== 'Escape') return;
    if (addingAt) { addingAt = null; return; }
    if (sheetSection) { sheetSection = null; return; }
    if (dragging) { dragging = null; stopDragAutoScroll(); hoverHex = null; return; }
    if (view.zoom !== 1) { resetView(); return; }
    if (editMode) editMode = false;
  }

  // ── section sheet ─────────────────────────────────────────────────────
  async function handleSheetSave(updated) {
    sections = sections.map(s => s.instanceId === updated.instanceId ? updated : s);
    await saveSections(sections);
    showToast($t('sectionSaved'), 'success');
    sheetSection = null;
  }

  function toggleEditMode() {
    editMode = !editMode;
    dragging = null;
    stopDragAutoScroll();
    hoverHex = null;
  }
</script>

<div class="map-container">
  {#if sheetSection}
    <SectionSheet
      section={sheetSection}
      onClose={() => sheetSection = null}
      onSave={handleSheetSave}
    />
  {/if}

  {#if addingAt}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="convert-overlay"
      role="presentation"
      aria-hidden="true"
      on:click={() => addingAt = null}
      on:keydown={(e) => e.key === 'Escape' && (addingAt = null)}>
      <div class="convert-modal"
        role="dialog"
        tabindex="-1"
        on:click|stopPropagation
        on:keydown|stopPropagation>
        <AddPlantInline
          sectionId={addingAt.sectionId}
          q={addingAt.q}
          r={addingAt.r}
          onSuccess={() => addingAt = null}
        />
      </div>
    </div>
  {/if}

  <div class="edit-controls">
    <button class="edit-btn {editMode ? 'active' : ''}" on:click={toggleEditMode}>
      {editMode ? '✓ ' + $t('done') : '✏️ ' + $t('arrange')}
    </button>
    {#if editMode}
      <span class="edit-hint">{$t('arrangeHint')}</span>
    {/if}
  </div>

  <div class="map-wrap">
    <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
    <svg
      bind:this={svgEl}
      viewBox="{view.vx.toFixed(2)} {view.vy.toFixed(2)} {vw.toFixed(2)} {vh.toFixed(2)}"
      class="garden-svg {editMode ? 'editing' : ''} {view.zoom > 1 ? 'zoomed' : ''}"
      role="img"
      aria-label={$t('appName')}
      on:click={handleSvgClick}
      on:dblclick={handleDblClick}
      on:pointerdown={handleSvgPointerDown}
      on:pointermove={handleSvgPointerMove}
      on:pointerup={handleSvgPointerUp}
      on:pointercancel={handleSvgPointerCancel}
      on:keydown={handleKeydown}
    >
      {#each sectionLayouts as layout, idx (layout.section.instanceId)}
        {@const sec = layout.section}
        {@const secY = layout.y}

        {#if idx > 0}
          <line x1={extX.min} y1={secY - SECTION_GAP / 2} x2={extX.max} y2={secY - SECTION_GAP / 2}
            stroke="#b2d8b2" stroke-width="1.5" stroke-dasharray="5,4" />
        {/if}

        <!-- Section background -->
        <rect x={layout.bgX} y={secY} width={layout.bgR - layout.bgX} height={layout.height}
          fill={sec.color ?? '#a8d5a2'} opacity="0.12" rx="8" />

        <!-- Section label - tap to edit -->
        <g class="section-label-btn"
          on:click={() => sheetSection = sec}
          on:keydown={(e) => e.key === 'Enter' && (sheetSection = sec)}
          role="button" tabindex="0">
          <rect x="4" y={secY + 2} width={GARDEN_WIDTH - 8} height={SECTION_HEADER_H - 4} rx="4" fill="transparent" />
          <text x="10" y={secY + 17} class="section-label">{sec.name}</text>
        </g>

        <!-- Plant cluster -->
        <g transform="translate({layout.offsetX},{layout.offsetY})">
          {#if editMode && hoverHex && hoverHex.layout === layout}
            <!-- snap highlight under the cards -->
            <path
              d={hexPath(HEX_SIZE)}
              transform="translate({hoverHex.x},{hoverHex.y})"
              fill={hoverHex.free ? 'rgba(45,90,39,0.25)' : 'rgba(231,76,60,0.35)'}
              stroke={hoverHex.free ? '#2d5a27' : '#e74c3c'}
              stroke-width="2" />
          {/if}

          {#each layout.plants as pt (pt.plant.id)}
            {@const status = HEALTH_COLORS[plantStatuses[pt.plant.id]?.status] ?? HEALTH_COLORS.none}
            <g
              class="plant-marker {editMode ? 'draggable' : ''}"
              class:drag-source={dragging?.plant?.id === pt.plant.id}
              transform="translate({pt.x},{pt.y})"
              on:click={(e) => {
                if (Date.now() < suppressClickUntil) return;
                if (!editMode) { e.stopPropagation(); navigateToPlant(pt.plant.id); }
              }}
              on:pointerdown={(e) => handleCardPointerDown(pt.plant, e)}
              on:keydown={(e) => e.key === 'Enter' && !editMode && navigateToPlant(pt.plant.id)}
              role="button"
              tabindex="0">
              <HexCard plant={pt.plant} thumb={plantThumbs[pt.plant.id]} status={status} />
            </g>
          {/each}

          <!-- drag ghost: snapped to hover target -->
          {#if dragging?.plant && hoverHex && hoverHex.layout === layout}
            {@const status = HEALTH_COLORS[dragging.plant.id]?.status}
            <g class="drag-ghost" transform="translate({hoverHex.x},{hoverHex.y})" pointer-events="none">
              <HexCard
                plant={dragging.plant}
                thumb={plantThumbs[dragging.plant.id]}
                status={HEALTH_COLORS[status] ?? HEALTH_COLORS.none}
                dragging={true} />
            </g>
          {/if}
        </g>
      {/each}
    </svg>

    <!-- Zoom controls -->
    <div class="zoom-controls">
      <button
        on:click={() => zoomBy(1 / 1.6)}
        disabled={view.zoom <= MIN_ZOOM + 0.01}
        aria-label={$t('zoomOut')} title={$t('zoomOut')}>−</button>
      <button
        on:click={() => zoomBy(1.6)}
        disabled={view.zoom >= MAX_ZOOM - 0.01}
        aria-label={$t('zoomIn')} title={$t('zoomIn')}>+</button>
      <button
        on:click={resetView}
        disabled={view.zoom === 1 && view.vx === 0 && view.vy === 0}
        aria-label={$t('resetView')} title={$t('resetView')}>⌖</button>
    </div>
  </div>

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.good}"></span><span>{$t('health_good')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.fair}"></span><span>{$t('health_fair')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.poor}"></span><span>{$t('health_poor')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.bad}"></span><span>{$t('health_bad')}</span></div>
    <div class="legend-item"><span class="legend-dot" style="background:{HEALTH_COLORS.none}"></span><span>{$t('noProfile')}</span></div>
  </div>
</div>

<style>
  .map-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .map-wrap {
    position: relative;
  }

  .garden-svg {
    width: 100%;
    height: auto;
    display: block;
    user-select: none;
    -webkit-user-select: none;
    background: #eef6ee; /* covers the element box even outside the viewBox */
    touch-action: pan-y; /* page scrolls vertically; horizontal drag + pinch come to us */
  }

  .garden-svg.zoomed {
    touch-action: none; /* once zoomed in, one finger pans the map freely */
  }

  .garden-svg.editing {
    cursor: grab;
  }

  .section-label {
    font-size: 14px;
    font-weight: 700;
    fill: #2d5a27;
    pointer-events: none;
  }

  .section-label-btn {
    cursor: pointer;
  }

  .section-label-btn:hover .section-label {
    fill: #4a7c43;
    text-decoration: underline;
  }

  .plant-marker { cursor: pointer; }
  .plant-marker :global(.hex-card), .plant-marker { transition: opacity 0.15s; }
  .plant-marker:hover { opacity: 0.9; }
  .plant-marker:focus { outline: none; }
  .plant-marker:focus :global(path:first-of-type) { stroke: #2d5a27; stroke-width: 2; }

  /* Arrange mode: only the cards opt out of page scrolling, so drags are
     never hijacked while the page stays scrollable everywhere else */
  .plant-marker.draggable {
    cursor: grab;
    touch-action: none;
  }

  .plant-marker.drag-source {
    opacity: 0.25;
  }

  .drag-ghost {
    pointer-events: none;
    opacity: 0.95;
  }

  .edit-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: white;
    border-bottom: 1px solid #e0e0e0;
  }

  .edit-btn {
    padding: 0.375rem 0.875rem;
    background: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
  }

  .edit-btn.active {
    background: #2d5a27;
    color: white;
    border-color: #2d5a27;
  }

  .edit-hint {
    font-size: 0.8125rem;
    color: #666;
  }

  /* Zoom controls */
  .zoom-controls {
    position: absolute;
    right: 10px;
    bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 5;
  }

  .zoom-controls button {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1.5px solid rgba(45, 90, 39, 0.35);
    background: rgba(255, 255, 255, 0.92);
    color: #2d5a27;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .zoom-controls button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* Legend */
  .legend {
    display: flex;
    gap: 1rem;
    padding: 0.6rem 1rem;
    background: white;
    justify-content: center;
    border-top: 1px solid #e0e0e0;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: #444;
    font-weight: 500;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* Add-plant overlay */
  .convert-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .convert-modal {
    width: 100%;
    max-width: 380px;
    max-height: 90vh;
    overflow-y: auto;
  }
</style>
