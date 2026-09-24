// FROZEN: v2 is the fundamental pattern-finding tool. Keep its behaviour as-is; build new ideas as v3, v4, …
// CA Lab: one binary grid, a hand-built pipeline of gen and scale steps, every step visible.

import { Pane, type FolderApi } from 'tweakpane'
import type { Grid } from '../../sim/gen/ca'
import {
  changedPermille,
  livePermille,
  migrate,
  NOTEBOOK_PIPELINE,
  runPipeline,
  stepLabel,
  type Pipeline,
  type Step,
} from '../../sim/gen/pipeline'
import { addRuleEditor, addRuleLegend } from '../../ui/ruleEditor'

const STORAGE_KEY = 'ca-lab-pipeline'
const MAX_CELLS = 2048 * 2048
const LIVE = [230, 220, 90]
const DEAD = [20, 20, 28]

function load(): Pipeline {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return migrate({ ...structuredClone(NOTEBOOK_PIPELINE), ...JSON.parse(saved) })
  } catch {
    // storage unavailable or corrupt: fall back to the notebook recipe
  }
  return structuredClone(NOTEBOOK_PIPELINE)
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pipe))
  } catch {
    // not critical
  }
}

let pipe = load()
const view = { tiles: 1, zoom: 0 } // zoom 0 = fit
let selected = -1 // index into grids; -1 = last
let grids: Grid[] = []

// --- drawing ---

function paint(canvas: HTMLCanvasElement, g: Grid, tiles = 1) {
  canvas.width = g.w * tiles
  canvas.height = g.h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(canvas.width, canvas.height)
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < canvas.width; x++) {
      const c = g.cells[y * g.w + (x % g.w)] ? LIVE : DEAD
      img.data.set([c[0], c[1], c[2], 255], (y * canvas.width + x) * 4)
    }
  ctx.putImageData(img, 0, 0)
}

function label(i: number): string {
  return i === 0 ? 'noise' : stepLabel(pipe.steps[i - 1])
}

function render() {
  grids = runPipeline(pipe, MAX_CELLS)
  const warn = document.getElementById('warn')!
  warn.textContent =
    grids.length <= pipe.steps.length
      ? `Stopped before step ${grids.length}: the grid would exceed ${MAX_CELLS.toLocaleString()} cells.`
      : ''
  if (selected >= grids.length) selected = -1
  const sel = selected < 0 ? grids.length - 1 : selected

  const strip = document.getElementById('strip')!
  strip.replaceChildren(
    ...grids.map((g, i) => {
      const div = document.createElement('div')
      div.className = 'thumb' + (i === sel ? ' selected' : '')
      div.title = label(i)
      const c = document.createElement('canvas')
      paint(c, g)
      const changed = i > 0 ? changedPermille(grids[i - 1], g) : undefined
      const lines = [
        `${i}. ${label(i)}`,
        `${g.w}×${g.h}  live ${livePermille(g) / 10}%`,
        changed === undefined ? '' : `changed ${changed / 10}%`,
      ]
      div.append(c, ...lines.map((t) => Object.assign(document.createElement('div'), { textContent: t || ' ' })))
      div.onclick = () => {
        selected = i === grids.length - 1 ? -1 : i
        render()
      }
      return div
    }),
  )

  const big = document.getElementById('big') as HTMLCanvasElement
  const g = grids[sel]
  paint(big, g, view.tiles)
  const box = document.getElementById('view')!
  const fit = Math.max(1, Math.floor(Math.min((box.clientWidth - 16) / (g.w * view.tiles), (box.clientHeight - 16) / g.h)))
  const zoom = view.zoom || fit
  big.style.width = `${g.w * view.tiles * zoom}px`
  big.style.height = `${g.h * zoom}px`

  stepFolders.forEach((f, i) => (f.title = `${i + 1}. ${stepLabel(pipe.steps[i])}`))
  save()
}

// --- panel ---

let pane: Pane
let stepFolders: FolderApi[] = []

function smallButton(text: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button')
  b.textContent = text
  Object.assign(b.style, {
    background: '#3a3b44',
    color: '#ddd',
    border: 'none',
    borderRadius: '3px',
    padding: '2px 8px',
    cursor: 'pointer',
    font: 'inherit',
  })
  b.onclick = onClick
  return b
}

function structural(change: () => void) {
  change()
  build()
}

function build() {
  pane?.dispose()
  pane = new Pane({ container: document.getElementById('panel')!, title: 'v2 · CA Lab' })
  stepFolders = []

  const noise = pane.addFolder({ title: 'noise' })
  noise.addBinding(pipe, 'seed', { min: 0, max: 99999, step: 1 })
  noise.addButton({ title: 'New seed' }).on('click', () => {
    pipe.seed = Math.floor(Math.random() * 100000)
    pane.refresh()
  })
  const sizes = Object.fromEntries([2, 4, 8, 16, 32, 64, 128, 256, 512].map((n) => [n, n]))
  noise.addBinding(pipe, 'width', { options: sizes })
  noise.addBinding(pipe, 'height', { options: sizes })
  noise.addBinding(pipe, 'density', { label: 'density ‰', min: 0, max: 1000, step: 5 })
  noise.addBinding(pipe, 'edge', { label: 'beyond top/bottom', options: { empty: 0, filled: 1, wrap: 'wrap' } })

  const steps = pane.addFolder({ title: 'steps' })
  addRuleLegend(steps)
  pipe.steps.forEach((s, i) => {
    const f = steps.addFolder({ title: `${i + 1}. ${stepLabel(s)}` })
    stepFolders.push(f)
    if (s.kind === 'gen') {
      addRuleEditor(f, s, 'rule', 'rule', render)
      f.addBinding(s, 'repeat', { min: 1, max: 10, step: 1 })
    } else {
      f.addBinding(s, 'x', { label: 'scale x', min: 1, max: 8, step: 1 })
      f.addBinding(s, 'y', { label: 'scale y', min: 1, max: 8, step: 1 })
    }
    const row = document.createElement('div')
    Object.assign(row.style, { display: 'flex', gap: '4px', padding: '2px 4px' })
    const move = (d: number) => () =>
      structural(() => {
        const j = i + d
        if (j < 0 || j >= pipe.steps.length) return
        ;[pipe.steps[i], pipe.steps[j]] = [pipe.steps[j], pipe.steps[i]]
      })
    row.append(
      smallButton('↑', move(-1)),
      smallButton('↓', move(1)),
      smallButton('duplicate', () => structural(() => pipe.steps.splice(i + 1, 0, structuredClone(s)))),
      smallButton('✕', () => structural(() => pipe.steps.splice(i, 1))),
    )
    f.addBlade({ view: 'separator' }).element.replaceChildren(row)
  })
  const lastRule = [...pipe.steps].reverse().find((s): s is Extract<Step, { kind: 'gen' }> => s.kind === 'gen')
  steps.addButton({ title: '+ gen' }).on('click', () =>
    structural(() => pipe.steps.push({ kind: 'gen', rule: lastRule?.rule ?? 'd0123 b45678', repeat: 1 })),
  )
  steps.addButton({ title: '+ scale' }).on('click', () =>
    structural(() => pipe.steps.push({ kind: 'scale', x: 2, y: 2 })),
  )

  const v = pane.addFolder({ title: 'view' })
  v.addBinding(view, 'zoom', { label: 'zoom (0 = fit)', min: 0, max: 16, step: 1 })
  v.addBinding(view, 'tiles', { label: 'repeat x (wrap check)', min: 1, max: 3, step: 1 })

  pane.addButton({ title: 'Save PNG (selected step)' }).on('click', () => {
    const sel = selected < 0 ? grids.length - 1 : selected
    const c = document.createElement('canvas')
    paint(c, grids[sel], view.tiles)
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = `ca_seed${pipe.seed}_step${sel}.png`
    a.click()
  })
  pane.addButton({ title: 'Copy pipeline JSON' }).on('click', () => {
    void navigator.clipboard.writeText(JSON.stringify(pipe, null, 2))
  })
  pane.addButton({ title: 'Paste pipeline JSON' }).on('click', () => {
    const text = prompt('Paste pipeline JSON')
    if (!text) return
    try {
      structural(() => (pipe = migrate({ ...structuredClone(NOTEBOOK_PIPELINE), ...JSON.parse(text) })))
    } catch {
      alert('Not valid pipeline JSON')
    }
  })
  pane.addButton({ title: 'Reset to notebook recipe' }).on('click', () =>
    structural(() => (pipe = structuredClone(NOTEBOOK_PIPELINE))),
  )

  pane.on('change', render)
  render()
}

window.addEventListener('resize', render)
build()
