// The seismic probe (D053) on small ASCII maps (R8). A picture of what's seen shows the map's
// characters where a cell is seen and a space where it isn't.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { mapRows, parseMap } from './examples.js'
import { command, createGame, tick } from './game.js'
import { parsePack } from './pack.js'
import { probeReach, ringCells } from './probe.js'
import { compile, migrate, simConfig } from './ruleset.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./game.js').GameEvent} GameEvent */
/** @typedef {import('./game.js').Command} Command */

const read = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../rules/${f}`, import.meta.url), 'utf8'))
const B21 = migrate(read('b2.1.json'))
const TABLE = /** @type {import('./ruleset.js').Table} */ (compile(B21).table)
const CFG = simConfig(B21) // light base 4; probe flick 2, hold 4, ringTicks 5
const RING = 5
const B31 = migrate(read('b3.1.json'))
const TABLE31 = /** @type {import('./ruleset.js').Table} */ (compile(B31).table)
const CFG31 = simConfig(B31)

// Solid rock, 21 × 19, with you in a 1-cell pocket in the middle (10, 9): every ring of a probe up to
// 8 fits in it, and there's rock beyond. A little ore, loot and a cave inside the rock.
const ROCK = [
  '#####################',
  '#####################',
  '#####################',
  '#####################',
  '#########...#########',
  '#####################',
  '#####o###############',
  '#####################',
  '#####################',
  '##########@#######$##',
  '#####################',
  '#####################',
  '#####################',
  '#####################',
  '#####################',
  '#####################',
  '#####################',
  '#####################',
  '#####################',
]

/** @param {string[]} rows @param {{ pack?: string[], light?: object, table?: import('./ruleset.js').Table, cfg?: object }} [o] */
function game(rows, o = {}) {
  const { world, at } = parseMap(rows)
  const cfg = /** @type {import('./rules.js').SimConfig} */ ({ ...(o.cfg ?? CFG), ...(o.light && { light: { ...CFG.light, ...o.light } }) })
  const g = createGame(world, at, cfg, o.table ?? TABLE)
  g.pack = parsePack(o.pack ?? [])
  tick(g) // the pack was set after createGame: the light catches up on the next tick
  g.events.length = 0
  return g
}

const seen = (/** @type {Game} */ g) => new Set([.../** @type {Uint8Array} */ (g.seen).keys()].filter((i) => g.seen?.[i]))
/** The map with only the given cells showing. @param {Game} g @param {Set<number>} show */
const picture = (g, show) =>
  mapRows(g.world, g.ch).map((row, y) => [...row].map((c, x) => (show.has(y * g.world.w + x) ? c : ' ')).join(''))
/** Cells within r of (x, y): dx² + dy² ≤ r², no wrap (the maps are wide enough). @param {Game} g @param {number} r */
function disc(g, r, x = g.ch.x, y = g.ch.y) {
  const out = new Set()
  for (let cy = 0; cy < g.world.h; cy++)
    for (let cx = 0; cx < g.world.w; cx++) if ((cx - x) ** 2 + (cy - y) ** 2 <= r * r) out.add(cy * g.world.w + cx)
  return out
}

/**
 * Plays `script` (commands per tick, counted from 1) for `n` ticks, or until nothing is left to do.
 * Returns the events, each with the tick it came on.
 * @param {Game} g @param {Record<number, Command[]>} script @param {number} [n]
 * @returns {(GameEvent & { at: number })[]}
 */
function play(g, script, n = 400) {
  const last = Math.max(...Object.keys(script).map(Number))
  /** @type {(GameEvent & { at: number })[]} */
  const events = []
  for (let t = 1; t <= n && (t <= last || g.run || g.step || g.probe); t++) {
    for (const cmd of script[t] ?? []) command(g, cmd)
    tick(g)
    events.push(...g.events.map((e) => ({ ...e, at: t })))
    g.events.length = 0
  }
  return events
}
/** @type {Command[]} */
const FLICK_DOWN = [{ type: 'intent', dx: 0, dy: 1 }, { type: 'release' }]
/** @type {Command[]} */
const HELD_DOWN = [{ type: 'intent', dx: 0, dy: 1, held: true }]
const rings = (/** @type {GameEvent[]} */ events) => events.flatMap((e) => (e.type === 'ring' ? [e.r] : []))
const stops = (/** @type {GameEvent[]} */ events) => events.flatMap((e) => (e.type === 'stop' ? [e.reason] : []))

describe('the rings (D053)', () => {
  test('ring r is (r - 1)² < dx² + dy² ≤ r²: together they fill the disc, each cell once', () => {
    const g = game(ROCK)
    /** @type {number[]} */
    const all = []
    for (let r = 1; r <= 6; r++) all.push(...ringCells(g.world, g.ch, r))
    assert.equal(new Set(all).size, all.length)
    assert.deepEqual(new Set(all), disc(g, 6))
    assert.deepEqual(ringCells(g.world, g.ch, 1).length, 5) // the centre too: the probed block (D055)
    assert.deepEqual(ringCells(g.world, g.ch, 2).length, 8) // (±1, ±1), (±2, 0), (0, ±2)
  })

  test('x wraps the short way round, and a ring wider than the world has each cell once', () => {
    const { world, at } = parseMap(['#####', '##@##', '#####'])
    const all = [1, 2, 3].flatMap((r) => ringCells(world, at, r))
    assert.equal(new Set(all).size, all.length)
    assert.equal(all.length, 15) // every cell: none is more than 2 away the short way round
    const { world: w6, at: a6 } = parseMap(['#.....', '@.....'])
    assert.deepEqual(
      ringCells(w6, a6, 3).sort((a, b) => a - b),
      [2, 4, 9], // (±2, -1) is d² 5; x = 3 is 3 away both ways round, once; (∓3, -1) is d² 10
    )
  })

  test('the reach: light radius + flick at least, + hold at most', () => {
    assert.deepEqual(probeReach(4, { flick: 2, hold: 4, ringTicks: 5 }), { min: 6, max: 8 })
    assert.deepEqual(probeReach(0, { flick: 0, hold: -1, ringTicks: 5 }), { min: 1, max: 1 })
  })
})

describe('a flick ↓ on a floor probes (D053)', () => {
  test('it reveals exactly the disc of light + 2, rock interiors, ore, loot and caves, and ends', () => {
    const g = game(ROCK, { light: { base: 1 } })
    const before = seen(g)
    const events = play(g, { 1: FLICK_DOWN })
    assert.deepEqual(rings(events), [1, 2, 3])
    assert.deepEqual(stops(events), ['probe'])
    assert.deepEqual(picture(g, seen(g)), [
      '                     ',
      '                     ',
      '                     ',
      '                     ',
      '                     ',
      '                     ',
      '          #          ',
      '        #####        ',
      '        #####        ',
      '       ###@###       ',
      '        #####        ',
      '        #####        ',
      '          #          ',
      '                     ',
      '                     ',
      '                     ',
      '                     ',
      '                     ',
      '                     ',
    ])
    assert.deepEqual(seen(g), new Set([...before, ...disc(g, 3)]))
  })

  test('at the default light (4) a flick reaches 6: the ore and the cave, not the loot 8 away', () => {
    const g = game(ROCK)
    play(g, { 1: FLICK_DOWN })
    assert.deepEqual(seen(g), disc(g, 6)) // the lit cells are inside it
    const at = (/** @type {number} */ x, /** @type {number} */ y) => seen(g).has(y * g.world.w + x)
    assert.ok(at(5, 6) && at(10, 4) && at(9, 4) && at(11, 4), 'the ore (d² 34) and the cave (d² 25, 26) are seen')
    assert.ok(!at(18, 9), 'the loot (d² 64) is not')
  })

  test('the rings come one every ringTicks, in order, and the probe ends a ring later', () => {
    const g = game(ROCK)
    const events = play(g, { 1: FLICK_DOWN })
    const at = events.filter((e) => e.type === 'ring').map((e) => [e.type === 'ring' && e.r, e.at])
    assert.deepEqual(
      at,
      [1, 2, 3, 4, 5, 6].map((r) => [r, 1 + (r - 1) * RING]),
    )
    assert.deepEqual(
      events.filter((e) => e.type === 'stop').map((e) => e.at),
      [1 + 6 * RING],
    )
    // each ring's newly seen cells come on its tick, and lie in that ring
    for (const e of events)
      if (e.type === 'seen') {
        const r = /** @type {any} */ (events.find((x) => x.type === 'ring' && x.at === e.at))?.r
        assert.ok(r, `seen cells on tick ${e.at} without a ring`)
        const ring = new Set(ringCells(g.world, g.ch, r))
        assert.ok(e.cells.every((i) => ring.has(i)))
      }
  })

  test('the character stands still the whole time, with no step', () => {
    const g = game(ROCK)
    const from = [g.ch.x, g.ch.y]
    for (let t = 1; t <= 40; t++) {
      if (t === 1) FLICK_DOWN.forEach((c) => command(g, c))
      tick(g)
      assert.deepEqual([g.ch.x, g.ch.y], from)
      assert.equal(g.step, null)
      assert.ok(!g.events.some((e) => e.type === 'step'))
      if (t <= 30) assert.ok(g.probe && g.probe.x === from[0] && g.probe.y === from[1], `tick ${t}: the probe is there`)
      g.events.length = 0
    }
    assert.equal(g.probe, null)
  })

  test("a flick's probe doesn't repeat: the run ends with it", () => {
    const g = game(ROCK)
    const events = play(g, { 1: FLICK_DOWN }, 300)
    for (let t = 0; t < 300; t++) tick(g)
    assert.deepEqual(rings(events), [1, 2, 3, 4, 5, 6])
    assert.ok(!g.events.some((e) => e.type === 'ring'))
    assert.equal(g.run, null)
    assert.equal(g.probe, null)
  })

  test('a fuller pack is a brighter light, and a bigger probe', () => {
    const g = game(ROCK, { pack: ['ore 16'] }) // radius 5
    assert.equal(g.radius, 5)
    assert.deepEqual(rings(play(g, { 1: FLICK_DOWN })), [1, 2, 3, 4, 5, 6, 7])
    assert.deepEqual(seen(g), disc(g, 7))
  })
})

describe('a held ↓ probes further (D053)', () => {
  test('held, it grows to light + 4, reached at 0.7 s', () => {
    const g = game(ROCK)
    const events = play(g, { 1: HELD_DOWN })
    assert.deepEqual(rings(events), [1, 2, 3, 4, 5, 6, 7, 8])
    assert.equal(events.find((e) => e.type === 'ring' && e.r === 8)?.at, 1 + 7 * RING) // 36 ticks
    assert.deepEqual(stops(events), ['probe'])
    assert.equal(g.run, null, 'still held, but the run ended with the probe')
    assert.ok(seen(g).has(9 * g.world.w + 18), 'the loot 8 away is seen now')
  })

  test('a swipe that turns into a hold (the input says hold 0.2 s on) grows past min too', () => {
    const g = game(ROCK)
    const events = play(g, { 1: [{ type: 'intent', dx: 0, dy: 1 }], 13: [{ type: 'hold' }] })
    assert.deepEqual(rings(events), [1, 2, 3, 4, 5, 6, 7, 8])
  })

  test('released mid-growth, it ends at the ring it is on', () => {
    const g = game(ROCK)
    // ring 7 comes on tick 31; let go on tick 33
    const events = play(g, { 1: HELD_DOWN, 33: [{ type: 'release' }] })
    assert.deepEqual(rings(events), [1, 2, 3, 4, 5, 6, 7])
    assert.equal(events.find((e) => e.type === 'stop')?.at, 1 + 7 * RING, 'ring 7 lasts its ringTicks')
    assert.deepEqual(seen(g), disc(g, 7))
  })

  test('released before min, it still reaches light + 2', () => {
    const g = game(ROCK)
    const events = play(g, { 1: HELD_DOWN, 8: [{ type: 'release' }] })
    assert.deepEqual(rings(events), [1, 2, 3, 4, 5, 6])
    assert.deepEqual(stops(events), ['probe'])
  })
})

describe('nothing cuts a probe short (D053)', () => {
  test('a tap during it: the probe reaches its rings anyway', () => {
    const g = game(ROCK)
    const events = play(g, { 1: FLICK_DOWN, 8: [{ type: 'stop' }] })
    assert.deepEqual(rings(events), [1, 2, 3, 4, 5, 6])
    assert.deepEqual(seen(g), disc(g, 6))
  })

  test('a new swipe during it waits: the probe ends, then the swipe runs', () => {
    const rows = [...ROCK]
    rows[9] = '#.........@.........#' // a tunnel to walk: → runs to the wall
    const g = game(rows)
    const events = play(g, { 1: FLICK_DOWN, 8: [{ type: 'intent', dx: 1, dy: 0 }, { type: 'release' }] })
    assert.deepEqual(rings(events), [1, 2, 3, 4, 5, 6])
    const firstStep = events.find((e) => e.type === 'step')?.at ?? 0
    assert.ok(firstStep > 1 + 6 * RING - 1, `the walk starts after the probe (tick ${firstStep})`)
    assert.deepEqual(stops(events), ['wall'], 'the probe hands over quietly: no probe stop for the new swipe')
    assert.deepEqual([g.ch.x, g.ch.y], [19, 9])
  })

  test('a new swipe during a held probe ends it at min or at the ring it is on', () => {
    const g = game(ROCK)
    const events = play(g, { 1: HELD_DOWN, 8: [{ type: 'intent', dx: 1, dy: 0, held: true }] })
    assert.deepEqual(rings(events).slice(0, 6), [1, 2, 3, 4, 5, 6])
    assert.equal(Math.max(...rings(events)), 6)
  })

  test('a teleport ends it at once', () => {
    const g = game(ROCK)
    const events = play(g, { 1: FLICK_DOWN, 8: [{ type: 'teleport' }] })
    assert.deepEqual(rings(events), [1, 2])
    assert.equal(g.probe, null)
  })
})

describe('where ↓ is not a probe', () => {
  test('on a plank, ↓ does the plank rows: it drops through to the floor below', () => {
    const g = game(['#######', '###@###', '###-###', '###.###', '###.###', '#######'])
    const events = play(g, { 1: FLICK_DOWN })
    assert.deepEqual(rings(events), [])
    assert.deepEqual(stops(events), ['floor'])
    assert.deepEqual([g.ch.x, g.ch.y], [3, 4])
  })

  test('at a ledge edge, ↓ climbs down over it: the ledge wins', () => {
    const g = game(['#######', '#@....#', '###.###', '###.###', '###.###', '#######'])
    play(g, { 1: [{ type: 'intent', dx: 1, dy: 0 }, { type: 'release' }] }) // a flick stops at the ledge ("?")
    assert.deepEqual([g.ch.x, g.ch.y], [2, 1])
    const events = play(g, { 1: FLICK_DOWN })
    assert.deepEqual(rings(events), [])
    assert.deepEqual(stops(events), ['floor'])
    assert.deepEqual([g.ch.x, g.ch.y], [3, 4])
  })

  test('with rules/b1.7.json, ↓ on a floor still refuses (down)', () => {
    const B17 = read('b1.7.json')
    const table = /** @type {import('./ruleset.js').Table} */ (compile(B17).table)
    const g = game(ROCK, { table, cfg: { ...simConfig(B17), light: CFG.light } })
    const events = play(g, { 1: FLICK_DOWN })
    assert.deepEqual(rings(events), [])
    assert.deepEqual(stops(events), ['down'])
    assert.equal(g.probe, null)
  })
})

test('deterministic: the same commands give the same seen map, rings and state', () => {
  const run = () => {
    const rows = [...ROCK]
    rows[9] = '#.........@.........#'
    const g = game(rows, { pack: ['loot 8'] })
    const events = play(g, {
      1: HELD_DOWN,
      20: [{ type: 'release' }],
      50: [{ type: 'intent', dx: 1, dy: 0 }, { type: 'release' }],
      60: FLICK_DOWN,
    })
    return { seen: [.../** @type {Uint8Array} */ (g.seen)], events: JSON.stringify(events), ch: g.ch, tick: g.tick }
  }
  assert.deepEqual(run(), run())
})

describe('b3.1: the probe is centred on the probed block (D055)', () => {
  /** @param {number} dy the swipe: 1 = ↓, -1 = ↑ */
  function probe(dy) {
    const g = game(ROCK, { table: TABLE31, cfg: CFG31, light: { base: 1 } })
    const before = seen(g)
    const at = { x: g.ch.x, y: g.ch.y }
    const tile = g.world.tiles[(at.y + dy) * g.world.w + at.x]
    const events = play(g, { 1: [{ type: 'intent', dx: 0, dy }, { type: 'release' }] })
    const want = disc(g, 3, at.x, at.y + dy) // light 1 + flick 2
    return { g, before, at, tile, events, want }
  }

  test('↓ on a floor: the rings spread from the block under you, same reach', () => {
    const { g, before, at, events, want } = probe(1)
    assert.deepEqual(rings(events), [1, 2, 3])
    assert.deepEqual(stops(events), ['probe'])
    assert.deepEqual(new Set([...seen(g)].filter((i) => !before.has(i))), new Set([...want].filter((i) => !before.has(i))))
    assert.ok(seen(g).has((at.y + 4) * g.world.w + at.x)) // 4 below you: 3 from the probed block
    assert.ok(!seen(g).has((at.y - 3) * g.world.w + at.x)) // 3 above you: 4 from it
    assert.deepEqual([g.ch.x, g.ch.y], [at.x, at.y])
  })

  test('↑ into rock probes the ceiling: centred on the block above, which stays rock', () => {
    const { g, before, at, tile, events, want } = probe(-1)
    assert.deepEqual(rings(events), [1, 2, 3])
    assert.deepEqual(stops(events), ['probe'])
    assert.deepEqual(new Set([...seen(g)].filter((i) => !before.has(i))), new Set([...want].filter((i) => !before.has(i))))
    assert.ok(seen(g).has((at.y - 4) * g.world.w + at.x))
    assert.equal(g.world.tiles[(at.y - 1) * g.world.w + at.x], tile) // not mined (D043's mine-above is gone)
    assert.equal(events.filter((e) => e.type === 'mined').length, 0)
    assert.deepEqual([g.ch.x, g.ch.y], [at.x, at.y])
  })

  test('b2.1 is unchanged: ↓ probes around you, ↑ mines the rock above', () => {
    const g = game(ROCK, { light: { base: 1 } })
    const at = { x: g.ch.x, y: g.ch.y }
    play(g, { 1: FLICK_DOWN })
    assert.ok(seen(g).has((at.y - 3) * g.world.w + at.x))
    assert.ok(!seen(g).has((at.y + 4) * g.world.w + at.x))
    const events = play(g, { 1: [{ type: 'intent', dx: 0, dy: -1 }, { type: 'release' }] })
    assert.equal(events.filter((e) => e.type === 'mined').length, 1)
  })
})
