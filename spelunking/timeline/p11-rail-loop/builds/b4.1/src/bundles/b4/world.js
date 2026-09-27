// b4's world (p11, D079): not b3's generator. p7's quad caves (the ice layer), the pod as its interior open
// space only (user: the dome's walls would delete rock and ore), p10's traverse layer (v8 mode C, D078) and
// b3's CA ore layer over the rock, all turned into b3's tile world (one tile = one fine cell), so b3's probe,
// pull, pack and light run on it unchanged. The world wraps in x, like b3's.

import { QCOLS, QROWS, buildGrid } from '../v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../v5/quadwfc.js'
import { placePod, podPart, POD_H, POD_W } from '../v6/storeys.js'
import { K, OPEN, ROCK, SKY, rasterize } from '../v6/terrain.js'
import { frame } from '../v7/paint.js'
import { RKNOBS, rails } from '../v8/rails.js'
import { runLayer } from '../../sim/gen/ca.js'
import { DEFAULT_PARAMS, Tile } from '../../sim/gen/world.js'
import { chance, hashSeed, mulberry32 } from '../../sim/rng.js'

/** @typedef {import('../../sim/gen/world.js').World} World */
/** @typedef {{ x: number, y: number }} Cell */
/**
 * @typedef {object} Edge a monorail the player can build (D078's routed rail)
 * @property {number} a
 * @property {number} b node indices
 * @property {Cell[]} path its tiles from a to b, a's and b's included, each an 8-way step from the last
 */
/**
 * @typedef {object} Map
 * @property {World} world
 * @property {Cell} start the bot's tile: the pod's floor, middle
 * @property {{ x0: number, x1: number, y0: number, y1: number }} pod its interior's bounding tiles (x0 may exceed x1 across the wrap)
 * @property {Cell[]} nodes
 * @property {Edge[]} edges
 * @property {number[]} podNodes the nodes inside the pod: revealed from the start
 */

/** The world's knobs (the dev panel's, and the URL's). */
export const WKNOBS = {
  ore: 380, // the ore layer's seed density, permille (b3's 280 leaves 20–60 ore tiles on this small map)
}

/**
 * @param {number} seed @param {typeof WKNOBS} [k]
 * @returns {Map}
 */
export function makeMap(seed, k = WKNOBS) {
  const G = buildGrid(seed, QKNOBS.relax, QCOLS, QROWS)
  const T = rasterize(G, generateQuads(G, seed, QKNOBS))
  const pod = placePod(T)
  if (pod) {
    // the interior only (user, D079): open where the dome's inside is, nothing else changed
    const ro = (POD_W / 2) * K
    for (let dx = -ro; dx < ro; dx++)
      for (let dy = 0; dy <= POD_H * K; dy++) {
        const y = pod.base - dy
        if (y >= 0 && podPart(dx, dy) === 2) T.cls[y * T.w + ((((pod.c + dx) % T.w) + T.w) % T.w)] = OPEN
      }
  }
  const F = frame(T)
  const net = rails(T, G, F, 'C', RKNOBS, seed)

  const w = T.w / K
  const y0 = Math.floor(F.top / K)
  const h = Math.ceil(F.rows / K)
  // the ore layer wants a height divisible by 2^stepsY
  const oreP = { ...DEFAULT_PARAMS.ore, density: k.ore }
  const hh = Math.ceil(h / (1 << oreP.stepsY)) * (1 << oreP.stepsY)
  const ore = runLayer(oreP, w, hh, mulberry32(hashSeed(seed, 3)))
  const lootRng = mulberry32(hashSeed(seed, 4))
  const tiles = new Uint8Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // a tile is what its centre pixel is: the router samples it the same way
      const py = (y0 + y) * K + (K >> 1)
      const c = py >= T.h ? ROCK : T.cls[py * T.w + x * K + (K >> 1)]
      const i = y * w + x
      if (c === SKY) tiles[i] = Tile.Sky
      else if (c === OPEN) tiles[i] = Tile.Open
      else if (c !== ROCK)
        tiles[i] = Tile.Hard // the sea under the ice: a floor you can't pass
      else if (ore.cells[i]) tiles[i] = Tile.Ore
      else if (chance(lootRng, DEFAULT_PARAMS.loot)) tiles[i] = Tile.Loot
      else tiles[i] = Tile.Soft
    }

  const cellOf = (/** @type {number} */ px, /** @type {number} */ py) => ({ x: Math.floor(px / K) % w, y: Math.floor(py / K) - y0 })
  const nodes = net.nodes.map((n) => cellOf(n.x, n.y))
  const same = (/** @type {Cell} */ p, /** @type {Cell} */ q) => p.x === q.x && p.y === q.y
  // at the frame's bottom edge the router clamps a node's tile into the frame: such rails are dropped
  const edges = net.rails
    .map((r) => ({ a: r.a, b: r.b, path: (r.path ?? []).map(([px, py]) => cellOf(px, py)) }))
    .filter((e) => e.path.length > 1 && same(e.path[0], nodes[e.a]) && same(e.path[e.path.length - 1], nodes[e.b]))
    .filter((e) => e.path.every((c) => c.y >= 0 && c.y < h))
  // only nodes some edge uses are nodes in play
  const used = new Set(edges.flatMap((e) => [e.a, e.b]))

  const base = pod ? Math.floor(pod.base / K) - y0 : Math.floor(h / 2)
  const pc = pod ? Math.floor(pod.c / K) : Math.floor(w / 2)
  const box = { x0: pc - POD_W / 2 + 1, x1: pc + POD_W / 2 - 2, y0: base - POD_H + 1, y1: base }
  let start = { x: pc, y: base }
  // the pod's floor may be a tile off after rounding: the lowest open tile of the pod's middle column
  for (let y = box.y1; y >= box.y0; y--)
    if (tiles[y * w + pc] === Tile.Open) {
      start = { x: pc, y }
      break
    }
  const inPod = (/** @type {Cell} */ c) => {
    const dx = ((((c.x - pc) % w) + w + w / 2) % w) - w / 2
    return dx >= box.x0 - pc && dx <= box.x1 - pc && c.y >= box.y0 && c.y <= box.y1
  }
  const podNodes = [...used].filter((i) => inPod(nodes[i]))
  return { world: { w, h, tiles }, start, pod: box, nodes, edges, podNodes }
}
