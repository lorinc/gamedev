// Wave function collapse on the small quads of the relaxed grid (Townscaper-style). A quad's tile is
// its 4 corners, each open or rock (the 16 marching-squares cases); neighbouring quads must agree on
// the 2 corners they share. Pick the undecided quad with the lowest entropy (a heap), choose a tile by
// base weight (the depth band) × Markov affinities to the collapsed neighbours × "walls run straight",
// propagate. Saddles are allowed but rare, so there are no contradictions.

import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { near } from './quads.js'
import { BRINE, ICE, OCEAN, SURFACE, bandOf, wobble } from './wfc.js'

export const QROCK = 0
export const QOPEN = 1
export const QWALL = 2 // 2 neighbouring corners open: the boundary runs straight through
export const QNOOK = 3 // 1 corner open
export const QINNER = 4 // 3 corners open
export const QSADDLE = 5 // 2 opposite corners open
export const QCLASSES = ['rock', 'open', 'wall', 'nook', 'inner', 'saddle']
/** The band of the sky row's quads (after SURFACE … OCEAN): no terrain, painted as sky. */
export const QSKY = 5

const bit = (/** @type {number} */ t, /** @type {number} */ k) => (t >> k) & 1
/** Class of each of the 16 corner patterns. */
export const QCLASS = Array.from({ length: 16 }, (_, t) => {
  const n = bit(t, 0) + bit(t, 1) + bit(t, 2) + bit(t, 3)
  if (n === 0) return QROCK
  if (n === 4) return QOPEN
  if (n === 1) return QNOOK
  if (n === 3) return QINNER
  return t === 5 || t === 10 ? QSADDLE : QWALL
})
/**
 * The quad WFC's own defaults: the user's best setting on the 3 × 6 map (seed 6398 looked best):
 * open 0.12, caves grow 7.5, rock grows 1, walls straight 6, thinnest wall 0, wobble 0.5.
 */
export const QKNOBS = {
  openIce: 0.12, // how open each layer is
  openPudding: 0.12,
  openBrine: 0.12,
  grow: 7.5, // caves grow: open next to open
  rock: 1, // rock grows: rock next to rock
  straight: 6, // a wall carries a neighbour's border straight on
  thin: 0, // how thin walls can get: rock with open space on opposite sides within this many cells is avoided (0 = off)
  wobble: 0.5, // rows the layer borders wobble by
}
/** @typedef {typeof QKNOBS} QKnobs */

const COUNT = [0, 0, 0, 0, 0, 0]
for (const c of QCLASS) COUNT[c]++

/**
 * The quad grid's neighbours: for quad q and its edge k (corners k, k+1), the quad across and the
 * indices of those two corners in it. Built once per grid.
 * @param {number[][]} faces
 */
export function quadLinks(faces) {
  /** @type {Map<number, [number, number]>} */
  const byEdge = new Map()
  const nb = new Int32Array(faces.length * 4).fill(-1)
  const ci = new Int8Array(faces.length * 4) // index of corner k in the neighbour
  const cj = new Int8Array(faces.length * 4) // index of corner k+1 in the neighbour
  faces.forEach((f, q) => {
    for (let k = 0; k < 4; k++) {
      const a = f[k]
      const b = f[(k + 1) & 3]
      const key = a < b ? a * 1e6 + b : b * 1e6 + a
      const other = byEdge.get(key)
      if (!other) {
        byEdge.set(key, [q, k])
        continue
      }
      const [p, m] = other
      nb[q * 4 + k] = p
      nb[p * 4 + m] = q
      ci[q * 4 + k] = faces[p].indexOf(a)
      cj[q * 4 + k] = faces[p].indexOf(b)
      ci[p * 4 + m] = f.indexOf(faces[p][m])
      cj[p * 4 + m] = f.indexOf(faces[p][(m + 1) & 3])
    }
  })
  return { nb, ci, cj }
}

// MATCH[i * 4 + j][pair]: the tiles whose corner i equals pair's bit 0 and corner j its bit 1
const MATCH = Array.from({ length: 16 }, (_, ij) =>
  Array.from({ length: 4 }, (_, pair) => {
    let m = 0
    for (let t = 0; t < 16; t++) if (bit(t, ij >> 2) === (pair & 1) && bit(t, ij & 3) === pair >> 1) m |= 1 << t
    return m
  }),
)

/**
 * @param {import('./quadcaves.js').Grid} G
 * @param {number} seed @param {QKnobs} K
 * @returns {{tile: Uint8Array, band: Uint8Array, open: Uint8Array, skyBits: Uint8Array, seaBits: Uint8Array}}
 *   open: per mesh vertex; skyBits, seaBits: per quad, its corners in the sky or the ocean
 */
export function generateQuads(G, seed, K) {
  const L = G.links
  const faces = G.mesh.faces
  const Q = faces.length
  const rng = mulberry32(hashSeed(seed, 0x51))
  const opens = [0, K.openIce, K.openPudding, K.openBrine, 0]
  // The sky and the ocean: a hex row each above and below the terrain, relaxed with the rest. A corner is
  // sky (ocean) when it lies above (below) a smooth, wavy line near the row border; hex outlines stay
  // zigzags even relaxed, so the line, not the hex, decides. Quads wholly in the sky or the ocean take
  // no part in the WFC; quads touching the sky are the rock surface; the ocean is painted over the
  // quads it cuts. The layers go by depth between the two lines, on p7's 32-row scale (surface 0,
  // ocean 30), so any map size keeps their proportions.
  const { rows } = G.mesh
  const V = G.mesh.x.length
  const top = 9 * 0.5 + 6 // fine y of the border between the sky row and the terrain
  const bottom = 9 * (rows - 1.5) + 6 // … and between the terrain and the ocean row
  const sky = new Uint8Array(V)
  const sea = new Uint8Array(V)
  for (let v = 0; v < V; v++) {
    const x = (G.mesh.x[v] * 10) / Math.sqrt(3)
    const y = G.mesh.y[v] * 6 + 6
    sky[v] = y < top + wobble(seed + 1, x, 2.5, G.W) ? 1 : 0
    sea[v] = y > bottom + wobble(seed + 2, x, 2.5, G.W) ? 1 : 0
  }
  const band = new Uint8Array(Q)
  const skyBits = new Uint8Array(Q)
  const seaBits = new Uint8Array(Q)
  for (let q = 0; q < Q; q++) {
    const f = faces[q]
    for (let k = 0; k < 4; k++) {
      skyBits[q] |= sky[f[k]] << k
      seaBits[q] |= sea[f[k]] << k
    }
    if (skyBits[q] === 15) band[q] = QSKY
    else if (seaBits[q] === 15) band[q] = OCEAN
    else if (skyBits[q]) band[q] = SURFACE
    else {
      const row = ((G.cy[q] - top) / (bottom - top)) * 30
      band[q] = Math.min(BRINE, Math.max(ICE, bandOf(row + wobble(seed, G.cx[q], K.wobble, G.W))))
    }
  }
  const outside = (/** @type {number} */ q) => band[q] === QSKY || band[q] === OCEAN
  // class weights per band, shared by the class's tiles
  const base = [0, 1, 2, 3, 4].map((b) => {
    const o = opens[b]
    const cls = [2 * (1 - o), 2 * o, 1, 0.5, 0.5, 0.02]
    return Float64Array.from({ length: 16 }, (_, t) => Math.max(cls[QCLASS[t]], 1e-6) / COUNT[QCLASS[t]])
  })
  // entropy per band and domain, cached
  const entCache = [0, 1, 2, 3, 4].map(() => new Float64Array(65536).fill(-1))
  const entropy = (/** @type {number} */ b, /** @type {number} */ d) => {
    let e = entCache[b][d]
    if (e >= 0) return e
    let s = 0
    let sl = 0
    for (let t = 0; t < 16; t++)
      if (d & (1 << t)) {
        const w = base[b][t]
        s += w
        sl += w * Math.log(w)
      }
    e = Math.log(s) - sl / s
    entCache[b][d] = e
    return e
  }

  const dom = new Uint16Array(Q).fill(0xffff)
  // each corner's value once a quad holding it is decided (-1 = not yet), for the thin-wall check
  const vs = new Int8Array(G.mesh.x.length).fill(-1)
  /** @type {number[][]} */
  const vadj = Array.from({ length: vs.length }, () => [])
  for (const [a, b] of G.walls) {
    vadj[a].push(b)
    vadj[b].push(a)
  }
  /** @param {number} q @param {number} t */
  const settle = (q, t) => {
    tile[q] = t
    for (let k = 0; k < 4; k++) vs[faces[q][k]] = bit(t, k)
  }
  const tile = new Int8Array(Q).fill(-1)
  const single = (/** @type {number} */ d) => (d & (d - 1)) === 0

  // a binary heap of [entropy, quad], stale entries skipped on pop
  /** @type {number[]} */
  const hk = []
  /** @type {number[]} */
  const hq = []
  const key = new Float64Array(Q)
  const push = (/** @type {number} */ q) => {
    const k = entropy(band[q], dom[q]) + (rng() / 2 ** 32) * 1e-3
    key[q] = k
    let i = hk.length
    hk.push(k)
    hq.push(q)
    while (i > 0) {
      const p = (i - 1) >> 1
      if (hk[p] <= hk[i]) break
      ;[hk[p], hk[i]] = [hk[i], hk[p]]
      ;[hq[p], hq[i]] = [hq[i], hq[p]]
      i = p
    }
  }
  const pop = () => {
    const q = hq[0]
    const k = hk[0]
    const lk = /** @type {number} */ (hk.pop())
    const lq = /** @type {number} */ (hq.pop())
    if (hk.length) {
      hk[0] = lk
      hq[0] = lq
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < hk.length && hk[l] < hk[m]) m = l
        if (r < hk.length && hk[r] < hk[m]) m = r
        if (m === i) break
        ;[hk[m], hk[i]] = [hk[i], hk[m]]
        ;[hq[m], hq[i]] = [hq[i], hq[m]]
        i = m
      }
    }
    return key[q] === k ? q : -1
  }

  /** @param {number[]} queue */
  const propagate = (queue) => {
    while (queue.length) {
      const q = /** @type {number} */ (queue.pop())
      const d = dom[q]
      for (let k = 0; k < 4; k++) {
        const p = L.nb[q * 4 + k]
        if (p < 0 || outside(p)) continue
        // the corner pairs q still allows on this edge
        const ij = L.ci[q * 4 + k] * 4 + L.cj[q * 4 + k]
        let allowed = 0
        for (let pair = 0; pair < 4; pair++) if (d & MATCH[k * 4 + ((k + 1) & 3)][pair]) allowed |= MATCH[ij][pair]
        const nd = dom[p] & allowed
        if (nd === dom[p]) continue
        dom[p] = nd
        if (single(nd)) settle(p, 31 - Math.clz32(nd))
        else push(p)
        queue.push(p)
      }
    }
  }

  // fixed: the surface is rock
  const fixed = []
  for (let q = 0; q < Q; q++)
    if (band[q] === SURFACE) {
      dom[q] = 1
      settle(q, 0)
      fixed.push(q)
    }
  propagate(fixed)
  for (let q = 0; q < Q; q++) if (tile[q] < 0 && !outside(q)) push(q)

  while (hk.length) {
    const q = pop()
    if (q < 0 || tile[q] >= 0) continue
    const t = choose(q)
    dom[q] = 1 << t
    settle(q, t)
    propagate([q])
  }

  const open = new Uint8Array(G.mesh.x.length)
  faces.forEach((f, q) => {
    if (tile[q] >= 0) for (let k = 0; k < 4; k++) if (bit(tile[q], k)) open[f[k]] = 1
  })
  return { tile: Uint8Array.from(tile, (t) => Math.max(t, 0)), band, open, skyBits, seaBits }

  /** @param {number} q */
  function choose(q) {
    const w = base[band[q]]
    const inDom = [0, 0, 0, 0, 0, 0]
    for (let t = 0; t < 16; t++) if (dom[q] & (1 << t)) inDom[QCLASS[t]]++
    const cw = new Float64Array(16)
    const thin = K.thin > 0 ? faces[q].map(pinched) : [false, false, false, false]
    let sum = 0
    for (let t = 0; t < 16; t++) {
      if (!(dom[q] & (1 << t))) continue
      const c = QCLASS[t]
      let f = (w[t] * COUNT[c]) / inDom[c]
      // rock at a pinched corner would make a wall thinner than K.thin: it tends to break through instead
      for (let k = 0; k < 4; k++) if (thin[k] && !bit(t, k)) f *= 0.01
      for (let k = 0; k < 4; k++) {
        const p = L.nb[q * 4 + k]
        if (p < 0 || tile[p] < 0) continue
        const pc = QCLASS[tile[p]]
        if (c === QROCK && pc === QROCK) f *= K.rock
        else if (c === QOPEN && pc === QOPEN) f *= K.grow
        // the neighbour's boundary enters through this edge: a wall carries it straight on
        if (bit(t, k) !== bit(t, (k + 1) & 3) && c === QWALL) f *= K.straight
      }
      cw[t] = f
      sum += f
    }
    let r = (rng() / 2 ** 32) * sum
    for (let t = 0; t < 16; t++) {
      if (!cw[t]) continue
      r -= cw[t]
      if (r < 0) return t
    }
    return 31 - Math.clz32(dom[q])
  }

  /**
   * Is corner v pinched: already-decided open corners within K.thin cells of it, on opposite sides
   * (more than 120° apart, seen from v)? A breadth-first walk along the grid's edges, about a cell each.
   * @param {number} v
   */
  function pinched(v) {
    const m = G.mesh
    const seen = new Set([v])
    let ring = [v]
    /** @type {[number, number][]} */
    const dirs = []
    for (let d = 0; d < K.thin && ring.length; d++) {
      /** @type {number[]} */
      const next = []
      for (const a of ring)
        for (const b of vadj[a]) {
          if (seen.has(b)) continue
          seen.add(b)
          next.push(b)
          if (vs[b] !== 1) continue
          const dx = near(m.x[b], m.x[v], m.wrap) - m.x[v]
          const dy = m.y[b] - m.y[v]
          const len = Math.hypot(dx, dy) || 1
          const ux = dx / len
          const uy = dy / len
          for (const [ox, oy] of dirs) if (ux * ox + uy * oy < -0.5) return true
          dirs.push([ux, uy])
        }
      ring = next
    }
    return false
  }
}

/**
 * Cavities: open vertices joined by open-open edges, leaving out the ocean's quads' corners.
 * @param {import('./quadcaves.js').Grid} G @param {{open: Uint8Array, seaBits: Uint8Array}} R
 */
export function quadCavities(G, R) {
  const V = R.open.length
  const sea = new Uint8Array(V)
  G.mesh.faces.forEach((f, q) => {
    for (let k = 0; k < 4; k++) if ((R.seaBits[q] >> k) & 1) sea[f[k]] = 1
  })
  /** @type {number[][]} */
  const adj = Array.from({ length: V }, () => [])
  for (const [a, b] of G.walls)
    if (R.open[a] && R.open[b]) {
      adj[a].push(b)
      adj[b].push(a)
    }
  const seen = new Uint8Array(V)
  /** @type {number[]} */
  const sizes = []
  for (let v = 0; v < V; v++) {
    if (!R.open[v] || sea[v] || seen[v]) continue
    let size = 0
    const stack = [v]
    seen[v] = 1
    while (stack.length) {
      const p = /** @type {number} */ (stack.pop())
      size++
      for (const n of adj[p])
        if (!sea[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
    }
    sizes.push(size)
  }
  const total = sizes.reduce((a, b) => a + b, 0)
  return { count: sizes.length, largest: total ? Math.max(...sizes) / total : 0, tiny: sizes.filter((s) => s < 20).length }
}
