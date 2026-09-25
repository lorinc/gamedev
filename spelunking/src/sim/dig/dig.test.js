import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { Tile } from '../gen/world.js'
import { command, createGame, tick, withSurface } from './game.js'
import { compile } from './ruleset.js'

const TABLE = compile(JSON.parse(readFileSync(new URL('../../../rules/b1.2.json', import.meta.url), 'utf8'))).table

/** @type {import('./rules.js').SimConfig} */
const CFG = {
  walkTicks: 2,
  climbTicks: 2,
  fallTicks: 1,
  buildTicks: 2,
  digTicks: { soft: 3, hard: 9, ore: 4, loot: 3, built: 2 },
  harmlessDrop: 4,
  packSlots: 2,
  tilesPerOre: 12,
  rules: { wall: true, open: true, harder: true, loot: true, junction: false },
}

const LEGEND = { '.': Tile.Open, '#': Tile.Soft, H: Tile.Hard, o: Tile.Ore, $: Tile.Loot, '=': Tile.Built, '@': Tile.Open }

// '@' marks the character. Rows must be the same width; x wraps, so give maps side walls.
function game(rows, cfg = CFG) {
  const w = rows[0].length
  const tiles = Uint8Array.from(rows.join(''), (c) => LEGEND[c])
  const at = rows.join('').indexOf('@')
  const g = createGame({ w, h: rows.length, tiles }, { x: at % w, y: Math.trunc(at / w) }, { ...cfg }, TABLE)
  g.stops = []
  return g
}

// Swipe, then tick until the run ends. Returns the stop reason.
function swipe(g, dx, dy) {
  command(g, { type: 'intent', dx, dy })
  for (let i = 0; i < 1000; i++) {
    tick(g)
    const stop = g.events.find((e) => e.type === 'stop')
    g.events.length = 0
    if (stop) return stop.reason
  }
  assert.fail('run never stopped')
}

const pos = (g) => [g.ch.x, g.ch.y]
const map = (g) => {
  const chars = Object.fromEntries(
    Object.entries(LEGEND)
      .filter(([k]) => k !== '@')
      .map(([k, v]) => [v, k]),
  )
  const rows = []
  for (let y = 0; y < g.world.h; y++) {
    let row = ''
    for (let x = 0; x < g.world.w; x++) row += x === g.ch.x && y === g.ch.y ? '@' : chars[g.world.tiles[y * g.world.w + x]]
    rows.push(row)
  }
  return rows
}

// The map tests (walking, mining, ledges, building, junctions) are examples now: rules/examples.json,
// run by examples.test.js. These check what an example can't: credit, tried cells, dives.

describe('building', () => {
  test('diagonal up into air builds a staircase, paid in ore', () => {
    const g = game([
      '#.....#', // the top of the world: bedrock above
      '#.#...#',
      '#@o...#',
      '#######',
    ])
    assert.equal(swipe(g, 1, 0), 'open') // a swipe into ore mines it at once, then the cave opens up
    assert.deepEqual(g.pack, [Tile.Ore])
    assert.equal(swipe(g, 1, -1), 'bedrock') // mined the headroom, built two steps, hit the top
    assert.deepEqual(map(g), [
      '#...@.#', //
      '#...=.#',
      '#..=..#',
      '#######',
    ])
    assert.deepEqual(g.pack, [])
    assert.equal(g.credit, CFG.tilesPerOre - 2)
  })

  test('a refused build or mine reports the cells it tried (for the red flash)', () => {
    const stopOf = (/** @type {any} */ g, /** @type {number} */ dx, /** @type {number} */ dy) => {
      command(g, { type: 'intent', dx, dy })
      for (let i = 0; i < 1000; i++) {
        tick(g)
        const stop = g.events.find((e) => e.type === 'stop')
        g.events.length = 0
        if (stop) return stop
      }
      assert.fail('run never stopped')
    }
    const build = stopOf(game(['#####', '#...#', '#@..#', '#####']), 1, -1)
    assert.deepEqual([build.reason, build.tried], ['noOre', [{ x: 2, y: 2 }]]) // the step it would build
    const g = game(['#########', '#@#oo$###', '#########'])
    stopOf(g, 1, 0)
    stopOf(g, 1, 0)
    assert.equal(stopOf(g, 1, 0).reason, 'loot') // the run stops before the loot anyway: quietly (D030)
    const full = stopOf(g, 1, 0)
    assert.deepEqual([full.reason, full.tried], ['packFull', [{ x: 5, y: 1 }]]) // the loot it couldn't take
    assert.deepEqual(stopOf(game(['#####', '#.@.#', '#####', '#####']), 0, 1).tried, []) // other stops: none
  })
})

describe('dives', () => {
  test('teleport counts the pack into the stash and logs the dive', () => {
    const { world, home } = withSurface({ w: 8, h: 4, tiles: new Uint8Array(32).fill(Tile.Ore) }, 2, 1)
    const g = createGame(world, home, { ...CFG }, TABLE)
    assert.equal(swipe(g, 1, 1), 'loot') // a stair step through the crust, then ore ahead
    assert.equal(swipe(g, 1, 1), 'loot') // took one ore; the next step holds 2 ore: the loot stop, quietly (D030)
    assert.equal(swipe(g, 1, 1), 'packFull') // asked again: 2 ore, 1 slot free
    command(g, { type: 'teleport' })
    tick(g)
    assert.deepEqual(pos(g), [home.x, home.y])
    assert.deepEqual(g.stash, { ore: 1, loot: 0 })
    assert.equal(g.dives.length, 1)
    assert.equal(g.dives[0].mined, 3)
    assert.equal(g.dives[0].depth, 2)
  })

  test('deterministic: same commands, same world', () => {
    const play = () => {
      const g = game(['########', '#@#o$#H#', '#.#.##.#', '########'])
      for (const [dx, dy] of [
        [1, 0],
        [1, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [-1, 0],
      ])
        swipe(g, dx, dy)
      return [g.world.tiles, g.tick, pos(g)]
    }
    assert.deepEqual(play(), play())
  })
})
