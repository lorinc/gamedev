// Wild moon bugs (D056, D059, ruleset b3.2): they drift to you through open cells, nibble ore (never
// loot) from the pack, get tamed at `tame` ore, scatter from a probe ring, appear only in the dark
// and never near a tamed bug. b3.1 has no bugs.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { addBug } from './bugs.js'
import { parseMap } from './examples.js'
import { command, createGame, tick } from './game.js'
import { packText, parsePack } from './pack.js'
import { compile, migrate, simConfig } from './ruleset.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./game.js').GameEvent} GameEvent */
/** @typedef {import('./bugs.js').Bugs} Bugs */

const read = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../rules/${f}`, import.meta.url), 'utf8'))
/** @param {string} name */
function rules(name) {
  const r = migrate(read(name))
  return { table: /** @type {import('./ruleset.js').Table} */ (compile(r).table), cfg: simConfig(r) }
}
const B32 = rules('b3.2.json')
const B31 = rules('b3.1.json')
const BUGS = /** @type {Bugs} */ (B32.cfg.bugs)

/**
 * A game on `rows` (you at '@', home in the top-left corner, out of the way), no spawning unless
 * `bugs` says so. @param {string[]} rows @param {string[]} pack @param {Partial<Bugs>} [bugs]
 */
function game(rows, pack, bugs = { spawnTicks: 1e9 }, r = B32) {
  const { world, at } = parseMap(rows)
  const cfg = r.cfg.bugs ? { ...r.cfg, bugs: { ...BUGS, ...bugs } } : r.cfg
  const g = createGame(world, { x: 0, y: 0 }, structuredClone(cfg), r.table)
  g.ch.x = at.x
  g.ch.y = at.y
  g.pack = parsePack(pack)
  return g
}

/** Ticks n times; the events. @param {Game} g @param {number} n */
function run(g, n) {
  /** @type {GameEvent[]} */
  const events = []
  for (let t = 0; t < n; t++) {
    tick(g)
    events.push(...g.events)
    g.events.length = 0
  }
  return events
}
const of = (/** @type {GameEvent[]} */ events, /** @type {string} */ type) => events.filter((e) => e.type === type)

const CORRIDOR = ['#############', '#..........@#', '#############']

describe('wild bugs (D056, b3.2)', () => {
  test('one drifts to you, nibbles ore and is tamed at 16, where it is', () => {
    const g = game(CORRIDOR, ['ore 16', 'ore 4', 'loot 2'])
    const bug = addBug(g, 1, 1)
    const events = run(g, 1000)
    assert.equal(of(events, 'nibble').length, 16)
    assert.equal(of(events, 'tamed').length, 1)
    assert.deepEqual(bug.den, { x: 10, y: 1 }) // it stopped next to you
    assert.deepEqual(packText(g.pack), ['ore 4', '-', 'loot 2']) // the last ore slot first, no loot
    assert.equal(g.radius, 4) // 4 ore and 2 loot: the light is back to base
  })

  test('it never eats loot', () => {
    const g = game(CORRIDOR, ['loot 5'])
    addBug(g, 9, 1)
    assert.equal(of(run(g, 600), 'nibble').length, 0)
    assert.deepEqual(packText(g.pack), ['loot 5'])
  })

  test('a probe ring scares it off for scareTicks, then it comes back', () => {
    const g = game(CORRIDOR, ['ore 8'])
    const bug = addBug(g, 8, 1) // the probe spreads from the block under you: ring 4 reaches it
    command(g, { type: 'intent', dx: 0, dy: 1 }) // ↓ on a floor: the probe (D055)
    command(g, { type: 'release' })
    const scared = run(g, 200)
    assert.ok(of(scared, 'ring').length >= 3)
    assert.equal(of(scared, 'nibble').length, 0)
    assert.ok(bug.x < 8, `it drifted away, to ${bug.x}`)
    assert.ok(of(run(g, 400), 'nibble').length > 0, 'it comes back once the scare is over')
  })

  test('one outside the field wanders, and is gone when far enough away', () => {
    const g = game(['#' + '.'.repeat(60) + '@#'], ['ore 8'], { spawnTicks: 1e9, seek: 5, despawn: 30 })
    addBug(g, 30, 0) // 31 tiles from you either way round
    run(g, 1)
    assert.equal(g.bugs.length, 0)
  })
})

describe('where wild bugs are', () => {
  const ROOM = ['#' + '#'.repeat(40) + '#', ...Array(7).fill('#' + '.'.repeat(40) + '#'), '#' + '#'.repeat(40) + '#']
  ROOM[4] = '#@' + '.'.repeat(39) + '#'

  test('they appear in the dark, at least 4 steps away, and never inside a den area', () => {
    const g = game(ROOM, [], { spawnTicks: 1, max: 60, moveTicks: 1e9, den: 6 })
    const tamed = addBug(g, 30, 4)
    tamed.den = { x: 30, y: 4 }
    run(g, 60)
    const lit = new Set(g.lit)
    const wild = g.bugs.filter((b) => !b.den)
    assert.ok(wild.length > 40, `${wild.length} appeared`)
    for (const b of wild) {
      assert.ok(!lit.has(b.y * g.world.w + b.x), `${b.x},${b.y} is lit`)
      assert.ok(Math.abs(b.x - 1) + Math.abs(b.y - 4) >= 4, `${b.x},${b.y} is too close`)
      assert.ok((b.x - 30) ** 2 + (b.y - 4) ** 2 > 36, `${b.x},${b.y} is in the den area`)
    }
  })

  test('a wild bug never drifts into a den area, even to reach you', () => {
    const g = game(CORRIDOR, ['ore 8'], { spawnTicks: 1e9, den: 2 })
    const tamed = addBug(g, 6, 1)
    tamed.den = { x: 6, y: 1 }
    const wild = addBug(g, 1, 1)
    assert.equal(of(run(g, 600), 'nibble').length, 0)
    assert.equal(wild.x, 3) // the den area starts at x = 4
  })

  test('a wild bug caught in a new den area drifts out of it, and stops nibbling', () => {
    const g = game(CORRIDOR, ['ore 16', 'ore 16'], { spawnTicks: 1e9, den: 3 })
    const first = addBug(g, 10, 1)
    first.ate = 15 // one more nibble tames it
    const second = addBug(g, 9, 1) // 2 from you: too far to nibble, and it hovers
    const events = run(g, 200)
    assert.equal(of(events, 'tamed').length, 1)
    assert.equal(of(events, 'nibble').length, 1)
    assert.equal(second.x, 6) // out of the den area (x 7 to 13), and it stays out
    assert.equal(second.ate, 0)
  })

  test('b3.1 has no bugs', () => {
    const g = game(ROOM, ['ore 8'], undefined, B31)
    run(g, 1000)
    assert.deepEqual(g.bugs, [])
  })
})
