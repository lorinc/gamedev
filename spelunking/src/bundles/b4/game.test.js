// b4.3's sim on seed 1's map: nodes never in rock, walking any angle, the ledger (building, taming), the
// swarm. The state is set by hand where playing there would take minutes.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addBug } from '../../sim/dig/bugs.js'
import { isOpen } from '../../sim/gen/world.js'
import { buildable, command, CONFIG, createGame, heading, tick } from './game.js'
import { makeMap } from './world.js'

const MAP = makeMap(1)
/** A game where the bot never pulls (so the ledger moves only by what's tested). */
const fresh = () => {
  const g = createGame(MAP, JSON.parse(JSON.stringify(CONFIG)))
  g.cfg.pull.ticks = 1e9
  return g
}
const open = (/** @type {{ x: number, y: number }} */ c) => isOpen(MAP.world.tiles[c.y * MAP.world.w + c.x])

test('no node on a rail is in rock (the candidate filter)', () => {
  const used = new Set(MAP.edges.flatMap((e) => [e.a, e.b]))
  assert.ok(used.size > 300)
  for (const n of used) assert.ok(open(MAP.nodes[n]), `node ${n}`)
})

test('walking any angle: a drag at about 23° keeps that slope', () => {
  assert.deepEqual(heading(2, -1), { dx: 1000, dy: -500 })
  assert.equal(heading(0, 0), null)
  const g = fresh()
  const s = { ...g.ch }
  command(g, { type: 'move', dx: Math.cos(0.4), dy: -Math.sin(0.4) })
  for (let i = 0; i < 300; i++) tick(g)
  const dx = g.ch.x - s.x
  const dy = s.y - g.ch.y
  assert.ok(dx > 10, `moved ${dx}`)
  assert.ok(Math.abs(dy / dx - Math.tan(0.4)) < 0.1, `slope ${dy / dx}`)
})

test('building takes the price from the ledger at once; short of it, refused', () => {
  const g = fresh()
  const from = MAP.podNodes.find((n) => MAP.edges.some((e) => e.a === n || e.b === n))
  assert.ok(from !== undefined)
  const edge = MAP.edges.findIndex((e) => e.a === from || e.b === from)
  g.ch.x = MAP.nodes[from].x
  g.ch.y = MAP.nodes[from].y
  assert.equal(buildable(g, edge, from), 'ore')
  command(g, { type: 'build', edge, from })
  tick(g)
  assert.equal(g.built[edge], 0)
  g.ledger.ore = 12
  command(g, { type: 'build', edge, from })
  tick(g)
  assert.equal(g.built[edge], 1)
  assert.equal(g.ledger.ore, 2)
  assert.equal(g.cars.length, 1)
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
  g.ledger.bugs = 3
  tick(g)
  assert.equal(g.swarm.length, 3)
  for (const b of g.swarm) assert.ok(open(b))
  const before = g.ledger.ore + g.ledger.loot
  let dug = 0
  let hauled = 0
  for (let i = 0; i < 3600; i++) {
    tick(g)
    for (const e of g.events) {
      if (e.type === 'dug') dug++
      if (e.type === 'haul') hauled += e.ore + e.loot
    }
    g.events.length = 0
    for (const b of g.swarm) assert.ok(open(b), 'never in rock')
  }
  assert.ok(dug > 0, 'they pulled something')
  assert.equal(hauled, dug)
  assert.equal(g.ledger.ore + g.ledger.loot - before, hauled)
})
