// Moon bugs (D056, D059, D060, ruleset b3.3). Wild ones drift to you through open cells, nibble ore
// (never loot) from the pack, scatter from a probe ring, appear only in the dark and never near a
// placed bug. Their bites add up to one shared count; at `tame`, the last biter goes into the bug bar,
// circles you and lights around itself. The hold places the bar's first bug. b3.1 has no bugs.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { addBug, ORBIT } from './bugs.js'
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
const B33 = rules('b3.3.json')
const B31 = rules('b3.1.json')
const BUGS = /** @type {Bugs} */ (B33.cfg.bugs)

/**
 * A game on `rows` (you at '@', home in the top-left corner, out of the way), no spawning unless
 * `bugs` says so. @param {string[]} rows @param {string[]} pack @param {Partial<Bugs>} [bugs]
 */
function game(rows, pack, bugs = { spawnTicks: 1e9 }, r = B33) {
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

/** A tamed bug in the bar. @param {Game} g */
function inBar(g) {
  const bug = addBug(g, g.ch.x, g.ch.y)
  bug.kind = 'bar'
  g.bar.push(bug)
  return bug
}
/** A bug placed at (x, y). @param {Game} g @param {number} x @param {number} y */
function placed(g, x, y) {
  const bug = addBug(g, x, y)
  bug.kind = 'placed'
  bug.den = { x, y }
  bug.glow = { x, y }
  return bug
}
const at = (/** @type {Game} */ g, /** @type {number} */ x, /** @type {number} */ y) => y * g.world.w + x

const CORRIDOR = ['#############', '#..........@#', '#############']

describe('wild bugs (D056, b3.3)', () => {
  test('one drifts to you, nibbles ore, and the 16th bite puts it in the bar', () => {
    const g = game(CORRIDOR, ['ore 16', 'ore 4', 'loot 2'])
    const bug = addBug(g, 1, 1)
    const events = run(g, 1000)
    assert.equal(of(events, 'nibble').length, 16)
    assert.deepEqual(
      of(events, 'tamed').map((e) => e.type === 'tamed' && [e.x, e.slot]),
      [[10, 0]], // tamed next to you, into slot 1
    )
    assert.equal(bug.kind, 'bar')
    assert.deepEqual(g.bar, [bug])
    assert.equal(g.fed, 0)
    assert.deepEqual(packText(g.pack), ['ore 4', '-', 'loot 2']) // the last ore slot first, no loot
    assert.equal(g.radius, 4) // 4 ore and 2 loot: the light is back to base
  })

  test('the count is shared: the bug that takes the 16th bite is tamed (D060)', () => {
    const g = game(CORRIDOR, ['ore 16'])
    const a = addBug(g, 10, 1)
    const b = addBug(g, 10, 1)
    const events = run(g, 400)
    assert.equal(of(events, 'nibble').length, 16) // 8 each: neither had 16 of its own
    assert.equal(a.kind, 'wild')
    assert.equal(b.kind, 'bar')
    assert.deepEqual(g.pack, [null])
  })

  test('with the bar full, nobody is tamed, and the count waits', () => {
    const g = game(CORRIDOR, ['ore 16', 'ore 4'], { spawnTicks: 1e9, barSlots: 1 })
    inBar(g)
    const wild = addBug(g, 10, 1)
    const events = run(g, 1000)
    assert.equal(of(events, 'nibble').length, 20)
    assert.equal(of(events, 'tamed').length, 0)
    assert.equal(wild.kind, 'wild')
    assert.equal(g.fed, 16)
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

describe('tamed bugs: the bar and the hold (D060)', () => {
  const ROOM = ['#' + '#'.repeat(40) + '#', ...Array(7).fill('#' + '.'.repeat(40) + '#'), '#' + '#'.repeat(40) + '#']
  ROOM[4] = '#' + '.'.repeat(19) + '@' + '.'.repeat(20) + '#' // you at (20, 4)

  test('a bar bug circles you, two out, and lights 2 around itself for good', () => {
    const g = game(ROOM, [])
    g.cfg.light = { base: 0, orePer: 0, lootPer: 0 } // your own light: just your cell
    const bug = inBar(g)
    run(g, 1)
    const [dx, dy] = ORBIT[Math.floor(1 / BUGS.orbitTicks) % ORBIT.length]
    assert.deepEqual([bug.x, bug.y], [20 + dx, 4 + dy])
    assert.ok(g.lit.includes(at(g, 24, 4)), 'lit 2 past the bug')
    run(g, BUGS.orbitTicks * ORBIT.length) // a whole circle
    const seen = /** @type {Uint8Array} */ (g.seen)
    for (const [x, y] of [
      [16, 4],
      [24, 4],
      [20, 0],
      [20, 7],
    ])
      assert.equal(seen[at(g, x, y)], 1, `${x},${y} seen`)
    assert.equal(seen[at(g, 25, 4)], 0, 'nothing past 4')
  })

  test('the hold places the first bug 2 above your head, and the bar shifts', () => {
    const g = game(ROOM, [])
    const [first, second] = [inBar(g), inBar(g)]
    command(g, { type: 'place' })
    const events = run(g, 1)
    assert.deepEqual(of(events, 'placed').length, 1)
    assert.equal(first.kind, 'placed')
    assert.deepEqual(first.den, { x: 20, y: 2 })
    assert.deepEqual(g.bar, [second])
    g.ch.x = 35 // walk away: its light stays
    run(g, 1)
    assert.ok(g.lit.includes(at(g, 20, 2)) && g.lit.includes(at(g, 18, 2)))
  })

  test('above rock, it goes to the nearest open cell', () => {
    const g = game(['#####', '#.###', '#####', '#.@.#', '#####'], [])
    const bug = inBar(g)
    command(g, { type: 'place' })
    run(g, 1)
    assert.deepEqual(bug.den, { x: 1, y: 1 })
  })

  test('with an empty bar, the hold does nothing', () => {
    const g = game(ROOM, [])
    command(g, { type: 'place' })
    assert.equal(of(run(g, 1), 'placed').length, 0)
    assert.deepEqual(g.bugs, [])
  })
})

describe('where wild bugs are', () => {
  const ROOM = ['#' + '#'.repeat(40) + '#', ...Array(7).fill('#' + '.'.repeat(40) + '#'), '#' + '#'.repeat(40) + '#']
  ROOM[4] = '#@' + '.'.repeat(39) + '#'

  test('they appear in the dark, at least 4 steps away, and never inside a den area', () => {
    const g = game(ROOM, [], { spawnTicks: 1, max: 60, moveTicks: 1e9, den: 6 })
    placed(g, 30, 4)
    run(g, 60)
    const lit = new Set(g.lit)
    const wild = g.bugs.filter((b) => b.kind === 'wild')
    assert.ok(wild.length > 40, `${wild.length} appeared`)
    for (const b of wild) {
      assert.ok(!lit.has(b.y * g.world.w + b.x), `${b.x},${b.y} is lit`)
      assert.ok(Math.abs(b.x - 1) + Math.abs(b.y - 4) >= 4, `${b.x},${b.y} is too close`)
      assert.ok((b.x - 30) ** 2 + (b.y - 4) ** 2 > 36, `${b.x},${b.y} is in the den area`)
    }
  })

  test('a wild bug never drifts into a den area, even to reach you', () => {
    const g = game(CORRIDOR, ['ore 8'], { spawnTicks: 1e9, den: 2 })
    placed(g, 6, 1)
    const wild = addBug(g, 1, 1)
    assert.equal(of(run(g, 600), 'nibble').length, 0)
    assert.equal(wild.x, 3) // the den area starts at x = 4
  })

  test('a wild bug caught in a new den area drifts out of it, and stops nibbling', () => {
    const g = game(CORRIDOR, ['ore 16'], { spawnTicks: 1e9, den: 3 })
    inBar(g)
    const wild = addBug(g, 9, 1) // 2 from you: too far to nibble, and it hovers
    command(g, { type: 'place' }) // no open cell 2 above: the nearest is yours, (11, 1)
    const events = run(g, 200)
    assert.equal(of(events, 'placed').length, 1)
    assert.equal(of(events, 'nibble').length, 0)
    assert.equal(wild.x, 7) // out of the den area (x 8 to 14), and it stays out
  })

  test('b3.1 has no bugs', () => {
    const g = game(ROOM, ['ore 8'], undefined, B31)
    run(g, 1000)
    assert.deepEqual(g.bugs, [])
  })
})
