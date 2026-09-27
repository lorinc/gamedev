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
// Nodes: hidden until the bot comes within `nodeReach` tiles; the pod's are revealed from the start.
// Building: `build` an unbuilt edge from a revealed end, with at least `price` ore: the ore streams from
// the pack into the node, one unit every `streamTicks`; then the edge is built, its far node revealed,
// and a travel pod (a car) waits at the near node.
// Riding: stepping onto a waiting car gets you in. A pointed direction picks, at each node, the built edge
// that fits it best (within 67.5°); the car runs node to node until no edge fits (it stops at the last
// node), a tap (it stops at the next node), or a new direction (it turns at the next node). Pointed while
// stopped where no edge fits, you get out and walk that way, unless the node's tile is rock: then you stay in.

import { Tile, isOpen } from '../../sim/gen/world.js'
import { reveal } from '../../sim/dig/game.js'
import { ringCells } from '../../sim/dig/probe.js'
import { nearestValuable, toRock } from '../../sim/dig/pull.js'
import { add, count, fits, take } from '../../sim/dig/pack.js'
import { litCells, lightRadius, surfaceCells } from '../../sim/dig/light.js'
import { wrap } from '../../sim/dig/rules.js'

/** @typedef {import('./world.js').Map} Map */
/** @typedef {import('./world.js').Cell} Cell */

/** The sim's numbers; the dev panel tunes them live. */
export const CONFIG = {
  walkTicks: 8, // ticks per straight step (a diagonal takes 1.4×)
  scan: { radius: 6, cooldown: 180, ringTicks: 5 }, // D079: radius 6 (user), 3 s cooldown (user)
  pull: { ticks: 60 }, // b3's pull was 300 (5 s a unit); 1 s here, or an edge is a minute of standing still
  light: { base: 4, orePer: 16, lootPer: 8 },
  packSlots: 6,
  nodeReach: 3, // D079 (user)
  price: 10, // ore per edge (user: 8–12, tuned later)
  streamTicks: 4,
  rideTicks: 4, // ticks per tile in a car
}
/** @typedef {typeof CONFIG} Config */

/**
 * @typedef {{ type: 'move', dx: number, dy: number } | { type: 'tap' } | { type: 'build', edge: number, from: number }} Command
 */
/**
 * @typedef {{ type: 'seen', cells: number[] }
 *   | { type: 'ring', x: number, y: number, r: number }
 *   | { type: 'scan', x: number, y: number }
 *   | { type: 'pulled', x: number, y: number, tile: number, to: Cell }
 *   | { type: 'fed', node: number, from: Cell }
 *   | { type: 'built', edge: number }
 *   | { type: 'refused', edge: number, reason: 'ore' | 'busy' | 'hidden' | 'built' }
 *   | { type: 'revealed', node: number }
 *   | { type: 'board', car: number } | { type: 'exit', car: number }} GameEvent
 */

/** @typedef {{ node: number }} Car a travel pod, waiting at a node or carrying you */
/**
 * @typedef {object} Ride you in a car
 * @property {number} car
 * @property {number} node the node it's at or last left
 * @property {{ edge: number, i: number, dir: 1 | -1, t: number } | null} run on edge, going from path[i] to path[i + dir], t ticks in
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
 * @property {{ x: number, y: number, r: number }} litFor
 * @property {{ x: number, y: number, r: number, t: number } | null} probe
 * @property {number} scanAt the tick the scan is ready again
 * @property {number} stillFor
 * @property {Cell | null} pulling
 * @property {Uint8Array} revealed per node
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
    surface: surfaceCells(world),
    litFor: { x: -1, y: -1, r: -1 },
    probe: null,
    scanAt: 0,
    stillFor: 0,
    pulling: null,
    revealed: new Uint8Array(map.nodes.length),
    built: new Uint8Array(map.edges.length),
    cars: [],
    building: null,
    ride: null,
    queue: [],
    events: [],
  }
  for (const n of map.podNodes) g.revealed[n] = 1
  reveal(/** @type {any} */ (g), g.surface)
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
    } else build(g, cmd.edge, cmd.from)
  }
  g.queue.length = 0

  if (g.ride) rideTick(g, g.ride)
  else walk(g)
  if (g.probe) spread(g, g.probe)
  feed(g)
  pull(g)
  revealNodes(g)
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
    g.step = { from: { x: g.ch.x, y: g.ch.y }, t: 0, dur: ex && ey ? Math.round(g.cfg.walkTicks * 1.4) : g.cfg.walkTicks }
    g.ch.x = wrap(g.ch.x + ex, g.world.w)
    g.ch.y += ey
    return
  }
  // pointed into rock: the scan (D079), if it's ready; the rock tile pointed at is its centre
  const y = g.ch.y + dy
  if (g.probe || g.tick < g.scanAt || y < 0 || y >= g.world.h) return
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
  const { packSlots: slots } = g.cfg
  const c = nearestValuable(/** @type {any} */ (g), g.ch, lightRadius(g.pack, g.cfg.light), (t) => fits(g.pack, slots, [t]))
  g.pulling = c
  if (++g.stillFor % Math.max(1, g.cfg.pull.ticks) || !c) return
  const tile = g.world.tiles[c.y * g.world.w + c.x]
  add(g.pack, slots, tile)
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

/** @param {Game} g */
function revealNodes(g) {
  const r2 = g.cfg.nodeReach * g.cfg.nodeReach
  g.map.nodes.forEach((n, i) => {
    if (g.revealed[i] || dist2(g, n, g.ch) > r2) return
    g.revealed[i] = 1
    g.events.push({ type: 'revealed', node: i })
  })
}

/** Can the edge be built from node `from` now? The reason it can't, or null. @param {Game} g @param {number} edge @param {number} from */
export function buildable(g, edge, from) {
  const e = g.map.edges[edge]
  if (!e || (e.a !== from && e.b !== from) || !g.revealed[from]) return 'hidden'
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
  const far = e.a === b.from ? e.b : e.a
  if (!g.revealed[far]) {
    g.revealed[far] = 1
    g.events.push({ type: 'revealed', node: far })
  }
}

// Riding --------------------------------------------------------------------------------------------

/** The built edge from node `n` that fits the direction best (within 67.5°), as a run, or null. @param {Game} g @param {number} n @param {{ dx: number, dy: number }} want */
function pick(g, n, want) {
  const a0 = Math.atan2(want.dy, want.dx)
  let best = null
  let bestD = (67.5 * Math.PI) / 180 + 1e-9
  g.map.edges.forEach((e, k) => {
    if (!g.built[k] || (e.a !== n && e.b !== n)) return
    const dir = e.a === n ? 1 : -1
    const p = e.path
    const i = dir === 1 ? 0 : p.length - 1
    const j = dir === 1 ? Math.min(p.length - 1, 3) : Math.max(0, p.length - 4) // its heading: 3 tiles out
    let dx = p[j].x - p[i].x
    if (Math.abs(dx) > g.world.w / 2) dx -= Math.sign(dx) * g.world.w
    let d = Math.abs(Math.atan2(p[j].y - p[i].y, dx) - a0)
    if (d > Math.PI) d = 2 * Math.PI - d
    if (d < bestD) {
      bestD = d
      best = { edge: k, i, dir: /** @type {1 | -1} */ (dir), t: 0 }
    }
  })
  return best
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

/** @param {Game} g @param {Ride} r */
function rideTick(g, r) {
  const run = r.run
  if (!run) return
  if (++run.t < g.cfg.rideTicks) return
  run.t = 0
  const p = g.map.edges[run.edge].path
  run.i += run.dir
  g.ch.x = p[run.i].x
  g.ch.y = p[run.i].y
  const end = run.dir === 1 ? p.length - 1 : 0
  if (run.i !== end) return
  const e = g.map.edges[run.edge]
  r.node = run.dir === 1 ? e.b : e.a
  g.cars[r.car].node = r.node
  const next = r.stopNext || !r.want ? null : pick(g, r.node, r.want)
  r.run = next
  if (!next) {
    r.stopNext = false
    r.want = null // stopped: the next direction pointed starts it again
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
      const f = Math.min(1, (run.t + alpha) / g.cfg.rideTicks)
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
  if (at.x === g.ch.x && at.y === g.ch.y && at.r === r) return
  g.litFor = { x: g.ch.x, y: g.ch.y, r }
  g.radius = r
  const cells = litCells(g.world, g.ch, r)
  g.lit = union(g.surface, cells)
  reveal(/** @type {any} */ (g), cells)
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
