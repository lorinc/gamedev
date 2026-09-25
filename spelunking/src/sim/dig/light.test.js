// Light and seen (D051, D052) on small ASCII maps (R8). A picture of what's lit shows the map's
// characters where a cell is lit and a space where it isn't.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { Tile } from '../gen/world.js'
import { mapRows, parseMap, runExample } from './examples.js'
import { command, createGame, reveal, tick, withSurface } from './game.js'
import { litCells, lightRadius } from './light.js'
import { parsePack } from './pack.js'
import { compile, migrate, simConfig } from './ruleset.js'

const read = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../rules/${f}`, import.meta.url), 'utf8'))
const B21 = migrate(read('b2.1.json'))
const TABLE = /** @type {import('./ruleset.js').Table} */ (compile(B21).table)
const CFG = simConfig(B21)
const LIGHT = { base: 4, orePer: 16, lootPer: 8 }

/** @param {string[]} rows @param {Partial<typeof LIGHT>} [light] @param {string[]} [pack] */
function game(rows, light = {}, pack = []) {
  const { world, at } = parseMap(rows)
  const g = createGame(world, at, { ...CFG, light: { ...LIGHT, ...light } }, TABLE)
  g.pack = parsePack(pack)
  tick(g) // the pack was set after createGame: the light catches up on the next tick
  return g
}

/** The map with only the given cells showing. @param {import('./game.js').Game} g @param {Iterable<number>} cells */
function picture(g, cells) {
  const show = new Set(cells)
  const { w } = g.world
  return mapRows(g.world, g.ch).map((row, y) => [...row].map((c, x) => (show.has(y * w + x) ? c : ' ')).join(''))
}
const lit = (/** @type {import('./game.js').Game} */ g) => picture(g, g.lit)
const seenCells = (/** @type {import('./game.js').Game} */ g) => [.../** @type {Uint8Array} */ (g.seen).keys()].filter((i) => g.seen?.[i])

// Swipe (a flick), then tick until the run ends and nothing moves. Returns the events.
/** @param {import('./game.js').Game} g @param {number} dx @param {number} dy */
function swipe(g, dx, dy) {
  command(g, { type: 'intent', dx, dy })
  command(g, { type: 'release' })
  /** @type {import('./game.js').GameEvent[]} */
  const events = []
  for (let i = 0; i < 2000 && (i < 2 || g.run || g.step); i++) {
    tick(g)
    events.push(...g.events)
    g.events.length = 0
  }
  return events
}

describe('the radius (D051)', () => {
  const r = (/** @type {string[]} */ pack) => lightRadius(parsePack(pack), LIGHT)
  test('base + floor(ore / 16 + loot / 8), from the pack', () => {
    assert.equal(r([]), 4)
    assert.equal(r(['soft 16', 'hard 9']), 4) // rock gives no light
    assert.equal(r(['ore 16']), 5)
    assert.equal(r(['loot 8']), 5)
    assert.equal(r(['ore 8', 'loot 4']), 5) // the sum: half and half make one
    assert.equal(r(['ore 15']), 4)
    assert.equal(r(['ore 16', 'ore 16', 'loot 16']), 8)
  })

  test('a per of 0 (a dev panel slider at its end) counts nothing, never divides by 0', () => {
    assert.equal(lightRadius(parsePack(['ore 16', 'loot 8']), { base: 4, orePer: 0, lootPer: 8 }), 5)
    assert.equal(lightRadius(parsePack(['ore 16', 'loot 8']), { base: 4, orePer: 0, lootPer: 0 }), 4)
  })

  test('the teleport home empties the pack, and the radius goes back to base', () => {
    const g = game(['#########', '#@......#', '#########'], {}, ['ore 16', 'loot 8'])
    assert.equal(g.radius, 6)
    command(g, { type: 'teleport' })
    tick(g)
    assert.equal(g.pack.length, 0)
    assert.equal(g.radius, 4)
  })

  test('mining ore brightens the light as soon as it is in the pack', () => {
    const g = game(['############', '#@o........#', '############'], {}, ['ore 15'])
    assert.equal(g.radius, 4)
    swipe(g, 1, 0)
    assert.equal(g.radius, 5)
  })
})

describe('what the light reaches (D051)', () => {
  test('it floods through air, lights the rock faces, and never passes through rock', () => {
    const g = game(['###########', '#..@.#...##', '###########'], { base: 8 }) // the radius isn't what stops it
    assert.deepEqual(lit(g), [
      '######     ', // the faces above the lit air, as far as the one over the wall
      '#..@.#     ', // the cave behind a 1-tile wall stays dark
      '######     ',
    ])
  })

  test('rock faces bordering lit air are lit (diagonals too), rock interiors are not', () => {
    const g = game(['#######', '#######', '##@..##', '#######', '#######'])
    assert.deepEqual(lit(g), ['       ', ' ##### ', ' #@..# ', ' ##### ', '       '])
  })

  test('only within the radius: dx² + dy² ≤ r², for air and faces alike', () => {
    const map = ['####################', '#@.................#', '####################']
    assert.deepEqual(lit(game(map)), [
      '#####               ', // (4, 1 away) is 17 > 16
      '#@....              ',
      '#####               ',
    ])
    assert.deepEqual(lit(game(map, {}, ['ore 16'])), ['######              ', '#@.....             ', '######              '])
  })

  test('x wraps: the light goes round the ring', () => {
    const g = game(['############', '.@.#######..', '############'])
    assert.deepEqual(lit(g), [
      '####      ##',
      '.@.#     #..', // x = 9 is 4 away the short way round
      '####      ##',
    ])
  })

  test("a plank's cell lets light through; the same cell as rock doesn't", () => {
    const at = (/** @type {import('./game.js').Game} */ g, /** @type {number} */ x) => g.lit.includes(g.world.w + x)
    const plank = game(['############', '#.@.-..#####', '############'])
    assert.ok(at(plank, 4) && at(plank, 5) && at(plank, 6))
    const rock = game(['############', '#.@.#..#####', '############'])
    assert.ok(at(rock, 4) && !at(rock, 5) && !at(rock, 6))
  })

  test('litCells is sorted and has no repeats, even when the radius is wider than the map', () => {
    const { world, at } = parseMap(['#####', '#@..#', '#####'])
    const cells = litCells(world, at, 9)
    assert.deepEqual(
      cells,
      [...new Set(cells)].sort((a, b) => a - b),
    )
    assert.equal(cells.length, 15) // every cell: all of it borders the 3 open ones
  })
})

describe('seen (D052)', () => {
  test('what was lit stays seen after you walk away, and seen only grows', () => {
    const g = game(['########################', '#@.....................#', '########################'])
    const start = seenCells(g)
    assert.ok(start.includes(g.world.w + 2))
    g.events.length = 0 // the start's seen events: `start` has them
    command(g, { type: 'intent', dx: 1, dy: 0 })
    command(g, { type: 'release' })
    /** @type {number[]} */
    const fromEvents = [...start]
    let before = new Uint8Array(/** @type {Uint8Array} */ (g.seen))
    for (let i = 0; i < 500; i++) {
      tick(g)
      for (const e of g.events) if (e.type === 'seen') fromEvents.push(...e.cells)
      g.events.length = 0
      const now = /** @type {Uint8Array} */ (g.seen)
      assert.ok(
        before.every((v, j) => v <= now[j]),
        `tick ${g.tick}: a seen cell was forgotten`,
      )
      before = new Uint8Array(now)
    }
    assert.equal(g.ch.x, 22) // walked to the far wall
    assert.ok(!g.lit.includes(g.world.w + 2) && g.seen?.[g.world.w + 2], 'the start is dark now, but seen')
    // the seen events name every seen cell exactly once: a renderer can keep a texture with them alone
    assert.deepEqual(
      [...fromEvents].sort((a, b) => a - b),
      seenCells(g),
    )
    assert.equal(new Set(fromEvents).size, fromEvents.length)
  })

  test('the surface is seen at the start and always lit: the sky and the ground under it', () => {
    const terrain = { w: 12, h: 12, tiles: new Uint8Array(12 * 12).fill(Tile.Soft) }
    const { world, home } = withSurface(terrain, 2, 1)
    const g = createGame(world, home, { ...CFG, light: LIGHT }, TABLE)
    const surface = Array.from({ length: 3 * 12 }, (_, i) => i) // rows 0-1 sky, row 2 its top faces
    assert.deepEqual(seenCells(g), surface)
    const fromEvents = g.events.flatMap((e) => (e.type === 'seen' ? e.cells : [])) // the start's, for a renderer that listens from tick 0
    assert.deepEqual(
      fromEvents.sort((a, b) => a - b),
      surface,
    )
    command(g, { type: 'intent', dx: 1, dy: 1, held: true }) // a held ↘ digs a staircase down, step by step
    for (let i = 0; i < 2000; i++) tick(g)
    assert.ok(g.ch.y > 2 + 4, `deeper than the light reaches from the surface (y ${g.ch.y})`)
    assert.ok(
      surface.every((i) => g.lit.includes(i)),
      'the surface is still lit',
    )
  })

  test('digging into a cave lights it as soon as the rock is mined', () => {
    const g = game(['############', '#@#...######', '############'])
    const cave = [3, 4, 5].map((x) => g.world.w + x)
    assert.ok(cave.every((i) => !g.seen?.[i]))
    command(g, { type: 'intent', dx: 1, dy: 0 })
    command(g, { type: 'release' })
    for (let i = 0; i < 200 && !g.events.some((e) => e.type === 'mined'); i++) {
      g.events.length = 0
      tick(g)
    }
    assert.equal(g.ch.x, 1, 'still standing where it dug from')
    assert.ok(
      cave.every((i) => g.lit.includes(i) && g.seen?.[i]),
      'the cave is lit through the new hole',
    )
    const seen = g.events.find((e) => e.type === 'seen')
    assert.ok(seen && seen.type === 'seen' && cave.every((i) => seen.cells.includes(i)))
  })

  test('reveal marks cells seen and names only the new ones, once', () => {
    const g = game(['############', '#@#...######', '############'])
    g.events.length = 0
    const cells = [1, 2, g.world.w + 1, g.world.w + 4] // the last is in the dark cave; the others are lit already
    assert.deepEqual(reveal(g, cells), [g.world.w + 4])
    assert.deepEqual(g.events, [{ type: 'seen', cells: [g.world.w + 4] }])
    g.events.length = 0
    assert.deepEqual(reveal(g, cells), [])
    assert.deepEqual(g.events, [])
  })

  test('compute on change: standing still keeps the same lit array', () => {
    const g = game(['############', '#@.........#', '############'])
    const before = g.lit
    for (let i = 0; i < 30; i++) tick(g)
    assert.equal(g.lit, before)
    g.pack = parsePack(['loot 8']) // the pack changed: a new radius, a new array
    tick(g)
    assert.notEqual(g.lit, before)
    assert.equal(g.radius, 5)
  })
})

describe('without light (every b1 ruleset)', () => {
  const B17 = read('b1.7.json')
  const table = /** @type {import('./ruleset.js').Table} */ (compile(B17).table)

  test('there is no seen map, nothing lit, no seen events', () => {
    const { world, at } = parseMap(['############', '#@#...######', '############'])
    const g = createGame(world, at, simConfig(B17), table)
    command(g, { type: 'intent', dx: 1, dy: 0 })
    command(g, { type: 'release' })
    let seenEvents = 0
    for (let i = 0; i < 300; i++) {
      tick(g)
      seenEvents += g.events.filter((e) => e.type === 'seen').length
      g.events.length = 0
    }
    assert.equal(g.ch.x, 5) // it did dig through and walk
    assert.equal(g.seen, null)
    assert.deepEqual(g.lit, [])
    assert.equal(g.radius, 0)
    assert.equal(seenEvents, 0)
  })

  test('light changes nothing else: every example plays the same with and without it', () => {
    const { examples } = read('examples.json')
    for (const ex of examples) {
      const without = runExample(ex, table, simConfig(B17))
      assert.deepEqual(runExample(ex, table, { ...simConfig(B17), light: LIGHT }), without, ex.id)
      // b2.1 is b1.7 + light + the probe (D053): only where b1.7 refused ↓ on a floor does it differ
      if (!without.swipes.some((s) => s.stop === 'down')) assert.deepEqual(runExample(ex, TABLE, CFG), without, ex.id)
    }
  })
})
