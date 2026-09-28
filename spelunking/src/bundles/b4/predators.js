// b4.72's predators (the user: "a pink predator, with a bright tip, that spawns at places with a lot of bugs, hangs
// from the ceiling like a string, and when a bug comes in contact with it, it pulls it back into the stone and
// creates 3 ores. Can repeat 5 times before despawning"; asked: it eats tamed and wild bugs alike, a tamed one is
// gone for good (the ledger's bugs −1); "at most 1 predator per 4 nodes at a time… this will be the main ore
// replenisher"). Every `spawnTicks`, while there are fewer than built nodes / `perNodes`, the bug (tamed or wild)
// with the most other bugs within `crowdR` px, `crowd` or more, calls one: straight up from it through open air
// (at most `up` px) to the rock, the predator anchors on the open pixel under it and hangs down to the next rock
// or `length` px. Not within `crowdR` of another. A bug on the string or next to it (in the air too) is caught:
// gone at once (event `caught`: the view pulls it up the string), and the `ore` (3) rock pixels nearest the
// anchor turn to ore. After `meals` (5) catches it withdraws into the rock (event `predatorGone`).
// Randomness: none (the most crowded bug, then the first).
// b4.73 (the user: "the predator itself should pull back into the rock too with the prey, then slowly
// re-descend"): the string has a length now (`len`, up to `full`). It comes down from the rock a pixel every
// `descendTicks` (a new one too); a catch hauls it up a pixel every `retractTicks` with the prey on its tip
// (the view draws it there), and only then, in the rock, the ore appears (event `predatorOre`). Hauling up, it
// catches nothing. After its last meal it doesn't come down again: it's gone.

import { isOpen, Tile } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { builtNodes } from './beasts.js'
import { dist2 } from './game.js'

/** The predators' numbers (the dev panel's). */
export const PREDATORS = {
  perNodes: 4, // at most one per this many built nodes (the user)
  spawnTicks: 600, // it looks for a crowd every 10 s
  crowd: 6, // bugs round one bug (it too) that call a predator
  crowdR: 24, // px
  up: 32, // px it looks up from the crowd for a ceiling
  length: 16, // px the string hangs down at most
  retractTicks: 3, // ticks a px, hauling a catch up (16 px in 0.8 s)
  descendTicks: 30, // ticks a px, coming down (16 px in 8 s)
  ore: 3, // ore pixels a catch makes (the user)
  meals: 5, // catches before it withdraws (the user)
}

/**
 * @typedef {object} Predator anchored on the open pixel (x, y) under the rock; the string covers y … y + len − 1
 * @property {number} x
 * @property {number} y
 * @property {number} len its length now, 0 (in the rock) … full
 * @property {number} full its length hanging all the way down
 * @property {number} meals
 * @property {number} at the tick its length last changed
 * @property {0 | 1 | 2} prey hauling up: 0 nothing, 1 a tamed bug, 2 a wild one
 */

/** @param {import('./game.js').Game} g @param {number} x @param {number} y */
const open = (g, x, y) => y >= 0 && y < g.world.h && isOpen(g.world.tiles[y * g.world.w + wrap(x, g.world.w)])

/** The predators' tick. @param {import('./game.js').Game} g */
export function updatePredators(g) {
  const c = g.cfg.predators
  if (g.tick % Math.max(1, c.spawnTicks) === 0 && g.predators.length < Math.floor(builtNodes(g) / Math.max(1, c.perNodes))) spawn(g, c)
  for (const p of g.predators) {
    if (p.prey) {
      if (g.tick - p.at < Math.max(1, c.retractTicks)) continue
      p.at = g.tick
      if (--p.len > 0) continue
      const cells = oreAround(g, p, c.ore) // in the rock with it: the ore
      for (const i of cells) g.world.tiles[i] = Tile.Ore
      g.events.push({ type: 'predatorOre', x: p.x, y: p.y, cells, tame: p.prey === 1 })
      p.prey = 0
      continue
    }
    if (p.len < p.full && p.meals < c.meals && g.tick - p.at >= Math.max(1, c.descendTicks)) ((p.len++), (p.at = g.tick))
    // one catch a haul: a tamed bug first, then a wild one
    const t = g.swarm.find((b) => touches(g, p, b))
    if (t) {
      g.swarm.splice(g.swarm.indexOf(t), 1)
      g.ledger.bugs = Math.max(0, g.ledger.bugs - 1)
      eat(g, p, t, true)
      continue
    }
    const wb = g.bugs.find((b) => b.kind === 'wild' && touches(g, p, b))
    if (wb) {
      g.bugs.splice(g.bugs.indexOf(wb), 1)
      g.refill[wb.block] = g.tick + g.cfg.bugs.refillTicks
      eat(g, p, wb, false)
    }
  }
  g.predators = g.predators.filter((p) => {
    if (p.meals < c.meals || p.prey || p.len > 0) return true
    g.events.push({ type: 'predatorGone', x: p.x, y: p.y })
    return false
  })
}

/** On the string or next to it. @param {import('./game.js').Game} g @param {Predator} p @param {{ x: number, y: number }} b */
function touches(g, p, b) {
  if (p.prey || p.len <= 0 || p.meals >= g.cfg.predators.meals) return false
  let dx = Math.abs(b.x - p.x)
  dx = Math.min(dx, g.world.w - dx)
  return dx <= 1 && b.y >= p.y - 1 && b.y <= p.y + p.len
}

/** @param {import('./game.js').Game} g @param {Predator} p @param {{ x: number, y: number }} b @param {boolean} tame */
function eat(g, p, b, tame) {
  p.meals++
  p.prey = tame ? 1 : 2
  p.at = g.tick
  g.events.push({ type: 'caught', x: b.x, y: b.y, px: p.x, py: p.y, tame })
}

/** The n rock pixels (not ore or crystal) nearest the anchor, then in reading order. @param {import('./game.js').Game} g @param {Predator} p @param {number} n */
function oreAround(g, p, n) {
  const { w, h, tiles } = g.world
  /** @type {[number, number][]} */
  const found = []
  for (let r = 1; r <= 8 && found.length < n; r++) {
    found.length = 0
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const y = p.y + dy
        if (y < 0 || y >= h || dx * dx + dy * dy > r * r) continue
        const i = y * w + wrap(p.x + dx, w)
        if (tiles[i] === Tile.Soft || tiles[i] === Tile.Hard) found.push([dx * dx + dy * dy, i])
      }
  }
  found.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return found.slice(0, n).map((f) => f[1])
}

/** @param {import('./game.js').Game} g @param {typeof PREDATORS} c */
function spawn(g, c) {
  const all = [...g.swarm, ...g.bugs.filter((b) => b.kind === 'wild')]
  const r2 = c.crowdR * c.crowdR
  /** @type {{ x: number, y: number } | null} */
  let best = null
  let most = c.crowd - 1
  for (const b of all) {
    if (g.predators.some((p) => dist2(g, p, b) <= r2)) continue
    const n = all.reduce((k, o) => k + (dist2(g, o, b) <= r2 ? 1 : 0), 0)
    if (n > most) ((most = n), (best = b))
  }
  if (!best) return
  let y = best.y
  while (y > 0 && best.y - y < c.up && open(g, best.x, y - 1)) y--
  if (open(g, best.x, y - 1) || y <= 0) return // no ceiling within `up`
  let len = 1
  while (len < c.length && open(g, best.x, y + len)) len++
  g.predators.push({ x: best.x, y, len: 0, full: len, meals: 0, at: g.tick, prey: 0 }) // it comes down from the rock
  g.events.push({ type: 'predator', x: best.x, y })
}
