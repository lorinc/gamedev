// b4 · Rail Loop (p11, D079): wires the map, the sim, input and the view. Fixed 60 Hz sim, the view
// interpolates. The URL carries the seed and every knob tuned away from its default (`?seed=1&k=price:12`).

import { createPanel } from '../b3/panel.js'
import { command, CONFIG, createGame, HEADING, tick } from './game.js'
import { createInput } from './input.js'
import { createRenderer, ZOOM_PX } from './render.js'
import { makeMap, WKNOBS } from './world.js'

const BUILD = 'b4.31' // the live build; npm run freeze stamps the build id into frozen copies
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
const ui = { select: null, refusedAt: -9 }
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
    'world.ore': [100, 600, 10],
    'world.loot': [0, 200, 5],
    'sim.walkSpeed': [1, 60, 1],
    'sim.scan.radius': [4, 64, 1],
    'sim.scan.cooldown': [0, 600, 10],
    'sim.scan.ringTicks': [1, 20, 1],
    'sim.pull.ticks': [1, 300, 1],
    'sim.price': [1, 40, 1],
    'sim.nodeReach': [2, 40, 1],
    'sim.ejectTicks': [30, 1200, 30],
    'sim.light.base': [2, 48, 1],
    'sim.rideSpeed': [10, 400, 5],
    'sim.bugs.seek': [4, 160, 1],
    'sim.bugs.moveTicks': [1, 30, 1],
    'sim.bugs.tame': [1, 64, 1],
    'sim.bugs.block': [8, 128, 4],
    'sim.bugs.chasers': [0, 12, 1],
    'sim.swarm.tripTicks': [600, 36000, 600],
    'sim.swarm.moveTicks': [1, 60, 1],
    'sim.swarm.pullTicks': [1, 600, 5],
    'sim.swarm.reach': [1, 8, 1],
    'sim.swarm.spawn': [0, 64, 1],
    'sim.swarm.fruitCarry': [1, 32, 1],
    'sim.garden.trail': [0, 4, 1],
    'sim.garden.sprout': [1, 400, 1],
    'sim.garden.growTicks': [10, 1800, 10],
    'sim.garden.perFruit': [1, 60, 1],
    'sim.garden.fruitTicks': [600, 18000, 600],
    'sim.garden.burnTicks': [1, 60, 1],
    'sim.garden.burnFor': [1, 20, 1],
    'sim.flowers.per': [1, 40, 1],
    'sim.flowers.bloomTicks': [600, 36000, 600],
    'sim.flowers.buildGap': [60, 18000, 60],
    'sim.flowers.chance': [1, 10, 1],
    'sim.flowers.builds': [1, 10, 1],
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
    'sim.botUpgradeCost': [1, 256, 1],
    'sim.upgradeGain': [0, 1, 0.05],
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

/** The unbuilt edge from `node` whose heading is closest to the drag. @param {number} node @param {number} dx @param {number} dy */
function aimEdge(node, dx, dy) {
  const a0 = Math.atan2(dy, dx)
  let best = -1
  let bestD = Infinity
  map.edges.forEach((e, k) => {
    if (game.built[k] || (e.a !== node && e.b !== node)) return
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

createInput(canvas, {
  // held in a node (b4.22), a direction aims at its edges and a tap builds the one aimed at
  move: (dx, dy) => {
    held.dx = dx
    held.dy = dy
    const n = game.engulf
    if (n === null) return command(game, { type: 'move', dx, dy })
    if (!dx && !dy) return // letting go keeps the aim
    const edge = aimEdge(n, dx, dy)
    ui.select = edge >= 0 ? { node: n, edge } : null
  },
  tap: () => {
    const s = ui.select
    if (game.engulf === null) return command(game, { type: 'tap' })
    if (!s) return
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
    if (e.type === 'eject') {
      ui.select = null
      if (held.dx || held.dy) command(game, { type: 'move', dx: held.dx, dy: held.dy }) // still pointing: walk on
    }
    if (e.type === 'built') ui.select = null
  }
  game.events.length = 0
  renderer.draw(acc / TICK_MS, Math.min(ms, 100) / 1000, now)
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
        `ledger: ore ${game.ledger.ore} · loot ${game.ledger.loot} · fruit ${game.ledger.fruit} · vines ${game.garden.vines.length} px · worms ${game.worms.length} · lizards ${game.lizards.length} · bugs ${game.ledger.bugs} (at work ${game.swarm.length}, carrying ${game.swarm.reduce((a, b) => a + b.ore + b.loot, 0)})`,
        `wild bugs ${game.bugs.length} (chasing ${game.bugs.filter((b) => b.chasing).length}) · fed ${game.fed}/${game.cfg.bugs.tame}`,
        '` or tap the top-left corner: close',
      ].join('\n'),
    )
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
