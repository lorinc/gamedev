// b4.70's wall-bouncers (the user: "change [the bugs'] natural movement. Let's make it a wall-bouncer. It moves on
// the wall, and if there's no ore nearby to mine, it shoots itself in a low-gravity arch through the cave";
// "make it a random arch, no logic or memory"; wild ones "do the same, but do not linger around ores, just walk
// around and sometimes do the wall-jump"). Shared by the tamed workers (swarm.js) and the wild bugs (bugs.js's
// `g.wander` hook). A bug on the wall (an open pixel with rock among its 8 neighbours) crawls to a wall
// neighbour, keeping its heading when it can. A jump launches it at `jumpSpeed` px/s in a random direction with
// open air `CLEAR` (8) px ahead; `gravity` pulls it down every tick, and it sticks to the last open pixel before the rock it
// hits (the world's top and bottom count as rock). A bug off the wall (spawned in the air) falls. Positions in
// flight are in 1/1000 px, integers, speeds capped below 1 px a tick so it never skips through rock.
// Randomness is the caller's (from the tick), so runs repeat.

import { isOpen } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'

/** The bouncers' numbers (the dev panel's). */
export const BOUNCE = {
  jumpSpeed: 40, // px/s at launch
  gravity: 18, // px/s²: a straight-up jump rises ~44 px
  restTicks: 60, // a tamed bug's rest on the wall before it jumps again
  wildJump: 40, // a wild bug jumps once in this many crawl steps (~8 s at 5 px/s)
  mothSpeed: 12, // px/s a moth flies (b4.71)
  mothRadius: 6, // px: the circle a moth flies round
  mothFlip: 120, // a moth turns the other way round once in this many ticks, on average (~2 s)
  mothJitter: 60, // ± 1/6400ths of a turn added at random each tick: the random walk in its circles
}
/** @typedef {typeof BOUNCE} Bounce */

/** @typedef {{ x: number, y: number, vx: number, vy: number }} Flight in 1/1000 px and 1/1000 px a tick */
/**
 * @typedef {object} Bouncer what a bug needs to bounce
 * @property {number} x
 * @property {number} y
 * @property {{ x: number, y: number }} from the pixel it moved from, for drawing
 * @property {number} movedAt
 * @property {number} dir its crawl heading, an index into STEPS
 * @property {number} [pace] ticks its last move takes to draw (1 in flight)
 * @property {Flight | null} [fly] in the air
 * @property {number} [landedAt]
 * @property {Moth | null} [moth] a tamed bug that met gas (b4.71)
 */
/** @typedef {{ x: number, y: number, a: number, turn: number }} Moth in 1/1000 px; `a` its heading in 1/6400ths of a turn, `turn` ±1 */

const CLEAR = 8 // px of open air a jump needs ahead, so it's an arc, not a twitch into the next rock
const MAX_V = 950 // 1/1000 px a tick: under a pixel, so a flight checks every pixel it enters
// the 8 neighbours, round the clock
const STEPS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
]
// 32 launch directions, 1000 × (cos, sin), whole numbers
const DIRS = Array.from({ length: 32 }, (_, k) => [Math.round(1000 * Math.cos((k * Math.PI) / 16)), Math.round(1000 * Math.sin((k * Math.PI) / 16))])

/** @param {import('./game.js').Game} g @param {number} x @param {number} y */
export function open(g, x, y) {
  return y >= 0 && y < g.world.h && isOpen(g.world.tiles[y * g.world.w + wrap(x, g.world.w)])
}

/** On the wall: open, with rock (or the world's edge) among its 8 neighbours. @param {import('./game.js').Game} g @param {number} x @param {number} y */
export function onWall(g, x, y) {
  return open(g, x, y) && STEPS.some(([sx, sy]) => !open(g, x + sx, y + sy))
}

/** @param {Bouncer} b @param {number} x @param {number} y @param {number} tick @param {number} pace */
function moveTo(b, x, y, tick, pace) {
  b.from = { x: b.x, y: b.y }
  b.x = x
  b.y = y
  b.movedAt = tick
  b.pace = pace
}

/** A crawl step along the wall: on its heading if that's wall, else a random wall neighbour, not straight back if
 * it can help it; none: it falls (the wall under it was mined away, or it's in the air). @param {import('./game.js').Game} g @param {Bouncer} b @param {() => number} rng @param {number} pace @returns {boolean} it moved */
export function crawl(g, b, rng, pace) {
  if (!onWall(g, b.x, b.y)) return fall(b), false
  const ok = [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => onWall(g, b.x + STEPS[k][0], b.y + STEPS[k][1]))
  if (!ok.length) return false
  let dir = b.dir
  if (!ok.includes(dir)) {
    const on = ok.filter((k) => k !== (b.dir + 4) % 8)
    const from = on.length ? on : ok
    dir = from[rng() % from.length]
  }
  b.dir = dir
  moveTo(b, wrap(b.x + STEPS[dir][0], g.world.w), b.y + STEPS[dir][1], g.tick, pace)
  return true
}

/** Off the wall, from rest. @param {Bouncer} b */
export function fall(b) {
  b.fly = { x: b.x * 1000 + 500, y: b.y * 1000 + 500, vx: 0, vy: 0 }
}

/** A jump in a random direction with open air all along CLEAR px ahead (the first of 32 from a random start). @param {import('./game.js').Game} g @param {Bouncer} b @param {() => number} rng */
export function jump(g, b, rng) {
  const v = Math.min(MAX_V, Math.round((g.cfg.bounce.jumpSpeed * 1000) / 60))
  const k0 = rng() % DIRS.length
  for (let n = 0; n < DIRS.length; n++) {
    const [cx, cy] = DIRS[(k0 + n) % DIRS.length]
    let ok = true
    for (let d = 1; d <= CLEAR && ok; d++) ok = open(g, b.x + Math.round((d * cx) / 1000), b.y + Math.round((d * cy) / 1000))
    if (!ok) continue
    b.fly = { x: b.x * 1000 + 500, y: b.y * 1000 + 500, vx: Math.round((cx * v) / 1000), vy: Math.round((cy * v) / 1000) }
    return true
  }
  return false
}

/** A tick in the air: gravity, then a step; rock ahead: it sticks where it is. @param {import('./game.js').Game} g @param {Bouncer} b @returns {boolean} it landed */
export function flyTick(g, b) {
  const f = /** @type {Flight} */ (b.fly)
  const w = g.world.w
  const gr = Math.round((g.cfg.bounce.gravity * 1000) / 3600)
  f.vy = Math.max(-MAX_V, Math.min(MAX_V, f.vy + gr))
  const nx = f.x + f.vx
  const ny = f.y + f.vy
  const px = wrap(Math.floor(nx / 1000), w)
  const py = Math.floor(ny / 1000)
  if (!open(g, px, py) || (px !== b.x && py !== b.y && !open(g, px, b.y) && !open(g, b.x, py))) {
    b.fly = null
    b.landedAt = g.tick
    b.from = { x: b.x, y: b.y }
    return true
  }
  f.x = ((nx % (w * 1000)) + w * 1000) % (w * 1000)
  f.y = ny
  if (px !== b.x || py !== b.y) moveTo(b, px, py, g.tick, 1)
  return false
}

/** A wild bug's move (bugs.js's `g.wander`, b4.70): a chaser leaves the air and drifts to you as before; the others
 * fly, or crawl every `bugs.moveTicks`, jumping once in `bounce.wildJump` steps. @param {import('./game.js').Game} g @param {any} bug @param {() => number} rng @returns {boolean} it moved */
export function wildWander(g, bug, rng) {
  if (bug.chasing) {
    if (bug.fly) ((bug.fly = null), (bug.pace = g.cfg.bugs.moveTicks))
    return false
  }
  if (bug.dir < 0) bug.dir = rng() % 8 // a new bug's heading (bugs.js starts it at -1)
  if (bug.fly) return flyTick(g, bug), true
  const pace = Math.max(1, g.cfg.bugs.moveTicks)
  if (g.tick - bug.movedAt < pace) return false
  if (rng() % Math.max(1, g.cfg.bounce.wildJump) === 0 && onWall(g, bug.x, bug.y) && jump(g, bug, rng)) return true
  if (!crawl(g, bug, rng, pace)) bug.movedAt = g.tick
  return true
}

const TURN = 6400
// 64 headings, 1000 × (cos, sin)
const HEAD = Array.from({ length: 64 }, (_, k) => [Math.round(1000 * Math.cos((k * Math.PI) / 32)), Math.round(1000 * Math.sin((k * Math.PI) / 32))])

/** A bug becomes a moth where it is (b4.71). @param {Bouncer} b @param {() => number} rng */
export function becomeMoth(b, rng) {
  b.fly = null
  b.moth = { x: b.x * 1000 + 500, y: b.y * 1000 + 500, a: rng() % TURN, turn: rng() % 2 ? 1 : -1 }
}

/** A moth's tick (b4.71, the user: "behave like a moth - flies in circles with an element of random walk"): its
 * heading turns steadily (a circle of `mothRadius`), with a random nudge each tick and now and then the other way
 * round; it flies through open air only, and turns round where the way ahead is rock. @param {import('./game.js').Game} g @param {Bouncer} b @param {() => number} rng @returns {boolean} it entered a new pixel */
export function mothTick(g, b, rng) {
  const m = /** @type {Moth} */ (b.moth)
  const c = g.cfg.bounce
  const w = g.world.w
  const v = Math.min(MAX_V, Math.round((c.mothSpeed * 1000) / 60)) // 1/1000 px a tick
  const da = Math.round((TURN * v) / (2 * Math.PI * Math.max(1, c.mothRadius) * 1000))
  if (rng() % Math.max(1, c.mothFlip) === 0) m.turn = -m.turn
  const j = Math.max(0, c.mothJitter)
  m.a = (((m.a + m.turn * da + (rng() % (2 * j + 1)) - j) % TURN) + TURN) % TURN
  const [cx, cy] = HEAD[Math.floor((m.a * 64) / TURN)]
  const nx = m.x + Math.round((cx * v) / 1000)
  const ny = m.y + Math.round((cy * v) / 1000)
  const px = wrap(Math.floor(nx / 1000), w)
  const py = Math.floor(ny / 1000)
  if (!open(g, px, py)) {
    m.a = (m.a + TURN / 2) % TURN // rock ahead: turn round
    return false
  }
  m.x = ((nx % (w * 1000)) + w * 1000) % (w * 1000)
  m.y = ny
  if (px === b.x && py === b.y) return false
  moveTo(b, px, py, g.tick, 1)
  return true
}
