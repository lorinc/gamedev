// Saves every generation step and the final world as PNGs, plus stats and params.
// Usage: npm run gallery -- [seed ...] [--params file.json]
// Output: gallery/<timestamp>_seed<N>/

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DROP_RGB, MASK_RGB, TILE_RGB, type Rgb } from '../src/render/palette'
import type { Grid } from '../src/sim/gen/ca'
import { computeStats } from '../src/sim/gen/stats'
import { DEFAULT_PARAMS, generate, type GenParams, type Tile } from '../src/sim/gen/world'
import { encodePng } from './png'

const PX = 4 // screen pixels per final-world tile

function render(w: number, h: number, scale: number, colorAt: (x: number, y: number) => Rgb): Buffer {
  const W = w * scale
  const H = h * scale
  const rgb = new Uint8Array(W * H * 3)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) rgb.set(colorAt(Math.trunc(x / scale), Math.trunc(y / scale)), (y * W + x) * 3)
  return encodePng(W, H, rgb)
}

const args = process.argv.slice(2)
const paramsIdx = args.indexOf('--params')
const base: GenParams =
  paramsIdx >= 0 ? { ...DEFAULT_PARAMS, ...JSON.parse(readFileSync(args[paramsIdx + 1], 'utf8')) } : DEFAULT_PARAMS
const seeds = args.filter((a, i) => /^\d+$/.test(a) && (paramsIdx < 0 || i !== paramsIdx + 1)).map(Number)
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

for (const seed of seeds.length ? seeds : [base.seed]) {
  const params = { ...base, seed }
  const dir = join('gallery', `${stamp}_seed${seed}`)
  mkdirSync(dir, { recursive: true })

  let n = 0
  const world = generate(params, (layer, label, g: Grid) => {
    // every step is drawn at the same on-screen size as the final world
    const scale = (params.width * PX) / g.w
    const name = `${String(++n).padStart(2, '0')}_${layer}_${label.replace(/[^a-z0-9]+/gi, '-')}.png`
    writeFileSync(join(dir, name), render(g.w, g.h, scale, (x, y) => MASK_RGB[g.cells[y * g.w + x]]))
  })

  const stats = computeStats(world)
  const tileAt = (x: number, y: number) => TILE_RGB[world.tiles[y * world.w + x] as Tile]
  writeFileSync(join(dir, `${String(++n).padStart(2, '0')}_world.png`), render(world.w, world.h, PX, tileAt))

  const marks = new Map(stats.dropList.filter((d) => d.height >= 3).map((d) => [d.y * world.w + d.x, d.height]))
  writeFileSync(
    join(dir, `${String(++n).padStart(2, '0')}_world_drops.png`),
    render(world.w, world.h, PX, (x, y) => {
      const h = marks.get(y * world.w + x)
      return h === undefined ? tileAt(x, y) : h >= 5 ? DROP_RGB.panic : DROP_RGB.loud
    }),
  )

  const { dropList: _, ...summary } = stats
  writeFileSync(join(dir, 'stats.json'), JSON.stringify(summary, null, 2))
  writeFileSync(join(dir, 'params.json'), JSON.stringify(params, null, 2))
  console.log(`${dir}  ${JSON.stringify(summary)}`)
}
