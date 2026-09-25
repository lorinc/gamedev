// b1.2's rules in code. The game now runs rulesets (ruleset.js + rules/*.json); resolve() stays as
// the reference rules/b1.2.json is checked against (ruleset.test.js). stopReason() is still live.
//
// What a swipe means where you stand: a pure truth table from (world, position, direction) to the
// next one-tile action, plus the stop rules that end a run of actions ("move until something changes").
// The character is 1 tile tall. It never falls: it stands (solid below) or clings (solid beside).

import { isOpen, Tile } from '../gen/world.js'

/** @typedef {import('../gen/world.js').World} World */

/** Outside the world: solid, never mined. */
export const BEDROCK = -1

/** @typedef {{ x: number, y: number }} Cell */
/** @typedef {{ x: number, y: number, tile: number }} Dug */

/**
 * @typedef {object} Action
 * @property {'walk' | 'mine' | 'build' | 'climb' | 'fall' | 'blocked'} kind `fall`: nothing held you (gravity)
 * @property {number} dx
 * @property {number} dy
 * @property {Cell} to where the character ends up (x wrapped)
 * @property {Dug[]} digs cells mined, in order
 * @property {(Cell & { tile?: number })[]} builds cells filled (with `tile`, Built if none)
 * @property {number} fall tiles dropped at the end (≤ harmlessDrop): stepping off a ledge, or letting go of a climb
 * @property {string} [reason] why it's blocked
 * @property {Cell[]} [tried] blocked for lack of stock (`noOre`, `packFull`): the cells it would have
 *   built or mined, so the view can show "I tried, can't do"
 * @property {{ intent: string, row: number }} [rule] the ruleset row that chose it (ruleset.js)
 * @property {Action} [intended] a `noOre` / `packFull` refusal: the action it would have been (D030)
 */

/**
 * @typedef {object} Rules which changes stop a run; blocked actions always stop
 * @property {boolean} wall walking reaches rock (or building reaches rock)
 * @property {boolean} open mining / building breaks into open space
 * @property {boolean} harder the next tile is slower to mine than the last
 * @property {boolean} loot the next tile is ore or loot
 * @property {boolean} junction a side passage opens (a shaft overhead, a cave beside a dig-down)
 */

/**
 * @typedef {object} SimConfig
 * @property {number} walkTicks per tile
 * @property {number} climbTicks per tile
 * @property {number} fallTicks per tile dropped
 * @property {number} buildTicks per tile built
 * @property {{ soft: number, hard: number, ore: number, loot: number, built: number }} digTicks per tile mined
 * @property {number} harmlessDrop deepest drop a swipe into a gap (or a climb that runs out of wall) will take
 * @property {number} packSlots
 * @property {number} tilesPerOre tiles built per ore spent
 * @property {boolean} [gravity] after each step, fall if nothing holds you (floor below, wall left or right); a fall deeper than harmlessDrop lands, then teleports home (D035)
 * @property {Rules} rules
 */

/** @typedef {{ free: number, buildable: number }} Inventory free pack slots, tiles we can afford to build */

/** @param {World} world @param {number} x @param {number} y @returns {number} */
export function tileAt(world, x, y) {
  if (y < 0 || y >= world.h) return BEDROCK
  return world.tiles[y * world.w + wrap(x, world.w)]
}

/** @param {number} x @param {number} w */
export function wrap(x, w) {
  return ((x % w) + w) % w
}

/** @param {number} t */
const minable = (t) => t !== BEDROCK && !isOpen(t)

/** @param {SimConfig} cfg @param {number} tile @returns {number} */
export function digTicks(cfg, tile) {
  if (tile === Tile.Hard) return cfg.digTicks.hard
  if (tile === Tile.Ore) return cfg.digTicks.ore
  if (tile === Tile.Loot) return cfg.digTicks.loot
  if (tile === Tile.Built) return cfg.digTicks.built
  return cfg.digTicks.soft
}

/**
 * @param {World} world
 * @param {Cell} at
 * @param {number} dx -1..1
 * @param {number} dy -1..1
 * @param {number} facing -1 or 1: the side a down-swipe climbs over at a ledge
 * @param {SimConfig} cfg
 * @param {Inventory} inv
 * @returns {Action}
 */
export function resolve(world, at, dx, dy, facing, cfg, inv) {
  const { x, y } = at
  /** @type {Dug[]} */
  const digs = []
  /** @type {Cell[]} */
  const builds = []
  /** @type {Map<number, boolean>} cells this action changes, keyed y * w + x → open afterwards */
  const changed = new Map()
  const key = (/** @type {number} */ cx, /** @type {number} */ cy) => cy * world.w + wrap(cx, world.w)

  /** @param {number} cx @param {number} cy */
  const open = (cx, cy) => {
    if (cy < 0 || cy >= world.h) return false
    return changed.get(key(cx, cy)) ?? isOpen(tileAt(world, cx, cy))
  }
  const standing = (/** @type {number} */ cx, /** @type {number} */ cy) => !open(cx, cy + 1)
  const clinging = (/** @type {number} */ cx, /** @type {number} */ cy) => !open(cx - 1, cy) || !open(cx + 1, cy)
  const supported = (/** @type {number} */ cx, /** @type {number} */ cy) => standing(cx, cy) || clinging(cx, cy)
  /** Floor within harmlessDrop below (cx, cy): tiles to drop, or -1. */
  const dropTo = (/** @type {number} */ cx, /** @type {number} */ cy) => {
    for (let d = 0; d <= cfg.harmlessDrop; d++) {
      if (!open(cx, cy + d)) return -1
      if (standing(cx, cy + d)) return d
    }
    return -1
  }
  /** Mines (cx, cy) if it's rock. False if it's bedrock. */
  const dig = (/** @type {number} */ cx, /** @type {number} */ cy) => {
    if (open(cx, cy)) return true
    const tile = tileAt(world, cx, cy)
    if (!minable(tile)) return false
    digs.push({ x: wrap(cx, world.w), y: cy, tile })
    changed.set(key(cx, cy), true)
    return true
  }
  const build = (/** @type {number} */ cx, /** @type {number} */ cy) => {
    builds.push({ x: wrap(cx, world.w), y: cy })
    changed.set(key(cx, cy), false)
  }
  /** @param {'walk' | 'climb'} base @param {number} tx @param {number} ty @returns {Action} */
  const done = (base, tx, ty, fall = 0) => {
    const kind = builds.length ? 'build' : digs.length ? 'mine' : base
    const to = { x: wrap(tx, world.w), y: ty + fall }
    const loot = digs.filter((d) => d.tile === Tile.Ore || d.tile === Tile.Loot).length
    const lootCells = digs.filter((d) => d.tile === Tile.Ore || d.tile === Tile.Loot).map(({ x, y }) => ({ x, y }))
    if (loot > inv.free) return { ...blocked('packFull'), tried: lootCells }
    if (builds.length > inv.buildable) return { ...blocked('noOre'), tried: builds }
    return { kind, dx, dy, to, digs, builds, fall }
  }
  /** @param {string} reason @returns {Action} */
  const blocked = (reason) => ({ kind: 'blocked', dx, dy, to: { x, y }, digs: [], builds: [], fall: 0, reason })
  const onFloor = standing(x, y)

  // Straight up: only the Ghost climbs; everyone else builds diagonally.
  if (dx === 0 && dy < 0) return blocked('up')

  if (dy === 0) {
    const nx = x + dx
    if (open(nx, y)) {
      if (standing(nx, y)) return done('walk', nx, y)
      if (onFloor && open(nx, y + 1) && standing(nx, y + 1)) return done('walk', nx, y + 1) // 1-tile step down
      // A deeper gap: step off and drop if the floor is within harmlessDrop. A moving run always
      // stops before it (see stopReason); only a fresh swipe into the gap takes the drop.
      const d = onFloor ? dropTo(nx, y) : -1
      return d > 0 ? done('walk', nx, y, d) : blocked('ledge')
    }
    if (onFloor && open(nx, y - 1) && open(x, y - 1)) return done('walk', nx, y - 1) // 1-tile step up
    // Mine first, then look: step in only if the new cell has a floor (or a 1-tile step down to one).
    // Otherwise stay put at the edge: a tunnel never walks you into a chasm.
    if (!dig(nx, y)) return blocked('bedrock')
    if (standing(nx, y)) return done('walk', nx, y)
    if (onFloor && open(nx, y + 1) && standing(nx, y + 1)) return done('walk', nx, y + 1)
    return done('walk', x, y)
  }

  if (dx === 0) {
    // Down never digs (the way down is a diagonal staircase). At a ledge on the facing side:
    // climb over it. Clinging: climb on.
    if (onFloor) {
      const fx = x + facing
      if (open(fx, y) && open(fx, y + 1) && !standing(fx, y + 1)) return done('climb', fx, y + 1)
      return blocked('down')
    }
    if (supported(x, y + 1)) return done('climb', x, y + 1)
    // The wall we cling to recedes: follow it one step in (a 45° overhang), no further.
    const side = !open(x - 1, y) ? -1 : 1
    if (open(x + side, y + 1) && supported(x + side, y + 1)) return done('climb', x + side, y + 1)
    const d = dropTo(x, y + 1)
    if (d >= 0) return done('climb', x, y + 1, d)
    return blocked('overhang')
  }

  // Diagonals: the tile decides. Rock is mined, air is built: a 1-tile staircase.
  if (!onFloor) return blocked('noFooting')
  const tx = x + dx
  const ty = y + dy
  if (dy < 0) {
    // Up: clear the headroom above us and the target, stand on the step below the target.
    if (!dig(x, y - 1) || !dig(tx, ty)) return blocked('bedrock')
    if (open(tx, y)) build(tx, y)
    return done('walk', tx, ty)
  }
  // Down: clear the cell beside us, then mine the target or, if it's air, build a floor under it.
  if (!dig(tx, y)) return blocked('bedrock')
  if (!open(tx, ty)) {
    if (!dig(tx, ty)) return blocked('bedrock')
    return standing(tx, ty) ? done('walk', tx, ty) : done('walk', x, y) // mine first, step only onto a floor
  }
  if (!standing(tx, ty)) {
    if (ty + 1 >= world.h) return blocked('bedrock')
    build(tx, ty + 1)
  }
  return done('walk', tx, ty)
}

/**
 * Why the run stops before `next`, given the action it just finished, or null to carry on.
 * @param {World} world
 * @param {Cell} at
 * @param {Action} prev
 * @param {Action} next
 * @param {SimConfig} cfg
 * @returns {string | null}
 */
export function stopReason(world, at, prev, next, cfg) {
  const { rules } = cfg
  const landed = prev.kind === 'climb' && next.kind !== 'climb' && !isOpen(tileAt(world, at.x, at.y + 1))
  if (landed) return 'floor'
  if (next.kind === 'blocked') {
    // D030: a refusal for lack of ore or pack room only speaks when the run would really have done
    // it. If the stop rules would have ended the run here anyway, it stops quietly for that reason.
    const anyway = next.intended && stopReason(world, at, prev, next.intended, cfg)
    return anyway || (next.reason ?? 'blocked')
  }
  if (next.kind === 'walk' && next.fall > 0) return 'ledge' // never walk off an edge unasked
  if (next.kind !== prev.kind) {
    const reason = next.kind === 'mine' ? 'wall' : 'open'
    if (rules[reason]) return reason
  }
  if (next.kind === 'mine') {
    if (rules.loot && next.digs.some((d) => d.tile === Tile.Ore || d.tile === Tile.Loot)) return 'loot'
    const hardness = (/** @type {Action} */ a) => Math.max(0, ...a.digs.map((d) => digTicks(cfg, d.tile)))
    if (rules.harder && prev.kind === 'mine' && hardness(next) > hardness(prev)) return 'harder'
  }
  if (rules.junction && (next.kind === 'walk' || next.kind === 'mine') && junction(world, at, next)) return 'junction'
  return null
}

// A new side passage: walking or tunnelling sideways under a shaft (2+ open overhead, rock on both
// sides of it: a real passage, not the ceiling of an open cave), or digging down past a cave
// opening beside the shaft.
/** @param {World} world @param {Cell} at @param {Action} next */
function junction(world, at, next) {
  const open = (/** @type {number} */ x, /** @type {number} */ y) => isOpen(tileAt(world, x, y))
  const { x, y } = at
  const { x: tx, y: ty } = next.to
  if (next.dy === 0) {
    const shaft = (/** @type {number} */ cx, /** @type {number} */ cy) =>
      open(cx, cy - 1) && open(cx, cy - 2) && !open(cx - 1, cy - 1) && !open(cx + 1, cy - 1)
    return shaft(tx, ty) && !shaft(x, y)
  }
  if (next.dx === 0) {
    const side = (/** @type {number} */ cx, /** @type {number} */ cy) => open(cx - 1, cy) || open(cx + 1, cy)
    return side(tx, ty) && !side(x, y)
  }
  return false
}
