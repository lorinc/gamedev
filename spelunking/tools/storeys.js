// p8 · Storeys: writes the stages for seeds s … s+3 to gallery/p8/ (caves, floors, storeys, the lot),
// and checks the pass over many seeds: every seed places its pod, every storey is walkable (45° at
// most, across the wrap), no storey dead-ends, the same seed gives the same storeys. Usage: node tools/storeys.js [seed] [n]

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QCOLS, QROWS, buildGrid } from '../src/bundles/v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../src/bundles/v5/quadwfc.js'
import { paintStoreys } from '../src/bundles/v6/paint.js'
import { MERGED, SKNOBS, storeys } from '../src/bundles/v6/storeys.js'
import { rasterize } from '../src/bundles/v6/terrain.js'
import { encodePng } from './png.js'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'gallery', 'p8')
const first = Number(process.argv[2] || 1)
const many = Number(process.argv[3] || 100)

/** @param {number} seed */
function run(seed) {
  const G = buildGrid(seed, QKNOBS.relax, QCOLS, QROWS)
  const C = generateQuads(G, seed, QKNOBS)
  const T = rasterize(G, C)
  const t0 = performance.now()
  const S = storeys(T, SKNOBS)
  return { T, S, ms: performance.now() - t0 }
}

let bad = 0
const fail = (/** @type {string} */ m) => (bad++, console.log(m))
const sums = { floor: 0, bridge: 0, tunnel: 0, storeys: 0, ms: [] }
let pods = 0
for (let seed = first; seed < first + many; seed++) {
  const { T, S, ms } = run(seed)
  sums.ms.push(ms)
  if (!S.pod) {
    fail(`seed ${seed}: no pod`)
    continue
  }
  pods++
  for (const s of S.list)
    for (let x = 0; x < T.w; x++) if (Math.abs(s.y[x] - s.y[(x + 1) % T.w]) > 1) fail(`seed ${seed}: storey steeper than 45° at x ${x}`)
  // no dead ends: where a storey's drawn run stops (it merges), another storey passes right there
  for (const s of S.list)
    for (let x = 0; x < T.w; x++) {
      const a = s.kind[x] !== MERGED
      if (a === (s.kind[(x + 1) % T.w] !== MERGED)) continue
      const e = a ? x : (x + 1) % T.w
      if (!S.list.some((o) => o !== s && Math.abs(o.y[e] - s.y[e]) <= 2)) fail(`seed ${seed}: dead end at x ${e}, y ${s.y[e]}`)
    }
  sums.floor += S.share.floor
  sums.bridge += S.share.bridge
  sums.tunnel += S.share.tunnel
  sums.storeys += S.list.length
  if (seed === first) {
    const again = run(seed).S
    if (again.list.map((s) => s.y.join()).join() !== S.list.map((s) => s.y.join()).join()) fail(`seed ${seed}: NOT deterministic`)
  }
}
const pct = (/** @type {number} */ v) => ((v / pods) * 100).toFixed(0) + '%'
sums.ms.sort((a, b) => a - b)
console.log(
  `${many} seeds: pods ${pods}, storeys ${(sums.storeys / pods).toFixed(1)} a map, on floor ${pct(sums.floor)}, bridge ${pct(sums.bridge)}, tunnel ${pct(sums.tunnel)}; ` +
    `pass ${sums.ms[sums.ms.length >> 1].toFixed(0)} ms median, ${sums.ms[Math.floor(sums.ms.length * 0.9)].toFixed(0)} ms p90`,
)

/** @type {[string, import('../src/bundles/v6/paint.js').View][]} */
const STAGES = [
  ['1_caves', { floors: false, storeys: false, points: false }],
  ['2_floors', { floors: true, storeys: false, points: false }],
  ['3_storeys', { floors: false, storeys: true, points: false }],
  ['4_points', { floors: true, storeys: true, points: true }],
]
mkdirSync(OUT, { recursive: true })
const maps = [0, 1, 2, 3].map((n) => ({ seed: first + n, ...run(first + n) }))
for (const m of maps)
  console.log(
    `seed ${m.seed}: pod ${m.S.pod ? `x ${m.S.pod.c}, y ${m.S.pod.base}` : 'none'}, ${m.S.list.length} storeys, floor ${(m.S.share.floor * 100).toFixed(0)}% bridge ${(m.S.share.bridge * 100).toFixed(0)}% tunnel ${(m.S.share.tunnel * 100).toFixed(0)}%`,
  )
const GAP = 8
for (const [name, view] of STAGES) {
  const pics = maps.map((m) => paintStoreys(m.T, m.S, view, m.seed))
  const W = pics.reduce((a, p) => a + p.w, 0) + GAP * (pics.length - 1)
  const H = Math.max(...pics.map((p) => p.h))
  const rgb = Buffer.alloc(W * H * 3)
  let ox = 0
  for (const p of pics) {
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const i = (y * p.w + x) * 4
        const o = (y * W + ox + x) * 3
        rgb[o] = p.px[i]
        rgb[o + 1] = p.px[i + 1]
        rgb[o + 2] = p.px[i + 2]
      }
    ox += p.w + GAP
  }
  const file = join(OUT, `v6_seeds${first}-${first + 3}_${name}.png`)
  writeFileSync(file, encodePng(W, H, rgb))
  console.log(`wrote ${file}`)
}
if (bad) {
  console.log(`${bad} problems`)
  process.exit(1)
}
