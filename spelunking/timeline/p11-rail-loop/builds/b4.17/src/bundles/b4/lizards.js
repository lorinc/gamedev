// b4.14's lizards (the user): where ore is plentiful, bright green lizards appear; they zip, stop and zip
// round the cave surfaces, mine the ore, and after 16 they burrow and make one loot in the wall.
// Cheats, like the worms (no pathfinding): every `checkTicks` a random pixel within `near` px of the bot with
// `density` ore within `radius` px spawns a lizard on the nearest surface pixel there (open, 8-bordering a
// solid one), at most `max`. A lizard runs only on surface pixels: a zip of 4–12 px, a px every `zipTicks`,
// toward the nearest ore within `sense` px (else on its heading, else anywhere), then a stop of 0.7–2 s,
// taking an ore within `reach` px every `mineTicks` while it stops (the pixel turns to rock). Full, it
// takes the worms' site finder with a 1 px site: a soft or hard rock pixel with no open one within 2; it
// goes straight there through the rock, and that pixel turns to loot (event `deposit`). Randomness from the
// tick (rng.js).

import { isOpen, Tile } from '../../sim/gen/world.js'
import { toRock } from '../../sim/dig/pull.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { findSite } from './worms.js'

/** The lizards' numbers (the dev panel's). */
export const LIZARDS = {
  density: 16, // ore within radius that spawn a lizard
  radius: 8,
  near: 64, // px from the bot a spawn is tried
  checkTicks: 300,
  max: 6,
  zipTicks: 3, // 20 px/s while zipping
  sense: 16,
  reach: 3,
  mineTicks: 30,
  eat: 16, // ore, then it burrows (the user)
  site: 24,
}
/** @typedef {typeof LIZARDS} Lizards */

/**
 * @typedef {object} Lizard
 * @property {{ x: number, y: number }[]} body head first, 3 px
 * @property {number} dir its heading, an index into STEPS
 * @property {number} zip px left in this zip
 * @property {number} movedAt
 * @property {number} restUntil
 * @property {number} mineAt
 * @property {number} eaten
 * @property {{ x: number, y: number, cells: number[] } | null} site
 * @property {number} lookedAt the tick it last looked for a site
 */

const SALT = 0x11a2
const STEPS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
]

/** @param {number} w @param {{ x: number, y: number }} a @param {{ x: number, y: number }} b */
function d2(w, a, b) {
  let dx = Math.abs(a.x - b.x)
  dx = Math.min(dx, w - dx)
  return dx * dx + (a.y - b.y) ** 2
}

/** Open, and 8-bordering a solid pixel: a cave surface. @param {import('./game.js').Game} g @param {number} x @param {number} y */
function surface(g, x, y) {
  const { w, h, tiles } = g.world
  if (y < 1 || y >= h - 1 || !isOpen(tiles[y * w + wrap(x, w)])) return false
  for (const [sx, sy] of STEPS) if (!isOpen(tiles[(y + sy) * w + wrap(x + sx, w)])) return true
  return false
}

/** The nearest ore pixel within r of `at`, or null. @param {import('./game.js').Game} g @param {{ x: number, y: number }} at @param {number} r */
function oreNear(g, at, r) {
  const { w, h, tiles } = g.world
  let best = null
  let bd = Infinity
  for (let dy = -r; dy <= r; dy++) {
    const y = at.y + dy
    if (y < 0 || y >= h) continue
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d > r * r || d >= bd) continue
      const x = wrap(at.x + dx, w)
      if (tiles[y * w + x] !== Tile.Ore) continue
      best = { x, y }
      bd = d
    }
  }
  return best
}

/** The lizards' tick. @param {import('./game.js').Game} g */
export function updateLizards(g) {
  const c = g.cfg.lizards
  const { w } = g.world
  const rng = mulberry32(hashSeed(SALT, g.tick))
  if (g.tick % Math.max(1, c.checkTicks) === 0 && g.lizards.length < c.max) spawn(g, c, rng)
  g.lizards = g.lizards.filter((z, k) => {
    const head = z.body[0]
    if (z.eaten >= c.eat) {
      if (!z.site && g.tick - z.lookedAt >= c.checkTicks) {
        z.lookedAt = g.tick
        z.site = findSite(g, { site: c.site, length: 1 }, head, rng)
      }
      if (!z.site) return true // nowhere to burrow yet: it waits, and looks again checkTicks later
      if (g.tick - z.movedAt < c.zipTicks) return true
      z.movedAt = g.tick
      const s = z.site
      if (head.x === s.x && head.y === s.y) {
        g.world.tiles[s.cells[0]] = Tile.Loot
        g.events.push({ type: 'deposit', cells: s.cells })
        return false
      }
      let dx = s.x - head.x
      if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w
      move(z, { x: wrap(head.x + Math.sign(dx), w), y: head.y + Math.sign(s.y - head.y) })
      return true
    }
    if (g.tick < z.restUntil) {
      // stopped: it mines
      if (g.tick >= z.mineAt) {
        const o = oreNear(g, head, c.reach)
        if (o) {
          toRock(/** @type {any} */ (g), o.x, o.y)
          z.eaten++
          z.mineAt = g.tick + c.mineTicks
          g.events.push({ type: 'licked', x: o.x, y: o.y, by: k })
        }
      }
      return true
    }
    if (!z.zip) z.zip = 4 + (rng() % 9)
    if (g.tick - z.movedAt < Math.max(1, c.zipTicks)) return true
    z.movedAt = g.tick
    step(g, c, z, rng)
    if (--z.zip <= 0) {
      z.zip = 0
      z.restUntil = g.tick + 40 + (rng() % 80)
    }
    return true
  })
}

/** @param {import('./game.js').Game} g @param {Lizards} c @param {() => number} rng */
function spawn(g, c, rng) {
  const { w, h, tiles } = g.world
  const n = Math.max(1, c.near)
  const p = { x: wrap(g.ch.x + (rng() % (2 * n + 1)) - n, w), y: g.ch.y + (rng() % (2 * n + 1)) - n }
  if (p.y < 0 || p.y >= h) return
  let ore = 0
  const r = c.radius
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const y = p.y + dy
      if (y >= 0 && y < h && dx * dx + dy * dy <= r * r && tiles[y * w + wrap(p.x + dx, w)] === Tile.Ore) ore++
    }
  if (ore < c.density) return
  // the nearest surface pixel within the radius
  let best = null
  let bd = Infinity
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d > r * r || d >= bd || !surface(g, p.x + dx, p.y + dy)) continue
      best = { x: wrap(p.x + dx, w), y: p.y + dy }
      bd = d
    }
  if (!best) return
  const b = /** @type {{ x: number, y: number }} */ (best)
  g.lizards.push({ body: [b, { ...b }, { ...b }], dir: rng() % 8, zip: 0, movedAt: g.tick, restUntil: g.tick + 30, mineAt: 0, eaten: 0, site: null, lookedAt: -1e9 })
  g.events.push({ type: 'lizard', x: b.x, y: b.y })
}

/** One px along the surface: toward the nearest ore in sense, else on its heading, else any. @param {import('./game.js').Game} g @param {Lizards} c @param {Lizard} z @param {() => number} rng */
function step(g, c, z, rng) {
  const head = z.body[0]
  const { w } = g.world
  const ok = [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => surface(g, head.x + STEPS[k][0], head.y + STEPS[k][1]))
  if (!ok.length) return
  const at = (/** @type {number} */ k) => ({ x: wrap(head.x + STEPS[k][0], w), y: head.y + STEPS[k][1] })
  const o = oreNear(g, head, c.sense)
  let k = -1
  if (o) {
    let bd = d2(w, head, o)
    for (const j of ok) if (d2(w, at(j), o) < bd) (bd = d2(w, at(j), o)), (k = j)
  }
  if (k < 0 && ok.includes(z.dir) && rng() % 4) k = z.dir
  if (k < 0) k = ok[rng() % ok.length]
  z.dir = k
  move(z, at(k))
}

/** @param {Lizard} z @param {{ x: number, y: number }} p */
function move(z, p) {
  z.body.unshift(p)
  z.body.pop()
}
