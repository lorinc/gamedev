// The dig game state and its fixed tick. Commands in (intent / stop / teleport), events out;
// renderers read state and events and never write them.

import { Tile } from '../gen/world.js'
import { digTicks, stopReason } from './rules.js'
import { interpret } from './ruleset.js'

/** @typedef {import('../gen/world.js').World} World */
/** @typedef {import('./rules.js').Action} Action */
/** @typedef {import('./rules.js').Cell} Cell */
/** @typedef {import('./rules.js').SimConfig} SimConfig */
/** @typedef {import('./ruleset.js').Table} Table */

/**
 * @typedef {{ type: 'intent', dx: number, dy: number } | { type: 'stop' } | { type: 'teleport' }} Command
 */

/**
 * @typedef {{ type: 'step', action: Action, fresh: boolean }
 *   | { type: 'mined', x: number, y: number, tile: number }
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
 */

/**
 * @typedef {object} Dive
 * @property {number} n
 * @property {number} startTick
 * @property {number} ticks
 * @property {number} ore
 * @property {number} loot
 * @property {number} depth deepest tile below home
 * @property {number} mined
 * @property {number} built
 * @property {Record<string, number>} stops
 */

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
 * @property {number[]} pack Tile.Ore / Tile.Loot items
 *   TODO (Lorinc, 2026-09-25 feedback on b1.2): the pack is too limiting for this game's scale.
 *   Collect all 4 materials (soft, hard, ore, loot), stacking 32 per slot: pack becomes
 *   slots of { tile, count }, a dig adds to a matching stack below 32 or opens a new slot.
 * @property {number} credit tiles we can still build from ore already spent
 * @property {{ ore: number, loot: number }} stash counted at home
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
    credit: 0,
    stash: { ore: 0, loot: 0 },
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
    free: cfg.packSlots - g.pack.length,
    buildable: g.credit + g.pack.filter((t) => t === Tile.Ore).length * cfg.tilesPerOre,
  }
  const action = interpret(g.table, world, ch, run.dx, run.dy, ch.facing, cfg, inv)
  const reason = run.prev
    ? stopReason(world, ch, run.prev, action, cfg)
    : action.kind === 'blocked'
      ? (action.reason ?? 'blocked')
      : null
  if (reason) {
    g.events.push({ type: 'stop', reason, dx: run.dx, dy: run.dy, tried: reason === action.reason ? (action.tried ?? []) : [], rule: action.rule,
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
  for (const d of action.digs) {
    world.tiles[d.y * world.w + d.x] = Tile.Open
    if (d.tile === Tile.Ore || d.tile === Tile.Loot) g.pack.push(d.tile)
    if (g.dive) g.dive.mined++
    g.events.push({ type: 'mined', x: d.x, y: d.y, tile: d.tile })
  }
  for (const b of action.builds) {
    if (g.credit === 0) {
      g.pack.splice(g.pack.indexOf(Tile.Ore), 1)
      g.credit = g.cfg.tilesPerOre
    }
    g.credit--
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
}

// Teleport home: the pack is counted into the stash and the dive is logged.
/** @param {Game} g */
function teleport(g) {
  const from = { x: g.ch.x, y: g.ch.y }
  const dive = g.dive
  if (dive) {
    dive.ticks = g.tick - dive.startTick
    dive.ore = g.pack.filter((t) => t === Tile.Ore).length
    dive.loot = g.pack.filter((t) => t === Tile.Loot).length
    g.stash.ore += dive.ore
    g.stash.loot += dive.loot
    g.dives.push(dive)
  }
  g.pack = []
  g.credit = 0
  g.dive = null
  g.run = null
  g.step = null
  g.ch.x = g.home.x
  g.ch.y = g.home.y
  g.events.push({ type: 'teleport', from, dive })
}

/** @param {Game} g @returns {Dive} */
function newDive(g) {
  return { n: g.dives.length + 1, startTick: g.tick, ticks: 0, ore: 0, loot: 0, depth: 0, mined: 0, built: 0, stops: {} }
}
