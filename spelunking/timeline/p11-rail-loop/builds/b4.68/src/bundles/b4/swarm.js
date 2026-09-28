// b4.3's tamed bugs, abstract (the user: "an incremental game with simulation aesthetics"; no pathfinding,
// "there will be a lot of them"). Every bug on the ledger is a worker on a trip: it appears in open air
// within `spawn` px of a random network node, random-walks through open air (a step to an open neighbour
// every `moveTicks`, keeping its heading 3 times in 4; never into rock, D056), pulls ore and crystals like you
// do (b4.7, the user): the nearest unit within `reach` px (seen or not) is its target, and after `pullTicks`
// of having one it comes out (the pixel turns to rock, pull.js's toRock); the view draws your dust stream
// and your flight for it. After `tripTicks` it sends its haul straight to the ledger (event `haul`: the view flies it to the ledger's icons)
// and starts a new trip near another node. b4.10: where it goes it greens the back wall (garden.js), and it
// picks fruit too, up to `fruitCarry` a trip. Randomness from the tick, like b3's bugs, so runs repeat.
// b4.34 (the user: "tame bugs try to spawn in areas with the least amount of tame bugs"): a trip starts at
// the network node with the fewest other bugs within `crowd` px, ties at random. b4.36 (the user: "prefer to
// spawn the bugs in areas with no vine"): before that, nodes with no vine (or fruit) within about `crowd` px
// come first; vines are counted per BLOCK px square, and a node looks at the blocks its circle overlaps.
// b4.49 (the user): a just-tamed bug's first trip starts near you; the next ones at nodes.
// b4.68 (the user: "tame bugs must stop moving if there's fire in their 6px vicinity"): a bug with a burning
// pixel within `fireStop` px stays put (it still pulls, and its trip still ends on time); it walks on once
// the fire there is out. Its 3×3 fire shield (b4.64) holds its ground meanwhile.

import { isOpen, Tile } from '../../sim/gen/world.js'
import { CRYSTAL } from './world.js'
import { toRock } from '../../sim/dig/pull.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { FRUIT, fruitNear, greenAround, pick, VINE } from './garden.js'
import { dist2, gain } from './game.js'

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
 * @property {number} crystals
 * @property {number} fruit its haul so far
 */

/** The swarm's numbers (the dev panel's). */
export const SWARM = {
  tripTicks: 1800, // 30 s (the user, b4.7; was 2 min)
  moveTicks: 12, // b3.7's bugs: 5 px/s
  reach: 4, // px a bug mines and picks within (the user, b4.11; was 2)
  pullTicks: 120, // a unit every 2 s at most (the user, b4.58: "bugs outcompete every other animal", 2× slower; was 60)
  spawn: 12, // px round a network node (nodeReach)
  crowd: 32, // px round a node its bugs are counted within (b4.34)
  fruitCarry: 8, // fruit a bug holds at most (the user, b4.10)
  look: 8, // px a bug looks along each way for back wall not green yet (b4.51; 0: a plain random walk)
  upgradeCost: 16, // fruit for the first upgrade, doubling each time: 16, 32, 64… (the user, b4.13)
  fireStop: 6, // px: fire this close and a bug stands still (the user, b4.68; 0: never)
}
/** @typedef {typeof SWARM} Swarm */

const SALT = 0x5a4d
const BLOCK = 16 // px: the vine count's grid (b4.36)
/** @type {{ tick: number, game: object | null, bw: number, count: Int32Array }} the vine count per block, per tick */
const vineGrid = { tick: -1, game: null, bw: 0, count: new Int32Array(0) }

/** Vine or fruit pixels per BLOCK px block, counted once a tick. @param {import('./game.js').Game} g */
function vines(g) {
  if (vineGrid.tick === g.tick && vineGrid.game === g) return vineGrid
  const { w, h } = g.world
  const bw = Math.ceil(w / BLOCK)
  const count = new Int32Array(bw * Math.ceil(h / BLOCK))
  for (const i of g.garden.vines) {
    const v = g.garden.wall[i]
    if (v !== VINE && v !== FRUIT) continue
    const x = i % w
    count[Math.floor((i - x) / w / BLOCK) * bw + Math.floor(x / BLOCK)]++
  }
  return Object.assign(vineGrid, { tick: g.tick, game: g, bw, count })
}

/** Vine within about r px of `at` (the blocks the circle overlaps). @param {import('./game.js').Game} g @param {Cell} at @param {number} r */
function vineNear(g, at, r) {
  const { bw, count } = vines(g)
  const bh = count.length / bw
  const k = Math.ceil(r / BLOCK)
  const bx = Math.floor(at.x / BLOCK)
  const by = Math.floor(at.y / BLOCK)
  for (let dy = -k; dy <= k; dy++)
    for (let dx = -k; dx <= k; dx++) {
      const y = by + dy
      if (y >= 0 && y < bh && count[y * bw + ((((bx + dx) % bw) + bw) % bw)]) return true
    }
  return false
}
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

/** An open pixel near the network node with the fewest other bugs round it, or null (no network).
 * @param {import('./game.js').Game} g @param {Swarm} s @param {() => number} rng @param {Worker} [self] the bug starting a trip */
function spawnAt(g, s, rng, self) {
  /** @type {number[]} */
  let best = []
  let least = Infinity
  const c2 = s.crowd * s.crowd
  g.net.forEach((on, i) => {
    if (!on) return
    const n = g.map.nodes[i]
    let k = vineNear(g, n, s.crowd) ? 1e6 : 0 // no vine first (b4.36), then the fewest bugs (b4.34)
    for (const b of g.swarm) if (b !== self && dist2(g, b, n) <= c2) k++
    if (k < least) (least = k), (best = [i])
    else if (k === least) best.push(i)
  })
  if (!best.length) return null
  const n = g.map.nodes[best[rng() % best.length]]
  const r = Math.max(0, s.spawn)
  for (let k = 0; k < 24; k++) {
    const dx = (rng() % (2 * r + 1)) - r
    const dy = (rng() % (2 * r + 1)) - r
    if (dx * dx + dy * dy <= r * r && open(g, n.x + dx, n.y + dy)) return { x: wrap(n.x + dx, g.world.w), y: n.y + dy }
  }
  return { x: n.x, y: n.y } // nodes are never in rock (b4.3)
}

/** An open pixel within `spawn` px of the bot, else the bot's. @param {import('./game.js').Game} g @param {Swarm} s @param {() => number} rng */
function nearYou(g, s, rng) {
  const r = Math.max(0, s.spawn)
  for (let k = 0; k < 24; k++) {
    const dx = (rng() % (2 * r + 1)) - r
    const dy = (rng() % (2 * r + 1)) - r
    if (dx * dx + dy * dy <= r * r && open(g, g.ch.x + dx, g.ch.y + dy)) return { x: wrap(g.ch.x + dx, g.world.w), y: g.ch.y + dy }
  }
  return { x: g.ch.x, y: g.ch.y }
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
  b.crystals = 0
  b.fruit = 0
  greenAround(g, b.x, b.y)
}

/** The swarm's tick. @param {import('./game.js').Game} g */
export function updateSwarm(g) {
  const s = g.cfg.swarm
  const rng = mulberry32(hashSeed(SALT, g.tick))
  while (g.swarm.length < g.ledger.bugs) {
    // just tamed: near you (b4.49, the user: "so that the player sees it and connects taming -> green stuff")
    const at = nearYou(g, s, rng)
    if (!at) break
    /** @type {Worker} */
    const b = { x: 0, y: 0, from: at, movedAt: 0, dir: 0, until: 0, target: null, pullFor: 0, ore: 0, crystals: 0, fruit: 0 }
    startTrip(g, b, at, rng)
    g.swarm.push(b)
  }
  g.swarm.forEach((b, k) => {
    if (g.tick >= b.until) {
      g.ledger.ore += b.ore
      g.ledger.crystals += b.crystals
      g.ledger.fruit += b.fruit
      if (b.ore || b.crystals || b.fruit) g.events.push({ type: 'haul', x: b.x, y: b.y, ore: b.ore, crystals: b.crystals, fruit: b.fruit })
      startTrip(g, b, spawnAt(g, s, rng, b) ?? b, rng)
      return
    }
    if (g.tick - b.movedAt >= Math.max(1, s.moveTicks) && !fireNear(g, b, s.fireStop)) step(g, b, rng)
    pull(g, s, b, k)
  })
}

/** A burning pixel within r px of the bug (b4.68). @param {import('./game.js').Game} g @param {Worker} b @param {number} r */
function fireNear(g, b, r) {
  if (r <= 0) return false
  const w = g.world.w
  return g.garden.burning.some((i) => dist2(g, { x: i % w, y: Math.floor(i / w) }, b) <= r * r)
}

/** Back wall not green yet along a way: open pixels with no cover in the next `look` px (b4.51). @param {import('./game.js').Game} g @param {Worker} b @param {number} k @param {number} look */
function bare(g, b, k, look) {
  const [sx, sy] = STEPS[k]
  const w = g.world.w
  let n = 0
  for (let d = 1; d <= look; d++) {
    const x = b.x + sx * d
    const y = b.y + sy * d
    if (!open(g, x, y)) break
    if (!g.garden.wall[y * w + wrap(x, w)]) n++
  }
  return n
}

/** A random-walk step: on its heading 3 times in 4 if open, else a random open neighbour. b4.51 (the user: "tame
 * bugs should be attracted to cave backwall tiles that are not green yet"): the way with the most bare back wall
 * within `look` px wins (its heading on a tie); none bare in sight: the random walk. @param {import('./game.js').Game} g @param {Worker} b @param {() => number} rng */
function step(g, b, rng) {
  b.from = { x: b.x, y: b.y }
  b.movedAt = g.tick
  let dir = b.dir
  const look = Math.max(0, g.cfg.swarm.look)
  /** @type {number[]} */
  let best = []
  let most = 0
  for (let k = 0; k < 8 && look; k++) {
    const n = bare(g, b, k, look)
    if (n > most) ((most = n), (best = [k]))
    else if (n && n === most) best.push(k)
  }
  if (best.length) dir = best.includes(dir) ? dir : best[rng() % best.length]
  else if (rng() % 4 === 0 || !open(g, b.x + STEPS[dir][0], b.y + STEPS[dir][1])) {
    const ok = [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => open(g, b.x + STEPS[k][0], b.y + STEPS[k][1]))
    if (!ok.length) return
    dir = ok[rng() % ok.length]
  }
  b.dir = dir
  b.x = wrap(b.x + STEPS[dir][0], g.world.w)
  b.y += STEPS[dir][1]
  greenAround(g, b.x, b.y)
}

/** Like your pull: the nearest ore or crystals within reach (then the first in reading order) is the target; after
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
      if (tiles[i] !== Tile.Ore && tiles[i] !== CRYSTAL) continue
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
  else b.crystals++
  toRock(/** @type {any} */ (g), x, y)
  g.events.push({ type: 'dug', x, y, tile, by: k })
}
