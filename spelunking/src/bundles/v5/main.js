// v5 · Hex Caves: four generated maps side by side (seeds s … s+3), the knobs, the view toggles and
// the stats. Two generators: the quad WFC on the relaxed Townscaper-style grid (the default), and the
// hex WFC it replaced (p7's first build). Everything else lives in the pure modules next to this one.

import { HEIGHT, WIDTH, paint, paintQuads, quadSize } from './paint.js'
import { QCOLS, QROWS, buildGrid } from './quadcaves.js'
import { QKNOBS, generateQuads, quadCavities } from './quadwfc.js'
import { cavities, raster } from './raster.js'
import { makeTiles } from './tiles.js'
import { KNOBS, generate, prepare } from './wfc.js'

const tiles = makeTiles()
const P = prepare(tiles)

const params = new URLSearchParams(location.search)
let seed = Number(params.get('seed')) || 1
/** @type {'quads' | 'hex'} */
let gen = params.get('gen') === 'hex' ? 'hex' : 'quads'
/** @type {Record<string, number>} */
const knobs = { ...KNOBS }
/** @type {Record<string, number>} */
const qknobs = { ...QKNOBS }
/** @type {import('./paint.js').View} */
const view = { mode: 'painted', grid: false, sockets: false }
// the URL carries every knob (k=name:value,…), so a setting can be shared as a link
for (const kv of (params.get('k') || '').split(',')) {
  const [name, v] = kv.split(':')
  const target = gen === 'hex' ? knobs : qknobs
  if (name in target && isFinite(Number(v))) target[name] = Number(v)
}

/** @typedef {[string, string, number, number, number]} Slider key, label, min, max, step */
/** @type {Slider[]} */
const OPEN = [
  ['openIce', 'ice open', 0, 1, 0.005],
  ['openPudding', 'pudding open', 0, 1, 0.005],
  ['openBrine', 'brine open', 0, 1, 0.005],
]
/** @type {Slider[]} */
const HEX_SLIDERS = [
  ...OPEN,
  ['grow', 'caves grow', 0.5, 6, 0.1],
  ['rock', 'rock grows', 0.5, 6, 0.1],
  ['cont', 'corridor on', 0.1, 10, 0.1],
  ['turn', 'turn', 0.1, 10, 0.1],
  ['branch', 'branch', 0.1, 10, 0.1],
  ['straight', 'walls straight', 0.5, 8, 0.1],
  ['wobble', 'layer wobble', 0, 4, 0.5],
]
/** @type {Slider[]} */
const QUAD_SLIDERS = [
  ...OPEN,
  ['grow', 'caves grow', 1, 100, 0.5],
  ['rock', 'rock grows', 1, 100, 0.5],
  ['straight', 'walls straight', 0.1, 20, 0.05],
  ['thin', 'thinnest wall (cells, 0 = any)', 0, 6, 0.1],
  ['wobble', 'layer wobble', 0, 4, 0.5],
]

const bar = /** @type {HTMLElement} */ (document.getElementById('bar'))
const mapsEl = /** @type {HTMLElement} */ (document.getElementById('maps'))

/** @param {string} tag @param {Record<string, string>} [attrs] @param {string} [text] */
function el(tag, attrs = {}, text = '') {
  const e = document.createElement(tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (text) e.textContent = text
  return e
}

/** A radio group. @param {string} name @param {string[]} values @param {string} now @param {(v: string) => void} on */
function radios(name, values, now, on) {
  for (const v of values) {
    const l = el('label')
    const r = /** @type {HTMLInputElement} */ (el('input', { type: 'radio', name }))
    r.checked = v === now
    r.addEventListener('change', () => on(v))
    l.append(r, ' ' + v)
    bar.append(l)
  }
}

bar.append(el('b', {}, 'v5 · Hex Caves'))
const seedBox = /** @type {HTMLInputElement} */ (el('input', { type: 'number', value: String(seed) }))
const prev = el('button', {}, '◀')
const next = el('button', {}, '▶')
const reroll = el('button', {}, 'reroll')
const seedLabel = el('label', {}, 'seed ')
seedLabel.append(seedBox)
bar.append(seedLabel, prev, next, reroll)
seedBox.addEventListener('change', () => setSeed(Number(seedBox.value) || 1))
prev.addEventListener('click', () => setSeed(Math.max(1, seed - 4)))
next.addEventListener('click', () => setSeed(seed + 4))
reroll.addEventListener('click', () => setSeed(1 + Math.floor(Math.random() * 99999)))

bar.append(el('span', {}, '·'))
radios('gen', ['quads', 'hex'], gen, (v) => {
  gen = v === 'hex' ? 'hex' : 'quads'
  showSliders()
  url()
  build()
})
bar.append(el('span', {}, '·'))
radios('mode', ['painted', 'classes'], view.mode, (v) => {
  view.mode = v === 'classes' ? 'classes' : 'painted'
  draw()
})
for (const key of /** @type {const} */ (['grid', 'sockets'])) {
  const l = el('label')
  const c = /** @type {HTMLInputElement} */ (el('input', { type: 'checkbox' }))
  c.addEventListener('change', () => {
    view[key] = c.checked
    draw()
  })
  l.append(c, key === 'grid' ? ' grid' : ' sockets (hex)')
  bar.append(l)
}

/** @type {(() => void)[]} */
const resets = []
/** @param {Slider[]} list @param {Record<string, number>} target @param {Record<string, number>} defaults */
function sliders(list, target, defaults) {
  const group = el('span')
  for (const [key, label, min, max, step] of list) {
    const l = el('label', {}, ' ' + label + ' ')
    const r = /** @type {HTMLInputElement} */ (el('input', { type: 'range', min: String(min), max: String(max), step: String(step) }))
    r.value = String(target[key])
    const out = el('span', {}, String(target[key]))
    const changed = () => {
      target[key] = Number(r.value)
      out.textContent = r.value
      schedule()
    }
    r.addEventListener('input', changed)
    // micro-tuning: the wheel moves one step, ten with Shift
    r.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const n = (e.deltaY < 0 || e.deltaX < 0 ? 1 : -1) * (e.shiftKey ? 10 : 1)
        const v = Math.min(max, Math.max(min, Number(r.value) + n * step))
        r.value = String(+(Math.round(v / step) * step).toFixed(3))
        changed()
      },
      { passive: false },
    )
    resets.push(() => {
      target[key] = defaults[key]
      r.value = out.textContent = String(defaults[key])
    })
    l.append(r, out)
    group.append(l)
  }
  bar.append(group)
  return group
}
const hexGroup = sliders(HEX_SLIDERS, knobs, KNOBS)
const quadGroup = sliders(QUAD_SLIDERS, qknobs, QKNOBS)
function showSliders() {
  hexGroup.style.display = gen === 'hex' ? '' : 'none'
  quadGroup.style.display = gen === 'quads' ? '' : 'none'
}
showSliders()
const reset = el('button', {}, 'reset knobs')
reset.addEventListener('click', () => {
  for (const f of resets) f()
  schedule()
})
bar.append(reset)

/** @type {{canvas: HTMLCanvasElement, cap: HTMLElement}[]} */
const slots = []
for (let n = 0; n < 4; n++) {
  const fig = el('figure')
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas', { width: String(WIDTH), height: String(HEIGHT) }))
  const cap = el('figcaption')
  fig.append(canvas, cap)
  mapsEl.append(fig)
  slots.push({ canvas, cap })
}

/** @type {(() => Uint8ClampedArray)[]} each map's painter for the current view */
let painters = []

function build() {
  painters = []
  for (let n = 0; n < 4; n++) {
    const s = seed + n
    const t0 = performance.now()
    if (gen === 'quads') {
      const G = buildGrid(s, 150, QCOLS, QROWS)
      const tg = performance.now()
      const C = generateQuads(G, s, /** @type {typeof QKNOBS} */ (qknobs))
      const ms = performance.now() - tg
      const cav = quadCavities(G, C)
      size(n, quadSize(G))
      slots[n].cap.innerHTML =
        `<b>seed ${s}</b> · grid ${(tg - t0).toFixed(0)} ms + WFC ${ms.toFixed(0)} ms · ${G.mesh.faces.length} quads · ${G.W} × ${G.H} cells<br>` +
        `${cav.count} cavities · largest ${(cav.largest * 100).toFixed(0)}% of open · ${cav.tiny} tiny (&lt; 20 corners)`
      painters.push(() => paintQuads(G, C, view))
    } else {
      const g = generate(P, s, /** @type {typeof KNOBS} */ (knobs))
      const ms = performance.now() - t0
      const R = raster(tiles, g.tiles, s, knobs.wobble)
      const cav = cavities(R.open, R.band)
      size(n, { w: WIDTH, h: HEIGHT })
      slots[n].cap.innerHTML =
        `<b>seed ${s}</b>${g.ok ? '' : ' <b style="color:#f05">FAILED</b>'} · ${g.restarts} restarts · ${ms.toFixed(0)} ms · ${tiles.length} tiles<br>` +
        `${cav.count} cavities · largest ${(cav.largest * 100).toFixed(0)}% of open · ${cav.tiny} tiny (&lt; 20 cells)`
      painters.push(() => paint(R, g.tiles, tiles, view))
    }
  }
  draw()
}

/** @param {number} n @param {{w: number, h: number}} d */
function size(n, d) {
  const c = slots[n].canvas
  if (c.width !== d.w) c.width = d.w
  if (c.height !== d.h) c.height = d.h
}

function draw() {
  painters.forEach((p, n) => {
    const c = slots[n].canvas
    const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'))
    const img = ctx.createImageData(c.width, c.height)
    img.data.set(p())
    ctx.putImageData(img, 0, 0)
  })
}

let pending = 0
function schedule() {
  if (pending) return
  pending = requestAnimationFrame(() => {
    pending = 0
    url()
    build()
  })
}

function url() {
  const k = Object.entries(gen === 'hex' ? knobs : qknobs)
    .map(([name, v]) => `${name}:${v}`)
    .join(',')
  history.replaceState(null, '', `?seed=${seed}${gen === 'hex' ? '&gen=hex' : ''}&k=${k}`)
}

/** @param {number} s */
function setSeed(s) {
  seed = s
  seedBox.value = String(s)
  url()
  build()
}

build()
