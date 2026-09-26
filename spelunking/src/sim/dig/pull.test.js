// Pulling ore and loot out of the walls while you stand still (D062, ruleset b3.5): the nearest seen one
// within your light, one every pull.ticks, and the cell turns to the rock round it.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { parseMap } from './examples.js'
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
