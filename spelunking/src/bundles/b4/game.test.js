// b4.3's sim on seed 1's map: nodes never in rock, walking any angle, the ledger (building, taming), the
// swarm. The state is set by hand where playing there would take minutes.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addBug } from '../../sim/dig/bugs.js'
import { isOpen, Tile } from '../../sim/gen/world.js'
import { buildable, command, CONFIG, createGame, HEADING, heading, shown, tick } from './game.js'
import { makeMap } from './world.js'

const MAP = makeMap(1)
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

test('bugs green the back wall, vines grow on green, and 12 px of vine make a fruit a minute (b4.10)', async () => {
  const { FRUIT, GREEN, VINE } = await import('./garden.js')
  const g = fresh()
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

test('plentiful ore spawns a lizard; it mines on the surface, burrows, and makes one loot inside the rock (b4.14)', () => {
  const g = fresh()
  g.cfg.worms.max = 0
  g.cfg.lizards.density = 3 // seed 1's start has little ore: a low bar, the rest as it plays
  g.cfg.lizards.eat = 4
  g.cfg.lizards.near = 40
  const { w } = MAP.world
  const tiles = MAP.world.tiles
  let spawned = 0
  let licked = 0
  /** @type {number[] | null} */
  let loot = null
  const before = tiles.filter((t) => t === Tile.Loot).length
  for (let t = 0; t < 60 * 60 * 10 && !loot; t++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'lizard') spawned++
      if (e.type === 'licked') licked++
      if (e.type === 'deposit' && tiles[e.cells[0]] === Tile.Loot) loot = e.cells
    }
    g.events.length = 0
    for (const z of g.lizards) if (z.eaten < 4) assert.ok(isOpen(tiles[z.body[0].y * w + z.body[0].x]), 'on the surface')
  }
  assert.ok(spawned > 0 && licked >= 4, `spawned ${spawned}, licked ${licked}`)
  assert.ok(loot, 'burrowed')
  assert.equal(loot.length, 1)
  const x = loot[0] % w
  const y = (loot[0] - x) / w
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) assert.ok(!isOpen(tiles[(y + dy) * w + ((x + dx + w) % w)]), 'inside the rock')
  assert.equal(tiles.filter((t) => t === Tile.Loot).length, before + 1)
})

test('loot buys the bot upgrades by itself: 16, 32, 64…, each mining radius and speed +20% (b4.15)', async () => {
  const { botCost, gain } = await import('./game.js')
  const g = fresh()
  g.ledger.loot = 16 + 32 + 3
  tick(g)
  assert.equal(g.botLevel, 2)
  assert.equal(g.ledger.loot, 3)
  assert.equal(botCost(g), 64)
  assert.ok(Math.abs(gain(g, 2) - 1.44) < 1e-9)
  assert.equal(Math.round(CONFIG.light.base * gain(g, 2)), 12) // 8 px → 12
})

test('a large area of cover grows a purple lichen patch of 6–8 surface pixels with a leaf (b4.23)', async () => {
  const { GREEN } = await import('./garden.js')
  const g = fresh()
  g.cfg.worms.max = 0
  g.cfg.lizards.max = 0
  g.cfg.lichen.near = 20
  g.cfg.lichen.spark = 1e9 // no fire here
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

test('a lichen by the cover sparks once: the fire eats all the connected cover, leaving r 3–5 ash discs 8–12 px apart (b4.21)', async () => {
  const { ASH, BURN, FRUIT, GREEN, VINE, cover, greenAround } = await import('./garden.js')
  const { WITHERED_PX } = await import('./lichen.js')
  const g = fresh()
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
  for (const i of linked) assert.ok(!cover(G.wall[i]), 'the connected cover burned')
  assert.equal(G.fruit.size, [...G.wall].filter((v) => v === FRUIT).length)
  for (const i of G.vines) assert.ok(G.wall[i] === VINE || G.wall[i] === FRUIT)
  const centres = [...G.centres.values()].flat()
  assert.ok(centres.length >= 4, `discs ${centres.length}`)
  const d = (/** @type {number} */ a, /** @type {number} */ b) => Math.hypot((a % w) - (b % w), Math.floor(a / w) - Math.floor(b / w))
  for (const a of centres) for (const b of centres) if (a !== b) assert.ok(d(a, b) >= 8, 'discs 8+ apart')
  const ash = [...G.wall.keys()].filter((i) => G.wall[i] === ASH)
  assert.ok(ash.length > 3 * centres.length)
  for (const i of ash)
    assert.ok(
      centres.some((c) => d(i, c) <= 5),
      'ash only in a disc',
    )
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

test('pointing along a built root near its node rides it to the far end, no cart (b4.23)', () => {
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

test('ash grows a flower per 24 px; after 2 minutes it becomes a bot that clears its ash, builds 3 edges on the network, and pops (b4.25)', async () => {
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
  const ash = G.wall.filter((v) => v === ASH).length
  const n = g.flowers.length
  assert.ok(n > 0 && Math.abs(n - ash / 24) <= G.centres.size, `${n} flowers on ${ash} px of ash`)
  for (const f of g.flowers) assert.equal(G.wall[f.y * w + f.x], ASH, 'on the ash')
  g.ledger.ore = 1000
  const f0 = g.flowers[0]
  let bloom = 0
  let poof = 0
  let built = 0
  for (let k = 0; k < 7200 + 60 * 60 && !poof; k++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'bloom') bloom++
      if (e.type === 'poof') poof++
      if (e.type === 'built') built++
    }
    g.events.length = 0
    if (bloom && k < 7300) assert.notEqual(G.wall[f0.y * w + f0.x], ASH, 'its ash went')
  }
  assert.equal(bloom, n, 'every flower bloomed')
  assert.ok(poof >= 1, 'a bot popped')
  assert.ok(built >= 3, `built ${built}`)
  assert.equal(g.ledger.ore, 1000 - built * g.cfg.price)
})

test('a bulb lets the bot go after 3 s with nothing built; it takes it again only after it left (b4.26)', () => {
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
  assert.equal(eject - at, 180, 'after 3 s')
  assert.equal(g.engulf, null)
  for (let i = 0; i < 30; i++) tick(g)
  assert.equal(g.engulf, null, 'not again while still in reach')
  // out of reach and back: taken again
  g.ch.x = node.x + 6
  tick(g)
  g.ch.x = node.x + 1
  tick(g)
  assert.equal(g.engulf, from)
})
