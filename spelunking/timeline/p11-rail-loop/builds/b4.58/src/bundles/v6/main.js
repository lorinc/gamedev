// v6 · Storeys: the ice layer of p7's settled quad caves, zoomed in, with the pod and the storey pass
// (D068) drawn on it. The cave knobs are p7's defaults and ride in the URL; the sliders are the
// storey knobs. Everything else lives in the pure modules next to this one.

import { QCOLS, QROWS, buildGrid } from '../v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../v5/quadwfc.js'
import { CUT_RGB, KIND_RGB, RAMP_RGB, paintStoreys } from './paint.js'
import { SKNOBS, storeys } from './storeys.js'
import { rasterize } from './terrain.js'

const params = new URLSearchParams(location.search)
let seed = Number(params.get('seed')) || 1
/** @type {Record<string, number>} */
const qknobs = { ...QKNOBS }
/** @type {Record<string, number>} */
const sknobs = { ...SKNOBS }
// the URL carries every knob (k=name:value,…), the cave knobs too, so p7's links work here
for (const kv of (params.get('k') || '').split(',')) {
  const [name, v] = kv.split(':')
  if (!isFinite(Number(v))) continue
  if (name in qknobs) qknobs[name] = Number(v)
  if (name in sknobs) sknobs[name] = Number(v)
}
/** @type {import('./paint.js').View} */
const view = { floors: false, storeys: true, points: true }

/** @typedef {[string, string, number, number, number]} Slider key, label, min, max, step */
/** @type {Slider[]} */
const SLIDERS = [
  ['storey', 'storey height (cells)', 2, 8, 0.25],
  ['head', 'headroom (cells)', 1, 4, 0.25],
  ['cutoff', 'cutoffs up to (cells)', 0, 8, 0.25],
  ['minFloor', 'shortest floor to reach (cells)', 1, 10, 0.25],
  ['span', 'longest sideways link (cells)', 2, 30, 1],
  ['drop', 'longest ramp (storeys)', 0.5, 4, 0.25],
  ['detour', 'detour allowed (× straight line)', 1.05, 4, 0.05],
  ['rockCost', 'tunnel cost (× bridge)', 1, 10, 0.25],
]

const bar = /** @type {HTMLElement} */ (document.getElementById('bar'))
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('map'))
const cap = /** @type {HTMLElement} */ (document.getElementById('cap'))

/** @param {string} tag @param {Record<string, string>} [attrs] @param {string} [text] */
function el(tag, attrs = {}, text = '') {
  const e = document.createElement(tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (text) e.textContent = text
  return e
}

bar.append(el('b', {}, 'v6 · Storeys'))
const seedBox = /** @type {HTMLInputElement} */ (el('input', { type: 'number', value: String(seed) }))
const seedLabel = el('label', {}, 'seed ')
seedLabel.append(seedBox)
const prev = el('button', {}, '◀')
const next = el('button', {}, '▶')
const reroll = el('button', {}, 'reroll')
bar.append(seedLabel, prev, next, reroll)
seedBox.addEventListener('change', () => setSeed(Number(seedBox.value) || 1))
prev.addEventListener('click', () => setSeed(Math.max(1, seed - 1)))
next.addEventListener('click', () => setSeed(seed + 1))
reroll.addEventListener('click', () => setSeed(1 + Math.floor(Math.random() * 99999)))
for (const key of /** @type {const} */ (['storeys', 'points', 'floors'])) {
  const l = el('label')
  const c = /** @type {HTMLInputElement} */ (el('input', { type: 'checkbox' }))
  c.checked = view[key]
  c.addEventListener('change', () => {
    view[key] = c.checked
    draw()
  })
  l.append(c, ' ' + (key === 'points' ? 'divergence points' : key === 'floors' ? 'walkable floor' : 'network'))
  bar.append(l)
}
/** @type {(() => void)[]} */
const resets = []
for (const [key, label, min, max, step] of SLIDERS) {
  const l = el('label', {}, ' ' + label + ' ')
  const r = /** @type {HTMLInputElement} */ (el('input', { type: 'range', min: String(min), max: String(max), step: String(step) }))
  r.value = String(sknobs[key])
  const out = el('span', {}, String(sknobs[key]))
  const changed = () => {
    sknobs[key] = Number(r.value)
    out.textContent = r.value
    schedule()
  }
  r.addEventListener('input', changed)
  // micro-tuning: the wheel moves one step, ten with Shift (as in v5)
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
    sknobs[key] = /** @type {Record<string, number>} */ (SKNOBS)[key]
    r.value = out.textContent = String(sknobs[key])
  })
  l.append(r, out)
  bar.append(l)
}
const reset = el('button', {}, 'reset storey knobs')
reset.addEventListener('click', () => {
  for (const f of resets) f()
  schedule()
})
bar.append(reset)

const legend = /** @type {HTMLElement} */ (document.getElementById('legend'))
const swatch = (/** @type {number[]} */ c, /** @type {string} */ text) =>
  `<span><i style="background:rgb(${c.join(',')})"></i>${text}</span>`
legend.innerHTML =
  swatch(KIND_RGB[0], 'natural floor in the network') +
  swatch(CUT_RGB, 'cutoff carved through rock (joins floor pieces)') +
  swatch(KIND_RGB[1], 'sideways link through air (bridge)') +
  swatch(KIND_RGB[2], 'through rock (tunnel)') +
  swatch(RAMP_RGB, '45° ramp through air') +
  swatch([255, 255, 255], 'divergence point') +
  swatch([70, 120, 70], 'walkable floor') +
  swatch([240, 138, 36], 'pod')

/** @type {{T: import('./terrain.js').Terrain, S: import('./storeys.js').Storeys} | null} */
let now = null

function build() {
  const t0 = performance.now()
  const G = buildGrid(seed, qknobs.relax, QCOLS, QROWS)
  const C = generateQuads(G, seed, /** @type {typeof QKNOBS} */ (qknobs))
  const t1 = performance.now()
  const T = rasterize(G, C)
  const t2 = performance.now()
  const S = storeys(T, /** @type {typeof SKNOBS} */ (sknobs))
  const t3 = performance.now()
  now = { T, S }
  const pct = (/** @type {number} */ v) => (v * 100).toFixed(0) + '%'
  const st = S.stats
  const cells = (/** @type {number} */ px) => (px / 4).toFixed(0)
  cap.innerHTML =
    `<b>seed ${seed}</b> · caves ${(t1 - t0).toFixed(0)} ms, raster ${(t2 - t1).toFixed(0)} ms, lattice ${(t3 - t2).toFixed(0)} ms<br>` +
    (S.pod
      ? `pod at ${(S.pod.c / 4).toFixed(0)} of ${T.w / 4} cells across, ${S.pod.support < 1 ? `${pct(S.pod.support)} of its width on floor` : 'fully on floor'} · `
      : '<b style="color:#f05">no pod</b> · ') +
    `<b>${st.reached} of ${st.floors} floors reached</b> · ${st.cutoffs} cutoffs join floor pieces · ${st.ramps} ramps, ${st.sideways} sideways links · ${S.points.length} divergence points<br>` +
    `walking: ${cells(st.floorPx)} cells of floor + ${cells(st.cutPx)} of cutoffs, ${cells(st.bridgePx)} of bridge and ramp, ${cells(st.tunnelPx)} of tunnel · ` +
    `detour from the pod: median ${st.detourMedian.toFixed(2)}×, worst ${st.detourWorst.toFixed(2)}×${st.stuck ? ` (${st.stuck} floors no single link could fix)` : ''}`
  draw()
}

function draw() {
  if (!now) return
  const p = paintStoreys(now.T, now.S, view, seed)
  canvas.width = p.w
  canvas.height = p.h
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))
  const img = ctx.createImageData(p.w, p.h)
  img.data.set(p.px)
  ctx.putImageData(img, 0, 0)
  fit()
}

/** Whole-number zoom that fits the window. */
function fit() {
  const top = canvas.getBoundingClientRect().top + window.scrollY
  const room = Math.max(1, Math.min((window.innerWidth - 24) / canvas.width, (window.innerHeight - top - 90) / canvas.height))
  const z = Math.max(1, Math.floor(room))
  canvas.style.width = `${canvas.width * z}px`
  canvas.style.height = `${canvas.height * z}px`
}
window.addEventListener('resize', fit)

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
  const k = [...Object.entries(qknobs), ...Object.entries(sknobs)].map(([name, v]) => `${name}:${v}`).join(',')
  history.replaceState(null, '', `?seed=${seed}&k=${k}`)
}

/** @param {number} s */
function setSeed(s) {
  seed = s
  seedBox.value = String(s)
  url()
  build()
}

build()
