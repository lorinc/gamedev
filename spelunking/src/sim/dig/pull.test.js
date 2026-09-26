// Pulling ore and loot out of the walls while you stand still (D062, ruleset b3.5): the nearest seen one
// within your light, one every pull.ticks, and the cell turns to the rock round it. Placed bugs mine the
// same way and hand their ore over as you pass (D063, ruleset b3.6).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { parseMap } from './examples.js'
import { addBug, blockOf } from './bugs.js'
import { command, createGame, tick } from './game.js'
import { packText, parsePack } from './pack.js'
import { compile, migrate, simConfig } from './ruleset.js'
import { Tile } from '../gen/world.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./game.js').GameEvent} GameEvent */

const read = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../rules/${f}`, import.meta.url), 'utf8'))
/** @param {string} name */
function rules(name) {
  const r = migrate(read(name))
  return { table: /** @type {import('./ruleset.js').Table} */ (compile(r).table), cfg: simConfig(r) }
}
const B35 = rules('b3.5.json')
const TICKS = /** @type {import('./pull.js').Pull} */ (B35.cfg.pull).ticks

/** A game on `rows` (you at '@'), no bugs. @param {string[]} rows @param {string[]} pack */
function game(rows, pack, r = B35) {
  const { world, at } = parseMap(rows)
  const cfg = structuredClone(r.cfg)
  delete cfg.bugs
  const g = createGame(world, { x: 0, y: 0 }, cfg, r.table)
  g.ch.x = at.x
  g.ch.y = at.y
  g.pack = parsePack(pack)
  return g
}
/** Ticks n times; the `pulled` events. @param {Game} g @param {number} n */
function pulls(g, n) {
  /** @type {GameEvent[]} */
  const out = []
  for (let t = 0; t < n; t++) {
    tick(g)
    out.push(...g.events.filter((e) => e.type === 'pulled'))
    g.events.length = 0
  }
  return out.map((e) => e.type === 'pulled' && [e.x, e.y, e.tile])
}
const tileAt = (/** @type {Game} */ g, /** @type {number} */ x, /** @type {number} */ y) => g.world.tiles[y * g.world.w + x]

describe('pulling ore and loot (D062)', () => {
  test('standing still: the nearest first, one every pull.ticks, and the cell turns to rock', () => {
    const g = game(['#########', '#o.@...$#', '#########'], [])
    assert.deepEqual(pulls(g, TICKS - 1), [])
    assert.deepEqual(pulls(g, 1), [[1, 1, Tile.Ore]])
    assert.equal(tileAt(g, 1, 1), Tile.Soft)
    assert.deepEqual(pulls(g, TICKS), [[7, 1, Tile.Loot]])
    assert.deepEqual(packText(g.pack), ['ore 1', 'loot 1'])
    assert.deepEqual(pulls(g, TICKS * 3), [])
  })

  test('the rock round it decides: hard among hard', () => {
    const g = game(['HHH####', 'Ho.@..#', 'HHH####'], [])
    pulls(g, TICKS)
    assert.equal(tileAt(g, 1, 1), Tile.Hard)
  })

  test('only seen ones: buried ore comes once the probe has shown it', () => {
    const g = game(['########', '#.@.#o##', '########'], []) // (5, 1) is inside the rock: not lit, never seen
    assert.deepEqual(pulls(g, TICKS * 2), [])
    const seen = /** @type {Uint8Array} */ (g.seen)
    seen[1 * g.world.w + 5] = 1 // as a probe ring would
    assert.deepEqual(pulls(g, TICKS), [[5, 1, Tile.Ore]])
  })

  test('not beyond your light radius, even if seen', () => {
    const g = game(['#'.repeat(24), '#@.........o' + '#'.repeat(12), '#'.repeat(24)], [])
    const seen = /** @type {Uint8Array} */ (g.seen)
    seen[1 * g.world.w + 11] = 1
    assert.deepEqual(pulls(g, TICKS * 2), [])
  })

  test('a move restarts the count', () => {
    const g = game(['#######', '#o.@..#', '#######'], [])
    pulls(g, TICKS - 10)
    command(g, { type: 'intent', dx: 1, dy: 0 }) // walks to the wall, 2 steps
    assert.deepEqual(pulls(g, 20), [])
    assert.ok(g.stillFor < TICKS - 10)
  })

  test('what fits: with the ore slots full, loot comes', () => {
    const slots = B35.cfg.packSlots
    const g = game(['#########', '#o.@..$.#', '#########'], [...Array(slots - 1).fill('ore 16'), 'loot 1'])
    assert.deepEqual(pulls(g, TICKS), [[6, 1, Tile.Loot]])
  })

  test('b3.4 has no pull', () => {
    const g = game(['#######', '#o.@..#', '#######'], [], rules('b3.4.json'))
    assert.deepEqual(pulls(g, TICKS * 2), [])
  })
})

test('g.pulling points at the cell that goes, and clears when you move (D063)', () => {
  const g = game(['#######', '#o.@..#', '#######'], [])
  tick(g)
  assert.deepEqual(g.pulling, { x: 1, y: 1 })
  command(g, { type: 'intent', dx: 1, dy: 0 })
  tick(g)
  assert.equal(g.pulling, null)
})

const B36 = rules('b3.6.json')
const MINE = /** @type {import('./bugs.js').Mine} */ (B36.cfg.bugs?.mine)

/**
 * A game on `rows` (you at '@') with no pull of your own and no wild bugs; every ore and loot cell is seen,
 * as a probe would have made it. @param {string[]} rows @param {string[]} pack
 */
function mineGame(rows, pack, r = B36) {
  const { world, at } = parseMap(rows)
  const cfg = structuredClone(r.cfg)
  delete cfg.pull
  const g = createGame(world, { x: 0, y: 0 }, cfg, r.table)
  g.ch.x = at.x
  g.ch.y = at.y
  g.pack = parsePack(pack)
  for (let k = 0; k <= blockOf(g, world.w - 1, world.h - 1); k++) g.refill[k] = 1e9
  const seen = /** @type {Uint8Array} */ (g.seen)
  world.tiles.forEach((t, i) => {
    if (t === Tile.Ore || t === Tile.Loot) seen[i] = 1
  })
  return g
}
/** A bug placed at (x, y), carrying `carry`. @param {Game} g @param {number} x @param {number} y */
function placed(g, x, y, carry = 0) {
  const bug = addBug(g, x, y)
  bug.kind = 'placed'
  bug.den = { x, y }
  bug.glow = { x, y }
  bug.carry = carry
  return bug
}
/** Ticks n times; the events of `type`. @param {Game} g @param {number} n @param {string} type */
function eventsOf(g, n, type) {
  /** @type {GameEvent[]} */
  const out = []
  for (let t = 0; t < n; t++) {
    tick(g)
    out.push(...g.events.filter((e) => e.type === type))
    g.events.length = 0
  }
  return out
}
const WALL = '#'.repeat(30)
const CORRIDOR = ['#' + '.'.repeat(28) + '#']

describe('placed bugs mine (D063)', () => {
  test('the nearest seen ore within reach of its den, one every mine.ticks, ore only; the cell turns to rock', () => {
    const top = WALL.split('')
    top[22] = 'o' // 2 across, 1 up from the bug
    top[5] = 'o' // 15 across: out of reach
    const bottom = WALL.split('')
    bottom[21] = '$' // the nearest, but loot stays yours
    bottom[15] = 'o' // 5 across, 1 down
    const g = mineGame([top.join(''), '#@' + CORRIDOR[0].slice(2), bottom.join('')], [])
    const bug = placed(g, 20, 1)
    tick(g)
    assert.deepEqual(bug.target, { x: 22, y: 0 })
    const pulled = (/** @type {number} */ n) => eventsOf(g, n, 'pulled').map((e) => e.type === 'pulled' && [e.x, e.y, e.tile, e.by])
    assert.deepEqual(pulled(MINE.ticks - 2), [])
    assert.deepEqual(pulled(1), [[22, 0, Tile.Ore, bug.id]])
    assert.equal(tileAt(g, 22, 0), Tile.Soft)
    assert.equal(bug.carry, 1)
    tick(g)
    assert.deepEqual(bug.target, { x: 15, y: 2 })
    assert.deepEqual(pulled(MINE.ticks * 3), [[15, 2, Tile.Ore, bug.id]])
    assert.equal(bug.target, null)
    assert.equal(tileAt(g, 21, 2), Tile.Loot)
    assert.equal(tileAt(g, 5, 0), Tile.Ore)
  })

  test('it carries mine.carry, then stops and waits', () => {
    const g = mineGame([WALL.replace(/#/g, 'o').replace(/^o|o$/g, '#'), '#@' + CORRIDOR[0].slice(2), WALL], [])
    const bug = placed(g, 20, 1)
    assert.equal(eventsOf(g, MINE.ticks * (MINE.carry + 2), 'pulled').length, MINE.carry)
    assert.equal(bug.carry, MINE.carry)
    assert.equal(bug.target, null)
  })

  test('you within mine.hand tiles take its ore, one every handTicks; not a tile further', () => {
    const near = mineGame([WALL, '#' + '.'.repeat(13) + '@' + '.'.repeat(14) + '#', WALL], [])
    const bug = placed(near, 14 - MINE.hand, 1, 3)
    const handed = eventsOf(near, MINE.handTicks * 3, 'handed')
    assert.equal(handed.length, 3)
    assert.deepEqual(packText(near.pack), ['ore 3'])
    assert.equal(bug.carry, 0)
    const far = mineGame([WALL, '#' + '.'.repeat(13) + '@' + '.'.repeat(14) + '#', WALL], [])
    placed(far, 14 - MINE.hand - 1, 1, 3)
    assert.equal(eventsOf(far, 200, 'handed').length, 0)
  })

  test('with your pack full, it waits', () => {
    const g = mineGame([WALL, '#' + '.'.repeat(13) + '@' + '.'.repeat(14) + '#', WALL], Array(B36.cfg.packSlots).fill('ore 16'))
    const bug = placed(g, 12, 1, 3)
    assert.equal(eventsOf(g, 200, 'handed').length, 0)
    assert.equal(bug.carry, 3)
  })

  test('walking past a full bug takes its ore without stopping you', () => {
    const g = mineGame([WALL, '#@' + CORRIDOR[0].slice(2), WALL], [])
    placed(g, 12, 1, MINE.carry)
    command(g, { type: 'intent', dx: 1, dy: 0 })
    eventsOf(g, 400, 'handed')
    assert.equal(g.ch.x, 28)
    assert.deepEqual(packText(g.pack), [`ore ${MINE.carry}`])
  })

  test('b3.5 placed bugs only hover', () => {
    const g = mineGame(['#' + 'o'.repeat(28) + '#', '#@' + CORRIDOR[0].slice(2), WALL], [], rules('b3.5.json'))
    const bug = placed(g, 20, 1)
    assert.equal(eventsOf(g, 2000, 'pulled').length, 0)
    assert.equal(bug.target, null)
  })
})

describe('after playing b3.6 (D064, b3.7)', () => {
  const B37 = rules('b3.7.json')
  const SHARED = ['#####o##o#####', '#....@.......#', '##############']

  test('you and a bug never take the same ore: the first to target it keeps it', () => {
    const g = mineGame(SHARED, [], B37)
    g.cfg.pull = B37.cfg.pull
    const bug = placed(g, 6, 1)
    tick(g) // you pick first this tick
    assert.deepEqual(g.pulling, { x: 5, y: 0 })
    assert.deepEqual(bug.target, { x: 8, y: 0 })
    const h = mineGame(SHARED, [], B37)
    h.cfg.pull = B37.cfg.pull
    const first = placed(h, 6, 1)
    first.target = { x: 5, y: 0 } // the bug was on it first
    tick(h)
    assert.deepEqual(first.target, { x: 5, y: 0 })
    assert.deepEqual(h.pulling, { x: 8, y: 0 })
  })

  /** A corridor with you at x = 1 and one ore above x = 21; a bug placed at x = 20. @param {number} [w] */
  function runOut(w = 30) {
    const top = '#'.repeat(w).split('')
    top[21] = 'o'
    const g = mineGame([top.join(''), '#@' + '.'.repeat(w - 3) + '#', '#'.repeat(w)], [], B37)
    return { g, bug: placed(g, 20, 1) }
  }

  test('its area run out, a bug comes to you, hands its ore over and goes back into the bar', () => {
    const { g, bug } = runOut()
    const events = eventsOf(g, MINE.ticks + 400, 'returned')
    assert.equal(events.length, 1)
    assert.equal(bug.kind, 'bar')
    assert.deepEqual(g.bar, [bug])
    assert.deepEqual(packText(g.pack), ['ore 1'])
    assert.equal(bug.den, null)
  })

  test('it goes back only into a wholly empty slot: none with taming started in the last free one', () => {
    const { g, bug } = runOut()
    for (let k = 0; k < /** @type {import('./bugs.js').Bugs} */ (B37.cfg.bugs).barSlots - 1; k++) {
      const b = addBug(g, 1, 1)
      b.kind = 'bar'
      b.block = -1
      g.bar.push(b)
    }
    g.fed = 1
    eventsOf(g, MINE.ticks + 400, 'returned')
    assert.equal(bug.kind, 'placed')
    assert.equal(bug.seeking, false)
    assert.equal(bug.carry, 1)
  })

  test('a bug that never pulled stays; beyond the field it waits at its den', () => {
    const idle = mineGame([WALL, '#@' + CORRIDOR[0].slice(2), WALL], [], B37)
    const stays = placed(idle, 20, 1)
    eventsOf(idle, 200, 'returned')
    assert.equal(stays.seeking, false)
    const { g, bug } = runOut(60)
    g.ch.x = 50 // 30 steps off: beyond the field (seek 20), and out of reach of the hand-over
    eventsOf(g, MINE.ticks + 200, 'returned')
    assert.equal(bug.seeking, true)
    assert.deepEqual([bug.x, bug.y], [20, 1])
  })
})
