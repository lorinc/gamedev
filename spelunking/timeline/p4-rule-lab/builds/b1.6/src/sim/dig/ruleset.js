// What a swipe means where you stand, as data. The vocabulary is code: intents (the swipe
// directions, mirrored), conditions (facts about the cells around you, relative to the swipe),
// meanings (the one-tile actions) and refusal signals. A ruleset (rules/*.json) combines it:
// named situations (all-of conditions, `!` negates), then per intent an ordered first-match table
// of situation → meaning. The swipe comes first because "ahead" means the swipe's side.

import { isFloor, isOpen, Tile } from '../gen/world.js'
import { BEDROCK, tileAt, wrap } from './rules.js'

/** @typedef {import('../gen/world.js').World} World */
/** @typedef {import('./rules.js').Action} Action */
/** @typedef {import('./rules.js').Cell} Cell */
/** @typedef {import('./rules.js').Dug} Dug */
/** @typedef {import('./rules.js').SimConfig} SimConfig */
/** @typedef {import('./rules.js').Inventory} Inventory */

export const RULESET_FORMAT = 'spelunking-ruleset'
export const RULESET_VERSION = 1

// Stairs are planks (D039): a tread along the top of an open cell. You stand on it from the cell
// above, or walk through its cell under it; `open` is true for it and `standing` counts it as floor.
// TODO (nice to have, Lorinc 2026-09-25): visual order for tidy players. A plank over a hole works,
// but doesn't look fixed: a way to put rock back (a solid fill), and to take a plank away.
/** @typedef {'side' | 'down' | 'up' | 'upSide' | 'downSide'} Intent */

/** @type {Record<Intent, string>} */
export const INTENTS = { side: '← →', down: '↓', up: '↑', upSide: '↗ ↖', downSide: '↘ ↙' }

/** @param {number} dx @param {number} dy @returns {Intent} */
export function intentOf(dx, dy) {
  if (dy === 0) return 'side'
  if (dx === 0) return dy > 0 ? 'down' : 'up'
  return dy > 0 ? 'downSide' : 'upSide'
}

/**
 * The cells around you before the action, seen along the swipe: f is its side (±1), or for ↓ ↑
 * the side you face.
 * @typedef {object} View
 * @property {number} x
 * @property {number} y
 * @property {number} f
 * @property {(x: number, y: number) => boolean} open you can be there: air, or a plank's cell
 * @property {(x: number, y: number) => boolean} standing a floor under (x, y): rock, or a plank's tread
 * @property {(x: number, y: number) => boolean} plank (x, y) holds a plank
 * @property {(x: number, y: number) => boolean} supported standing, or solid on either side
 * @property {(x: number, y: number) => number} dropTo tiles to a floor within harmlessDrop below (x, y), or -1
 * @property {boolean} fresh the swipe's first step (a fresh swipe is literal; a run follows the terrain)
 * @property {boolean} mining the run's last step mined
 */

/** The side of the wall you cling to (left first). @param {View} v */
const wallSide = (v) => (!v.open(v.x - 1, v.y) ? -1 : 1)

/** @type {Record<string, { text: string, test: (v: View) => boolean }>} */
// The texts also render closed entries' "Rules at close" (timeline.js): keep them true for older
// rulesets. "solid" includes a plank's tread (D039).
export const CONDITIONS = {
  standing: { text: 'solid under you', test: (v) => v.standing(v.x, v.y) },
  aboveOpen: { text: 'open above you', test: (v) => v.open(v.x, v.y - 1) },
  fwdOpen: { text: 'the cell ahead is open', test: (v) => v.open(v.x + v.f, v.y) },
  fwdFloor: { text: 'solid under the cell ahead', test: (v) => v.standing(v.x + v.f, v.y) },
  fwdAboveOpen: { text: 'open above the cell ahead', test: (v) => v.open(v.x + v.f, v.y - 1) },
  fwdBelowOpen: { text: 'open below the cell ahead', test: (v) => v.open(v.x + v.f, v.y + 1) },
  fwdBelowFloor: { text: 'solid 2 below the cell ahead', test: (v) => v.standing(v.x + v.f, v.y + 1) },
  fwdDrop: { text: 'a floor within harmlessDrop below the cell ahead', test: (v) => v.dropTo(v.x + v.f, v.y) >= 0 },
  belowClimbable: {
    text: 'open below you, and it has a floor or a wall',
    test: (v) => v.open(v.x, v.y + 1) && v.supported(v.x, v.y + 1),
  },
  overhangStep: {
    text: 'the wall you cling to recedes by one: open, supported cell diagonally down into it',
    test: (v) => v.open(v.x + wallSide(v), v.y + 1) && v.supported(v.x + wallSide(v), v.y + 1),
  },
  belowDrop: { text: 'a floor within harmlessDrop below you', test: (v) => v.dropTo(v.x, v.y + 1) >= 0 },
  upAheadOpen: { text: 'the cell diagonally up ahead is open', test: (v) => v.open(v.x + v.f, v.y - 1) },
  upAheadFloor: { text: 'a floor under the cell diagonally up ahead', test: (v) => v.standing(v.x + v.f, v.y - 1) },
  onPlank: { text: 'you stand on a plank', test: (v) => v.plank(v.x, v.y + 1) },
  fwdPlank: { text: 'the cell ahead holds a plank', test: (v) => v.plank(v.x + v.f, v.y) },
  inPlank: { text: 'your cell holds a plank (its tread just above your head)', test: (v) => v.plank(v.x, v.y) },
  fresh: { text: "the swipe's first step", test: (v) => v.fresh },
  mining: { text: "the run's last step mined", test: (v) => v.mining },
}

/** What `place` can put down. */
/** @type {Record<string, number>} */
export const PLACEABLE = { built: Tile.Built, plank: Tile.Plank }

/**
 * A meaning runs after its row matched. It may still refuse (bedrock, or its own `reasons`);
 * any meaning refuses with `noRock` / `packFull` when it builds more than the pack's rock or mines ore / loot it has no room for.
 * @typedef {View & {
 *   dig: (x: number, y: number) => boolean,
 *   build: (x: number, y: number, tile: number) => void,
 *   done: (base: 'walk' | 'climb', x: number, y: number, fall?: number) => Action,
 *   blocked: (reason: string) => Action,
 *   h: number,
 *   row: { reason?: string, place?: string },
 * }} Act
 */

/** @type {Record<string, { text: string, param?: 'reason' | 'place', reasons?: string[], run: (a: Act) => Action }>} */
export const MEANINGS = {
  walk: { text: 'walk into the cell ahead', run: (a) => a.done('walk', a.x + a.f, a.y) },
  stepDown: { text: 'step down 1 ahead', run: (a) => a.done('walk', a.x + a.f, a.y + 1) },
  stepUp: { text: 'step up 1 ahead', run: (a) => a.done('walk', a.x + a.f, a.y - 1) },
  dropOff: {
    text: 'step off ahead and drop to the floor',
    reasons: ['ledge'],
    run: (a) => {
      const d = a.dropTo(a.x + a.f, a.y)
      return d >= 0 ? a.done('walk', a.x + a.f, a.y, d) : a.blocked('ledge')
    },
  },
  tunnel: {
    text: 'mine the cell ahead; step in only onto a floor or a 1-step down (mine first, then look)',
    run: (a) => {
      const { x, y, f } = a
      const onFloor = a.standing(x, y)
      if (!a.dig(x + f, y)) return a.blocked('bedrock')
      if (a.standing(x + f, y)) return a.done('walk', x + f, y)
      if (onFloor && a.open(x + f, y + 1) && a.standing(x + f, y + 1)) return a.done('walk', x + f, y + 1)
      return a.done('walk', x, y)
    },
  },
  climbOver: { text: 'climb down over the ledge ahead', run: (a) => a.done('climb', a.x + a.f, a.y + 1) },
  climbDown: { text: 'climb down 1', run: (a) => a.done('climb', a.x, a.y + 1) },
  followOverhang: {
    text: 'climb diagonally down into the receding wall (45°)',
    reasons: ['overhang'],
    run: (a) => {
      const s = wallSide(a)
      if (a.open(a.x + s, a.y + 1) && a.supported(a.x + s, a.y + 1)) return a.done('climb', a.x + s, a.y + 1)
      return a.blocked('overhang')
    },
  },
  climbDrop: {
    text: 'let go and drop to the floor below',
    reasons: ['overhang'],
    run: (a) => {
      const d = a.dropTo(a.x, a.y + 1)
      return d >= 0 ? a.done('climb', a.x, a.y + 1, d) : a.blocked('overhang')
    },
  },
  stairUp: {
    text: 'mine your headroom and the target, place a step under the target if it has no floor, walk up',
    param: 'place',
    run: (a) => {
      const { x, y, f } = a
      if (!a.dig(x, y - 1) || !a.dig(x + f, y - 1)) return a.blocked('bedrock')
      if (!a.standing(x + f, y - 1)) a.build(x + f, y, PLACEABLE[a.row.place ?? 'built'])
      return a.done('walk', x + f, y - 1)
    },
  },
  mineDown: {
    text: 'mine the cell beside you and the target; step only onto a floor',
    run: (a) => {
      const { x, y, f } = a
      if (!a.dig(x + f, y) || !a.dig(x + f, y + 1)) return a.blocked('bedrock')
      return a.standing(x + f, y + 1) ? a.done('walk', x + f, y + 1) : a.done('walk', x, y)
    },
  },
  buildDown: {
    text: 'mine the cell beside you, place a floor under the target if it has none, step down',
    param: 'place',
    run: (a) => {
      const { x, y, f } = a
      if (!a.dig(x + f, y)) return a.blocked('bedrock')
      if (!a.standing(x + f, y + 1)) {
        if (y + 2 >= a.h) return a.blocked('bedrock')
        a.build(x + f, y + 2, PLACEABLE[a.row.place ?? 'built'])
      }
      return a.done('walk', x + f, y + 1)
    },
  },
  mineUp: {
    text: 'mine the cell diagonally up ahead; step in only onto a floor',
    run: (a) => {
      const { x, y, f } = a
      if (!a.dig(x + f, y - 1)) return a.blocked('bedrock')
      return a.standing(x + f, y - 1) ? a.done('walk', x + f, y - 1) : a.done('walk', x, y)
    },
  },
  bridge: {
    text: 'place a floor under the cell ahead, walk onto it',
    param: 'place',
    run: (a) => {
      const { x, y, f } = a
      if (y + 1 >= a.h) return a.blocked('bedrock')
      a.build(x + f, y + 1, PLACEABLE[a.row.place ?? 'built'])
      return a.done('walk', x + f, y)
    },
  },
  mineAbove: {
    text: 'mine the cell above you; stay put',
    run: (a) => (a.dig(a.x, a.y - 1) ? a.done('walk', a.x, a.y) : a.blocked('bedrock')),
  },
  climbUp: { text: 'climb up 1 (onto the tread above your head)', run: (a) => a.done('climb', a.x, a.y - 1) },
  ladderUp: {
    text: 'place a step in your cell, climb up onto it',
    param: 'place',
    run: (a) => {
      a.build(a.x, a.y, PLACEABLE[a.row.place ?? 'built'])
      return a.done('climb', a.x, a.y - 1)
    },
  },
  ladderDown: {
    text: 'climb down 1 through the plank under you, placing a step under you if there is no floor',
    param: 'place',
    run: (a) => {
      const { x, y } = a
      if (!a.standing(x, y + 1)) {
        if (y + 2 >= a.h) return a.blocked('bedrock')
        a.build(x, y + 2, PLACEABLE[a.row.place ?? 'built'])
      }
      return a.done('climb', x, y + 1)
    },
  },
  refuse: { text: 'nothing: refuse with a reason', param: 'reason', run: (a) => a.blocked(a.row.reason ?? 'refused') },
}

/** The stop rules (rules.js stopReason): the switches a ruleset sets, then the ones always on. */
/** @type {Record<string, string>} */
export const STOPS = {
  wall: 'walking turns into mining (you reach rock)',
  open: 'the action changes to anything but mining: you break out of rock, or a walk turns into building',
  loot: 'the next tile to mine is ore or loot',
  harder: 'the next tile is slower to mine than the last',
  junction: 'walking or tunnelling under a real side passage: a shaft with rock on both sides (D024)',
  crossing: 'walking is about to step under a plank: a path you built crosses yours (D045)',
}
/** @type {Record<string, string>} */
export const ALWAYS_STOPS = {
  ledge: 'the next walk step would drop (only a fresh swipe steps off)',
  floor: 'a climb reaches the ground',
  fell: 'with gravity on: nothing holds you after a step, so you fall and land (up to harmlessDrop)',
  fallHome: 'with gravity on: a fall deeper than harmlessDrop; you land, then teleport home (D035)',
  confirm: "the next step's row asks first (confirm): the run stops, the same swipe again does it (D041)",
}

/** Reasons the engine gives on its own: no row matched, the world's edge, the pack. */
export const ENGINE_REASONS = ['noRule', 'bedrock', 'noRock', 'packFull']

/** How a refusal shows. `flash`: the cells it tried and the backpack flash red (D027). */
/** @type {Record<string, string>} */
export const SIGNALS = {
  none: 'the run just stops; a swipe that asked for it gets a red swipe cue',
  flash: 'shown even mid-run: the swipe cue and the backpack flash red',
}

/**
 * @typedef {{ if: string, do: string, reason?: string, place?: string, confirm?: boolean }} Row confirm: ask before doing it (D041)
 * @typedef {object} Ruleset
 * @property {string} format
 * @property {number} version
 * @property {string} name
 * @property {string} [note]
 * @property {{ swipePx: number, horizontalDeg: number, verticalDeg: number }} swipes gesture → intent
 * @property {Record<string, string[]>} situations all-of conditions, `!` negates
 * @property {Record<Intent, Row[]>} table
 * @property {Record<string, string>} reasons reason → signal
 * @property {import('./rules.js').Rules} stops
 * @property {Omit<SimConfig, 'rules'>} numbers
 */

/**
 * @typedef {{ intent: Intent, row: number, tests: { test: (v: View) => boolean, want: boolean }[], meaning: typeof MEANINGS[string], data: Row }} CompiledRow
 * @typedef {{ name: string, rows: Record<Intent, CompiledRow[]>, signals: Record<string, string> }} Table
 */

/**
 * Older rulesets, brought up to date. Before b1.5, building was paid in ore (numbers.tilesPerOre,
 * refusal `noOre`) and the pack held 4 single items; now it's rock, and 6 slots of 16 (D038).
 * @param {any} r @returns {Ruleset}
 */
export function migrate(r) {
  if (r.numbers && 'tilesPerOre' in r.numbers) {
    delete r.numbers.tilesPerOre
    r.numbers.packSlots = 6
  }
  if (r.reasons && 'noOre' in r.reasons) {
    r.reasons.noRock = r.reasons.noOre
    delete r.reasons.noOre
  }
  return r
}

/**
 * Checks every id the ruleset refers to and compiles its table. Problems come back as text, so
 * the editor can list them; `table` is null when there are any.
 * @param {Ruleset} r
 * @returns {{ table: Table | null, errors: string[] }}
 */
export function compile(r) {
  /** @type {string[]} */
  const errors = []
  if (r.format !== RULESET_FORMAT) errors.push(`format: expected "${RULESET_FORMAT}"`)
  if (r.version !== RULESET_VERSION) errors.push(`version: expected ${RULESET_VERSION}`)
  for (const [name, conds] of Object.entries(r.situations ?? {}))
    for (const c of conds) if (!CONDITIONS[c.replace(/^!/, '')]) errors.push(`situation ${name}: unknown condition "${c}"`)

  const reasons = new Set(ENGINE_REASONS)
  /** @type {Record<string, CompiledRow[]>} */
  const rows = {}
  for (const intent of /** @type {Intent[]} */ (Object.keys(INTENTS))) {
    rows[intent] = []
    const list = r.table?.[intent]
    if (!Array.isArray(list)) {
      errors.push(`table: no rows for ${intent}`)
      continue
    }
    list.forEach((row, i) => {
      const where = `table ${intent} row ${i + 1}`
      const conds = r.situations?.[row.if]
      const meaning = MEANINGS[row.do]
      if (!conds) errors.push(`${where}: unknown situation "${row.if}"`)
      if (!meaning) errors.push(`${where}: unknown meaning "${row.do}"`)
      if (!conds || !meaning) return
      if (meaning.param === 'reason') {
        if (!row.reason) errors.push(`${where}: ${row.do} needs a reason`)
        else reasons.add(row.reason)
      }
      if (meaning.param === 'place' && row.place && !(row.place in PLACEABLE)) errors.push(`${where}: can't place "${row.place}"`)
      if (row.confirm !== undefined && typeof row.confirm !== 'boolean') errors.push(`${where}: confirm is true or false`)
      for (const x of meaning.reasons ?? []) reasons.add(x)
      const tests = conds.map((c) => ({ test: CONDITIONS[c.replace(/^!/, '')]?.test, want: !c.startsWith('!') }))
      if (tests.some((t) => !t.test)) return
      rows[intent].push({
        intent,
        row: i,
        tests: /** @type {CompiledRow['tests']} */ (tests),
        meaning,
        data: row,
      })
    })
  }
  for (const reason of reasons) {
    const signal = r.reasons?.[reason]
    if (!signal) errors.push(`reasons: "${reason}" has no signal`)
    else if (!(signal in SIGNALS)) errors.push(`reasons: "${reason}" has an unknown signal "${signal}"`)
  }
  if (errors.length) return { table: null, errors }
  return { table: { name: r.name, rows: /** @type {Table['rows']} */ (rows), signals: { ...r.reasons } }, errors }
}

/** The sim config a ruleset carries: its numbers and stop switches. @param {Ruleset} r @returns {SimConfig} */
export function simConfig(r) {
  return { ...JSON.parse(JSON.stringify(r.numbers)), rules: { ...r.stops } } // a deep copy; structuredClone is iOS 15.4+ (R14)
}

/**
 * The next one-tile action for a swipe, from the table's first matching row.
 * @param {Table} table
 * @param {World} world
 * @param {Cell} at
 * @param {number} dx -1..1
 * @param {number} dy -1..1
 * @param {number} facing -1 or 1: the side ↓ and ↑ look at
 * @param {SimConfig} cfg
 * @param {Inventory} inv
 * @param {Action | null} [prev] the run's last step; null on a fresh swipe
 * @returns {Action}
 */
export function interpret(table, world, at, dx, dy, facing, cfg, inv, prev = null) {
  const { x, y } = at
  /** @type {Dug[]} */
  const digs = []
  /** @type {{ x: number, y: number, tile: number }[]} */
  const builds = []
  /** @type {Map<number, number>} cells this action changes, keyed y * w + x → the tile afterwards */
  const changed = new Map()
  const key = (/** @type {number} */ cx, /** @type {number} */ cy) => cy * world.w + wrap(cx, world.w)
  /** @param {number} cx @param {number} cy */
  const tile = (cx, cy) => (cy < 0 || cy >= world.h ? BEDROCK : (changed.get(key(cx, cy)) ?? tileAt(world, cx, cy)))

  const open = (/** @type {number} */ cx, /** @type {number} */ cy) => isOpen(tile(cx, cy))
  const plank = (/** @type {number} */ cx, /** @type {number} */ cy) => tile(cx, cy) === Tile.Plank
  const standing = (/** @type {number} */ cx, /** @type {number} */ cy) => isFloor(tile(cx, cy + 1))
  const clinging = (/** @type {number} */ cx, /** @type {number} */ cy) => !open(cx - 1, cy) || !open(cx + 1, cy)
  const supported = (/** @type {number} */ cx, /** @type {number} */ cy) => standing(cx, cy) || clinging(cx, cy)
  const dropTo = (/** @type {number} */ cx, /** @type {number} */ cy) => {
    for (let d = 0; d <= cfg.harmlessDrop; d++) {
      if (!open(cx, cy + d)) return -1
      if (standing(cx, cy + d)) return d
    }
    return -1
  }
  const f = dx ? Math.sign(dx) : facing
  /** @type {View} */
  const view = { x, y, f, open, standing, plank, supported, dropTo, fresh: !prev, mining: prev?.kind === 'mine' }

  const intent = intentOf(dx, dy)
  const match = table.rows[intent].find((r) => r.tests.every((t) => t.test(view) === t.want))
  const rule = match && { intent, row: match.row }

  /** @param {string} reason @returns {Action} */
  const blocked = (reason) => ({ kind: 'blocked', dx, dy, to: { x, y }, digs: [], builds: [], fall: 0, reason, rule })
  if (!match) return blocked('noRule')

  /** @type {Act} */
  const act = {
    ...view,
    h: world.h,
    row: match.data,
    dig(cx, cy) {
      if (open(cx, cy)) return true
      const tile = tileAt(world, cx, cy)
      if (tile === BEDROCK) return false
      digs.push({ x: wrap(cx, world.w), y: cy, tile })
      changed.set(key(cx, cy), Tile.Open)
      return true
    },
    build(cx, cy, tile) {
      builds.push({ x: wrap(cx, world.w), y: cy, tile })
      changed.set(key(cx, cy), tile)
    },
    done(base, tx, ty, fall = 0) {
      const kind = builds.length ? 'build' : digs.length ? 'mine' : base
      const loot = digs.filter((d) => d.tile === Tile.Ore || d.tile === Tile.Loot)
      /** @type {Action} */
      const action = { kind, dx, dy, to: { x: wrap(tx, world.w), y: ty + fall }, digs, builds, fall, rule }
      if (match.data.confirm) action.confirm = true
      if (!inv.fits(loot.map((d) => d.tile))) return { ...blocked('packFull'), tried: loot.map(({ x, y }) => ({ x, y })), intended: action }
      if (builds.length > inv.buildable) return { ...blocked('noRock'), tried: builds.map(({ x, y }) => ({ x, y })), intended: action }
      return action
    },
    blocked,
  }
  return match.meaning.run(act)
}
