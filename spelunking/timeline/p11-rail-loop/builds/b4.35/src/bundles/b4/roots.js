// b4.22's roots (the user: "drop the metro map look, use the eased grid to make it look like a wiggly orange
// root"): each edge's route walks the caves' own relaxed quad mesh (v5's, the grid the caves are built on;
// its edges are about 3.6 px long), not v8's octilinear tile router. The pairs and the nodes are v8's
// mode A (mesh vertices in open space, joined where the lune β-skeleton says; chords never cross). Each pair
// is an A* search over the mesh: an edge costs its length, ×`dig` through rock (sampled pixel by pixel), and
// ×(1 + `overlap`) along an earlier root; stepping onto a vertex an earlier root uses costs `cross` px;
// another node's vertex, the sky and the sea are closed. Shortest pairs first.

import { edges } from '../v5/quads.js'
import { K, ROCK, SEA, SKY } from '../v6/terrain.js'

/** @typedef {import('../v8/rails.js').Node} Node */

/**
 * @param {import('../v6/terrain.js').Terrain} T
 * @param {import('../v5/quadcaves.js').Grid} G
 * @param {Node[]} nodes mesh vertices, in raster px
 * @param {{ a: number, b: number }[]} pairs
 * @param {{ dig: number, overlap: number, cross: number }} S
 * @returns {{ a: number, b: number, path: [number, number][] }[]} each path: the vertices' px, a's to b's
 */
export function roots(T, G, nodes, pairs, S) {
  const m = G.mesh
  const n = m.x.length
  const W = T.w
  const px = (/** @type {number} */ v) => ((m.x[v] * 10) / Math.sqrt(3)) * K
  const py = (/** @type {number} */ v) => (m.y[v] * 6 + 6) * K
  const dxw = (/** @type {number} */ a, /** @type {number} */ b) => {
    const d = Math.abs(a - b) % W
    return Math.min(d, W - d)
  }
  const cls = (/** @type {number} */ x, /** @type {number} */ y) => {
    const yy = Math.floor(y)
    if (yy < 0) return SKY
    if (yy >= T.h) return ROCK
    return T.cls[yy * W + (((Math.floor(x) % W) + W) % W)]
  }
  // the mesh's graph: per vertex, its neighbours and each edge's cost (Infinity: closed)
  /** @type {{ to: number, cost: number, key: number }[][]} */
  const adj = Array.from({ length: n }, () => [])
  edges(m).forEach(([a, b], key) => {
    const ax = px(a)
    const ay = py(a)
    let dx = px(b) - ax
    if (Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W // across the wrap
    const dy = py(b) - ay
    const len = Math.hypot(dx, dy)
    const samples = Math.max(2, Math.ceil(len * 2))
    let rock = 0
    let closed = false
    for (let i = 0; i <= samples; i++) {
      const c = cls(ax + (dx * i) / samples, ay + (dy * i) / samples)
      if (c === SKY || c === SEA) closed = true
      else if (c === ROCK) rock++
    }
    const cost = closed ? Infinity : len * (1 + (Math.max(1, S.dig) - 1) * (rock / (samples + 1)))
    adj[a].push({ to: b, cost, key })
    adj[b].push({ to: a, cost, key })
  })
  // the nodes' vertices
  const vid = new Map()
  for (let v = 0; v < n; v++) vid.set(`${px(v)},${py(v)}`, v)
  const nodeV = nodes.map((p) => vid.get(`${p.x},${p.y}`) ?? -1)
  const isNode = new Uint8Array(n)
  for (const v of nodeV) if (v >= 0) isNode[v] = 1
  const usedE = new Set()
  const usedV = new Uint8Array(n)
  const order = pairs
    .filter((p) => nodeV[p.a] >= 0 && nodeV[p.b] >= 0)
    .map((p) => ({ p, d: Math.hypot(dxw(nodes[p.a].x, nodes[p.b].x), nodes[p.a].y - nodes[p.b].y) }))
    .sort((p, q) => p.d - q.d)
  const dist = new Float64Array(n).fill(Infinity)
  const from = new Int32Array(n).fill(-1)
  const done = new Uint8Array(n)
  /** @type {number[]} */
  let touched = [] // the vertices the last search wrote to: reset before the next
  /** @type {{ a: number, b: number, path: [number, number][] }[]} */
  const out = []
  for (const { p } of order) {
    const s = nodeV[p.a]
    const t = nodeV[p.b]
    for (const v of touched) ((dist[v] = Infinity), (done[v] = 0), (from[v] = -1))
    touched = [s]
    const h = (/** @type {number} */ v) => Math.hypot(dxw(px(v), px(t)), py(v) - py(t))
    dist[s] = 0
    // a binary heap of [f, v]
    /** @type {[number, number][]} */
    const heap = [[h(s), s]]
    const push = (/** @type {[number, number]} */ e) => {
      heap.push(e)
      for (let i = heap.length - 1; i > 0;) {
        const j = (i - 1) >> 1
        if (heap[j][0] <= heap[i][0]) break
        ;[heap[i], heap[j]] = [heap[j], heap[i]]
        i = j
      }
    }
    const pop = () => {
      const top = heap[0]
      const last = /** @type {[number, number]} */ (heap.pop())
      if (heap.length) {
        heap[0] = last
        for (let i = 0; ;) {
          const l = 2 * i + 1
          const r = l + 1
          let k = i
          if (l < heap.length && heap[l][0] < heap[k][0]) k = l
          if (r < heap.length && heap[r][0] < heap[k][0]) k = r
          if (k === i) break
          ;[heap[i], heap[k]] = [heap[k], heap[i]]
          i = k
        }
      }
      return top
    }
    const limit = 4 * h(s) + 40 // no root longer than this
    while (heap.length) {
      const [, v] = pop()
      if (done[v]) continue
      done[v] = 1
      if (v === t) break
      for (const e of adj[v]) {
        if (e.cost === Infinity || (isNode[e.to] && e.to !== t)) continue
        const c = e.cost * (usedE.has(e.key) ? 1 + S.overlap : 1) + (usedV[e.to] && e.to !== t ? S.cross : 0)
        const d = dist[v] + c
        if (d >= dist[e.to] || d > limit) continue
        if (dist[e.to] === Infinity) touched.push(e.to)
        dist[e.to] = d
        from[e.to] = v
        push([d + h(e.to), e.to])
      }
    }
    if (!done[t]) continue
    /** @type {number[]} */
    const vs = []
    for (let v = t; v !== s; v = from[v]) vs.push(v)
    vs.push(s)
    vs.reverse()
    for (let i = 1; i < vs.length; i++) usedE.add(adj[vs[i - 1]].find((e) => e.to === vs[i])?.key)
    for (const v of vs) usedV[v] = 1
    out.push({ a: p.a, b: p.b, path: vs.map((v) => /** @type {[number, number]} */ ([px(v), py(v)])) })
  }
  return out
}
