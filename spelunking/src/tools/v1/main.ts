// Generator preview: sliders for every parameter, live map, stats, drop markers.

import { Application, BufferImageSource, Texture, TilingSprite } from 'pixi.js'
import { Pane } from 'tweakpane'
import { addRuleEditor, addRuleLegend } from '../../ui/ruleEditor'
import { DROP_RGB, TILE_RGB } from '../../render/palette'
import { computeStats } from '../../sim/gen/stats'
import { DEFAULT_PARAMS, generate, LAYER_NAMES, type GenParams, type Tile } from '../../sim/gen/world'

const STORAGE_KEY = 'cave-gen-params'

function load(): GenParams {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const p: GenParams = { ...structuredClone(DEFAULT_PARAMS), ...JSON.parse(saved) }
      // layers merge one level deep, so settings saved before a layer field existed still load
      for (const name of LAYER_NAMES) p[name] = { ...DEFAULT_PARAMS[name], ...p[name] }
      return p
    }
  } catch {
    // storage unavailable or corrupt: fall back to defaults
  }
  return structuredClone(DEFAULT_PARAMS)
}

function save(p: GenParams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // not critical
  }
}

const params = load()
const view = { zoom: 4, repeats: 1, showDrops: true }
const statsText = { text: '' }

const app = new Application()
await app.init({ width: 1, height: 1, background: '#050508', antialias: false, preserveDrawingBuffer: true })
document.getElementById('view')!.appendChild(app.canvas)

let sprite: TilingSprite | undefined

function regen() {
  const world = generate(params)
  const stats = computeStats(world)

  const rgba = new Uint8Array(world.w * world.h * 4)
  for (let i = 0; i < world.w * world.h; i++) {
    rgba.set(TILE_RGB[world.tiles[i] as Tile], i * 4)
    rgba[i * 4 + 3] = 255
  }
  if (view.showDrops) {
    for (const d of stats.dropList) {
      if (d.height < 3) continue
      rgba.set(d.height >= 5 ? DROP_RGB.panic : DROP_RGB.loud, (d.y * world.w + d.x) * 4)
    }
  }

  const source = new BufferImageSource({ resource: rgba, width: world.w, height: world.h, scaleMode: 'nearest' })
  const old = sprite
  sprite = new TilingSprite({
    texture: new Texture({ source }),
    width: world.w * view.zoom * view.repeats,
    height: world.h * view.zoom,
  })
  sprite.tileScale.set(view.zoom)
  app.stage.addChild(sprite)
  old?.destroy({ texture: true, textureSource: true })
  app.renderer.resize(sprite.width, sprite.height)

  const { drops, materialPct, openPctByQuarter } = stats
  statsText.text = [
    ...Object.entries(materialPct).map(([k, v]) => `${k.padEnd(5)} ${v}%`),
    `open/depth ${openPctByQuarter.join(' ')}`,
    `drop 1-2 ${drops.safe}`,
    `drop 3-4 ${drops.loud}`,
    `drop 5+  ${drops.panic}`,
  ].join('\n')
  save(params)
}

// --- panel ---

const pane = new Pane({ container: document.getElementById('panel')!, title: 'v1 · Cave generator' })

pane.addBinding(params, 'seed', { min: 0, max: 99999, step: 1 })
pane.addButton({ title: 'New seed' }).on('click', () => {
  params.seed = Math.floor(Math.random() * 100000)
  pane.refresh()
})
pane.addBinding(params, 'width', { options: { 32: 32, 64: 64, 128: 128 } })
pane.addBinding(params, 'height', { options: { 128: 128, 256: 256, 512: 512 } })
pane.addBinding(params, 'skyRows', { min: 0, max: 16, step: 1 })
pane.addBinding(params, 'crustRows', { min: 0, max: 16, step: 1 })
pane.addBinding(params, 'loot', { label: 'loot ‰', min: 0, max: 50, step: 1 })

const ruleRefreshers: (() => void)[] = []

for (const name of LAYER_NAMES) {
  const f = pane.addFolder({ title: name, expanded: name === 'galleries' || name === 'shafts' })
  const layer = params[name]
  f.addBinding(layer, 'density', { label: 'density ‰', min: 0, max: 1000, step: 5 })
  f.addBinding(layer, 'stepsX', { label: 'scale steps x', min: 0, max: 5, step: 1 })
  f.addBinding(layer, 'stepsY', { label: 'scale steps y', min: 0, max: 5, step: 1 })
  addRuleLegend(f)
  for (const key of ['first', 'mid', 'last'] as const)
    ruleRefreshers.push(addRuleEditor(f, layer, key, key, regen))
  f.addBinding(layer, 'edge', { label: 'beyond top/bottom', options: { empty: 0, filled: 1 } })
}

const viewFolder = pane.addFolder({ title: 'view' })
viewFolder.addBinding(view, 'zoom', { min: 1, max: 12, step: 1 })
viewFolder.addBinding(view, 'repeats', { label: 'repeat (wrap check)', min: 1, max: 3, step: 1 })
viewFolder.addBinding(view, 'showDrops', { label: 'mark drops 3-4 / 5+' })

pane.addBinding(statsText, 'text', { label: 'stats', readonly: true, multiline: true, rows: 11 })

pane.addButton({ title: 'Save PNG' }).on('click', () => {
  const a = document.createElement('a')
  a.href = app.canvas.toDataURL('image/png')
  a.download = `cave_seed${params.seed}.png`
  a.click()
})
pane.addButton({ title: 'Copy params JSON' }).on('click', () => {
  void navigator.clipboard.writeText(JSON.stringify(params, null, 2))
})
pane.addButton({ title: 'Reset to defaults' }).on('click', () => {
  for (const [k, v] of Object.entries(structuredClone(DEFAULT_PARAMS))) {
    const current = params[k as keyof GenParams]
    // layers are mutated in place: the rule editors hold references to them
    if (typeof v === 'object') Object.assign(current as object, v)
    else Object.assign(params, { [k]: v })
  }
  ruleRefreshers.forEach((r) => r())
  pane.refresh()
})

pane.on('change', regen)
regen()
