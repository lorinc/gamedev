// b4.73's hives (the user: "near a lot of ore, spawn hives. hives spawn 3 moths (tame bugs) before they shrink and
// despawn"). Every `everyTicks`, while there are fewer than `max`, a random network node (the pod's count from
// the start) looks within `look` px for the wall pixel (open, rock beside it) with the most ore within `radius`
// px, `ore` or more, not within `apart` px of another hive: a hive grows there. Every `birthTicks` it hatches a
// moth: +1 bug on the ledger, a worker that starts at the hive as a moth (swarm.js `hatch`; it fades like any
// after 30 s with no unit, and comes back a jumper). After `moths` it shrinks for `shrinkTicks`, then it's gone.
// Randomness from the tick, so runs repeat.

import { wrap } from '../../sim/dig/rules.js'
import { Tile } from '../../sim/gen/world.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { onWall } from './bounce.js'
import { dist2 } from './game.js'
import { hatch } from './swarm.js'

/** The hives' numbers (the dev panel's). */
export const HIVES = {
  everyTicks: 1800, // a hive looks for a site every 30 s (the user, b4.74: 2×; was a minute)
  max: 1, // hives at once (at 20 s and 2, an idle game hatched ~90 bugs in 10 min)
  look: 48, // px round a network node it looks within
  radius: 12, // px round a site the ore is counted within
  ore: 20, // ore pixels there, at least
  apart: 32, // px between hives
  moths: 3, // moths a hive hatches (the user)
  birthTicks: 300, // a moth every 5 s
  shrinkTicks: 300, // 5 s shrinking, then gone
}

/** @typedef {{ x: number, y: number, born: number, at: number, shrink: number }} Hive on the wall pixel (x, y); `shrink` the tick it began to shrink, or -1 */

const SALT = 0x4815
const GRID = 3 // px between the sites it tries

/** The hives' tick. @param {import('./game.js').Game} g */
export function updateHives(g) {
  const c = g.cfg.hives
  if (g.tick % Math.max(1, c.everyTicks) === 0 && g.hives.length < c.max) grow(g, c)
  for (const h of g.hives) {
    if (h.shrink >= 0) continue
    if (g.tick - h.at < Math.max(1, c.birthTicks)) continue
    h.at = g.tick
    h.born++
    hatch(g, h)
    g.events.push({ type: 'hatched', x: h.x, y: h.y })
    if (h.born >= c.moths) h.shrink = g.tick
  }
  g.hives = g.hives.filter((h) => {
    if (h.shrink < 0 || g.tick - h.shrink < c.shrinkTicks) return true
    g.events.push({ type: 'hiveGone', x: h.x, y: h.y })
    return false
  })
}

/** Ore pixels within r px of (x, y). @param {import('./game.js').Game} g @param {number} x @param {number} y @param {number} r */
function oreNear(g, x, y, r) {
  const { w, h, tiles } = g.world
  let n = 0
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const yy = y + dy
      if (yy >= 0 && yy < h && dx * dx + dy * dy <= r * r && tiles[yy * w + wrap(x + dx, w)] === Tile.Ore) n++
    }
  return n
}

/** @param {import('./game.js').Game} g @param {typeof HIVES} c */
function grow(g, c) {
  /** @type {number[]} */
  const on = []
  g.net.forEach((v, i) => v && on.push(i))
  if (!on.length) return
  const rng = mulberry32(hashSeed(SALT, g.tick))
  const n = g.map.nodes[on[rng() % on.length]]
  const a2 = c.apart * c.apart
  /** @type {{ x: number, y: number } | null} */
  let best = null
  let most = c.ore - 1
  for (let dy = -c.look; dy <= c.look; dy += GRID)
    for (let dx = -c.look; dx <= c.look; dx += GRID) {
      const x = wrap(n.x + dx, g.world.w)
      const y = n.y + dy
      if (dx * dx + dy * dy > c.look * c.look || !onWall(g, x, y)) continue
      if (g.hives.some((h) => dist2(g, h, { x, y }) <= a2)) continue
      const k = oreNear(g, x, y, c.radius)
      if (k > most) ((most = k), (best = { x, y }))
    }
  if (!best) return
  g.hives.push({ ...best, born: 0, at: g.tick, shrink: -1 })
  g.events.push({ type: 'hive', x: best.x, y: best.y })
}
