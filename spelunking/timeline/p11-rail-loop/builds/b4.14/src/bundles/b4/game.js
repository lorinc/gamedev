// b4 · Rail Loop's sim (p11, D079): the spider bot, the seismic scan, the pull, the traverse nodes, building
// monorail edges and riding them. Fixed ticks, commands in, events out, no clock and no Math.random: the
// same map and commands give the same game. b3's probe rings, pull targeting, pack and light are reused as
// they are (src/sim/dig/); the rest is new, because b4 has no swipe table: the bot goes where it's pointed.
//
// Moving (b4.3): `move` points the bot any way (the user: "every angle, not just 8") or stops it (0, 0).
// The bot has a sub-pixel position (`pos`, in thousandths of a pixel) that glides along the exact angle at
// `walkSpeed`; its pixel (`ch`) is where that position is, and it may only be an open one; it climbs the back
// wall, D077; no gravity. Into rock, it slides along the open side (the move's x or y part alone).
// Scan: pointing into rock fires b3's probe at the rock pixel, rings out to `scan.radius`, then it cools down
// for `scan.cooldown` ticks (1 s, the user, b4.3). It fires only if some pixel within its radius is still
// unseen (b4.6). Pull: b3's (D062): the nearest seen ore or
// loot in the light is pulled, one unit every `pull.ticks`, and the pixel turns to rock; it goes straight to
// the ledger (b4.3). Walking doesn't stop it (b4.5), a moving car does.
// The ledger (b4.3, the user): every collectible, one count each: ore, loot, bugs. No pack.
// Light (b4.3): a fixed radius (`light.base`, 8 px; upgrades later), line of sight (light.js sightCells).
// Nodes (b4.8, the user): the pod's show (and glow) until the first edge is built; from then on only the
// ends of built edges show, and only a shown node can be built from.
// Building (b4.3): `build` an unbuilt edge from a node on the network, the bot within `nodeReach` of it (D080),
// with `price` ore on the ledger: the price is taken and the edge is built at once, its far node joins the
// network, and a travel pod (a car) waits at the near node. Short of ore: refused.
// Riding: stepping onto a waiting car gets you in. A pointed direction picks, at each node, the built edge
// that fits it best (within 67.5°); the car runs node to node until no edge fits (it stops at the last
// node), a tap (it stops at the next node), or a new direction (it turns at the next node). Pointed while
// stopped where no edge fits, you get out and walk that way.
// Garden (b4.10, garden.js): tamed bugs green the back wall, vines grow on green, vines make red fruit, a
// resource: your pull takes fruit within the light too, seen or not. Your pull goes for the kind the ledger holds least
// of (b4.12), the nearest of it.
// Upgrades (b4.13, the user): fruit on the ledger is spent by itself on the bugs' reach: the first costs
// swarm.upgradeCost (16), each next twice the last; each adds swarm.upgradeReach px.
// Lizards (b4.14, lizards.js): plentiful ore spawns lizards; they zip round the cave surfaces mining ore, and
// after 16 burrow and make one loot in the wall.
// Worms (b4.12, worms.js): dense fruit spawns worms; they eat 8 fruit, burrow and curl up into an ore deposit.
// Bugs (b4.3): b3.7's wild ones (`src/sim/dig/bugs.js`, D056–D061) with the `ledger` switch: they nibble ore
// from the ledger; at 16 fed (D060) the last biter is +1 bug on the ledger. Tamed bugs are abstract workers
// (swarm.js).

import { Tile, isOpen } from '../../sim/gen/world.js'
import { reveal } from '../../sim/dig/game.js'
import { ringCells } from '../../sim/dig/probe.js'
import { nearestValuable, toRock } from '../../sim/dig/pull.js'
import { scare, updateBugs } from '../../sim/dig/bugs.js'
import { sightCells } from '../../sim/dig/light.js'
import { wrap } from '../../sim/dig/rules.js'
import { SWARM, updateSwarm } from './swarm.js'
import { createGarden, fruitNear, GARDEN, pick as pickFruit, updateGarden } from './garden.js'
import { updateWorms, WORMS } from './worms.js'
import { LIZARDS, updateLizards } from './lizards.js'
import { OPEN, ROCK } from './world.js'

/** @typedef {import('./world.js').Map} Map */
/** @typedef {import('./world.js').Cell} Cell */

/** The sim's numbers; the dev panel tunes them live. */
export const CONFIG = {
  // D081: the intent is a rail about 7× faster than walking; start at 12 and 80 px/s (a b4.1 tile was 4 px)
  walkSpeed: 12, // px/s (a step takes whole ticks: 60 / speed, rounded; a diagonal √2 times that)
  // at 1 px a tile (D080) the scan and the node detection grew ×4 with the scale (D081); the light is b4.2's
  // 16 halved (b4.3, the user: "torchlight is waaay too big"), fixed, and the pull's reach with it
  scan: { radius: 24, cooldown: 60, ringTicks: 1 }, // 1 s cooldown (the user, b4.3; was 3 s, D079)
  pull: { ticks: 60 }, // b3's pull was 300 (5 s a unit); 1 s here, or an edge is a minute of standing still
  light: { base: 8 },
  nodeReach: 12, // D079's 3 tiles (user) ×4
  bugs: {
    block: 32,
    blocks: 64,
    chasers: 3,
    refillTicks: 300,
    near: 4,
    moveTicks: 12,
    seek: 20,
    nibbleTicks: 40,
    tame: 16,
    scareTicks: 240,
    den: 12,
    barSlots: 0,
    ledger: true,
  }, // b3.7's wild bugs (rules/b3.7.json); no bar, no placed bugs (b4.3)
  swarm: { ...SWARM },
  garden: { ...GARDEN },
  worms: { ...WORMS },
  lizards: { ...LIZARDS },
  price: 10, // ore per edge (user: 8–12, tuned later)
  rideSpeed: 80, // px/s in a car (several px a tick: an integer budget, 60 a straight px, 85 a diagonal)
}
/** @typedef {typeof CONFIG} Config */

/**
 * @typedef {{ type: 'move', dx: number, dy: number } | { type: 'tap' } | { type: 'build', edge: number, from: number }} Command
 *   move: any direction, dx and dy any numbers (0, 0 = stop)
 */
/**
 * @typedef {{ type: 'seen', cells: number[] }
 *   | { type: 'ring', x: number, y: number, r: number }
 *   | { type: 'scan', x: number, y: number }
 *   | { type: 'pulled', x: number, y: number, tile: number, to: Cell }
 *   | { type: 'built', edge: number, from: number, price: number }
 *   | { type: 'refused', edge: number, reason: 'ore' | 'off' | 'far' | 'built' }
 *   | { type: 'dug', x: number, y: number, tile: number, by: number } | { type: 'haul', x: number, y: number, ore: number, loot: number, fruit: number }
 *   | { type: 'worm', x: number, y: number } | { type: 'eaten', x: number, y: number } | { type: 'deposit', cells: number[] }
 *   | { type: 'upgrade', level: number }
 *   | { type: 'lizard', x: number, y: number } | { type: 'licked', x: number, y: number, by: number }
 *   | { type: 'board', car: number } | { type: 'exit', car: number }
 *   | { type: 'nibble', id: number, x: number, y: number, from: Cell } | { type: 'tamed', id: number, x: number, y: number, slot: number }
 *  } GameEvent bugs.js adds the wild bugs'; tamed has slot -1 (to the ledger); tile FRUIT_TILE is a fruit (b4.10)
 */

/** @typedef {{ node: number }} Car a travel pod, waiting at a node or carrying you */
/**
 * @typedef {object} Ride you in a car
 * @property {number} car
 * @property {number} node the node it's at or last left
 * @property {{ edge: number, i: number, dir: 1 | -1, acc: number } | null} run on edge, going from path[i] to path[i + dir], with
 *   acc of the step's cost (STEP or DIAG) covered
 * @property {{ dx: number, dy: number } | null} want the direction pointed
 * @property {boolean} stopNext a tap: stop at the next node
 */

/**
 * @typedef {object} Game
 * @property {Map} map
 * @property {import('../../sim/gen/world.js').World} world
 * @property {Config} cfg
 * @property {number} tick
 * @property {{ x: number, y: number, facing: number }} ch the bot's tile (b3's pull and light read `ch`)
 * @property {{ x: number, y: number, px: number, py: number }} pos the bot's position in thousandths of a px (x
 *   wraps at w × 1000), this tick's and the last's (for drawing); always inside ch
 * @property {{ dx: number, dy: number } | null} move the direction pointed, as heading() gives it
 * @property {{ ore: number, loot: number, bugs: number, fruit: number }} ledger b4.3; fruit b4.10
 * @property {import('./garden.js').GardenState} garden b4.10
 * @property {import('./worms.js').Worm[]} worms b4.12
 * @property {number} level bug reach upgrades bought (b4.13)
 * @property {import('./lizards.js').Lizard[]} lizards b4.14
 * @property {import('./swarm.js').Worker[]} swarm the ledger's bugs at work
 * @property {Uint8Array} seen
 * @property {number[]} lit
 * @property {number} radius
 * @property {number[]} surface
 * @property {{ x: number, y: number, r: number, glows: string }} litFor
 * @property {{ x: number, y: number, r: number, t: number } | null} probe
 * @property {number} scanAt the tick the scan is ready again
 * @property {number} stillFor ticks something was in the pull's reach since the last unit
 * @property {Cell | null} pulling
 * @property {Uint8Array} net per node: on the network (D080)
 * @property {import('../../sim/dig/bugs.js').Bug[]} bugs b3's (D056)
 * @property {number} nextBug
 * @property {import('../../sim/dig/bugs.js').Field | null} bugField
 * @property {number} worldRev b4 never changes where bugs can go: always 0
 * @property {number} fed
 * @property {import('../../sim/dig/bugs.js').Bug[]} bar always empty (bugs.js reads it)
 * @property {Record<number, number>} refill
 * @property {Uint8Array} built per edge
 * @property {Uint8Array} railed per node: the end of a built edge (b4.8)
 * @property {boolean} firstBuilt an edge has been built
 * @property {Car[]} cars
 * @property {Ride | null} ride
 * @property {Command[]} queue
 * @property {GameEvent[]} events
 */

/** @param {Map} map @param {Config} cfg @returns {Game} */
export function createGame(map, cfg) {
  const { world } = map
  /** @type {Game} */
  const g = {
    map,
    world,
    cfg,
    tick: 0,
    ch: { x: map.start.x, y: map.start.y, facing: 1 },
    pos: { x: map.start.x * 1000 + 500, y: map.start.y * 1000 + 500, px: map.start.x * 1000 + 500, py: map.start.y * 1000 + 500 },
    move: null,
    ledger: { ore: 0, loot: 0, bugs: 0, fruit: 0 },
    garden: createGarden(world.w * world.h),
    worms: [],
    level: 0,
    lizards: [],
    swarm: [],
    seen: new Uint8Array(world.w * world.h),
    lit: [],
    radius: 0,
    surface: [], // no sky inside the map any more: nothing is always lit (b4.2)
    litFor: { x: -1, y: -1, r: -1, glows: '' },
    probe: null,
    scanAt: 0,
    stillFor: 0,
    pulling: null,
    net: new Uint8Array(map.nodes.length),
    bugs: [],
    nextBug: 1,
    bugField: null,
    worldRev: 0,
    fed: 0,
    bar: [],
    refill: {},
    built: new Uint8Array(map.edges.length),
    railed: new Uint8Array(map.nodes.length),
    firstBuilt: false,
    cars: [],
    ride: null,
    queue: [],
    events: [],
  }
  for (const n of map.podNodes) g.net[n] = 1
  reveal(/** @type {any} */ (g), map.podCells) // the pod's interior starts seen
  updateLight(g)
  return g
}

/** @param {Game} g @param {Command} cmd */
export function command(g, cmd) {
  g.queue.push(cmd)
}

/** @param {Game} g */
export function tick(g) {
  g.tick++
  for (const cmd of g.queue) {
    if (cmd.type === 'move') {
      const dir = heading(cmd.dx, cmd.dy)
      if (g.ride) point(g, g.ride, dir)
      else g.move = dir
    } else if (cmd.type === 'tap') {
      if (g.ride?.run) g.ride.stopNext = true
    } else build(g, cmd.edge, cmd.from)
  }
  g.queue.length = 0

  if (g.ride) rideTick(g, g.ride)
  else walk(g)
  if (g.probe) spread(g, g.probe)
  pull(g)
  updateBugs(/** @type {any} */ (g))
  updateSwarm(g)
  updateGarden(g)
  updateWorms(g)
  updateLizards(g)
  while (g.ledger.fruit >= nextCost(g)) {
    g.ledger.fruit -= nextCost(g)
    g.level++
    g.events.push({ type: 'upgrade', level: g.level })
  }
  updateLight(g)
}

/** @param {Game} g */
function walk(g) {
  const W = g.world.w * 1000
  const p = g.pos
  p.px = p.x
  p.py = p.y
  // a ride (or a test) put the bot on another pixel: its position follows, to that pixel's centre
  if (Math.floor(p.x / 1000) !== g.ch.x || Math.floor(p.y / 1000) !== g.ch.y) {
    p.x = p.px = g.ch.x * 1000 + 500
    p.y = p.py = g.ch.y * 1000 + 500
  }
  const m = g.move
  if (!m) return
  if (m.dx) g.ch.facing = Math.sign(m.dx)
  const len = Math.hypot(m.dx, m.dy)
  const v = (Math.max(0, g.cfg.walkSpeed) * 1000) / 60 // thousandths of a px a tick
  const vx = Math.round((m.dx * v) / len)
  const vy = Math.round((m.dy * v) / len)
  // the whole move, else its x part alone, else its y part alone (sliding along a wall)
  for (const [ex, ey] of [
    [vx, vy],
    [vx, 0],
    [0, vy],
  ]) {
    if (!ex && !ey) continue
    const nx = (((p.x + ex) % W) + W) % W
    const ny = p.y + ey
    const cx = Math.floor(nx / 1000)
    const cy = Math.floor(ny / 1000)
    const sx = cx === g.ch.x ? 0 : Math.abs(cx - g.ch.x) > 1 ? -Math.sign(cx - g.ch.x) : Math.sign(cx - g.ch.x) // across the wrap
    const sy = cy - g.ch.y
    if ((sx || sy) && !open(g, cx, cy)) continue
    if (sx && sy && !open(g, g.ch.x + sx, g.ch.y) && !open(g, g.ch.x, g.ch.y + sy)) continue // no squeezing between two rock corners
    p.x = nx
    p.y = ny
    if (!sx && !sy) return
    g.ch.x = cx
    g.ch.y = cy
    const car = g.cars.findIndex((c) => same(g.map.nodes[c.node], g.ch))
    if (car >= 0) {
      g.ride = { car, node: g.cars[car].node, run: null, want: null, stopNext: false }
      g.move = null
      g.events.push({ type: 'board', car })
    }
    return
  }
  // pointed into rock: the scan (D079), if it's ready; its centre is the rock pixel the direction points at
  // (the nearest of the 8). The sheet, the sea and space aren't rock: nothing to scan
  const dx = Math.round(m.dx / len)
  const dy = Math.round(m.dy / len)
  const y = g.ch.y + dy
  if (g.probe || g.tick < g.scanAt || y < 0 || y >= g.world.h) return
  if (g.map.kind[y * g.world.w + wrap(g.ch.x + dx, g.world.w)] !== ROCK) return
  if (!hidden(g, wrap(g.ch.x + dx, g.world.w), y, g.cfg.scan.radius)) return // nothing left to find there (the user, b4.6)
  g.probe = { x: wrap(g.ch.x + dx, g.world.w), y, r: 0, t: 0 }
  g.scanAt = g.tick + g.cfg.scan.cooldown
  g.events.push({ type: 'scan', x: g.probe.x, y })
  ring(g, g.probe, 1)
}

/** Some rock or cave pixel within r of (x, y) is still unseen (the sheet, the sea and space don't count). @param {Game} g @param {number} x @param {number} y @param {number} r */
function hidden(g, x, y, r) {
  const { w, h } = g.world
  for (let dy = -r; dy <= r; dy++) {
    const yy = y + dy
    if (yy < 0 || yy >= h) continue
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue
      const i = yy * w + wrap(x + dx, w)
      const k = g.map.kind[i]
      if (!g.seen[i] && (k === ROCK || k === OPEN)) return true
    }
  }
  return false
}

/** A direction as steps per 1000, the main axis ±1000 (integers from here on), or null for none. @param {number} dx @param {number} dy */
export function heading(dx, dy) {
  const len = Math.max(Math.abs(dx), Math.abs(dy))
  if (!(len > 0)) return null
  return { dx: Math.round((dx * 1000) / len), dy: Math.round((dy * 1000) / len) }
}

/** @param {Game} g @param {number} x @param {number} y */
function open(g, x, y) {
  if (y < 0 || y >= g.world.h) return false
  return isOpen(g.world.tiles[y * g.world.w + wrap(x, g.world.w)])
}

/** @param {Cell} a @param {Cell} b */
const same = (a, b) => a.x === b.x && a.y === b.y

/** @param {Game} g @param {{ x: number, y: number, r: number, t: number }} p */
function spread(g, p) {
  if (++p.t < p.r * Math.max(1, g.cfg.scan.ringTicks)) return
  if (p.r < g.cfg.scan.radius) ring(g, p, p.r + 1)
  else g.probe = null
}

/** @param {Game} g @param {{ x: number, y: number, r: number }} p @param {number} r */
function ring(g, p, r) {
  p.r = r
  reveal(/** @type {any} */ (g), ringCells(g.world, p, r))
  scare(/** @type {any} */ (g), p, r)
  g.events.push({ type: 'ring', x: p.x, y: p.y, r })
}

// b3's pull (D062), for b4's bot, also while walking (the user, after b4.4); not in a moving car. `stillFor`
// counts the ticks something was in reach since the last unit: a unit every pull.ticks
/** @param {Game} g */
function pull(g) {
  g.pulling = null
  /** @type {Cell | null} */
  let c = null
  let fruit = false
  if (!g.ride?.run) {
    // the kind the ledger holds least of first (the user, b4.12), then the next; nearest within a kind; ties
    // on the ledger go ore, loot, fruit
    const r = g.cfg.light.base
    const L = g.ledger
    const kinds = /** @type {const} */ (['ore', 'loot', 'fruit']).slice().sort((p, q) => L[p] - L[q])
    for (const k of kinds) {
      if (k === 'fruit') {
        const f = fruitNear(g, g.ch, r)
        if (f) (c = { x: f.x, y: f.y }), (fruit = true)
      } else c = nearestValuable(/** @type {any} */ (g), g.ch, r, (t) => t === (k === 'ore' ? Tile.Ore : Tile.Loot))
      if (c) break
    }
  }
  if (!c) {
    g.stillFor = 0
    return
  }
  g.pulling = c
  if (++g.stillFor < Math.max(1, g.cfg.pull.ticks)) return
  g.stillFor = 0
  if (fruit) {
    pickFruit(g, c.x, c.y)
    g.ledger.fruit++
    g.pulling = null
    g.events.push({ type: 'pulled', x: c.x, y: c.y, tile: FRUIT_TILE, to: { x: g.ch.x, y: g.ch.y } })
    return
  }
  const tile = g.world.tiles[c.y * g.world.w + c.x]
  if (tile === Tile.Ore) g.ledger.ore++
  else g.ledger.loot++
  toRock(/** @type {any} */ (g), c.x, c.y)
  g.pulling = null
  g.litFor.r = -1
  g.events.push({ type: 'pulled', x: c.x, y: c.y, tile, to: { x: g.ch.x, y: g.ch.y } })
}

/** The fruit the next reach upgrade costs: upgradeCost × 2^level (b4.13). @param {Game} g */
export const nextCost = (g) => Math.max(1, g.cfg.swarm.upgradeCost) * 2 ** g.level

/** A pulled or dug unit that was a fruit (b4.10), not a tile. */
export const FRUIT_TILE = -1

/** The squared distance, x the short way round. @param {Game} g @param {Cell} a @param {Cell} b */
export function dist2(g, a, b) {
  let dx = Math.abs(a.x - b.x)
  dx = Math.min(dx, g.world.w - dx)
  return dx * dx + (a.y - b.y) ** 2
}

/** The bot is within `nodeReach` of node i. @param {Game} g @param {number} i */
export const near = (g, i) => dist2(g, g.map.nodes[i], g.ch) <= g.cfg.nodeReach * g.cfg.nodeReach

/** Node i shows (b4.8): before the first edge, a pod node; after it, the end of a built edge. @param {Game} g @param {number} i */
export const shown = (g, i) => (g.firstBuilt ? !!g.railed[i] : !!g.net[i])

/** Can the edge be built from node `from` now? The reason it can't, or null. @param {Game} g @param {number} edge @param {number} from */
export function buildable(g, edge, from) {
  const e = g.map.edges[edge]
  if (!e || (e.a !== from && e.b !== from) || !g.net[from] || !shown(g, from)) return 'off'
  if (!near(g, from)) return 'far'
  if (g.built[edge]) return 'built'
  if (g.ledger.ore < g.cfg.price) return 'ore'
  return null
}

/** @param {Game} g @param {number} edge @param {number} from */
function build(g, edge, from) {
  const why = buildable(g, edge, from)
  if (why) return g.events.push({ type: 'refused', edge, reason: why })
  const e = g.map.edges[edge]
  g.ledger.ore -= g.cfg.price
  g.built[edge] = 1
  g.cars.push({ node: from })
  g.net[e.a === from ? e.b : e.a] = 1
  g.railed[e.a] = g.railed[e.b] = 1
  g.firstBuilt = true
  g.events.push({ type: 'built', edge, from, price: g.cfg.price })
}

// Riding --------------------------------------------------------------------------------------------

/** An edge's heading is read this many px out from its node (b4.1's 3 tiles = 3 of the router's cells). */
export const HEADING = 12

/** The built edge from node `n` that fits the direction best (within 67.5°), as a run, or null. @param {Game} g @param {number} n @param {{ dx: number, dy: number }} want */
function pick(g, n, want) {
  const a0 = Math.atan2(want.dy, want.dx)
  /** @type {NonNullable<Ride['run']> | null} */
  let best = null
  let bestD = (67.5 * Math.PI) / 180 + 1e-9
  g.map.edges.forEach((e, k) => {
    if (!g.built[k] || (e.a !== n && e.b !== n)) return
    const dir = e.a === n ? 1 : -1
    const p = e.path
    const i = dir === 1 ? 0 : p.length - 1
    const j = dir === 1 ? Math.min(p.length - 1, HEADING) : Math.max(0, p.length - 1 - HEADING) // its heading
    let dx = p[j].x - p[i].x
    if (Math.abs(dx) > g.world.w / 2) dx -= Math.sign(dx) * g.world.w
    let d = Math.abs(Math.atan2(p[j].y - p[i].y, dx) - a0)
    if (d > Math.PI) d = 2 * Math.PI - d
    if (d < bestD) {
      bestD = d
      best = { edge: k, i, dir: /** @type {1 | -1} */ (dir), acc: 0 }
    }
  })
  return /** @type {NonNullable<Ride['run']> | null} */ (best) // set in the callback: tsc can't see it
}

/** Pointed while in a car. @param {Game} g @param {Ride} r @param {{ dx: number, dy: number } | null} dir */
function point(g, r, dir) {
  if (!dir) return // letting go changes nothing: the car goes on
  r.want = dir
  if (r.run) return // it turns at the next node
  r.stopNext = false
  r.run = pick(g, r.node, dir)
  if (r.run) return
  // nothing that way: out, and walk that way (nodes are never in rock, b4.3)
  g.events.push({ type: 'exit', car: r.car })
  g.ride = null
  g.move = dir
}

// A car's budget per px: 60 a straight step, 85 a diagonal (60√2); it gains rideSpeed a tick
const STEP = 60
const DIAG = 85

/** The cost of the step from path[i] to path[i + dir]. @param {Cell[]} p @param {number} i @param {number} dir */
const stepCost = (p, i, dir) => (p[i].x !== p[i + dir].x && p[i].y !== p[i + dir].y ? DIAG : STEP)

/** @param {Game} g @param {Ride} r */
function rideTick(g, r) {
  let run = r.run
  if (!run) return
  run.acc += Math.max(1, g.cfg.rideSpeed)
  for (;;) {
    const p = g.map.edges[run.edge].path
    const cost = stepCost(p, run.i, run.dir)
    if (run.acc < cost) return
    run.acc -= cost
    run.i += run.dir
    g.ch.x = p[run.i].x
    g.ch.y = p[run.i].y
    if (run.i !== (run.dir === 1 ? p.length - 1 : 0)) continue
    const e = g.map.edges[run.edge]
    r.node = run.dir === 1 ? e.b : e.a
    g.cars[r.car].node = r.node
    const next = r.stopNext || !r.want ? null : pick(g, r.node, r.want)
    r.run = next
    if (!next) {
      r.stopNext = false
      r.want = null // stopped: the next direction pointed starts it again
      return
    }
    next.acc = run.acc // the budget carries on through the node
    run = next
  }
}

/** Where the bot is drawn between ticks: its sub-pixel position, or partway along a ride. @param {Game} g @param {number} alpha 0..1 of the next tick */
export function botAt(g, alpha) {
  const run = g.ride?.run
  if (run) {
    const p = g.map.edges[run.edge].path
    const n = p[run.i + run.dir]
    if (n) {
      const f = Math.min(1, (run.acc + alpha * g.cfg.rideSpeed) / stepCost(p, run.i, run.dir))
      let dx = n.x - g.ch.x
      if (Math.abs(dx) > 1) dx = -Math.sign(dx)
      return { x: g.ch.x + dx * f, y: g.ch.y + (n.y - g.ch.y) * f }
    }
  }
  if (g.ride) return { x: g.ch.x, y: g.ch.y }
  // walking: between last tick's position and this one's, as a pixel's top-left (the view adds 0.5)
  const p = g.pos
  let dx = p.x - p.px
  const W = g.world.w * 1000
  if (Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W
  return { x: (p.px + dx * alpha) / 1000 - 0.5, y: (p.py + (p.y - p.py) * alpha) / 1000 - 0.5 }
}

// The light (b4.3): a fixed radius, line of sight from the bot; recomputed when the bot or the rock changed
/** @param {Game} g */
function updateLight(g) {
  const r = Math.max(0, g.cfg.light.base)
  const at = g.litFor
  if (at.x === g.ch.x && at.y === g.ch.y && at.r === r) return
  g.litFor = { x: g.ch.x, y: g.ch.y, r, glows: '' }
  g.radius = r
  g.lit = sightCells(g.world, g.ch, r)
  reveal(/** @type {any} */ (g), g.lit)
}
