// Draws favicon.png (32×32) from a 16×16 map in the game's palette, and copies it next to every
// page that links it: spelunking/ (dev pages), timeline/ (the site root) and each frozen build.
// Usage: node tools/favicon.js

import { copyFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TILE_RGB } from '../src/render/palette.js'
import { Tile } from '../src/sim/gen/world.js'
import { encodePng } from './png.js'

// The Engineer on the surface, a diagonal tunnel down into a cave, hard rock, ore and loot.
const MAP = [
  'SSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSS',
  'SSSSSCCSSSSSSSSS',
  'SSSSSCeSSSSSSSSS',
  'SSSSSCCSSSSSSSSS',
  'SSSSSCCSSSSSSSSS',
  'ssssssss.sssssss',
  'sssssssss.ssssss',
  'ssHHssssss.sssss',
  'sHHHHssssss.sooo',
  'sHHHssssssss.soo',
  'sssssss$sssss.ss',
  'ss$sssssssss...s',
  'sssss...........',
  'ss..............',
  'ssssssss...$ssss',
]

/** @type {Record<string, readonly [number, number, number]>} */
const RGB = {
  S: TILE_RGB[Tile.Sky],
  s: TILE_RGB[Tile.Soft],
  H: TILE_RGB[Tile.Hard],
  o: TILE_RGB[Tile.Ore],
  $: TILE_RGB[Tile.Loot],
  '.': TILE_RGB[Tile.Open],
  C: [244, 241, 222], // CHAR in src/bundles/b1/render.js
  e: [5, 5, 8], // the eye
}

const SCALE = 2
const N = 16 * SCALE
const rgb = new Uint8Array(N * N * 3)
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) rgb.set(RGB[MAP[(y / SCALE) | 0][(x / SCALE) | 0]], (y * N + x) * 3)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'favicon.png')
writeFileSync(src, encodePng(N, N, rgb))
const targets = [join(root, 'timeline')]
for (const entry of readdirSync(join(root, 'timeline')).filter((d) => /^p\d+-/.test(d))) {
  const builds = join(root, 'timeline', entry, 'builds')
  if (existsSync(builds)) for (const b of readdirSync(builds)) targets.push(join(builds, b))
}
for (const t of targets) copyFileSync(src, join(t, 'favicon.png'))
console.log(`favicon.png → spelunking/ + ${targets.length} copies`)
