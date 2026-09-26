// A Townscaper-style grid inside the pointy-top hexes (Oskar Stålberg's recipe): each hex is cut into
// triangles, 3 to a side (54 per hex; a hex side's 3 triangle edges are its 3 sockets); random pairs of
// neighbouring triangles in the same hex merge into quads; then every face is subdivided into quads
// (a triangle into 3, a quad into 4: corner, edge midpoints, centre); then the mesh is relaxed, each
// quad pulled towards a square. Positions are in hex unit space (circumradius 1), x wrapping at 16√3.

import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { COLS, INR, N, NX, NY, SQ3 } from './hex.js'

export const WRAP = COLS * SQ3

// The triangle lattice: point (i, j) = i·u + j·v, u = (√3/6, 1/6) and v = (0, 1/3), 60° apart.
// Hex centres sit on it; a shift of 16 hexes east is (i + 96, j − 48).
const PERIOD_I = 6 * COLS
/** @param {number} i @param {number} j */
function canon(i, j) {
  const k = Math.floor(i / PERIOD_I)
  return [i - k * PERIOD_I, j + (k * PERIOD_I) / 2]
}

/** Nearest copy of x to ref, across the wrap. @param {number} x @param {number} ref */
export const near = (x, ref) => x - Math.round((x - ref) / WRAP) * WRAP

/**
 * @typedef {object} Mesh
 * @property {Float64Array} x
 * @property {Float64Array} y
 * @property {number[][]} faces vertex ids, one winding
 * @property {number[]} hex the hex each face lies in
 */

/** @param {number} a @param {number} b */
const edgeKey = (a, b) => (a < b ? a * 1e6 + b : b * 1e6 + a)

/** The triangles, 54 per hex. */
export function triangles() {
  /** @type {Map<string, number>} */
  const ids = new Map()
  /** @type {number[]} */
  const xs = []
  /** @type {number[]} */
  const ys = []
  /** @param {number} i @param {number} j */
  const vert = (i, j) => {
    ;[i, j] = canon(i, j)
    const key = i + ',' + j
    let id = ids.get(key)
    if (id === undefined) {
      id = xs.length
      ids.set(key, id)
      xs.push((i * SQ3) / 6)
      ys.push(i / 6 + j / 3)
    }
    return id
  }
  const inside = (/** @type {number} */ a, /** @type {number} */ b) => {
    const px = (a * SQ3) / 6
    const py = a / 6 + b / 3
    for (let k = 0; k < 6; k++) if (NX[k] * px + NY[k] * py > INR - 1e-6) return false
    return true
  }
  /** @type {number[][]} */
  const faces = []
  /** @type {number[]} */
  const hex = []
  for (let h = 0; h < N; h++) {
    const c = h % COLS
    const r = Math.floor(h / COLS)
    const ci = 6 * c + 3 * (r & 1)
    const cj = 4.5 * r - ci / 2
    for (let a = -6; a <= 6; a++)
      for (let b = -6; b <= 6; b++) {
        // the two triangles of lattice rhombus (a, b), kept when their centroid is inside the hex
        if (inside(a + 1 / 3, b + 1 / 3)) {
          faces.push([vert(ci + a, cj + b), vert(ci + a, cj + b + 1), vert(ci + a + 1, cj + b)])
          hex.push(h)
        }
        if (inside(a + 2 / 3, b + 2 / 3)) {
          faces.push([vert(ci + a + 1, cj + b), vert(ci + a, cj + b + 1), vert(ci + a + 1, cj + b + 1)])
          hex.push(h)
        }
      }
  }
  return { x: Float64Array.from(xs), y: Float64Array.from(ys), faces, hex }
}

/**
 * Random neighbouring triangles in the same hex merge into quads; the rest stay triangles.
 * @param {Mesh} m @param {number} seed
 */
export function pair(m, seed) {
  const rng = mulberry32(hashSeed(seed, 0x9a1))
  /** @type {Map<number, number[]>} */
  const byEdge = new Map()
  m.faces.forEach((f, n) => {
    for (let k = 0; k < 3; k++) {
      const key = edgeKey(f[k], f[(k + 1) % 3])
      const list = byEdge.get(key) || []
      list.push(n)
      byEdge.set(key, list)
    }
  })
  const order = m.faces.map((_, n) => n)
  for (let n = order.length - 1; n > 0; n--) {
    const j = rng() % (n + 1)
    ;[order[n], order[j]] = [order[j], order[n]]
  }
  const used = new Uint8Array(m.faces.length)
  /** @type {number[][]} */
  const faces = []
  /** @type {number[]} */
  const hex = []
  for (const n of order) {
    if (used[n]) continue
    const f = m.faces[n]
    /** @type {[number, number][]} partner, edge index in f */
    const options = []
    for (let k = 0; k < 3; k++)
      for (const o of /** @type {number[]} */ (byEdge.get(edgeKey(f[k], f[(k + 1) % 3]))))
        if (o !== n && !used[o] && m.hex[o] === m.hex[n]) options.push([o, k])
    used[n] = 1
    if (!options.length) {
      faces.push(f)
      hex.push(m.hex[n])
      continue
    }
    const [o, k] = options[rng() % options.length]
    used[o] = 1
    const a = f[k]
    const b = f[(k + 1) % 3]
    const d = /** @type {number} */ (m.faces[o].find((v) => v !== a && v !== b))
    faces.push([a, d, b, f[(k + 2) % 3]])
    hex.push(m.hex[n])
  }
  return { x: m.x, y: m.y, faces, hex }
}

/** Every face into quads: corner, next edge's midpoint, centre, previous edge's midpoint. @param {Mesh} m */
export function subdivide(m) {
  const xs = Array.from(m.x)
  const ys = Array.from(m.y)
  /** @type {Map<number, number>} */
  const mids = new Map()
  const mid = (/** @type {number} */ a, /** @type {number} */ b) => {
    const key = edgeKey(a, b)
    let id = mids.get(key)
    if (id === undefined) {
      id = xs.length
      mids.set(key, id)
      xs.push((m.x[a] + near(m.x[b], m.x[a])) / 2)
      ys.push((m.y[a] + m.y[b]) / 2)
    }
    return id
  }
  /** @type {number[][]} */
  const faces = []
  /** @type {number[]} */
  const hex = []
  m.faces.forEach((f, n) => {
    let cx = 0
    let cy = 0
    for (const v of f) {
      cx += near(m.x[v], m.x[f[0]])
      cy += m.y[v]
    }
    const c = xs.length
    xs.push(cx / f.length)
    ys.push(cy / f.length)
    for (let k = 0; k < f.length; k++) {
      const v = f[k]
      faces.push([v, mid(v, f[(k + 1) % f.length]), c, mid(f[(k + f.length - 1) % f.length], v)])
      hex.push(m.hex[n])
    }
  })
  for (let i = 0; i < xs.length; i++) xs[i] = ((xs[i] % WRAP) + WRAP) % WRAP
  return { x: Float64Array.from(xs), y: Float64Array.from(ys), faces, hex }
}

/**
 * Edges of a quad mesh: [a, b, faces on it]. Boundary edges (the map's top and bottom) have one face;
 * outline edges lie between two hexes.
 * @param {Mesh} m
 */
export function edges(m) {
  /** @type {Map<number, [number, number, number[]]>} */
  const map = new Map()
  m.faces.forEach((f, n) => {
    for (let k = 0; k < f.length; k++) {
      const a = f[k]
      const b = f[(k + 1) % f.length]
      const key = edgeKey(a, b)
      const e = map.get(key) || [a, b, []]
      e[2].push(n)
      map.set(key, e)
    }
  })
  return [...map.values()]
}

/**
 * Pulls every quad towards a square of the mesh's average size, `iters` times. Pinned: the map's top
 * and bottom always; with `pinHexes`, the hex outlines too.
 * @param {Mesh} m @param {number} iters @param {boolean} pinHexes
 */
export function relax(m, iters, pinHexes) {
  const x = Float64Array.from(m.x)
  const y = Float64Array.from(m.y)
  const pinned = new Uint8Array(x.length)
  for (const [a, b, fs] of edges(m)) if (fs.length === 1 || (pinHexes && m.hex[fs[0]] !== m.hex[fs[1]])) pinned[a] = pinned[b] = 1
  // the average centre-to-corner distance
  let rs = 0
  for (const f of m.faces) {
    const cx = f.reduce((s, v) => s + near(x[v], x[f[0]]), 0) / 4
    const cy = f.reduce((s, v) => s + y[v], 0) / 4
    for (const v of f) rs += Math.hypot(near(x[v], x[f[0]]) - cx, y[v] - cy)
  }
  const R = rs / (m.faces.length * 4)
  const fx = new Float64Array(x.length)
  const fy = new Float64Array(x.length)
  const F = Int32Array.from(m.faces.flat())
  for (let it = 0; it < iters; it++) {
    fx.fill(0)
    fy.fill(0)
    for (let q = 0; q < F.length; q += 4) {
      const a = F[q]
      const b = F[q + 1]
      const c = F[q + 2]
      const d = F[q + 3]
      const x0 = x[a]
      const x1 = near(x[b], x0)
      const x2 = near(x[c], x0)
      const x3 = near(x[d], x0)
      const cx = (x0 + x1 + x2 + x3) / 4
      const cy = (y[a] + y[b] + y[c] + y[d]) / 4
      // rotate each corner back by 90°·k onto corner 0 and average: the best-fitting square's corner 0
      const t = Math.sign((x1 - x0) * (y[c] - y[a]) - (y[b] - y[a]) * (x2 - x0)) || 1
      let sx = x0 - cx + t * (y[b] - cy) - (x2 - cx) - t * (y[d] - cy)
      let sy = y[a] - cy - t * (x1 - cx) - (y[c] - cy) + t * (x3 - cx)
      const len = Math.hypot(sx, sy) || 1
      sx = (sx / len) * R
      sy = (sy / len) * R
      // the square's corners: corner 0, then turned forward by 90°·k
      fx[a] += cx + sx - x0
      fy[a] += cy + sy - y[a]
      fx[b] += cx - t * sy - x1
      fy[b] += cy + t * sx - y[b]
      fx[c] += cx - sx - x2
      fy[c] += cy - sy - y[c]
      fx[d] += cx + t * sy - x3
      fy[d] += cy - t * sx - y[d]
    }
    for (let v = 0; v < x.length; v++) {
      if (pinned[v]) continue
      x[v] = (((x[v] + fx[v] * 0.1) % WRAP) + WRAP) % WRAP
      y[v] += fy[v] * 0.1
    }
  }
  return { x, y, faces: m.faces, hex: m.hex }
}
