// The fine grid (160 × 291, wrapping at 160) drawn from the collapsed hexes. Within 1.5 cells of a
// hex edge a cell takes the nearest socket's value, so every edge joins its neighbour; inside it
// follows the tile's shape plus small hashed value noise, which hides the grid. Also: materials by
// wobbled depth band, and cavities (connected open regions) for the stats.

import { CELL_UNIT, COLS, FH, FW, ROW_H, edgeSocket, hexAt } from './hex.js'
import { BRINE, ICE, OCEAN, SURFACE, bandOf, hash11, wobble } from './wfc.js'

/** @typedef {import('./tiles.js').Tile} Tile */

const EDGE = 1.5 * CELL_UNIT // the socket band
const AMP = 2 * CELL_UNIT // noise amplitude: about 2 cells
const STEP = 8 // noise knots every 8 cells, then 4 (both divide 160, so it wraps)

/** Value noise in [-1, 1], periodic in x. @param {number} seed @param {number} x @param {number} y */
function noise(seed, x, y) {
  let v = 0
  let amp = 1
  let total = 0
  for (const step of [STEP, STEP / 2]) {
    const kw = FW / step
    const fx = x / step
    const fy = y / step
    const ix = Math.floor(fx)
    const iy = Math.floor(fy)
    const sx = smooth(fx - ix)
    const sy = smooth(fy - iy)
    const k = (/** @type {number} */ a, /** @type {number} */ b) => hash11(seed, step, ((a % kw) + kw) % kw, b)
    const top = k(ix, iy) * (1 - sx) + k(ix + 1, iy) * sx
    const bot = k(ix, iy + 1) * (1 - sx) + k(ix + 1, iy + 1) * sx
    v += (top * (1 - sy) + bot * sy) * amp
    total += amp
    amp /= 2
  }
  return v / total
}
const smooth = (/** @type {number} */ t) => t * t * (3 - 2 * t)

/**
 * @param {Tile[]} tiles @param {Int16Array} map tile id per hex (-1 = undecided: drawn solid)
 * @param {number} seed @param {number} wob layer border wobble (rows)
 */
export function raster(tiles, map, seed, wob) {
  const n = FW * FH
  const hex = new Int16Array(n)
  const plain = new Uint8Array(n) // 1 = open, before noise
  const open = new Uint8Array(n) // 1 = open, with noise
  const edge = new Uint8Array(n) // 1 = in a hex's socket band
  const band = new Uint8Array(n) // material: the depth band
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const c = y * FW + x
      const [h, ux, uy] = hexAt(x + 0.5, y + 0.5)
      hex[c] = h
      const t = map[h] < 0 ? null : tiles[map[h]]
      const [s, d] = edgeSocket(ux, uy)
      if (!t) plain[c] = open[c] = 0
      else if (d < EDGE) {
        edge[c] = 1
        plain[c] = open[c] = (t.sockets >>> s) & 1
      } else {
        const v = t.sdf(ux, uy)
        plain[c] = v < 0 ? 1 : 0
        open[c] = v + AMP * noise(seed, x, y) < 0 ? 1 : 0
      }
      const r = Math.floor(h / COLS)
      band[c] =
        r === 0 ? SURFACE : r >= 30 ? OCEAN : Math.min(BRINE, Math.max(ICE, bandOf((y + 0.5 - 6) / ROW_H + wobble(seed, x + 0.5, wob))))
    }
  return { hex, plain, open, edge, band }
}

/**
 * Cavities: connected open regions (4-neighbour, wrapping), leaving out the ocean.
 * @param {Uint8Array} open @param {Uint8Array} band
 */
export function cavities(open, band) {
  const n = FW * FH
  const id = new Int32Array(n).fill(-1)
  /** @type {number[]} */
  const sizes = []
  const stack = []
  for (let c = 0; c < n; c++) {
    if (!open[c] || band[c] === OCEAN || id[c] >= 0) continue
    const k = sizes.length
    let size = 0
    id[c] = k
    stack.push(c)
    while (stack.length) {
      const p = /** @type {number} */ (stack.pop())
      size++
      const x = p % FW
      const y = (p - x) / FW
      const next = [y * FW + ((x + 1) % FW), y * FW + ((x + FW - 1) % FW), y > 0 ? p - FW : -1, y < FH - 1 ? p + FW : -1]
      for (const q of next)
        if (q >= 0 && open[q] && band[q] !== OCEAN && id[q] < 0) {
          id[q] = k
          stack.push(q)
        }
    }
    sizes.push(size)
  }
  const total = sizes.reduce((a, b) => a + b, 0)
  return {
    id,
    count: sizes.length,
    largest: total ? Math.max(...sizes) / total : 0,
    tiny: sizes.filter((s) => s < 20).length,
  }
}
