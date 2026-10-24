// Hex grid utilities — axial coordinates, pointy-top hexagons
//
// Pointy-top geometry:
//   width  = sqrt(3) * size  (flat sides left/right, points top/bottom)
//   height = 2 * size
//   column spacing = sqrt(3) * size
//   row spacing    = 1.5 * size (adjacent rows staggered by sqrt(3)/2 * size)
//
// A "row" (constant r, q = 0..n) renders as a straight horizontal line of
// hexes — grapevines etc. still read as rows.

export const HEX_SIZE = 30; // hexagon radius (center → vertex)
export const HEX_W = Math.sqrt(3) * HEX_SIZE; // hexagon width
export const HEX_H = 2 * HEX_SIZE;            // hexagon height

/**
 * Convert axial (q, r) to pixel coordinates (pointy-top).
 * Returns the hex CENTER as { x, y }.
 */
export function axialToPixel(q, r, size = HEX_SIZE) {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * (3 / 2) * r;
  return { x, y };
}

/**
 * Convert pixel coordinates to the nearest hex (pointy-top).
 */
export function pixelToAxial(x, y, size = HEX_SIZE) {
  const qf = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const rf = ((2 / 3) * y) / size;
  return axialRound(qf, rf);
}

/**
 * Round fractional axial coordinates to the nearest integer hex (cube rounding).
 */
export function axialRound(q, r) {
  let s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
}

/** The 6 hex-neighbor axial directions. */
export function hexDirections() {
  return [
    { q: +1, r: 0 }, { q: +1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: +1 }, { q: 0, r: +1 }
  ];
}

/** Get all 6 neighbors of a hex. */
export function hexNeighbors(q, r) {
  return hexDirections().map(d => ({ q: q + d.q, r: r + d.r }));
}

/** Grid distance between two hexes. */
export function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

/**
 * Find the nearest unoccupied hex to (q, r), searching outward ring by ring.
 * `occupied` is a Set of "q,r" strings; the start hex's own key may be passed
 * via ignoreKey (used when the dragged plant vacates its original cell).
 * Returns { q, r } or null.
 */
export function findFreeHex(occupied, q, r, maxRings = 12, ignoreKey = null) {
  const free = k => !occupied.has(k);
  const startKey = `${q},${r}`;
  if (free(startKey) || startKey === ignoreKey) return { q, r };

  const seen = new Set([startKey]);
  let frontier = [{ q, r }];
  for (let dist = 1; dist <= maxRings; dist++) {
    const next = [];
    for (const h of frontier) {
      for (const n of hexNeighbors(h.q, h.r)) {
        const key = `${n.q},${n.r}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (key === ignoreKey || free(key)) return n;
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}

/**
 * SVG path for a pointy-top hexagon centered at (0, 0) — a point at the top
 * and bottom, flat sides left/right. Draw with translate() to position.
 */
export function hexPath(size = HEX_SIZE) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // 30°, 90°, ... → pointy-top vertices
    pts.push(`${(size * Math.cos(angle)).toFixed(2)},${(size * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Hex corner points (pointy-top), useful for custom shapes. */
export function hexCorners(size = HEX_SIZE) {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
  }
  return corners;
}

/**
 * Convert a tint color for card backgrounds from a hex color.
 */
export function colorToTint(hex, opacity = 0.18) {
  if (!hex || hex.length < 7) return 'rgba(255,255,255,0.82)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
