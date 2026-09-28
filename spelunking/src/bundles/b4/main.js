// b4 · Rail Loop (p11, D079): wires the map, the sim, input and the view. Fixed 60 Hz sim, the view
// interpolates. The URL carries the seed and every knob tuned away from its default (`?seed=1&k=price:12`).

import { createPanel } from '../b3/panel.js'
import { command, CONFIG, createGame, HEADING, tick } from './game.js'
import { createInput } from './input.js'
import { createRenderer, ZOOM_PX } from './render.js'
import { load, save } from './save.js'
import { makeMap, WKNOBS } from './world.js'

const BUILD = 'b4-dev' // the live build; npm run freeze stamps the build id into frozen copies
const TICK_MS = 1000 / 60
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id))

// view.bright (b4.47, the user: "too dark to see, but only on the phone"): the canvas's CSS brightness; phone
// screens crush the dark greys the desktop shows, so a touch screen starts brighter. Black stays black.
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
const DEFAULTS = { world: { ...WKNOBS }, sim: JSON.parse(JSON.stringify(CONFIG)), view: { zoom: -1, bright: coarse ? 1.5 : 1, crystalPing: 30 } }
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

// b4.62's save: one per build, seed and map knobs, in localStorage; loaded here, before the view paints it
const SAVE_KEY = `b4-save:${BUILD}:${seed}:${changed(tunables.world, DEFAULTS.world, '').join(',')}`
const SAVE_MS = 30000
/** The map and a game on it: the save's, else a fresh one. */
function start() {
  const map = makeMap(seed, tunables.world)
  const made = map.world.tiles.slice()
  const game = createGame(map, tunables.sim)
  /** @type {string | null} */
  let s = null
  try {
    s = localStorage.getItem(SAVE_KEY)
  } catch {} // storage blocked: no saves
  if (!s) return { map, made, game }
  try {
    load(game, s)
    return { map, made, game }
  } catch (err) {
    console.warn('save not loaded, a fresh game:', err)
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {}
    const fresh = makeMap(seed, tunables.world)
    return { map: fresh, made, game: createGame(fresh, tunables.sim) }
  }
}
const { map, made, game } = start()
let wiped = false // "new game": no save on the way out
let savedAt = performance.now()
function persist() {
  if (wiped) return
  savedAt = performance.now()
  try {
    localStorage.setItem(SAVE_KEY, save(game, made))
  } catch {} // full or blocked: play on unsaved
}
addEventListener('pagehide', persist)
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && persist())
/** @type {import('./render.js').Ui} */
const ui = { select: null, refusedAt: -9 }
const canvas = /** @type {HTMLCanvasElement} */ ($('game'))
const renderer = createRenderer(canvas, game, ui, tunables.view)
const bright = () => (canvas.style.filter = tunables.view.bright === 1 ? '' : `brightness(${tunables.view.bright})`)
bright()
let now = 0 // seconds, the frame's

const worldBefore = JSON.stringify(tunables.world)
/** @type {number | undefined} */
let reloadTimer
const panel = createPanel(
  $('panel'),
  tunables,
  {
    'world.ore': [100, 600, 10],
    'world.crystals': [0, 200, 5],
    'sim.walkSpeed': [1, 60, 1],
    'sim.scan.radius': [4, 64, 1],
    'sim.scan.cooldown': [0, 600, 10],
    'sim.scan.ringTicks': [1, 20, 1],
    'sim.pull.ticks': [1, 300, 1],
    'sim.price': [1, 40, 1],
    'sim.nodeReach': [2, 40, 1],
    'sim.ejectTicks': [30, 1200, 30],
    'sim.holdOffTicks': [0, 60, 1],
    'sim.light.base': [2, 48, 1],
    'sim.rideSpeed': [10, 400, 5],
    'sim.bugs.seek': [4, 160, 1],
    'sim.bugs.moveTicks': [1, 30, 1],
    'sim.bugs.tame': [1, 64, 1],
    'sim.nodesPerBug': [1, 32, 1],
    'sim.bugs.block': [8, 128, 4],
    'sim.bugs.chasers': [0, 12, 1],
    'sim.swarm.fireStop': [0, 24, 1],
    'sim.swarm.idleTicks': [600, 36000, 600],
    'sim.swarm.near': [0, 32, 1],
    'sim.bounce.jumpSpeed': [5, 60, 1],
    'sim.bounce.gravity': [0, 120, 1],
    'sim.bounce.restTicks': [0, 600, 10],
    'sim.bounce.wildJump': [1, 400, 1],
    'sim.bounce.mothSpeed': [1, 60, 1],
    'sim.bounce.mothRadius': [1, 32, 1],
    'sim.bounce.mothFlip': [1, 1200, 10],
    'sim.bounce.mothJitter': [0, 800, 10],
    'sim.swarm.moveTicks': [1, 60, 1],
    'sim.swarm.pullTicks': [1, 600, 5],
    'sim.swarm.reach': [1, 8, 1],
    'sim.swarm.spawn': [0, 64, 1],
    'sim.swarm.crowd': [4, 128, 4],
    'sim.garden.trail': [0, 4, 1],
    'sim.garden.sprout': [1, 400, 1],
    'sim.garden.growTicks': [10, 1800, 10],
    'sim.garden.perFruit': [1, 60, 1],
    'sim.garden.fruitTicks': [600, 18000, 600],
    'sim.garden.burnTicks': [1, 60, 1],
    'sim.garden.burnFor': [1, 20, 1],
    'sim.garden.hyper': [1, 40, 1],
    'sim.garden.suppress': [0, 8, 1],
    'sim.flowers.per': [1, 40, 1],
    'sim.flowers.bloomTicks': [600, 36000, 600],
    'sim.flowers.buildGap': [60, 18000, 60],
    'sim.flowers.chance': [1, 10, 1],
    'sim.flowers.builds': [1, 10, 1],
    'sim.ashworms.chance': [1, 20, 1],
    'sim.ashworms.life': [60, 3600, 60],
    'sim.ashworms.moveTicks': [1, 30, 1],
    'sim.ashworms.light': [0, 12, 1],
    'sim.garden.spread': [0, 100, 5],
    'sim.garden.spreadDiag': [0, 100, 5],
    'sim.garden.ash': [1, 12, 1],
    'sim.garden.ashMax': [1, 12, 1],
    'sim.garden.ashGap': [2, 40, 1],
    'sim.garden.ashGapMax': [2, 40, 1],
    'sim.worms.density': [1, 40, 1],
    'sim.worms.radius': [2, 48, 1],
    'sim.worms.max': [0, 60, 1],
    'sim.worms.moveTicks': [1, 60, 1],
    'sim.worms.eat': [1, 32, 1],
    'sim.lizards.density': [1, 100, 1],
    'sim.lizards.max': [0, 40, 1],
    'sim.lizards.zipTicks': [1, 20, 1],
    'sim.lizards.eat': [1, 64, 1],
    'sim.lizards.room': [0, 4000, 50],
    'sim.lichen.density': [1, 450, 5],
    'sim.lichen.radius': [2, 24, 1],
    'sim.lichen.spark': [1, 120, 1],
    'sim.beasts.first': [1, 128, 1],
    'sim.beasts.everyTicks': [600, 72000, 600],
    'sim.beasts.near': [10, 200, 5],
    'sim.gas.per': [1, 64, 1],
    'sim.gas.cap': [1, 64, 1],
    'sim.gas.spreadTicks': [1, 600, 1],
    'sim.gas.everyTicks': [30, 3600, 30],
    'sim.gas.perMoss': [0, 8, 1],
    'sim.lizardUpgradeCost': [1, 256, 1],
    'sim.upgradeGain': [0, 1, 0.05],
    'view.zoom': [-1, ZOOM_PX.length - 1, 1],
    'view.bright': [0.5, 3, 0.1],
    'view.crystalPing': [1, 120, 1],
  },
  {
    onChange: () => {
      bright()
      history.replaceState(null, '', urlFor(seed))
      // a new ore layer needs a new map: reload once the slider rests
      if (JSON.stringify(tunables.world) !== worldBefore) {
        clearTimeout(reloadTimer)
        reloadTimer = setTimeout(() => location.reload(), 700)
      }
    },
    buttons: [
      [
        'new game',
        () => {
          wiped = true
          try {
            localStorage.removeItem(SAVE_KEY)
          } catch {}
          location.reload()
        },
      ],
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

/** The edge from `node` whose heading is closest to the drag, within 67.5° (b4.41): a built one, or an unbuilt
 * one while the ledger holds the price. -1: none. @param {number} node @param {number} dx @param {number} dy */
function aimEdge(node, dx, dy) {
  const a0 = Math.atan2(dy, dx)
  let best = -1
  let bestD = (67.5 * Math.PI) / 180 + 1e-9
  const afford = game.ledger.ore >= game.cfg.price
  map.edges.forEach((e, k) => {
    if ((!game.built[k] && !afford) || (e.a !== node && e.b !== node)) return
    const p = e.a === node ? e.path : [...e.path].reverse()
    const q = p[Math.min(HEADING, p.length - 1)]
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

/** The direction pointed now (0, 0: none), for walking on when a bulb lets go (b4.26). */
const held = { dx: 0, dy: 0 }

/** Held in a bulb, the direction pointed picks one of its edges (b4.41). */
/** The first `holdOffTicks` (50 ms) in a bulb: nothing is picked or confirmed (b4.52, the user). */
const holdOff = () => game.engulf !== null && game.tick - game.engulfAt < game.cfg.holdOffTicks
function aim() {
  const n = game.engulf
  if (n === null || (!held.dx && !held.dy) || holdOff()) return
  const edge = aimEdge(n, held.dx, held.dy)
  ui.select = edge >= 0 ? { node: n, edge } : null
}
/** Release confirms the edge picked: ride a built one, build an unbuilt one (b4.41). */
function confirm() {
  const s = ui.select
  ui.select = null
  if (!s || game.engulf !== s.node || holdOff()) return
  if (game.built[s.edge]) command(game, { type: 'ride', edge: s.edge, from: s.node, dx: aimed.dx, dy: aimed.dy })
  else command(game, { type: 'build', edge: s.edge, from: s.node })
}
/** The direction the pick was made with: the ride goes on that way through the next nodes. */
const aimed = { dx: 0, dy: 0 }

createInput(canvas, {
  // held in a node (b4.22), a drag picks one of its edges and letting go confirms it (b4.41)
  move: (dx, dy) => {
    held.dx = dx
    held.dy = dy
    if (game.engulf === null) return command(game, { type: 'move', dx, dy })
    if (!dx && !dy) return confirm()
    aimed.dx = dx
    aimed.dy = dy
    aim()
  },
  tap: () => {
    if (game.engulf === null) return command(game, { type: 'tap' })
    confirm()
  },
  cancel: () => {
    held.dx = held.dy = 0
    if (game.engulf === null) command(game, { type: 'move', dx: 0, dy: 0 })
    else ui.select = null
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
    if (e.type === 'engulf') ui.select = null
    if (e.type === 'eject') {
      ui.select = null
      if (held.dx || held.dy) command(game, { type: 'move', dx: held.dx, dy: held.dy }) // still pointing: walk on
    }
    if (e.type === 'built') ui.select = null
  }
  game.events.length = 0
  // held in a bulb, past the hold-off, still pointing (the drag you walked in with, b4.52): it picks
  if (game.engulf !== null && !ui.select && (held.dx || held.dy) && !holdOff()) {
    aimed.dx = held.dx
    aimed.dy = held.dy
    aim()
  }
  renderer.draw(acc / TICK_MS, Math.min(ms, 100) / 1000, now)
  if (t - savedAt > SAVE_MS) persist()
  if (panel.isOpen() && t - lastReadout > 250) {
    lastReadout = t
    const built = game.built.reduce((a, b) => a + b, 0)
    const onNet = game.net.reduce((a, b) => a + b, 0)
    panel.setReadout(
      [
        `${BUILD} · seed ${seed} · map ${map.world.w}×${map.world.h}`,
        `pos ${game.ch.x},${game.ch.y} · light r ${game.radius} · ${game.ride ? 'riding' : game.move ? 'walking' : 'still'}`,
        `nodes on the network ${onNet}/${map.nodes.length} · edges built ${built}/${map.edges.length}`,
        `scan ${game.tick < game.scanAt ? `in ${((game.scanAt - game.tick) / 60).toFixed(1)} s` : 'ready'}`,
        `ledger: ore ${game.ledger.ore} · crystals ${game.ledger.crystals} · fruit ${game.ledger.fruit} · vines ${game.garden.vines.length} px · worms ${game.worms.length} · lizards ${game.lizards.length} · bugs ${game.ledger.bugs} (at work ${game.swarm.length}, in the air ${game.swarm.filter((b) => b.fly).length})`,
        `wild bugs ${game.bugs.length} (chasing ${game.bugs.filter((b) => b.chasing).length}) · fed ${game.fed}/${game.cfg.bugs.tame}`,
        '` or tap the top-left corner: close',
      ].join('\n'),
    )
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
