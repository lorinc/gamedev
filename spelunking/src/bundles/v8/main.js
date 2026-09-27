// v8 · Rails: the ice layer (p8's pod on p7's caves) with straight monorail rails drawn over it, A or B
// (see rails.js). A rail is drawn white where it runs through open air and red where it would bore rock.
// The URL carries the seed, the mode and every knob.

import { QCOLS, QROWS, buildGrid } from '../v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../v5/quadwfc.js'
import { carvePod, placePod } from '../v6/storeys.js'
import { ROCK, rasterize } from '../v6/terrain.js'
import { frame, paintBase } from '../v7/paint.js'
import { RKNOBS, rails } from './rails.js'
import { near } from '../v5/quads.js'

const params = new URLSearchParams(location.search)
let seed = Number(params.get('seed')) || 1
/** @type {'A' | 'B'} */
let mode = params.get('mode') === 'B' ? 'B' : 'A'
/** @type {Record<string, number>} */
const qknobs = { ...QKNOBS }
/** @type {Record<string, number>} */
const rknobs = { ...RKNOBS }
for (const kv of (params.get('k') || '').split(',')) {
  const [name, v] = kv.split(':')
  if (!isFinite(Number(v))) continue
  if (name in qknobs) qknobs[name] = Number(v)
  if (name in rknobs) rknobs[name] = Number(v)
}
let zoom = 0 // 0 = fit the window's width

/** @typedef {[string, string, number, number, number]} Slider key, label, min, max, step */
/** @type {Slider[]} */
const SLIDERS = [
  ['spacing', 'A: nodes apart (cells)', 3, 20, 0.5],
  ['cols', 'B: coarse triangles across', 3, 16, 1],
  ['relax', 'B: relaxing rounds', 0, 60, 1],
]

const bar = /** @type {HTMLElement} */ (document.getElementById('bar'))
const base = /** @type {HTMLCanvasElement} */ (document.getElementById('map'))
const net = /** @type {HTMLCanvasElement} */ (document.getElementById('net'))
const cap = /** @type {HTMLElement} */ (document.getElementById('cap'))
const legend = /** @type {HTMLElement} */ (document.getElementById('legend'))

/** @param {string} tag @param {Record<string, string>} [attrs] @param {string} [text] */
function el(tag, attrs = {}, text = '') {
  const e = document.createElement(tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (text) e.textContent = text
  return e
}

bar.append(el('b', {}, 'v8 · Rails'))
const seedBox = /** @type {HTMLInputElement} */ (el('input', { type: 'number', value: String(seed) }))
const seedLabel = el('label', {}, 'seed ')
seedLabel.append(seedBox)
const prev = el('button', {}, '◀')
const next = el('button', {}, '▶')
const reroll = el('button', {}, 'reroll')
const zoomOut = el('button', {}, 'zoom −')
const zoomIn = el('button', {}, 'zoom +')
bar.append(seedLabel, prev, next, reroll, zoomOut, zoomIn)
seedBox.addEventListener('change', () => setSeed(Number(seedBox.value) || 1))
prev.addEventListener('click', () => setSeed(Math.max(1, seed - 1)))
next.addEventListener('click', () => setSeed(seed + 1))
reroll.addEventListener('click', () => setSeed(1 + Math.floor(Math.random() * 99999)))
zoomOut.addEventListener('click', () => ((zoom = Math.max(1, scale() - 1)), draw()))
zoomIn.addEventListener('click', () => ((zoom = scale() + 1), draw()))
for (const m of /** @type {const} */ (['A', 'B'])) {
  const l = el('label')
  const r = /** @type {HTMLInputElement} */ (el('input', { type: 'radio', name: 'mode' }))
  r.checked = mode === m
  r.addEventListener('change', () => {
    mode = m
    schedule()
  })
  l.append(r, m === 'A' ? ' A: chords between cave-grid vertices' : ' B: coarse relaxed grid')
  bar.append(l)
}
const steepL = el('label')
const steep = /** @type {HTMLInputElement} */ (el('input', { type: 'checkbox' }))
steep.checked = !!rknobs.steep
steep.addEventListener('change', () => {
  rknobs.steep = steep.checked ? 1 : 0
  schedule()
})
steepL.append(steep, ' drop rails steeper than 45°')
bar.append(steepL)
for (const [key, label, min, max, step] of SLIDERS) {
  const l = el('label', {}, ' ' + label + ' ')
  const r = /** @type {HTMLInputElement} */ (el('input', { type: 'range', min: String(min), max: String(max), step: String(step) }))
  r.value = String(rknobs[key])
  const out = el('span', {}, String(rknobs[key]))
  const changed = () => {
    rknobs[key] = Number(r.value)
    out.textContent = r.value
    schedule()
  }
  r.addEventListener('input', changed)
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
  l.append(r, out)
  bar.append(l)
}

const RAIL = 'rgb(245,245,245)'
const BORE = 'rgb(235,70,60)'
const NODE = 'rgb(255,200,40)'
const swatch = (/** @type {string} */ c, /** @type {string} */ text) => `<span><i style="background:${c}"></i>${text}</span>`
legend.innerHTML = swatch(RAIL, 'rail through open air') + swatch(BORE, 'rail boring through rock') + swatch(NODE, 'node')

/** @type {{T: import('../v6/terrain.js').Terrain, G: import('../v5/quadcaves.js').Grid, pod: {c: number, base: number} | null, F: {top: number, rows: number}} | null} */
let cave = null
let caveSeed = -1
/** @type {ReturnType<typeof rails> | null} */
let R = null
/** @type {{w: number, h: number, top: number} | null} */
let pic = null

function build() {
  const t0 = performance.now()
  if (!cave || caveSeed !== seed) {
    const G = buildGrid(seed, qknobs.relax, QCOLS, QROWS)
    const T = rasterize(G, generateQuads(G, seed, /** @type {typeof QKNOBS} */ (qknobs)))
    const pod = placePod(T)
    if (pod) carvePod(T, pod)
    cave = { T, G, pod, F: frame(T) }
    caveSeed = seed
    const p = paintBase(T, { floors: [], pod }, false)
    base.width = p.w
    base.height = p.h
    const ctx = /** @type {CanvasRenderingContext2D} */ (base.getContext('2d'))
    const img = ctx.createImageData(p.w, p.h)
    img.data.set(p.px)
    ctx.putImageData(img, 0, 0)
    pic = p
  }
  const t1 = performance.now()
  R = rails(cave.T, cave.G, cave.F, mode, /** @type {typeof RKNOBS} */ (rknobs), seed)
  const t2 = performance.now()
  const st = R.stats
  cap.innerHTML =
    `<b>seed ${seed} · ${mode === 'A' ? 'A: chords between cave-grid vertices' : 'B: coarse relaxed grid'}</b> · caves ${(t1 - t0).toFixed(0)} ms, rails ${(t2 - t1).toFixed(0)} ms<br>` +
    `<b>${st.nodes} nodes</b> (${st.openNodes} in open air), <b>${st.rails} rails</b>, median ${st.median.toFixed(1)} cells long · ` +
    `<b>${(st.rockShare * 100).toFixed(0)}% of rail length bores rock</b> · ${st.steep} rails steeper than 45°${rknobs.steep ? ' (dropped)' : ''}`
  draw()
}

/** Screen px per raster px: the zoom, or the most that fits the window's width. */
function scale() {
  if (zoom) return zoom
  return Math.max(1, Math.floor((window.innerWidth - 24) / (pic ? pic.w : 240)))
}

function draw() {
  if (!cave || !R || !pic) return
  const { T } = cave
  const z = scale()
  const { w, h, top } = pic
  base.style.width = `${w * z}px`
  base.style.height = `${h * z}px`
  net.width = w * z
  net.height = h * z
  const ctx = /** @type {CanvasRenderingContext2D} */ (net.getContext('2d'))
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(2, 0.8 * z)
  const sx = (/** @type {number} */ x) => x * z
  const sy = (/** @type {number} */ y) => (y - top) * z
  for (const r of R.rails) {
    const p = R.nodes[r.a]
    const q = R.nodes[r.b]
    const dx = near(q.x, p.x, w) - p.x
    const dy = q.y - p.y
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 2))
    // runs of open and rock along the rail, each drawn in its colour; drawn again across the wrap
    let t0 = 0
    let cur = -1
    const flush = (/** @type {number} */ t1) => {
      if (cur < 0) return
      ctx.strokeStyle = cur === ROCK ? BORE : RAIL
      for (const off of [0, -w, w]) {
        ctx.beginPath()
        ctx.moveTo(sx(p.x + dx * t0 + off), sy(p.y + dy * t0))
        ctx.lineTo(sx(p.x + dx * t1 + off), sy(p.y + dy * t1))
        ctx.stroke()
      }
    }
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const yy = Math.floor(p.y + dy * t)
      const c = yy >= 0 && yy < T.h && T.cls[yy * w + ((Math.floor(p.x + dx * t) % w) + w) % w] === ROCK ? ROCK : 1
      if (c !== cur) {
        flush(i / n)
        t0 = i / n
        cur = c
      }
    }
    flush(1)
  }
  ctx.fillStyle = NODE
  const used = new Set(R.rails.flatMap((r) => [r.a, r.b]))
  for (const i of used) {
    const p = R.nodes[i]
    ctx.beginPath()
    ctx.arc(sx(p.x), sy(p.y), Math.max(2, 0.9 * z), 0, Math.PI * 2)
    ctx.fill()
  }
}
window.addEventListener('resize', () => zoom || draw())

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
  const k = [...Object.entries(qknobs), ...Object.entries(rknobs)].map(([name, v]) => `${name}:${v}`).join(',')
  history.replaceState(null, '', `?seed=${seed}&mode=${mode}&k=${k}`)
}

/** @param {number} s */
function setSeed(s) {
  seed = s
  seedBox.value = String(s)
  url()
  build()
}

build()
