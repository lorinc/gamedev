// v7's pictures. The terrain goes into RGBA pixels (a pixelated base, scaled up by the page); the lattice
// is drawn over it as lines at screen resolution, so thin candidates and thick builds read apart. Open
// air is near black (user: darker, so the network stands out); rock keeps p8's colours.

import { podPart } from '../v6/storeys.js'
import { K, OPEN, ROCK, SEA, SKY } from '../v6/terrain.js'

/** @typedef {[number, number, number]} RGB */
/** @type {RGB[]} rock by band: surface, ice, pudding, brine */
const ROCKC = [
  [205, 212, 218],
  [174, 226, 255],
  [138, 90, 43],
  [95, 127, 128],
]
/** @type {RGB} */ const AIR = [4, 4, 7]
/** @type {RGB} */ const WATER = [5, 11, 40]
/** @type {RGB} */ const SPACE = [16, 20, 44]
/** @type {RGB} */ const SHELL = [240, 138, 36]
/** @type {RGB} */ const INSIDE = [70, 46, 24]
/** @type {RGB} */ const WALKABLE = [40, 80, 45]

/** The colours of the lattice, by what a stretch is. */
export const COL = {
  floor: 'rgb(80,235,110)',
  cut: 'rgb(190,255,150)',
  bridge: 'rgb(245,205,60)',
  ramp: 'rgb(225,90,235)',
  tunnel: 'rgb(235,70,60)',
  wall: 'rgb(245,245,245)',
  airlock: 'rgb(255,150,30)',
  doomed: 'rgb(0,220,255)',
  dead: 'rgb(110,110,120)',
}

/**
 * The rows the page shows: from a little above the crust's highest point to a little below the ice.
 * @param {import('../v6/terrain.js').Terrain} T
 */
export function frame(T) {
  const { w, band, crust } = T
  let top = T.h
  for (let x = 0; x < w; x++) top = Math.min(top, crust[x])
  let bottom = 0
  for (let i = 0; i < band.length; i++) if (band[i] === 1) bottom = Math.max(bottom, Math.floor(i / w))
  return { top: Math.max(0, top - 2 * K), rows: Math.min(T.h, bottom + 2 * K) - Math.max(0, top - 2 * K) }
}

/**
 * @param {import('../v6/terrain.js').Terrain} T @param {import('./lattice.js').Lattice} La
 * @param {boolean} walkable also shade every walkable floor pixel
 */
export function paintBase(T, La, walkable) {
  const { w, cls, band } = T
  const { top, rows } = frame(T)
  const px = new Uint8ClampedArray(w * rows * 4)
  const set = (/** @type {number} */ x, /** @type {number} */ y, /** @type {RGB} */ c) => {
    const yy = y - top
    if (yy < 0 || yy >= rows) return
    const i = (yy * w + (((x % w) + w) % w)) * 4
    px[i] = c[0]
    px[i + 1] = c[1]
    px[i + 2] = c[2]
    px[i + 3] = 255
  }
  for (let y = top; y < top + rows; y++)
    for (let x = 0; x < w; x++) {
      const c = cls[y * w + x]
      set(x, y, c === SKY ? SPACE : c === SEA ? WATER : c === OPEN ? AIR : ROCKC[Math.min(3, band[y * w + x])])
    }
  if (walkable) for (let x = 0; x < w; x++) for (const y of La.floors[x]) set(x, y, WALKABLE)
  if (La.pod) {
    const { c, base } = La.pod
    for (let dx = -8 * K; dx < 8 * K; dx++)
      for (let dy = -K; dy <= 6 * K; dy++) {
        const p = podPart(dx, dy)
        if (p) set(c + dx, base - dy, p === 1 ? SHELL : INSIDE)
      }
  }
  return { w, h: rows, top, px }
}

/**
 * Draws a pixel path as lines, one colour per stretch, broken across the wrap.
 * @param {CanvasRenderingContext2D} ctx @param {[number, number][]} px @param {(i: number) => string} colour of the step into i
 * @param {number} z screen px per raster px @param {number} top @param {number} w
 */
export function stroke(ctx, px, colour, z, top, w) {
  let cur = ''
  for (let i = 1; i < px.length; i++) {
    const [x0, y0] = px[i - 1]
    const [x1, y1] = px[i]
    if (Math.abs(x1 - x0) > 1 && Math.abs(x1 - x0) < w - 1) continue
    const c = colour(i)
    if (c !== cur) {
      if (cur) ctx.stroke()
      ctx.strokeStyle = cur = c
      ctx.beginPath()
    }
    // across the wrap: draw the step at both edges
    const a = x1 - x0 > 1 ? x0 + w : x0 - x1 > 1 ? x0 - w : x0
    ctx.moveTo((a + 0.5) * z, (y0 - top + 0.5) * z)
    ctx.lineTo((x1 + 0.5) * z, (y1 - top + 0.5) * z)
  }
  if (cur) ctx.stroke()
}

/** The colour of each step of a candidate: rock is a tunnel, 45° in air a ramp, level in air a bridge. @param {import('./lattice.js').Cand} c @param {import('../v6/terrain.js').Terrain} T */
export function stepColours(c, T) {
  if (c.kind === 'wall') return () => COL.wall
  if (c.kind === 'cut') return () => COL.cut
  const { w, cls } = T
  return (/** @type {number} */ i) => {
    const [x, y] = c.px[i]
    if (i < c.px.length - 1 && cls[y * w + x] === ROCK) return COL.tunnel
    return c.px[i][1] !== c.px[i - 1][1] ? COL.ramp : COL.bridge
  }
}
