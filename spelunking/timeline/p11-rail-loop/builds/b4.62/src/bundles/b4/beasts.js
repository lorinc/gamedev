// b4.59's mega beasts (the user: "at 16/32/... node count add 1-1 mega beast to the pool. These are like Dune
// sandworms, you do not see them, just the massive tremor and a shadow as they tunnel below the surface. They eat
// one bulb every 5 minutes. […] they just pull the bulb back into the backwall and 24 shimmery liquid particle
// drops from the bulb's location and flows down and settles in natural cave pools"). The user's answers: a beast
// joins at 16, 32, 64… built nodes and stays; it picks a random built bulb within `near` px of you (none: it
// waits), never the one holding you or an end of the root you ride; the node and every root touching it go
// (they can be built again); the liquid stays in the pools for good and the ledger counts it (nothing
// collects it yet: "I will want to use these pools for some interactions").
// Claude's calls: pod nodes are never eaten (home: else the whole network could go, with nothing left to build
// from), and they stay on the network. A beast's approach: `warnTicks` (5 s) before the bite it picks its bulb
// and starts from a spot `from` px away in a random direction (the view slides a shadow from there and shakes).
// The drops settle here, in the sim, one after another (so they stack): down while the pixel below is open and
// dry, else down-left / down-right, else along the row towards the nearest dry drop within `spread` px, else
// there. The path each takes rides on the event for the view to animate. Randomness from the tick (rng.js).

import { isOpen } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { dist2 } from './game.js'

/** The beasts' numbers (the dev panel's). */
export const BEASTS = {
  first: 16, // built nodes for the first beast; each next at twice the last
  everyTicks: 18000, // a meal every 5 min, each beast
  warnTicks: 300, // the shadow's 5 s approach
  near: 50, // px from you the bulb must be ("on screen")
  from: 48, // px away the shadow starts
  drops: 24,
  spread: 32, // px a drop looks along a row for a way down
}
/** @typedef {typeof BEASTS} Beasts */

/**
 * @typedef {object} Beast
 * @property {number} due the tick of its next meal (its approach starts warnTicks before)
 * @property {number | null} node the bulb it's heading for
 * @property {{ x: number, y: number }} from where its shadow starts
 */

const SALT = 0xbea5

/** Built nodes: the ends of built roots (the ledger's row). @param {import('./game.js').Game} g */
export const builtNodes = (g) => g.railed.reduce((a, b) => a + b, 0)

/** Can a beast eat node i now? @param {import('./game.js').Game} g @param {number} i */
function edible(g, i) {
  if (!g.railed[i] || g.map.podNodes.includes(i) || g.engulf === i) return false
  const run = g.ride?.run
  if (g.ride && g.ride.node === i) return false
  if (run) {
    const e = g.map.edges[run.edge]
    if (e.a === i || e.b === i) return false
  }
  return dist2(g, g.map.nodes[i], g.ch) <= g.cfg.beasts.near ** 2
}

/** The beasts' tick. @param {import('./game.js').Game} g */
export function updateBeasts(g) {
  const c = g.cfg.beasts
  if (g.tick % 60 === 0) while (builtNodes(g) >= Math.max(1, c.first) * 2 ** g.beasts.length) {
    g.beasts.push({ due: g.tick + c.everyTicks, node: null, from: { x: 0, y: 0 } })
    g.events.push({ type: 'beast', count: g.beasts.length })
  }
  g.beasts.forEach((b, k) => {
    if (g.tick < b.due - c.warnTicks) return
    const rng = mulberry32(hashSeed(SALT, g.tick, k))
    if (b.node !== null && !edible(g, b.node)) b.node = null // it can't have that one now: it looks again
    if (b.node === null) {
      if (g.tick % 60 !== 0) return
      const ok = g.map.nodes.map((_, i) => i).filter((i) => edible(g, i))
      if (!ok.length) return // nothing in view: it waits
      b.node = ok[rng() % ok.length]
      b.due = g.tick + c.warnTicks
      const n = g.map.nodes[b.node]
      const a = ((rng() % 3600) / 3600) * Math.PI * 2
      b.from = { x: wrap(n.x + Math.round(Math.cos(a) * c.from), g.world.w), y: n.y + Math.round(Math.sin(a) * c.from) }
      g.events.push({ type: 'beastComing', beast: k, node: b.node, from: b.from, x: n.x, y: n.y })
      return
    }
    if (g.tick < b.due) return
    eat(g, b.node, rng)
    b.node = null
    b.due = g.tick + c.everyTicks
  })
}

/** The bite: the node and its roots go, the drops settle. @param {import('./game.js').Game} g @param {number} i @param {() => number} rng */
function eat(g, i, rng) {
  const ends = new Set([i])
  for (const k of g.links[i])
    if (g.built[k]) {
      g.built[k] = 0
      const e = g.map.edges[k]
      ends.add(e.a).add(e.b)
    }
  for (const n of ends) {
    const on = g.links[n].some((k) => g.built[k]) || g.map.podNodes.includes(n)
    g.railed[n] = on ? 1 : 0
    g.net[n] = on ? 1 : 0
  }
  const at = g.map.nodes[i]
  /** @type {number[][]} */
  const paths = []
  for (let d = 0; d < Math.max(0, g.cfg.beasts.drops); d++) paths.push(drop(g, at, rng))
  g.ledger.liquid += paths.length
  g.events.push({ type: 'beastAte', node: i, x: at.x, y: at.y, paths })
}

/** One drop from `at`, settled; its path, pixel indices, the last its rest. @param {import('./game.js').Game} g @param {{ x: number, y: number }} at @param {() => number} rng */
function drop(g, at, rng) {
  const { w, h, tiles } = g.world
  const dry = (/** @type {number} */ x, /** @type {number} */ y) => y >= 0 && y < h && isOpen(tiles[y * w + wrap(x, w)]) && !g.liquid[y * w + wrap(x, w)]
  let x = at.x
  let y = at.y
  /** @type {number[]} */
  const path = [y * w + x]
  for (let s = 0; s < 4000; s++) {
    if (dry(x, y + 1)) y++
    else {
      const side = rng() % 2 ? 1 : -1
      if (dry(x + side, y + 1)) ((x += side), y++)
      else if (dry(x - side, y + 1)) ((x -= side), y++)
      else {
        // along the row, to the nearest spot with a way down
        let go = 0
        for (let d = 1; d <= g.cfg.beasts.spread && !go; d++)
          for (const dir of [side, -side]) {
            let clear = true
            for (let t = 1; t <= d && clear; t++) clear = dry(x + dir * t, y)
            if (clear && dry(x + dir * d, y + 1)) {
              go = dir
              break
            }
          }
        if (!go) break
        x += go
      }
    }
    x = wrap(x, w)
    path.push(y * w + x)
  }
  const i = y * w + x
  if (!g.liquid[i] && isOpen(tiles[i])) g.liquid[i] = 1
  return path
}
