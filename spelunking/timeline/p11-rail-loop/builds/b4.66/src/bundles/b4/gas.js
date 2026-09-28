// b4.66's gas (the user: "the mega-worm-made shimmery liquid [should] gradually evaporate, creating 8 particles
// per liquid […] nodes will behave like climate stations"; "I want the vapor to be contained in these closed
// caverns"; "I do not need pressure, saturation, just gas presence"; a station has no cap, "we will do something
// with the gas levels"). Every node is a station, built or not, eaten or not: `g.gas[node]`, a count, saved.
// A pool pixel holds `per` (8) particles (g.liquid is the count left); every `everyTicks` each pool pixel open
// to the air above (not under another wet pixel: the pool shrinks from the top) gives one to its station and
// dries at 0. Its station: the nearest node through open pixels (a 4-way flood, so the gas never crosses rock:
// b4's rock never opens), none within `reach` pixels flooded → the nearest in a straight line. Only the count
// is sim state; the gas the player sees is drawn from it (render.js drawGas), the rising particles from the
// `evaporated` events.

import { isOpen } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { dist2 } from './game.js'

/** The gas's numbers (the dev panel's). */
export const GAS = {
  per: 8, // particles in a drop of liquid
  everyTicks: 300, // a particle off each pool surface pixel every 5 s: a layer of pool in 40 s
  reach: 20000, // pixels the flood to a station looks through before it gives up
}

/** Per game: pixel → its station (the map never opens rock, so it holds). Not saved: rebuilt as needed. @type {WeakMap<object, Map<number, number>>} */
const memo = new WeakMap()
/** Per map: node pixel → node. @type {WeakMap<object, Map<number, number>>} */
const nodePx = new WeakMap()

/** The station of pixel i. @param {import('./game.js').Game} g @param {number} i */
export function stationOf(g, i) {
  let m = memo.get(g)
  if (!m) memo.set(g, (m = new Map()))
  let s = m.get(i)
  if (s === undefined) m.set(i, (s = find(g, i)))
  return s
}

/** @param {import('./game.js').Game} g @param {number} start */
function find(g, start) {
  const { w, h, tiles } = g.world
  let at = nodePx.get(g.map)
  if (!at) {
    at = new Map()
    g.map.nodes.forEach((n, k) => at?.set(n.y * w + n.x, k))
    nodePx.set(g.map, at)
  }
  const seen = new Set([start])
  const queue = [start]
  for (let q = 0; q < queue.length && q < g.cfg.gas.reach; q++) {
    const i = queue[q]
    const k = at.get(i)
    if (k !== undefined) return k
    const x = i % w
    const y = (i - x) / w
    for (const [nx, ny] of [
      [wrap(x - 1, w), y],
      [wrap(x + 1, w), y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (ny < 0 || ny >= h) continue
      const n = ny * w + nx
      if (seen.has(n) || !isOpen(tiles[n])) continue
      seen.add(n)
      queue.push(n)
    }
  }
  const p = { x: start % w, y: Math.floor(start / w) }
  let best = 0
  g.map.nodes.forEach((n, k) => {
    if (dist2(g, n, p) < dist2(g, g.map.nodes[best], p)) best = k
  })
  return best
}

/** The gas's tick. @param {import('./game.js').Game} g */
export function updateGas(g) {
  const every = Math.max(1, g.cfg.gas.everyTicks)
  if (g.tick % every) return
  const { w } = g.world
  const L = g.liquid
  for (let i = L.length - 1; i >= 0; i--) {
    // bottom up: a pixel under one that dries this pass still counts as covered
    if (!L[i] || (i >= w && L[i - w])) continue // under another wet pixel: not yet
    const node = stationOf(g, i)
    g.gas[node]++
    if (--L[i] === 0) g.ledger.liquid = Math.max(0, g.ledger.liquid - 1)
    g.events.push({ type: 'evaporated', x: i % w, y: Math.floor(i / w), node })
  }
}
