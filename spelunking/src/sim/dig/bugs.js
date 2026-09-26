// Moon bugs (D056, D059, D060, D061), when the config has `bugs`. Fireflies with no physics: each sits in
// an open cell (sky excluded; a plank's cell is open, so they ignore planks) and drifts one cell every
// moveTicks. They never enter rock, so they never burrow.
//
// Wild bugs live in the fog (D061). The world is cut into fixed `block`×`block` tiles blocks (x wraps
// like the world; the last column and row may be smaller). The `blocks` blocks nearest you (by their
// centres, x the short way round) each hold one wild bug; blocks beyond them lose theirs. A block's bug
// appears in a random dark cell of the block: open, not lit now, not taken, `near` steps or more from you,
// never within `den` tiles of a placed bug. It may be a cave sealed off by rock: that's the hint. A block
// with no bug (tamed, gone, or no dark cell found) tries again refillTicks later (`g.refill`).
//
// A wild bug wanders: a random step inside its own block. At most `chasers` of them come for your ore:
// the nearest (then lowest id) that can reach you through open cells within `seek` steps (the field).
// A chaser still counts as its block's bug. It drifts down the field toward you and stops next to you;
// next to you, with ore in the pack, it nibbles a unit every nibbleTicks (never loot): event `nibble`.
// A chaser the field lost wanders again if it's in its block, else it's gone. A probe ring that passes
// a wild bug scares it for scareTicks: it drifts away from you and doesn't nibble.
//
// Taming (D060): every nibble counts toward one shared total (`g.fed`). At `tame`, the bug that took
// the last bite goes into the bug bar (`g.bar`, barSlots long; event `tamed`) and the count restarts.
// With the bar full, nobody is tamed. A bar bug roams 2 to 4 steps from you with some inertia, one
// step every barMoveTicks, and lights `light` tiles around itself like your light (game.js). Each bar bug keeps
// one chaser away (D062): with 3 in the bar, you're left in peace. The `place` command puts the bar's
// first bug at the open cell nearest to 2 above you: its den, where it hovers and lights for good, and
// no wild bug comes within `den` tiles. Placed bugs mine in step 3.
//
// Randomness comes from the tick (rng.js), so replays and P2P checks stay exact. Integers only.

import { isOpen, Tile } from '../gen/world.js'
import { hashSeed, mulberry32 } from '../rng.js'
import { take } from './pack.js'
import { ringCells } from './probe.js'
import { wrap } from './rules.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./rules.js').Cell} Cell */

/**
 * @typedef {object} Bugs the numbers (a ruleset's `numbers.bugs`)
 * @property {number} block a fog block's side, in tiles (D061)
 * @property {number} blocks how many blocks nearest you hold a wild bug
 * @property {number} chasers wild bugs coming for your ore at once, at most
 * @property {number} refillTicks a block with no bug tries for a new one this long after
 * @property {number} near a wild bug appears at least this many steps from you
 * @property {number} moveTicks ticks per cell drifted
 * @property {number} seek steps through open cells a bug still finds you from
 * @property {number} nibbleTicks ticks between two nibbles of one bug
 * @property {number} tame ore eaten, by all the wild bugs together, to tame one (D060)
 * @property {number} scareTicks how long a probe ring scares a wild bug off
 * @property {number} den tiles around a placed bug where wild bugs never are
 * @property {number} barSlots tamed bugs you carry at most
 * @property {number} light a bar or placed bug's light radius
 * @property {number} barMoveTicks ticks per cell a bar bug roams (D062); half that while it catches up
 * @property {number} barNear a bar bug keeps at least this many steps from you
 * @property {number} barFar a bar bug heads back to you past this many steps
 */

/**
 * @typedef {object} Bug
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {Cell} from the cell it drifted from, for drawing
 * @property {number} movedAt the tick it last drifted (or appeared)
 * @property {'wild' | 'bar' | 'placed'} kind
 * @property {number} block a wild bug's fog block (D061); -1 once tamed
 * @property {boolean} chasing a wild bug coming for your ore
 * @property {Cell | null} den where it was placed; null until then
 * @property {Cell | null} glow a bar bug's light source: its cell when that's open, else yours
 * @property {number} scared until this tick
 * @property {number} nibbleAt its next nibble, not before this tick
 * @property {number} dir a bar bug's heading, an index into STEPS (the 4 neighbours); -1 for none
 * @property {number} pace ticks its last step took, for drawing
 */

/** @typedef {{ x: number, y: number, rev: number, dist: Map<number, number> }} Field steps from you (x, y) through open cells, for the world as of `rev` */

const SALT = 0xb065

/** How far `place` looks for an open cell around 2 above you. */
const PLACE_RINGS = 4

// the 4 neighbours, in a fixed order; k ^ 1 is the way back
const STEPS = [
  [1, 0],
  [-1, 0],
  [0, -1],
  [0, 1],
]

/** A bug can be in this cell: open, not sky. @param {Game} g @param {number} x @param {number} y */
function roomy(g, x, y) {
  if (y < 0 || y >= g.world.h) return false
  const t = g.world.tiles[y * g.world.w + wrap(x, g.world.w)]
  return isOpen(t) && t !== Tile.Sky
}

/** The squared distance between two cells, x the short way round. @param {Game} g @param {Cell} a @param {Cell} b */
function dist2(g, a, b) {
  let dx = wrap(a.x - b.x, g.world.w)
  if (dx > g.world.w - dx) dx = g.world.w - dx
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

/** The den whose area (radius r) holds `c`, or null: wild bugs keep out (D056). @param {Game} g @param {Cell} c @param {number} r */
function denAt(g, c, r) {
  for (const b of g.bugs) if (b.den && dist2(g, c, b.den) <= r * r) return b.den
  return null
}

/** A new wild bug at (x, y). The game spawns them; tests place them. @param {Game} g @param {number} x @param {number} y */
export function addBug(g, x, y) {
  /** @type {Bug} */
  const bug = {
    id: g.nextBug++,
    x,
    y,
    from: { x, y },
    movedAt: g.tick,
    kind: 'wild',
    block: blockOf(g, x, y),
    chasing: false,
    den: null,
    glow: null,
    scared: 0,
    nibbleAt: 0,
    dir: -1,
    pace: 0,
  }
  g.bugs.push(bug)
  return bug
}

/** A probe ring of radius r around `at` scares the wild bugs it passes (D056). @param {Game} g @param {Cell} at @param {number} r */
export function scare(g, at, r) {
  const b = g.cfg.bugs
  if (!b) return
  for (const bug of g.bugs) if (bug.kind === 'wild' && dist2(g, bug, at) <= r * r) bug.scared = g.tick + b.scareTicks
}

/** The bugs' tick, before the light's: a nibble changes the pack, so the light. @param {Game} g */
export function updateBugs(g) {
  const b = g.cfg.bugs
  if (!b) return
  const field = updateField(g, b)
  const rng = mulberry32(hashSeed(SALT, g.tick))
  const nearest = nearestBlocks(g, b)
  g.bugs = g.bugs.filter((bug) => bug.kind !== 'wild' || nearest.includes(bug.block) || !gone(g, b, bug)) // beyond the nearest
  fill(g, b, field, nearest, rng)
  chase(g, b, field)
  for (const bug of g.bugs) {
    if (bug.kind !== 'wild') continue // a placed bug stays at its den (step 3 puts it to work)
    if (g.tick - bug.movedAt >= b.moveTicks) drift(g, b, field, bug, rng)
    if (bug.chasing) nibble(g, b, bug)
  }
  for (const bug of g.bar) roam(g, b, field, bug, rng)
  // a chaser the field lost wanders again in its block, else it's gone
  g.bugs = g.bugs.filter((bug) => bug.kind !== 'wild' || bug.chasing || bug.block === blockOf(g, bug.x, bug.y) || !gone(g, b, bug))
}

/** A wild bug leaves its block, which tries for a new one refillTicks later. Always true. @param {Game} g @param {Bugs} b @param {Bug} bug */
function gone(g, b, bug) {
  g.refill[bug.block] = g.tick + b.refillTicks
  return true
}

// A bar bug roams round you (D062, calmed after play): it keeps 2 to 4 steps from you (field steps,
// barNear..barFar), one step every barMoveTicks, twice as fast while catching up. It keeps its heading
// (inertia): it turns 1 step in TURN, never straight back unless it must; when rock or the band stops
// it, it hovers a beat first, then heads off anywhere; and 1 step in PAUSE it hovers a beat. Outside the field (a long fall, too far) it jumps to your
// cell. It lights from its cell, which is always open.
/** @param {Game} g @param {Bugs} b @param {Field} field @param {Bug} bug @param {() => number} rng */
function roam(g, b, field, bug, rng) {
  bug.glow = { x: bug.x, y: bug.y }
  const here = field.dist.get(cellOf(g, bug))
  const far = here === undefined || here > b.barFar
  const pace = far ? Math.max(1, b.barMoveTicks >> 1) : b.barMoveTicks
  if (g.tick - bug.movedAt < pace) return
  /** @type {Cell | null} */
  let to = null
  if (here === undefined) {
    to = { x: g.ch.x, y: g.ch.y }
    bug.dir = -1
  } else {
    // the steps it may take: toward you when far, away when too close, else staying in the band
    /** @type {number[]} */
    const ok = []
    STEPS.forEach(([sx, sy], k) => {
      const d = field.dist.get(cellOf(g, { x: bug.x + sx, y: bug.y + sy }))
      if (d === undefined) return
      if (here > b.barFar ? d < here : here < b.barNear ? d > here : d >= b.barNear && d <= b.barFar) ok.push(k)
    })
    const keep = ok.includes(bug.dir) && (far || rng() % TURN !== 0)
    const blocked = bug.dir >= 0 && !ok.includes(bug.dir) && !far
    if (blocked || (!far && rng() % PAUSE === 0)) {
      if (blocked) bug.dir = -1 // it stops at the edge, hovers a beat, then turns anywhere
      bug.movedAt = g.tick
      return
    }
    const turns = ok.filter((k) => k !== (bug.dir ^ 1)) // not straight back, unless that's all there is
    const pick = keep ? bug.dir : turns.length ? turns[rng() % turns.length] : ok.length ? ok[rng() % ok.length] : -1
    if (pick < 0) {
      bug.movedAt = g.tick
      return
    }
    bug.dir = pick
    to = { x: wrap(bug.x + STEPS[pick][0], g.world.w), y: bug.y + STEPS[pick][1] }
  }
  bug.from = { x: bug.x, y: bug.y }
  bug.x = to.x
  bug.y = to.y
  bug.movedAt = g.tick
  bug.pace = pace
  bug.glow = { x: bug.x, y: bug.y }
}

/** A roaming bar bug turns 1 step in TURN, and hovers a beat 1 step in PAUSE. */
const TURN = 6
const PAUSE = 5

/**
 * The hold (D060): the bar's first bug goes to the open cell nearest to 2 above you (the first
 * found at the least distance), and is placed there for good. Nothing with an empty bar, or with
 * no open cell within PLACE_RINGS.
 * @param {Game} g
 */
export function place(g) {
  const bug = g.bar[0]
  if (!g.cfg.bugs || !bug) return
  const at = { x: g.ch.x, y: g.ch.y - 2 }
  const w = g.world.w
  for (let r = 1; r <= PLACE_RINGS; r++) {
    /** @type {Cell | null} */
    let best = null
    for (const i of ringCells(g.world, at, r)) {
      const c = { x: i % w, y: Math.trunc(i / w) }
      if (roomy(g, c.x, c.y) && (!best || dist2(g, c, at) < dist2(g, best, at))) best = c
    }
    if (!best) continue
    g.bar.shift()
    bug.kind = 'placed'
    bug.from = { x: bug.x, y: bug.y }
    bug.x = best.x
    bug.y = best.y
    bug.movedAt = g.tick
    bug.den = best
    bug.glow = best
    g.events.push({ type: 'placed', id: bug.id, x: best.x, y: best.y })
    return
  }
}

/** The cells bar and placed bugs light from (D060), for the light. @param {Game} g @returns {Cell[]} */
export const bugGlows = (g) => (g.cfg.bugs ? g.bugs.flatMap((bug) => (bug.glow ? [bug.glow] : [])) : [])

/** @param {Game} g @param {Cell} c */
const cellOf = (g, c) => c.y * g.world.w + wrap(c.x, g.world.w)

// The steps from you to every open cell within `seek` steps, recomputed when you or the world moved.
/** @param {Game} g @param {Bugs} b */
function updateField(g, b) {
  const f = g.bugField
  if (f && f.x === g.ch.x && f.y === g.ch.y && f.rev === g.worldRev) return f
  const { w } = g.world
  const dist = new Map([[cellOf(g, g.ch), 0]])
  const queue = [cellOf(g, g.ch)]
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]
    const d = /** @type {number} */ (dist.get(i))
    if (d >= b.seek) continue
    const x = i % w
    const y = (i - x) / w
    for (const [sx, sy] of STEPS) {
      if (!roomy(g, x + sx, y + sy)) continue
      const n = cellOf(g, { x: x + sx, y: y + sy })
      if (dist.has(n)) continue
      dist.set(n, d + 1)
      queue.push(n)
    }
  }
  g.bugField = { x: g.ch.x, y: g.ch.y, rev: g.worldRev, dist }
  return g.bugField
}

/** The fog block of cell (x, y) (D061): row by row, x wrapped. @param {Game} g @param {number} x @param {number} y */
export function blockOf(g, x, y) {
  const B = /** @type {Bugs} */ (g.cfg.bugs).block
  return Math.floor(y / B) * Math.ceil(g.world.w / B) + Math.floor(wrap(x, g.world.w) / B)
}

// The `blocks` blocks whose centres are nearest you (x the short way round; ties to the lower index),
// in that order. Doubled coordinates keep the centres whole.
/** @param {Game} g @param {Bugs} b @returns {number[]} */
function nearestBlocks(g, b) {
  const { w, h } = g.world
  const B = b.block
  const cols = Math.ceil(w / B)
  const rows = Math.ceil(h / B)
  const mx = 2 * g.ch.x + 1
  const my = 2 * g.ch.y + 1
  /** @type {[number, number][]} */
  const all = []
  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      let dx = Math.abs(2 * bx * B + Math.min(B, w - bx * B) - mx)
      dx = Math.min(dx, 2 * w - dx)
      const dy = 2 * by * B + Math.min(B, h - by * B) - my
      all.push([dx * dx + dy * dy, by * cols + bx])
    }
  }
  all.sort((p, q) => p[0] - q[0] || p[1] - q[1])
  return all.slice(0, b.blocks).map((p) => p[1])
}

// A wild bug for every near block that has none and is due: a random dark cell of the block, `near`
// steps or more from you (a sealed cave is fine), not taken, never in a den area. None found: it tries
// again refillTicks later.
/** @param {Game} g @param {Bugs} b @param {Field} field @param {number[]} nearest @param {() => number} rng */
function fill(g, b, field, nearest, rng) {
  const held = new Set(g.bugs.flatMap((bug) => (bug.kind === 'wild' ? [bug.block] : [])))
  /** @type {Set<number> | null} */
  let lit = null
  /** @type {Set<number> | null} */
  let taken = null
  const { w, h } = g.world
  const B = b.block
  const cols = Math.ceil(w / B)
  for (const k of nearest) {
    if (held.has(k) || (g.refill[k] ?? 0) > g.tick) continue
    lit ??= new Set(g.lit)
    taken ??= new Set(g.bugs.map((bug) => cellOf(g, bug)))
    const x0 = (k % cols) * B
    const y0 = Math.trunc(k / cols) * B
    /** @type {number[]} */
    const cells = []
    for (let y = y0; y < Math.min(h, y0 + B); y++) {
      for (let x = x0; x < Math.min(w, x0 + B); x++) {
        const i = y * w + x
        if (!roomy(g, x, y) || lit.has(i) || taken.has(i) || (field.dist.get(i) ?? Infinity) < b.near) continue
        if (!denAt(g, { x, y }, b.den)) cells.push(i)
      }
    }
    if (!cells.length) {
      g.refill[k] = g.tick + b.refillTicks
      continue
    }
    const i = cells[rng() % cells.length]
    taken.add(i)
    addBug(g, i % w, Math.trunc(i / w))
  }
}

// Chasers: one the field lost stops chasing; then the nearest wild bugs in the field (then the lowest
// id) join, up to `chasers` less one per bar bug (D062); over that, the farthest stop.
/** @param {Game} g @param {Bugs} b @param {Field} field */
function chase(g, b, field) {
  const wild = g.bugs.filter((bug) => bug.kind === 'wild')
  for (const bug of wild) if (bug.chasing && !field.dist.has(cellOf(g, bug))) bug.chasing = false
  const d = (/** @type {Bug} */ bug) => /** @type {number} */ (field.dist.get(cellOf(g, bug)))
  const cap = Math.max(0, b.chasers - g.bar.length) // each bar bug keeps one away (D062)
  const chasing = wild.filter((bug) => bug.chasing).sort((p, q) => d(p) - d(q) || p.id - q.id)
  for (const bug of chasing.slice(cap)) bug.chasing = false // the farthest stop
  let free = cap - Math.min(cap, chasing.length)
  if (free <= 0) return
  const next = wild.filter((bug) => !bug.chasing && field.dist.has(cellOf(g, bug))).sort((p, q) => d(p) - d(q) || p.id - q.id)
  for (const bug of next) {
    if (free-- <= 0) return
    bug.chasing = true
  }
}

// One cell: a chaser down the field toward you (not past next to you), away from you while scared; a
// wanderer a random step inside its block (away from you while scared). Never into rock or sky, never
// into a den area; one caught inside a den area as a bug was placed near it drifts out, away from that
// den.
/** @param {Game} g @param {Bugs} b @param {Field} field @param {Bug} bug @param {() => number} rng */
function drift(g, b, field, bug, rng) {
  const here = bug.chasing ? field.dist.get(cellOf(g, bug)) : undefined
  const trapped = denAt(g, bug, b.den)
  const away = trapped ?? (g.tick < bug.scared ? g.ch : null)
  if (!away && here !== undefined && here <= 1) return // next to you: it hovers
  // lower is better, and a move must beat staying put: a wander (score 0) always does
  const score = (/** @type {Cell} */ c) => (away ? -dist2(g, c, away) : here === undefined ? 0 : (field.dist.get(cellOf(g, c)) ?? Infinity))
  const stay = away ? -dist2(g, bug, away) : (here ?? 1)
  let best = stay
  /** @type {Cell[]} */
  let options = []
  for (const [sx, sy] of STEPS) {
    const c = { x: wrap(bug.x + sx, g.world.w), y: bug.y + sy }
    if (!roomy(g, c.x, c.y) || (!trapped && denAt(g, c, b.den))) continue
    if (!bug.chasing && blockOf(g, c.x, c.y) !== bug.block) continue
    const s = score(c)
    if (s < best) {
      best = s
      options = [c]
    } else if (s === best && s < stay) options.push(c)
  }
  if (!options.length) return
  const to = options[rng() % options.length]
  bug.from = { x: bug.x, y: bug.y }
  bug.x = to.x
  bug.y = to.y
  bug.movedAt = g.tick
}

// A chaser next to you (8 around, or your cell), not scared, not in a den area, ore in the pack: one unit,
// every nibbleTicks. Every bite counts toward the shared taming count.
/** @param {Game} g @param {Bugs} b @param {Bug} bug */
function nibble(g, b, bug) {
  if (g.tick < bug.scared || g.tick < bug.nibbleAt || dist2(g, bug, g.ch) > 2 || denAt(g, bug, b.den)) return
  if (!take(g.pack, Tile.Ore)) return
  g.fed = Math.min(b.tame, g.fed + 1)
  bug.nibbleAt = g.tick + b.nibbleTicks
  g.events.push({ type: 'nibble', id: bug.id, x: bug.x, y: bug.y, from: { x: g.ch.x, y: g.ch.y } })
  if (g.fed < b.tame || g.bar.length >= b.barSlots) return // with the bar full, the count waits at tame
  g.fed = 0
  gone(g, b, bug)
  bug.kind = 'bar'
  bug.block = -1
  bug.chasing = false
  g.bar.push(bug)
  g.events.push({ type: 'tamed', id: bug.id, x: bug.x, y: bug.y, slot: g.bar.length - 1 })
}
