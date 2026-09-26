// Paints a generated map into RGBA pixels (no DOM: the page puts them in an ImageData, the gallery
// script in a PNG). "A 6-year-old in MS Paint": flat colours, 1 px black outlines where open meets
// solid, no gradients. Each fine cell is 2 × 2 px; the first 4 hex columns are repeated, faded, on
// the right to show the wrap; the sky with Jupiter sits above.

import { CELL_W, FH, FW, N, SOCKET, SQ3, centre, hexAt } from './hex.js'
import { near } from './quads.js'
import { QCLASS } from './quadwfc.js'
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
 * A blank picture: the sky everywhere, with a big orange Jupiter; `set` fades x ≥ fadeFrom (the wrap copy).
 * @param {number} w @param {number} h @param {number} fadeFrom
 */
function canvas(w = WIDTH, h = HEIGHT, fadeFrom = FW * S) {
  const px = new Uint8ClampedArray(w * h * 4)
  const set = (/** @type {number} */ x, /** @type {number} */ y, /** @type {RGB} */ c) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const o = (y * w + x) * 4
    const fade = x >= fadeFrom
    px[o] = fade ? (c[0] + 255) / 2.4 : c[0]
    px[o + 1] = fade ? (c[1] + 255) / 2.4 : c[1]
    px[o + 2] = fade ? (c[2] + 255) / 2.4 : c[2]
    px[o + 3] = 255
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - 64, y - 30)
      set(x, y, d < 21 ? JUPITER : d < 23 ? [0, 0, 0] : SKYC)
    }
  return { px, set }
}

/**
 * @param {{hex: Int16Array, plain: Uint8Array, open: Uint8Array, band: Uint8Array}} R the raster
 * @param {Int16Array} map tile id per hex
 * @param {import('./tiles.js').Tile[]} tiles
 * @param {View} view
 * @returns {Uint8ClampedArray} WIDTH × HEIGHT × 4
 */
export function paint(R, map, tiles, view) {
  const { px, set } = canvas()
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

/** Quad classes for the classes view: rock, open, wall, nook, inner corner, saddle. @type {RGB[]} */
const QCLASS_RGB = [
  [110, 110, 110],
  [235, 235, 235],
  [74, 144, 217],
  [229, 179, 59],
  [217, 83, 79],
  [155, 89, 182],
]

/** @param {RGB} c @returns {RGB} */
const dim = (c) => [c[0] * 0.45, c[1] * 0.45, c[2] * 0.45]

/** px per fine cell on the quad map (it's small), and the wrap copy's width in cells */
export const QS = 8
const QEXT = 10

/** The quad map's picture size. @param {import('./quadcaves.js').Grid} G */
export const quadSize = (G) => ({ w: (G.W + QEXT) * QS, h: SKY + G.H * QS })

/**
 * The quad WFC's map: each quad of the relaxed grid painted by marching squares on its 4 corners, so
 * the rock/cave border cuts across the quads between edge midpoints, with a black line along it. One
 * hex column is repeated, faded, on the right to show the wrap. `grid` draws the quads themselves.
 * @param {import('./quadcaves.js').Grid} G
 * @param {{tile: Uint8Array, band: Uint8Array}} R
 * @param {View} view
 * @returns {Uint8ClampedArray} quadSize(G) × 4
 */
export function paintQuads(G, R, view) {
  const { w: WIDTH, h } = quadSize(G)
  const { px, set } = canvas(WIDTH, h, G.W * QS)
  const m = G.mesh
  const X = (/** @type {number} */ x) => ((x * CELL_W) / SQ3) * QS
  const Y = (/** @type {number} */ y) => SKY + (y * 6 + 6) * QS
  const shifts = [0, X(m.wrap), -X(m.wrap)]

  /** Fills a polygon (pixel centres inside, even-odd), with its wrapped copies. @param {number[]} xs @param {number[]} ys @param {RGB} col */
  const fill = (xs, ys, col) => {
    const n = xs.length
    for (const dx of shifts) {
      const x0 = Math.floor(Math.min(...xs) + dx)
      const x1 = Math.ceil(Math.max(...xs) + dx)
      if (x1 < 0 || x0 >= WIDTH) continue
      for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++)
        for (let x = x0; x <= x1; x++) {
          let inside = false
          const cx = x + 0.5 - dx
          const cy = y + 0.5
          for (let i = 0, j = n - 1; i < n; j = i++)
            if (ys[i] > cy !== ys[j] > cy && cx < ((xs[j] - xs[i]) * (cy - ys[i])) / (ys[j] - ys[i]) + xs[i]) inside = !inside
          if (inside) set(x, y, col)
        }
    }
  }
  /** @param {number} ax @param {number} ay @param {number} bx @param {number} by @param {RGB} c */
  const line = (ax, ay, bx, by, c) => {
    const n = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay))) + 1
    for (const dx of shifts)
      for (let i = 0; i <= n; i++) set(Math.floor(ax + ((bx - ax) * i) / n + dx), Math.floor(ay + ((by - ay) * i) / n), c)
  }

  m.faces.forEach((f, q) => {
    const t = R.tile[q]
    const xs = f.map((v) => X(near(m.x[v], m.x[f[0]], m.wrap)))
    const ys = f.map((v) => Y(m.y[v]))
    /** @type {RGB} */
    const rock = view.mode === 'classes' ? dim(QCLASS_RGB[QCLASS[t]]) : ROCK[R.band[q]]
    /** @type {RGB} */
    const open = view.mode === 'classes' ? QCLASS_RGB[QCLASS[t]] : R.band[q] === OCEAN ? WATER : CAVE
    fill(xs, ys, rock)
    if (t === 0) return
    // the open part: open corners, and the midpoints of the edges the border crosses
    const ox = []
    const oy = []
    /** @type {number[][]} */
    const mids = []
    for (let k = 0; k < 4; k++) {
      const a = (t >> k) & 1
      const b = (t >> ((k + 1) & 3)) & 1
      if (a) (ox.push(xs[k]), oy.push(ys[k]))
      if (a !== b) {
        const mx = (xs[k] + xs[(k + 1) & 3]) / 2
        const my = (ys[k] + ys[(k + 1) & 3]) / 2
        ox.push(mx)
        oy.push(my)
        mids.push([mx, my])
      }
    }
    fill(ox, oy, open)
    if (view.mode !== 'painted' || R.band[q] === OCEAN) return
    // the border: midpoints in pairs (a saddle has two)
    if (mids.length === 2) line(mids[0][0], mids[0][1], mids[1][0], mids[1][1], [0, 0, 0])
    if (mids.length === 4) {
      const s = (t & 1) === 1 ? 0 : 1 // pair the midpoints around each open corner
      line(mids[s][0], mids[s][1], mids[(s + 3) & 3][0], mids[(s + 3) & 3][1], [0, 0, 0])
      line(mids[s + 1][0], mids[s + 1][1], mids[s + 2][0], mids[s + 2][1], [0, 0, 0])
    }
  })
  if (view.grid)
    for (const [a, b] of G.walls) {
      const ax = X(m.x[a])
      line(ax, Y(m.y[a]), X(near(m.x[b], m.x[a], m.wrap)), Y(m.y[b]), [120, 120, 60])
    }
  return px
}
