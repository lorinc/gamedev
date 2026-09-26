// v5 · Hex Caves: four generated maps side by side (seeds s … s+3), the knobs, the view toggles and
// the stats. Everything else lives in the pure modules next to this one.

import { HEIGHT, WIDTH, paint } from './paint.js'
import { cavities, raster } from './raster.js'
import { makeTiles } from './tiles.js'
import { KNOBS, generate, prepare } from './wfc.js'

const tiles = makeTiles()
const P = prepare(tiles)

/** @type {import('./wfc.js').Knobs} */
const knobs = { ...KNOBS }
/** @type {import('./paint.js').View} */
const view = { mode: 'painted', grid: false, sockets: false }
let seed = Number(new URLSearchParams(location.search).get('seed')) || 1

/** @type {[keyof typeof KNOBS, string, number, number, number][]} key, label, min, max, step */
const SLIDERS = [
  ['openIce', 'ice open', 0, 1, 0.05],
  ['openPudding', 'pudding open', 0, 1, 0.05],
  ['openBrine', 'brine open', 0, 1, 0.05],
  ['grow', 'caves grow', 0.5, 6, 0.1],
  ['rock', 'rock grows', 0.5, 6, 0.1],
  ['cont', 'corridor on', 0.1, 10, 0.1],
  ['turn', 'turn', 0.1, 10, 0.1],
  ['branch', 'branch', 0.1, 10, 0.1],
  ['straight', 'walls straight', 0.5, 8, 0.1],
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

for (const mode of /** @type {const} */ (['painted', 'classes'])) {
  const l = el('label')
  const r = /** @type {HTMLInputElement} */ (el('input', { type: 'radio', name: 'mode' }))
  r.checked = view.mode === mode
  r.addEventListener('change', () => {
    view.mode = mode
    draw()
  })
  l.append(r, ' ' + mode)
  bar.append(l)
}
for (const key of /** @type {const} */ (['grid', 'sockets'])) {
  const l = el('label')
  const c = /** @type {HTMLInputElement} */ (el('input', { type: 'checkbox' }))
  c.addEventListener('change', () => {
    view[key] = c.checked
    draw()
  })
  l.append(c, key === 'grid' ? ' hex grid' : ' sockets')
  bar.append(l)
}
/** @type {(() => void)[]} */
const resets = []
for (const [key, label, min, max, step] of SLIDERS) {
  const l = el('label', {}, label + ' ')
  const r = /** @type {HTMLInputElement} */ (el('input', { type: 'range', min: String(min), max: String(max), step: String(step) }))
  r.value = String(knobs[key])
  const out = el('span', {}, String(knobs[key]))
  r.addEventListener('input', () => {
    knobs[key] = Number(r.value)
    out.textContent = r.value
    schedule()
  })
  resets.push(() => {
    r.value = out.textContent = String(KNOBS[key])
  })
  l.append(r, out)
  bar.append(l)
}
const reset = el('button', {}, 'reset knobs')
reset.addEventListener('click', () => {
  Object.assign(knobs, KNOBS)
  for (const f of resets) f()
  schedule()
})
bar.append(reset, el('span', {}, `${tiles.length} tiles`))

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

/** @type {{g: ReturnType<typeof generate>, R: ReturnType<typeof raster>, ms: number, cav: ReturnType<typeof cavities>}[]} */
let maps = []

function build() {
  maps = []
  for (let n = 0; n < 4; n++) {
    const t0 = performance.now()
    const g = generate(P, seed + n, knobs)
    const ms = performance.now() - t0
    const R = raster(tiles, g.tiles, seed + n, knobs.wobble)
    maps.push({ g, R, ms, cav: cavities(R.open, R.band) })
  }
  draw()
}

function draw() {
  maps.forEach(({ g, R, ms, cav }, n) => {
    const { canvas, cap } = slots[n]
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))
    const img = ctx.createImageData(WIDTH, HEIGHT)
    img.data.set(paint(R, g.tiles, tiles, view))
    ctx.putImageData(img, 0, 0)
    cap.innerHTML =
      `<b>seed ${seed + n}</b>${g.ok ? '' : ' <b style="color:#f05">FAILED</b>'} · ${g.restarts} restarts · ${ms.toFixed(0)} ms<br>` +
      `${cav.count} cavities · largest ${(cav.largest * 100).toFixed(0)}% of open · ${cav.tiny} tiny (&lt; 20 cells)`
  })
}

let pending = 0
function schedule() {
  if (pending) return
  pending = requestAnimationFrame(() => {
    pending = 0
    build()
  })
}

/** @param {number} s */
function setSeed(s) {
  seed = s
  seedBox.value = String(s)
  history.replaceState(null, '', `?seed=${s}`)
  build()
}

build()
