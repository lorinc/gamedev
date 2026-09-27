// The quad WFC's map (p7, settled) as a pixel raster: K px per fine cell, each pixel rock, open, sky or
// ocean, plus its depth band. The storey pass works on this raster, so what it sees is what's drawn.

import { near } from '../v5/quads.js'
import { QSKY } from '../v5/quadwfc.js'
import { OCEAN } from '../v5/wfc.js'

export const K = 4 // px per fine cell
export const ROCK = 0
export const OPEN = 1
export const SKY = 2
export const SEA = 3

/**
 * @param {import('../v5/quadcaves.js').Grid} G
 * @param {{tile: Uint8Array, band: Uint8Array, skyBits: Uint8Array, seaBits: Uint8Array}} C
 */
export function rasterize(G, C) {
  const w = G.W * K
  const h = G.H * K
  const cls = new Uint8Array(w * h)
  const band = new Uint8Array(w * h)
  cls.fill(SKY) // above the mesh's top edge
  const m = G.mesh
  const X = (/** @type {number} */ x) => ((x * 10) / Math.sqrt(3)) * K
  const Y = (/** @type {number} */ y) => (y * 6 + 6) * K
  const shifts = [0, w, -w]

  /** Sets pixels whose centres are inside the polygon (even-odd), wrapping in x. @param {number[]} xs @param {number[]} ys @param {(i: number) => void} set */
  const fill = (xs, ys, set) => {
    const n = xs.length
    if (n < 3) return
    const y0 = Math.max(0, Math.floor(Math.min(...ys)))
    const y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)))
    for (const dx of shifts) {
      const x0 = Math.max(0, Math.floor(Math.min(...xs) + dx))
      const x1 = Math.min(w - 1, Math.ceil(Math.max(...xs) + dx))
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          let inside = false
          const cx = x + 0.5 - dx
          const cy = y + 0.5
          for (let i = 0, j = n - 1; i < n; j = i++)
            if (ys[i] > cy !== ys[j] > cy && cx < ((xs[j] - xs[i]) * (cy - ys[i])) / (ys[j] - ys[i]) + xs[i]) inside = !inside
          if (inside) set(y * w + x)
        }
    }
  }
  /** The part of a quad whose corners are set in bits (marching squares). @param {number} bits @param {number[]} xs @param {number[]} ys */
  const march = (bits, xs, ys) => {
    /** @type {number[]} */ const ox = []
    /** @type {number[]} */ const oy = []
    for (let k = 0; k < 4; k++) {
      const a = (bits >> k) & 1
      const b = (bits >> ((k + 1) & 3)) & 1
      if (a) {
        ox.push(xs[k])
        oy.push(ys[k])
      }
      if (a !== b) {
        ox.push((xs[k] + xs[(k + 1) & 3]) / 2)
        oy.push((ys[k] + ys[(k + 1) & 3]) / 2)
      }
    }
    return /** @type {[number[], number[]]} */ ([ox, oy])
  }

  m.faces.forEach((f, q) => {
    const xs = f.map((v) => X(near(m.x[v], m.x[f[0]], m.wrap)))
    const ys = f.map((v) => Y(m.y[v]))
    const b = C.band[q]
    if (b === QSKY || b === OCEAN) {
      const c = b === QSKY ? SKY : SEA
      return fill(xs, ys, (i) => ((cls[i] = c), (band[i] = b)))
    }
    fill(xs, ys, (i) => ((cls[i] = ROCK), (band[i] = b)))
    if (C.tile[q]) fill(...march(C.tile[q], xs, ys), (i) => (cls[i] = OPEN))
    if (C.seaBits[q]) fill(...march(C.seaBits[q], xs, ys), (i) => (cls[i] = SEA))
    if (C.skyBits[q]) fill(...march(C.skyBits[q], xs, ys), (i) => (cls[i] = SKY))
  })
  // below the ocean row's middle it's all water (the mesh's pinned bottom edge is a zigzag)
  for (let y = Math.floor(Y(1.5 * (m.rows - 1))); y < h; y++) for (let x = 0; x < w; x++) cls[y * w + x] = SEA

  // each column's crust: the first pixel below the sky
  const crust = new Int32Array(w)
  for (let x = 0; x < w; x++) {
    let y = 0
    while (y < h && cls[y * w + x] === SKY) y++
    crust[x] = y
  }
  return { w, h, cls, band, crust }
}
/** @typedef {ReturnType<typeof rasterize>} Terrain */
