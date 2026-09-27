// b4 · Rail Loop (p11, D079): wires the map, the sim, input and the view. Fixed 60 Hz sim, the view
// interpolates. The URL carries the seed and every knob tuned away from its default (`?seed=1&k=price:12`).

import { createPanel } from '../b3/panel.js'
import { buildable, command, CONFIG, createGame, tick } from './game.js'
import { createInput } from './input.js'
import { createRenderer, ZOOM_PX } from './render.js'
import { makeMap, WKNOBS } from './world.js'

const BUILD = 'b4.1' // the live build; npm run freeze stamps the build id into frozen copies
const TICK_MS = 1000 / 60
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id))

const DEFAULTS = { world: { ...WKNOBS }, sim: JSON.parse(JSON.stringify(CONFIG)), view: { zoom: -1 } }
/** @type {typeof DEFAULTS} */
const tunables = JSON.parse(JSON.stringify(DEFAULTS))

// the URL: the seed, and knobs as path:value
const params = new URLSearchParams(location.search)
const seed = Number(params.get('seed')) || 1
for (const kv of (params.get('k') || '').split(',')) {
  const [path, v] = kv.split(':')
  if (!path || !isFinite(Number(v))) continue
  const keys = path.split('.')
  /** @type {any} */
  let o = tunables
  for (const k of keys.slice(0, -1)) o = o?.[k]
  if (o && typeof o[keys[keys.length - 1]] === 'number') o[keys[keys.length - 1]] = Number(v)
}
/** Every number tuned away from DEFAULTS, as path:value. @param {any} a @param {any} b @param {string} path @returns {string[]} */
const changed = (a, b, path) =>
  Object.keys(a).flatMap((k) =>
    typeof a[k] === 'object' ? changed(a[k], b[k], `${path}${k}.`) : a[k] !== b[k] ? [`${path}${k}:${a[k]}`] : [],
  )
/** @param {number} s */
const urlFor = (s) => {
  const k = changed(tunables, DEFAULTS, '').join(',')
  return `?seed=${s}${k ? `&k=${k}` : ''}`
}
history.replaceState(null, '', urlFor(seed))

const map = makeMap(seed, tunables.world)
const game = createGame(map, tunables.sim)
/** @type {import('./render.js').Ui} */
const ui = { preview: null, select: null, refusedAt: -9 }
const canvas = /** @type {HTMLCanvasElement} */ ($('game'))
const renderer = createRenderer(canvas, game, ui, tunables.view)
let now = 0 // seconds, the frame's

const worldBefore = JSON.stringify(tunables.world)
/** @type {number | undefined} */
let reloadTimer
const panel = createPanel(
  $('panel'),
  tunables,
  {
    'world.ore': [200, 600, 10],
    'sim.walkTicks': [2, 20, 1],
    'sim.scan.radius': [1, 16, 1],
    'sim.scan.cooldown': [0, 600, 10],
    'sim.scan.ringTicks': [1, 20, 1],
    'sim.pull.ticks': [1, 300, 1],
    'sim.price': [1, 40, 1],
    'sim.nodeReach': [1, 10, 1],
    'sim.streamTicks': [1, 20, 1],
    'sim.rideTicks': [1, 20, 1],
    'view.zoom': [-1, ZOOM_PX.length - 1, 1],
  },
  {
    onChange: () => {
      history.replaceState(null, '', urlFor(seed))
      // a new ore layer needs a new map: reload once the slider rests
      if (JSON.stringify(tunables.world) !== worldBefore) {
        clearTimeout(reloadTimer)
        reloadTimer = setTimeout(() => location.reload(), 700)
      }
    },
    buttons: [
      ['next map', () => location.assign(urlFor(seed + 1))],
      ['random map', () => location.assign(urlFor(1 + Math.floor(Math.random() * 99999)))],
      ['copy link', () => navigator.clipboard?.writeText(location.href)],
      [
        'defaults',
        () => {
          history.replaceState(null, '', `?seed=${seed}`)
          location.reload()
        },
      ],
    ],
  },
)

/** The unbuilt edge from `node` whose heading (3 tiles out) is closest to the drag. @param {number} node @param {number} dx @param {number} dy */
function aimEdge(node, dx, dy) {
  const a0 = Math.atan2(dy, dx)
  let best = -1
  let bestD = Infinity
  map.edges.forEach((e, k) => {
    if (game.built[k] || (e.a !== node && e.b !== node)) return
    const p = e.a === node ? e.path : [...e.path].reverse()
    const q = p[Math.min(3, p.length - 1)]
    let ex = q.x - p[0].x
    if (Math.abs(ex) > map.world.w / 2) ex -= Math.sign(ex) * map.world.w
    let d = Math.abs(Math.atan2(q.y - p[0].y, ex) - a0)
    if (d > Math.PI) d = 2 * Math.PI - d
    if (d < bestD) {
      bestD = d
      best = k
    }
  })
  return best
}

createInput(canvas, {
  move: (dx, dy) => command(game, { type: 'move', dx, dy }),
  tap: () => {
    if (ui.select) ui.select = null
    else command(game, { type: 'tap' })
  },
  hit: (cx, cy) => {
    const dpr = renderer.dpr()
    const T = renderer.tilePx()
    const b = renderer.buttons()
    if (b) {
      const r = Math.max(T * 0.6, 20 * dpr) / T + 0.2 // tiles
      for (const id of /** @type {const} */ (['build', 'cancel'])) {
        const c = b[id]
        const p = renderer.toWorld(cx, cy)
        let dx = Math.abs(p.x - c.x)
        dx = Math.min(dx, map.world.w - dx)
        if (Math.hypot(dx, p.y - c.y) <= r) return { kind: 'button', id }
      }
    }
    if (game.ride) return null // in a car a drag is a swipe, also on the node it stands on
    const p = renderer.toWorld(cx, cy)
    const reach = Math.max(0.9, (24 * dpr) / T)
    let best = -1
    let bestD = reach
    map.nodes.forEach((n, i) => {
      if (!game.revealed[i]) return
      let dx = Math.abs(p.x - (n.x + 0.5))
      dx = Math.min(dx, map.world.w - dx)
      const d = Math.hypot(dx, p.y - (n.y + 0.5))
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best >= 0 ? { kind: 'node', node: best } : null
  },
  preview: (node) => {
    ui.preview = node
    if (node !== null) ui.select = null
  },
  aim: (node, dx, dy) => {
    ui.preview = null
    const edge = aimEdge(node, dx, dy)
    ui.select = edge >= 0 ? { node, edge } : null
  },
  button: (id) => {
    const s = ui.select
    if (!s) return
    if (id === 'cancel') {
      ui.select = null
      return
    }
    if (buildable(game, s.edge, s.node)) {
      ui.refusedAt = now // not enough ore (or a build under way): the hammer blinks red
      return
    }
    command(game, { type: 'build', edge: s.edge, from: s.node })
    ui.select = null
  },
  zoom: (steps) => {
    const next = Math.min(Math.max(renderer.level() + steps, 0), ZOOM_PX.length - 1)
    tunables.view.zoom = next
    panel.sync()
  },
  togglePanel: () => panel.toggle(),
  gesture: () => {},
})
window.addEventListener('resize', () => renderer.resize())

// for the browser console and automated checks: read state, never write it
Object.assign(window, { b4: { game, map, ui, tunables } })

let last = performance.now()
let acc = 0
let lastReadout = 0
/** @param {number} t */
function frame(t) {
  const ms = t - last
  last = t
  now = t / 1000
  acc = Math.min(acc + ms, 100)
  while (acc >= TICK_MS) {
    tick(game)
    acc -= TICK_MS
  }
  for (const e of game.events) {
    renderer.onEvent(e, now)
    if (e.type === 'refused') ui.refusedAt = now
  }
  game.events.length = 0
  renderer.draw(acc / TICK_MS, Math.min(ms, 100) / 1000, now)
  if (panel.isOpen() && t - lastReadout > 250) {
    lastReadout = t
    const built = game.built.reduce((a, b) => a + b, 0)
    const shown = game.revealed.reduce((a, b) => a + b, 0)
    panel.setReadout(
      [
        `${BUILD} · seed ${seed} · map ${map.world.w}×${map.world.h}`,
        `pos ${game.ch.x},${game.ch.y} · light r ${game.radius} · ${game.ride ? 'in a car' : game.step ? 'walking' : 'still'}`,
        `nodes revealed ${shown}/${map.nodes.length} · edges built ${built}/${map.edges.length} · cars ${game.cars.length}`,
        `scan ${game.tick < game.scanAt ? `in ${((game.scanAt - game.tick) / 60).toFixed(1)} s` : 'ready'}`,
        '` or tap the top-left corner: close',
      ].join('\n'),
    )
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
