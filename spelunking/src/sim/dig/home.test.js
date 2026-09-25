// b3.1 has no teleport home (D055): the command does nothing, a deep fall just lands, and walking
// onto the home cell with something in the pack counts it in. b2.1 keeps the teleport.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { parseMap } from './examples.js'
import { command, createGame, tick } from './game.js'
import { packText, parsePack } from './pack.js'
import { compile, migrate, simConfig } from './ruleset.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./game.js').GameEvent} GameEvent */
/** @typedef {import('./game.js').Command} Command */

const read = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../rules/${f}`, import.meta.url), 'utf8'))
/** @param {string} name */
function rules(name) {
  const r = migrate(read(name))
  return { table: /** @type {import('./ruleset.js').Table} */ (compile(r).table), cfg: simConfig(r) }
}
const B31 = rules('b3.1.json')
const B21 = rules('b2.1.json')

/** A game on `rows`, home at `home` (you start at '@'). @param {string[]} rows @param {{ x: number, y: number }} home */
function game(rows, home, r = B31, pack = /** @type {string[]} */ ([])) {
  const { world, at } = parseMap(rows)
  const g = createGame(world, home, r.cfg, r.table)
  g.ch.x = at.x
  g.ch.y = at.y
  g.pack = parsePack(pack)
  return g
}

/** Runs the commands on tick 1, then ticks until nothing is left to do. @param {Game} g @param {Command[]} cmds */
function play(g, cmds) {
  for (const c of cmds) command(g, c)
  /** @type {GameEvent[]} */
  const events = []
  for (let t = 0; t < 400 && (t === 0 || g.run || g.step || g.probe); t++) {
    tick(g)
    events.push(...g.events)
    g.events.length = 0
  }
  return events
}
const flick = (/** @type {number} */ dx, /** @type {number} */ dy) =>
  /** @type {Command[]} */ ([{ type: 'intent', dx, dy }, { type: 'release' }])

// You cling to the wall on your right above a 2-wide shaft 6 deep; tunnelling that wall leaves
// nothing to hold, so you fall 6, deeper than harmlessDrop (4).
const SHAFT = ['#######', '#..@###', '###..##', '###..##', '###..##', '###..##', '###..##', '###..##', '#######']
const CORRIDOR = ['#######', '#...@.#', '#######']

describe('no teleport home (D055, b3.1)', () => {
  test('the teleport command does nothing', () => {
    const g = game(CORRIDOR, { x: 1, y: 1 }, B31, ['ore 3'])
    const events = play(g, [{ type: 'teleport' }])
    assert.deepEqual([g.ch.x, g.ch.y], [4, 1])
    assert.deepEqual(packText(g.pack), ['ore 3'])
    assert.equal(events.filter((e) => e.type === 'teleport').length, 0)
  })

  test('a deep fall just lands (stop fell), with the pack', () => {
    const g = game(SHAFT, { x: 1, y: 1 }, B31, ['ore 3'])
    const events = play(g, flick(1, 0))
    assert.deepEqual([g.ch.x, g.ch.y], [3, 7])
    assert.ok(events.some((e) => e.type === 'stop' && e.reason === 'fell'))
    assert.equal(events.filter((e) => e.type === 'teleport').length, 0)
    assert.deepEqual(packText(g.pack), ['ore 3', 'soft 1'])
  })

  test('b2.1 still teleports home after a deep fall', () => {
    const g = game(SHAFT, { x: 1, y: 1 }, B21, ['ore 3'])
    const events = play(g, flick(1, 0))
    assert.ok(events.some((e) => e.type === 'stop' && e.reason === 'fallHome'))
    assert.deepEqual([g.ch.x, g.ch.y], [1, 1])
    assert.deepEqual(g.pack, [])
  })

  test('walking onto the home cell counts the pack in and logs the dive', () => {
    const g = game(CORRIDOR, { x: 1, y: 1 }, B31, ['ore 3', 'loot 1'])
    const events = play(g, flick(-1, 0))
    assert.deepEqual([g.ch.x, g.ch.y], [1, 1])
    const home = events.filter((e) => e.type === 'home')
    assert.equal(home.length, 1)
    assert.deepEqual(g.pack, [])
    assert.deepEqual(g.stash, { soft: 0, hard: 0, ore: 3, loot: 1 })
    assert.equal(g.dives.length, 1)
    assert.equal(g.radius, 4) // the light is back to base with the pack empty
  })

  test('walking past home with an empty pack logs nothing', () => {
    const g = game(CORRIDOR, { x: 1, y: 1 }, B31)
    const events = play(g, flick(-1, 0))
    assert.deepEqual([g.ch.x, g.ch.y], [1, 1])
    assert.equal(events.filter((e) => e.type === 'home').length, 0)
    assert.equal(g.dives.length, 0)
  })
})
