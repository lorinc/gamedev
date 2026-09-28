// b4 · Rail Loop's sim (p11, D079): the spider bot, the seismic scan, the pull, the traverse nodes, building
// monorail edges and riding them. Fixed ticks, commands in, events out, no clock and no Math.random: the
// same map and commands give the same game. b3's probe rings, pull targeting, pack and light are reused as
// they are (src/sim/dig/); the rest is new, because b4 has no swipe table: the bot goes where it's pointed.
//
// Moving (b4.3): `move` points the bot any way (the user: "every angle, not just 8") or stops it (0, 0).
// The bot has a sub-pixel position (`pos`, in thousandths of a pixel) that glides along the exact angle at
// `walkSpeed`; its pixel (`ch`) is where that position is, and it may only be an open one; it climbs the back
// wall, D077; no gravity. Into rock, it slides along the open side (the move's x or y part alone).
// Scan: touching rock fires b3's probe at the rock pixel touched, at once, also while sliding along the wall
// (b4.22, the user: "no need to wait"), rings out to `scan.radius`; `scan.cooldown` is 0 (was 1 s, b4.3). It fires only if some pixel within its radius is still
// unseen (b4.6). Pull: b3's (D062): the nearest seen ore or
// loot in the light is pulled, one unit every `pull.ticks`, and the pixel turns to rock; it goes straight to
// the ledger (b4.3). Walking doesn't stop it (b4.5), a moving car does.
// The ledger (b4.3, the user): every collectible, one count each: ore, loot, bugs. No pack.
// Light (b4.3): a fixed radius (`light.base`, 8 px; upgrades later), line of sight (light.js sightCells).
// Nodes (b4.8, the user): the pod's are on the network until the first edge is built; from then on only the
// ends of built edges. b4.22 (the user): a node shows only while the ledger holds the `price` and it has an
// unbuilt edge. The bot walking within `nodeReach` (2 px) of a shown node is engulfed: it sits on the
// node and can't walk until it builds one of the node's edges (`engulf`), or for `ejectTicks` (3 s, b4.26,
// the user: "it is not possible to leave the bulb"): then it walks free, and the same node doesn't take it
// again until it has been out of reach (`freed`).
// Building (b4.3): `build` an unbuilt edge from the node the bot is engulfed in: the price is taken and the
// edge is built at once and its far node joins the network.
// b4.41 (the user: "bulb-entry-exit is still not great UX"): a node on the network takes the bot in
// (`engulf`) when it offers something: a built root, or an unbuilt one with the price on the ledger. Held, a drag picks one of its roots (`aim`, within 67.5°): a built
// one, or an unbuilt one while the ledger holds the price; release confirms: `ride` a built one, `build` an
// unbuilt one and ride it. After `ejectTicks` (3 s) the bulb puts the bot on an open pixel `ejectR` (5) px out
// (`eject`), the way it came in if it can. A ride that stops at a node stops in its bulb. Pointing along a
// root to board it (b4.23) is gone: the bulb is the one way on.
// Riding (before b4.41): pointing along a built root (within 67.5°) within `nodeReach` of one of its nodes gets you riding
// it, the bot on the node (b4.23, the user: "I still need to travel"; b4.22 needed the node's own pixel);
// there are no carts (b4.22, the user), the bot glides along the root itself. A pointed direction picks, at each node, the built edge
// that fits it best (within 67.5°); the bot runs node to node until no edge fits (it stops at the last
// node), or a new direction (it turns at the next node). A tap gets you off at the next open pixel along
// the root, mid-root (b4.38, the user: "can not get out where I want"; it stopped at the next node before).
// Pointed while stopped where no edge fits, you get out and walk that way. `rideSpeed` 40 px/s (b4.38; was 80).
// Garden (b4.10, garden.js): tamed bugs green the back wall, vines grow on green, vines make red fruit, a
// resource: your pull takes fruit within the light too, seen or not. Your pull goes for the kind the ledger holds least
// of (b4.12), the nearest of it.
// Upgrades (b4.13, b4.15, the user): fruit on the ledger is spent by itself on the bugs, loot on the bot: the
// first costs 16 (swarm.upgradeCost, botUpgradeCost), each next twice the last; each makes the mining radius
// and speed `upgradeGain` (20%) bigger, compounding. The bot's mining radius starts at the light's, 8 px;
// the light itself doesn't grow.
// Lizards (b4.14, lizards.js): plentiful ore spawns lizards; they zip round the cave surfaces mining ore, and
// after 16 burrow and make one loot in the wall.
// Lichen (b4.15, lichen.js): plentiful loot grows purple lichen patches of 6–8 px with a curly leaf (looks only).
// Worms (b4.12, worms.js): dense fruit spawns worms; they eat 8 fruit, burrow and curl up into an ore deposit.
// Bugs (b4.3): b3.7's wild ones (`src/sim/dig/bugs.js`, D056–D061) with the `ledger` switch: they nibble ore
// from the ledger; at 16 fed (D060) the last biter is +1 bug on the ledger. Tamed bugs are abstract workers
// (swarm.js).

import { Tile, isOpen } from '../../sim/gen/world.js'
import { reveal } from '../../sim/dig/game.js'
import { ringCells } from '../../sim/dig/probe.js'
import { nearestValuable, toRock } from '../../sim/dig/pull.js'
import { scare, updateBugs } from '../../sim/dig/bugs.js'
import { sightCells } from '../../sim/dig/light.js'
import { wrap } from '../../sim/dig/rules.js'
import { SWARM, updateSwarm } from './swarm.js'
import { createGarden, fruitNear, GARDEN, pick as pickFruit, updateGarden } from './garden.js'
import { updateWorms, WORMS } from './worms.js'
import { LIZARDS, updateLizards } from './lizards.js'
import { createLichen, LICHEN, updateLichen } from './lichen.js'
import { FLOWERS, updateFlowers } from './flowers.js'
import { ASHWORMS, updateAshworms } from './ashworms.js'
import { OPEN, ROCK } from './world.js'

/** @typedef {import('./world.js').Map} Map */
/** @typedef {import('./world.js').Cell} Cell */

/** The sim's numbers; the dev panel tunes them live. */
export const CONFIG = {
  // D081: the intent is a rail about 7× faster than walking; start at 12 and 80 px/s (a b4.1 tile was 4 px)
  walkSpeed: 12, // px/s (a step takes whole ticks: 60 / speed, rounded; a diagonal √2 times that)
  // at 1 px a tile (D080) the scan and the node detection grew ×4 with the scale (D081); the light is b4.2's
  // 16 halved (b4.3, the user: "torchlight is waaay too big"), fixed, and the pull's reach with it
  scan: { radius: 24, cooldown: 0, ringTicks: 1 }, // no cooldown: it fires on touch (the user, b4.22; was 1 s, b4.3)
  pull: { ticks: 60 }, // b3's pull was 300 (5 s a unit); 1 s here, or an edge is a minute of standing still
  light: { base: 8 },
  nodeReach: 2, // px: a shown node engulfs the bot this close (the user, b4.22; was 12, a build's reach)
  lootTame: 2, // px: a wild bug this close to a loot pixel eats it and is tamed (the user, b4.40)
  ejectTicks: 180, // a bulb lets the bot go after 3 s with nothing built (the user, b4.26)
  ejectR: 5, // px from the bulb's centre it puts the bot (the user, b4.41)
  bugs: {
    block: 32,
    blocks: 64,
    chasers: 3,
    refillTicks: 300,
    near: 4,
    moveTicks: 12,
    seek: 20,
    nibbleTicks: 40,
    tame: 16,
    scareTicks: 240,
    den: 12,
    barSlots: 0,
    ledger: true,
  }, // b3.7's wild bugs (rules/b3.7.json); no bar, no placed bugs (b4.3)
  swarm: { ...SWARM },
  garden: { ...GARDEN },
  worms: { ...WORMS },
  lizards: { ...LIZARDS },
  lichen: { ...LICHEN },
  flowers: { ...FLOWERS },
  ashworms: { ...ASHWORMS },
  price: 10, // ore per edge (user: 8–12, tuned later)
  botUpgradeCost: 16, // loot for the bot's first upgrade, doubling (the user, b4.15)
  upgradeGain: 0.2, // an upgrade: mining radius and speed +20% (the user, b4.15)
  rideSpeed: 40, // px/s riding (the user, b4.38: "too fast"; was 80); an integer budget, 60 a straight px, 85 a diagonal
}
/** @typedef {typeof CONFIG} Config */

/**
 * @typedef {{ type: 'move', dx: number, dy: number } | { type: 'tap' } | { type: 'build', edge: number, from: number } | { type: 'ride', edge: number, from: number, dx: number, dy: number }} Command
 *   move: any direction, dx and dy any numbers (0, 0 = stop)
 */
/**
 * @typedef {{ type: 'seen', cells: number[] }
 *   | { type: 'ring', x: number, y: number, r: number }
 *   | { type: 'scan', x: number, y: number }
 *   | { type: 'pulled', x: number, y: number, tile: number, to: Cell }
 *   | { type: 'built', edge: number, from: number, price: number }
 *   | { type: 'refused', edge: number, reason: 'ore' | 'off' | 'far' | 'built' }
 *   | { type: 'dug', x: number, y: number, tile: number, by: number } | { type: 'haul', x: number, y: number, ore: number, loot: number, fruit: number }
 *   | { type: 'worm', x: number, y: number } | { type: 'eaten', x: number, y: number } | { type: 'deposit', cells: number[] }
 *   | { type: 'upgrade', level: number } | { type: 'botUpgrade', level: number }
 *   | { type: 'lizard', x: number, y: number } | { type: 'lichen', x: number, y: number } | { type: 'engulf' | 'eject', node: number } | { type: 'flower' | 'bloom' | 'poof' | 'ashworm' | 'ashwormGone', x: number, y: number } | { type: 'spark', x: number, y: number } | { type: 'licked', x: number, y: number, to: Cell }
 *   | { type: 'board', node: number } | { type: 'exit', node: number }
 *   | { type: 'nibble', id: number, x: number, y: number, from: Cell } | { type: 'hungry', id: number, x: number, y: number } | { type: 'tamed', id: number, x: number, y: number, slot: number }
 *  } GameEvent bugs.js adds the wild bugs'; tamed has slot -1 (to the ledger); tile FRUIT_TILE is a fruit (b4.10)
 */

/**
 * @typedef {object} Ride you riding a root (no cart since b4.22, the user: "just the bulbs")
 * @property {number} node the node it's at or last left
 * @property {{ edge: number, i: number, dir: 1 | -1, acc: number } | null} run on edge, going from path[i] to path[i + dir], with
 *   acc of the step's cost (STEP or DIAG) covered
 * @property {{ dx: number, dy: number } | null} want the direction pointed
 * @property {boolean} stopNext a tap: get off at the next open pixel (b4.38)
 */

/**
 * @typedef {object} Game
 * @property {Map} map
 * @property {import('../../sim/gen/world.js').World} world
 * @property {Config} cfg
 * @property {number} tick
 * @property {{ x: number, y: number, facing: number }} ch the bot's tile (b3's pull and light read `ch`)
 * @property {{ x: number, y: number, px: number, py: number }} pos the bot's position in thousandths of a px (x
 *   wraps at w × 1000), this tick's and the last's (for drawing); always inside ch
 * @property {{ dx: number, dy: number } | null} move the direction pointed, as heading() gives it
 * @property {{ ore: number, loot: number, bugs: number, fruit: number }} ledger b4.3; fruit b4.10
 * @property {import('./garden.js').GardenState} garden b4.10
 * @property {import('./worms.js').Worm[]} worms b4.12
 * @property {number} level bug upgrades bought (b4.13)
 * @property {number} botLevel bot upgrades bought (b4.15)
 * @property {import('./lizards.js').Lizard[]} lizards b4.14
 * @property {import('./lichen.js').LichenState} lichen b4.15
 * @property {import('./flowers.js').Flower[]} flowers b4.25: on the ash
 * @property {import('./flowers.js').FlowerBot[]} fbots b4.25: bloomed flowers, extending the network
 * @property {import('./ashworms.js').AshWorm[]} ashworms b4.37: lifting the fog
 * @property {import('./swarm.js').Worker[]} swarm the ledger's bugs at work
 * @property {Uint8Array} seen
 * @property {number[]} lit
 * @property {number} radius
 * @property {number[]} surface
 * @property {{ x: number, y: number, r: number, glows: string }} litFor
 * @property {{ x: number, y: number, r: number, t: number } | null} probe
 * @property {number} scanAt the tick the scan is ready again
 * @property {number} stillFor ticks something was in the pull's reach since the last unit
 * @property {Cell | null} pulling
 * @property {Uint8Array} net per node: on the network (D080)
 * @property {import('../../sim/dig/bugs.js').Bug[]} bugs b3's (D056)
 * @property {number} nextBug
 * @property {import('../../sim/dig/bugs.js').Field | null} bugField
 * @property {number} worldRev b4 never changes where bugs can go: always 0
 * @property {number} fed
 * @property {import('../../sim/dig/bugs.js').Bug[]} bar always empty (bugs.js reads it)
 * @property {Record<number, number>} refill
 * @property {Uint8Array} built per edge
 * @property {Uint8Array} railed per node: the end of a built edge (b4.8)
 * @property {boolean} firstBuilt an edge has been built
 * @property {Ride | null} ride
 * @property {number | null} engulf the node the bot is held in (b4.22)
 * @property {number} engulfAt the tick it was taken in
 * @property {{ dx: number, dy: number } | null} cameIn the way the bot was going when a bulb took it in (b4.41)
 * @property {number | null} freed the node that just let the bot go: it doesn't take it again until it's out of reach
 * @property {number[][]} links per node: its edges
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
    pos: { x: map.start.x * 1000 + 500, y: map.start.y * 1000 + 500, px: map.start.x * 1000 + 500, py: map.start.y * 1000 + 500 },
    move: null,
    ledger: { ore: 0, loot: 0, bugs: 0, fruit: 0 },
    garden: createGarden(world.w * world.h),
    worms: [],
    level: 0,
    botLevel: 0,
    lizards: [],
    lichen: createLichen(world.w * world.h),
    flowers: [],
    fbots: [],
    ashworms: [],
    swarm: [],
    seen: new Uint8Array(world.w * world.h),
    lit: [],
    radius: 0,
    surface: [], // no sky inside the map any more: nothing is always lit (b4.2)
    litFor: { x: -1, y: -1, r: -1, glows: '' },
    probe: null,
    scanAt: 0,
    stillFor: 0,
    pulling: null,
    net: new Uint8Array(map.nodes.length),
    bugs: [],
    nextBug: 1,
    bugField: null,
    worldRev: 0,
    fed: 0,
    bar: [],
    refill: {},
    built: new Uint8Array(map.edges.length),
    railed: new Uint8Array(map.nodes.length),
    firstBuilt: false,
    ride: null,
    engulf: null,
    engulfAt: 0,
    cameIn: null,
    freed: null,
    links: map.nodes.map(() => []),
    queue: [],
    events: [],
  }
  for (const n of map.podNodes) g.net[n] = 1
  map.edges.forEach((e, k) => (g.links[e.a].push(k), g.links[e.b].push(k)))
  reveal(/** @type {any} */ (g), map.podCells) // the pod's interior starts seen
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
      const dir = heading(cmd.dx, cmd.dy)
      if (g.engulf !== null) continue // held: the page turns a drag into aiming
      if (g.ride) point(g, g.ride, dir)
      else g.move = dir
    } else if (cmd.type === 'tap') {
      if (g.ride?.run) g.ride.stopNext = true
    } else if (cmd.type === 'ride') rideFrom(g, cmd.edge, cmd.from, heading(cmd.dx, cmd.dy))
    else build(g, cmd.edge, cmd.from)
  }
  g.queue.length = 0

  if (g.engulf !== null && g.tick - g.engulfAt >= g.cfg.ejectTicks) eject(g)
  if (g.ride) rideTick(g, g.ride)
  else if (g.engulf === null) {
    walk(g)
    engulf(g)
  }
  if (g.probe) spread(g, g.probe)
  pull(g)
  updateBugs(/** @type {any} */ (g))
  lootTames(g)
  updateSwarm(g)
  updateGarden(g)
  updateWorms(g)
  updateLizards(g)
  updateLichen(g)
  updateFlowers(g)
  updateAshworms(g)
  while (g.ledger.fruit >= nextCost(g)) {
    g.ledger.fruit -= nextCost(g)
    g.level++
    g.events.push({ type: 'upgrade', level: g.level })
  }
  while (g.ledger.loot >= botCost(g)) {
    g.ledger.loot -= botCost(g)
    g.botLevel++
    g.events.push({ type: 'botUpgrade', level: g.botLevel })
  }
  updateLight(g)
}

/** @param {Game} g */
function walk(g) {
  const W = g.world.w * 1000
  const p = g.pos
  p.px = p.x
  p.py = p.y
  // a ride (or a test) put the bot on another pixel: its position follows, to that pixel's centre
  if (Math.floor(p.x / 1000) !== g.ch.x || Math.floor(p.y / 1000) !== g.ch.y) {
    p.x = p.px = g.ch.x * 1000 + 500
    p.y = p.py = g.ch.y * 1000 + 500
  }
  const m = g.move
  if (!m) return
  if (m.dx) g.ch.facing = Math.sign(m.dx)
  const len = Math.hypot(m.dx, m.dy)
  const v = (Math.max(0, g.cfg.walkSpeed) * 1000) / 60 // thousandths of a px a tick
  const vx = Math.round((m.dx * v) / len)
  const vy = Math.round((m.dy * v) / len)
  // the whole move, else its x part alone, else its y part alone (sliding along a wall)
  for (const [ex, ey] of [
    [vx, vy],
    [vx, 0],
    [0, vy],
  ]) {
    if (!ex && !ey) continue
    const nx = (((p.x + ex) % W) + W) % W
    const ny = p.y + ey
    const cx = Math.floor(nx / 1000)
    const cy = Math.floor(ny / 1000)
    const sx = cx === g.ch.x ? 0 : Math.abs(cx - g.ch.x) > 1 ? -Math.sign(cx - g.ch.x) : Math.sign(cx - g.ch.x) // across the wrap
    const sy = cy - g.ch.y
    const blocked = ((sx || sy) && !open(g, cx, cy)) || (sx && sy && !open(g, g.ch.x + sx, g.ch.y) && !open(g, g.ch.x, g.ch.y + sy)) // no squeezing between two rock corners
    if (blocked) {
      // the wall touched: the scan at once, sliding or not (b4.22), at the rock pixel touched
      if (ex === vx && ey === vy) open(g, cx, cy) ? scan(g, wrap(g.ch.x + sx, g.world.w), g.ch.y) : scan(g, cx, cy)
      continue
    }
    p.x = nx
    p.y = ny
    if (!sx && !sy) return
    g.ch.x = cx
    g.ch.y = cy
    return
  }
}

/** The bot touched rock at (x, y): the scan (D079) there, if it's ready. The sheet, the sea and space aren't
 * rock: nothing to scan. @param {Game} g @param {number} x @param {number} y */
function scan(g, x, y) {
  if (g.probe || g.tick < g.scanAt || y < 0 || y >= g.world.h) return
  if (g.map.kind[y * g.world.w + x] !== ROCK) return
  if (!hidden(g, x, y, g.cfg.scan.radius)) return // nothing left to find there (the user, b4.6)
  g.probe = { x, y, r: 0, t: 0 }
  g.scanAt = g.tick + g.cfg.scan.cooldown
  g.events.push({ type: 'scan', x: g.probe.x, y })
  ring(g, g.probe, 1)
}

/** Some rock or cave pixel within r of (x, y) is still unseen (the sheet, the sea and space don't count). @param {Game} g @param {number} x @param {number} y @param {number} r */
function hidden(g, x, y, r) {
  const { w, h } = g.world
  for (let dy = -r; dy <= r; dy++) {
    const yy = y + dy
    if (yy < 0 || yy >= h) continue
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue
      const i = yy * w + wrap(x + dx, w)
      const k = g.map.kind[i]
      if (!g.seen[i] && (k === ROCK || k === OPEN)) return true
    }
  }
  return false
}

/** A direction as steps per 1000, the main axis ±1000 (integers from here on), or null for none. @param {number} dx @param {number} dy */
export function heading(dx, dy) {
  const len = Math.max(Math.abs(dx), Math.abs(dy))
  if (!(len > 0)) return null
  return { dx: Math.round((dx * 1000) / len), dy: Math.round((dy * 1000) / len) }
}

/** @param {Game} g @param {number} x @param {number} y */
function open(g, x, y) {
  if (y < 0 || y >= g.world.h) return false
  return isOpen(g.world.tiles[y * g.world.w + wrap(x, g.world.w)])
}

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
  scare(/** @type {any} */ (g), p, r)
  g.events.push({ type: 'ring', x: p.x, y: p.y, r })
}

// b3's pull (D062), for b4's bot, also while walking (the user, after b4.4); not in a moving car. `stillFor`
// counts the ticks something was in reach since the last unit: a unit every pull.ticks
/** @param {Game} g */
function pull(g) {
  g.pulling = null
  /** @type {Cell | null} */
  let c = null
  let fruit = false
  if (!g.ride?.run) {
    // the kind the ledger holds least of first (the user, b4.12), then the next; nearest within a kind; ties
    // on the ledger go ore, loot, fruit
    const r = Math.round(g.cfg.light.base * gain(g, g.botLevel))
    const L = g.ledger
    const kinds = /** @type {const} */ (['ore', 'loot', 'fruit']).slice().sort((p, q) => L[p] - L[q])
    for (const k of kinds) {
      if (k === 'fruit') {
        const f = fruitNear(g, g.ch, r)
        if (f) (c = { x: f.x, y: f.y }), (fruit = true)
      } else c = nearestValuable(/** @type {any} */ (g), g.ch, r, (t) => t === (k === 'ore' ? Tile.Ore : Tile.Loot))
      if (c) break
    }
  }
  if (!c) {
    g.stillFor = 0
    return
  }
  g.pulling = c
  if (++g.stillFor < Math.max(1, Math.round(g.cfg.pull.ticks / gain(g, g.botLevel)))) return
  g.stillFor = 0
  if (fruit) {
    pickFruit(g, c.x, c.y)
    g.ledger.fruit++
    g.pulling = null
    g.events.push({ type: 'pulled', x: c.x, y: c.y, tile: FRUIT_TILE, to: { x: g.ch.x, y: g.ch.y } })
    return
  }
  const tile = g.world.tiles[c.y * g.world.w + c.x]
  if (tile === Tile.Ore) g.ledger.ore++
  else g.ledger.loot++
  toRock(/** @type {any} */ (g), c.x, c.y)
  g.pulling = null
  g.litFor.r = -1
  g.events.push({ type: 'pulled', x: c.x, y: c.y, tile, to: { x: g.ch.x, y: g.ch.y } })
}

/** The fruit the next reach upgrade costs: upgradeCost × 2^level (b4.13). @param {Game} g */
export const nextCost = (g) => Math.max(1, g.cfg.swarm.upgradeCost) * 2 ** g.level

/** The loot the bot's next upgrade costs: botUpgradeCost × 2^botLevel (b4.15). @param {Game} g */
export const botCost = (g) => Math.max(1, g.cfg.botUpgradeCost) * 2 ** g.botLevel

/** How much bigger `level` upgrades make a mining radius and speed: (1 + upgradeGain)^level. @param {Game} g @param {number} level */
export const gain = (g, level) => (1 + g.cfg.upgradeGain) ** level

/** A pulled or dug unit that was a fruit (b4.10), not a tile. */
export const FRUIT_TILE = -1

/** The squared distance, x the short way round. @param {Game} g @param {Cell} a @param {Cell} b */
export function dist2(g, a, b) {
  let dx = Math.abs(a.x - b.x)
  dx = Math.min(dx, g.world.w - dx)
  return dx * dx + (a.y - b.y) ** 2
}

/** The bot is within `nodeReach` of node i. @param {Game} g @param {number} i */
export const near = (g, i) => dist2(g, g.map.nodes[i], g.ch) <= g.cfg.nodeReach * g.cfg.nodeReach

/** Node i shows (b4.8): before the first edge, a pod node; after it, the end of a built edge; and (b4.22) only
 * while the ledger holds the price and it has an unbuilt edge. @param {Game} g @param {number} i */
export const shown = (g, i) =>
  (g.firstBuilt ? !!g.railed[i] : !!g.net[i]) && g.ledger.ore >= g.cfg.price && g.links[i].some((k) => !g.built[k])

/** A wild bug that finds loot is tamed (b4.40, the user: "when wild bugs find a loot, they become tame"): within
 * `lootTame` px of a loot pixel in the rock, it eats it (the pixel turns to rock, Claude's call: else one loot
 * would tame every bug that passes) and leaves the world as +1 on the ledger, as the ore-fed taming does
 * (D060, b4.3). @param {Game} g */
function lootTames(g) {
  const { w, h, tiles } = g.world
  const r = Math.max(0, g.cfg.lootTame)
  g.bugs = g.bugs.filter((bug) => {
    if (bug.kind !== 'wild') return true
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const y = bug.y + dy
        const x = wrap(bug.x + dx, w)
        if (y < 0 || y >= h || dx * dx + dy * dy > r * r || tiles[y * w + x] !== Tile.Loot) continue
        toRock(/** @type {any} */ (g), x, y) // the view reads loot specks from the tiles each frame
        g.refill[bug.block] = g.tick + (g.cfg.bugs?.refillTicks ?? 300)
        g.ledger.bugs++
        g.events.push({ type: 'tamed', id: bug.id, x: bug.x, y: bug.y, slot: -1 })
        return false
      }
    return true
  })
}

/** Node i's bulb has something to offer (b4.41): a built root, or it shows (an unbuilt one, the price on the ledger). @param {Game} g @param {number} i */
export const offers = (g, i) => shown(g, i) || g.links[i].some((k) => g.built[k])

/** A node within reach whose bulb offers something takes the bot in (b4.22; since b4.41 a built root is
 * enough): it sits on the node, pointing nowhere. @param {Game} g */
function engulf(g) {
  if (g.freed !== null && !near(g, g.freed)) g.freed = null
  for (let i = 0; i < g.map.nodes.length; i++) {
    if (i === g.freed || !near(g, i) || !offers(g, i)) continue
    hold(g, i, g.move)
    return
  }
}

/** The bot held in node i's bulb. @param {Game} g @param {number} i @param {{ dx: number, dy: number } | null} cameIn */
function hold(g, i, cameIn) {
  g.engulf = i
  g.engulfAt = g.tick
  g.cameIn = cameIn
  g.move = null
  g.ch.x = g.map.nodes[i].x
  g.ch.y = g.map.nodes[i].y
  g.pos.x = g.pos.px = g.ch.x * 1000 + 500
  g.pos.y = g.pos.py = g.ch.y * 1000 + 500
  g.events.push({ type: 'engulf', node: i })
}

/** The bulb lets go (b4.41): the bot on the open pixel `ejectR` px from its centre (the ring r - 0.5 .. r + 0.5)
 * closest to the way it came in; with none that way, the lowest index. None open: it stays on the node. @param {Game} g */
function eject(g) {
  const n = /** @type {number} */ (g.engulf)
  const c = g.map.nodes[n]
  const R = Math.max(1, g.cfg.ejectR)
  const a0 = g.cameIn ? Math.atan2(g.cameIn.dy, g.cameIn.dx) : 0
  let best = null
  let bestD = Infinity
  for (let dy = -R - 1; dy <= R + 1; dy++)
    for (let dx = -R - 1; dx <= R + 1; dx++) {
      const d = Math.hypot(dx, dy)
      if (d < R - 0.5 || d > R + 0.5 || !open(g, c.x + dx, c.y + dy)) continue
      let da = g.cameIn ? Math.abs(Math.atan2(dy, dx) - a0) : 0
      if (da > Math.PI) da = 2 * Math.PI - da
      if (da < bestD) ((bestD = da), (best = { x: wrap(c.x + dx, g.world.w), y: c.y + dy }))
    }
  g.engulf = null
  g.freed = n
  g.events.push({ type: 'eject', node: n })
  if (!best) return
  g.ch.x = best.x
  g.ch.y = best.y
  g.pos.x = g.pos.px = best.x * 1000 + 500
  g.pos.y = g.pos.py = best.y * 1000 + 500
  g.litFor.r = -1
}

/** Can the edge be built from node `from` now? The reason it can't, or null. @param {Game} g @param {number} edge @param {number} from */
export function buildable(g, edge, from) {
  const e = g.map.edges[edge]
  if (!e || (e.a !== from && e.b !== from) || !g.net[from]) return 'off'
  if (g.engulf !== from) return 'far'
  if (g.built[edge]) return 'built'
  if (g.ledger.ore < g.cfg.price) return 'ore'
  return null
}

/** @param {Game} g @param {number} edge @param {number} from */
function build(g, edge, from) {
  const why = buildable(g, edge, from)
  if (why) return g.events.push({ type: 'refused', edge, reason: why })
  extend(g, edge, from)
  rideFrom(g, edge, from, null)
}

/** Out of the bulb along a built edge (b4.41): release confirms it. `want` carries the ride on through the
 * next nodes; null stops it at the next one. @param {Game} g @param {number} edge @param {number} from @param {{ dx: number, dy: number } | null} want */
function rideFrom(g, edge, from, want) {
  const e = g.map.edges[edge]
  if (g.engulf !== from || !e || !g.built[edge] || (e.a !== from && e.b !== from)) return
  const dir = e.a === from ? 1 : -1
  g.engulf = null
  g.freed = from
  g.ride = { node: from, run: { edge, i: dir === 1 ? 0 : e.path.length - 1, dir, acc: 0 }, want, stopNext: false }
  g.events.push({ type: 'board', node: from })
}

/** Edge built from node `from`, its price off the ledger: yours, or a flower bot's (b4.25). @param {Game} g @param {number} edge @param {number} from */
export function extend(g, edge, from) {
  const e = g.map.edges[edge]
  g.ledger.ore -= g.cfg.price
  g.built[edge] = 1
  g.net[e.a === from ? e.b : e.a] = 1
  g.railed[e.a] = g.railed[e.b] = 1
  g.firstBuilt = true
  g.events.push({ type: 'built', edge, from, price: g.cfg.price })
}

// Riding --------------------------------------------------------------------------------------------

/** An edge's heading is read this many px out from its node (b4.1's 3 tiles = 3 of the router's cells). */
export const HEADING = 12

/** The built edge from node `n` that fits the direction best (within 67.5°), as a run, or null. @param {Game} g @param {number} n @param {{ dx: number, dy: number }} want */
function pick(g, n, want) {
  const a0 = Math.atan2(want.dy, want.dx)
  /** @type {NonNullable<Ride['run']> | null} */
  let best = null
  let bestD = (67.5 * Math.PI) / 180 + 1e-9
  g.map.edges.forEach((e, k) => {
    if (!g.built[k] || (e.a !== n && e.b !== n)) return
    const dir = e.a === n ? 1 : -1
    const p = e.path
    const i = dir === 1 ? 0 : p.length - 1
    const j = dir === 1 ? Math.min(p.length - 1, HEADING) : Math.max(0, p.length - 1 - HEADING) // its heading
    let dx = p[j].x - p[i].x
    if (Math.abs(dx) > g.world.w / 2) dx -= Math.sign(dx) * g.world.w
    let d = Math.abs(Math.atan2(p[j].y - p[i].y, dx) - a0)
    if (d > Math.PI) d = 2 * Math.PI - d
    if (d < bestD) {
      bestD = d
      best = { edge: k, i, dir: /** @type {1 | -1} */ (dir), acc: 0 }
    }
  })
  return /** @type {NonNullable<Ride['run']> | null} */ (best) // set in the callback: tsc can't see it
}

/** Pointed while in a car. @param {Game} g @param {Ride} r @param {{ dx: number, dy: number } | null} dir */
function point(g, r, dir) {
  if (!dir) return // letting go changes nothing: the car goes on
  r.want = dir
  if (r.run) return // it turns at the next node
  r.stopNext = false
  r.run = pick(g, r.node, dir)
  if (r.run) return
  // nothing that way: out, and walk that way (nodes are never in rock, b4.3)
  g.events.push({ type: 'exit', node: r.node })
  g.ride = null
  g.move = dir
}

// A car's budget per px: 60 a straight step, 85 a diagonal (60√2); it gains rideSpeed a tick
const STEP = 60
const DIAG = 85

/** The cost of the step from path[i] to path[i + dir]. @param {Cell[]} p @param {number} i @param {number} dir */
const stepCost = (p, i, dir) => (p[i].x !== p[i + dir].x && p[i].y !== p[i + dir].y ? DIAG : STEP)

/** @param {Game} g @param {Ride} r */
function rideTick(g, r) {
  let run = r.run
  if (!run) return
  run.acc += Math.max(1, g.cfg.rideSpeed)
  for (;;) {
    const p = g.map.edges[run.edge].path
    const cost = stepCost(p, run.i, run.dir)
    if (run.acc < cost) return
    run.acc -= cost
    run.i += run.dir
    g.ch.x = p[run.i].x
    g.ch.y = p[run.i].y
    if (r.stopNext && open(g, g.ch.x, g.ch.y)) {
      // off here, mid-root (b4.38)
      g.ride = null
      g.events.push({ type: 'exit', node: r.node })
      return
    }
    if (run.i !== (run.dir === 1 ? p.length - 1 : 0)) continue
    const e = g.map.edges[run.edge]
    r.node = run.dir === 1 ? e.b : e.a
    const next = r.stopNext || !r.want ? null : pick(g, r.node, r.want)
    r.run = next
    if (!next) {
      // stopped at a node: in its bulb (b4.41)
      g.ride = null
      g.freed = null
      const back = p[run.i - run.dir] ?? p[run.i]
      let dx = p[run.i].x - back.x
      if (Math.abs(dx) > 1) dx = -Math.sign(dx)
      hold(g, r.node, { dx, dy: p[run.i].y - back.y })
      return
    }
    next.acc = run.acc // the budget carries on through the node
    run = next
  }
}

/** Where the bot is drawn between ticks: its sub-pixel position, or partway along a ride. @param {Game} g @param {number} alpha 0..1 of the next tick */
export function botAt(g, alpha) {
  const run = g.ride?.run
  if (run) {
    const p = g.map.edges[run.edge].path
    const n = p[run.i + run.dir]
    if (n) {
      const f = Math.min(1, (run.acc + alpha * g.cfg.rideSpeed) / stepCost(p, run.i, run.dir))
      let dx = n.x - g.ch.x
      if (Math.abs(dx) > 1) dx = -Math.sign(dx)
      return { x: g.ch.x + dx * f, y: g.ch.y + (n.y - g.ch.y) * f }
    }
  }
  if (g.ride) return { x: g.ch.x, y: g.ch.y }
  // walking: between last tick's position and this one's, as a pixel's top-left (the view adds 0.5)
  const p = g.pos
  let dx = p.x - p.px
  const W = g.world.w * 1000
  if (Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W
  return { x: (p.px + dx * alpha) / 1000 - 0.5, y: (p.py + (p.y - p.py) * alpha) / 1000 - 0.5 }
}

// The light (b4.3): a fixed radius, line of sight from the bot; recomputed when the bot or the rock changed
/** @param {Game} g */
function updateLight(g) {
  const r = Math.max(0, g.cfg.light.base)
  const at = g.litFor
  if (at.x === g.ch.x && at.y === g.ch.y && at.r === r) return
  g.litFor = { x: g.ch.x, y: g.ch.y, r, glows: '' }
  g.radius = r
  g.lit = sightCells(g.world, g.ch, r)
  reveal(/** @type {any} */ (g), g.lit)
}
