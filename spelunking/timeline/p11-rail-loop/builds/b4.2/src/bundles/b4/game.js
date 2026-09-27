// b4 · Rail Loop's sim (p11, D079): the spider bot, the seismic scan, the pull, the traverse nodes, building
// monorail edges and riding them. Fixed ticks, commands in, events out, no clock and no Math.random: the
// same map and commands give the same game. b3's probe rings, pull targeting, pack and light are reused as
// they are (src/sim/dig/); the rest is new, because b4 has no swipe table: the bot goes where it's pointed.
//
// Moving: `move` points the bot (8 ways) or stops it (0, 0). It steps tile to tile through any open tile
// (it climbs the back wall, D077; no gravity). A diagonal into rock slides along the open side.
// Scan: pointing into rock fires b3's probe at the rock tile, rings out to `scan.radius`, then it cools down
// for `scan.cooldown` ticks. Pull: b3's (D062): standing still, the nearest seen ore or loot in the light
// comes to the pack, one unit every `pull.ticks`, and the tile turns to rock.
// Nodes (b4.2, D080): a node on the network (the pod's, and the ends of built edges) shows for good; any
// other shows only while the bot is within `nodeReach` tiles.
// Building: `build` an unbuilt edge from a node on the network, the bot within `nodeReach` of it (D080: only
// the existing network grows, so the frontier is where you go), with at least `price` ore: the ore streams
// from the pack into the node, one unit every `streamTicks`; then the edge is built, its far node joins the network,
// and a travel pod (a car) waits at the near node.
// Riding: stepping onto a waiting car gets you in. A pointed direction picks, at each node, the built edge
// that fits it best (within 67.5°); the car runs node to node until no edge fits (it stops at the last
// node), a tap (it stops at the next node), or a new direction (it turns at the next node). Pointed while
// stopped where no edge fits, you get out and walk that way, unless the node's tile is rock: then you stay in.
// Bugs (b4.2, D080): b3.7's (`src/sim/dig/bugs.js`, D056–D064) as they are, with b3.7's numbers: wild ones in
// the fog nibble ore from the pack, the scan's rings scare them, 16 fed tames one into the bar, `place` (the
// 1 s hold near the bot) puts the bar's first bug down, and a placed bug mines seen ore round its den and hands
// it over as you pass (pull.js). Bar and placed bugs light round themselves like the bot does.

import { Tile, isOpen } from '../../sim/gen/world.js'
import { reveal } from '../../sim/dig/game.js'
import { ringCells } from '../../sim/dig/probe.js'
import { nearestValuable, toRock, updateMine } from '../../sim/dig/pull.js'
import { bugGlows, place, scare, updateBugs } from '../../sim/dig/bugs.js'
import { add, count, fits, take } from '../../sim/dig/pack.js'
import { litCells, lightRadius } from '../../sim/dig/light.js'
import { wrap } from '../../sim/dig/rules.js'
import { ROCK } from './world.js'

/** @typedef {import('./world.js').Map} Map */
/** @typedef {import('./world.js').Cell} Cell */

/** The sim's numbers; the dev panel tunes them live. */
export const CONFIG = {
  // D081: the intent is a rail about 7× faster than walking; start at 12 and 80 px/s (a b4.1 tile was 4 px)
  walkSpeed: 12, // px/s (a step takes whole ticks: 60 / speed, rounded; a diagonal √2 times that)
  // at 1 px a tile (D080) the light, the scan and the node detection grow ×4 with the scale (D081: "otherwise
  // the player will not find them"): b4.1's radius 6 → 24, light 4 → 16 (+1 per 4 ore or 2 loot, b3's
  // +1 per 16 ore or 8 loot ×4), nodes within 3 → 12; a ring a tick keeps the scan's time about b4.1's 0.5 s
  scan: { radius: 24, cooldown: 180, ringTicks: 1 }, // 3 s cooldown (user, D079)
  pull: { ticks: 60 }, // b3's pull was 300 (5 s a unit); 1 s here, or an edge is a minute of standing still
  light: { base: 16, orePer: 4, lootPer: 2, face: 4 }, // face: lit rock goes this deep (b3's lit face was a tile: 4 px here)
  packSlots: 6,
  packReserve: ['ore', 'loot'], // b3.7's pack (D064), ore and loot only (D080: no digging, no rock in the pack)
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
    barSlots: 3,
    light: 2,
    barMoveTicks: 12,
    barNear: 2,
    barFar: 8,
    mine: { ticks: 900, reach: 12, carry: 8, hand: 4, handTicks: 6 },
  }, // b3.7's (rules/b3.7.json), to be tuned in play (D081)
  price: 10, // ore per edge (user: 8–12, tuned later)
  streamTicks: 4,
  rideSpeed: 80, // px/s in a car (several px a tick: an integer budget, 60 a straight px, 85 a diagonal)
}
/** @typedef {typeof CONFIG} Config */

/**
 * @typedef {{ type: 'move', dx: number, dy: number } | { type: 'tap' } | { type: 'build', edge: number, from: number } | { type: 'place' }} Command
 */
/**
 * @typedef {{ type: 'seen', cells: number[] }
 *   | { type: 'ring', x: number, y: number, r: number }
 *   | { type: 'scan', x: number, y: number }
 *   | { type: 'pulled', x: number, y: number, tile: number, to: Cell }
 *   | { type: 'fed', node: number, from: Cell }
 *   | { type: 'built', edge: number }
 *   | { type: 'refused', edge: number, reason: 'ore' | 'busy' | 'off' | 'far' | 'built' }
 *   | { type: 'board', car: number } | { type: 'exit', car: number }
 *   | { type: 'nibble', id: number, x: number, y: number, from: Cell } | { type: 'tamed', id: number, x: number, y: number, slot: number }
 *   | { type: 'placed', id: number, x: number, y: number } | { type: 'returned', id: number, x: number, y: number, slot: number }
 *   | { type: 'handed', id: number, x: number, y: number, to: Cell }} GameEvent bugs.js and pull.js add the bugs' (and `by` on pulled)
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
 * @property {{ from: Cell, t: number, dur: number } | null} step a step under way, to ch
 * @property {{ dx: number, dy: number } | null} move
 * @property {import('../../sim/dig/pack.js').Pack} pack
 * @property {Uint8Array} seen
 * @property {number[]} lit
 * @property {number} radius
 * @property {number[]} surface
 * @property {{ x: number, y: number, r: number, glows: string }} litFor
 * @property {{ x: number, y: number, r: number, t: number } | null} probe
 * @property {number} scanAt the tick the scan is ready again
 * @property {number} stillFor
 * @property {Cell | null} pulling
 * @property {Uint8Array} net per node: on the network (D080)
 * @property {import('../../sim/dig/bugs.js').Bug[]} bugs b3's (D056)
 * @property {number} nextBug
 * @property {import('../../sim/dig/bugs.js').Field | null} bugField
 * @property {number} worldRev b4 never changes where bugs can go: always 0
 * @property {number} fed
 * @property {import('../../sim/dig/bugs.js').Bug[]} bar
 * @property {Record<number, number>} refill
 * @property {Uint8Array} built per edge
 * @property {Car[]} cars
 * @property {{ edge: number, from: number, left: number, t: number } | null} building
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
    step: null,
    move: null,
    pack: [], // D079: empty at the start (user)
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
    cars: [],
    building: null,
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
      const dir = cmd.dx || cmd.dy ? { dx: Math.sign(cmd.dx), dy: Math.sign(cmd.dy) } : null
      if (g.ride) point(g, g.ride, dir)
      else g.move = dir
    } else if (cmd.type === 'tap') {
      if (g.ride?.run) g.ride.stopNext = true
    } else if (cmd.type === 'place') place(/** @type {any} */ (g))
    else build(g, cmd.edge, cmd.from)
  }
  g.queue.length = 0

  if (g.ride) rideTick(g, g.ride)
  else walk(g)
  if (g.probe) spread(g, g.probe)
  feed(g)
  pull(g)
  updateMine(/** @type {any} */ (g))
  updateBugs(/** @type {any} */ (g))
  updateLight(g)
}

/** @param {Game} g */
function walk(g) {
  const s = g.step
  if (s) {
    if (++s.t < s.dur) return
    g.step = null
    const car = g.cars.findIndex((c) => same(g.map.nodes[c.node], g.ch))
    if (car >= 0) {
      g.ride = { car, node: g.cars[car].node, run: null, want: null, stopNext: false }
      g.move = null
      g.events.push({ type: 'board', car })
      return
    }
  }
  if (!g.move) return
  const { dx, dy } = g.move
  if (dx) g.ch.facing = dx
  const tries =
    dx && dy
      ? [
          [dx, dy],
          [dx, 0],
          [0, dy],
        ]
      : [[dx, dy]]
  for (const [ex, ey] of tries) {
    if (!open(g, g.ch.x + ex, g.ch.y + ey)) continue
    if (ex && ey && !open(g, g.ch.x + ex, g.ch.y) && !open(g, g.ch.x, g.ch.y + ey)) continue // no squeezing between two rock corners
    const dur = Math.max(1, Math.round(((ex && ey ? Math.SQRT2 : 1) * 60) / Math.max(1, g.cfg.walkSpeed)))
    g.step = { from: { x: g.ch.x, y: g.ch.y }, t: 0, dur }
    g.ch.x = wrap(g.ch.x + ex, g.world.w)
    g.ch.y += ey
    return
  }
  // pointed into rock: the scan (D079), if it's ready; the rock tile pointed at is its centre. The sheet,
  // the sea and space aren't rock: nothing to scan
  const y = g.ch.y + dy
  if (g.probe || g.tick < g.scanAt || y < 0 || y >= g.world.h) return
  if (g.map.kind[y * g.world.w + wrap(g.ch.x + dx, g.world.w)] !== ROCK) return
  g.probe = { x: wrap(g.ch.x + dx, g.world.w), y, r: 0, t: 0 }
  g.scanAt = g.tick + g.cfg.scan.cooldown
  g.events.push({ type: 'scan', x: g.probe.x, y })
  ring(g, g.probe, 1)
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

// b3's pull (D062), for b4's bot: still = not stepping, not pointed, not riding a car that moves
/** @param {Game} g */
function pull(g) {
  g.pulling = null
  if (g.step || g.move || g.ride?.run) {
    g.stillFor = 0
    return
  }
  const { packSlots: slots, packReserve: reserve } = g.cfg
  // the first to target a cell keeps it (D064): not the cells placed bugs pull now
  const claimed = new Set(g.bugs.flatMap((b) => (b.target ? [b.target.y * g.world.w + b.target.x] : [])))
  const c = nearestValuable(
    /** @type {any} */ (g),
    g.ch,
    lightRadius(g.pack, g.cfg.light),
    (t, i) => !claimed.has(i) && fits(g.pack, slots, [t], reserve),
  )
  g.pulling = c
  if (++g.stillFor % Math.max(1, g.cfg.pull.ticks) || !c) return
  const tile = g.world.tiles[c.y * g.world.w + c.x]
  add(g.pack, slots, tile, reserve)
  toRock(/** @type {any} */ (g), c.x, c.y)
  g.pulling = null
  g.litFor.r = -1
  g.events.push({ type: 'pulled', x: c.x, y: c.y, tile, to: { x: g.ch.x, y: g.ch.y } })
}

/** The squared distance, x the short way round. @param {Game} g @param {Cell} a @param {Cell} b */
export function dist2(g, a, b) {
  let dx = Math.abs(a.x - b.x)
  dx = Math.min(dx, g.world.w - dx)
  return dx * dx + (a.y - b.y) ** 2
}

/** The bot is within `nodeReach` of node i. @param {Game} g @param {number} i */
export const near = (g, i) => dist2(g, g.map.nodes[i], g.ch) <= g.cfg.nodeReach * g.cfg.nodeReach

/** Node i shows (D080): on the network, or the bot is near it. @param {Game} g @param {number} i */
export const shown = (g, i) => !!g.net[i] || near(g, i)

/** Can the edge be built from node `from` now? The reason it can't, or null. @param {Game} g @param {number} edge @param {number} from */
export function buildable(g, edge, from) {
  const e = g.map.edges[edge]
  if (!e || (e.a !== from && e.b !== from) || !g.net[from]) return 'off'
  if (!near(g, from)) return 'far'
  if (g.built[edge]) return 'built'
  if (g.building) return 'busy'
  if (count(g.pack, Tile.Ore) < g.cfg.price) return 'ore'
  return null
}

/** @param {Game} g @param {number} edge @param {number} from */
function build(g, edge, from) {
  const why = buildable(g, edge, from)
  if (why) return g.events.push({ type: 'refused', edge, reason: why })
  g.building = { edge, from, left: g.cfg.price, t: 0 }
}

// The ore streams into the node, then the edge is built (D079)
/** @param {Game} g */
function feed(g) {
  const b = g.building
  if (!b || ++b.t % Math.max(1, g.cfg.streamTicks)) return
  if (b.left > 0) {
    if (!take(g.pack, Tile.Ore)) return // the wild bugs could take it one day; wait for more
    b.left--
    g.litFor.r = -1
    g.events.push({ type: 'fed', node: b.from, from: { x: g.ch.x, y: g.ch.y } })
    return
  }
  const e = g.map.edges[b.edge]
  g.built[b.edge] = 1
  g.building = null
  g.cars.push({ node: b.from })
  g.events.push({ type: 'built', edge: b.edge })
  g.net[e.a === b.from ? e.b : e.a] = 1
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
  // nothing that way: out, and walk that way; but only onto open ground, or the bot is shut in the rock
  // with its car out of reach (a node's tile can be rock: the rails router rounds nodes to tiles)
  const n = g.map.nodes[r.node]
  if (!open(g, n.x, n.y)) return
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

/** Where the bot is drawn between ticks: its tile, or partway along a step or a ride. @param {Game} g @param {number} alpha 0..1 of the next tick */
export function botAt(g, alpha) {
  const s = g.step
  if (s) {
    const f = Math.min(1, (s.t + alpha) / s.dur)
    let dx = g.ch.x - s.from.x
    if (Math.abs(dx) > 1) dx = -Math.sign(dx) // across the wrap
    return { x: s.from.x + dx * f, y: s.from.y + (g.ch.y - s.from.y) * f }
  }
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
  return { x: g.ch.x, y: g.ch.y }
}

// b3's light (D051), from the bot
/** @param {Game} g */
function updateLight(g) {
  const r = lightRadius(g.pack, g.cfg.light)
  const at = g.litFor
  const sources = bugGlows(/** @type {any} */ (g))
  const glows = sources.map((c) => `${c.x},${c.y}`).join(' ')
  if (at.x === g.ch.x && at.y === g.ch.y && at.r === r && at.glows === glows) return
  g.litFor = { x: g.ch.x, y: g.ch.y, r, glows }
  g.radius = r
  const { face } = g.cfg.light
  let cells = deepen(g.world, litCells(g.world, g.ch, r), g.ch, r, face)
  const br = g.cfg.bugs.light
  for (const c of sources) cells = union(cells, deepen(g.world, litCells(g.world, c, br), c, br, face))
  g.lit = union(g.surface, cells)
  reveal(/** @type {any} */ (g), cells)
}

/**
 * b3's lit rock faces, `face` px deep (b4.2): the rock cells light.js lit, then rock 8-bordering them, face − 1
 * times, within the radius. At 1 px a tile, b3's one-tile face was a hairline. Sorted.
 * @param {import('../../sim/gen/world.js').World} world @param {number[]} cells @param {Cell} at @param {number} r @param {number} face
 */
function deepen(world, cells, at, r, face) {
  const { w, h, tiles } = world
  const set = new Set(cells)
  let front = cells.filter((i) => !isOpen(tiles[i]))
  for (let d = 1; d < face; d++) {
    /** @type {number[]} */
    const next = []
    for (const i of front) {
      const x = i % w
      const y = (i - x) / w
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy
          if (ny < 0 || ny >= h) continue
          const n = ny * w + wrap(x + dx, w)
          if (set.has(n) || isOpen(tiles[n])) continue
          let ex = Math.abs(wrap(x + dx, w) - at.x)
          ex = Math.min(ex, w - ex)
          if (ex * ex + (ny - at.y) ** 2 > r * r) continue
          set.add(n)
          next.push(n)
        }
    }
    front = next
  }
  return [...set].sort((a, b) => a - b)
}

/** Two sorted lists as one, sorted, no repeats. @param {number[]} a @param {number[]} b */
function union(a, b) {
  /** @type {number[]} */
  const out = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    const v = j >= b.length || (i < a.length && a[i] <= b[j]) ? a[i++] : b[j++]
    if (out[out.length - 1] !== v) out.push(v)
  }
  return out
}
