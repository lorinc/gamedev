// Paints a generated map into RGBA pixels (no DOM: the page puts them in an ImageData, the gallery
// script in a PNG). "A 6-year-old in MS Paint": flat colours, 1 px black outlines where open meets
// solid, no gradients. Each fine cell is 2 × 2 px; the first 4 hex columns are repeated, faded, on
// the right to show the wrap; the sky with Jupiter sits above.

import { CELL_W, FH, FW, N, SOCKET, SQ3, centre, hexAt } from './hex.js'
import { OCEAN } from './wfc.js'

export const S = 2 // px per fine cell
export const EXT = 4 * CELL_W // the faded wrap copy, in cells
export const SKY = 56 // px
export const WIDTH = (FW + EXT) * S
export const HEIGHT = SKY + FH * S

/** @typedef {[number, number, number]} RGB */
/** @type {RGB[]} by band: surface, ice, pudding, brine rock, (ocean) */
const ROCK = [
  [205, 212, 218],
  [174, 226, 255],
  [138, 90, 43],
  [95, 127, 128],
  [0, 0, 0],
]
/** @type {RGB} */ const CAVE = [21, 21, 24]
/** @type {RGB} */ const WATER = [5, 11, 40]
/** @type {RGB} */ const SKYC = [11, 22, 64]
/** @type {RGB} */ const JUPITER = [240, 138, 36]
/** @type {RGB[]} solid, open, wall, passage, junction, pocket */
export const CLASS_RGB = [
  [110, 110, 110],
  [235, 235, 235],
  [74, 144, 217],
  [229, 179, 59],
  [217, 83, 79],
  [155, 89, 182],
]
/** @type {RGB} */ const GRID = [255, 225, 77]

/**
 * @typedef {object} View
 * @property {'painted' | 'classes' | 'plain' | 'noise'} mode
 * @property {boolean} grid
 * @property {boolean} sockets
 */

/**
 * @param {{hex: Int16Array, plain: Uint8Array, open: Uint8Array, band: Uint8Array}} R the raster
 * @param {Int16Array} map tile id per hex
 * @param {import('./tiles.js').Tile[]} tiles
 * @param {View} view
 * @returns {Uint8ClampedArray} WIDTH × HEIGHT × 4
 */
export function paint(R, map, tiles, view) {
  const px = new Uint8ClampedArray(WIDTH * HEIGHT * 4)
  const set = (/** @type {number} */ x, /** @type {number} */ y, /** @type {RGB} */ c) => {
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
    const o = (y * WIDTH + x) * 4
    const fade = x >= FW * S
    px[o] = fade ? (c[0] + 255) / 2.4 : c[0]
    px[o + 1] = fade ? (c[1] + 255) / 2.4 : c[1]
    px[o + 2] = fade ? (c[2] + 255) / 2.4 : c[2]
    px[o + 3] = 255
  }

  // the sky, with a big orange Jupiter
  for (let y = 0; y < SKY; y++)
    for (let x = 0; x < WIDTH; x++) {
      const d = Math.hypot(x - 64, y - 30)
      set(x, y, d < 21 ? JUPITER : d < 23 ? [0, 0, 0] : SKYC)
    }

  const grid = view.mode === 'plain' ? R.plain : R.open
  const isOpen = (/** @type {number} */ x, /** @type {number} */ y) => y >= 0 && y < FH && grid[y * FW + (((x % FW) + FW) % FW)] === 1
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW + EXT; x++) {
      const c = y * FW + (x % FW)
      const open = grid[c] === 1
      /** @type {RGB} */
      let col
      if (view.mode === 'classes') {
        const t = map[R.hex[c]]
        /** @type {RGB} */
        const k = t < 0 ? [255, 0, 255] : CLASS_RGB[tiles[t].cls]
        col = open ? k : [k[0] * 0.45, k[1] * 0.45, k[2] * 0.45]
      } else if (view.mode === 'painted') col = open ? (R.band[c] === OCEAN ? WATER : CAVE) : ROCK[R.band[c]]
      else col = open ? [235, 235, 235] : [34, 34, 34]
      const X = x * S
      const Y = SKY + y * S
      for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) set(X + dx, Y + dy, col)
      // 1 px black outlines on the rock side where open meets solid, and along the surface
      if (view.mode === 'painted' && !open) {
        const edge = /** @type {RGB} */ ([0, 0, 0])
        if (isOpen(x - 1, y)) for (let d = 0; d < S; d++) set(X, Y + d, edge)
        if (isOpen(x + 1, y)) for (let d = 0; d < S; d++) set(X + S - 1, Y + d, edge)
        if (isOpen(x, y - 1) || y === 0) for (let d = 0; d < S; d++) set(X + d, Y, edge)
        if (isOpen(x, y + 1)) for (let d = 0; d < S; d++) set(X + d, Y + S - 1, edge)
      }
    }

  if (view.grid)
    for (let y = 0; y < FH * S; y++) {
      let prev = -1
      for (let x = 0; x < WIDTH; x++) {
        const h = hexAt((x + 0.5) / S, (y + 0.5) / S)[0]
        const up = y > 0 ? hexAt((x + 0.5) / S, (y - 0.5) / S)[0] : h
        if ((prev >= 0 && h !== prev) || h !== up) set(x, SKY + y, GRID)
        prev = h
      }
    }

  if (view.sockets)
    for (let i = 0; i < N; i++) {
      const t = map[i]
      if (t < 0) continue
      const [cx, cy] = centre(i)
      for (let s = 0; s < 18; s++) {
        const fx = cx + (SOCKET[s][0] * CELL_W) / SQ3
        const fy = cy + SOCKET[s][1] * 6
        /** @type {RGB} */
        const col = (tiles[t].sockets >>> s) & 1 ? [60, 230, 90] : [240, 60, 60]
        for (const wx of [fx % FW, (fx % FW) + FW]) {
          const X = Math.round(wx * S)
          const Y = SKY + Math.round(fy * S)
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) set(X + dx, Y + dy, col)
        }
      }
    }
  return px
}
