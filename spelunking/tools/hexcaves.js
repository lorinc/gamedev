// p7 · Hex Caves: writes the generator's stages for seeds 1–4 (side by side) to gallery/p7/, and
// checks the output: every pair of neighbouring hexes matches on all 3 sockets (across the wrap too),
// and the same seed gives the same map twice. Usage: node tools/hexcaves.js [first seed]

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { N, NEIGHBOURS } from '../src/bundles/v5/hex.js'
import { HEIGHT, WIDTH, paint, paintQuads } from '../src/bundles/v5/paint.js'
import { buildGrid } from '../src/bundles/v5/quadcaves.js'
import { QKNOBS, generateQuads, quadCavities } from '../src/bundles/v5/quadwfc.js'
import { cavities, raster } from '../src/bundles/v5/raster.js'
import { makeTiles, reversed, sideCode } from '../src/bundles/v5/tiles.js'
import { KNOBS, generate, prepare } from '../src/bundles/v5/wfc.js'
import { encodePng } from './png.js'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'gallery', 'p7')
const first = Number(process.argv[2] || 1)
const GAP = 8

const tiles = makeTiles()
const P = prepare(tiles)
console.log(`tiles: ${tiles.length}`)
const grid = buildGrid(1, 150)

let bad = 0
const fail = (/** @type {string} */ msg) => {
  bad++
  console.log(msg)
}
const maps = []
for (let seed = first; seed < first + 4; seed++) {
  const t0 = performance.now()
  const g = generate(P, seed, KNOBS)
  const ms = performance.now() - t0
  const again = generate(P, seed, KNOBS)
  if (again.tiles.join() !== g.tiles.join()) fail(`seed ${seed}: NOT deterministic`)
  if (!g.ok) fail(`seed ${seed}: failed after ${g.restarts} restarts`)
  for (let i = 0; i < N; i++)
    for (let k = 0; k < 3; k++) {
      const m = NEIGHBOURS[i][k]
      if (m < 0) continue
      const a = sideCode(tiles[g.tiles[i]].sockets, k)
      const b = sideCode(tiles[g.tiles[m]].sockets, k + 3)
      if (a !== reversed(b)) fail(`seed ${seed}: hex ${i} side ${k} doesn't match hex ${m}`)
    }
  const R = raster(tiles, g.tiles, seed, KNOBS.wobble)
  const cav = cavities(R.open, R.band)
  console.log(
    `seed ${seed}: ${ms.toFixed(0)} ms, ${g.restarts} restarts, ${cav.count} cavities, largest ${(cav.largest * 100).toFixed(0)}%, ${cav.tiny} tiny`,
  )
  const q0 = performance.now()
  const C = generateQuads(grid, seed, QKNOBS)
  const qms = performance.now() - q0
  const again2 = generateQuads(grid, seed, QKNOBS)
  if (again2.tile.join() !== C.tile.join()) fail(`seed ${seed}: quads NOT deterministic`)
  for (let q = 0; q < C.tile.length; q++)
    grid.mesh.faces[q].forEach((v, k) => {
      if (((C.tile[q] >> k) & 1) !== C.open[v]) fail(`seed ${seed}: quad ${q} disagrees with a neighbour on corner ${k}`)
    })
  const qc = quadCavities(grid, C)
  console.log(`  quads: ${qms.toFixed(0)} ms, ${qc.count} cavities, largest ${(qc.largest * 100).toFixed(0)}%, ${qc.tiny} tiny`)
  maps.push({ g, R, C })
}

/** @type {[string, import('../src/bundles/v5/paint.js').View][]} */
const STAGES = [
  ['1_classes', { mode: 'classes', grid: true, sockets: false }],
  ['2_sockets', { mode: 'classes', grid: true, sockets: true }],
  ['3_fine-plain', { mode: 'plain', grid: false, sockets: false }],
  ['4_fine-noise', { mode: 'noise', grid: false, sockets: false }],
  ['5_painted', { mode: 'painted', grid: false, sockets: false }],
]
mkdirSync(OUT, { recursive: true })
const w = WIDTH * 4 + GAP * 3
/** @type {[string, import('../src/bundles/v5/paint.js').View, 'hex' | 'quads'][]} */
const ALL = [
  ...STAGES.map(([n, v]) => /** @type {[string, typeof v, 'hex']} */ ([n, v, 'hex'])),
  ['6_quads', { mode: 'painted', grid: false, sockets: false }, 'quads'],
  ['7_quads-classes', { mode: 'classes', grid: false, sockets: false }, 'quads'],
]
for (const [name, view, kind] of ALL) {
  const rgb = Buffer.alloc(w * HEIGHT * 3)
  maps.forEach(({ g, R, C }, n) => {
    const px = kind === 'hex' ? paint(R, g.tiles, tiles, view) : paintQuads(grid, C, view)
    for (let y = 0; y < HEIGHT; y++)
      for (let x = 0; x < WIDTH; x++) {
        const o = (y * w + n * (WIDTH + GAP) + x) * 3
        const p = (y * WIDTH + x) * 4
        rgb[o] = px[p]
        rgb[o + 1] = px[p + 1]
        rgb[o + 2] = px[p + 2]
      }
  })
  const file = join(OUT, `v5_seeds${first}-${first + 3}_${name}.png`)
  writeFileSync(file, encodePng(w, HEIGHT, rgb))
  console.log(`wrote ${file}`)
}
if (bad) {
  console.log(`${bad} problems`)
  process.exit(1)
}
console.log('checks: sockets match across every edge (and the wrap); quads agree on every shared corner; same seed, same map')
