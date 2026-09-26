// Moon bugs (D056, D059, D060, D061, D062, ruleset b3.5). Wild ones live in the fog, one per block of the
// nearest; up to 3 drift to you through open cells, nibble ore (never loot) from the pack, scatter from
// a probe ring. They appear only in the dark and never near a placed bug. Their bites add up to one shared count; at `tame`, the last biter goes into the bug bar,
// circles you and lights around itself. The hold places the bar's first bug. b3.1 has no bugs.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { addBug, blockOf } from './bugs.js'
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
const B35 = rules('b3.5.json')
const B31 = rules('b3.1.json')
const BUGS = /** @type {Bugs} */ (B35.cfg.bugs)

/**
 * A game on `rows` (you at '@', home in the top-left corner, out of the way). The blocks get no wild
 * bugs of their own unless `spawn`. @param {string[]} rows @param {string[]} pack @param {Partial<Bugs>} [bugs]
 */
function game(rows, pack, bugs = {}, r = B35, spawn = false) {
  const { world, at } = parseMap(rows)
  const cfg = r.cfg.bugs ? { ...r.cfg, bugs: { ...BUGS, ...bugs } } : r.cfg
  const g = createGame(world, { x: 0, y: 0 }, structuredClone(cfg), r.table)
  g.ch.x = at.x
  g.ch.y = at.y
  g.pack = parsePack(pack)
  if (!spawn && cfg.bugs) for (let k = 0; k <= blockOf(g, world.w - 1, world.h - 1); k++) g.refill[k] = 1e9
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

describe('wild bugs (D056, D061)', () => {
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
    const g = game(CORRIDOR, ['ore 16', 'ore 4'], { barSlots: 1 })
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

  test('a chaser the field lost wanders again in its block, and is gone outside it', () => {
    const g = game(['#' + '.'.repeat(38) + '@#'], ['ore 8'], { block: 8, seek: 5, moveTicks: 1e9 })
    const home = addBug(g, 36, 0) // block 4, like you
    const away = addBug(g, 35, 0)
    away.block = 3 // it came from block 3
    run(g, 1)
    assert.ok(home.chasing && away.chasing)
    g.ch.x = 20 // you went off: the field loses both
    run(g, 1)
    assert.deepEqual(g.bugs, [home])
    assert.equal(home.chasing, false)
    assert.ok(g.refill[3] > g.tick, 'block 3 tries again later')
  })
})

describe('tamed bugs: the bar and the hold (D060)', () => {
  const ROOM = ['#' + '#'.repeat(40) + '#', ...Array(7).fill('#' + '.'.repeat(40) + '#'), '#' + '#'.repeat(40) + '#']
  ROOM[4] = '#' + '.'.repeat(19) + '@' + '.'.repeat(20) + '#' // you at (20, 4)

  test('a bar bug keeps barNear to barFar steps from you, keeps its heading, and lights 2 around itself for good (D062)', () => {
    const g = game(ROOM, [])
    g.cfg.light = { base: 0, orePer: 0, lootPer: 0 } // your own light: just your cell
    const bug = inBar(g) // on your cell: it moves off first
    run(g, 100)
    /** @type {Set<string>} */
    const cells = new Set()
    let moves = 0
    let straight = 0
    let dir = bug.dir
    for (let t = 0; t < 3000; t++) {
      const was = bug.movedAt
      run(g, 1)
      const d = Math.abs(bug.x - 20) + Math.abs(bug.y - 4)
      assert.ok(d >= BUGS.barNear && d <= BUGS.barFar, `${bug.x},${bug.y} is ${d} off`)
      cells.add(`${bug.x},${bug.y}`)
      if (bug.movedAt !== was && `${bug.x},${bug.y}` !== `${bug.from.x},${bug.from.y}`) {
        moves++
        if (bug.dir === dir) straight++
        dir = bug.dir
      }
    }
    assert.ok(cells.size >= 12, `it roams: ${cells.size} cells`)
    assert.ok(straight > moves / 3, `inertia: ${straight} of ${moves} steps kept the heading`)
    const seen = /** @type {Uint8Array} */ (g.seen)
    assert.ok(
      [...seen].some((v, i) => v && Math.abs((i % g.world.w) - 20) + Math.abs(Math.trunc(i / g.world.w) - 4) >= 5),
      'lit from the bug',
    )
    assert.equal(seen[at(g, 20 + BUGS.barFar + 3, 4)], 0, 'nothing past barFar + 2')
  })

  test('a bar bug follows you, twice as fast, and jumps to you when you get too far', () => {
    const g = game(ROOM, [])
    const bug = inBar(g)
    g.ch.x = 32 // 12 steps off: it comes down the field at half barMoveTicks a step
    run(g, (12 * BUGS.barMoveTicks) / 2 + 10)
    assert.ok(Math.abs(bug.x - 32) + Math.abs(bug.y - 4) <= BUGS.barFar, `${bug.x},${bug.y} is behind`)
    g.ch.x = 5 // 27 steps off: past seek, so it jumps
    run(g, BUGS.barMoveTicks + 1)
    assert.ok(Math.abs(bug.x - 5) + Math.abs(bug.y - 4) <= 1, `${bug.x},${bug.y} didn't jump to you`)
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

  test('one per block, in the dark, at least 4 steps away, never inside a den area (D061)', () => {
    const g = game(ROOM, [], { block: 8, moveTicks: 1e9, den: 6 }, B35, true)
    placed(g, 30, 4)
    run(g, 1)
    const lit = new Set(g.lit)
    const wild = g.bugs.filter((b) => b.kind === 'wild')
    assert.deepEqual(
      wild.map((b) => b.block).sort((p, q) => p - q),
      [0, 1, 2, 3, 4, 5], // the bottom row of blocks is rock
    )
    for (const b of wild) {
      assert.equal(blockOf(g, b.x, b.y), b.block)
      assert.ok(!lit.has(b.y * g.world.w + b.x), `${b.x},${b.y} is lit`)
      assert.ok(Math.abs(b.x - 1) + Math.abs(b.y - 4) >= 4, `${b.x},${b.y} is too close`)
      assert.ok((b.x - 30) ** 2 + (b.y - 4) ** 2 > 36, `${b.x},${b.y} is in the den area`)
    }
  })

  test('only the nearest blocks hold one; walk off and they follow you', () => {
    const g = game(
      ['#' + '#'.repeat(78) + '#', '#@' + '.'.repeat(77) + '#', '#' + '#'.repeat(78) + '#'],
      [],
      { block: 8, blocks: 3, moveTicks: 1e9 },
      B35,
      true,
    )
    run(g, 1)
    const blocks = () => g.bugs.map((b) => b.block).sort((p, q) => p - q)
    assert.deepEqual(blocks(), [0, 1, 9]) // block 9 is near the other way round
    g.ch.x = 40
    run(g, 1)
    assert.deepEqual(blocks(), [4, 5, 6])
  })

  test('a block whose bug was tamed gets a new one refillTicks later', () => {
    const g = game(CORRIDOR, ['ore 16'], { tame: 2 }, B35, true)
    run(g, 1)
    const [first] = g.bugs
    let t = 0
    while (first.kind === 'wild' && t++ < 2000) run(g, 1)
    assert.equal(first.kind, 'bar')
    const tamedAt = g.tick
    run(g, BUGS.refillTicks - 1)
    assert.equal(g.bugs.filter((b) => b.kind === 'wild').length, 0)
    run(g, 1)
    assert.equal(g.bugs.filter((b) => b.kind === 'wild').length, 1)
    assert.equal(g.tick, tamedAt + BUGS.refillTicks)
  })

  test('a wanderer never leaves its block', () => {
    const g = game(ROOM, [], { block: 8, moveTicks: 1, seek: 1 }, B35, true)
    for (let t = 0; t < 2000; t++) {
      run(g, 1)
      for (const b of g.bugs) assert.equal(blockOf(g, b.x, b.y), b.block)
    }
    assert.equal(g.bugs.length, 6)
  })

  test('a sealed cave holds one too, and it never comes for you', () => {
    const g = game(['##########', '#@..#....#', '##########'], ['ore 8'], {}, B35, true)
    const events = run(g, 1000)
    const [b] = g.bugs
    assert.equal(g.bugs.length, 1)
    assert.ok(b.x > 4, `it's in the sealed cave, at ${b.x}`) // your side is all within 4 steps
    assert.equal(b.chasing, false)
    assert.equal(of(events, 'nibble').length, 0)
  })

  test('at most 3 chase you; only chasers nibble', () => {
    const g = game(ROOM, ['ore 16', 'ore 16'], { block: 8, tame: 1e9 }, B35, true)
    const events = run(g, 600)
    const chasers = g.bugs.filter((b) => b.chasing)
    assert.equal(g.bugs.length, 6)
    assert.equal(chasers.length, 3)
    const ids = new Set(of(events, 'nibble').map((e) => e.type === 'nibble' && e.id))
    assert.ok(ids.size > 0 && ids.size <= 3, `${ids.size} bugs nibbled`)
    for (const id of ids)
      assert.ok(
        chasers.some((b) => b.id === id),
        `bug ${id} nibbled without chasing`,
      )
  })

  test('a wild bug never drifts into a den area, even to reach you', () => {
    const g = game(CORRIDOR, ['ore 8'], { den: 2 })
    placed(g, 6, 1)
    const wild = addBug(g, 1, 1)
    assert.equal(of(run(g, 600), 'nibble').length, 0)
    assert.equal(wild.x, 3) // the den area starts at x = 4
  })

  test('a wild bug caught in a new den area drifts out of it, and stops nibbling', () => {
    const g = game(CORRIDOR, ['ore 16'], { den: 3 })
    inBar(g)
    const wild = addBug(g, 9, 1) // 2 from you: too far to nibble, and it hovers
    command(g, { type: 'place' }) // no open cell 2 above: the nearest is yours, (11, 1)
    const events = run(g, 200)
    assert.equal(of(events, 'placed').length, 1)
    assert.equal(of(events, 'nibble').length, 0)
    assert.equal(wild.x, 7) // out of the den area (x 8 to 14), and it stays out
  })

  test('each bar bug keeps one chaser away; a full bar leaves you in peace (D062)', () => {
    const g = game(ROOM, ['ore 16', 'ore 16'], { block: 8, tame: 1e9 }, B35, true)
    const bar = [inBar(g), inBar(g)]
    run(g, 600)
    assert.equal(g.bugs.filter((b) => b.chasing).length, 1)
    bar.push(inBar(g))
    run(g, 1)
    assert.equal(g.bugs.filter((b) => b.chasing).length, 0)
    assert.equal(of(run(g, 600), 'nibble').length, 0)
    g.bar.pop() // one less in the bar (placing one would make a den area round you): one comes back
    const events = run(g, 600)
    assert.equal(g.bugs.filter((b) => b.chasing).length, 1)
    assert.ok(of(events, 'nibble').length > 0)
  })

  test('b3.1 has no bugs', () => {
    const g = game(ROOM, ['ore 8'], undefined, B31, true)
    run(g, 1000)
    assert.deepEqual(g.bugs, [])
  })
})
