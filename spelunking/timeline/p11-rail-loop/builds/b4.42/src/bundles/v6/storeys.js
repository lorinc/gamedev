// The lattice pass (D068, reworked in D071 after the user's notes on seed 5512): floors first, links
// second. The nodes are the caverns' walkable floors. Candidate links join them: sideways links from a
// floor's end (a bridge in air, a tunnel in rock) to floor within ½ storey, and 45° ramps down from any
// floor onto another. A spanning tree of the cheapest links connects every floor it can reach from the
// pod; then ramps and links are added while the walk from the pod to some floor is more than `detour` ×
// the straight line. Divergence points sit only where there's a choice (forks), merged within 2 cells. Everything is in raster px (K per cell).

import { ICE, SURFACE } from '../v5/wfc.js'
import { K, OPEN, ROCK, SEA, SKY } from './terrain.js'

/** The lattice knobs (the page's sliders); the cave knobs are p7's QKNOBS. */
export const SKNOBS = {
  storey: 3, // storey height, in cells (user: 3 is enough); floor within ½ storey links sideways
  head: 1, // headroom a floor needs to be walkable, in cells (user: the character fits a 1-cell passage)
  cutoff: 3, // links this short or shorter join floor pieces into one floor first (user's tip), in cells
  minFloor: 3, // the shortest floor (with its cutoffs) the network must reach, in cells
  span: 12, // the longest sideways link (bridge or tunnel), in cells
  drop: 2, // the longest ramp, in storeys
  detour: 1.5, // the walk from the pod to any floor: at most this × the straight line
  rockCost: 2, // a cell of tunnel costs this many cells of bridge
}
/** @typedef {typeof SKNOBS} SKnobs */

/** The pod (user): a dome 8 + 2 cells wide and 4 + 1 high; it may cut into the ceiling. */
export const POD_W = 10
export const POD_H = 5
const DOOR = 2 // door height in the side walls, in cells
const AIR_CUT = 2 // in a cutoff, a pixel of walkway costs this many of removed rock (user: removal is preferred)
const SINK = 2 // how far the pod may sink into a floor that rises under it, in cells (user: floors aren't that level)

/**
 * @typedef {{xs: number[], ys: number[], cum: number[], ring: boolean, net: boolean}} Run a floor, its
 *   columns in walking order (wrapping), and the walking length up to each
 * @typedef {{a: number, ai: number, b: number, bi: number, px: [number, number][], rock: number, ramp: boolean, len: number, cost: number, cut?: boolean}} Link
 *   from run a at index ai to run b at index bi; px: its pixels, both ends included
 */

/**
 * @param {import('./terrain.js').Terrain} T (its cls is changed: the pod is carved in)
 * @param {SKnobs} S
 */
export function storeys(T, S) {
  const { w, h, cls, band } = T
  const wrap = (/** @type {number} */ x) => ((x % w) + w) % w
  const at = (/** @type {number} */ x, /** @type {number} */ y) => (y < 0 ? SKY : y >= h ? ROCK : cls[y * w + wrap(x)])
  const dxw = (/** @type {number} */ a, /** @type {number} */ b) => {
    const d = Math.abs(wrap(a) - wrap(b))
    return Math.min(d, w - d)
  }
  const L = Math.round(S.storey * K)
  const tol = L / 2
  const pod = placePod(T)
  if (pod) carvePod(T, pod)
  const podHalf = (POD_W / 2) * K
  // the pod's inside (its doors and walls excepted): links don't start in it or cross it
  const inPod = (/** @type {number} */ x, /** @type {number} */ y) =>
    !!pod && dxw(x, pod.c) < podHalf - K && y <= pod.base + K && y >= pod.base - POD_H * K

  // walkable floor: open, rock below, headroom above
  const headPx = Math.round(S.head * K)
  /** @type {number[][]} */
  const floors = Array.from({ length: w }, () => [])
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h - 1; y++) {
      if (cls[y * w + x] !== OPEN || cls[(y + 1) * w + x] !== ROCK) continue
      if (pod && dxw(x, pod.c) <= podHalf && y < pod.base - 1 && y >= pod.base - POD_H * K - 2) continue // the pod's roof
      let ok = true
      for (let d = 1; d < headPx && ok; d++) ok = at(x, y - d) === OPEN
      if (ok) floors[x].push(y)
    }
  // runs: floor pixels in neighbouring columns at most 1 px apart (45°), across the wrap
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
  /** @type {Map<number, Map<number, number>>} root → column → y (the highest floor pixel of it there) */
  const groups = new Map()
  for (let x = 0; x < w; x++)
    for (const y of floors[x]) {
      const r = find(id(x, y))
      let g = groups.get(r)
      if (!g) groups.set(r, (g = new Map()))
      if (!g.has(x)) g.set(x, y)
    }
  /** @type {Run[]} */
  const runs = []
  /** @type {Map<number, number>} floor pixel → run index (nodes only) */
  const runOf = new Map()
  /** @type {Map<number, number>} floor pixel → its index in its run */
  const idxOf = new Map()
  const minPx = S.minFloor * K
  /** @type {{xs: number[], ys: number[], ring: boolean}[]} */
  const pieces = []
  for (const g of groups.values()) {
    if (g.size < K) continue // crumbs under a cell aren't floor
    // only the ice layer's floors (p8 zooms in on it)
    let inIce = 0
    for (const [x, y] of g) if (band[y * w + x] === ICE || band[y * w + x] === SURFACE) inIce++
    if (inIce * 2 < g.size) continue
    let start = -1
    for (const x of g.keys()) if (!g.has(wrap(x - 1))) start = start < 0 ? x : Math.min(start, x)
    const ring = start < 0
    if (ring) start = 0
    /** @type {number[]} */ const xs = []
    /** @type {number[]} */ const ys = []
    for (let x = start, n = 0; g.has(wrap(x)) && n < w; x++, n++) {
      xs.push(wrap(x))
      ys.push(/** @type {number} */ (g.get(wrap(x))))
    }
    pieces.push({ xs, ys, ring })
  }
  // close parallel floors (user: "if they run very close to each other, then only one path is
  // needed"): a piece within ½ storey of a longer one for most of its length is left out
  const colY = pieces.map((p) => new Map(p.xs.map((x, i) => [x, p.ys[i]])))
  const shadowed = pieces.map((p, b) =>
    pieces.some((q, a) => {
      if (a === b || q.xs.length < p.xs.length || (q.xs.length === p.xs.length && a > b)) return false
      let near = 0
      p.xs.forEach((x, i) => {
        const y = colY[a].get(x)
        if (y !== undefined && Math.abs(y - p.ys[i]) <= tol) near++
      })
      return near >= 0.7 * p.xs.length
    }),
  )
  pieces.forEach((p, k) => {
    if (shadowed[k]) return
    const cum = [0]
    for (let i = 1; i < p.xs.length; i++) cum.push(cum[i - 1] + Math.hypot(1, p.ys[i] - p.ys[i - 1]))
    const r = runs.length
    runs.push({ xs: p.xs, ys: p.ys, cum, ring: p.ring, net: false })
    p.xs.forEach((x, i) => {
      runOf.set(id(x, p.ys[i]), r)
      idxOf.set(id(x, p.ys[i]), i)
    })
  })
  const runAt = (/** @type {number} */ x, /** @type {number} */ y) => runOf.get(id(wrap(x), y)) ?? -1

  // candidate links, the cheapest per pair of floors, direction and 4-cell stretch
  /** @type {Map<string, Link>} */
  const cands = new Map()
  /** @type {Map<string, Link>} the best cutoff per pair of pieces */
  const cuts = new Map()
  const cutPx = S.cutoff * K
  // a cutoff extends a floor: from one piece's end to within a cell of another's
  const atEnd = (/** @type {number} */ r, /** @type {number} */ i) => !runs[r].ring && (i <= K || i >= runs[r].xs.length - 1 - K)
  /** @param {string} key @param {number} a @param {number} ai @param {[number, number][]} px @param {boolean} ramp */
  const offer = (key, a, ai, px, ramp) => {
    const [ex, ey] = px[px.length - 1]
    const b = runAt(ex, ey)
    let rock = 0
    let len = 0
    for (let i = 1; i < px.length; i++) {
      len += Math.hypot(1, px[i][1] - px[i - 1][1])
      if (i < px.length - 1 && at(px[i][0], px[i][1]) === ROCK) rock++
    }
    const cost = len + rock * (S.rockCost - 1)
    const bi = /** @type {number} */ (idxOf.get(id(wrap(ex), ey)))
    const old = cands.get(key)
    if (!old || cost < old.cost) cands.set(key, { a, ai, b, bi, px, rock, ramp, len, cost })
    // a cutoff candidate: short, end to end; removing rock is preferred to walkway (user)
    if (len <= cutPx && atEnd(a, ai) && atEnd(b, bi)) {
      const cutCost = len + (px.length - 2 - rock) * AIR_CUT
      const k = a < b ? `${a}|${b}` : `${b}|${a}`
      const o = cuts.get(k)
      if (!o || cutCost < o.cost) cuts.set(k, { a, ai, b, bi, px, rock, ramp, len, cost: cutCost, cut: true })
    }
  }
  const spanPx = S.span * K
  const dropPx = S.drop * L
  runs.forEach((run, r) => {
    const n = run.xs.length
    // sideways, from each end: the first floor within ½ storey; the Y holds, then meets it at 45°
    if (!run.ring)
      for (const [i, d] of /** @type {[number, number][]} */ ([
        [0, -1],
        [n - 1, 1],
      ])) {
        const xe = run.xs[i]
        const ye = run.ys[i]
        for (let s = 1; s <= spanPx; s++) {
          const x = xe + d * s
          const c = at(x, ye)
          if (c === SKY || c === SEA) break
          let fy = -1
          for (const y of floors[wrap(x)]) {
            const b = runAt(x, y)
            if (b < 0 || Math.abs(y - ye) > Math.min(tol, s)) continue
            if (b === r) {
              fy = -2
              break
            }
            if (fy < 0 || Math.abs(y - ye) < Math.abs(fy - ye)) fy = y
          }
          if (fy === -2) break
          if (fy < 0) continue
          /** @type {[number, number][]} */
          const px = [[xe, ye]]
          const dy = fy - ye
          for (let t = 1; t <= s; t++) px.push([wrap(xe + d * t), Math.abs(dy) > s - t ? fy - Math.sign(dy) * (s - t) : ye])
          offer(`s${r}|${runAt(x, fy)}|${d}`, r, i, px, false)
          break
        }
      }
    // ramps: 45° up or down from a point of the floor (every half cell, and the ends), then, if it
    // lands on no floor, on sideways to the first floor within the span
    for (let i = 0; i < n; i++) {
      if (i % (K >> 1) && i !== n - 1) continue
      const x0 = run.xs[i]
      const y0 = run.ys[i]
      if (inPod(x0, y0)) continue
      for (const d of [1, -1])
        for (const v of [1, -1])
          ramp: for (let s = 1; s <= dropPx; s++) {
            const xs = x0 + d * s
            const ys = y0 + v * s
            const c = at(xs, ys)
            if (ys <= 0 || ys >= h - 1 || c === SKY || c === SEA || inPod(xs, ys)) break
            const b = runAt(xs, ys)
            if (b === r) break
            /** @type {[number, number][]} */
            const diag = []
            for (let t = 0; t <= s; t++) diag.push([wrap(x0 + d * t), y0 + v * t])
            if (b >= 0) {
              if (s >= 2) offer(`r${r}|${b}|${d}|${Math.floor(x0 / (4 * K))}`, r, i, diag, true)
              break
            }
            if (s < 2) continue
            for (let t = 1; t <= spanPx - s; t++) {
              const x = xs + d * t
              const c2 = at(x, ys)
              if (c2 === SKY || c2 === SEA || inPod(x, ys)) break
              for (const dy of [0, 1, -1]) {
                const b2 = runAt(x, ys + dy)
                if (b2 < 0) continue
                if (b2 === r) break ramp
                /** @type {[number, number][]} */
                const px = diag.slice()
                for (let u = 1; u < t; u++) px.push([wrap(xs + d * u), ys])
                px.push([wrap(x), ys + dy])
                offer(`r${r}|${b2}|${d}|${Math.floor(x0 / (4 * K))}`, r, i, px, true)
                break ramp
              }
            }
          }
    }
  })

  // first the cutoffs (user's tip): the shortest links join pieces of floor into longer floors; then the
  // spanning tree: the cheapest links first, each joining two floors long enough to count
  const all = [...cands.values()].sort((p, q) => p.cost - q.cost)
  const comp = runs.map((_, i) => i)
  const size = runs.map((r) => r.xs.length)
  const cf = (/** @type {number} */ a) => {
    while (comp[a] !== a) a = comp[a] = comp[comp[a]]
    return a
  }
  /** @type {Set<Link>} */
  const chosen = new Set()
  /** @type {Link[]} */
  const cutsChosen = []
  for (const l of [...cuts.values()].sort((p, q) => p.cost - q.cost)) {
    const p = cf(l.a)
    const q = cf(l.b)
    if (p === q) continue
    comp[p] = q
    size[q] += size[p] + l.px.length - 2
    chosen.add(l)
    cutsChosen.push(l)
  }
  // what's there already, by column: every floor, and every link chosen so far (user: "branch only when
  // needed, not before"; no X crossings; no paths running 2-3 blocks apart)
  // (each with its local slope, so only paths running the same way count as parallel)
  /** @param {number[]} ys @param {number} i */
  const slopeAt = (ys, i) => {
    const a = Math.max(0, i - 2)
    const b = Math.min(ys.length - 1, i + 2)
    return b > a ? (ys[b] - ys[a]) / (b - a) : 0
  }
  /** @type {{y: number, link: boolean, s: number}[][]} */
  const taken = Array.from({ length: w }, () => [])
  runs.forEach((run) => run.xs.forEach((x, i) => taken[x].push({ y: run.ys[i], link: false, s: slopeAt(run.ys, i) })))
  const take = (/** @type {Link} */ l) => {
    const ys = l.px.map((p) => p[1])
    for (let i = 1; i < l.px.length - 1; i++) taken[l.px[i][0]].push({ y: l.px[i][1], link: true, s: slopeAt(ys, i) })
  }
  for (const l of chosen) take(l)
  /** A link crosses a chosen link, or runs parallel within a storey of floor or links for over 30% of its middle. @param {Link} l */
  const clashes = (l) => {
    const m = Math.ceil(tol)
    const ys = l.px.map((p) => p[1])
    let near = 0
    let count = 0
    for (let i = 1; i < l.px.length - 1; i++) {
      const [x, y] = l.px[i]
      const col = taken[x]
      if (col.some((t) => t.link && Math.abs(t.y - y) <= 1)) return true
      if (i < m || i > l.px.length - 1 - m) continue
      count++
      const sl = slopeAt(ys, i)
      if (col.some((t) => Math.abs(t.y - y) <= L && Math.abs(t.s - sl) <= 0.5)) near++ // within a storey, same way (user: 2-3 blocks apart is too close)
    }
    return near > 0.3 * count
  }
  for (const pass of [true, false])
    for (const l of all) {
      const p = cf(l.a)
      const q = cf(l.b)
      if (p === q || size[p] < minPx || size[q] < minPx) continue
      // first only links that clash with nothing; then, for floors still apart, the cheapest anyway
      if (pass && clashes(l)) continue
      comp[p] = q
      size[q] += size[p]
      chosen.add(l)
      take(l)
    }
  const podRun = pod ? runAt(pod.c, pod.base) : -1
  if (podRun >= 0) for (let r = 0; r < runs.length; r++) runs[r].net = cf(r) === cf(podRun)
  for (const l of [...chosen]) if (!runs[l.a].net) chosen.delete(l)

  // walking distances from the pod: along floors, and over links
  const podI = podRun >= 0 ? /** @type {number} */ (idxOf.get(id(pod ? pod.c : 0, pod ? pod.base : 0))) : 0
  const along = (/** @type {Run} */ run, /** @type {number} */ i, /** @type {number} */ j) => {
    const d = Math.abs(run.cum[i] - run.cum[j])
    return run.ring ? Math.min(d, run.cum[run.cum.length - 1] + 1 - d) : d
  }
  /** Distance to every run's attachment points, from the pod. @returns {Map<number, Map<number, number>>} run → index → distance */
  const walk = () => {
    /** @type {Map<number, Set<number>>} */
    const verts = new Map()
    const addV = (/** @type {number} */ r, /** @type {number} */ i) => {
      let s = verts.get(r)
      if (!s) verts.set(r, (s = new Set([0, runs[r].xs.length - 1])))
      s.add(i)
    }
    addV(podRun, podI)
    for (const l of chosen) addV(l.a, l.ai), addV(l.b, l.bi)
    /** @type {Map<number, Map<number, number>>} */
    const dist = new Map()
    for (const [r, s] of verts) dist.set(r, new Map([...s].map((i) => [i, Infinity])))
    /** @type {[number, number, number][]} */
    const open = [[0, podRun, podI]]
    const podDist = /** @type {Map<number, number>} */ (dist.get(podRun))
    podDist.set(podI, 0)
    /** @type {Map<number, [number, number, number][]>} run * 100000 + index → [run, index, length] over a link */
    const byEnd = new Map()
    for (const l of chosen) {
      for (const [r, i, r2, i2] of [
        [l.a, l.ai, l.b, l.bi],
        [l.b, l.bi, l.a, l.ai],
      ]) {
        const k = r * 100000 + i
        let e = byEnd.get(k)
        if (!e) byEnd.set(k, (e = []))
        e.push([r2, i2, l.len])
      }
    }
    while (open.length) {
      let m = 0
      for (let j = 1; j < open.length; j++) if (open[j][0] < open[m][0]) m = j
      const [d, r, i] = open[m]
      open[m] = open[open.length - 1]
      open.pop()
      const dr = /** @type {Map<number, number>} */ (dist.get(r))
      if (d > /** @type {number} */ (dr.get(i))) continue
      const relax = (/** @type {number} */ r2, /** @type {number} */ i2, /** @type {number} */ nd) => {
        const m2 = /** @type {Map<number, number>} */ (dist.get(r2))
        if (nd < /** @type {number} */ (m2.get(i2))) {
          m2.set(i2, nd)
          open.push([nd, r2, i2])
        }
      }
      for (const j of dr.keys()) if (j !== i) relax(r, j, d + along(runs[r], i, j))
      for (const [r2, i2, len] of byEnd.get(r * 100000 + i) || []) relax(r2, i2, d + len)
    }
    return dist
  }
  const distAt = (/** @type {Map<number, Map<number, number>>} */ dist, /** @type {number} */ r, /** @type {number} */ i) => {
    const m = dist.get(r)
    if (!m) return Infinity
    let best = Infinity
    for (const [j, d] of m) best = Math.min(best, d + along(runs[r], i, j))
    return best
  }
  const C = 5 * K // damping, so floors right next to the pod don't count as huge detours
  const mid = (/** @type {number} */ r) => runs[r].xs.length >> 1
  const straight = (/** @type {number} */ r) => {
    const i = mid(r)
    return Math.hypot(dxw(runs[r].xs[i], pod ? pod.c : 0), runs[r].ys[i] - (pod ? pod.base : 0))
  }
  const ratio = (/** @type {number} */ d, /** @type {number} */ r) => (d + C) / (straight(r) + C)

  // detours: while the walk to some floor is too long, add the link into it that shortens it most
  /** @type {Set<number>} */
  const stuck = new Set()
  let dist = podRun >= 0 ? walk() : new Map()
  for (let iter = 0; iter < 60 && podRun >= 0; iter++) {
    let worst = -1
    let wr = S.detour
    for (let r = 0; r < runs.length; r++) {
      if (!runs[r].net || stuck.has(r) || runs[r].xs.length < 2 * K) continue
      const q = ratio(distAt(dist, r, mid(r)), r)
      if (q > wr) (wr = q), (worst = r)
    }
    if (worst < 0) break
    const now = distAt(dist, worst, mid(worst))
    /** @type {Link | null} */
    let pick = null
    let pickD = now * 0.9
    for (const l of all) {
      if (chosen.has(l) || clashes(l)) continue
      for (const [r, i, r2, i2] of [
        [l.a, l.ai, l.b, l.bi],
        [l.b, l.bi, l.a, l.ai],
      ]) {
        if (r2 !== worst || !runs[r].net) continue
        const nd = distAt(dist, r, i) + l.len + along(runs[worst], i2, mid(worst))
        if (nd < pickD) (pickD = nd), (pick = l)
      }
    }
    if (!pick) {
      stuck.add(worst)
      continue
    }
    chosen.add(pick)
    take(pick)
    dist = walk()
  }

  // divergence points: where the way forks (3+ ways; a floor's end is a stop, not a choice), merged
  // within 2 cells
  /** @type {Map<number, number>} run * 100000 + index → links attached */
  const attach = new Map()
  for (const l of chosen)
    for (const [r, i] of [
      [l.a, l.ai],
      [l.b, l.bi],
    ])
      attach.set(r * 100000 + i, (attach.get(r * 100000 + i) || 0) + 1)
  /** @type {{x: number, y: number}[]} */
  const raw = []
  runs.forEach((run, r) => {
    if (!run.net) return
    const n = run.xs.length
    const at2 = new Set([0, n - 1])
    for (const k of attach.keys()) if (Math.floor(k / 100000) === r) at2.add(k % 100000)
    for (const i of at2) {
      // a way along the floor counts if more than a cell of floor is left that way (no stubs)
      const ways = (run.ring || run.cum[i] > K ? 1 : 0) + (run.ring || run.cum[n - 1] - run.cum[i] > K ? 1 : 0) + (attach.get(r * 100000 + i) || 0)
      if (ways >= 3) raw.push({ x: run.xs[i], y: run.ys[i] })
    }
  })
  /** @type {{x: number, y: number}[]} */
  const points = []
  for (const p of raw) if (!points.some((q) => Math.hypot(dxw(p.x, q.x), p.y - q.y) < 2 * K)) points.push(p)

  // the numbers
  const links = [...chosen]
  // floors = pieces joined by cutoffs, long enough to count; reached = those in the pod's network
  /** @type {Map<number, number>} */
  const floorLen = new Map()
  const cc = runs.map((_, i) => i)
  const ccf = (/** @type {number} */ a) => {
    while (cc[a] !== a) a = cc[a] = cc[cc[a]]
    return a
  }
  for (const l of cutsChosen) cc[ccf(l.a)] = ccf(l.b) // cutoffs of floors on and off the network
  runs.forEach((r, i) => floorLen.set(ccf(i), (floorLen.get(ccf(i)) || 0) + r.xs.length))
  const bigFloors = [...floorLen].filter(([, n]) => n >= minPx).map(([k]) => k)
  const netRuns = bigFloors.filter((k) => runs.some((r, i) => r.net && ccf(i) === k)).length
  const ratios = runs.flatMap((run, r) => (run.net && run.xs.length >= 2 * K ? [ratio(distAt(dist, r, mid(r)), r)] : [])).sort((a, b) => a - b)
  let floorPx = 0
  for (const run of runs) if (run.net) floorPx += run.xs.length
  let bridgePx = 0
  let tunnelPx = 0
  let cutPxs = 0
  for (const l of links)
    for (let i = 1; i < l.px.length - 1; i++) l.cut ? cutPxs++ : at(l.px[i][0], l.px[i][1]) === ROCK ? tunnelPx++ : bridgePx++
  return {
    pod,
    floors,
    runs,
    links,
    points,
    stats: {
      floors: bigFloors.length,
      reached: netRuns,
      cutoffs: links.filter((l) => l.cut).length,
      ramps: links.filter((l) => l.ramp && !l.cut).length,
      sideways: links.filter((l) => !l.ramp && !l.cut).length,
      cutPx: cutPxs,
      floorPx,
      bridgePx,
      tunnelPx,
      detourMedian: ratios.length ? ratios[ratios.length >> 1] : 0,
      detourWorst: ratios.length ? ratios[ratios.length - 1] : 0,
      stuck: stuck.size,
    },
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
export function carvePod(T, pod) {
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
