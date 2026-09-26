// A random search over the quad WFC's knobs, the hidden ones too (user). Goal: the ice layer's stats
// like seed 18142 with the user's setting, but steadier from seed to seed; the pudding and brine
// shouldn't drift far from how the user's setting has them. Runs on every core.
// Usage: node tools/knobsearch.js [samples] [out.json]

import { fork } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { fileURLToPath } from 'node:url'
import { QCOLS, QROWS, buildGrid } from '../src/bundles/v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../src/bundles/v5/quadwfc.js'
import { BRINE, ICE, PUDDING } from '../src/bundles/v5/wfc.js'

/** @typedef {typeof QKNOBS} K */

// the user's setting (their link, seed 18142 looked right)
const USER = {
  ...QKNOBS,
  openIce: 0.275,
  openPudding: 0.4,
  openBrine: 0.05,
  grow: 5,
  rock: 2.5,
  straight: 1.05,
  thin: 0.8,
  wobble: 0.5,
}
const TARGET_SEED = 18142
const TRAIN = Array.from({ length: 12 }, (_, i) => 1001 + i)
const VERIFY = Array.from({ length: 40 }, (_, i) => 2001 + i)
const STATS = /** @type {const} */ (['open', 'rooms', 'meanRoom', 'tiny', 'largest'])

// the search space: [min, max, 'log' | 'lin' | values]
/** @type {Record<string, [number, number, string] | number[]>} */
const SPACE = {
  openIce: [0.1, 0.6, 'lin'],
  grow: [1, 20, 'log'],
  rock: [0.5, 10, 'log'],
  straight: [0.3, 5, 'log'],
  thin: [0, 1.6, 'lin'],
  wallW: [0.05, 5, 'log'],
  nookW: [0.05, 5, 'log'],
  innerW: [0.05, 5, 'log'],
  saddleW: [0.001, 0.5, 'log'],
  edgeAff: [0.2, 5, 'log'],
  openEdge: [0.2, 5, 'log'],
  rockEdge: [0.2, 5, 'log'],
  thinForce: [0.001, 1, 'log'],
  thinAngle: [90, 170, 'lin'],
  relax: [30, 75, 150, 300],
}

/** @type {Map<string, import('../src/bundles/v5/quadcaves.js').Grid>} */
const grids = new Map()
/** @param {number} seed @param {number} relax */
function grid(seed, relax) {
  const key = seed + ':' + relax
  let g = grids.get(key)
  if (!g) {
    g = buildGrid(seed, relax, QCOLS, QROWS)
    grids.set(key, g)
  }
  return g
}

/**
 * One layer's stats: its open share, rooms (caves of 20+ corners), their mean size, tiny caves, the
 * largest cave's share of the layer's open corners. Caves are cut at the layer's border.
 * @param {import('../src/bundles/v5/quadcaves.js').Grid} G @param {ReturnType<typeof generateQuads>} C @param {number} b
 */
function layer(G, C, b) {
  const V = C.open.length
  const inL = new Uint8Array(V)
  G.mesh.faces.forEach((f, q) => {
    if (C.band[q] === b) for (const v of f) inL[v] = 1
  })
  /** @type {number[][]} */
  const adj = Array.from({ length: V }, () => [])
  for (const [a, c] of G.walls)
    if (inL[a] && inL[c] && C.open[a] && C.open[c]) {
      adj[a].push(c)
      adj[c].push(a)
    }
  let n = 0
  let open = 0
  const seen = new Uint8Array(V)
  /** @type {number[]} */
  const sizes = []
  for (let v = 0; v < V; v++) {
    if (!inL[v]) continue
    n++
    if (!C.open[v]) continue
    open++
    if (seen[v]) continue
    let size = 0
    const stack = [v]
    seen[v] = 1
    while (stack.length) {
      const p = /** @type {number} */ (stack.pop())
      size++
      for (const q of adj[p])
        if (!seen[q]) {
          seen[q] = 1
          stack.push(q)
        }
    }
    sizes.push(size)
  }
  const rooms = sizes.filter((s) => s >= 20)
  return {
    open: open / n,
    rooms: rooms.length,
    meanRoom: rooms.length ? rooms.reduce((a, c) => a + c, 0) / rooms.length : 0,
    tiny: sizes.length - rooms.length,
    largest: open ? Math.max(...sizes) / open : 0,
  }
}

/** Stats per layer on one seed. @param {K} K @param {number} seed */
function measure(K, seed) {
  const G = grid(seed, K.relax)
  const C = generateQuads(G, seed, K)
  return { ice: layer(G, C, ICE), pudding: layer(G, C, PUDDING), brine: layer(G, C, BRINE) }
}

/** @param {number[]} xs */
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
/** @param {number[]} xs */
const sd = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))

/**
 * Lower is better: the ice's mean off the target (openness 3×), plus its spread across seeds (both relative to the
 * target), plus half-weight drift of the pudding's and brine's open share and largest cave.
 * @param {K} K @param {number[]} seeds @param {any} target @param {any} base
 */
function score(K, seeds, target, base) {
  const runs = seeds.map((s) => measure(K, s))
  let miss = 0
  let spread = 0
  /** @type {Record<string, {mean: number, sd: number}>} */
  const ice = {}
  for (const m of STATS) {
    const xs = runs.map((r) => r.ice[m])
    const scale = Math.max(target[m], 1e-3)
    ice[m] = { mean: mean(xs), sd: sd(xs) }
    miss += (m === 'open' ? 3 : 1) * ((mean(xs) - target[m]) / scale) ** 2 // openness shows most
    spread += (sd(xs) / scale) ** 2
  }
  let drift = 0
  for (const L of /** @type {const} */ (['pudding', 'brine']))
    for (const m of /** @type {const} */ (['open', 'largest'])) {
      const xs = runs.map((r) => r[L][m])
      drift += 0.5 * ((mean(xs) - base[L][m]) / Math.max(base[L][m], 1e-3)) ** 2
    }
  return { score: miss + spread + drift, miss, spread, drift, ice }
}

/** A seeded pick in the space. @param {() => number} rnd */
function sample(rnd) {
  /** @type {any} */
  const K = { ...USER }
  for (const [k, sp] of Object.entries(SPACE)) {
    if (typeof sp[2] !== 'string') K[k] = sp[Math.floor(rnd() * sp.length)]
    else {
      const [lo, hi, how] = /** @type {[number, number, string]} */ (sp)
      K[k] = how === 'log' ? Math.exp(Math.log(lo) + rnd() * (Math.log(hi) - Math.log(lo))) : lo + rnd() * (hi - lo)
    }
  }
  return /** @type {K} */ (K)
}

/** A nearby setting: every knob nudged by up to ±25%, kept in range. @param {K} K @param {() => number} rnd */
function nudge(K, rnd) {
  /** @type {any} */
  const N = { ...K }
  for (const [k, sp] of Object.entries(SPACE)) {
    if (typeof sp[2] !== 'string') {
      if (rnd() < 0.2) N[k] = sp[Math.floor(rnd() * sp.length)]
      continue
    }
    const [lo, hi] = /** @type {[number, number, string]} */ (sp)
    const v =
      k === 'thin' || k === 'thinAngle' || k === 'openIce' ? N[k] + (rnd() - 0.5) * 0.25 * (hi - lo) : N[k] * Math.exp((rnd() - 0.5) * 0.5)
    N[k] = Math.min(hi, Math.max(lo, v))
  }
  return /** @type {K} */ (N)
}

/** @param {number} seed */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}

// ---- worker: scores the settings it's sent ----
if (process.argv[2] === '--worker') {
  process.on('message', (/** @type {any} */ msg) => {
    const out = msg.jobs.map((/** @type {any} */ K) => ({ K, ...score(K, msg.seeds, msg.target, msg.base) }))
    process.send?.(out)
  })
} else {
  const total = Number(process.argv[2] || 800)
  const outFile = process.argv[3] || 'knobsearch.json'
  const target = measure(USER, TARGET_SEED).ice
  console.log('target (ice, seed 18142):', fmt(target))
  const baseRuns = TRAIN.map((s) => measure(USER, s))
  const base = {
    pudding: { open: mean(baseRuns.map((r) => r.pudding.open)), largest: mean(baseRuns.map((r) => r.pudding.largest)) },
    brine: { open: mean(baseRuns.map((r) => r.brine.open)), largest: mean(baseRuns.map((r) => r.brine.largest)) },
  }
  const cores = availableParallelism()
  /** @param {any[]} jobs @param {number[]} seeds @returns {Promise<any[]>} */
  const run = async (jobs, seeds) => {
    const parts = Array.from({ length: cores }, (_, i) => jobs.filter((_, j) => j % cores === i))
    const results = await Promise.all(
      parts.map(
        (part) =>
          new Promise((resolve) => {
            const w = fork(fileURLToPath(import.meta.url), ['--worker'])
            w.on('message', (m) => {
              resolve(m)
              w.kill()
            })
            w.send({ jobs: part, seeds, target, base })
          }),
      ),
    )
    return /** @type {any[]} */ (results.flat()).sort((a, b) => a.score - b.score)
  }
  const rnd = rng(7)
  let t0 = Date.now()
  const user = (await run([USER], TRAIN))[0]
  console.log(
    `the user's setting on ${TRAIN.length} seeds: score ${user.score.toFixed(2)} (miss ${user.miss.toFixed(2)}, spread ${user.spread.toFixed(2)}, drift ${user.drift.toFixed(2)})`,
  )
  const r1 = await run(
    Array.from({ length: total }, () => sample(rnd)),
    TRAIN,
  )
  console.log(`random: ${total} settings in ${((Date.now() - t0) / 1000).toFixed(0)} s; best ${r1[0].score.toFixed(2)}`)
  t0 = Date.now()
  const top = r1.slice(0, 8)
  const r2 = await run(
    top.flatMap((r) => Array.from({ length: Math.round(total / 16) }, () => nudge(r.K, rnd))),
    TRAIN,
  )
  const pool = [...r1, ...r2].sort((a, b) => a.score - b.score)
  console.log(`refine: ${r2.length} nearby settings in ${((Date.now() - t0) / 1000).toFixed(0)} s; best ${pool[0].score.toFixed(2)}`)
  const finals = await run([USER, ...pool.slice(0, 7).map((r) => r.K)], VERIFY)
  console.log(`verified on ${VERIFY.length} fresh seeds:`)
  for (const f of finals)
    console.log(
      `  ${f.K === USER || JSON.stringify(f.K) === JSON.stringify(USER) ? "USER's " : ''}score ${f.score.toFixed(2)} (miss ${f.miss.toFixed(2)}, spread ${f.spread.toFixed(2)}, drift ${f.drift.toFixed(2)})  ice ${fmtIce(f.ice)}`,
    )
  writeFileSync(outFile, JSON.stringify({ target, base, user, finals, top: pool.slice(0, 20) }, null, 1))
  console.log(`wrote ${outFile}`)
}

/** @param {any} s */
function fmt(s) {
  return STATS.map((m) => `${m} ${s[m].toFixed(m === 'open' || m === 'largest' ? 2 : 1)}`).join(', ')
}
/** @param {any} ice */
function fmtIce(ice) {
  return STATS.map((m) => `${m} ${ice[m].mean.toFixed(m === 'open' || m === 'largest' ? 2 : 1)}±${ice[m].sd.toFixed(2)}`).join(', ')
}
