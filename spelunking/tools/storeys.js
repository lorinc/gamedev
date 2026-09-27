// p8 · Storeys: writes the stages for seeds s … s+3 to gallery/p8/ (caves, floors, storeys, the lot),
// and checks the pass over many seeds: every seed places its pod, every link is walkable (45° at most,
// across the wrap) and joins floors in the network, the same seed gives the same lattice. Usage: node tools/storeys.js [seed] [n]

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QCOLS, QROWS, buildGrid } from '../src/bundles/v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../src/bundles/v5/quadwfc.js'
import { paintStoreys } from '../src/bundles/v6/paint.js'
import { SKNOBS, storeys } from '../src/bundles/v6/storeys.js'
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
const sums = { reached: 0, points: 0, median: 0, links: 0, /** @type {number[]} */ worst: [], /** @type {number[]} */ ms: [] }
let pods = 0
for (let seed = first; seed < first + many; seed++) {
  const { T, S, ms } = run(seed)
  sums.ms.push(ms)
  if (!S.pod) {
    fail(`seed ${seed}: no pod`)
    continue
  }
  pods++
  // every link walkable (45° at most, a column per step) and ending on floors in the network
  for (const l of S.links) {
    for (let i = 1; i < l.px.length; i++) {
      const dx = Math.abs(l.px[i][0] - l.px[i - 1][0])
      if (Math.min(dx, T.w - dx) !== 1 || Math.abs(l.px[i][1] - l.px[i - 1][1]) > 1) fail(`seed ${seed}: link not walkable at ${l.px[i]}`)
    }
    if (!S.runs[l.a].net || !S.runs[l.b].net) fail(`seed ${seed}: link off the network`)
  }
  sums.reached += S.stats.reached / S.stats.floors
  sums.points += S.points.length
  sums.worst.push(S.stats.detourWorst)
  sums.median += S.stats.detourMedian
  sums.links += S.links.length
  if (seed === first) {
    const again = run(seed).S
    if (JSON.stringify(again.links.map((l) => l.px)) !== JSON.stringify(S.links.map((l) => l.px))) fail(`seed ${seed}: NOT deterministic`)
  }
}
sums.ms.sort((a, b) => a - b)
sums.worst.sort((a, b) => a - b)
console.log(
  `${many} seeds: pods ${pods}, floors reached ${((sums.reached / pods) * 100).toFixed(0)}%, ${(sums.links / pods).toFixed(1)} links and ${(sums.points / pods).toFixed(1)} divergence points a map; ` +
    `detour median ${(sums.median / pods).toFixed(2)}×, worst per map: median ${sums.worst[sums.worst.length >> 1].toFixed(2)}×, p90 ${sums.worst[Math.floor(sums.worst.length * 0.9)].toFixed(2)}×; ` +
    `pass ${sums.ms[sums.ms.length >> 1].toFixed(0)} ms median, ${sums.ms[Math.floor(sums.ms.length * 0.9)].toFixed(0)} ms p90`,
)

/** @type {[string, import('../src/bundles/v6/paint.js').View][]} */
const STAGES = [
  ['1_caves', { floors: false, storeys: false, points: false }],
  ['2_floors', { floors: true, storeys: false, points: false }],
  ['3_network', { floors: false, storeys: true, points: false }],
  ['4_points', { floors: true, storeys: true, points: true }],
]
mkdirSync(OUT, { recursive: true })
const maps = [0, 1, 2, 3].map((n) => ({ seed: first + n, ...run(first + n) }))
for (const m of maps)
  console.log(
    `seed ${m.seed}: pod ${m.S.pod ? `x ${m.S.pod.c}, y ${m.S.pod.base}` : 'none'}, ${m.S.stats.reached}/${m.S.stats.floors} floors, ${m.S.stats.ramps} ramps, ${m.S.stats.sideways} sideways, ${m.S.points.length} points, detour worst ${m.S.stats.detourWorst.toFixed(2)}×`,
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
