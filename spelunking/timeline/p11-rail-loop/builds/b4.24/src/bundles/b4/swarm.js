// b4.3's tamed bugs, abstract (the user: "an incremental game with simulation aesthetics"; no pathfinding,
// "there will be a lot of them"). Every bug on the ledger is a worker on a trip: it appears in open air
// within `spawn` px of a random network node, random-walks through open air (a step to an open neighbour
// every `moveTicks`, keeping its heading 3 times in 4; never into rock, D056), pulls ore and loot like you
// do (b4.7, the user): the nearest unit within `reach` px (seen or not) is its target, and after `pullTicks`
// of having one it comes out (the pixel turns to rock, pull.js's toRock); the view draws your dust stream
// and your flight for it. After `tripTicks` it sends its haul straight to the ledger (event `haul`: the view flies it to the ledger's icons)
// and starts a new trip near another node. b4.10: where it goes it greens the back wall (garden.js), and it
// picks fruit too, up to `fruitCarry` a trip. Randomness from the tick, like b3's bugs, so runs repeat.

import { isOpen, Tile } from '../../sim/gen/world.js'
import { toRock } from '../../sim/dig/pull.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { fruitNear, greenAround, pick } from './garden.js'
import { gain } from './game.js'

/** @typedef {import('./world.js').Cell} Cell */
/**
 * @typedef {object} Worker a tamed bug on a trip
 * @property {number} x
 * @property {number} y
 * @property {Cell} from the pixel it stepped from, for drawing
 * @property {number} movedAt
 * @property {number} dir its heading, an index into STEPS
 * @property {number} until the tick its trip ends
 * @property {Cell | null} target the unit it pulls now, for the dust stream
 * @property {number} pullFor ticks it has had a target since its last unit
 * @property {number} ore
 * @property {number} loot
 * @property {number} fruit its haul so far
 */

/** The swarm's numbers (the dev panel's). */
export const SWARM = {
  tripTicks: 1800, // 30 s (the user, b4.7; was 2 min)
  moveTicks: 12, // b3.7's bugs: 5 px/s
  reach: 4, // px a bug mines and picks within (the user, b4.11; was 2)
  pullTicks: 60, // a unit a second at most, like your pull
  spawn: 12, // px round a network node (nodeReach)
  fruitCarry: 8, // fruit a bug holds at most (the user, b4.10)
  upgradeCost: 16, // fruit for the first upgrade, doubling each time: 16, 32, 64… (the user, b4.13)
}
/** @typedef {typeof SWARM} Swarm */

const SALT = 0x5a4d
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

/** @param {import('./game.js').Game} g @param {number} x @param {number} y */
function open(g, x, y) {
  return y >= 0 && y < g.world.h && isOpen(g.world.tiles[y * g.world.w + wrap(x, g.world.w)])
}

/** An open pixel near a random network node, or null (no network). @param {import('./game.js').Game} g @param {Swarm} s @param {() => number} rng */
function spawnAt(g, s, rng) {
  /** @type {number[]} */
  const net = []
  g.net.forEach((on, i) => on && net.push(i))
  if (!net.length) return null
  const n = g.map.nodes[net[rng() % net.length]]
  const r = Math.max(0, s.spawn)
  for (let k = 0; k < 24; k++) {
    const dx = (rng() % (2 * r + 1)) - r
    const dy = (rng() % (2 * r + 1)) - r
    if (dx * dx + dy * dy <= r * r && open(g, n.x + dx, n.y + dy)) return { x: wrap(n.x + dx, g.world.w), y: n.y + dy }
  }
  return { x: n.x, y: n.y } // nodes are never in rock (b4.3)
}

/** @param {import('./game.js').Game} g @param {Worker} b @param {Cell} at @param {() => number} rng */
function startTrip(g, b, at, rng) {
  b.x = at.x
  b.y = at.y
  b.from = { x: at.x, y: at.y }
  b.movedAt = g.tick
  b.dir = rng() % 8
  b.until = g.tick + Math.max(1, g.cfg.swarm.tripTicks)
  b.target = null
  b.pullFor = 0
  b.ore = 0
  b.loot = 0
  b.fruit = 0
  greenAround(g, b.x, b.y)
}

/** The swarm's tick. @param {import('./game.js').Game} g */
export function updateSwarm(g) {
  const s = g.cfg.swarm
  const rng = mulberry32(hashSeed(SALT, g.tick))
  while (g.swarm.length < g.ledger.bugs) {
    const at = spawnAt(g, s, rng)
    if (!at) break
    /** @type {Worker} */
    const b = { x: 0, y: 0, from: at, movedAt: 0, dir: 0, until: 0, target: null, pullFor: 0, ore: 0, loot: 0, fruit: 0 }
    startTrip(g, b, at, rng)
    g.swarm.push(b)
  }
  g.swarm.forEach((b, k) => {
    if (g.tick >= b.until) {
      g.ledger.ore += b.ore
      g.ledger.loot += b.loot
      g.ledger.fruit += b.fruit
      if (b.ore || b.loot || b.fruit) g.events.push({ type: 'haul', x: b.x, y: b.y, ore: b.ore, loot: b.loot, fruit: b.fruit })
      startTrip(g, b, spawnAt(g, s, rng) ?? b, rng)
      return
    }
    if (g.tick - b.movedAt >= Math.max(1, s.moveTicks)) step(g, b, rng)
    pull(g, s, b, k)
  })
}

/** A random-walk step: on its heading 3 times in 4 if open, else a random open neighbour. @param {import('./game.js').Game} g @param {Worker} b @param {() => number} rng */
function step(g, b, rng) {
  b.from = { x: b.x, y: b.y }
  b.movedAt = g.tick
  let dir = b.dir
  if (rng() % 4 === 0 || !open(g, b.x + STEPS[dir][0], b.y + STEPS[dir][1])) {
    const ok = [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => open(g, b.x + STEPS[k][0], b.y + STEPS[k][1]))
    if (!ok.length) return
    dir = ok[rng() % ok.length]
  }
  b.dir = dir
  b.x = wrap(b.x + STEPS[dir][0], g.world.w)
  b.y += STEPS[dir][1]
  greenAround(g, b.x, b.y)
}

/** Like your pull: the nearest ore or loot within reach (then the first in reading order) is the target; after
 * pullTicks of having one, it comes out, to the haul. @param {import('./game.js').Game} g @param {Swarm} s @param {Worker} b @param {number} k its index */
function pull(g, s, b, k) {
  const { w, h, tiles } = g.world
  const up = gain(g, g.level) // each fruit upgrade: reach and speed +20% (b4.15)
  const r = Math.max(0, Math.round(s.reach * up))
  let best = -1
  let bestD = Infinity
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const y = b.y + dy
      const d = dx * dx + dy * dy
      if (y < 0 || y >= h || d > r * r || d >= bestD) continue
      const i = y * w + wrap(b.x + dx, w)
      if (tiles[i] !== Tile.Ore && tiles[i] !== Tile.Loot) continue
      best = i
      bestD = d
    }
  // a fruit nearer than (or as near as) the nearest tile wins, while it has room for one
  const f = b.fruit < s.fruitCarry ? fruitNear(g, b, r) : null
  const isFruit = !!f && (best < 0 || f.d <= bestD)
  if (f && isFruit) best = f.y * w + f.x
  if (best < 0) {
    b.target = null
    b.pullFor = 0
    return
  }
  const x = best % w
  const y = (best - x) / w
  b.target = { x, y }
  if (++b.pullFor < Math.max(1, Math.round(s.pullTicks / up))) return
  b.pullFor = 0
  b.target = null
  if (isFruit) {
    b.fruit++
    pick(g, x, y)
    g.events.push({ type: 'dug', x, y, tile: -1, by: k })
    return
  }
  const tile = tiles[best]
  if (tile === Tile.Ore) b.ore++
  else b.loot++
  toRock(/** @type {any} */ (g), x, y)
  g.events.push({ type: 'dug', x, y, tile, by: k })
}
