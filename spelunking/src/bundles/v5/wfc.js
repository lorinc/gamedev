// Wave function collapse on the hex map. Each hex holds a domain of possible tiles (a bitset). Pick the
// undecided hex with the lowest entropy (from base weights), choose a tile by its context weight (base ×
// Markov affinities to the collapsed neighbours × corridor and wall continuation), then propagate
// (AC-3) across the wrap. A contradiction restarts with the next sub-seed.

import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { COLS, FW, N, NEIGHBOURS, ROWS, centre } from './hex.js'
import { JUNCTION, OPEN, PASSAGE, POCKET, SOLID, WALL, reversed, sideCode } from './tiles.js'

/** @typedef {import('./tiles.js').Tile} Tile */

export const BANDS = ['surface', 'ice', 'pudding', 'brine', 'ocean']
export const SURFACE = 0
export const ICE = 1
export const PUDDING = 2
export const BRINE = 3
export const OCEAN = 4

/** The defaults, one object: the page's sliders edit a copy. */
export const KNOBS = {
  openIce: 0.3, // how open each layer is (0 all rock … 1 all cave)
  openPudding: 0.35,
  openBrine: 0.3,
  grow: 2, // caves grow: open next to open
  rock: 3, // rock grows: solid next to solid (and next to the corridors cut through it)
  cont: 4, // a corridor runs on straight
  turn: 1.5, // … or turns
  branch: 0.7, // … or branches (a junction)
  straight: 3, // walls keep their angle
  wobble: 2, // rows the layer borders wobble by
}
/** @typedef {typeof KNOBS} Knobs */

// class weights per band (solid, open, wall, passage, junction, pocket): the ice has more halls and
// walls, the pudding bigger caverns and fewer passages, the brine zone more pockets and small caves
const PROFILE = [
  [1, 1, 1, 1, 1, 1],
  [1, 0.5, 1.6, 0.8, 0.25, 0.3],
  [1, 1.0, 1.0, 0.3, 0.1, 0.2],
  [1, 0.4, 0.8, 0.5, 0.25, 1.2],
  [1, 1, 1, 1, 1, 1],
]

// Default band borders (rows): 0 surface · 1–9 ice · 10–20 pudding · 21–29 brine · 30–31 ocean
export const BORDERS = [0.5, 9.5, 20.5, 29.5]

/**
 * A hash in [-1, 1). hashSeed alone barely mixes its last part (neighbouring knots came out nearly
 * equal), so finish with murmur3's avalanche.
 * @param {...number} parts
 */
export function hash11(...parts) {
  let h = hashSeed(...parts)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h = (h ^ (h >>> 16)) >>> 0
  return (h / 2 ** 32) * 2 - 1
}

/**
 * How far the layer borders are shifted at a fine x (in rows): smooth, periodic in FW, from the seed.
 * @param {number} seed @param {number} x @param {number} amp
 */
export function wobble(seed, x, amp) {
  const K = 8 // knots across the width, every 20 cells
  const f = ((((x / FW) * K) % K) + K) % K
  const i = Math.floor(f)
  const t = f - i
  const s = t * t * (3 - 2 * t)
  const knot = (/** @type {number} */ j) => hash11(seed, 77, j % K)
  return (knot(i) * (1 - s) + knot(i + 1) * s) * amp
}

/** The band a (wobbled) row falls in. @param {number} row */
export function bandOf(row) {
  let b = 0
  while (b < 4 && row >= BORDERS[b]) b++
  return b
}

/** The band whose weights hex i uses: its centre's wobbled row; only rows 0 and 30–31 are surface and ocean. */
function hexBand(/** @type {number} */ seed, /** @type {number} */ i, /** @type {number} */ amp) {
  const r = Math.floor(i / COLS)
  if (r === 0) return SURFACE
  if (r >= 30) return OCEAN
  return Math.min(BRINE, Math.max(ICE, bandOf(r + wobble(seed, centre(i)[0], amp))))
}

/** Precomputed per tile set: bitset width, side masks, class counts. @param {Tile[]} tiles */
export function prepare(tiles) {
  const W = Math.ceil(tiles.length / 32)
  // mask[k * 8 + v]: the tiles whose side k shows code v
  const mask = Array.from({ length: 48 }, () => new Uint32Array(W))
  for (const t of tiles) for (let k = 0; k < 6; k++) mask[k * 8 + sideCode(t.sockets, k)][t.id >> 5] |= 1 << (t.id & 31)
  const count = [0, 0, 0, 0, 0, 0]
  for (const t of tiles) count[t.cls]++
  return { tiles, W, mask, count }
}
/** @typedef {ReturnType<typeof prepare>} Prepared */

/** Markov affinity between the classes of two neighbours. @param {Knobs} K @param {number} a @param {number} b */
function affinity(K, a, b) {
  if (a > b) [a, b] = [b, a]
  if (a === SOLID && b === SOLID) return K.rock
  if (a === OPEN && b === OPEN) return K.grow
  if (a === OPEN && b === WALL) return Math.sqrt(K.grow)
  if (a === SOLID && b === WALL) return Math.sqrt(K.rock)
  if (a === SOLID && (b === PASSAGE || b === JUNCTION)) return K.rock
  if (a === OPEN && b === PASSAGE) return 0.5
  if (a === POCKET && b === POCKET) return 0.3
  return 1
}

/**
 * Collapses one map. Returns the tile per hex (-1 where undecided after a failure) and the restarts.
 * @param {Prepared} P @param {number} seed @param {Knobs} K
 */
export function generate(P, seed, K) {
  const { tiles, W, mask, count } = P
  const T = tiles.length
  const opens = [0, K.openIce, K.openPudding, K.openBrine, 0]
  const band = Array.from({ length: N }, (_, i) => hexBand(seed, i, K.wobble))
  // base weight per band per tile: the class weight shared by the class's tiles
  const base = [0, 1, 2, 3, 4].map((b) =>
    Float64Array.from(tiles, (t) => {
      const o = opens[b]
      const w = PROFILE[b][t.cls] * (b === SURFACE || b === OCEAN ? 1 : t.cls === SOLID ? 2 * (1 - o) : t.cls === OPEN ? 2 * o : 1)
      return Math.max(w, 1e-6) / count[t.cls]
    }),
  )
  const solidId = tiles.findIndex((t) => t.cls === SOLID)
  const openId = tiles.findIndex((t) => t.cls === OPEN)

  for (let attempt = 0; attempt <= 50; attempt++) {
    const rng = mulberry32(hashSeed(seed, attempt))
    const res = collapse()
    if (res) return { tiles: res, restarts: attempt, ok: true }
    if (attempt === 50) return { tiles: new Int16Array(N).fill(-1), restarts: attempt, ok: false }

    // one attempt; null on a contradiction
    function collapse() {
      const dom = new Uint32Array(N * W)
      const size = new Int32Array(N) // tiles left in the domain
      const ent = new Float64Array(N)
      const chosen = new Int16Array(N).fill(-1)
      const full = new Uint32Array(W)
      for (let t = 0; t < T; t++) full[t >> 5] |= 1 << (t & 31)
      for (let i = 0; i < N; i++) dom.set(full, i * W)
      for (let i = 0; i < N; i++) measure(i)

      /** @param {number} i */
      function measure(i) {
        const w = base[band[i]]
        let s = 0
        let sl = 0
        let n = 0
        for (let j = 0; j < W; j++) {
          let bits = dom[i * W + j]
          while (bits) {
            const b = 31 - Math.clz32(bits)
            bits ^= 1 << b
            const x = w[j * 32 + b]
            s += x
            sl += x * Math.log(x)
            n++
          }
        }
        size[i] = n
        ent[i] = n > 1 ? Math.log(s) - sl / s : 0
      }

      /** @param {number} i @param {number} t */
      function fix(i, t) {
        dom.fill(0, i * W, i * W + W)
        dom[i * W + (t >> 5)] = 1 << (t & 31)
        size[i] = 1
        chosen[i] = t
      }

      /** AC-3 from the hexes in `queue`. @param {number[]} queue @returns {boolean} false on a contradiction */
      function propagate(queue) {
        const allowed = new Uint32Array(W)
        while (queue.length) {
          const i = /** @type {number} */ (queue.pop())
          for (let k = 0; k < 6; k++) {
            const m = NEIGHBOURS[i][k]
            if (m < 0) continue
            allowed.fill(0)
            for (let v = 0; v < 8; v++) {
              const mk = mask[k * 8 + v]
              let hit = false
              for (let j = 0; j < W; j++)
                if (dom[i * W + j] & mk[j]) {
                  hit = true
                  break
                }
              if (!hit) continue
              const mm = mask[((k + 3) % 6) * 8 + reversed(v)]
              for (let j = 0; j < W; j++) allowed[j] |= mm[j]
            }
            let changed = false
            let any = 0
            for (let j = 0; j < W; j++) {
              const d = dom[m * W + j]
              const nd = (d & allowed[j]) >>> 0
              if (nd !== d) {
                dom[m * W + j] = nd
                changed = true
              }
              any |= nd
            }
            if (!any) return false
            if (changed) {
              measure(m)
              if (size[m] === 1) chosen[m] = only(m)
              queue.push(m)
            }
          }
        }
        return true
      }

      /** @param {number} i */
      function only(i) {
        for (let j = 0; j < W; j++) if (dom[i * W + j]) return j * 32 + 31 - Math.clz32(dom[i * W + j])
        return -1
      }

      // fixed rows: the surface is rock, the ocean is open
      const fixed = []
      for (let i = 0; i < N; i++) {
        const r = Math.floor(i / COLS)
        if (r === 0 || r >= ROWS - 2) {
          fix(i, r === 0 ? solidId : openId)
          fixed.push(i)
        }
      }
      if (!propagate(fixed)) return null

      for (;;) {
        let pick = -1
        let low = Infinity
        for (let i = 0; i < N; i++) {
          if (size[i] <= 1) continue
          const e = ent[i] + (rng() / 2 ** 32) * 1e-6
          if (e < low) {
            low = e
            pick = i
          }
        }
        if (pick < 0) break
        const t = choose(pick)
        fix(pick, t)
        if (!propagate([pick])) return null
      }
      for (let i = 0; i < N; i++) if (chosen[i] < 0) chosen[i] = only(i)
      return chosen

      /**
       * A tile for hex i by context weight. Each class keeps its whole base weight however few of its
       * tiles still fit, so a cave's edge is a fair choice between "open" (one tile) and the walls
       * that fit (a handful of 36).
       * @param {number} i
       */
      function choose(i) {
        const w = base[band[i]]
        const cand = []
        const cw = []
        const inDom = [0, 0, 0, 0, 0, 0]
        for (let j = 0; j < W; j++) {
          let bits = dom[i * W + j]
          while (bits) {
            const b = 31 - Math.clz32(bits)
            bits ^= 1 << b
            const t = j * 32 + b
            cand.push(t)
            inDom[tiles[t].cls]++
          }
        }
        let sum = 0
        for (const t of cand) {
          const c = tiles[t].cls
          const x = ((w[t] * count[c]) / inDom[c]) * context(i, tiles[t])
          cw.push(x)
          sum += x
        }
        let r = (rng() / 2 ** 32) * sum
        for (let n = 0; n < cand.length; n++) {
          r -= cw[n]
          if (r < 0) return cand[n]
        }
        return cand[cand.length - 1]
      }

      /** @param {number} i @param {Tile} t */
      function context(i, t) {
        let f = 1
        for (let k = 0; k < 6; k++) {
          const m = NEIGHBOURS[i][k]
          if (m < 0 || chosen[m] < 0) continue
          const n = tiles[chosen[m]]
          f *= affinity(K, t.cls, n.cls)
          // a neighbour's passage leads in through this side: run on, turn or branch
          if (n.cls === PASSAGE && n.sides.includes((k + 3) % 6) && t.sides.includes(k)) {
            if (t.cls === JUNCTION) f *= K.branch
            else if (t.cls === PASSAGE) f *= t.sides.includes((k + 3) % 6) ? K.cont : K.turn
          }
          if (t.cls === WALL && n.cls === WALL && t.angle === n.angle) f *= K.straight
        }
        return f
      }
    }
  }
  return { tiles: new Int16Array(N).fill(-1), restarts: 50, ok: false }
}
