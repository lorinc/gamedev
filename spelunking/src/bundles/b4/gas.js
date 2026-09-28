// b4.66's gas (the user: "the mega-worm-made shimmery liquid [should] gradually evaporate, creating 8 particles
// per liquid […] nodes will behave like climate stations"; "I want the vapor to be contained in these closed
// caverns"; "gas needs to be a visual particle effect, not something with persistence"). Every node is a
// station, built or not, eaten or not: `g.gas[node]`, a count, saved. A pool pixel holds `per` (8) particles
// (g.liquid is the count left); every `everyTicks` each pool pixel open to the air above (not under another wet
// pixel: the pool shrinks from the top) gives one to its station and dries at 0. Only the count is sim state;
// the gas the player sees is drawn from it (render.js drawGas), the moving particles from the events.
// b4.67's spread (the user: "use the fire-spread algo to spread the gas particles […] once a node gets
// saturated, it sends half of the surplus further, and it quickly settles"): a station holds `cap` (8) before
// it's saturated; every `spreadTicks` each saturated station sends half its surplus (rounded up) a hop towards
// the nearest station in its cave with room (below cap), split evenly between the neighbours on the way, the
// emptiest first. So a cave fills up to the cap, nearest stations first. A cave with no room left evens out
// instead: to neighbours holding 2 or more less, never past even. The stations take turns in node order, each
// moving the counts as they are then (all at once, like the fire's CA, neighbours swapped places and sent it
// back for ever: seen in the test). Every move goes a hop nearer to room, or narrows a gap, so it settles.
// Claude's calls: the stations and their neighbours are the caves' own shape, not the roots (a third of the
// nodes have no root clear of rock): every open pixel belongs to the node nearest it through open pixels (one
// 4-way flood from all nodes at once, per map; b4's rock never opens), and two stations are neighbours where
// their pixels touch. So gas never crosses rock. A pixel in a pocket with no node (none can be wet: drops fall
// from a node) goes to the nearest node in a straight line.

import { isOpen } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { dist2 } from './game.js'

/** The gas's numbers (the dev panel's). */
export const GAS = {
  per: 40, // particles in a drop of liquid (the user, b4.73: 5× the gas; was 8)
  burst: 5, // particles a surface pixel gives each evaporation (b4.73: 5×, so pools dry as fast as with 8 and 1)
  everyTicks: 300, // a particle off each pool surface pixel every 5 s: a layer of pool in 40 s
  cap: 8, // particles a station holds before it's saturated and passes gas on
  spreadTicks: 30, // a spread step every 0.5 s
  perMoss: 1, // gas a tamed bug's pixel of moss (green back wall) takes from its station (b4.69; 0: free)
}

/**
 * The caves as stations, per map: `own` per pixel its station (-1: rock, or a pocket with no node), `adj` per
 * station its neighbours, ascending. @typedef {{ own: Int32Array, adj: number[][] }} Stations
 */
/** @type {WeakMap<object, Stations>} */
const byMap = new WeakMap()

/** @param {import('./game.js').Game} g @returns {Stations} */
export function stations(g) {
  let s = byMap.get(g.map)
  if (s) return s
  const { w, h, tiles } = g.world
  const own = new Int32Array(w * h).fill(-1)
  /** @type {Set<number>[]} */
  const near = g.map.nodes.map(() => new Set())
  /** @type {number[]} */
  const queue = []
  g.map.nodes.forEach((n, k) => {
    const i = n.y * w + n.x
    if (own[i] < 0 && isOpen(tiles[i])) ((own[i] = k), queue.push(i))
  })
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]
    const x = i % w
    const y = (i - x) / w
    for (let d = 0; d < 4; d++) {
      const ny = d === 2 ? y - 1 : d === 3 ? y + 1 : y
      if (ny < 0 || ny >= h) continue
      const n = ny * w + (d === 0 ? wrap(x - 1, w) : d === 1 ? wrap(x + 1, w) : x)
      if (!isOpen(tiles[n])) continue
      if (own[n] < 0) ((own[n] = own[i]), queue.push(n))
      else if (own[n] !== own[i]) (near[own[n]].add(own[i]), near[own[i]].add(own[n]))
    }
  }
  s = { own, adj: near.map((a) => [...a].sort((p, q) => p - q)) }
  byMap.set(g.map, s)
  return s
}

/** The station of pixel i. @param {import('./game.js').Game} g @param {number} i */
export function stationOf(g, i) {
  const k = stations(g).own[i]
  if (k >= 0) return k
  const { w } = g.world
  const p = { x: i % w, y: Math.floor(i / w) }
  let best = 0
  g.map.nodes.forEach((n, j) => {
    if (dist2(g, n, p) < dist2(g, g.map.nodes[best], p)) best = j
  })
  return best
}

/** The gas's tick. @param {import('./game.js').Game} g */
export function updateGas(g) {
  const c = g.cfg.gas
  if (g.tick % Math.max(1, c.everyTicks) === 0) evaporate(g)
  if (g.tick % Math.max(1, c.spreadTicks) === 0) spread(g)
}

/** @param {import('./game.js').Game} g */
function evaporate(g) {
  const { w } = g.world
  const L = g.liquid
  for (let i = L.length - 1; i >= 0; i--) {
    // bottom up: a pixel under one that dries this pass still counts as covered
    if (!L[i] || (i >= w && L[i - w])) continue // under another wet pixel: not yet
    const node = stationOf(g, i)
    const n = Math.min(L[i], Math.max(1, g.cfg.gas.burst))
    g.gas[node] += n
    L[i] -= n
    if (L[i] === 0) g.ledger.liquid = Math.max(0, g.ledger.liquid - 1)
    g.events.push({ type: 'evaporated', x: i % w, y: Math.floor(i / w), node })
  }
}

/** One step of the spread: saturated stations pass half their surplus on. @param {import('./game.js').Game} g */
function spread(g) {
  const G = g.gas
  const cap = Math.max(0, g.cfg.gas.cap)
  const { adj } = stations(g)
  // each station's hops to the nearest one with room (< cap): -1, none in its cave
  const hops = new Int32Array(G.length).fill(-1)
  /** @type {number[]} */
  const queue = []
  for (let n = 0; n < G.length; n++) if (G[n] < cap) ((hops[n] = 0), queue.push(n))
  for (let q = 0; q < queue.length; q++) for (const v of adj[queue[q]]) if (hops[v] < 0) ((hops[v] = hops[queue[q]] + 1), queue.push(v))
  for (let n = 0; n < G.length; n++) {
    if (G[n] <= cap) continue
    // towards room: the neighbours a hop nearer to it; a full cave: the neighbours holding 2 or more less
    const to = hops[n] > 0 ? adj[n].filter((v) => hops[v] === hops[n] - 1) : adj[n].filter((v) => G[v] < G[n] - 1)
    if (!to.length) continue
    to.sort((a, b) => G[a] - G[b] || a - b)
    const send = Math.ceil((G[n] - cap) / 2)
    const each = Math.floor(send / to.length)
    let extra = send - each * to.length // one more each to the emptiest
    for (const v of to) {
      let k = each + (extra > 0 ? 1 : 0)
      if (extra > 0) extra--
      if (hops[n] < 0) k = Math.min(k, Math.floor((G[n] - G[v]) / 2)) // levelling: never past even (no sloshing)
      if (k <= 0) continue
      G[n] -= k
      G[v] += k
      g.events.push({ type: 'gasFlow', from: n, to: v, n: k })
    }
  }
}
