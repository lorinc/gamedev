// The dig game state and its fixed tick. Commands in (intent / stop / teleport), events out;
// renderers read state and events and never write them.

import { isOpen, Tile } from '../gen/world.js'
import { digTicks, stopReason, tileAt } from './rules.js'
import { add, fits, MATERIAL_NAME, material, rock, spendRock, valuable } from './pack.js'
import { interpret } from './ruleset.js'

/** @typedef {import('../gen/world.js').World} World */
/** @typedef {import('./rules.js').Action} Action */
/** @typedef {import('./rules.js').Cell} Cell */
/** @typedef {import('./rules.js').SimConfig} SimConfig */
/** @typedef {import('./ruleset.js').Table} Table */
/** @typedef {import('./pack.js').Pack} Pack */

/**
 * @typedef {{ type: 'intent', dx: number, dy: number } | { type: 'stop' } | { type: 'teleport' }} Command
 */

/**
 * @typedef {{ type: 'step', action: Action, fresh: boolean }
 *   | { type: 'mined', x: number, y: number, tile: number, kept: boolean }
 *   | { type: 'built', x: number, y: number }
 *   | { type: 'stop', reason: string, dx: number, dy: number, tried: Cell[], rule?: Action['rule'], next: Action['kind'] }
 *   | { type: 'abort' }
 *   | { type: 'teleport', from: Cell, dive: Dive | null }} GameEvent
 */

/**
 * @typedef {object} Step
 * @property {Action} action
 * @property {Cell} from
 * @property {number} t ticks elapsed
 * @property {number} digT ticks spent mining / building before moving
 * @property {number} dur total ticks
 * @property {boolean} [home] a deep fall: teleport home on landing
 * @property {number} [hold] ticks at the end spent in place (a deep fall: the teleport charge at the bottom)
 */

/**
 * @typedef {object} Dive
 * @property {number} n
 * @property {number} startTick
 * @property {number} ticks
 * @property {Stash} got what it brought home
 * @property {number} depth deepest tile below home
 * @property {number} mined
 * @property {number} built
 * @property {Record<string, number>} stops
 */

/** @typedef {{ soft: number, hard: number, ore: number, loot: number }} Stash */

/**
 * @typedef {object} Game
 * @property {World} world
 * @property {SimConfig} cfg read every tick, so the dev panel can change it live
 * @property {Table} table what a swipe means where you stand (a compiled ruleset)
 * @property {number} tick
 * @property {{ x: number, y: number, facing: number }} ch
 * @property {Cell} home
 * @property {{ dx: number, dy: number, prev: Action | null } | null} run the current intent
 * @property {Step | null} step
 * @property {Pack} pack every material mined, in slots (pack.js)
 * @property {Stash} stash counted at home
 * @property {Dive | null} dive
 * @property {Dive[]} dives
 * @property {Command[]} queue
 * @property {GameEvent[]} events since the renderer last drained them
 */

// The generated terrain under a surface strip: sky rows to walk on, solid crust rows, home at x = 0.
/** @param {World} terrain @param {number} skyRows @param {number} crustRows */
export function withSurface(terrain, skyRows, crustRows) {
  const { w } = terrain
  const top = skyRows + crustRows
  const tiles = new Uint8Array(w * (terrain.h + top))
  tiles.fill(Tile.Sky, 0, skyRows * w)
  tiles.fill(Tile.Soft, skyRows * w, top * w)
  tiles.set(terrain.tiles, top * w)
  return { world: { w, h: terrain.h + top, tiles }, home: { x: 0, y: skyRows - 1 } }
}

/** @param {World} world @param {Cell} home @param {SimConfig} cfg @param {Table} table @returns {Game} */
export function createGame(world, home, cfg, table) {
  return {
    world,
    cfg,
    table,
    tick: 0,
    ch: { x: home.x, y: home.y, facing: 1 },
    home,
    run: null,
    step: null,
    pack: [],
    stash: { soft: 0, hard: 0, ore: 0, loot: 0 },
    dive: null,
    dives: [],
    queue: [],
    events: [],
  }
}

/** @param {Game} g @param {Command} cmd */
export function command(g, cmd) {
  g.queue.push(cmd)
}

/** @param {Game} g */
export function tick(g) {
  g.tick++
  for (const cmd of g.queue) {
    if (cmd.type === 'intent') {
      if (!g.dive) g.dive = newDive(g)
      if (cmd.dx) g.ch.facing = Math.sign(cmd.dx)
      g.run = { dx: cmd.dx, dy: cmd.dy, prev: null }
      abortDig(g)
    } else if (cmd.type === 'stop') {
      g.run = null
      abortDig(g)
    } else teleport(g)
  }
  g.queue.length = 0

  const s = g.step
  if (s) {
    s.t++
    if (s.t === s.digT) apply(g, s.action)
    if (s.t >= s.dur) arrive(g, s)
  }
  if (!g.step && g.run) next(g)
}

// A new intent or a stop cancels a dig in progress (the tile stays); a move in progress finishes,
// so the new intent starts at the next tile boundary.
/** @param {Game} g */
function abortDig(g) {
  if (g.step && g.step.t < g.step.digT) {
    g.step = null
    g.events.push({ type: 'abort' })
  }
}

/** @param {Game} g */
function next(g) {
  const run = /** @type {NonNullable<Game['run']>} */ (g.run)
  const { ch, cfg, world } = g
  const inv = {
    fits: (/** @type {number[]} */ tiles) => fits(g.pack, cfg.packSlots, tiles),
    buildable: rock(g.pack),
  }
  const action = interpret(g.table, world, ch, run.dx, run.dy, ch.facing, cfg, inv)
  const reason = run.prev ? stopReason(world, ch, run.prev, action, cfg) : action.kind === 'blocked' ? (action.reason ?? 'blocked') : null
  if (reason) {
    g.events.push({
      type: 'stop',
      reason,
      dx: run.dx,
      dy: run.dy,
      tried: reason === action.reason ? (action.tried ?? []) : [],
      rule: action.rule,
      next: (action.intended ?? action).kind, // what the run would have done next
    }) // a quiet stop tried nothing (D030)
    if (g.dive) g.dive.stops[reason] = (g.dive.stops[reason] ?? 0) + 1
    g.run = null
    return
  }

  let digT = action.builds.length * cfg.buildTicks
  for (const d of action.digs) digT += digTicks(cfg, d.tile)
  const moves = action.to.x !== ch.x || action.to.y !== ch.y
  const moveT = moves ? (action.kind === 'climb' ? cfg.climbTicks : cfg.walkTicks) + action.fall * cfg.fallTicks : 0
  g.step = { action, from: { x: ch.x, y: ch.y }, t: 0, digT, dur: Math.max(1, digT + moveT) }
  g.events.push({ type: 'step', action, fresh: !run.prev })
  run.prev = action
  if (digT === 0) apply(g, action)
}

/** @param {Game} g @param {Action} action */
function apply(g, action) {
  const { world } = g
  // ore and loot first: the room they were promised (ruleset.js) mustn't go to rock mined alongside
  for (const d of [...action.digs.filter((d) => valuable(d.tile)), ...action.digs.filter((d) => !valuable(d.tile))]) {
    world.tiles[d.y * world.w + d.x] = Tile.Open
    const kept = add(g.pack, g.cfg.packSlots, material(d.tile)) // rock with no room is dropped (D038)
    if (g.dive) g.dive.mined++
    g.events.push({ type: 'mined', x: d.x, y: d.y, tile: d.tile, kept })
  }
  for (const b of action.builds) {
    spendRock(g.pack)
    world.tiles[b.y * world.w + b.x] = b.tile ?? Tile.Built
    if (g.dive) g.dive.built++
    g.events.push({ type: 'built', x: b.x, y: b.y })
  }
}

/** @param {Game} g @param {Step} s */
function arrive(g, s) {
  g.ch.x = s.action.to.x
  g.ch.y = s.action.to.y
  if (g.dive) g.dive.depth = Math.max(g.dive.depth, g.ch.y - g.home.y)
  g.step = null
  if (s.home) teleport(g)
  else if (g.cfg.gravity && s.action.kind !== 'fall') fallIfLoose(g)
}

/** Ticks a deep fall waits at the bottom before the teleport: the charge animation (b1's long press, 700 ms). */
const HOME_HOLD_TICKS = 42

// Gravity (D035): nothing holds you (no floor below, no wall left or right) → fall straight down to
// the first floor. Deeper than harmlessDrop: land, then teleport home. The run ends either way.
/** @param {Game} g */
function fallIfLoose(g) {
  const { world, ch } = g
  const open = (/** @type {number} */ x, /** @type {number} */ y) => isOpen(tileAt(world, x, y))
  if (!open(ch.x, ch.y + 1) || !open(ch.x - 1, ch.y) || !open(ch.x + 1, ch.y)) return
  let d = 1
  while (open(ch.x, ch.y + d + 1)) d++
  const deep = d > g.cfg.harmlessDrop
  const reason = deep ? 'fallHome' : 'fell'
  /** @type {Action} */
  const action = { kind: 'fall', dx: 0, dy: 1, to: { x: ch.x, y: ch.y + d }, digs: [], builds: [], fall: d }
  g.events.push({ type: 'stop', reason, dx: 0, dy: 1, tried: [], next: 'fall' })
  if (g.dive) g.dive.stops[reason] = (g.dive.stops[reason] ?? 0) + 1
  g.run = null
  const hold = deep ? HOME_HOLD_TICKS : 0
  g.step = { action, from: { x: ch.x, y: ch.y }, t: 0, digT: 0, dur: Math.max(1, d * g.cfg.fallTicks) + hold, home: deep, hold }
  g.events.push({ type: 'step', action, fresh: false })
}

// Teleport home: the pack is counted into the stash and the dive is logged.
/** @param {Game} g */
function teleport(g) {
  const from = { x: g.ch.x, y: g.ch.y }
  const dive = g.dive
  if (dive) {
    dive.ticks = g.tick - dive.startTick
    for (const s of g.pack) if (s) dive.got[/** @type {keyof Stash} */ (MATERIAL_NAME[s.tile])] += s.n
    for (const [k, n] of Object.entries(dive.got)) g.stash[/** @type {keyof Stash} */ (k)] += n
    g.dives.push(dive)
  }
  g.pack = []
  g.dive = null
  g.run = null
  g.step = null
  g.ch.x = g.home.x
  g.ch.y = g.home.y
  g.events.push({ type: 'teleport', from, dive })
}

/** @param {Game} g @returns {Dive} */
function newDive(g) {
  return {
    n: g.dives.length + 1,
    startTick: g.tick,
    ticks: 0,
    got: { soft: 0, hard: 0, ore: 0, loot: 0 },
    depth: 0,
    mined: 0,
    built: 0,
    stops: {},
  }
}
