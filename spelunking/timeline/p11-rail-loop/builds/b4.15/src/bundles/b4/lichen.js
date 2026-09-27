// b4.15's lichen (the user): where loot is plentiful, purple lichen covers the cave wall, a patch of 6–8
// pixels, and grows a single curly short leaf. Decoration for now: it takes nothing and gives nothing.
// Cheats, like the lizards: every `checkTicks` a random pixel within `near` px of the bot with `density` loot
// within `radius` px starts a patch on the nearest surface pixel (open, 8-bordering solid) with no lichen
// within `gap` px; the patch grows along surface pixels to `min`–`max` pixels at once; its leaf curls out
// from the patch's first pixel, away from the rock. Randomness from the tick (rng.js).

import { isOpen, Tile } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'

/** The lichen's numbers (the dev panel's). */
export const LICHEN = {
  density: 8, // loot within radius that start a patch
  radius: 8,
  near: 64,
  checkTicks: 300,
  min: 6, // px a patch covers (the user: 6–8)
  max: 8,
  gap: 10, // px from any other lichen
}
/** @typedef {typeof LICHEN} Lichen */

/**
 * @typedef {object} LichenState
 * @property {Uint8Array} on per pixel: 1 where lichen is
 * @property {{ cells: number[], leaf: { x: number, y: number, dx: number, dy: number, turn: number } }[]} patches
 *   leaf: from pixel (x, y), heading (dx, dy) away from the rock, curling `turn` (1 or -1) at its end
 * @property {number[]} changed pixels the view hasn't painted yet
 */

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
      if (d < bd && surface(g, p.x + dx, y)) (bd = d), (best = { x: wrap(p.x + dx, w), y })
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
    L.on[i] = 1
    L.changed.push(i)
  }
  // the leaf: away from the rock round its pixel
  let ax = 0
  let ay = 0
  for (const [sx, sy] of AROUND)
    if (isOpen(tiles[(start.y + sy) * w + wrap(start.x + sx, w)])) {
      ax += sx
      ay += sy
    }
  const len = Math.hypot(ax, ay) || 1
  L.patches.push({ cells, leaf: { x: start.x, y: start.y, dx: ax / len, dy: ay / len, turn: rng() % 2 ? 1 : -1 } })
  g.events.push({ type: 'lichen', x: start.x, y: start.y })
}
