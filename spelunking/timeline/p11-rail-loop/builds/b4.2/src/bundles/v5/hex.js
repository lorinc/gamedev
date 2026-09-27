// Pointy-top hexes in odd-r offset rows (odd rows shifted half a hex right), wrapping horizontally.
// Two coordinate systems: the fine grid (cells, the future game grid) and hex-local "unit" space,
// where a hex is regular with circumradius 1. A hex is 10 cells wide and rows are 9 cells apart,
// a slightly stretched regular hex, so the 16-hex width is exactly 160 cells and wraps cleanly.

export const COLS = 16
export const ROWS = 32
export const N = COLS * ROWS
export const CELL_W = 10 // cells per hex, across
export const ROW_H = 9 // cells between row centres
export const FW = COLS * CELL_W // 160
export const FH = (ROWS - 1) * ROW_H + 12 // 291: a hex is 2 units = 12 cells tall
export const SQ3 = Math.sqrt(3)
export const INR = SQ3 / 2 // inradius in unit space

// fine cells → unit space: 10 cells = √3 units across, 6 cells = 1 unit down
const UX = SQ3 / CELL_W
const UY = 1 / 6

// Side k faces angle -60° + 60°·k (y down): 0 NE, 1 E, 2 SE, 3 SW, 4 W, 5 NW. Side k meets the
// neighbour's side k+3. A side runs clockwise from corner A (its angle − 30°) to corner B (+ 30°).
export const NX = [0, 1, 2, 3, 4, 5].map((k) => Math.cos(((-60 + 60 * k) * Math.PI) / 180))
export const NY = [0, 1, 2, 3, 4, 5].map((k) => Math.sin(((-60 + 60 * k) * Math.PI) / 180))
const corner = (/** @type {number} */ deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)]
export const SIDE_A = [0, 1, 2, 3, 4, 5].map((k) => corner(-90 + 60 * k))
export const SIDE_B = [0, 1, 2, 3, 4, 5].map((k) => corner(-30 + 60 * k))

/** Socket s = 3k + j: the midpoint of segment j of side k, in unit space. */
export const SOCKET = Array.from({ length: 18 }, (_, s) => {
  const k = Math.floor(s / 3)
  const f = (2 * (s % 3) + 1) / 6
  const [ax, ay] = SIDE_A[k]
  const [bx, by] = SIDE_B[k]
  return [ax + (bx - ax) * f, ay + (by - ay) * f]
})

/** @param {number} c @param {number} r */
export const idx = (c, r) => r * COLS + (((c % COLS) + COLS) % COLS)

/** Centre of hex i in fine-grid coordinates (not wrapped: 5 ≤ x < 165). @param {number} i */
export function centre(i) {
  const c = i % COLS
  const r = Math.floor(i / COLS)
  return [c * CELL_W + 5 + (r & 1 ? 5 : 0), r * ROW_H + 6]
}

/** Neighbour of hex i across side k, or -1 off the top or bottom. @param {number} i @param {number} k */
export function neighbour(i, k) {
  const c = i % COLS
  const r = Math.floor(i / COLS)
  const odd = r & 1
  const dr = k === 1 || k === 4 ? 0 : k < 1 || k > 4 ? -1 : 1
  if (r + dr < 0 || r + dr >= ROWS) return -1
  if (k === 1) return idx(c + 1, r)
  if (k === 4) return idx(c - 1, r)
  // diagonals: the east ones shift by `odd`, the west ones by `odd - 1`
  const east = k === 0 || k === 2
  return idx(c + (east ? odd : odd - 1), r + dr)
}

/** All neighbours, -1 where there's none. */
export const NEIGHBOURS = Array.from({ length: N }, (_, i) => [0, 1, 2, 3, 4, 5].map((k) => neighbour(i, k)))

/**
 * The hex a fine-grid point falls in (the nearest centre in unit space) and the point in that
 * hex's unit space. x wraps at FW.
 * @param {number} x @param {number} y
 * @returns {[number, number, number]} hex index, ux, uy
 */
export function hexAt(x, y) {
  const r0 = Math.round((y - 6) / ROW_H)
  let best = -1
  let bd = Infinity
  let bx = 0
  let by = 0
  for (let r = r0 - 1; r <= r0 + 1; r++) {
    if (r < 0 || r >= ROWS) continue
    const off = 5 + (r & 1 ? 5 : 0)
    const c0 = Math.round((x - off) / CELL_W)
    for (let c = c0 - 1; c <= c0 + 1; c++) {
      let dx = x - (c * CELL_W + off)
      dx -= Math.round(dx / FW) * FW
      const ux = dx * UX
      const uy = (y - (r * ROW_H + 6)) * UY
      const d = ux * ux + uy * uy
      if (d < bd) {
        bd = d
        best = idx(c, r)
        bx = ux
        by = uy
      }
    }
  }
  return [best, bx, by]
}

/**
 * The socket nearest a point near the hex edge, and how far the point is from the edge (unit space).
 * @param {number} ux @param {number} uy
 * @returns {[number, number]} socket, distance to the edge
 */
export function edgeSocket(ux, uy) {
  let k = 0
  let m = -Infinity
  for (let s = 0; s < 6; s++) {
    const d = NX[s] * ux + NY[s] * uy
    if (d > m) {
      m = d
      k = s
    }
  }
  const [ax, ay] = SIDE_A[k]
  const [bx, by] = SIDE_B[k]
  const t = ((ux - ax) * (bx - ax) + (uy - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)
  const j = Math.min(2, Math.max(0, Math.floor(t * 3)))
  return [3 * k + j, INR - m]
}

/** Fine-cell distance → unit distance (the smaller axis scale, so "1.5 cells" never overshoots). */
export const CELL_UNIT = Math.min(UX, UY)
