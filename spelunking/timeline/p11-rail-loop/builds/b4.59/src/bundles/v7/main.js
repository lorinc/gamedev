// v7 · Lattice: p8's ice layer with every candidate link and wall drawn faintly over the floors. Click a
// candidate to build it (what it collapses goes; airlocks appear where walls cross paths); click a build
// to revert it. Hovering previews what a click would change. The URL carries the seed, every knob and the
// builds, so a state can be shared.

import { QCOLS, QROWS, buildGrid } from '../v5/quadcaves.js'
import { QKNOBS, generateQuads } from '../v5/quadwfc.js'
import { K } from '../v6/terrain.js'
import { rasterize } from '../v6/terrain.js'
import { LKNOBS, collapse, lattice } from './lattice.js'
import { COL, paintBase, stepColours, stroke } from './paint.js'

const params = new URLSearchParams(location.search)
let seed = Number(params.get('seed')) || 1
/** @type {Record<string, number>} */
const qknobs = { ...QKNOBS }
/** @type {Record<string, number>} */
const lknobs = { ...LKNOBS }
for (const kv of (params.get('k') || '').split(',')) {
  const [name, v] = kv.split(':')
  if (!isFinite(Number(v))) continue
  if (name in qknobs) qknobs[name] = Number(v)
  if (name in lknobs) lknobs[name] = Number(v)
}
/** @type {number[]} candidate ids, in build order */
let built = (params.get('b') || '')
  .split('.')
  .filter((s) => s !== '')
  .map(Number)
const view = { cands: true, dead: false, walkable: false }
let zoom = 0 // 0 = fit the window's width

/** @typedef {[string, string, number, number, number]} Slider key, label, min, max, step */
/** @type {Slider[]} */
const SLIDERS = [
  ['storey', 'storey height (cells)', 2, 8, 0.25],
  ['head', 'headroom (cells)', 1, 4, 0.25],
  ['cutoff', 'cutoffs up to (cells)', 0, 8, 0.25],
  ['span', 'longest sideways link (cells)', 2, 30, 1],
  ['drop', 'longest ramp (storeys)', 0.5, 4, 0.25],
  ['rockCost', 'tunnel cost (× bridge)', 1, 10, 0.25],
  ['parallel', 'parallel share that clashes', 0.05, 1, 0.05],
  ['wall', 'longest wall (cells)', 1, 15, 0.25],
  ['wallSep', 'walls apart (cells)', 1, 10, 0.25],
  ['airGap', 'airlocks apart (cells)', 0, 15, 0.5],
]

const bar = /** @type {HTMLElement} */ (document.getElementById('bar'))
const base = /** @type {HTMLCanvasElement} */ (document.getElementById('map'))
const net = /** @type {HTMLCanvasElement} */ (document.getElementById('net'))
const cap = /** @type {HTMLElement} */ (document.getElementById('cap'))

/** @param {string} tag @param {Record<string, string>} [attrs] @param {string} [text] */
function el(tag, attrs = {}, text = '') {
  const e = document.createElement(tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (text) e.textContent = text
  return e
}

bar.append(el('b', {}, 'v7 · Lattice'))
const seedBox = /** @type {HTMLInputElement} */ (el('input', { type: 'number', value: String(seed) }))
const seedLabel = el('label', {}, 'seed ')
seedLabel.append(seedBox)
const prev = el('button', {}, '◀')
const next = el('button', {}, '▶')
const reroll = el('button', {}, 'reroll')
const zoomOut = el('button', {}, 'zoom −')
const zoomIn = el('button', {}, 'zoom +')
const clear = el('button', {}, 'clear builds')
bar.append(seedLabel, prev, next, reroll, zoomOut, zoomIn, clear)
seedBox.addEventListener('change', () => setSeed(Number(seedBox.value) || 1))
prev.addEventListener('click', () => setSeed(Math.max(1, seed - 1)))
next.addEventListener('click', () => setSeed(seed + 1))
reroll.addEventListener('click', () => setSeed(1 + Math.floor(Math.random() * 99999)))
zoomOut.addEventListener('click', () => ((zoom = Math.max(1, scale() - 1)), draw()))
zoomIn.addEventListener('click', () => ((zoom = scale() + 1), draw()))
clear.addEventListener('click', () => {
  built = []
  url()
  settle()
})
for (const key of /** @type {const} */ (['cands', 'dead', 'walkable'])) {
  const l = el('label')
  const c = /** @type {HTMLInputElement} */ (el('input', { type: 'checkbox' }))
  c.checked = view[key]
  c.addEventListener('change', () => {
    view[key] = c.checked
    if (key === 'walkable') paint()
    draw()
  })
  l.append(c, ' ' + (key === 'cands' ? 'candidates' : key === 'dead' ? 'collapsed candidates' : 'walkable floor'))
  bar.append(l)
}
/** @type {(() => void)[]} */
const resets = []
for (const [key, label, min, max, step] of SLIDERS) {
  const l = el('label', {}, ' ' + label + ' ')
  const r = /** @type {HTMLInputElement} */ (el('input', { type: 'range', min: String(min), max: String(max), step: String(step) }))
  r.value = String(lknobs[key])
  const out = el('span', {}, String(lknobs[key]))
  const changed = () => {
    lknobs[key] = Number(r.value)
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
    lknobs[key] = /** @type {Record<string, number>} */ (LKNOBS)[key]
    r.value = out.textContent = String(lknobs[key])
  })
  l.append(r, out)
  bar.append(l)
}
const reset = el('button', {}, 'reset lattice knobs')
reset.addEventListener('click', () => {
  for (const f of resets) f()
  schedule()
})
bar.append(reset)

const legend = /** @type {HTMLElement} */ (document.getElementById('legend'))
const swatch = (/** @type {string} */ c, /** @type {string} */ text) => `<span><i style="background:${c}"></i>${text}</span>`
legend.innerHTML =
  swatch(COL.floor, 'natural floor') +
  swatch(COL.cut, 'cutoff') +
  swatch(COL.bridge, 'bridge (level, in air)') +
  swatch(COL.ramp, '45° ramp (in air)') +
  swatch(COL.tunnel, 'through rock') +
  swatch(COL.wall, 'wall') +
  swatch(COL.airlock, 'airlock') +
  swatch(COL.doomed, 'hover: what the click collapses (or brings back)') +
  ' · faint = candidate, thick = built · click to build, click a build to revert'

/** @type {{T: import('../v6/terrain.js').Terrain, La: import('./lattice.js').Lattice, C: ReturnType<typeof collapse>, ms: number[]} | null} */
let now = null
/** @type {{w: number, h: number, top: number} | null} */
let pic = null
/** @type {number} the hovered candidate, or -1 */
let hover = -1
/** @type {Set<number>} what a click on the hovered candidate would change */
let changes = new Set()

function build() {
  const t0 = performance.now()
  const G = buildGrid(seed, qknobs.relax, QCOLS, QROWS)
  const Cq = generateQuads(G, seed, /** @type {typeof QKNOBS} */ (qknobs))
  const T = rasterize(G, Cq)
  const t1 = performance.now()
  const La = lattice(T, /** @type {typeof LKNOBS} */ (lknobs))
  const t2 = performance.now()
  now = { T, La, C: collapse(La, built, /** @type {typeof LKNOBS} */ (lknobs)), ms: [t1 - t0, t2 - t1] }
  paint()
  settle()
}

/** Recomputes what's left after the builds, then redraws. */
function settle() {
  if (!now) return
  now.C = collapse(now.La, built, /** @type {typeof LKNOBS} */ (lknobs))
  built = now.C.built
  hover = -1
  changes = new Set()
  caption()
  draw()
}

function caption() {
  if (!now) return
  const { La, C, ms } = now
  /** @param {import('./lattice.js').Kind} k */
  const alive = (k) => La.cands.filter((c) => c.kind === k && C.alive[c.id]).length
  /** @param {import('./lattice.js').Kind} k */
  const all = (k) => La.stats[k]
  const nb = built.length
  const nw = built.filter((i) => La.cands[i].kind === 'wall').length
  cap.innerHTML =
    `<b>seed ${seed}</b> · caves ${ms[0].toFixed(0)} ms, lattice ${ms[1].toFixed(0)} ms · ${La.runs.length} floors` +
    (La.pod ? '' : ' · <b style="color:#f05">no pod</b>') +
    `<br><b>candidates left</b>: ${alive('cut')} of ${all('cut')} cutoffs, ${alive('side')} of ${all('side')} sideways links, ${alive('ramp')} of ${all('ramp')} ramps, ${alive('wall')} of ${all('wall')} walls` +
    ` · <b>built</b>: ${nb - nw} links, ${nw} walls, ${C.airlocks.length} airlocks`
}

function paint() {
  if (!now) return
  const p = paintBase(now.T, now.La, view.walkable)
  base.width = p.w
  base.height = p.h
  const ctx = /** @type {CanvasRenderingContext2D} */ (base.getContext('2d'))
  const img = ctx.createImageData(p.w, p.h)
  img.data.set(p.px)
  ctx.putImageData(img, 0, 0)
  pic = p
}

/** Screen px per raster px: the zoom, or the most that fits the window's width. */
function scale() {
  if (zoom) return zoom
  return Math.max(1, Math.floor((window.innerWidth - 24) / (pic ? pic.w : 240)))
}

function draw() {
  if (!now || !pic) return
  const { T, La, C } = now
  const z = scale()
  const { w, h, top } = pic
  base.style.width = `${w * z}px`
  base.style.height = `${h * z}px`
  net.width = w * z
  net.height = h * z
  const ctx = /** @type {CanvasRenderingContext2D} */ (net.getContext('2d'))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const builtSet = new Set(built)
  const line = (/** @type {import('./lattice.js').Cand} */ c, /** @type {number} */ width, /** @type {string | null} */ colour) => {
    ctx.lineWidth = width
    stroke(ctx, c.px, colour ? () => colour : stepColours(c, T), z, top, w)
  }
  // collapsed, then the candidates left: faint and thin
  if (view.dead) {
    ctx.globalAlpha = 0.5
    ctx.setLineDash([])
    for (const c of La.cands) if (!C.alive[c.id] && !builtSet.has(c.id)) line(c, Math.max(1, 0.3 * z), COL.dead)
  }
  if (view.cands) {
    ctx.globalAlpha = 0.85
    for (const c of La.cands) {
      if (!C.alive[c.id]) continue
      ctx.setLineDash(c.kind === 'wall' ? [z, z] : [])
      line(c, Math.max(1, (c.kind === 'wall' ? 0.7 : 0.5) * z), null)
    }
    ctx.setLineDash([])
  }
  ctx.globalAlpha = 1
  // the floors, then the builds: thick
  ctx.lineWidth = Math.max(2, 1.2 * z)
  for (const run of La.runs) {
    /** @type {[number, number][]} */
    const px = run.xs.map((x, i) => [x, run.ys[i]])
    if (run.ring) px.push(px[0])
    stroke(ctx, px, () => COL.floor, z, top, w)
  }
  for (const i of built) {
    const c = La.cands[i]
    if (c.kind !== 'wall') line(c, Math.max(2, 1.6 * z), null)
  }
  for (const i of built) {
    const c = La.cands[i]
    if (c.kind === 'wall') line(c, Math.max(3, 2.2 * z), null)
  }
  for (const [x, y] of C.airlocks) box(ctx, x, y, z, top, COL.airlock)
  // the hover: what the click would change, then the candidate itself
  if (hover >= 0) {
    ctx.globalAlpha = 0.9
    for (const i of changes) line(La.cands[i], Math.max(2, 0.9 * z), COL.doomed)
    ctx.globalAlpha = 1
    const c = La.cands[hover]
    ctx.strokeStyle = '#000'
    line(c, Math.max(4, 2.6 * z), '#000')
    line(c, Math.max(3, 1.8 * z), null)
  }
}

/** An airlock: a cell-sized block. @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {number} z @param {number} top @param {string} c */
function box(ctx, x, y, z, top, c) {
  const s = K * z
  const sx = (x + 0.5) * z - s / 2
  const sy = (y - top + 0.5) * z - s / 2
  ctx.fillStyle = c
  ctx.fillRect(sx, sy, s, s)
  ctx.lineWidth = Math.max(1, 0.4 * z)
  ctx.strokeStyle = '#000'
  ctx.strokeRect(sx, sy, s, s)
}

/** The candidate (left or built) nearest the pointer, within 1.5 cells. @param {MouseEvent} e */
function pick(e) {
  if (!now || !pic) return -1
  const z = scale()
  const r = net.getBoundingClientRect()
  const mx = (e.clientX - r.left) / z - 0.5
  const my = (e.clientY - r.top) / z - 0.5 + pic.top
  const w = pic.w
  const builtSet = new Set(built)
  let best = -1
  let bd = 1.5 * K
  for (const c of now.La.cands) {
    if (!now.C.alive[c.id] && !builtSet.has(c.id)) continue
    if (!view.cands && !builtSet.has(c.id)) continue
    for (const [x, y] of c.px) {
      const dx = Math.abs(x - mx)
      const d = Math.hypot(Math.min(dx, w - dx), y - my)
      if (d < bd) (bd = d), (best = c.id)
    }
  }
  return best
}

net.addEventListener('mousemove', (e) => {
  if (!now) return
  const p = pick(e)
  if (p === hover) return
  hover = p
  changes = new Set()
  if (p >= 0) {
    const was = built.includes(p)
    const after = collapse(now.La, was ? built.filter((i) => i !== p) : [...built, p], /** @type {typeof LKNOBS} */ (lknobs))
    now.La.cands.forEach((c) => {
      if (c.id !== p && after.alive[c.id] !== now?.C.alive[c.id]) changes.add(c.id)
    })
  }
  draw()
})
net.addEventListener('mouseleave', () => {
  hover = -1
  changes = new Set()
  draw()
})
net.addEventListener('click', (e) => {
  const p = pick(e)
  if (p < 0) return
  built = built.includes(p) ? built.filter((i) => i !== p) : [...built, p]
  url()
  settle()
})
window.addEventListener('resize', () => zoom || draw())

let pending = 0
function schedule() {
  if (pending) return
  pending = requestAnimationFrame(() => {
    pending = 0
    // the candidates are renumbered by new knobs: builds don't carry over
    built = []
    url()
    build()
  })
}

function url() {
  const k = [...Object.entries(qknobs), ...Object.entries(lknobs)].map(([name, v]) => `${name}:${v}`).join(',')
  history.replaceState(null, '', `?seed=${seed}&k=${k}${built.length ? `&b=${built.join('.')}` : ''}`)
}

/** @param {number} s */
function setSeed(s) {
  seed = s
  seedBox.value = String(s)
  built = []
  url()
  build()
}

build()
