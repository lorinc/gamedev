// The dig game state and its fixed tick. Commands in (intent / hold / release / stop / teleport),
// events out; renderers read state and events and never write them.
//
// Flick and hold (D046): an intent comes while the finger (or key) is still down. The input says
// `hold` when it's still down 0.3 s after the swipe (or the swipe came after 0.3 s down: `held`),
// and `release` when it lets go. Until one of them comes, the run is undecided: it takes the steps
// a flick and a hold agree on, and waits where they differ. A flick follows the world and goes on
// after the release; a held run goes straight, pauses after every step, and ends on the release.
//
// Light and seen (D051, D052), only when the config has `light`: at the end of a tick in which your
// cell, the pack's light radius or the world changed, the lit cells are recomputed (light.js), and
// every lit cell becomes seen for good. Without `light` (every b1 ruleset) none of it runs.
//
// The seismic probe (D053), when a ruleset's row does `probe` (b2.1: ↓ on a floor): you stand still
// while rings spread from your cell, one every ringTicks, each revealed for good (probe.js). A flick
// grows to its reach (light radius + flick) and ends; a hold grows on past it while the swipe is still
// held or undecided, up to radius + hold, and a release ends it at the ring it's on. Nothing cuts a
// probe short: a tap or a new swipe waits for it to end (the new swipe then runs); only a teleport
// ends it at once. The run ends with the probe (stop `probe`), so a flick doesn't probe again.
// A row's meaning can centre the probe on another cell (D055, b3.1: the block under you for ↓, the
// ceiling for ↑); the reach stays the same.
//
// Without the teleport (D055, `teleport: false`): the command does nothing, a deep fall just lands, and
// stepping onto the home cell with something in the pack counts it in (event `home`).
//
// Moon bugs (D056, D059, D060), only when the config has `bugs`: bugs.js, each tick before the light (a
// nibble changes the pack). A probe ring scares the wild bugs it passes. The command `place` (the 1 s
// hold) places the bug bar's first bug. Bar and placed bugs light around themselves like you do.

import { isFloor, isOpen, Tile } from '../gen/world.js'
import { digTicks, stopReason, tileAt } from './rules.js'
import { add, fits, MATERIAL_NAME, material, rock, spendRock, valuable } from './pack.js'
import { interpret } from './ruleset.js'
import { litCells, lightRadius, surfaceCells } from './light.js'
import { PROBE, probeReach, ringCells } from './probe.js'
import { bugGlows, place, scare, updateBugs } from './bugs.js'

/** @typedef {import('../gen/world.js').World} World */
/** @typedef {import('./rules.js').Action} Action */
/** @typedef {import('./rules.js').Cell} Cell */
/** @typedef {import('./rules.js').SimConfig} SimConfig */
/** @typedef {import('./ruleset.js').Table} Table */
/** @typedef {import('./pack.js').Pack} Pack */

/**
 * @typedef {{ type: 'intent', dx: number, dy: number, held?: boolean } | { type: 'hold' } | { type: 'release' }
 *   | { type: 'stop' } | { type: 'teleport' } | { type: 'place' }} Command held: the finger was already down 0.3 s
 *   (hold+swipe); place: the bug bar's first bug into the world (D060)
 */

/**
 * @typedef {{ type: 'step', action: Action, fresh: boolean }
 *   | { type: 'mined', x: number, y: number, tile: number, kept: boolean }
 *   | { type: 'built', x: number, y: number }
 *   | { type: 'stop', reason: string, dx: number, dy: number, tried: Cell[], rule?: Action['rule'], next: Action['kind'] }
 *   | { type: 'abort' }
 *   | { type: 'teleport', from: Cell, dive: Dive | null }
 *   | { type: 'home', dive: Dive | null }
 *   | { type: 'seen', cells: number[] }
 *   | { type: 'ring', x: number, y: number, r: number }
 *   | { type: 'nibble', id: number, x: number, y: number, from: Cell }
 *   | { type: 'tamed', id: number, x: number, y: number, slot: number }
 *   | { type: 'placed', id: number, x: number, y: number }} GameEvent seen: cells (y * w + x) seen for the first time, for a renderer's
 *   texture; ring: the probe from (x, y) reached ring r (D053); nibble: wild bug `id` at (x, y) ate an ore from the pack,
 *   carried from `from` (D056); tamed: the shared count reached `tame` with its bite, and it's in the bug bar's
 *   `slot` (D060); placed: the bar's first bug is at its den (x, y)
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
 * @typedef {object} ProbeState a seismic probe in progress (D053)
 * @property {number} x
 * @property {number} y the cell it spreads from
 * @property {number} r the ring it has reached (1 on its first tick)
 * @property {number} min the rings it always reaches: the light's radius at its start + flick
 * @property {number} max the rings a hold can reach: radius + hold
 * @property {number} t ticks since it started (ring r came at (r - 1) * ringTicks)
 * @property {boolean | null} held its swipe is held; false once let go (or a new swipe came), null until the input knows
 * @property {NonNullable<Game['run']>} run the run that started it: it ends with the probe, unless a newer command replaced it
 */

/**
 * @typedef {object} Game
 * @property {World} world
 * @property {SimConfig} cfg read every tick, so the dev panel can change it live
 * @property {Table} table what a swipe means where you stand (a compiled ruleset)
 * @property {number} tick
 * @property {{ x: number, y: number, facing: number }} ch
 * @property {Cell} home
 * @property {{ dx: number, dy: number, prev: Action | null, held: boolean | null, rest: number } | null} run the current intent.
 *   held: a hold or a flick, null until the input knows (D046); rest: ticks a held run still pauses before its next step
 * @property {Step | null} step
 * @property {Pack} pack every material mined, in slots (pack.js)
 * @property {Stash} stash counted at home
 * @property {Dive | null} dive
 * @property {Dive[]} dives
 * @property {Command[]} queue
 * @property {GameEvent[]} events since the renderer last drained them
 * @property {Uint8Array | null} seen per cell (y * w + x), 1 = seen for good (D052); null without `cfg.light`
 * @property {number[]} lit cells (y * w + x) lit now, sorted, the surface included; a new array whenever it changes
 * @property {number} radius the light's radius now, in tiles (0 without `cfg.light`)
 * @property {number[]} surface the cells always lit: the sky and the ground's top faces, as at the start
 * @property {{ x: number, y: number, r: number, glows: string }} litFor what `lit` was computed for; r = -1 after the
 *   world changed; glows: the bugs' light cells (D060)
 * @property {ProbeState | null} probe the seismic probe in progress (D053); you don't move while it's there
 * @property {import('./bugs.js').Bug[]} bugs wild and tamed (D056); none without `cfg.bugs`
 * @property {number} nextBug the next bug's id
 * @property {import('./bugs.js').Field | null} bugField the bugs' way to you, cached
 * @property {number} worldRev counts the ticks that mined or built something
 * @property {number} fed ore the wild bugs ate toward the next taming, all of them together (D060)
 * @property {import('./bugs.js').Bug[]} bar the tamed bugs you carry, in slot order (D060)
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
  /** @type {Game} */
  const g = {
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
    seen: null,
    lit: [],
    radius: 0,
    surface: [],
    litFor: { x: home.x, y: home.y, r: -1, glows: '' },
    probe: null,
    bugs: [],
    nextBug: 1,
    bugField: null,
    worldRev: 0,
    fed: 0,
    bar: [],
  }
  if (cfg.light) {
    g.seen = new Uint8Array(world.w * world.h)
    g.surface = surfaceCells(world)
    reveal(g, g.surface)
    updateLight(g)
  }
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
    if (cmd.type === 'intent') {
      if (!g.dive) g.dive = newDive(g)
      if (cmd.dx) g.ch.facing = Math.sign(cmd.dx)
      g.run = { dx: cmd.dx, dy: cmd.dy, prev: null, held: cmd.held ? true : null, rest: 0 }
      abortDig(g)
      if (g.probe) g.probe.held = false // the new swipe has the input now; it runs once the probe ends
    } else if (cmd.type === 'hold') {
      if (g.run && g.run.held === null) g.run.held = true
      if (g.probe && g.probe.held === null) g.probe.held = true
    } else if (cmd.type === 'release') {
      if (g.probe) g.probe.held = false // it ends at the ring it's on, never short of min
      if (g.run?.held) {
        g.run = null // a hold ends on release: a move finishes, a dig or build in progress is cancelled
        abortDig(g)
      } else if (g.run) g.run.held = false // a flick: the run goes on
    } else if (cmd.type === 'stop') {
      g.run = null
      abortDig(g)
    } else if (cmd.type === 'place') place(g)
    else if (g.cfg.teleport !== false) teleport(g)
  }
  g.queue.length = 0

  const s = g.step
  if (s) {
    s.t++
    if (s.t === s.digT) apply(g, s.action)
    if (s.t >= s.dur) arrive(g, s)
  }
  if (g.probe) spread(g, g.probe)
  else if (!g.step && g.run) next(g)
  updateBugs(g)
  if (g.seen) updateLight(g)
}

// The probe's tick: each ring lasts ringTicks, then the next one comes, or the probe ends. Past min
// it grows only while its swipe is still held (or undecided), up to max.
/** @param {Game} g @param {ProbeState} p */
function spread(g, p) {
  p.t++
  const ringTicks = Math.max(1, (g.cfg.probe ?? PROBE).ringTicks)
  if (p.t < p.r * ringTicks) return
  if (p.r < p.min || (p.r < p.max && p.held !== false)) ring(g, p, p.r + 1)
  else endProbe(g, p)
}

/** Ring r reached: its cells are seen for good. @param {Game} g @param {ProbeState} p @param {number} r */
function ring(g, p, r) {
  p.r = r
  reveal(g, ringCells(g.world, p, r))
  scare(g, p, r)
  g.events.push({ type: 'ring', x: p.x, y: p.y, r })
}

// The probe's run ends with it (stop `probe`), also when a tap or a hold's release ended it already;
// a new swipe made during the probe runs now instead.
/** @param {Game} g @param {ProbeState} p */
function endProbe(g, p) {
  g.probe = null
  if (g.run && g.run !== p.run) return
  g.run = null
  g.events.push({ type: 'stop', reason: 'probe', dx: p.run.dx, dy: p.run.dy, tried: [], rule: p.run.prev?.rule, next: 'probe' })
  if (g.dive) g.dive.stops.probe = (g.dive.stops.probe ?? 0) + 1
}

// Recomputes the lit cells if your cell, the radius or the world changed since the last time.
/** @param {Game} g */
function updateLight(g) {
  if (!g.cfg.light) return
  const r = lightRadius(g.pack, g.cfg.light)
  const at = g.litFor
  const sources = bugGlows(g)
  const glows = sources.map((c) => `${c.x},${c.y}`).join(' ')
  if (at.x === g.ch.x && at.y === g.ch.y && at.r === r && at.glows === glows) return
  g.litFor = { x: g.ch.x, y: g.ch.y, r, glows }
  g.radius = r
  let cells = litCells(g.world, g.ch, r)
  for (const c of sources) cells = union(cells, litCells(g.world, c, /** @type {NonNullable<SimConfig['bugs']>} */ (g.cfg.bugs).light))
  g.lit = union(g.surface, cells)
  reveal(g, cells) // the surface was seen at the start
}

/**
 * Marks cells seen for good and emits one `seen` event with the ones seen for the first time.
 * The light uses it, and so will the probe (D053). A no-op without a seen map.
 * @param {Game} g @param {number[]} cells y * w + x
 * @returns {number[]} the newly seen cells
 */
export function reveal(g, cells) {
  const seen = g.seen
  if (!seen) return []
  /** @type {number[]} */
  const fresh = []
  for (const i of cells)
    if (!seen[i]) {
      seen[i] = 1
      fresh.push(i)
    }
  if (fresh.length) g.events.push({ type: 'seen', cells: fresh })
  return fresh
}

/** Two sorted lists of cells as one, sorted, without repeats. @param {number[]} a @param {number[]} b */
function union(a, b) {
  if (!a.length) return b
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

// A new intent or a stop cancels a dig in progress (the tile stays); a move in progress finishes,
// so the new intent starts at the next tile boundary.
/** @param {Game} g */
function abortDig(g) {
  if (g.step && g.step.t < g.step.digT) {
    g.step = null
    g.events.push({ type: 'abort' })
  }
}

/** A held run goes on until released: the stop switches are a flick's (D046). */
const NO_STOPS = { wall: false, open: false, loot: false, harder: false, junction: false, crossing: false }

/** @param {Game} g */
function next(g) {
  const run = /** @type {NonNullable<Game['run']>} */ (g.run)
  if (run.rest > 0) {
    run.rest--
    return
  }
  const { ch, cfg, world } = g
  const inv = {
    fits: (/** @type {number[]} */ tiles) => fits(g.pack, cfg.packSlots, tiles),
    buildable: rock(g.pack),
  }
  /** What the next step is as a flick or as a hold, and whether the run stops before it. @param {boolean} held */
  const plan = (held) => {
    const action = interpret(g.table, world, ch, run.dx, run.dy, ch.facing, cfg, inv, run.prev, held)
    const reason = run.prev
      ? stopReason(world, ch, run.prev, action, held ? { ...cfg, rules: NO_STOPS } : cfg)
      : action.kind === 'blocked'
        ? (action.reason ?? 'blocked')
        : null
    return { action, reason }
  }
  let p
  if (run.held === null) {
    p = plan(false)
    if (!sameOutcome(p, plan(true))) return // wait for the input to say hold or release
  } else p = plan(run.held)
  const { action, reason } = p
  if (!reason && action.kind === 'probe') {
    // you stay put: no step; the probe holds the run until it ends (D053)
    const radius = cfg.light ? lightRadius(g.pack, cfg.light) : 0
    const { min, max } = probeReach(radius, cfg.probe ?? PROBE)
    run.prev = action
    const at = action.at ?? ch // the probed block (D055), or your own cell (D053)
    g.probe = { x: at.x, y: at.y, r: 0, min, max, t: 0, held: run.held, run }
    ring(g, g.probe, 1)
    return
  }
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

/** A flick and a hold would do the same next (the rows that chose it may differ). */
/** @param {{ action: Action, reason: string | null }} a @param {{ action: Action, reason: string | null }} b */
function sameOutcome(a, b) {
  const key = (/** @type {Action} */ x) => JSON.stringify([x.kind, x.to, x.digs, x.builds, x.fall, x.reason])
  return a.reason === b.reason && key(a.action) === key(b.action)
}

/** @param {Game} g @param {Action} action */
function apply(g, action) {
  const { world } = g
  if (action.digs.length || action.builds.length) {
    g.litFor.r = -1 // the light spreads anew (D051)
    g.worldRev++
  }
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
  if (g.run?.held) g.run.rest = g.cfg.holdPauseTicks ?? 18 // a held run pauses after every step (D046)
  if (s.home) teleport(g)
  else if (g.cfg.gravity && s.action.kind !== 'fall') fallIfLoose(g)
  if (g.cfg.teleport === false && g.ch.x === g.home.x && g.ch.y === g.home.y) bank(g)
}

/** Ticks a deep fall waits at the bottom before the teleport: the charge ring's fill (b1's long press fills it in 700 ms). */
const HOME_HOLD_TICKS = 42

// Gravity (D035): nothing holds you (no floor below, no wall left or right) → fall straight down to
// the first floor. Deeper than harmlessDrop: land, then teleport home. The run ends either way.
/** @param {Game} g */
function fallIfLoose(g) {
  const { world, ch } = g
  const open = (/** @type {number} */ x, /** @type {number} */ y) => isOpen(tileAt(world, x, y))
  const floor = (/** @type {number} */ x, /** @type {number} */ y) => isFloor(tileAt(world, x, y)) // a plank holds you (D039)
  if (floor(ch.x, ch.y + 1) || !open(ch.x - 1, ch.y) || !open(ch.x + 1, ch.y)) return
  let d = 1
  while (!floor(ch.x, ch.y + d + 1)) d++
  const deep = d > g.cfg.harmlessDrop && g.cfg.teleport !== false // without the teleport, it just lands (D055)
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
  const dive = endDive(g)
  g.run = null
  g.step = null
  g.probe = null // the one thing that ends a probe at once
  g.ch.x = g.home.x
  g.ch.y = g.home.y
  g.events.push({ type: 'teleport', from, dive })
}

// Walked home (D055, without the teleport): the same count and log, and the run goes on. Only a dive
// that brought something ends here, so walking past home on the surface doesn't log empty dives.
/** @param {Game} g */
function bank(g) {
  if (!g.dive || !g.pack.some(Boolean)) return
  g.events.push({ type: 'home', dive: endDive(g) })
}

// The pack counted into the stash, the dive logged; the pack is empty after.
/** @param {Game} g */
function endDive(g) {
  const dive = g.dive
  if (dive) {
    dive.ticks = g.tick - dive.startTick
    for (const s of g.pack) if (s) dive.got[/** @type {keyof Stash} */ (MATERIAL_NAME[s.tile])] += s.n
    for (const [k, n] of Object.entries(dive.got)) g.stash[/** @type {keyof Stash} */ (k)] += n
    g.dives.push(dive)
  }
  g.pack = []
  g.dive = null
  return dive
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
