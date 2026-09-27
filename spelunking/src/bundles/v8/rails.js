// p10 · Rails: straight monorail rails over the ice layer, two ways (user: "I'd be very interested seeing
// the rail running on relaxed edges… Just make it a straight line, it is a rail").
// A: nodes on the caves' own relaxed grid (its vertices in open space, the most open first, `spacing`
//    apart), joined by straight chords that don't cross (a relative neighbourhood graph).
// B: a coarse relaxed grid of its own (Townscaper: triangles, paired, subdivided, relaxed), wrapping with
//    the map; its vertices are the nodes and its edges the rails.
// Every rail is sampled on the raster: the share through rock is what it would bore.

import { near, pair, relax, subdivide } from '../v5/quads.js'
import { K, OPEN, ROCK, SEA, SKY } from '../v6/terrain.js'

/** The rail knobs (the page's sliders). */
export const RKNOBS = {
  spacing: 8, // A: nodes at least this far apart, in cells
  cols: 5, // B: coarse triangles across the map (rails ≈ map width / cols / 2 long)
  rrelax: 20, // B: relaxing rounds (not `relax`: that's the caves' knob, and both ride in the URL)
  dig: 1.5, // C: a tile of rock costs this many of open air (user: digging has a 50% penalty)
  bend: 3, // C: a 45° bend costs this many tiles, a 90° bend twice that; sharper bends aren't allowed
  steep: 0, // 1 = drop rails steeper than 45° (nothing vertical, D068)
}
/** @typedef {typeof RKNOBS} RKnobs */

/**
 * @typedef {{x: number, y: number}} Node in raster px
 * @typedef {{a: number, b: number, len: number, rock: number, steep: boolean, path?: [number, number][], bends?: number}} Rail
 *   nodes a → b; len and rock in px; a routed rail (C) has its tiles (px of their centres) and its bends
 * @typedef {{nodes: Node[], rails: Rail[]}} Net
 */

/**
 * @param {import('../v6/terrain.js').Terrain} T
 * @param {import('../v5/quadcaves.js').Grid} G the caves' grid
 * @param {{top: number, rows: number}} frame the rows shown
 * @param {'A' | 'B' | 'C'} mode @param {RKnobs} S @param {number} seed
 */
export function rails(T, G, frame, mode, S, seed) {
  const net = mode === 'B' ? coarse(T, frame, S, seed) : chords(T, G, frame, S)
  let rails = net.rails
  if (mode === 'C') {
    rails = route(T, frame, net.nodes, rails, S)
    // routes run tile to tile: the nodes sit at their tiles' centres
    net.nodes = net.nodes.map((n) => ({ x: (Math.floor(n.x / K) + 0.5) * K, y: (Math.floor(n.y / K) + 0.5) * K }))
  }
  else if (S.steep) rails = rails.filter((r) => !r.steep)
  const used = new Set(rails.flatMap((r) => [r.a, r.b]))
  const len = rails.reduce((s, r) => s + r.len, 0)
  const rock = rails.reduce((s, r) => s + r.rock, 0)
  const lens = rails.map((r) => r.len).sort((p, q) => p - q)
  return {
    nodes: net.nodes,
    rails,
    stats: {
      nodes: used.size,
      rails: rails.length,
      median: lens.length ? lens[lens.length >> 1] / K : 0,
      rockShare: len ? rock / len : 0,
      steep: net.rails.filter((r) => r.steep).length,
      bends: rails.reduce((s, r) => s + (r.bends || 0), 0),
      stretch: rails.length ? rails.reduce((s, r) => s + r.len / Math.max(1, straight(T, net.nodes, r)), 0) / rails.length : 1,
      openNodes: [...used].filter((i) => openAt(T, net.nodes[i].x, net.nodes[i].y)).length,
    },
  }
}

/** @param {import('../v6/terrain.js').Terrain} T @param {number} x @param {number} y */
function openAt(T, x, y) {
  const yy = Math.floor(y)
  if (yy < 0 || yy >= T.h) return false
  return T.cls[yy * T.w + ((Math.floor(x) % T.w) + T.w) % T.w] === OPEN
}

/** A rail from a to b: its length, the part through rock, and whether it's steeper than 45°. @param {import('../v6/terrain.js').Terrain} T @param {Node[]} nodes @param {number} a @param {number} b */
function measure(T, nodes, a, b) {
  const p = nodes[a]
  const q = nodes[b]
  const dx = near(q.x, p.x, T.w) - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy)
  const n = Math.max(1, Math.ceil(len * 2))
  let rock = 0
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const yy = Math.floor(p.y + dy * t)
    const c = yy < 0 ? SKY : yy >= T.h ? ROCK : T.cls[yy * T.w + ((Math.floor(p.x + dx * t) % T.w) + T.w) % T.w]
    if (c === ROCK) rock++
  }
  return { a, b, len, rock: (rock / n) * len, steep: Math.abs(dy) > Math.abs(dx) + 1e-9 }
}

/** In the frame, and not in sky or sea. @param {import('../v6/terrain.js').Terrain} T @param {{top: number, rows: number}} F @param {number} x @param {number} y */
function inMap(T, F, x, y) {
  if (y < F.top || y >= F.top + F.rows) return false
  const c = T.cls[Math.floor(y) * T.w + ((Math.floor(x) % T.w) + T.w) % T.w]
  return c !== SKY && c !== SEA
}

/** A: open vertices of the caves' grid, the most open first, `spacing` apart; chords between them. @param {import('../v6/terrain.js').Terrain} T @param {import('../v5/quadcaves.js').Grid} G @param {{top: number, rows: number}} F @param {RKnobs} S */
function chords(T, G, F, S) {
  const { w, h, cls } = T
  // how far each open pixel is from rock (4-way steps)
  const dist = new Int32Array(w * h).fill(-1)
  /** @type {number[]} */
  let front = []
  for (let i = 0; i < w * h; i++) if (cls[i] !== OPEN) (dist[i] = 0), front.push(i)
  for (let d = 1; front.length; d++) {
    /** @type {number[]} */
    const next = []
    for (const i of front) {
      const x = i % w
      const y = (i - x) / w
      for (const j of [y * w + ((x + 1) % w), y * w + ((x + w - 1) % w), i - w, i + w]) {
        if (j < 0 || j >= w * h || dist[j] >= 0) continue
        dist[j] = d
        next.push(j)
      }
    }
    front = next
  }
  const m = G.mesh
  /** @type {{x: number, y: number, d: number}[]} */
  const verts = []
  for (let v = 0; v < m.x.length; v++) {
    const x = ((m.x[v] * 10) / Math.sqrt(3)) * K
    const y = (m.y[v] * 6 + 6) * K
    if (!inMap(T, F, x, y) || !openAt(T, x, y)) continue
    verts.push({ x, y, d: dist[Math.floor(y) * w + (Math.floor(x) % w)] })
  }
  verts.sort((p, q) => q.d - p.d || p.y - q.y || p.x - q.x)
  const gap = S.spacing * K
  const dxw = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(near(a, b, w) - b)
  /** @type {Node[]} */
  const nodes = []
  for (const v of verts) if (!nodes.some((n) => Math.hypot(dxw(n.x, v.x), n.y - v.y) < gap)) nodes.push({ x: v.x, y: v.y })
  // the relative neighbourhood graph: a and b are joined unless some c is closer to both
  const D = (/** @type {number} */ a, /** @type {number} */ b) => Math.hypot(dxw(nodes[a].x, nodes[b].x), nodes[a].y - nodes[b].y)
  /** @type {Rail[]} */
  const out = []
  const reach = 3 * gap
  for (let a = 0; a < nodes.length; a++)
    for (let b = a + 1; b < nodes.length; b++) {
      const ab = D(a, b)
      if (ab > reach) continue
      let ok = true
      for (let c = 0; c < nodes.length && ok; c++) if (c !== a && c !== b && Math.max(D(a, c), D(b, c)) < ab) ok = false
      if (ok) out.push(measure(T, nodes, a, b))
    }
  return { nodes, rails: out }
}

/** B: a coarse relaxed quad grid over the frame, wrapping with the map. @param {import('../v6/terrain.js').Terrain} T @param {{top: number, rows: number}} F @param {RKnobs} S @param {number} seed */
function coarse(T, F, S, seed) {
  const n = Math.max(3, Math.round(S.cols))
  const W = T.w / K // cells across
  const s = W / n // triangle side, in cells
  const dy = (s * Math.sqrt(3)) / 2
  const y0 = F.top / K - dy
  const rows = Math.ceil(F.rows / K / dy) + 2
  /** @type {number[]} */ const xs = []
  /** @type {number[]} */ const ys = []
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i < n; i++) {
      xs.push((i + (j & 1) / 2) * s)
      ys.push(y0 + j * dy)
    }
  const id = (/** @type {number} */ i, /** @type {number} */ j) => j * n + (((i % n) + n) % n)
  /** @type {number[][]} */
  const faces = []
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < n; i++) {
      const tri =
        j & 1
          ? [
              [id(i, j), id(i + 1, j + 1), id(i, j + 1)],
              [id(i, j), id(i + 1, j), id(i + 1, j + 1)],
            ]
          : [
              [id(i, j), id(i + 1, j), id(i, j + 1)],
              [id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)],
            ]
      for (const f of tri) {
        // one winding for all faces
        const ax = xs[f[0]]
        const bx = near(xs[f[1]], ax, W)
        const cx = near(xs[f[2]], ax, W)
        const cross = (bx - ax) * (ys[f[2]] - ys[f[0]]) - (ys[f[1]] - ys[f[0]]) * (cx - ax)
        faces.push(cross < 0 ? [f[0], f[2], f[1]] : f)
      }
    }
  /** @type {import('../v5/quads.js').Mesh} */
  const tri = { x: Float64Array.from(xs), y: Float64Array.from(ys), faces, hex: faces.map(() => 0), cols: n, rows, wrap: W }
  const m = relax(subdivide(pair(tri, seed)), S.rrelax, false)
  /** @type {Node[]} */
  const nodes = []
  for (let v = 0; v < m.x.length; v++) nodes.push({ x: m.x[v] * K, y: m.y[v] * K })
  /** @type {Map<number, [number, number]>} */
  const seen = new Map()
  for (const f of m.faces)
    for (let k = 0; k < 4; k++) {
      const a = f[k]
      const b = f[(k + 1) & 3]
      seen.set(a < b ? a * 1e6 + b : b * 1e6 + a, [a, b])
    }
  /** @type {Rail[]} */
  const out = []
  for (const [a, b] of seen.values()) {
    const p = nodes[a]
    const q = nodes[b]
    // only rails with both ends in the map
    if (!inMap(T, F, p.x, p.y) || !inMap(T, F, q.x, q.y)) continue
    out.push(measure(T, nodes, a, b))
  }
  return { nodes, rails: out }
}

/** The straight-line length of a rail, in px. @param {import('../v6/terrain.js').Terrain} T @param {Node[]} nodes @param {Rail} r */
function straight(T, nodes, r) {
  const p = nodes[r.a]
  const q = nodes[r.b]
  return Math.hypot(near(q.x, p.x, T.w) - p.x, q.y - p.y)
}

// the 8 directions, clockwise from east; a step's length in tiles
const DX = [1, 1, 0, -1, -1, -1, 0, 1]
const DY = [0, 1, 1, 1, 0, -1, -1, -1]

/**
 * C: each of A's rails routed on the tile grid in the 8 directions: a step costs its length, ×`dig` in
 * rock; a 45° bend costs `bend` tiles, a 90° bend twice that; sharper bends aren't allowed; sky and sea
 * can't be crossed. With `steep`, no upright steps (nothing vertical, D068). Dijkstra over (tile, heading).
 * @param {import('../v6/terrain.js').Terrain} T @param {{top: number, rows: number}} F @param {Node[]} nodes @param {Rail[]} pairs @param {RKnobs} S
 */
function route(T, F, nodes, pairs, S) {
  const W = T.w / K
  const y0 = Math.floor(F.top / K)
  const H = Math.ceil(F.rows / K)
  // each tile by its centre pixel: 0 open, 1 rock, 2 void
  const kind = new Uint8Array(W * H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const py = (y0 + y) * K + (K >> 1)
      const c = py >= T.h ? ROCK : T.cls[py * T.w + x * K + (K >> 1)]
      kind[y * W + x] = c === OPEN ? 0 : c === ROCK ? 1 : 2
    }
  const tile = (/** @type {Node} */ n) => [Math.floor(n.x / K) % W, Math.min(H - 1, Math.max(0, Math.floor(n.y / K) - y0))]
  const N = W * H * 8
  const cost = new Float64Array(N)
  const from = new Int32Array(N)
  /** @type {Rail[]} */
  const out = []
  for (const r of pairs) {
    const [sx, sy] = tile(nodes[r.a])
    const [tx, ty] = tile(nodes[r.b])
    cost.fill(Infinity)
    from.fill(-1)
    /** @type {[number, number][]} a binary heap of [cost, state] */
    const heap = []
    const push = (/** @type {number} */ c, /** @type {number} */ st) => {
      heap.push([c, st])
      let i = heap.length - 1
      while (i > 0) {
        const p = (i - 1) >> 1
        if (heap[p][0] <= heap[i][0]) break
        ;[heap[p], heap[i]] = [heap[i], heap[p]]
        i = p
      }
    }
    const pop = () => {
      const top = heap[0]
      const last = /** @type {[number, number]} */ (heap.pop())
      if (heap.length) {
        heap[0] = last
        let i = 0
        for (;;) {
          const l = 2 * i + 1
          const rr = l + 1
          let m = i
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l
          if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr
          if (m === i) break
          ;[heap[m], heap[i]] = [heap[i], heap[m]]
          i = m
        }
      }
      return top
    }
    const start = (sy * W + sx) * 8
    for (let d = 0; d < 8; d++) {
      cost[start + d] = 0
      push(0, start + d)
    }
    let end = -1
    while (heap.length) {
      const [c, st] = pop()
      if (c > cost[st]) continue
      const d = st & 7
      const t = st >> 3
      const x = t % W
      const y = (t - x) / W
      if (x === tx && y === ty) {
        end = st
        break
      }
      for (const turn of [0, 1, -1, 2, -2]) {
        const nd = (d + turn + 8) & 7
        if (S.steep && DX[nd] === 0) continue
        const nx = (x + DX[nd] + W) % W
        const ny = y + DY[nd]
        if (ny < 0 || ny >= H) continue
        const k = kind[ny * W + nx]
        if (k === 2) continue
        const step = DX[nd] && DY[nd] ? Math.SQRT2 : 1
        const nc = c + step * (k ? S.dig : 1) + Math.abs(turn) * S.bend
        const ns = (ny * W + nx) * 8 + nd
        if (nc < cost[ns]) {
          cost[ns] = nc
          from[ns] = st
          push(nc, ns)
        }
      }
    }
    if (end < 0) continue
    /** @type {[number, number][]} */
    const path = []
    let bends = 0
    let rock = 0
    let len = 0
    for (let st = end; st >= 0; st = from[st]) {
      const t = st >> 3
      const x = t % W
      const y = (t - x) / W
      path.push([(x + 0.5) * K, (y0 + y + 0.5) * K])
      const p = from[st]
      if (p >= 0) {
        const step = DX[st & 7] && DY[st & 7] ? Math.SQRT2 : 1
        len += step * K
        if (kind[t]) rock += step * K
        if ((p & 7) !== (st & 7) && from[p] >= 0) bends++
      }
    }
    path.reverse()
    out.push({ a: r.a, b: r.b, len, rock, steep: false, path, bends })
  }
  return out
}
