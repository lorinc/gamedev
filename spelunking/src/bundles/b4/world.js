// b4's world (p11): not b3's generator. At b4.2 (D080, D081) a tile is one pixel of v5's painted map, all of
// it: v6's raster of p7's quad caves as it is (4 px a fine cell, no sampling), from the drawn ice sheet on
// top (v6's, solid) down to the ocean. The pod is its interior open space only (user: the dome's walls
// would delete rock and ore). p10's traverse layer (v8 mode C, D078) is routed over the whole depth, and
// each rail's cells are filled in pixel by pixel. The rock is b3.7's: its ore layer and loot, and its
// soft/hard split for the look (user), all at the map's size, wrapping; no loot since b4.17 (lizards make it). Then b3's probe, pull, pack and
// light run on it unchanged. The world wraps in x, like b3's.

import { QCOLS, QROWS, buildGrid } from '../v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../v5/quadwfc.js'
import { hash11 } from '../v5/wfc.js'
import { SHEET_PX } from '../v6/paint.js'
import { placePod, podPart, POD_H, POD_W } from '../v6/storeys.js'
import { K, OPEN, ROCK, SEA, SKY, rasterize } from '../v6/terrain.js'
import { RKNOBS, rails } from '../v8/rails.js'
import { runLayer } from '../../sim/gen/ca.js'
import { finalGrid } from '../../sim/gen/pipeline.js'
import { STARTER_CAVES } from '../../sim/gen/starterCaves.js'
import { DEFAULT_TERRAIN } from '../../sim/gen/terrain.js'
import { Tile } from '../../sim/gen/world.js'
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
 * @property {Uint8Array} kind per tile: ROCK, OPEN, SHEET, SEA or SPACE; the sheet, the sea and space are
 *   Tile.Hard in `world` (solid), and can't be scanned
 * @property {Uint8ClampedArray} scenery RGBA of the sheet, the space above it and the sea (drawn as they are)
 * @property {Cell} start the bot's tile: the pod's floor, middle
 * @property {number[]} podCells the pod's interior: seen from the start
 * @property {Cell[]} nodes
 * @property {Edge[]} edges
 * @property {number[]} podNodes the nodes inside the pod: on the network from the start
 */

export const SHEET = SKY // v6's sky pixels are the sheet here
export { OPEN, ROCK, SEA }
export const SPACE = 4 // above the sheet's rugged top: out of the map

/** The world's knobs (the dev panel's, and the URL's). */
export const WKNOBS = {
  ore: DEFAULT_TERRAIN.ore.density, // b3.7's ore layer's seed density, permille
  loot: 0, // permille of rock: none (the user, b4.17: only lizards make loot); b3.7's was DEFAULT_TERRAIN.loot
}

/** @type {[number, number, number]} */ const SPACE_RGB = [8, 10, 26]
/** @type {[number, number, number]} */ const SHEET_RGB = [150, 184, 204]
/** @type {[number, number, number]} */ const SHEET2_RGB = [138, 172, 194]
/** @type {[number, number, number]} */ const WATER_RGB = [5, 11, 40]

/**
 * @param {number} seed @param {typeof WKNOBS} [k]
 * @returns {Map & { ms: Record<string, number> }}
 */
export function makeMap(seed, k = WKNOBS) {
  /** @type {Record<string, number>} */
  const ms = {}
  let t0 = performance.now()
  const lap = (/** @type {string} */ name) => {
    const t = performance.now()
    ms[name] = Math.round(t - t0)
    t0 = t
  }
  const G = buildGrid(seed, QKNOBS.relax, QCOLS, QROWS)
  const T = rasterize(G, generateQuads(G, seed, QKNOBS))
  lap('caves')
  const pod = placePod(T)
  /** @type {number[]} */
  const podPx = [] // T's pixels of the pod's interior
  if (pod) {
    // the interior only (user, D079): open where the dome's inside is, nothing else changed
    const ro = (POD_W / 2) * K
    for (let dx = -ro; dx < ro; dx++)
      for (let dy = 0; dy <= POD_H * K; dy++) {
        const y = pod.base - dy
        if (y < 0 || podPart(dx, dy) !== 2) continue
        const i = y * T.w + ((((pod.c + dx) % T.w) + T.w) % T.w)
        T.cls[i] = OPEN
        podPx.push(i)
      }
  }
  // the network over the whole depth (D081), not v7's ice-only frame
  const net = rails(T, G, { top: 0, rows: T.h }, 'C', RKNOBS, seed)
  lap('rails')

  // the world: the sheet's rows over T, down to a little below the lowest pixel that isn't sea
  const w = T.w
  let low = 0
  for (let i = 0; i < T.cls.length; i++) if (T.cls[i] !== SEA) low = Math.max(low, Math.floor(i / w))
  const top = SHEET_PX
  const h = Math.min(top + T.h, (top + low + 2 * K + 1) & ~1) // even: the hard/soft recipe halves it
  const tiles = new Uint8Array(w * h)
  const kind = new Uint8Array(w * h)
  const scenery = new Uint8ClampedArray(w * h * 4)
  // b3.7's rock: the ore layer and the soft/hard split (the cave recipe again, 12× across and 2× down,
  // so its base is w / 12 × h / 2 and it wraps with no seam), both at the map's size
  const ore = runLayer({ ...DEFAULT_TERRAIN.ore, density: k.ore }, w, h, mulberry32(hashSeed(seed, 3)))
  const hard = finalGrid({ ...STARTER_CAVES, width: w / 12, height: h / 2, seed: hashSeed(seed, 2) })
  const lootRng = mulberry32(hashSeed(seed, 4))
  lap('rock')
  const noise = sheetNoise(w, seed)
  for (let x = 0; x < w; x++) {
    // v6's sheet (paintStoreys): a rugged top of two octaves, wavy strata in two shades, stars above
    const sheetTop = Math.round(SHEET_PX * 0.35 + noise(x, 12 * K, 91) * 3 * K + noise(x, 3 * K, 92) * K)
    for (let y = 0; y < h; y++) {
      const i = y * w + x
      const ty = y - top
      const c = ty < 0 ? SKY : T.cls[ty * w + x]
      let rgb = null
      if (c === SKY) {
        if (y < sheetTop) {
          kind[i] = SPACE
          rgb = hash11(seed, 93, y * w + x) > 0.99 ? [200, 200, 220] : SPACE_RGB
        } else {
          kind[i] = SHEET
          const s = Math.floor((y + noise(x, 8 * K, 94 + ((y / (2 * K)) | 0)) * K) / (2 * K)) & 1
          rgb = y === sheetTop ? [0, 0, 0] : s ? SHEET_RGB : SHEET2_RGB
        }
        tiles[i] = Tile.Hard
      } else if (c === SEA) {
        kind[i] = SEA
        rgb = WATER_RGB
        tiles[i] = Tile.Hard // the sea under the ice: nothing to pass or scan (no diving)
      } else if (c === OPEN) {
        kind[i] = OPEN
        tiles[i] = Tile.Open
      } else {
        kind[i] = ROCK
        if (ore.cells[i]) tiles[i] = Tile.Ore
        else if (chance(lootRng, k.loot)) tiles[i] = Tile.Loot
        else if (hard.cells[i]) tiles[i] = Tile.Hard
        else tiles[i] = Tile.Soft
      }
      if (rgb) scenery.set([rgb[0], rgb[1], rgb[2], 255], i * 4)
    }
  }
  lap('tiles')

  // nodes at their cells' centres (the router's), in world px; each rail's cells filled in pixel by pixel
  const at = (/** @type {number} */ px, /** @type {number} */ py) => ({ x: ((Math.floor(px) % w) + w) % w, y: Math.floor(py) + top })
  const nodes = net.nodes.map((n) => at(n.x, n.y))
  const same = (/** @type {Cell} */ p, /** @type {Cell} */ q) => p.x === q.x && p.y === q.y
  const edges = net.rails
    .map((r) => ({
      a: r.a,
      b: r.b,
      path: fill(
        (r.path ?? []).map(([px, py]) => at(px, py)),
        w,
      ),
    }))
    .filter((e) => e.path.length > 1 && same(e.path[0], nodes[e.a]) && same(e.path[e.path.length - 1], nodes[e.b]))
    .filter((e) => e.path.every((c) => c.y >= 0 && c.y < h))

  // the pod: its floor's middle is the start, its interior is seen from the start
  const podCells = podPx.map((i) => (Math.floor(i / w) + top) * w + (i % w)).filter((i) => i < w * h)
  const inPod = new Set(podCells)
  const podNodes = [...new Set(edges.flatMap((e) => [e.a, e.b]))]
    .filter((n) => inPod.has(nodes[n].y * w + nodes[n].x))
    .sort((a, b) => a - b)
  let start = pod ? { x: pod.c % w, y: pod.base + top } : { x: w >> 1, y: h >> 1 }
  if (tiles[start.y * w + start.x] !== Tile.Open) start = podCells.length ? { x: podCells[0] % w, y: Math.floor(podCells[0] / w) } : start
  lap('network')
  return { world: { w, h, tiles }, kind, scenery, start, podCells, nodes, edges, podNodes, ms }
}

/** A cell path (points 4 px apart, 8-way) as every pixel on it, each an 8-way step from the last. @param {Cell[]} p @param {number} w */
function fill(p, w) {
  /** @type {Cell[]} */
  const out = p.length ? [p[0]] : []
  for (let i = 1; i < p.length; i++) {
    let dx = p[i].x - p[i - 1].x
    if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w // across the wrap
    const dy = p[i].y - p[i - 1].y
    const n = Math.max(Math.abs(dx), Math.abs(dy))
    for (let s = 1; s <= n; s++)
      out.push({ x: (((p[i - 1].x + Math.round((dx * s) / n)) % w) + w) % w, y: p[i - 1].y + Math.round((dy * s) / n) })
  }
  return out
}

/** v6's smooth noise for the sheet, periodic in the map's width. @param {number} w @param {number} seed */
function sheetNoise(w, seed) {
  return (/** @type {number} */ x, /** @type {number} */ period, /** @type {number} */ salt) => {
    const n = Math.max(2, Math.round(w / period))
    const f = (x / w) * n
    const i = Math.floor(f)
    const t = f - i
    const s = t * t * (3 - 2 * t)
    const knot = (/** @type {number} */ j) => hash11(seed, salt, ((j % n) + n) % n)
    return knot(i) * (1 - s) + knot(i + 1) * s
  }
}
