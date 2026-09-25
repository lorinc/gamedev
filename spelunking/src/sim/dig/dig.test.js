import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { Tile } from '../gen/world.js'
import { command, createGame, tick, withSurface } from './game.js'
import { packText } from './pack.js'
import { compile, migrate, simConfig } from './ruleset.js'

const B17 = JSON.parse(readFileSync(new URL('../../../rules/b1.7.json', import.meta.url), 'utf8'))
const TABLE = compile(migrate(JSON.parse(readFileSync(new URL('../../../rules/b1.2.json', import.meta.url), 'utf8')))).table

/** @type {import('./rules.js').SimConfig} */
const CFG = {
  walkTicks: 2,
  climbTicks: 2,
  fallTicks: 1,
  buildTicks: 2,
  digTicks: { soft: 3, hard: 9, ore: 4, loot: 3, built: 2 },
  harmlessDrop: 4,
  packSlots: 2,
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

// Swipe (a flick: let go at once), then tick until the run ends. Returns the stop reason.
function swipe(g, dx, dy) {
  command(g, { type: 'intent', dx, dy })
  command(g, { type: 'release' })
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
// run by examples.test.js. These check what an example can't: tried cells, dropped rock, dives.

describe('building', () => {
  test('diagonal up into air builds a staircase, 1 rock per step (D038)', () => {
    const g = game([
      '#.....#', // the top of the world: bedrock above
      '#.#...#',
      '#@o...#',
      '#######',
    ])
    g.pack = [{ tile: Tile.Soft, n: 3 }]
    assert.equal(swipe(g, 1, 0), 'open') // a swipe into ore mines it at once, then the cave opens up
    assert.deepEqual(packText(g.pack), ['soft 3', 'ore 1'])
    assert.equal(swipe(g, 1, -1), 'bedrock') // mined the headroom (+1 soft), built two steps (-2), hit the top
    assert.deepEqual(map(g), [
      '#...@.#', //
      '#...=.#',
      '#..=..#',
      '#######',
    ])
    assert.deepEqual(packText(g.pack), ['soft 2', 'ore 1']) // ore never pays for building
  })

  test('a refused build or mine reports the cells it tried (for the red flash)', () => {
    const stopOf = (/** @type {any} */ g, /** @type {number} */ dx, /** @type {number} */ dy) => {
      command(g, { type: 'intent', dx, dy })
      command(g, { type: 'release' })
      for (let i = 0; i < 1000; i++) {
        tick(g)
        const stop = g.events.find((e) => e.type === 'stop')
        g.events.length = 0
        if (stop) return stop
      }
      assert.fail('run never stopped')
    }
    const build = stopOf(game(['#####', '#...#', '#@..#', '#####']), 1, -1)
    assert.deepEqual([build.reason, build.tried], ['noRock', [{ x: 2, y: 2 }]]) // the step it would build
    const g = game(['#########', '#@#oo$###', '#########'])
    stopOf(g, 1, 0) // soft → slot 1
    stopOf(g, 1, 0) // ore → slot 2
    assert.equal(stopOf(g, 1, 0).reason, 'loot') // ore stacks in slot 2; the run stops before the loot anyway: quietly (D030)
    assert.deepEqual(packText(g.pack), ['soft 1', 'ore 2'])
    const full = stopOf(g, 1, 0)
    assert.deepEqual([full.reason, full.tried], ['packFull', [{ x: 5, y: 1 }]]) // the loot it couldn't take
    assert.deepEqual(stopOf(game(['#####', '#.@.#', '#####', '#####']), 0, 1).tried, []) // other stops: none
  })
})

describe('the pack', () => {
  test('rock with no room is dropped; mining goes on (D038)', () => {
    const g = game(['#########', '#@#HH###.', '#########'], { ...CFG, packSlots: 1 })
    assert.equal(swipe(g, 1, 0), 'harder')
    assert.equal(swipe(g, 1, 0), 'open') // the hard rock had no slot: mined and dropped
    assert.deepEqual(packText(g.pack), ['soft 4'])
  })

  test('a slot holds 16 of one material; the next unit opens a new slot', () => {
    const g = game(['#'.repeat(22), '#@' + '#'.repeat(18) + 'H#', '#'.repeat(22)], { ...CFG, packSlots: 3 })
    g.pack = [
      { tile: Tile.Soft, n: 15 },
      { tile: Tile.Ore, n: 1 },
    ]
    assert.equal(swipe(g, 1, 0), 'harder') // 18 soft: 1 tops up slot 1, 16 fill slot 3, the last is dropped
    assert.deepEqual(packText(g.pack), ['soft 16', 'ore 1', 'soft 16'])
  })

  test('building spends soft before hard, from the last slot; mining a built tile gives soft back', () => {
    const g = game(['#.....#', '#.....#', '#@....#', '#######'], { ...CFG, packSlots: 3 })
    g.pack = [
      { tile: Tile.Hard, n: 5 },
      { tile: Tile.Soft, n: 1 },
      { tile: Tile.Ore, n: 1 },
    ]
    assert.equal(swipe(g, 1, -1), 'bedrock') // two steps: the first paid in soft, the second in hard
    assert.deepEqual(packText(g.pack), ['hard 4', '-', 'ore 1']) // the emptied slot is free, in place
    const mined = game(['#####', '#@=.#', '#####'], { ...CFG, packSlots: 3 })
    swipe(mined, 1, 0)
    assert.deepEqual(packText(mined.pack), ['soft 1'])
  })
})

describe('dives', () => {
  test('teleport counts the pack into the stash and logs the dive', () => {
    const { world, home } = withSurface({ w: 8, h: 4, tiles: new Uint8Array(32).fill(Tile.Ore) }, 2, 1)
    const g = createGame(world, home, { ...CFG }, TABLE)
    assert.equal(swipe(g, 1, 1), 'loot') // a stair step through the crust, then ore ahead
    assert.equal(swipe(g, 1, 1), 'loot') // took one ore; the next step holds 2 ore: the loot stop
    assert.deepEqual(packText(g.pack), ['soft 2', 'ore 1'])
    command(g, { type: 'teleport' })
    tick(g)
    assert.deepEqual(pos(g), [home.x, home.y])
    assert.deepEqual(g.pack, [])
    assert.deepEqual(g.stash, { soft: 2, hard: 0, ore: 1, loot: 0 })
    assert.deepEqual(g.dives[0].got, g.stash)
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

// Flick and hold (D046), on ruleset b1.7: the input says hold (still down 0.3 s after the swipe) or
// release; until then the run takes only the steps a flick and a hold agree on.
describe('flick and hold', () => {
  const RAMP_MOUTH = ['#......#', '#@.....#', '##.#####', '########'] // a 1-deep dip: a flick walks it, a hold bridges it
  const hold = (rows = RAMP_MOUTH) => {
    const g = createGame(game(rows).world, { x: 1, y: 1 }, simConfig(B17), compile(B17).table)
    g.pack = [{ tile: Tile.Soft, n: 2 }]
    return g
  }
  const ticks = (g, n) => {
    for (let i = 0; i < n; i++) tick(g)
  }
  const plank = (g, x, y) => g.world.tiles[y * g.world.w + x] === Tile.Plank

  test('where a flick and a hold differ, the run waits for the input; a hold then builds', () => {
    const g = hold()
    command(g, { type: 'intent', dx: 1, dy: 0 })
    ticks(g, 30)
    assert.equal(g.step, null) // flick: step down into the dip; hold: a plank over it
    assert.deepEqual(pos(g), [1, 1])
    command(g, { type: 'hold' })
    ticks(g, 1)
    assert.equal(g.step?.action.kind, 'build')
  })

  test('let go before the hold mark: a flick, which follows the dip and walks on', () => {
    const g = hold()
    command(g, { type: 'intent', dx: 1, dy: 0 })
    ticks(g, 10)
    command(g, { type: 'release' })
    ticks(g, 200)
    assert.deepEqual(pos(g), [6, 1])
    assert.equal(plank(g, 2, 2), false)
  })

  test('hold+swipe builds at once; a held run pauses after every step, and a release in the pause ends it', () => {
    const g = hold()
    const { buildTicks, walkTicks, holdPauseTicks } = g.cfg
    command(g, { type: 'intent', dx: 1, dy: 0, held: true })
    ticks(g, 1)
    assert.equal(g.step?.action.kind, 'build')
    ticks(g, buildTicks + walkTicks) // built and walked onto it: now the pause
    assert.deepEqual(pos(g), [2, 1])
    assert.equal(plank(g, 2, 2), true)
    ticks(g, holdPauseTicks - 1)
    assert.equal(g.step, null) // still pausing
    command(g, { type: 'release' })
    ticks(g, 100)
    assert.deepEqual(pos(g), [2, 1])
    assert.equal(g.run, null)
  })

  test('a release cancels a build in progress (nothing placed, no rock spent), but a move finishes', () => {
    const g = hold()
    command(g, { type: 'intent', dx: 1, dy: 0, held: true })
    ticks(g, 3) // building
    command(g, { type: 'release' })
    ticks(g, 100)
    assert.deepEqual(pos(g), [1, 1])
    assert.equal(plank(g, 2, 2), false)
    assert.deepEqual(packText(g.pack), ['soft 2'])

    const w = hold(['#......#', '#@.....#', '########', '########'])
    command(w, { type: 'intent', dx: 1, dy: 0, held: true })
    ticks(w, 2) // walking
    command(w, { type: 'release' })
    ticks(w, 100)
    assert.deepEqual(pos(w), [2, 1])
  })
})
