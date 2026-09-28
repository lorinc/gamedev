// b4.3's sim on seed 1's map: nodes never in rock, walking any angle, the ledger (building, taming), the
// swarm. The state is set by hand where playing there would take minutes.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addBug, blockOf } from '../../sim/dig/bugs.js'
import { isOpen, Tile } from '../../sim/gen/world.js'
import { buildable, command, CONFIG, createGame, HEADING, heading, shown, tick } from './game.js'
import { makeMap } from './world.js'

const MAP = makeMap(1)
const TILES = MAP.world.tiles.slice() // as made: other tests' games mine MAP
/** The map as made, with its own tiles. */
const pristine = () => ({ ...MAP, world: { ...MAP.world, tiles: TILES.slice() } })
/** A game where the bot never pulls (so the ledger moves only by what's tested). */
const fresh = () => {
  const g = createGame(MAP, JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.pull.ticks = 1e9
  return g
}
const open = (/** @type {{ x: number, y: number }} */ c) => isOpen(MAP.world.tiles[c.y * MAP.world.w + c.x])

test('the world has no loot: only lizards make it (b4.17)', () => {
  assert.equal(MAP.world.tiles.filter((t) => t === Tile.Loot).length, 0)
})

test('no node on a rail is in rock (the candidate filter)', () => {
  const used = new Set(MAP.edges.flatMap((e) => [e.a, e.b]))
  assert.ok(used.size > 300)
  for (const n of used) assert.ok(open(MAP.nodes[n]), `node ${n}`)
})

test('walking any angle: a drag at 23° glides along 23°, sub-pixel, at walkSpeed', () => {
  assert.deepEqual(heading(2, -1), { dx: 1000, dy: -500 })
  assert.equal(heading(0, 0), null)
  const g = fresh()
  const s = { x: g.pos.x, y: g.pos.y }
  const d = heading(Math.cos(0.4), -Math.sin(0.4))
  command(g, { type: 'move', dx: /** @type {any} */ (d).dx, dy: /** @type {any} */ (d).dy })
  for (let i = 0; i < 80; i++) tick(g) // 16 px at 12 px/s, before the first wall
  const dx = (g.pos.x - s.x) / 1000
  const dy = (s.y - g.pos.y) / 1000
  assert.ok(Math.abs(Math.hypot(dx, dy) - (80 * CONFIG.walkSpeed) / 60) < 0.1, `moved ${Math.hypot(dx, dy)}`)
  assert.ok(Math.abs(dy / dx - Math.tan(0.4)) < 0.01, `slope ${dy / dx}`)
  assert.equal(g.ch.x, Math.floor(g.pos.x / 1000))
})

test('the pull goes on while walking (b4.5)', () => {
  const g = createGame(MAP, JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.light.base = 20
  let walking = 0
  for (let i = 0; i < 1200; i++) {
    if (i % 200 === 0) command(g, { type: 'move', dx: i % 400 ? -1 : 1, dy: 0 })
    tick(g)
    for (const e of g.events) if (e.type === 'pulled' && g.move) walking++
    g.events.length = 0
  }
  assert.ok(walking > 0, 'pulled while walking')
})

test('the scan fires only when something within its radius is unseen (b4.6)', () => {
  const g = fresh()
  // walk down until the bot stands on rock, then point into it
  command(g, { type: 'move', dx: 0, dy: 1 })
  let scans = 0
  for (let i = 0; i < 300; i++) {
    tick(g)
    scans += g.events.filter((e) => e.type === 'scan').length
    g.events.length = 0
  }
  assert.equal(scans, 1, 'the first scan reveals everything round it; pushing on, nothing is left to find')
})

test('the scan fires the tick the bot touches rock, also sliding along it (b4.22)', () => {
  const g = fresh()
  assert.ok(!open({ x: g.ch.x, y: g.ch.y + 1 }), 'the start stands on the pod floor')
  const x0 = g.ch.x
  // down and a little right: into the floor, sliding right along it (b4.21 scanned only when fully stuck)
  command(g, { type: 'move', dx: 0.3, dy: 1 })
  let scanned = -1
  for (let i = 0; i < 30 && scanned < 0; i++) {
    tick(g)
    if (g.events.some((e) => e.type === 'scan')) scanned = g.tick
    g.events.length = 0
  }
  assert.ok(scanned > 0 && scanned <= 5, `scanned at tick ${scanned}: within the first pixel's worth of walking`)
  for (let i = 0; i < 30; i++) tick(g)
  assert.notEqual(g.ch.x, x0, 'and it slid on')
})

test('a node shows only with the price on the ledger; 2 px close it holds the bot until an edge is built (b4.22)', () => {
  const g = fresh()
  const from = MAP.podNodes.find((n) => MAP.edges.some((e) => e.a === n || e.b === n))
  assert.ok(from !== undefined)
  const edge = MAP.edges.findIndex((e) => e.a === from || e.b === from)
  const node = MAP.nodes[from]
  g.ch.x = node.x + 2
  g.ch.y = node.y
  assert.ok(open(g.ch))
  // short of the price: hidden, and it doesn't take the bot
  tick(g)
  assert.equal(shown(g, from), false)
  assert.equal(g.engulf, null)
  assert.equal(buildable(g, edge, from), 'far')
  g.ledger.ore = 12
  tick(g)
  assert.equal(g.engulf, from, 'engulfed')
  assert.deepEqual([g.ch.x, g.ch.y], [node.x, node.y], 'on the node')
  // held: walking does nothing
  command(g, { type: 'move', dx: 1, dy: 0 })
  for (let i = 0; i < 60; i++) tick(g)
  assert.deepEqual([g.ch.x, g.ch.y], [node.x, node.y])
  command(g, { type: 'build', edge, from })
  tick(g)
  assert.equal(g.built[edge], 1)
  assert.equal(g.ledger.ore, 2)
  assert.equal(g.engulf, null, 'let go')
  // short of the price again: every node hides
  for (const n of MAP.podNodes) assert.equal(shown(g, n), false)
  g.ledger.ore = 10
  // from now on only the built edge's ends show (b4.8), while they have an unbuilt edge
  const e = MAP.edges[edge]
  for (const n of MAP.podNodes) if (n !== e.a && n !== e.b) assert.equal(shown(g, n), false)
  // the node that let go doesn't take the bot again while it's still within reach
  tick(g)
  assert.equal(g.engulf, null)
})

test('a wild bug fed 16 from the ledger is +1 bug on it, and leaves the world', () => {
  const g = fresh()
  g.ledger.ore = 40
  g.refill = new Proxy({}, { get: () => 1e9 }) // no spawns: only ours
  const c = [
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1],
  ].find(([dx, dy]) => open({ x: g.ch.x + dx, y: g.ch.y + dy }))
  assert.ok(c)
  addBug(/** @type {any} */ (g), g.ch.x + c[0], g.ch.y + c[1])
  for (let i = 0; i < 16 * CONFIG.bugs.nibbleTicks + 5; i++) tick(g)
  assert.equal(g.ledger.bugs, 1)
  assert.equal(g.ledger.ore, 40 - 16)
  assert.equal(g.bugs.length, 0)
})

test('a wild bug that would bite an empty ledger asks, once per nibble time (b4.42)', () => {
  const g = fresh()
  g.ledger.ore = 0
  g.refill = new Proxy({}, { get: () => 1e9 }) // no spawns: only ours
  const c = [
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1],
  ].find(([dx, dy]) => open({ x: g.ch.x + dx, y: g.ch.y + dy }))
  assert.ok(c)
  addBug(/** @type {any} */ (g), g.ch.x + c[0], g.ch.y + c[1])
  let hungry = 0
  let nibbles = 0
  for (let i = 0; i < 4 * CONFIG.bugs.nibbleTicks; i++) {
    tick(g)
    hungry += g.events.filter((e) => e.type === 'hungry').length
    nibbles += g.events.filter((e) => e.type === 'nibble').length
    g.events.length = 0
  }
  assert.equal(nibbles, 0)
  assert.ok(hungry >= 3 && hungry <= 4, `${hungry} asks`)
  assert.equal(g.fed, 0)
})

test('a tamed bug works near the network and sends its haul to the ledger', () => {
  const g = fresh()
  g.cfg.swarm.tripTicks = 3600
  g.cfg.swarm.reach = 4
  g.cfg.swarm.upgradeCost = 1e9 // no fruit spent on upgrades here
  g.ledger.bugs = 3
  tick(g)
  assert.equal(g.swarm.length, 3)
  for (const b of g.swarm) assert.ok(open(b))
  const before = g.ledger.ore + g.ledger.loot + g.ledger.fruit
  let dug = 0
  let hauled = 0
  for (let i = 0; i < 3600; i++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'dug') dug++
      if (e.type === 'haul') hauled += e.ore + e.loot + e.fruit
    }
    g.events.length = 0
    for (const b of g.swarm) assert.ok(open(b), 'never in rock')
  }
  assert.ok(dug > 0, 'they pulled something')
  assert.equal(hauled, dug)
  assert.equal(g.ledger.ore + g.ledger.loot + g.ledger.fruit - before, hauled)
})

test('tamed bugs go for back wall not green yet: more greened than a plain random walk (b4.51)', () => {
  /** Green pixels after a minute of 6 bugs. @param {number} look */
  const greened = (look) => {
    const g = fresh()
    g.cfg.swarm.look = look
    g.cfg.worms.max = 0
    g.cfg.lizards.max = 0
    g.cfg.lichen.near = 0
    g.ledger.bugs = 6
    for (let i = 0; i < 3600; i++) tick(g)
    return g.garden.wall.reduce((a, v) => a + (v ? 1 : 0), 0)
  }
  const plain = greened(0)
  const drawn = greened(8)
  assert.ok(drawn > plain * 1.3, `greened ${drawn} vs ${plain} walking at random`)
})

test('bugs green the back wall, vines grow on green, and 12 px of vine make a fruit a minute (b4.10)', async () => {
  const { FRUIT, GREEN, VINE } = await import('./garden.js')
  const g = fresh()
  g.cfg.lichen.near = 0 // no lichen, so no fire (b4.21): this is the garden alone
  g.ledger.bugs = 10
  for (let i = 0; i < 3600; i++) tick(g)
  const wall = [...g.garden.wall]
  assert.ok(wall.filter((v) => v === GREEN).length > 200, 'green')
  assert.ok(wall.filter((v) => v === VINE || v === FRUIT).length > 5, 'vines')
  for (let i = 0; i < wall.length; i++) if (wall[i]) assert.ok(isOpen(MAP.world.tiles[i]), 'only the back wall (open pixels)')

  // the rate alone: 120 px of vine, no bugs, no worms, 5 minutes: about 50 fruit
  const h = fresh()
  h.cfg.worms.max = 0
  let n = 0
  for (let i = 0; i < h.garden.wall.length && n < 120; i++)
    if (isOpen(MAP.world.tiles[i])) {
      h.garden.wall[i] = VINE
      h.garden.vines.push(i)
      n++
    }
  for (let i = 0; i < 5 * 3600; i++) tick(h)
  const fruit = h.garden.fruit.size
  assert.ok(fruit >= 42 && fruit <= 50, `fruit ${fruit}`)
})

test('your pull takes a fruit in the light even unseen, to the ledger (b4.10)', async () => {
  const { FRUIT } = await import('./garden.js')
  const g = createGame(MAP, JSON.parse(JSON.stringify(CONFIG)))
  const { w } = MAP.world
  const c = [
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1],
  ]
    .map(([dx, dy]) => ({ x: g.ch.x + dx, y: g.ch.y + dy }))
    .find(open)
  assert.ok(c)
  const i = c.y * w + c.x
  g.garden.wall[i] = FRUIT
  g.garden.fruit.add(i)
  g.seen[i] = 0
  for (let t = 0; t < CONFIG.pull.ticks + 2; t++) tick(g)
  assert.equal(g.ledger.fruit, 1)
  assert.equal(g.garden.fruit.size, 0)
})

test('dense fruit spawns a worm; it eats 8, burrows, and curls up into 12 px of ore inside the rock (b4.12)', async () => {
  const { FRUIT } = await import('./garden.js')
  const g = fresh()
  const { w, h } = MAP.world
  // 40 fruit on the open pixels nearest the start (a breadth-first walk through open air)
  const start = g.ch.y * w + g.ch.x
  const q = [start]
  const got = new Set(q)
  for (let k = 0; k < q.length && q.length < 400; k++) {
    const x = q[k] % w
    const y = (q[k] - x) / w
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ny = y + dy
      const n = ny * w + ((x + dx + w) % w)
      if (ny < 0 || ny >= h || got.has(n) || !isOpen(MAP.world.tiles[n])) continue
      got.add(n)
      q.push(n)
    }
  }
  for (const i of q.slice(0, 40)) {
    g.garden.wall[i] = FRUIT
    g.garden.fruit.add(i)
    g.garden.vines.push(i)
  }
  /** @type {number[] | null} */
  let deposit = null
  let spawned = 0
  for (let t = 0; t < 60 * 60 * 10 && !deposit; t++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'worm') spawned++
      if (e.type === 'deposit') deposit = e.cells
    }
    g.events.length = 0
  }
  assert.ok(spawned > 0, 'a worm spawned')
  assert.ok(deposit, 'a worm curled up')
  assert.equal(deposit.length, 12)
  for (const i of deposit) {
    assert.equal(MAP.world.tiles[i], Tile.Ore)
    const x = i % w
    const y = (i - x) / w
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) assert.ok(!isOpen(MAP.world.tiles[(y + dy) * w + ((x + dx + w) % w)]), 'never at the surface')
  }
})

test('your pull goes for the kind the ledger holds least of, even when another is nearer (b4.12)', () => {
  const g = createGame(MAP, JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.worms.max = 0
  const { w } = MAP.world
  // rock pixels near the bot: the nearest becomes loot, one farther ore (both seen)
  /** @type {{ i: number, d: number }[]} */
  const rock = []
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (!isOpen(MAP.world.tiles[i]) && dx * dx + dy * dy <= 36) rock.push({ i, d: dx * dx + dy * dy })
    }
  rock.sort((p, q) => p.d - q.d)
  const loot = rock[0].i
  const ore = rock[rock.length - 1].i
  MAP.world.tiles[loot] = Tile.Loot
  MAP.world.tiles[ore] = Tile.Ore
  g.seen[loot] = g.seen[ore] = 1
  g.ledger.loot = 50
  /** @type {number | null} */
  let first = null
  for (let t = 0; t < CONFIG.pull.ticks * 2 && first === null; t++) {
    tick(g)
    const e = g.events.find((e) => e.type === 'pulled')
    if (e && e.type === 'pulled') first = e.tile
    g.events.length = 0
  }
  assert.equal(first, Tile.Ore)
})

test('fruit buys the bugs upgrades by itself: 16, 32, 64… (b4.13)', async () => {
  const { nextCost } = await import('./game.js')
  const g = fresh()
  g.cfg.worms.max = 0
  assert.equal(nextCost(g), 16)
  g.ledger.fruit = 15
  tick(g)
  assert.equal(g.level, 0)
  g.ledger.fruit = 16 + 32 + 5
  tick(g)
  assert.equal(g.level, 2)
  assert.equal(g.ledger.fruit, 5)
  assert.equal(nextCost(g), 64)
})

test('ash spawns a lizard; it licks the ash within 6 px bare, burrows, and makes 5 loot inside the rock (b4.54)', async () => {
  const { ASH } = await import('./garden.js')
  const g = fresh()
  g.cfg.worms.max = 0
  g.cfg.lichen.near = 0
  g.cfg.lizards.eat = 4
  g.cfg.lizards.near = 20
  const { w } = MAP.world
  const tiles = MAP.world.tiles
  const G = g.garden
  // ash on the back wall round the bot
  let ash = 0
  for (let dy = -20; dy <= 20; dy++)
    for (let dx = -20; dx <= 20; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (isOpen(tiles[i])) ((G.wall[i] = ASH), ash++)
    }
  assert.ok(ash > 100, `ash ${ash}`)
  let spawned = 0
  let licked = 0
  /** @type {number[] | null} */
  let loot = null
  const before = tiles.filter((t) => t === Tile.Loot).length
  for (let t = 0; t < 60 * 60 * 10 && !loot; t++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'lizard') spawned++
      if (e.type === 'licked') {
        licked++
        assert.equal(G.wall[e.y * w + e.x], 0, 'the ash it licked is bare wall')
        let dx = Math.abs(e.x - e.to.x)
        dx = Math.min(dx, w - dx)
        assert.ok(dx * dx + (e.y - e.to.y) ** 2 <= 36, 'within 6 px')
      }
      if (e.type === 'deposit' && tiles[e.cells[0]] === Tile.Loot) loot = e.cells
    }
    g.events.length = 0
    for (const z of g.lizards) if (z.eaten < 4) assert.ok(isOpen(tiles[z.body[0].y * w + z.body[0].x]), 'on the surface')
  }
  assert.ok(spawned > 0 && licked >= 4, `spawned ${spawned}, licked ${licked}`)
  assert.ok(loot, 'burrowed')
  assert.equal(loot.length, 5)
  for (const c of loot) {
    const x = c % w
    const y = (c - x) / w
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) assert.ok(!isOpen(tiles[(y + dy) * w + ((x + dx + w) % w)]), 'inside the rock')
  }
  assert.equal(tiles.filter((t) => t === Tile.Loot).length, before + 5)
})

test('a lizard dashes off the wall for ash in the middle of a cave, licks it, and runs straight back (b4.55)', async () => {
  const { ASH } = await import('./garden.js')
  const { OPEN } = await import('./world.js')
  const g = fresh()
  g.cfg.worms.max = 0
  g.cfg.lichen.near = 0
  g.cfg.lizards.max = 0 // only ours
  const { w, h } = MAP.world
  const tiles = MAP.world.tiles
  const solidWithin = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r && !isOpen(tiles[(y + dy) * w + ((x + dx + w) % w)])) return true
    return false
  }
  // an open pixel 9–14 px from the nearest rock, near the start
  let mid = null
  for (let r = 0; r < 200 && !mid; r++)
    for (let dy = -r; dy <= r && !mid; dy++)
      for (let dx = -r; dx <= r && !mid; dx++) {
        const x = (g.ch.x + dx + w) % w
        const y = g.ch.y + dy
        if (y > 20 && y < h - 20 && MAP.kind[y * w + x] === OPEN && !solidWithin(x, y, 9) && solidWithin(x, y, 14)) mid = { x, y }
      }
  assert.ok(mid, 'a cave with a middle')
  const m = /** @type {{ x: number, y: number }} */ (mid)
  const i0 = m.y * w + m.x
  g.garden.wall[i0] = ASH
  // a lizard on the nearest wall pixel
  let at = null
  for (let r = 1; r <= 14 && !at; r++)
    for (let dy = -r; dy <= r && !at; dy++)
      for (let dx = -r; dx <= r && !at; dx++) {
        const x = (m.x + dx + w) % w
        const y = m.y + dy
        if (isOpen(tiles[y * w + x]) && solidWithin(x, y, 1)) at = { x, y }
      }
  assert.ok(at)
  const a = /** @type {{ x: number, y: number }} */ (at)
  g.lizards.push({ body: [a, { ...a }, { ...a }], dir: 0, zip: 0, movedAt: 0, restUntil: 0, mineAt: 0, eaten: 0, site: null, lookedAt: -1e9, route: [] })
  let off = 0
  let lickedAt = -1
  let back = -1
  for (let t = 0; t < 1200 && back < 0; t++) {
    tick(g)
    const z = g.lizards[0]
    const hd = z.body[0]
    if (!solidWithin(hd.x, hd.y, 1)) off++
    if (g.events.some((e) => e.type === 'licked')) lickedAt = g.tick
    if (lickedAt > 0 && solidWithin(hd.x, hd.y, 1)) back = g.tick
    g.events.length = 0
  }
  assert.ok(off > 0, 'it left the wall')
  assert.ok(lickedAt > 0, 'it licked the ash')
  assert.equal(g.garden.wall[i0], 0)
  assert.ok(back > 0 && back - lickedAt < 600, `back on the wall ${back - lickedAt} ticks after`)
})

test('loot buys the lizards upgrades by itself: 16, 32, 64…, each their reach +20% (b4.56)', async () => {
  const { lizardCost, gain } = await import('./game.js')
  const g = fresh()
  g.ledger.loot = 16 + 32 + 3
  tick(g)
  assert.equal(g.lizardLevel, 2)
  assert.equal(g.ledger.loot, 3)
  assert.equal(lizardCost(g), 64)
  assert.equal(Math.round(CONFIG.lizards.reach * gain(g, 2)), 9) // 6 px → 9
  assert.equal(g.radius, CONFIG.light.base, 'your light stays')
})

test('the bug level grows your light, mining radius and mining speed (b4.56)', () => {
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.swarm.upgradeCost = 1
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  const { w } = g.world
  // ore in the rock 9–12 px out: beyond the light at level 0, within it at level 2
  let planted = 0
  for (let dy = -12; dy <= 12; dy++)
    for (let dx = -12; dx <= 12; dx++) {
      const d = dx * dx + dy * dy
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (d > 81 && d <= 144 && !isOpen(g.world.tiles[i])) ((g.world.tiles[i] = Tile.Ore), (g.seen[i] = 1), planted++)
    }
  assert.ok(planted > 20, `planted ${planted}`)
  /** Units pulled in `n` ticks. @param {number} n */
  const pulls = (n) => {
    let k = 0
    for (let i = 0; i < n; i++) {
      tick(g)
      k += g.events.filter((e) => e.type === 'pulled').length
      g.events.length = 0
    }
    return k
  }
  assert.equal(pulls(300), 0, 'out of reach at level 0')
  assert.equal(g.radius, 8)
  g.ledger.fruit = 1 + 2 // two bug levels
  const got = pulls(600)
  assert.equal(g.level, 2)
  assert.equal(g.radius, 12, 'light 8 px → 12')
  // a unit every 60 / 1.44 ≈ 42 ticks: 14 in 10 s (60 ticks: 10)
  assert.ok(got >= 13, `pulled ${got} in 10 s`)
})

test('a large area of cover grows a purple lichen patch of 6–8 surface pixels with a leaf (b4.23)', async () => {
  const { GREEN } = await import('./garden.js')
  const g = fresh()
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 20
  g.cfg.lichen.spark = 1e9 // no fire here
  g.cfg.lootTame = 0 // no bugs tamed by the loot (b4.40): they'd green the wall
  const { w } = MAP.world
  // loot alone no longer does it (b4.15's trigger)
  for (let dy = -20; dy <= 20; dy += 3)
    for (let dx = -20; dx <= 20; dx += 3) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (!isOpen(MAP.world.tiles[i])) MAP.world.tiles[i] = Tile.Loot
    }
  for (let t = 0; t < 60 * 60; t++) tick(g)
  assert.equal(g.lichen.patches.length, 0, 'loot: nothing')
  // the cave round the bot green, as the bugs would leave it
  let n = 0
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (isOpen(MAP.world.tiles[i])) (g.garden.wall[i] = GREEN), n++
    }
  assert.ok(n > 300)
  for (let t = 0; t < 60 * 60 && !g.lichen.patches.length; t++) tick(g)
  assert.ok(g.lichen.patches.length > 0, 'a patch')
  const p = g.lichen.patches[0]
  assert.ok(p.cells.length >= 6 && p.cells.length <= 8, `${p.cells.length} px`)
  for (const i of p.cells) assert.ok(isOpen(MAP.world.tiles[i]), 'on the cave wall (open pixels)')
  assert.ok(p.leaf.length <= 4)
  for (const i of p.leaf) assert.ok(isOpen(MAP.world.tiles[i]) && !p.cells.includes(i), 'the leaf: its own pixels, in the air')
})

test('a lichen by the cover sparks once: the fire eats all the connected cover, leaving r 2–3 ash discs 8–12 px apart (b4.21, b4.35)', async () => {
  const { ASH, BURN, FRUIT, GREEN, VINE, cover, greenAround } = await import('./garden.js')
  const { WITHERED_PX } = await import('./lichen.js')
  // the fire spreads by chance: on the map as made, not one earlier tests' bugs have mined
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.pull.ticks = 1e9
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.spark = 1
  g.cfg.lichen.checkTicks = 1
  const { w } = MAP.world
  const G = g.garden
  // green the open pixels within 30 px of the bot, a vine and a fruit in every 10th
  let n = 0
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (!isOpen(MAP.world.tiles[i])) continue
      G.wall[i] = n % 10 === 0 ? VINE : n % 10 === 5 ? FRUIT : GREEN
      if (G.wall[i] !== GREEN) G.vines.push(i)
      if (G.wall[i] === FRUIT) G.fruit.add(i)
      n++
    }
  assert.ok(n > 300, `cover ${n}`)
  const at = g.ch.y * w + g.ch.x
  // the cover 8-connected to the lichen: all of it burns
  const linked = new Set([at])
  for (const i of linked)
    for (const [sx, sy] of [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ]) {
      const j = i + sy * w + sx
      if (G.wall[j] && !linked.has(j)) linked.add(j)
    }
  const leaf = at + 1
  g.lichen.on[at] = 1
  g.lichen.on[leaf] = 2
  g.lichen.patches.push({ cells: [at], leaf: [leaf], sparked: false })
  tick(g)
  assert.ok(g.lichen.patches[0].sparked, 'sparked')
  assert.equal(g.lichen.on[leaf], WITHERED_PX, 'the leaf withers')
  assert.equal(g.lichen.on[at], 1, 'the purple stays')
  for (let k = 0; k < 3600 && G.burning.length; k++) tick(g)
  assert.equal(G.burning.length, 0, 'the fire went out')
  assert.ok(!G.wall.some((v) => v === BURN))
  assert.ok(linked.size > 300, `linked ${linked.size}`)
  // it spreads by chance (b4.37): a stray pixel may be left
  const left = [...linked].filter((i) => cover(G.wall[i])).length
  assert.ok(left <= linked.size / 50, `the connected cover burned: ${left} of ${linked.size} left`)
  assert.equal(G.fruit.size, [...G.wall].filter((v) => v === FRUIT).length)
  for (const i of G.vines) assert.ok(G.wall[i] === VINE || G.wall[i] === FRUIT)
  const centres = [...G.centres.values()].flat()
  assert.ok(centres.length >= 4, `discs ${centres.length}`)
  const d = (/** @type {number} */ a, /** @type {number} */ b) => Math.hypot((a % w) - (b % w), Math.floor(a / w) - Math.floor(b / w))
  for (const a of centres) for (const b of centres) if (a !== b) assert.ok(d(a, b) >= 8, 'discs 8+ apart')
  const ash = [...G.wall.keys()].filter((i) => G.wall[i] === ASH)
  assert.ok(ash.length > 3 * centres.length)
  for (const i of ash) assert.ok(centres.some((c) => d(i, c) <= 3), 'ash only in a disc of r 2–3 (b4.35)')
  // ash is permanent; the lichen never sparks again
  greenAround(g, ash[0] % w, Math.floor(ash[0] / w))
  assert.equal(G.wall[ash[0]], ASH)
  const bare = [...G.wall.keys()].find((i) => i !== at && isOpen(MAP.world.tiles[i]) && !G.wall[i] && d(i, at) <= 1)
  if (bare !== undefined) {
    G.wall[bare] = GREEN
    for (let k = 0; k < 60; k++) tick(g)
    assert.equal(G.wall[bare], GREEN, 'no second spark')
  }
})

test('no lizard spawns in a small enclosure: its cave holds at least `room` open px (b4.22)', () => {
  const { w, h, tiles } = MAP.world
  /** The open px 8-connected to (x, y). @param {number} x @param {number} y */
  const cave = (x, y) => {
    const got = new Set([y * w + x])
    for (const i of got) {
      const cx = i % w
      const cy = (i - cx) / w
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const j = (cy + dy) * w + ((cx + dx + w) % w)
          if (cy + dy >= 0 && cy + dy < h && isOpen(tiles[j])) got.add(j)
        }
    }
    return got.size
  }
  for (const room of [400, 1e6]) {
    const g = fresh()
    g.cfg.worms.max = 0
    g.cfg.lizards.density = 3
    g.cfg.lizards.near = 64
    g.cfg.lizards.eat = 1e9 // they only mine: the rock stays as it is
    g.cfg.lizards.room = room
    const sizes = []
    for (let t = 0; t < 60 * 60 * 5; t++) {
      tick(g)
      for (const e of g.events) if (e.type === 'lizard') sizes.push(cave(e.x, e.y))
      g.events.length = 0
    }
    if (room === 1e6) assert.equal(sizes.length, 0, 'no cave is that big')
    else {
      assert.ok(sizes.length > 0, 'some spawned')
      for (const s of sizes) assert.ok(s >= room, `a cave of ${s} px`)
    }
  }
})

test('a root built from a bulb is ridden to the far end, no cart (b4.23, b4.41)', () => {
  const g = fresh()
  const from = MAP.podNodes.find((n) => MAP.edges.some((e) => e.a === n || e.b === n))
  assert.ok(from !== undefined)
  const edge = MAP.edges.findIndex((e) => e.a === from || e.b === from)
  const e = MAP.edges[edge]
  const node = MAP.nodes[from]
  g.ch.x = node.x + 1
  g.ch.y = node.y
  g.ledger.ore = 10
  tick(g)
  assert.equal(g.engulf, from)
  command(g, { type: 'build', edge, from })
  tick(g)
  assert.equal(g.built[edge], 1)
  // along the root, from where the bot stands (on the node)
  const p = e.a === from ? e.path : [...e.path].reverse()
  const q = p[Math.min(HEADING, p.length - 1)]
  let dx = q.x - p[0].x
  if (Math.abs(dx) > MAP.world.w / 2) dx -= Math.sign(dx) * MAP.world.w
  const d = /** @type {{ dx: number, dy: number }} */ (heading(dx, q.y - p[0].y))
  command(g, { type: 'move', dx: d.dx, dy: d.dy })
  tick(g)
  assert.ok(g.ride, 'riding')
  const far = MAP.nodes[e.a === from ? e.b : e.a]
  for (let i = 0; i < 600 && g.ride?.run; i++) tick(g)
  assert.deepEqual([g.ch.x, g.ch.y], [far.x, far.y], 'at the far end')
})

test('1 in 8 ash discs grows a flower; after 2 minutes it becomes a bot that clears its ash, builds 3 edges on the network, and pops (b4.25)', async () => {
  const { ASH, GREEN, ignite } = await import('./garden.js')
  const g = fresh()
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 0 // no lichen of its own
  g.cfg.flowers.buildGap = 60
  g.cfg.flowers.chance = 1
  const { w } = MAP.world
  const G = g.garden
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (isOpen(MAP.world.tiles[i])) G.wall[i] = GREEN
    }
  ignite(g, g.ch.y * w + g.ch.x, () => 0)
  for (let k = 0; k < 3600 && (G.burning.length || G.discs.length); k++) tick(g)
  assert.equal(G.discs.length, 0, 'every disc done')
  const discs = [...G.centres.values()].flat().length
  const n = g.flowers.length
  assert.ok(n > 0 && n <= discs / 2, `${n} flowers on ${discs} discs: 1 in 8 (b4.29)`)
  for (const f of g.flowers) assert.equal(G.wall[f.y * w + f.x], ASH, 'on the ash')
  g.ledger.ore = 1000
  const f0 = g.flowers[0]
  let bloom = 0
  let poof = 0
  let built = 0
  for (let k = 0; k < 7200 + 60 * 60 && !poof; k++) {
    const railed = g.railed.slice()
    const firstBuilt = g.firstBuilt
    tick(g)
    for (const e of g.events) {
      if (e.type === 'bloom') bloom++
      if (e.type === 'poof') poof++
      if (e.type === 'built') {
        built++
        // into new nodes only, at the network's rim (b4.33)
        const ed = MAP.edges[e.edge]
        const far = ed.a === e.from ? ed.b : ed.a
        if (firstBuilt) assert.equal(railed[far], 0, 'a new node')
      }
    }
    g.events.length = 0
    if (bloom && k < 7300) assert.notEqual(G.wall[f0.y * w + f0.x], ASH, 'its ash went')
  }
  assert.equal(bloom, n, 'every flower bloomed')
  assert.ok(poof >= 1, 'a bot popped')
  assert.ok(built >= 3, `built ${built}`)
  assert.equal(g.ledger.ore, 1000 - built * g.cfg.price)
})

test('a bulb lets the bot go after 1.5 s with nothing built; it takes it again only after it left (b4.26)', () => {
  const g = fresh()
  const from = MAP.podNodes.find((n) => MAP.edges.some((e) => e.a === n || e.b === n))
  assert.ok(from !== undefined)
  const node = MAP.nodes[from]
  g.ch.x = node.x + 1
  g.ch.y = node.y
  g.ledger.ore = 10
  tick(g)
  assert.equal(g.engulf, from)
  const at = g.tick
  let eject = -1
  for (let i = 0; i < 400 && eject < 0; i++) {
    tick(g)
    if (g.events.some((e) => e.type === 'eject')) eject = g.tick
    g.events.length = 0
  }
  assert.equal(eject - at, 90, 'after 1.5 s')
  assert.equal(g.engulf, null)
  // put on an open pixel 5 px out (b4.41)
  assert.ok(open(g.ch), 'open')
  assert.ok(Math.abs(Math.hypot(g.ch.x - node.x, g.ch.y - node.y) - 5) <= 0.5, `5 px out: ${g.ch.x - node.x}, ${g.ch.y - node.y}`)
  assert.equal(g.pos.x, g.ch.x * 1000 + 500, 'glides on from there')
  for (let i = 0; i < 30; i++) tick(g)
  assert.equal(g.engulf, null, 'standing there, not taken again')
  // back: taken again
  g.pos.x = g.pos.px = (node.x + 1) * 1000 + 500
  g.pos.y = g.pos.py = node.y * 1000 + 500
  g.ch.x = node.x + 1
  g.ch.y = node.y
  tick(g)
  assert.equal(g.engulf, from)
})

test('a bulb puts the bot out the way it came in (b4.41)', () => {
  const g = fresh()
  const from = MAP.podNodes.find((n) => MAP.edges.some((e) => e.a === n || e.b === n))
  assert.ok(from !== undefined)
  const node = MAP.nodes[from]
  g.ch.x = node.x + 1
  g.ch.y = node.y
  g.ledger.ore = 10
  g.move = { dx: -1000, dy: 0 } // walking left, into it
  tick(g)
  assert.equal(g.engulf, from)
  for (let i = 0; i < 200 && g.engulf !== null; i++) tick(g)
  assert.ok(g.ch.x < node.x, `out on the left: ${g.ch.x - node.x}, ${g.ch.y - node.y}`)
})

test('held in a bulb: a built root is ridden, an unbuilt one built and ridden; a ride that stops is back in a bulb (b4.41)', () => {
  const g = fresh()
  const from = MAP.podNodes.find((n) => MAP.edges.some((e) => e.a === n || e.b === n))
  assert.ok(from !== undefined)
  const edge = MAP.edges.findIndex((e) => e.a === from || e.b === from)
  const e = MAP.edges[edge]
  const far = e.a === from ? e.b : e.a
  const node = MAP.nodes[from]
  g.ch.x = node.x + 1
  g.ch.y = node.y
  g.ledger.ore = 10
  tick(g)
  command(g, { type: 'build', edge, from })
  tick(g)
  assert.equal(g.built[edge], 1)
  assert.ok(g.ride, 'built and riding it')
  for (let i = 0; i < 1200 && g.ride; i++) tick(g)
  assert.equal(g.engulf, far, 'stopped at the far end, in its bulb')
  assert.deepEqual([g.ch.x, g.ch.y], [MAP.nodes[far].x, MAP.nodes[far].y])
  // no ore now: the far bulb still offers the built root back
  command(g, { type: 'ride', edge, from: far, dx: 0, dy: 0 })
  tick(g)
  assert.ok(g.ride, 'riding back')
  for (let i = 0; i < 1200 && g.ride; i++) tick(g)
  assert.equal(g.engulf, from, 'back in the first bulb')
})

test('a vine touching ash makes fruit 10 times as fast (b4.33)', async () => {
  const { ASH, VINE } = await import('./garden.js')
  /** Fruit made in a minute by 60 px of vine, with or without ash beside each. @param {boolean} ash */
  const fruit = (ash) => {
    const g = fresh()
    g.cfg.worms.max = 0
    g.cfg.lizards.max = 0
    g.cfg.lichen.near = 0
    const { w } = MAP.world
    let n = 0
    for (let i = w; i < g.garden.wall.length - 1 && n < 60; i++) {
      if (!isOpen(MAP.world.tiles[i]) || !isOpen(MAP.world.tiles[i + 1]) || g.garden.wall[i] || g.garden.wall[i + 1]) continue
      g.garden.wall[i] = VINE
      g.garden.vines.push(i)
      if (ash) g.garden.wall[i + 1] = ASH
      n++
      i++
    }
    for (let t = 0; t < 3600; t++) tick(g)
    return g.garden.fruit.size
  }
  const plain = fruit(false)
  const hyper = fruit(true)
  assert.ok(plain >= 3 && plain <= 7, `plain ${plain}`) // 60 px / 12 = 5 a minute
  assert.ok(hyper >= 38 && hyper <= 52, `next to ash ${hyper}`) // ×10, less the pixels already holding one
})

test('a tamed bug starts its next trip at the network node with the fewest other bugs round it (b4.34)', () => {
  const { w } = MAP.world
  const d2 = (/** @type {{x: number, y: number}} */ a, /** @type {{x: number, y: number}} */ b) => {
    const dx = Math.min(Math.abs(a.x - b.x), w - Math.abs(a.x - b.x))
    return dx * dx + (a.y - b.y) ** 2
  }
  // two network nodes far apart; 11 bugs at work round the first
  const A = MAP.podNodes[0]
  const B = MAP.nodes.findIndex((n) => d2(n, MAP.nodes[A]) > 100 ** 2)
  for (let run = 0; run < 8; run++) {
    const g = fresh()
    g.cfg.lichen.near = 0
    g.net.fill(0)
    g.net[A] = g.net[B] = 1
    g.ledger.bugs = 11
    for (let k = 0; k < 11; k++) {
      g.swarm.push({ ...MAP.nodes[A], from: MAP.nodes[A], movedAt: 0, dir: 0, until: 1e9, target: null, pullFor: 0, ore: 0, loot: 0, fruit: 0 })
    }
    for (let t = 0; t < run; t++) tick(g) // a different tick: a different random draw
    // a 12th whose trip ends now
    g.ledger.bugs = 12
    g.swarm.push({ ...MAP.nodes[A], from: MAP.nodes[A], movedAt: 0, dir: 0, until: g.tick + 1, target: null, pullFor: 0, ore: 0, loot: 0, fruit: 0 })
    tick(g)
    assert.ok(d2(g.swarm[11], MAP.nodes[B]) <= g.cfg.swarm.spawn ** 2, 'its next trip starts at the empty node')
  }
})

test('a tamed bug on its next trip prefers a network node with no vine round it, even over a less crowded one (b4.36)', async () => {
  const { VINE } = await import('./garden.js')
  const { w } = MAP.world
  const d2 = (/** @type {{x: number, y: number}} */ a, /** @type {{x: number, y: number}} */ b) => {
    const dx = Math.min(Math.abs(a.x - b.x), w - Math.abs(a.x - b.x))
    return dx * dx + (a.y - b.y) ** 2
  }
  const A = MAP.podNodes[0]
  const B = MAP.nodes.findIndex((n) => d2(n, MAP.nodes[A]) > 100 ** 2)
  for (let run = 0; run < 8; run++) {
    const g = fresh()
    g.cfg.lichen.near = 0
    g.net.fill(0)
    g.net[A] = g.net[B] = 1
    // a vine by A; the other bugs all at B
    const v = MAP.nodes[A].y * w + MAP.nodes[A].x
    g.garden.wall[v] = VINE
    g.garden.vines.push(v)
    g.ledger.bugs = 5
    for (let k = 0; k < 5; k++)
      g.swarm.push({ ...MAP.nodes[B], from: MAP.nodes[B], movedAt: 0, dir: 0, until: 1e9, target: null, pullFor: 0, ore: 0, loot: 0, fruit: 0 })
    for (let t = 0; t < run; t++) tick(g)
    // a 6th whose trip ends now
    g.ledger.bugs = 6
    g.swarm.push({ ...MAP.nodes[A], from: MAP.nodes[A], movedAt: 0, dir: 0, until: g.tick + 1, target: null, pullFor: 0, ore: 0, loot: 0, fruit: 0 })
    tick(g)
    assert.ok(d2(g.swarm[5], MAP.nodes[B]) <= g.cfg.swarm.spawn ** 2, 'its next trip starts away from the vine')
  }
})

test('a just-tamed bug starts near you (b4.49)', () => {
  for (let run = 0; run < 8; run++) {
    const g = fresh()
    for (let t = 0; t < run; t++) tick(g)
    g.ledger.bugs = 1
    tick(g)
    assert.equal(g.swarm.length, 1)
    const b = g.swarm[0]
    assert.ok((b.x - g.ch.x) ** 2 + (b.y - g.ch.y) ** 2 <= g.cfg.swarm.spawn ** 2, `near you: ${b.x - g.ch.x}, ${b.y - g.ch.y}`)
    assert.ok(open(b))
  }
})

test('ash sends out grey worms that snake towards the unexplored, lift the fog for good, and are gone after 12 s (b4.37)', async () => {
  const { GREEN, ignite } = await import('./garden.js')
  const { OPEN, ROCK } = await import('./world.js')
  const g = fresh()
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 0
  g.cfg.ashworms.chance = 1 // every disc, here
  const { w } = MAP.world
  const G = g.garden
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (isOpen(MAP.world.tiles[i])) G.wall[i] = GREEN
    }
  ignite(g, g.ch.y * w + g.ch.x, () => 0)
  let spawned = 0
  let gone = 0
  let seen0 = -1
  for (let k = 0; k < 3600 && (spawned === 0 || g.ashworms.length); k++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'ashworm') {
        spawned++
        if (seen0 < 0) seen0 = g.seen.reduce((a, b) => a + b, 0)
      }
      if (e.type === 'ashwormGone') gone++
    }
    g.events.length = 0
    for (const z of g.ashworms) {
      const k2 = MAP.kind[z.body[0].y * w + z.body[0].x]
      assert.ok(k2 === ROCK || k2 === OPEN, 'in rock or cave, never the sheet, the sea or space')
      assert.ok(g.tick - z.born <= 720)
    }
  }
  assert.ok(spawned > 0, 'worms came out')
  assert.equal(gone, spawned, 'all gone')
  const seen1 = g.seen.reduce((a, b) => a + b, 0)
  assert.ok(seen1 - seen0 > 500 * Math.min(spawned, 1), `the fog lifted: ${seen1 - seen0} px more seen`)
})

test('an ash worm with nothing unseen near bursts into a pink on the ledger (b4.45)', () => {
  const g = fresh()
  g.seen.fill(1)
  g.ashworms.push({ body: [{ x: g.ch.x, y: g.ch.y }], target: null, born: g.tick + 1, steps: 0 })
  tick(g)
  assert.equal(g.ashworms.length, 0)
  assert.equal(g.ledger.pink, 1)
  assert.ok(g.events.some((e) => e.type === 'ashwormBurst'))
})

test('a tap while riding gets you off at the next open pixel, mid-root (b4.38)', () => {
  const g = fresh()
  const from = MAP.podNodes.find((n) => MAP.edges.some((e) => e.a === n || e.b === n))
  assert.ok(from !== undefined)
  const edge = MAP.edges.findIndex((e) => e.a === from || e.b === from)
  const e = MAP.edges[edge]
  const node = MAP.nodes[from]
  g.ch.x = node.x + 1
  g.ch.y = node.y
  g.ledger.ore = 10
  tick(g)
  assert.equal(g.engulf, from)
  command(g, { type: 'build', edge, from })
  tick(g)
  assert.equal(g.built[edge], 1)
  // along the root, from where the bot stands (on the node)
  const p = e.a === from ? e.path : [...e.path].reverse()
  const q = p[Math.min(HEADING, p.length - 1)]
  let dx = q.x - p[0].x
  if (Math.abs(dx) > MAP.world.w / 2) dx -= Math.sign(dx) * MAP.world.w
  const d = /** @type {{ dx: number, dy: number }} */ (heading(dx, q.y - p[0].y))
  command(g, { type: 'move', dx: d.dx, dy: d.dy })
  tick(g)
  assert.ok(g.ride, 'riding')
  const far = MAP.nodes[e.a === from ? e.b : e.a]
  for (let i = 0; i < 6; i++) tick(g) // a few px along
  assert.ok(g.ride?.run, 'on its way')
  command(g, { type: 'tap' })
  for (let i = 0; i < 600 && g.ride; i++) tick(g)
  assert.equal(g.ride, null, 'off')
  assert.ok(open(g.ch), 'in open air')
  const k = p.findIndex((c) => c.x === g.ch.x && c.y === g.ch.y)
  assert.ok(k > 0, 'on the root')
  if (p.slice(1, -1).some((c) => open(c))) assert.notDeepEqual([g.ch.x, g.ch.y], [far.x, far.y], 'before the far end')
})

test('a wild bug that finds loot eats it and is tamed: +1 bug on the ledger (b4.40)', () => {
  const g = fresh()
  const { w } = MAP.world
  // a wild bug in the open, loot in the rock beside it
  let at = -1
  for (let i = w * 200; i < MAP.world.tiles.length && at < 0; i++)
    if (isOpen(MAP.world.tiles[i]) && MAP.world.tiles[i + 1] === Tile.Soft) at = i
  assert.ok(at >= 0)
  const x = at % w
  const y = Math.floor(at / w)
  g.bugs.length = 0
  addBug(/** @type {any} */ (g), x, y)
  const bug = g.bugs[0]
  bug.block = blockOf(/** @type {any} */ (g), x, y) // its own fog block, so b3's code keeps it
  const before = MAP.world.tiles[at + 1]
  MAP.world.tiles[at + 1] = Tile.Loot
  const bugs0 = g.ledger.bugs
  g.cfg.bugs.moveTicks = 1e9
  tick(g)
  assert.equal(g.ledger.bugs, bugs0 + 1, 'tamed')
  assert.ok(!g.bugs.includes(bug), 'gone from the world')
  assert.notEqual(MAP.world.tiles[at + 1], Tile.Loot, 'the loot eaten')
  MAP.world.tiles[at + 1] = before
})

test('16 built nodes bring a mega beast: 5 s after its warning it eats a bulb near you, its roots go, 24 drops settle in pools (b4.59)', async () => {
  const { extend } = await import('./game.js')
  const { builtNodes } = await import('./beasts.js')
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.pull.ticks = 1e9
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 0
  g.cfg.beasts.everyTicks = 600
  const { w } = g.world
  // grow the network from the pod, nearest edges first, to 17 built nodes
  g.ledger.ore = 10000
  while (builtNodes(g) < 17) {
    let best = -1
    let bd = Infinity
    MAP.edges.forEach((e, k) => {
      if (g.built[k] || (!g.net[e.a] && !g.net[e.b]) || (g.net[e.a] && g.net[e.b])) return
      const n = MAP.nodes[g.net[e.a] ? e.b : e.a]
      const d = (n.x - g.ch.x) ** 2 + (n.y - g.ch.y) ** 2
      if (d < bd) ((bd = d), (best = k))
    })
    assert.ok(best >= 0)
    const e = MAP.edges[best]
    extend(g, best, g.net[e.a] ? e.a : e.b)
  }
  /** @type {any[]} */
  const seen = []
  for (let t = 0; t < 1200 && !seen.some((e) => e.type === 'beastAte'); t++) {
    tick(g)
    for (const e of g.events) if (e.type.startsWith('beast')) seen.push({ ...e, tick: g.tick })
    g.events.length = 0
  }
  const joined = seen.find((e) => e.type === 'beast')
  const coming = seen.find((e) => e.type === 'beastComing')
  const ate = seen.find((e) => e.type === 'beastAte')
  assert.ok(joined && coming && ate, seen.map((e) => e.type).join(' '))
  assert.equal(g.beasts.length, 1)
  assert.equal(ate.tick - coming.tick, g.cfg.beasts.warnTicks, '5 s of warning')
  assert.equal(ate.node, coming.node)
  assert.ok((MAP.nodes[ate.node].x - g.ch.x) ** 2 + (MAP.nodes[ate.node].y - g.ch.y) ** 2 <= 50 ** 2, 'near you')
  assert.ok(!MAP.podNodes.includes(ate.node), 'not a pod node')
  assert.equal(g.railed[ate.node], 0, 'the bulb is gone')
  for (const k of g.links[ate.node]) assert.equal(g.built[k], 0, 'and its roots')
  // the drops: 24, each resting on rock or on another drop
  assert.equal(g.ledger.liquid, 24)
  const wet = [...g.liquid.keys()].filter((i) => g.liquid[i])
  assert.equal(wet.length, 24)
  for (const i of wet) {
    assert.ok(isOpen(g.world.tiles[i]), 'in the air')
    const below = i + w
    assert.ok(!isOpen(g.world.tiles[below]) || g.liquid[below], 'resting')
  }
  assert.equal(ate.paths.length, 24)
})

test('a worm tunnels through rock to a fruit in the next cave (b4.60)', async () => {
  const { FRUIT } = await import('./garden.js')
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.pull.ticks = 1e9
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 0
  g.cfg.worms.checkTicks = 1e9 // no spawns: only ours
  const { w } = g.world
  const tiles = g.world.tiles
  // an open pixel with rock 3 px under it and open again 8 px under it: two caves
  let a = null
  for (let y = 30; y < g.world.h - 30 && !a; y++)
    for (let x = 0; x < w && !a; x++)
      if (isOpen(tiles[y * w + x]) && !isOpen(tiles[(y + 3) * w + x]) && isOpen(tiles[(y + 8) * w + x])) a = { x, y }
  assert.ok(a)
  const A = /** @type {{ x: number, y: number }} */ (a)
  const f = (A.y + 8) * w + A.x
  g.garden.wall[f] = FRUIT
  g.garden.fruit.add(f)
  g.worms.push({ body: Array.from({ length: 12 }, () => ({ ...A })), eaten: 0, movedAt: 0, lookedAt: -1e9, site: null })
  let inRock = false
  for (let t = 0; t < 20 * 40 && !g.worms[0]?.eaten; t++) {
    tick(g)
    const hd = g.worms[0]?.body[0]
    if (hd && !isOpen(tiles[hd.y * w + hd.x])) inRock = true
  }
  assert.ok(inRock, 'through the rock')
  assert.equal(g.worms[0]?.eaten, 1, 'ate the fruit')
})
