// b4.15's lichen (the user): where loot is plentiful, purple lichen covers the cave wall, a patch of 6–8
// pixels, and grows a single curly short leaf. Decoration for now: it takes nothing and gives nothing.
// Cheats, like the lizards: every `checkTicks` a random pixel within `near` px of the bot with `density` loot
// within `radius` px starts a patch on the nearest surface pixel (open, 8-bordering solid) with no lichen
// within `gap` px; the patch grows along surface pixels to `min`–`max` pixels at once; its leaf curls out
// from the patch's first pixel, away from the rock: pixels, like everything else (b4.18, the user). Randomness from the tick (rng.js).
// b4.21 (the user): a lichen with the bugs' cover (garden.js) within `touch` px sometimes sparks an ember, 1 in
// `spark` a check: the cover catches fire there (garden.js's fire). Its leaf withers and it never sparks
// again; the purple patch stays.

import { isOpen, Tile } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { cover, ignite } from './garden.js'

/** The lichen's numbers (the dev panel's). */
export const LICHEN = {
  density: 8, // loot within radius that start a patch
  radius: 8,
  near: 64,
  checkTicks: 300,
  min: 6, // px a patch covers (the user: 6–8)
  max: 8,
  gap: 10, // px from any other lichen
  spark: 6, // 1 in this many checks a lichen with cover near sparks (b4.21)
  touch: 2, // px from the patch the cover must be
}
/** @typedef {typeof LICHEN} Lichen */

/**
 * @typedef {object} LichenState
 * @property {Uint8Array} on per pixel: LICHEN or LEAF
 * @property {{ cells: number[], leaf: number[], sparked: boolean }[]} patches the leaf's pixels (open ones, in the air)
 * @property {number[]} changed pixels the view hasn't painted yet
 */

export const LICHEN_PX = 1
export const LEAF_PX = 2
export const WITHERED_PX = 3 // a leaf after its spark (b4.21)

/** @param {number} n pixels @returns {LichenState} */
export const createLichen = (n) => ({ on: new Uint8Array(n), patches: [], changed: [] })

const SALT = 0x71c4
const AROUND = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
]

/** @param {import('./game.js').Game} g @param {number} x @param {number} y */
function surface(g, x, y) {
  const { w, h, tiles } = g.world
  if (y < 1 || y >= h - 1 || !isOpen(tiles[y * w + wrap(x, w)])) return false
  for (const [sx, sy] of AROUND) if (!isOpen(tiles[(y + sy) * w + wrap(x + sx, w)])) return true
  return false
}

/** The lichen's tick. @param {import('./game.js').Game} g */
export function updateLichen(g) {
  const c = g.cfg.lichen
  if (g.tick % Math.max(1, c.checkTicks) !== 0) return
  const { w, h, tiles } = g.world
  const L = g.lichen
  const rng = mulberry32(hashSeed(SALT, g.tick))
  sparks(g, rng)
  const n = Math.max(1, c.near)
  const p = { x: wrap(g.ch.x + (rng() % (2 * n + 1)) - n, w), y: g.ch.y + (rng() % (2 * n + 1)) - n }
  if (p.y < 0 || p.y >= h) return
  const r = c.radius
  let loot = 0
  let best = null
  let bd = Infinity
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const y = p.y + dy
      const d = dx * dx + dy * dy
      if (y < 0 || y >= h || d > r * r) continue
      if (tiles[y * w + wrap(p.x + dx, w)] === Tile.Loot) loot++
      if (d < bd && surface(g, p.x + dx, y)) ((bd = d), (best = { x: wrap(p.x + dx, w), y }))
    }
  if (loot < c.density || !best) return
  const start = /** @type {{ x: number, y: number }} */ (best)
  // no other lichen within gap
  const G = c.gap
  for (let dy = -G; dy <= G; dy++)
    for (let dx = -G; dx <= G; dx++) {
      const y = start.y + dy
      if (y >= 0 && y < h && dx * dx + dy * dy <= G * G && L.on[y * w + wrap(start.x + dx, w)]) return
    }
  // grow along the surface, at random, to min–max pixels
  const want = c.min + (rng() % Math.max(1, c.max - c.min + 1))
  const cells = [start.y * w + start.x]
  const got = new Set(cells)
  for (let a = 0; a < 30 * want && cells.length < want; a++) {
    const from = cells[rng() % cells.length]
    const [sx, sy] = AROUND[rng() % 8]
    const fx = from % w
    const x = wrap(fx + sx, w)
    const y = (from - fx) / w + sy
    const i = y * w + x
    if (got.has(i) || !surface(g, x, y)) continue
    got.add(i)
    cells.push(i)
  }
  for (const i of cells) {
    L.on[i] = LICHEN_PX
    L.changed.push(i)
  }
  // the leaf: away from the rock round its pixel (the nearest of 8 ways), 2 px out, then curling to a side
  let ax = 0
  let ay = 0
  for (const [sx, sy] of AROUND)
    if (isOpen(tiles[(start.y + sy) * w + wrap(start.x + sx, w)])) {
      ax += sx
      ay += sy
    }
  const k = Math.round(Math.atan2(ay, ax) / (Math.PI / 4)) & 7
  const [ox, oy] = AROUND[k]
  const [px, py] = AROUND[(k + (rng() % 2 ? 2 : 6)) & 7] // a side, 90° off
  /** @type {number[]} */
  const leaf = []
  for (const [a, b] of [
    [1, 0],
    [2, 0],
    [3, 1],
    [2, 2],
  ]) {
    const x = wrap(start.x + ox * a + px * b, w)
    const y = start.y + oy * a + py * b
    if (y < 0 || y >= h) break
    const i = y * w + x
    if (!isOpen(tiles[i]) || L.on[i]) break // a leaf stops at the rock
    leaf.push(i)
    L.on[i] = LEAF_PX
    L.changed.push(i)
  }
  L.patches.push({ cells, leaf, sparked: false })
  g.events.push({ type: 'lichen', x: start.x, y: start.y })
}

/** Lichens with cover within `touch` px spark, 1 in `spark` (b4.21). @param {import('./game.js').Game} g @param {() => number} rng */
function sparks(g, rng) {
  const { w, h } = g.world
  const L = g.lichen
  const wall = g.garden.wall
  const t = Math.max(0, g.cfg.lichen.touch)
  for (const p of L.patches) {
    if (p.sparked) continue
    let at = -1
    for (const i of p.cells) {
      const x = i % w
      const y = (i - x) / w
      for (let dy = -t; dy <= t && at < 0; dy++)
        for (let dx = -t; dx <= t && at < 0; dx++) {
          const j = (y + dy) * w + wrap(x + dx, w)
          if (y + dy >= 0 && y + dy < h && dx * dx + dy * dy <= t * t && cover(wall[j])) at = j
        }
      if (at >= 0) break
    }
    if (at < 0 || rng() % Math.max(1, g.cfg.lichen.spark) !== 0) continue
    p.sparked = true
    for (const i of p.leaf) {
      L.on[i] = WITHERED_PX
      L.changed.push(i)
    }
    ignite(g, at, rng)
    g.events.push({ type: 'spark', x: at % w, y: Math.floor(at / w) })
  }
}
