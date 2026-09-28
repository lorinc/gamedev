// The lattice (p9): every candidate the player could build, and what building one collapses. p8 drew one
// good collapsed network; here nothing is chosen up front (user: "a dense network of potential pathways
// (and walls), that the user can choose from"). The nodes are p8's floors; the candidate links are p8's
// (cutoffs, sideways links, 45° ramps); new are the candidate walls, at waists. A build collapses what
// clashes with it: links by p8's rule (D073: no X crossings, no parallels within a storey), walls near a
// wall, and anything that would put an airlock too close to another. Airlocks (plank-behaviour blocks)
// sit wherever a wall crosses a path, placed automatically (user). Everything is in raster px (K per cell).

import { ICE, SURFACE } from '../v5/wfc.js'
import { carvePod, placePod, POD_H, POD_W } from '../v6/storeys.js'
import { K, OPEN, ROCK, SEA, SKY } from '../v6/terrain.js'

/** The lattice knobs (the page's sliders); the cave knobs are p7's QKNOBS. */
export const LKNOBS = {
  storey: 3, // storey height, in cells; floor within ½ storey links sideways; parallels within a storey clash
  head: 1, // headroom a floor needs to be walkable, in cells (user: the character fits a 1-cell passage)
  cutoff: 3, // the longest cutoff (a short link from a floor's end to another's), in cells
  span: 12, // the longest sideways link (bridge or tunnel), in cells
  drop: 2, // the longest ramp, in storeys
  rockCost: 2, // a cell of tunnel costs this many cells of bridge (picks the cheapest candidate per stretch)
  parallel: 0.3, // a link clashes if this share of its middle runs within a storey of a path going the same way
  wall: 6, // the longest wall, in cells
  wallSep: 3, // candidate walls at least this far apart, in cells
  airGap: 5, // airlocks at least this far apart, in cells (user: discouraged in close proximity)
}
/** @typedef {typeof LKNOBS} LKnobs */

const AIR_CUT = 2 // in a cutoff, a pixel of walkway costs this many of removed rock (user: removal is preferred)

/**
 * @typedef {{xs: number[], ys: number[], ring: boolean}} Run a floor, its columns in walking order (wrapping)
 * @typedef {'cut' | 'side' | 'ramp' | 'wall'} Kind
 * @typedef {{id: number, kind: Kind, px: [number, number][], rock: number, cost: number, a?: number, b?: number}} Cand
 *   a candidate: its pixels, both ends included (a link's ends are on floors a and b; a wall's on rock)
 */

/**
 * @param {import('../v6/terrain.js').Terrain} T (its cls is changed: the pod is carved in)
 * @param {LKnobs} S
 */
export function lattice(T, S) {
  const { w, h, cls, band } = T
  const wrap = (/** @type {number} */ x) => ((x % w) + w) % w
  const at = (/** @type {number} */ x, /** @type {number} */ y) => (y < 0 ? SKY : y >= h ? ROCK : cls[y * w + wrap(x)])
  const L = Math.round(S.storey * K)
  const tol = L / 2
  const pod = placePod(T)
  if (pod) carvePod(T, pod)
  const dxw = (/** @type {number} */ a, /** @type {number} */ b) => {
    const d = Math.abs(wrap(a) - wrap(b))
    return Math.min(d, w - d)
  }
  const podHalf = (POD_W / 2) * K
  const inPod = (/** @type {number} */ x, /** @type {number} */ y) =>
    !!pod && dxw(x, pod.c) < podHalf - K && y <= pod.base + K && y >= pod.base - POD_H * K
  const iceAt = (/** @type {number} */ x, /** @type {number} */ y) => {
    const b = band[y * w + wrap(x)]
    return b === ICE || b === SURFACE
  }

  // walkable floor: open, rock below, headroom above (as p8)
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
  const pieces = []
  for (const g of groups.values()) {
    if (g.size < K) continue // crumbs under a cell aren't floor
    let inIce = 0
    for (const [x, y] of g) if (iceAt(x, y)) inIce++
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
  // close parallel floors: a piece within ½ storey of a longer one for most of its length is left out (D072)
  const colY = pieces.map((p) => new Map(p.xs.map((x, i) => [x, p.ys[i]])))
  /** @type {Run[]} */
  const runs = pieces.filter((p, b) =>
    !pieces.some((q, a) => {
      if (a === b || q.xs.length < p.xs.length || (q.xs.length === p.xs.length && a > b)) return false
      let near = 0
      p.xs.forEach((x, i) => {
        const y = colY[a].get(x)
        if (y !== undefined && Math.abs(y - p.ys[i]) <= tol) near++
      })
      return near >= 0.7 * p.xs.length
    }),
  )
  /** @type {Map<number, number>} floor pixel → run index */
  const runOf = new Map()
  runs.forEach((p, r) => p.xs.forEach((x, i) => runOf.set(id(x, p.ys[i]), r)))
  const runAt = (/** @type {number} */ x, /** @type {number} */ y) => runOf.get(id(wrap(x), y)) ?? -1

  // candidate links (p8's): the cheapest per pair of floors, direction and 4-cell stretch; cutoffs apart
  /** @type {Map<string, Cand>} */
  const links = new Map()
  const cutPx = S.cutoff * K
  const lens = runs.map((r) => r.xs.length)
  const atEnd = (/** @type {number} */ r, /** @type {number} */ i) => !runs[r].ring && (i <= K || i >= lens[r] - 1 - K)
  const idxOf = new Map()
  runs.forEach((p) => p.xs.forEach((x, i) => idxOf.set(id(x, p.ys[i]), i)))
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
    const bi = /** @type {number} */ (idxOf.get(id(wrap(ex), ey)))
    // a cutoff: short, end to end; removing rock is preferred to walkway (user)
    if (len <= cutPx && atEnd(a, ai) && atEnd(b, bi)) {
      const cost = len + (px.length - 2 - rock) * AIR_CUT
      const k = a < b ? `c${a}|${b}` : `c${b}|${a}`
      const o = links.get(k)
      if (!o || cost < o.cost) links.set(k, { id: 0, kind: 'cut', px, rock, cost, a, b })
      return
    }
    const cost = len + rock * (S.rockCost - 1)
    const old = links.get(key)
    if (!old || cost < old.cost) links.set(key, { id: 0, kind: ramp ? 'ramp' : 'side', px, rock, cost, a, b })
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

  // candidate walls: straight rock-to-rock crossings of open air (level, upright, both 45°) that are the
  // narrowest thereabouts (a waist: no narrower crossing the same way within 2 cells either side), the
  // shortest first, kept wallSep apart; none lying along a floor or in the pod
  const DIRS = /** @type {[number, number][]} */ ([
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ])
  /** @type {[number, number][]} the step across each direction */
  const PERP = [
    [1, 0],
    [0, 1],
    [1, -1],
    [1, 1],
  ]
  const maxN = Math.ceil(S.wall * K) + 1
  /** @type {{d: number, px: [number, number][], len: number, mx: number, my: number}[]} */
  const segs = []
  /** @type {Int16Array[]} per direction: the length (px) of the open crossing through each pixel; 0 = none */
  const segLen = DIRS.map(() => new Int16Array(w * h))
  DIRS.forEach(([dx, dy], d) => {
    for (let y = 1; y < h - 1; y++)
      for (let x = 0; x < w; x++) {
        if (cls[y * w + x] !== OPEN || at(x - dx, y - dy) === OPEN) continue
        if (at(x - dx, y - dy) !== ROCK) continue
        /** @type {[number, number][]} */
        const px = []
        let cx = x
        let cy = y
        while (at(cx, cy) === OPEN && px.length <= maxN) {
          px.push([wrap(cx), cy])
          cx += dx
          cy += dy
        }
        if (at(cx, cy) !== ROCK || px.length > maxN) continue
        const len = px.length * (dx && dy ? Math.SQRT2 : 1)
        for (const [px0, py0] of px) segLen[d][py0 * w + px0] = Math.ceil(len)
        const [mx, my] = px[px.length >> 1]
        segs.push({ d, px, len, mx, my })
      }
  })
  const wallOk = segs.filter((s) => {
    if (s.len < 2 || s.len > S.wall * K) return false
    let ice = 0
    let onFloor = 0
    for (const [x, y] of s.px) {
      if (iceAt(x, y)) ice++
      if (runOf.has(id(x, y))) onFloor++
      if (inPod(x, y)) return false
    }
    if (ice * 2 < s.px.length || onFloor > K) return false
    // a waist: open on both sides a cell away, and nothing narrower within 2 cells either side
    const [ux, uy] = PERP[s.d]
    for (const sg of [1, -1]) {
      if (at(s.mx + sg * ux * K, s.my + sg * uy * K) !== OPEN) return false
      for (let k = 1; k <= 2 * K; k++) {
        const x = wrap(s.mx + sg * ux * k)
        const y = s.my + sg * uy * k
        if (y < 0 || y >= h || cls[y * w + x] !== OPEN) break
        const l2 = segLen[s.d][y * w + x]
        if (l2 && l2 < Math.ceil(s.len)) return false
      }
    }
    return true
  })
  wallOk.sort((p, q) => p.len - q.len || p.d - q.d || p.my - q.my || p.mx - q.mx)
  const sepPx = S.wallSep * K
  /** @type {Cand[]} */
  const walls = []
  /** @type {{mx: number, my: number}[]} */
  const kept = []
  for (const s of wallOk) {
    if (kept.some((k) => Math.hypot(dxw(k.mx, s.mx), k.my - s.my) < sepPx)) continue
    kept.push(s)
    walls.push({ id: 0, kind: 'wall', px: s.px, rock: 0, cost: s.len })
  }

  /** @type {Cand[]} */
  const cands = [...links.values(), ...walls]
  cands.forEach((c, i) => (c.id = i))

  // the floors as paths, per column, with their local slope (for p8's parallel rule)
  /** @type {{y: number, link: boolean, s: number}[][]} */
  const floorTaken = Array.from({ length: w }, () => [])
  runs.forEach((run) => run.xs.forEach((x, i) => floorTaken[x].push({ y: run.ys[i], link: false, s: slopeAt(run.ys, i) })))
  /** @type {Set<number>} every floor pixel of the network */
  const floorPx = new Set(runOf.keys())

  const count = (/** @type {Kind} */ k) => cands.filter((c) => c.kind === k).length
  return {
    pod,
    floors,
    runs,
    cands,
    floorTaken,
    floorPx,
    w,
    L,
    stats: { cut: count('cut'), side: count('side'), ramp: count('ramp'), wall: count('wall') },
  }
}
/** @typedef {ReturnType<typeof lattice>} Lattice */

/** The local slope of a path at i, over ±2 px. @param {number[]} ys @param {number} i */
function slopeAt(ys, i) {
  const a = Math.max(0, i - 2)
  const b = Math.min(ys.length - 1, i + 2)
  return b > a ? (ys[b] - ys[a]) / (b - a) : 0
}

/**
 * What's left after the builds, in order: which candidates are still alive, and the airlocks. A link dies
 * if it crosses a built link or runs parallel to paths (floors and built links, p8's rule), or if it would
 * cross a built wall within airGap of an airlock; a wall dies within a cell of a built wall, or if one of
 * its airlocks would be within airGap of another. Deterministic: reverting a build is building the rest.
 * @param {Lattice} La @param {number[]} built candidate ids, in build order @param {LKnobs} S
 */
export function collapse(La, built, S) {
  const { w, L, cands } = La
  const tol = L / 2
  const gap = S.airGap * K
  const pid = (/** @type {number} */ x, /** @type {number} */ y) => y * w + x
  const dxw = (/** @type {number} */ a, /** @type {number} */ b) => {
    const d = Math.abs(a - b)
    return Math.min(d, w - d)
  }
  const taken = La.floorTaken.map((col) => col.slice())
  const pathPx = new Set(La.floorPx)
  /** @type {Set<number>} */
  const wallPx = new Set()
  /** @type {[number, number][]} */
  const airlocks = []

  /** Where a wall's pixels meet a path's: one airlock per touching stretch. @param {[number, number][]} wpx @param {(p: number) => boolean} isPath */
  const crossings = (wpx, isPath) => {
    /** @type {[number, number][]} */
    const out = []
    for (const [x, y] of wpx) {
      const hit =
        isPath(pid(x, y)) || isPath(pid(x, y - 1)) || isPath(pid(x, y + 1)) || isPath(pid((x + 1) % w, y)) || isPath(pid((x - 1 + w) % w, y))
      if (hit && !out.some(([ax, ay]) => Math.hypot(dxw(ax, x), ay - y) <= K)) out.push([x, y])
    }
    return out
  }
  /** Where a link's middle meets built walls. @param {Cand} c */
  const linkLocks = (c) => {
    /** @type {[number, number][]} */
    const out = []
    for (let i = 1; i < c.px.length - 1; i++) {
      const [x, y] = c.px[i]
      const hit = wallPx.has(pid(x, y)) || wallPx.has(pid(x, y - 1)) || wallPx.has(pid(x, y + 1))
      if (hit && !out.some(([ax, ay]) => Math.hypot(dxw(ax, x), ay - y) <= K)) out.push([x, y])
    }
    return out
  }
  const tooClose = (/** @type {[number, number][]} */ locks) =>
    locks.some(([x, y]) => airlocks.some(([ax, ay]) => Math.hypot(dxw(ax, x), ay - y) < gap))
  /** p8's clash rule (D073). @param {Cand} c */
  const clashes = (c) => {
    const m = Math.ceil(tol)
    const ys = c.px.map((p) => p[1])
    let near = 0
    let n = 0
    for (let i = 1; i < c.px.length - 1; i++) {
      const [x, y] = c.px[i]
      const col = taken[x]
      if (col.some((t) => t.link && Math.abs(t.y - y) <= 1)) return true
      if (i < m || i > c.px.length - 1 - m) continue
      n++
      const sl = slopeAt(ys, i)
      if (col.some((t) => Math.abs(t.y - y) <= L && Math.abs(t.s - sl) <= 0.5)) near++
    }
    return near > S.parallel * n
  }
  const nearWall = (/** @type {Cand} */ c) => {
    for (const [x, y] of c.px)
      for (let dy = -K; dy <= K; dy++) for (let dx = -K; dx <= K; dx++) if (wallPx.has(pid((x + dx + w) % w, y + dy))) return true
    return false
  }
  /** @param {Cand} c */
  const dead = (c) => (c.kind === 'wall' ? nearWall(c) || tooClose(crossings(c.px, (p) => pathPx.has(p))) : clashes(c) || tooClose(linkLocks(c)))

  // replay the builds in order (each was alive when built; one that no longer is, is dropped)
  /** @type {number[]} */
  const kept = []
  for (const i of built) {
    const c = cands[i]
    if (!c || dead(c)) continue
    kept.push(i)
    if (c.kind === 'wall') {
      airlocks.push(...crossings(c.px, (p) => pathPx.has(p)))
      for (const [x, y] of c.px) wallPx.add(pid(x, y))
    } else {
      airlocks.push(...linkLocks(c))
      const ys = c.px.map((p) => p[1])
      for (let i2 = 1; i2 < c.px.length - 1; i2++) {
        const [x, y] = c.px[i2]
        taken[x].push({ y, link: true, s: slopeAt(ys, i2) })
        pathPx.add(pid(x, y))
      }
    }
  }
  const builtSet = new Set(kept)
  const alive = cands.map((c) => !builtSet.has(c.id) && !dead(c))
  return { alive, airlocks, built: kept }
}
