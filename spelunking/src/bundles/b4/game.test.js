// b4.3's sim on seed 1's map: nodes never in rock, walking any angle, the ledger (building, taming), the
// swarm. The state is set by hand where playing there would take minutes.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addBug, blockOf } from '../../sim/dig/bugs.js'
import { isOpen, Tile } from '../../sim/gen/world.js'
import { buildable, command, CONFIG, createGame, HEADING, heading, shown, tick } from './game.js'
import { CRYSTAL, makeMap } from './world.js'

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

test('the world has no crystals: only lizards make it (b4.17)', () => {
  assert.equal(MAP.world.tiles.filter((t) => t === CRYSTAL).length, 0)
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

test('a wild bug fed 1 from the ledger is +1 bug on it, and leaves the world (b4.70; 16 until b4.69)', () => {
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
  for (let i = 0; i < CONFIG.bugs.nibbleTicks + 5; i++) tick(g)
  assert.equal(g.ledger.bugs, 1)
  assert.equal(g.ledger.ore, 40 - 1)
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
  g.cfg.gas.perMoss = 0 // moss for free here, as before b4.69 (gas has its own test)
  g.ledger.bugs = 3
  tick(g)
  assert.equal(g.swarm.length, 3)
  for (const b of g.swarm) assert.ok(open(b))
  const before = g.ledger.ore + g.ledger.crystals + g.ledger.fruit
  let dug = 0
  let hauled = 0
  for (let i = 0; i < 3600; i++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'dug') dug++
      if (e.type === 'haul') hauled += e.ore + e.crystals + e.fruit
    }
    g.events.length = 0
    for (const b of g.swarm) assert.ok(open(b), 'never in rock')
  }
  assert.ok(dug > 0, 'they pulled something')
  assert.equal(hauled, dug)
  assert.equal(g.ledger.ore + g.ledger.crystals + g.ledger.fruit - before, hauled)
})

test('bugs green the back wall, vines grow on green, and 12 px of vine make a fruit a minute (b4.10)', async () => {
  const { FRUIT, GREEN, VINE } = await import('./garden.js')
  const g = fresh()
  g.cfg.lichen.near = 0 // no lichen, so no fire (b4.21): this is the garden alone
  g.cfg.gas.perMoss = 0 // moss for free here, as before b4.69 (gas has its own test)
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
  // rock pixels near the bot: the nearest becomes crystals, one farther ore (both seen)
  /** @type {{ i: number, d: number }[]} */
  const rock = []
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (!isOpen(MAP.world.tiles[i]) && dx * dx + dy * dy <= 36) rock.push({ i, d: dx * dx + dy * dy })
    }
  rock.sort((p, q) => p.d - q.d)
  const crystals = rock[0].i
  const ore = rock[rock.length - 1].i
  MAP.world.tiles[crystals] = CRYSTAL
  MAP.world.tiles[ore] = Tile.Ore
  g.seen[crystals] = g.seen[ore] = 1
  g.ledger.crystals = 50
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

test('ash spawns a lizard; it licks the ash within 6 px bare, burrows, and makes 5 crystals inside the rock (b4.54)', async () => {
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
  let crystals = null
  const before = tiles.filter((t) => t === CRYSTAL).length
  for (let t = 0; t < 60 * 60 * 10 && !crystals; t++) {
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
      if (e.type === 'deposit' && tiles[e.cells[0]] === CRYSTAL) crystals = e.cells
    }
    g.events.length = 0
    for (const z of g.lizards) if (z.eaten < 4) assert.ok(isOpen(tiles[z.body[0].y * w + z.body[0].x]), 'on the surface')
  }
  assert.ok(spawned > 0 && licked >= 4, `spawned ${spawned}, licked ${licked}`)
  assert.ok(crystals, 'burrowed')
  assert.equal(crystals.length, 5)
  for (const c of crystals) {
    const x = c % w
    const y = (c - x) / w
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) assert.ok(!isOpen(tiles[(y + dy) * w + ((x + dx + w) % w)]), 'inside the rock')
  }
  assert.equal(tiles.filter((t) => t === CRYSTAL).length, before + 5)
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

test('crystals buys the lizards upgrades by itself: 16, 32, 64…, each their reach +20% (b4.56)', async () => {
  const { lizardCost, gain } = await import('./game.js')
  const g = fresh()
  g.ledger.crystals = 16 + 32 + 3
  tick(g)
  assert.equal(g.lizardLevel, 2)
  assert.equal(g.ledger.crystals, 3)
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
  const { w } = MAP.world
  // crystals alone no longer do it (b4.15's trigger)
  for (let dy = -20; dy <= 20; dy += 3)
    for (let dx = -20; dx <= 20; dx += 3) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (!isOpen(MAP.world.tiles[i])) MAP.world.tiles[i] = CRYSTAL
    }
  for (let t = 0; t < 60 * 60; t++) tick(g)
  assert.equal(g.lichen.patches.length, 0, 'crystals: nothing')
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

test('no lizard spawns in a small enclosure: its cave holds at least `room` open px (b4.22)', async () => {
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
    const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG))) // not the map earlier tests changed
    g.cfg.pull.ticks = 1e9
    g.cfg.worms.max = 0
    g.cfg.lizards.density = 3
    g.cfg.lizards.near = 64
    g.cfg.lizards.eat = 1e9 // they only mine: the rock stays as it is
    g.cfg.lizards.room = room
    // ash round the bot (lizards spawn by ash since b4.54): it passed by chance before, on ash from fires that
    // bugs tamed by the crystals earlier tests left in MAP had started
    const { ASH } = await import('./garden.js')
    const { w: W } = g.world
    for (let dy = -40; dy <= 40; dy++)
      for (let dx = -40; dx <= 40; dx++) {
        const i = (g.ch.y + dy) * W + ((g.ch.x + dx + W) % W)
        if (g.ch.y + dy >= 0 && g.ch.y + dy < h && isOpen(tiles[i]) && (dx + dy) % 3 === 0) g.garden.wall[i] = ASH
      }
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
  g.cfg.swarm.mothTicks = 0 // no gas moths here (b4.75)
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
      g.swarm.push({ ...MAP.nodes[A], from: MAP.nodes[A], movedAt: 0, dir: 0, lastOre: 1e9, target: null, pullFor: 0 })
    }
    for (let t = 0; t < run; t++) tick(g) // a different tick: a different random draw
    // a 12th that fades now (b4.70: no ore for idleTicks)
    g.ledger.bugs = 12
    g.swarm.push({ ...MAP.nodes[A], from: MAP.nodes[A], movedAt: 0, dir: 0, lastOre: g.tick + 1 - g.cfg.swarm.idleTicks, target: null, pullFor: 0 })
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
      g.swarm.push({ ...MAP.nodes[B], from: MAP.nodes[B], movedAt: 0, dir: 0, lastOre: 1e9, target: null, pullFor: 0 })
    for (let t = 0; t < run; t++) tick(g)
    // a 6th that fades now (b4.70)
    g.ledger.bugs = 6
    g.swarm.push({ ...MAP.nodes[A], from: MAP.nodes[A], movedAt: 0, dir: 0, lastOre: g.tick + 1 - g.cfg.swarm.idleTicks, target: null, pullFor: 0 })
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

test('every 4 built nodes add a tamed bug; nodes eaten take none back; crystals tames no wild bug (b4.63)', async () => {
  const { extend } = await import('./game.js')
  const { builtNodes } = await import('./beasts.js')
  const g = fresh()
  g.ledger.ore = 10000
  /** One more edge out from the network. */
  const grow = () => {
    const k = MAP.edges.findIndex((e, j) => !g.built[j] && g.net[e.a] !== g.net[e.b])
    const e = MAP.edges[k]
    extend(g, k, g.net[e.a] ? e.a : e.b)
  }
  while (builtNodes(g) < 11) grow()
  tick(g)
  assert.equal(g.ledger.bugs, 2, '11 nodes: 2 bugs')
  const tamed = g.events.filter((e) => e.type === 'tamed').length
  assert.equal(tamed, 2)
  while (builtNodes(g) < 12) grow()
  tick(g)
  assert.equal(g.ledger.bugs, 3, '12 nodes: 3 bugs')
  // unbuild a root at the rim (as a beast would): no bug back, none new until past 12 again
  const k = g.built.findIndex((v) => v === 1)
  g.built[k] = 0
  const e = MAP.edges[k]
  for (const n of [e.a, e.b]) g.railed[n] = g.links[n].some((j) => g.built[j]) ? 1 : 0
  tick(g)
  assert.ok(builtNodes(g) < 12)
  assert.equal(g.ledger.bugs, 3)
  // a wild bug by a crystal pixel stays wild
  const { w } = MAP.world
  let at = -1
  for (let i = w * 200; i < MAP.world.tiles.length && at < 0; i++)
    if (isOpen(MAP.world.tiles[i]) && MAP.world.tiles[i + 1] === Tile.Soft) at = i
  const before = MAP.world.tiles[at + 1]
  MAP.world.tiles[at + 1] = CRYSTAL
  g.bugs.length = 0
  addBug(/** @type {any} */ (g), at % w, Math.floor(at / w))
  const bug = g.bugs[0]
  bug.block = blockOf(/** @type {any} */ (g), at % w, Math.floor(at / w))
  g.cfg.bugs.moveTicks = 1e9
  tick(g)
  assert.ok(g.bugs.includes(bug), 'still wild')
  assert.equal(MAP.world.tiles[at + 1], CRYSTAL, 'the crystals stays')
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

test('a save loaded into a fresh game goes on exactly like the game it was saved from (b4.62)', async () => {
  const { extend } = await import('./game.js')
  const { builtNodes } = await import('./beasts.js')
  const { GREEN, VINE, FRUIT } = await import('./garden.js')
  const { save, load } = await import('./save.js')
  const cfg = () => {
    const c = JSON.parse(JSON.stringify(CONFIG))
    c.lichen.spark = 1
    c.beasts.everyTicks = 600
    c.gas.everyTicks = 60
    c.garden.fruitTicks = 600
    return c
  }
  const g = createGame(pristine(), cfg())
  const { w } = g.world
  // a busy game: a network with a beast, bugs at work, cover round a lichen that sparks a fire
  g.ledger.ore = 10000
  while (builtNodes(g) < 17) {
    const k = MAP.edges.findIndex((e, j) => !g.built[j] && g.net[e.a] !== g.net[e.b])
    const e = MAP.edges[k]
    extend(g, k, g.net[e.a] ? e.a : e.b)
  }
  g.ledger.bugs = 12
  let n = 0
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (!isOpen(g.world.tiles[i])) continue
      g.garden.wall[i] = n % 10 === 0 ? VINE : n % 10 === 5 ? FRUIT : GREEN
      if (g.garden.wall[i] !== GREEN) g.garden.vines.push(i)
      if (g.garden.wall[i] === FRUIT) g.garden.fruit.add(i)
      n++
    }
  const at = g.ch.y * w + g.ch.x + 20
  g.lichen.on[at] = 1
  g.lichen.patches.push({ cells: [at], leaf: [], sparked: false })
  /** @param {import('./game.js').Game} x @param {number} from @param {number} to */
  const run = (x, from, to) => {
    for (let t = from; t < to; t++) {
      if (t % 300 === 0) command(x, { type: 'move', dx: Math.cos(t), dy: Math.sin(t) })
      tick(x)
      x.events.length = 0
    }
  }
  run(g, 0, 4000)
  assert.ok(g.swarm.length > 0, 'bugs at work')
  assert.ok(g.garden.wall.some((v) => v === 5), 'ash')
  assert.ok(g.beasts.length > 0, 'a beast')
  assert.ok(g.gas.some((v) => v > 0), 'gas at a station (b4.66)')
  const s = save(g, TILES)
  assert.ok(s.length < 60000, `save ${s.length} chars`)
  const h = createGame(pristine(), cfg())
  load(h, s)
  assert.equal(save(h, TILES), s, 'loads as saved')
  run(g, 4000, 8000)
  run(h, 4000, 8000)
  assert.equal(save(h, TILES), save(g, TILES), 'the same game 4000 ticks on')
})

test('no cover within a tamed bug\'s 3×3 catches fire; round it, the fire burns on (b4.64)', async () => {
  const { GREEN, cover } = await import('./garden.js')
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.pull.ticks = 1e9
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.spark = 1
  g.cfg.lichen.checkTicks = 1
  g.cfg.swarm.moveTicks = 1e9 // the bug stays put
  g.cfg.swarm.pullTicks = 1e9
  const { w } = MAP.world
  const G = g.garden
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const i = (g.ch.y + dy) * w + g.ch.x + dx
      if (isOpen(MAP.world.tiles[i])) G.wall[i] = GREEN
    }
  // a bug at an open pixel with its whole 3×3 green, 6+ px from the lichen
  const at = g.ch.y * w + g.ch.x
  let bug = -1
  for (let dy = -20; dy <= 20 && bug < 0; dy++)
    for (let dx = -20; dx <= 20 && bug < 0; dx++) {
      const i = at + dy * w + dx
      if (dx * dx + dy * dy < 36) continue
      if ([-1, 0, 1].every((a) => [-1, 0, 1].every((b) => G.wall[i + a * w + b] === GREEN))) bug = i
    }
  assert.ok(bug >= 0)
  const bx = bug % w
  const by = Math.floor(bug / w)
  g.swarm.push({ x: bx, y: by, from: { x: bx, y: by }, movedAt: 0, dir: 0, lastOre: 1e9, target: null, pullFor: 0 })
  g.lichen.on[at] = 1
  g.lichen.patches.push({ cells: [at], leaf: [], sparked: false })
  tick(g)
  assert.ok(g.lichen.patches[0].sparked, 'sparked')
  for (let k = 0; k < 3600 && G.burning.length; k++) tick(g)
  assert.equal(G.burning.length, 0, 'the fire went out')
  for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) assert.ok(cover(G.wall[bug + a * w + b]), 'the 3×3 stays green')
  let burned = 0
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const i = at + dy * w + dx
      if (isOpen(MAP.world.tiles[i]) && !cover(G.wall[i])) burned++
    }
  assert.ok(burned > 300, `the rest burned: ${burned} px`)
})

test('a pool evaporates from the top, 40 particles a drop (5 a step; b4.73, 8 and 1 before), each to the nearest station through open pixels (b4.66)', async () => {
  const { stationOf } = await import('./gas.js')
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.pull.ticks = 1e9
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 0
  const { w, h, tiles } = g.world
  // the open pixels' 4-way components: a station must be in its pixel's
  const comp = new Int32Array(w * h).fill(-1)
  for (let i = 0, c = 0; i < w * h; i++) {
    if (comp[i] >= 0 || !isOpen(tiles[i])) continue
    const q = [i]
    comp[i] = c
    for (let k = 0; k < q.length; k++) {
      const x = q[k] % w
      const y = (q[k] - x) / w
      for (const [nx, ny] of [[(x + w - 1) % w, y], [(x + 1) % w, y], [x, y - 1], [x, y + 1]]) {
        const n = ny * w + nx
        if (ny < 0 || ny >= h || comp[n] >= 0 || !isOpen(tiles[n])) continue
        comp[n] = c
        q.push(n)
      }
    }
    c++
  }
  const nodeComps = new Set(MAP.nodes.map((n) => comp[n.y * w + n.x]))
  let checked = 0
  let crossed = 0 // pixels whose straight-line nearest node is in another cave
  for (let i = 0; i < w * h; i += 97) {
    if (!isOpen(tiles[i]) || !nodeComps.has(comp[i])) continue
    const s = stationOf(g, i)
    const n = MAP.nodes[s]
    assert.equal(comp[n.y * w + n.x], comp[i], `pixel ${i}: its station is in its cave`)
    const p = { x: i % w, y: Math.floor(i / w) }
    const d2 = (/** @type {{ x: number, y: number }} */ a) => Math.min(Math.abs(a.x - p.x), w - Math.abs(a.x - p.x)) ** 2 + (a.y - p.y) ** 2
    const near = MAP.nodes.reduce((b, m) => (d2(m) < d2(b) ? m : b))
    if (comp[near.y * w + near.x] !== comp[i]) crossed++
    checked++
  }
  assert.ok(checked > 100 && crossed > 0, `${checked} checked, ${crossed} across rock`)
  // a 3-deep column of liquid, resting on rock
  let col = -1
  for (let i = 3 * w; i < (h - 1) * w && col < 0; i++)
    if (isOpen(tiles[i]) && isOpen(tiles[i - w]) && isOpen(tiles[i - 2 * w]) && !isOpen(tiles[i + w])) col = i
  assert.ok(col >= 0)
  const cells = [col - 2 * w, col - w, col]
  for (const i of cells) g.liquid[i] = g.cfg.gas.per
  g.ledger.liquid = 3
  const st = stationOf(g, cells[0])
  const every = g.cfg.gas.everyTicks
  const step = () => {
    for (let t = 0; t < every; t++) tick(g)
  }
  for (let k = 0; k < 8; k++) step()
  assert.deepEqual([...cells].map((i) => g.liquid[i]), [0, 40, 40], 'the top dries first')
  assert.equal(g.ledger.liquid, 2)
  for (let k = 0; k < 16; k++) step()
  assert.deepEqual([...cells].map((i) => g.liquid[i]), [0, 0, 0])
  assert.equal(g.ledger.liquid, 0)
  assert.equal(g.gas.reduce((a, b) => a + b, 0), 120, '40 particles a drop')
  assert.ok(g.gas[st] > 0)
})

test('a saturated station passes half its surplus to emptier neighbours in its cave, and it settles (b4.67)', async () => {
  const { stations } = await import('./gas.js')
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.swarm.mothTicks = 0 // no gas moths here (b4.75)
  g.cfg.pull.ticks = 1e9
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 0
  const { adj } = stations(g)
  // the biggest group of neighbouring stations
  const group = (/** @type {number} */ k) => {
    const s = new Set([k])
    for (const u of s) for (const v of adj[u]) s.add(v)
    return s
  }
  let big = new Set()
  for (let k = 0; k < adj.length; k++) if (!big.has(k)) big = group(k).size > big.size ? group(k) : big
  const start = [...big][0]
  g.gas[start] = 200
  const cap = g.cfg.gas.cap
  let last = 0
  for (let t = 1; t <= 60 * 120; t++) {
    tick(g)
    if (g.events.some((e) => e.type === 'gasFlow')) last = t
    g.events.length = 0
  }
  assert.ok(last > 0 && last < 60 * 60, `settled after ${(last / 60).toFixed(1)} s`)
  assert.equal(g.gas.reduce((a, b) => a + b, 0), 200, 'none lost or made')
  g.gas.forEach((v, k) => v && assert.ok(big.has(k), `station ${k} outside the cave`))
  // the cave had room for it all: nothing over the cap, and 200 / 8 stations full
  assert.ok(Math.max(...g.gas) <= cap, 'nothing saturated')
  assert.ok(g.gas.filter((v) => v === cap).length >= 200 / cap - 1, 'filled up to the cap')
  // a full cave evens out: 111 stations, 9 more each than they can hold
  const all = big.size * (cap + 9)
  g.gas.fill(0)
  g.gas[start] = all
  for (let t = 1; t <= 60 * 600; t++) {
    tick(g)
    if (g.events.some((e) => e.type === 'gasFlow')) last = t
    g.events.length = 0
  }
  assert.equal(g.gas.reduce((a, b) => a + b, 0), all, 'none lost or made')
  g.gas.forEach((v, k) => {
    for (const u of big.has(k) ? adj[k] : []) assert.ok(Math.abs(g.gas[u] - v) <= 1, 'even to within 1')
  })
})

test('a tamed bug with fire within 6 px stands still; out of reach of it, or once it is out, it walks (b4.68)', () => {
  const g = fresh()
  g.cfg.garden.burnTicks = 1e9 // the fire holds still
  g.cfg.swarm.tripTicks = 1e9
  g.ledger.bugs = 1
  tick(g)
  const b = g.swarm[0]
  const { w } = g.world
  /** @param {number} d fire this far to the bug's right @returns {boolean} it moved over 2 s */
  const moves = (d) => {
    g.garden.burning = [b.y * w + ((b.x + d) % w)]
    const at = `${b.x},${b.y}`
    let moved = false
    for (let t = 0; t < 120; t++) {
      tick(g)
      if (`${b.x},${b.y}` !== at) moved = true
    }
    return moved
  }
  assert.equal(moves(6), false, 'fire 6 px away: still')
  assert.equal(moves(3), false, 'fire 3 px away: still')
  g.garden.burning = []
  assert.equal(moves(40), true, 'fire far away: walks')
})

test('tamed bugs lay moss only where their station has gas, one gas a pixel (b4.69)', async () => {
  const { stationOf } = await import('./gas.js')
  const g = fresh()
  g.cfg.lichen.near = 0
  g.cfg.worms.max = 0
  g.cfg.swarm.tripTicks = 1e9
  g.cfg.gas.spreadTicks = 1e9 // the gas stays where we put it
  g.ledger.bugs = 1
  tick(g)
  const green = () => g.garden.wall.reduce((a, v) => a + (v ? 1 : 0), 0)
  for (let i = 0; i < 600; i++) tick(g)
  assert.equal(green(), 0, 'no gas: bare wall')
  const b = g.swarm[0]
  g.gas[stationOf(g, b.y * g.world.w + b.x)] = 5
  for (let i = 0; i < 600; i++) tick(g)
  const left = g.gas.reduce((a, v) => a + v, 0)
  assert.ok(green() > 0, 'moss where the gas is')
  assert.equal(green() + left, 5, 'a pixel of moss per gas')
})

test('tamed bugs are wall-bouncers: on the wall or in the air, never in rock; they jump, mine, and send each unit at once (b4.70)', async () => {
  const { onWall } = await import('./bounce.js')
  const g = fresh()
  g.cfg.swarm.mothTicks = 0 // no gas moths here (b4.75)
  g.cfg.lichen.near = 0
  g.cfg.worms.max = 0
  g.cfg.swarm.upgradeCost = 1e9 // nothing spends from the ledger here
  g.cfg.lizardUpgradeCost = 1e9
  g.cfg.bugs.chasers = 0
  g.ledger.bugs = 6
  let jumps = 0
  let landed = 0
  let hauled = 0
  let dug = 0
  let ledger = g.ledger.ore + g.ledger.crystals + g.ledger.fruit
  for (let i = 0; i < 2 * 3600; i++) {
    const flying = g.swarm.map((b) => !!b.fly)
    tick(g)
    g.swarm.forEach((b, k) => {
      assert.ok(open(b), 'never in rock')
      if (b.fly && !flying[k]) jumps++
      if (!b.fly && flying[k]) landed++
      if (!b.fly && !flying[k] && g.tick - b.movedAt === 0) assert.ok(onWall(g, b.x, b.y), 'a crawl step stays on the wall')
    })
    for (const e of g.events) {
      if (e.type === 'dug') dug++
      if (e.type === 'haul') hauled += e.ore + e.crystals + e.fruit
    }
    g.events.length = 0
    const now = g.ledger.ore + g.ledger.crystals + g.ledger.fruit
    assert.ok(now >= ledger, 'the ledger only grows here')
    ledger = now
  }
  assert.ok(jumps > 20, `${jumps} jumps`)
  assert.ok(landed > 20, `${landed} landings`)
  assert.ok(dug > 20, `${dug} units`)
  assert.equal(hauled, dug, 'every unit flies to the ledger as it comes out')
})

test('a tamed bug with no unit for idleTicks fades and comes back near a node (b4.70)', () => {
  const g = fresh()
  g.cfg.swarm.pullTicks = 1e9 // never a unit
  g.ledger.bugs = 1
  tick(g)
  let faded = 0
  for (let i = 0; i < g.cfg.swarm.idleTicks + 2; i++) {
    tick(g)
    faded += g.events.filter((e) => e.type === 'faded').length
    g.events.length = 0
  }
  assert.equal(faded, 1)
  const b = g.swarm[0]
  const near = g.net.some((on, i) => on && Math.hypot(MAP.nodes[i].x - b.x, MAP.nodes[i].y - b.y) <= g.cfg.swarm.spawn + 1)
  assert.ok(near, 'back at a network node')
})

test('wild bugs crawl the wall and sometimes jump (b4.70)', async () => {
  const { onWall } = await import('./bounce.js')
  const g = fresh()
  g.cfg.bugs.chasers = 0 // only wanderers
  let air = 0
  let wall = 0
  let n = 0
  for (let i = 0; i < 3600; i++) {
    tick(g)
    for (const b of g.bugs) {
      assert.ok(open(b), 'never in rock')
      n++
      if (b.fly) air++
      else if (onWall(g, b.x, b.y)) wall++
    }
  }
  assert.ok(n > 1000)
  assert.ok(air > 0, 'some jump')
  assert.ok(wall + air > n * 0.9, `${wall} on the wall, ${air} in the air of ${n}`)
})

test('a tamed bug that meets gas turns moth: it circles through open air, still sends units at once, and comes back a jumper after it fades (b4.71)', async () => {
  const { stationOf } = await import('./gas.js')
  const g = fresh()
  g.cfg.lichen.near = 0
  g.cfg.worms.max = 0
  g.cfg.gas.spreadTicks = 1e9
  g.ledger.bugs = 1
  tick(g)
  const b = g.swarm[0]
  assert.ok(!b.moth, 'a jumper at first')
  g.gas[stationOf(g, b.y * g.world.w + b.x)] = 1000
  tick(g)
  assert.ok(b.moth, 'a moth once it met gas')
  let moves = 0
  let dug = 0
  let hauled = 0
  let faded = 0
  for (let i = 0; i < g.cfg.swarm.idleTicks + 60; i++) {
    const at = `${b.x},${b.y}`
    tick(g)
    assert.ok(open(b), 'never in rock')
    if (`${b.x},${b.y}` !== at && !faded) moves++
    for (const e of g.events) {
      if (e.type === 'dug') dug++
      if (e.type === 'haul') hauled += e.ore + e.crystals + e.fruit
      if (e.type === 'faded') faded++
    }
    g.events.length = 0
  }
  assert.ok(moves > 100, `${moves} pixels flown`)
  assert.equal(hauled, dug, 'units to the ledger at once')
  if (!dug) {
    assert.equal(faded, 1, 'no unit in 30 s: it fades')
    const gas = g.gas[stationOf(g, b.y * g.world.w + b.x)]
    if (!gas) assert.ok(!b.moth, 'back at a node without gas: a jumper')
  }
})

test('predators: one per 4 built nodes at a crowd of bugs, coming down slowly; a catch is gone (tamed: off the ledger), hauled up, then 3 ore; the 5th hauled up too, then it goes (b4.72, b4.73)', async () => {
  const { updatePredators } = await import('./predators.js')
  const g = createGame(pristine(), JSON.parse(JSON.stringify(CONFIG)))
  const pod = MAP.nodes[MAP.podNodes[0]]
  g.cfg.predators.crowd = 1 // any bug calls one
  g.ledger.bugs = 1
  tick(g)
  const b = g.swarm[0]
  g.tick = 600 * 1000 - 1
  // 3 built nodes: none
  for (let i = 0; i < 3; i++) g.railed[i] = 1
  g.tick++
  updatePredators(g)
  assert.equal(g.predators.length, 0, 'fewer than 4 built nodes: no predator')
  g.railed[3] = 1
  // a bug under a ceiling
  const { w, tiles } = g.world
  let spot = null
  for (let y = pod.y - 20; y < pod.y + 20 && !spot; y++)
    for (let x = pod.x - 20; x < pod.x + 20 && !spot; x++)
      if (isOpen(tiles[y * w + x]) && isOpen(tiles[(y + 1) * w + x]) && isOpen(tiles[(y + 2) * w + x]) && !isOpen(tiles[(y - 1) * w + x])) spot = { x, y }
  assert.ok(spot)
  Object.assign(b, { x: spot.x, y: spot.y + 2, fly: null, moth: null })
  g.bugs.length = 0
  g.tick += 600 - (g.tick % 600)
  updatePredators(g)
  assert.equal(g.predators.length, 1, 'a predator at the crowd')
  const p = g.predators[0]
  assert.deepEqual([p.x, p.y], [spot.x, spot.y], 'anchored under the ceiling')
  assert.equal(p.len, 0, 'it comes down from the rock')
  /** Ticks of updatePredators alone, gathering events. @param {number} n */
  const run = (n) => {
    const ev = []
    for (let t = 0; t < n; t++) {
      g.tick++
      g.events.length = 0
      updatePredators(g)
      ev.push(...g.events)
    }
    return ev
  }
  // it comes down slowly; the bug 2 px under the anchor is caught once the string reaches it
  let ev = []
  for (let t = 0; t < 4 * g.cfg.predators.descendTicks && !ev.length; t++) ev = run(1).filter((e) => e.type === 'caught')
  assert.equal(ev.length, 1, 'caught once the string reaches it')
  assert.ok(p.len >= 2 && p.len <= 3, `at ${p.len} px down`)
  assert.equal(g.swarm.length, 0)
  assert.equal(g.ledger.bugs, 0, 'a tamed bug is gone for good')
  assert.ok(p.prey, 'hauling it up')
  // up into the rock with it, then the ore
  ev = run(p.len * g.cfg.predators.retractTicks + 1)
  const ore = ev.filter((e) => e.type === 'predatorOre')
  assert.equal(ore.length, 1)
  assert.equal(p.len, 0)
  assert.equal(ore[0].cells.length, 3)
  for (const i of ore[0].cells) assert.equal(tiles[i], Tile.Ore)
  // four more wild meals; the last it hauls up too, then it goes
  for (let k = 0; k < 4; k++) {
    while (p.len < 2) run(1)
    addBug(/** @type {any} */ (g), p.x, p.y + 1)
    run(1)
    assert.ok(p.prey, `meal ${k + 2}`)
    if (k < 3) while (p.prey) run(1)
  }
  assert.equal(g.predators.length, 1, 'it still hauls its last catch')
  ev = run(p.len * g.cfg.predators.retractTicks + 2)
  assert.ok(ev.some((e) => e.type === 'predatorOre'), 'the last catch makes ore too')
  assert.equal(g.predators.length, 0, 'then it is gone')
  assert.ok(ev.some((e) => e.type === 'predatorGone'))
})

test('a tamed bug coming back prefers a network node with gas (b4.73)', () => {
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
    g.cfg.gas.spreadTicks = 1e9
    g.net.fill(0)
    g.net[A] = g.net[B] = 1
    g.gas[A] = 50 // gas at A, though its bugs crowd it
    g.ledger.bugs = 4
    for (let k = 0; k < 4; k++) g.swarm.push({ ...MAP.nodes[A], from: MAP.nodes[A], movedAt: 0, dir: 0, lastOre: 1e9, target: null, pullFor: 0 })
    for (let t = 0; t < run; t++) tick(g)
    g.ledger.bugs = 5
    g.swarm.push({ ...MAP.nodes[B], from: MAP.nodes[B], movedAt: 0, dir: 0, lastOre: g.tick + 1 - g.cfg.swarm.idleTicks, target: null, pullFor: 0 })
    tick(g)
    assert.ok(d2(g.swarm[4], MAP.nodes[A]) <= g.cfg.swarm.spawn ** 2 + 2, 'back at the node with gas')
  }
})

test('every 30 s each built node with gas hatches a moth onto the ledger; an unbuilt one does not (b4.75)', () => {
  const g = fresh()
  g.cfg.gas.spreadTicks = 1e9
  g.cfg.gas.perMoss = 0 // the gas stays
  const [a, b] = [0, 1]
  g.railed[a] = 1
  g.gas[a] = 5
  g.gas[b] = 5 // not built
  const bugs0 = g.ledger.bugs
  const hatched = []
  for (let i = 0; i < 2 * g.cfg.swarm.mothTicks + 1; i++) {
    tick(g)
    for (const e of g.events) if (e.type === 'hatched') hatched.push(e)
    g.events.length = 0
  }
  assert.ok(hatched.length >= 2, `${hatched.length} moths`)
  for (const e of hatched) assert.deepEqual([e.x, e.y], [MAP.nodes[a].x, MAP.nodes[a].y], 'at the built node')
  assert.equal(g.ledger.bugs - bugs0, hatched.length, 'each on the ledger')
})
