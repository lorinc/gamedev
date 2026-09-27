// Light (D051) and the surface (D052), as pure functions the game calls on change. Your light is
// the glow of what you carry: a radius that grows with the ore and loot in the pack. It shows
// surfaces only: it spreads from you through open cells (air, sky, a plank's cell) within the
// radius, and lights them and the rock faces bordering them. It never passes through rock.
// Cells are indices y * w + x. Integers only, like the rest of the sim (rng.js).

import { isOpen, Tile } from '../gen/world.js'
import { count } from './pack.js'
import { wrap } from './rules.js'

/** @typedef {import('../gen/world.js').World} World */
/** @typedef {import('./rules.js').Cell} Cell */
/** @typedef {import('./pack.js').Pack} Pack */
/** @typedef {{ base: number, orePer: number, lootPer: number }} Light tiles of radius: base + floor(ore / orePer + loot / lootPer) */

/** base + floor(ore / orePer + loot / lootPer), counting the pack only. A per ≤ 0 counts nothing. @param {Pack} pack @param {Light} light */
export function lightRadius(pack, light) {
  const op = Math.max(1, light.orePer)
  const lp = Math.max(1, light.lootPer)
  const ore = light.orePer > 0 ? count(pack, Tile.Ore) : 0
  const loot = light.lootPer > 0 ? count(pack, Tile.Loot) : 0
  return Math.max(0, light.base) + Math.floor((ore * lp + loot * op) / (op * lp))
}

// The 8 neighbours, for the rock faces.
const AROUND = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1]

/**
 * What the light from `at` reaches: a 4-connected flood through open cells within the radius
 * (dx² + dy² ≤ r², dx the short way round the ring), plus the non-open cells within the radius
 * that 8-border a reached cell. Sorted ascending.
 * @param {World} world @param {Cell} at @param {number} r
 * @returns {number[]}
 */
export function litCells(world, at, r) {
  const { w, h, tiles } = world
  const r2 = r * r
  /** @param {number} x @param {number} y */
  const within = (x, y) => {
    let dx = wrap(x - at.x, w)
    if (dx > w - dx) dx = w - dx
    const dy = y - at.y
    return dx * dx + dy * dy <= r2
  }
  const start = at.y * w + wrap(at.x, w)
  const reached = new Set([start])
  const queue = [start] // grows while it's read: a breadth-first flood
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]
    const x = i % w
    const y = (i - x) / w
    for (let k = 0; k < 4; k++) {
      const ny = k === 2 ? y - 1 : k === 3 ? y + 1 : y
      if (ny < 0 || ny >= h) continue
      const nx = k === 0 ? wrap(x - 1, w) : k === 1 ? wrap(x + 1, w) : x
      const n = ny * w + nx
      if (reached.has(n) || !isOpen(tiles[n]) || !within(nx, ny)) continue
      reached.add(n)
      queue.push(n)
    }
  }
  const lit = new Set(reached)
  for (const i of queue) {
    const x = i % w
    const y = (i - x) / w
    for (let k = 0; k < AROUND.length; k += 2) {
      const ny = y + AROUND[k + 1]
      if (ny < 0 || ny >= h) continue
      const nx = wrap(x + AROUND[k], w)
      const n = ny * w + nx
      if (!lit.has(n) && !isOpen(tiles[n]) && within(nx, ny)) lit.add(n)
    }
  }
  return [...lit].sort((a, b) => a - b)
}

/** The surface, always lit (D051, D052): every Sky cell and every cell 8-bordering one (the ground's top faces). Sorted. @param {World} world */
export function surfaceCells(world) {
  const { w, h, tiles } = world
  /** @type {number[]} */
  const out = []
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sky = tiles[y * w + x] === Tile.Sky
      for (let k = 0; k < AROUND.length && !sky; k += 2) {
        const ny = y + AROUND[k + 1]
        sky = ny >= 0 && ny < h && tiles[ny * w + wrap(x + AROUND[k], w)] === Tile.Sky
      }
      if (sky) out.push(y * w + x)
    }
  return out
}

/**
 * Line-of-sight light (b4.3): what's in sight from `at` within the radius (dx² + dy² ≤ r², dx the short way
 * round the ring). A cell is in sight when a straight line (Bresenham's, from `at` to it or from it back to
 * `at`, whichever is clear) passes only open cells in between. Lit: the open cells in sight, and the rock
 * cells within the radius that 8-border one (the face, 1 deep; a line alone misses a flat wall at a grazing
 * angle), and nothing behind. Unlike litCells, no light round corners. About r² cells × r steps: at r 8,
 * under 2,000 steps. Sorted ascending.
 * @param {World} world @param {Cell} at @param {number} r
 * @returns {number[]}
 */
export function sightCells(world, at, r) {
  const { w, h, tiles } = world
  const ax = wrap(at.x, w)
  /** @param {number} dx @param {number} dy relative to `at` */
  const openRel = (dx, dy) => {
    const y = at.y + dy
    return y >= 0 && y < h && isOpen(tiles[y * w + wrap(ax + dx, w)])
  }
  /** Only open cells strictly between (x0, y0) and (x1, y1) on Bresenham's line. @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 */
  const clear = (x0, y0, x1, y1) => {
    const sx = Math.sign(x1 - x0)
    const sy = Math.sign(y1 - y0)
    const ex = Math.abs(x1 - x0)
    const ey = Math.abs(y1 - y0)
    let err = ex - ey
    let x = x0
    let y = y0
    for (;;) {
      const e2 = 2 * err
      if (e2 > -ey) {
        err -= ey
        x += sx
      }
      if (e2 < ex) {
        err += ex
        y += sy
      }
      if (x === x1 && y === y1) return true
      if (!openRel(x, y)) return false
    }
  }
  const rx = Math.min(r, w >> 1)
  /** @type {Set<number>} */
  const out = new Set()
  for (let dy = -r; dy <= r; dy++) {
    const y = at.y + dy
    if (y < 0 || y >= h) continue
    for (let dx = -rx; dx <= rx; dx++) {
      if (dx * dx + dy * dy > r * r || !openRel(dx, dy)) continue
      if ((dx || dy) && !clear(0, 0, dx, dy) && !clear(dx, dy, 0, 0)) continue
      out.add(y * w + wrap(ax + dx, w))
      for (let k = 0; k < AROUND.length; k += 2) {
        const ex = dx + AROUND[k]
        const ey = dy + AROUND[k + 1]
        if (ex * ex + ey * ey > r * r || at.y + ey < 0 || at.y + ey >= h || openRel(ex, ey)) continue
        out.add((at.y + ey) * w + wrap(ax + ex, w))
      }
    }
  }
  return [...out].sort((a, b) => a - b)
}
