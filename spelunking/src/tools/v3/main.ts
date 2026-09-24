// v3 · Terrain: a v2 recipe shapes the caves, the same recipe with another seed splits
// soft / hard rock, then ore (its own CA layer) and loot are placed in the rock.

import { Pane } from 'tweakpane'
import { DROP_RGB, TILE_RGB } from '../../render/palette'
import { migrate, type Pipeline } from '../../sim/gen/pipeline'
import { computeStats } from '../../sim/gen/stats'
import { DEFAULT_TERRAIN, generateTerrain, type TerrainParams } from '../../sim/gen/terrain'
import type { Tile, World } from '../../sim/gen/world'
import { addRuleEditor, addRuleLegend } from '../../ui/ruleEditor'

const STORAGE_KEY = 'v3-terrain'

function load(): TerrainParams {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const p: TerrainParams = { ...structuredClone(DEFAULT_TERRAIN), ...JSON.parse(saved) }
      p.ore = { ...DEFAULT_TERRAIN.ore, ...p.ore }
      p.recipe = migrate(p.recipe)
      return p
    }
  } catch {
    // storage unavailable or corrupt: fall back to defaults
  }
  return structuredClone(DEFAULT_TERRAIN)
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // not critical
  }
}

const params = load()
const view = { zoom: 0, tiles: 1, showDrops: false }
let world: World

function render() {
  world = generateTerrain(params)
  const stats = computeStats(world)
  const marks = new Map<number, number>()
  if (view.showDrops) for (const d of stats.dropList) if (d.height >= 3) marks.set(d.y * world.w + d.x, d.height)

  const canvas = document.getElementById('map') as HTMLCanvasElement
  const W = world.w * view.tiles
  canvas.width = W
  canvas.height = world.h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(W, world.h)
  for (let y = 0; y < world.h; y++)
    for (let x = 0; x < W; x++) {
      const i = y * world.w + (x % world.w)
      const h = marks.get(i)
      const c = h === undefined ? TILE_RGB[world.tiles[i] as Tile] : h >= 5 ? DROP_RGB.panic : DROP_RGB.loud
      img.data.set([c[0], c[1], c[2], 255], (y * W + x) * 4)
    }
  ctx.putImageData(img, 0, 0)

  const box = document.getElementById('view')!
  const fit = Math.max(1, Math.floor(Math.min((box.clientWidth - 16) / W, (box.clientHeight - 16) / world.h)))
  const zoom = view.zoom || fit
  canvas.style.width = `${W * zoom}px`
  canvas.style.height = `${world.h * zoom}px`

  const m = stats.materialPct
  document.getElementById('stats')!.textContent =
    `${world.w}×${world.h}   open ${m.open}%   soft ${m.soft}%   hard ${m.hard}%   ore ${m.ore}%   loot ${m.loot}%` +
    `   drops 3-4: ${stats.drops.loud}  5+: ${stats.drops.panic}`
  save()
}

// --- panel ---

const pane = new Pane({ container: document.getElementById('panel')!, title: 'v3 · Terrain' })
const refreshers: (() => void)[] = []
const random = () => Math.floor(Math.random() * 100000)

pane.addButton({ title: 'New seeds (all layers)' }).on('click', () => {
  params.caveSeed = random()
  params.hardSeed = random()
  params.oreSeed = random()
  params.lootSeed = random()
  pane.refresh()
})

const caves = pane.addFolder({ title: 'caves + rock (v2 recipe)' })
caves.addBinding(params, 'caveSeed', { label: 'cave seed', min: 0, max: 99999, step: 1 })
caves.addBinding(params, 'caveIsLive', { label: 'cave = live (yellow in v2)' })
caves.addBinding(params, 'hardSeed', { label: 'hard rock seed', min: 0, max: 99999, step: 1 })
caves.addButton({ title: 'Paste recipe from v2 (Copy pipeline JSON)' }).on('click', () => {
  const text = prompt('Paste pipeline JSON from v2')
  if (!text) return
  try {
    params.recipe = migrate(JSON.parse(text) as Pipeline)
    render()
  } catch {
    alert('Not valid pipeline JSON')
  }
})
caves.addButton({ title: 'Back to archived recipe' }).on('click', () => {
  params.recipe = structuredClone(DEFAULT_TERRAIN.recipe)
  render()
})

const ore = pane.addFolder({ title: 'ore' })
ore.addBinding(params.ore, 'density', { label: 'density ‰', min: 0, max: 1000, step: 5 })
ore.addBinding(params, 'oreSeed', { label: 'ore seed', min: 0, max: 99999, step: 1 })
ore.addBinding(params.ore, 'stepsX', { label: 'scale steps x', min: 0, max: 5, step: 1 })
ore.addBinding(params.ore, 'stepsY', { label: 'scale steps y', min: 0, max: 5, step: 1 })
addRuleLegend(ore)
for (const key of ['first', 'mid', 'last'] as const) refreshers.push(addRuleEditor(ore, params.ore, key, key, render))

const loot = pane.addFolder({ title: 'loot' })
loot.addBinding(params, 'loot', { label: 'loot ‰ of rock', min: 0, max: 200, step: 1 })
loot.addBinding(params, 'lootSeed', { label: 'loot seed', min: 0, max: 99999, step: 1 })

const v = pane.addFolder({ title: 'view' })
v.addBinding(view, 'zoom', { label: 'zoom (0 = fit)', min: 0, max: 16, step: 1 })
v.addBinding(view, 'tiles', { label: 'repeat x (wrap check)', min: 1, max: 3, step: 1 })
v.addBinding(view, 'showDrops', { label: 'mark drops 3-4 / 5+' })

pane.addButton({ title: 'Save PNG' }).on('click', () => {
  const a = document.createElement('a')
  a.href = (document.getElementById('map') as HTMLCanvasElement).toDataURL('image/png')
  a.download = `terrain_cave${params.caveSeed}_hard${params.hardSeed}.png`
  a.click()
})
pane.addButton({ title: 'Copy params JSON' }).on('click', () => {
  void navigator.clipboard.writeText(JSON.stringify(params, null, 2))
})
pane.addButton({ title: 'Reset to defaults' }).on('click', () => {
  const d = structuredClone(DEFAULT_TERRAIN)
  Object.assign(params.ore, d.ore) // bound objects are mutated in place
  Object.assign(params, { ...d, ore: params.ore })
  refreshers.forEach((r) => r())
  pane.refresh()
})

pane.on('change', render)
window.addEventListener('resize', render)
render()
