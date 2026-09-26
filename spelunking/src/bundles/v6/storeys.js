// The storey pass (D068): walkable floors from the raster, the pod on natural floor near the centre, and
// the storeys grown from it. A storey follows floors within ½ storey of its current Y and holds its Y
// (a bridge in air, a tunnel in rock) where there's none; a 45° pass keeps every change walkable. Each
// next storey, up or down from the pod's, starts at the foot of a 45° ramp near where the last one
// started. A storey closer than ½ storey to the one it came from merges into it, meeting it at 45°. Everything is in raster px (K per cell).

import { ICE, SURFACE } from '../v5/wfc.js'
import { K, OPEN, ROCK, SKY } from './terrain.js'

/** The storey knobs (the page's sliders); the cave knobs are p7's QKNOBS. */
export const SKNOBS = {
  storey: 3, // storey height, in cells (user: 3 is enough)
  tol: 0.5, // a storey follows floor within this share of a storey (user: ½)
  head: 2, // headroom a floor needs to be walkable, in cells
  minFloor: 2, // the shortest floor worth following, in cells
  reach: 15, // how far from the storey's start its ramp down may go, in cells
}
/** @typedef {typeof SKNOBS} SKnobs */

/** The pod (user): a dome 8 + 2 cells wide and 4 + 1 high; it may cut into the ceiling. */
export const POD_W = 10
export const POD_H = 5
const DOOR = 2 // door height in the side walls, in cells
const SINK = 2 // how far the pod may sink into a floor that rises under it, in cells (user: floors aren't that level)

export const FLOOR = 0
export const BRIDGE = 1
export const TUNNEL = 2
export const MERGED = 3
export const KINDS = ['floor', 'bridge', 'tunnel', 'merged']

/**
 * @param {import('./terrain.js').Terrain} T (its cls is changed: the pod is carved in)
 * @param {SKnobs} S
 */
export function storeys(T, S) {
  const { w, h, cls, band, crust } = T
  const at = (/** @type {number} */ x, /** @type {number} */ y) => (y < 0 ? SKY : y >= h ? ROCK : cls[y * w + (((x % w) + w) % w)])
  const wrap = (/** @type {number} */ x) => ((x % w) + w) % w
  const L = Math.round(S.storey * K) // a storey, in px
  const tol = S.tol * L
  const pod = placePod(T)
  if (pod) carvePod(T, pod)

  // walkable floor: open, rock below, headroom above
  const headPx = Math.round(S.head * K)
  /** @type {number[][]} */
  const floors = Array.from({ length: w }, () => [])
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h - 1; y++) {
      if (cls[y * w + x] !== OPEN || cls[(y + 1) * w + x] !== ROCK) continue
      let ok = true
      for (let d = 1; d < headPx && ok; d++) ok = at(x, y - d) === OPEN
      if (ok) floors[x].push(y)
    }
  // floor runs: floor pixels in neighbouring columns at most 1 px apart (45°), across the wrap
  const id = (/** @type {number} */ x, /** @type {number} */ y) => y * w + x
  /** @type {Map<number, number>} */
  const parent = new Map()
  const find = (/** @type {number} */ a) => {
    let r = a
    while (/** @type {number} */ (parent.get(r)) !== r) r = /** @type {number} */ (parent.get(r))
    while (a !== r) {
      const n = /** @type {number} */ (parent.get(a))
      parent.set(a, r)
      a = n
    }
    return r
  }
  for (let x = 0; x < w; x++) for (const y of floors[x]) parent.set(id(x, y), id(x, y))
  for (let x = 0; x < w; x++)
    for (const y of floors[x])
      for (const y2 of floors[wrap(x + 1)]) if (Math.abs(y2 - y) <= 1) parent.set(find(id(x, y)), find(id(wrap(x + 1), y2)))
  /** @type {Map<number, Set<number>>} */
  const cols = new Map()
  for (let x = 0; x < w; x++)
    for (const y of floors[x]) {
      const r = find(id(x, y))
      let set = cols.get(r)
      if (!set) cols.set(r, (set = new Set()))
      set.add(x)
    }
  const runLen = (/** @type {number} */ x, /** @type {number} */ y) => /** @type {Set<number>} */ (cols.get(find(id(x, y)))).size
  const minPx = S.minFloor * K
  const good = (/** @type {number} */ x, /** @type {number} */ y) => runLen(x, y) >= minPx

  /** Grows a storey from (sx, sy) both ways round the wrap; returns its Y per column, 45° at most. @param {number} sx @param {number} sy */
  const grow = (sx, sy) => {
    const t = new Float64Array(w)
    t[sx] = sy
    const half = w >> 1
    for (const dir of [1, -1]) {
      let cur = sy
      const steps = dir === 1 ? half : w - half - 1
      for (let i = 1; i <= steps; i++) {
        const x = wrap(sx + dir * i)
        const fs = floors[x].filter((y) => good(x, y))
        // the same floor carries on; else the nearest within ½ storey; else hold the Y
        let next = fs.find((y) => Math.abs(y - cur) <= 1)
        if (next === undefined) {
          let best = Infinity
          for (const y of fs) if (Math.abs(y - cur) <= tol && Math.abs(y - cur) < best) (best = Math.abs(y - cur)), (next = y)
        }
        if (next !== undefined) cur = next
        t[x] = cur
      }
    }
    // 45°: no column may be more than 1 px (per column) below a higher one near it; the lower side
    // becomes a slope (a ramp over the floor, or through rock)
    const y = Float64Array.from(t)
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 2 * w; i++) y[i % w] = Math.min(y[i % w], y[(i - 1 + w) % w] + 1)
      for (let i = 2 * w; i > 0; i--) y[i % w] = Math.min(y[i % w], y[(i + 1) % w] + 1)
    }
    return Int32Array.from(y)
  }
  /** What a storey runs on at column x. @param {number} x @param {number} y */
  const kindAt = (x, y) => {
    const c = at(x, y)
    if (c === ROCK) return TUNNEL
    if (c === OPEN && at(x, y + 1) === ROCK) {
      for (let d = 1; d < headPx; d++) if (at(x, y - d) !== OPEN) return TUNNEL // a squeeze: the ceiling must go
      return FLOOR
    }
    return BRIDGE
  }

  /** @type {{y: Int32Array, kind: Uint8Array, sx: number}[]} */
  const list = []
  /** @type {{x: number, y: number, dir: number, len: number, up: boolean}[]} */
  const ramps = []
  /** @type {{x: number, y: number}[]} */
  const joins = [] // where a storey merges into the one it came from
  /**
   * A chain of storeys from the pod's, up (user: "extend the network above the pod as well") or down.
   * Each next storey starts at the foot of a 45° ramp near where the last one started.
   * @param {{y: Int32Array, kind: Uint8Array, sx: number}} first @param {boolean} up
   */
  const chain = (first, up) => {
    let from = first
    const sign = up ? -1 : 1
    for (let n = 0; n < 16; n++) {
      // the ramp: near this storey's start, where its foot lands best on real floor
      let best = { score: Infinity, x: 0, dir: 1, len: L }
      for (let r = -S.reach * K; r <= S.reach * K; r++) {
        const x = wrap(from.sx + r)
        if (from.kind[x] === MERGED) continue
        for (const dir of [1, -1])
          for (let len = Math.ceil(L - tol); len <= L + tol; len++) {
            const fx = wrap(x + dir * len)
            const fy = from.y[x] + sign * len
            const onFloor = floors[fx].some((v) => v === fy && good(fx, v))
            let rock = 0
            for (let i = 1; i < len; i++) if (at(x + dir * i, from.y[x] + sign * i) === ROCK) rock++
            const score = (onFloor ? 0 : 50) + Math.abs(len - L) + rock * 0.25 + Math.abs(r) * 0.02
            if (score < best.score) best = { score, x, dir, len }
          }
      }
      const fx = wrap(best.x + best.dir * best.len)
      const fy = from.y[best.x] + sign * best.len
      if (up) {
        if (fy - headPx < crust[fx] + K) break // no room under the crust
      } else {
        const b = band[Math.min(h - 1, fy) * w + fx]
        if (fy >= h || (b !== ICE && b !== SURFACE)) break // the ice layer ends
      }
      ramps.push({ x: best.x, y: from.y[best.x], dir: best.dir, len: best.len, up })
      const next = storey(fx, fy, from, up)
      list.push(next)
      from = next
    }
  }
  /**
   * A storey from (sx, sy); closer than ½ storey to the one it came from (or past it), it merges: it
   * takes that storey's line there, and climbs or drops into it at 45° (no dead ends).
   * @param {number} sx @param {number} sy @param {{y: Int32Array} | null} from @param {boolean} up
   */
  const storey = (sx, sy, from, up) => {
    const y = grow(sx, sy)
    if (up) {
      // it stays under the crust with its headroom: where it would break through, it dips (at 45°)
      for (let x = 0; x < w; x++) y[x] = Math.max(y[x], crust[x] + K + headPx)
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < 2 * w; i++) y[i % w] = Math.max(y[i % w], y[(i - 1 + w) % w] - 1)
        for (let i = 2 * w; i > 0; i--) y[i % w] = Math.max(y[i % w], y[(i + 1) % w] - 1)
      }
    }
    if (from) {
      const f = from.y
      const merged = Uint8Array.from(y, (v, x) => ((up ? f[x] - v : v - f[x]) < tol ? 1 : 0))
      const v = Float64Array.from(y, (yy, x) => (merged[x] ? f[x] : yy))
      // down chains merge upwards (lift the neighbours), up chains downwards (lower them)
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < 2 * w; i++) {
          const a = i % w
          const b = (i - 1 + w) % w
          v[a] = up ? Math.max(v[a], v[b] - 1) : Math.min(v[a], v[b] + 1)
        }
        for (let i = 2 * w; i > 0; i--) {
          const a = i % w
          const b = (i + 1) % w
          v[a] = up ? Math.max(v[a], v[b] - 1) : Math.min(v[a], v[b] + 1)
        }
      }
      for (let x = 0; x < w; x++) y[x] = v[x]
      const kind = Uint8Array.from(y, (yy, x) => (yy === f[x] ? MERGED : kindAt(x, yy)))
      for (let x = 0; x < w; x++)
        if ((kind[x] === MERGED) !== (kind[wrap(x + 1)] === MERGED)) joins.push(kind[x] === MERGED ? { x, y: y[x] } : { x: wrap(x + 1), y: y[wrap(x + 1)] })
      return { y, kind, sx }
    }
    return { y, kind: Uint8Array.from(y, (yy, x) => kindAt(x, yy)), sx }
  }
  if (pod) {
    const first = storey(pod.c, pod.base, null, false)
    list.push(first)
    chain(first, false)
    chain(first, true)
  }

  // divergence points: ramp heads and feet, and where a storey goes from floor to bridge or tunnel
  // and back (runs under a cell don't count)
  /** @type {{x: number, y: number}[]} */
  const points = []
  for (const r of ramps) points.push({ x: r.x, y: r.y }, { x: wrap(r.x + r.dir * r.len), y: r.y + (r.up ? -r.len : r.len) })
  points.push(...joins)
  for (const s of list) {
    const k = Array.from(s.kind, (v) => (v === FLOOR ? 0 : v === MERGED ? 2 : 1))
    for (let pass = 0; pass < 2; pass++)
      for (let x = 0; x < w; x++) {
        if (k[x] === k[wrap(x - 1)]) continue
        let len = 0
        while (len < w && k[wrap(x + len)] === k[x]) len++
        if (len < K) for (let i = 0; i < len; i++) k[wrap(x + i)] = k[wrap(x - 1)]
      }
    for (let x = 0; x < w; x++) if (k[x] !== k[wrap(x - 1)] && k[x] !== 2 && k[wrap(x - 1)] !== 2) points.push({ x, y: s.y[x] })
  }

  // shares of the storeys' length (merged stretches counted once, with the storey above)
  const count = [0, 0, 0]
  for (const s of list) for (const v of s.kind) if (v !== MERGED) count[v]++
  const total = count[0] + count[1] + count[2] || 1
  return {
    pod,
    floors,
    list,
    ramps,
    points,
    share: { floor: count[0] / total, bridge: count[1] / total, tunnel: count[2] / total },
    crust,
  }
}
/** @typedef {ReturnType<typeof storeys>} Storeys */

/**
 * The pod's spot (user): on natural floor, near the centre, under the crust, on every seed. The search
 * goes by depth bands of one storey below the crust, and in each band from the centre outwards; the
 * floor must hold the pod's width: it may sink into floor up to SINK cells higher (user: "cavern floor is not
 * expected to be THAT flat and level") and span a cell of dip; any headroom: the dome cuts the ceiling.
 * @param {import('./terrain.js').Terrain} T
 */
export function placePod(T) {
  const { w, h, cls, band, crust } = T
  const half = (POD_W * K) >> 1
  const idx = (/** @type {number} */ x, /** @type {number} */ y) => y * w + (((x % w) + w) % w)
  const floorAt = (/** @type {number} */ x, /** @type {number} */ y) => y > 0 && y < h - 1 && cls[idx(x, y)] === OPEN && cls[idx(x, y + 1)] === ROCK
  /** @type {{c: number, base: number, dx: number, support: number, key: number}[]} */
  const spots = []
  for (let c = 0; c < w; c++)
    for (let y = 0; y < h - 1; y++) {
      if (!floorAt(c, y)) continue
      const b = band[idx(c, y)]
      if (b !== ICE && b !== SURFACE) continue
      let support = 0
      let under = true
      for (let x = c - half; x < c + half && under; x++) {
        let ok = false
        for (let d = -SINK * K; d <= K && !ok; d++) ok = floorAt(x, y + d) // floor up to SINK above the base: the pod sinks in
        if (ok) support++
        // the dome stays under the crust, with a cell of ice over it
        if (y - POD_H * K < crust[((x % w) + w) % w] + K) under = false
      }
      if (!under) continue
      const depth = Math.floor((y - crust[c]) / (3 * K))
      const dx = Math.abs(c - w / 2)
      spots.push({ c, base: y, dx, support: support / (2 * half), key: depth * 10 * w + dx })
    }
  // a central window first (deeper inside it before going wider), the whole width on floor if possible;
  // then the best-supported spot anywhere: there's always a pod
  for (const win of [w / 6, w / 3, w / 2])
    for (const need of [1, 0.8, 0.6]) {
      let best = null
      for (const s of spots) if (s.dx <= win && s.support >= need && (!best || s.key < best.key)) best = s
      if (best) return { c: best.c, base: best.base, support: best.support }
    }
  let best = null
  for (const s of spots) if (!best || s.support > best.support || (s.support === best.support && s.key < best.key)) best = s
  if (best) return { c: best.c, base: best.base, support: best.support }
  return null
}

/**
 * Carves the pod into the raster: the dome's inside open, a flat slab under it, the shell rock with a
 * door in each side wall. @param {import('./terrain.js').Terrain} T @param {{c: number, base: number}} pod
 */
function carvePod(T, pod) {
  const { w, h, cls } = T
  const ro = (POD_W / 2) * K // outer half-width
  const ri = ro - K
  const ho = POD_H * K
  const hi = ho - K
  for (let dx = -ro; dx < ro; dx++) {
    const x = (((pod.c + dx) % w) + w) % w
    const fx = (dx + 0.5) / ro
    const fi = (dx + 0.5) / ri
    for (let dy = 0; dy <= ho; dy++) {
      const y = pod.base - dy
      if (y < 0 || y >= h) continue
      const outer = fx * fx + (dy / ho) ** 2 <= 1
      const inner = Math.abs(fi) <= 1 && fi * fi + (dy / hi) ** 2 <= 1
      if (inner || (outer && dy < DOOR * K)) cls[y * w + x] = OPEN
      else if (outer) cls[y * w + x] = ROCK
    }
    for (let d = 1; d <= K; d++) if (pod.base + d < h) cls[(pod.base + d) * w + x] = ROCK
  }
}

/** What part of the pod a pixel is, dx from its centre and dy up from its base: 1 shell or slab, 2 inside, 0 not the pod. @param {number} dx @param {number} dy */
export function podPart(dx, dy) {
  const ro = (POD_W / 2) * K
  const ri = ro - K
  const ho = POD_H * K
  const hi = ho - K
  const fx = (dx + 0.5) / ro
  const fi = (dx + 0.5) / ri
  if (dy < 0 || dx < -ro || dx >= ro) return dy < 0 && dy >= -K && dx >= -ro && dx < ro ? 1 : 0
  if (Math.abs(fi) <= 1 && fi * fi + (dy / hi) ** 2 <= 1) return 2 // inside
  if (fx * fx + (dy / ho) ** 2 <= 1) return dy < DOOR * K ? 2 : 1 // shell (doors are inside)
  return 0
}
