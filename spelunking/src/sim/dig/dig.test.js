import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { Tile } from '../gen/world.js'
import { command, createGame, tick, withSurface } from './game.js'

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
  const g = createGame({ w, h: rows.length, tiles }, { x: at % w, y: Math.trunc(at / w) }, { ...cfg })
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
  const chars = Object.fromEntries(Object.entries(LEGEND).filter(([k]) => k !== '@').map(([k, v]) => [v, k]))
  const rows = []
  for (let y = 0; y < g.world.h; y++) {
    let row = ''
    for (let x = 0; x < g.world.w; x++) row += x === g.ch.x && y === g.ch.y ? '@' : chars[g.world.tiles[y * g.world.w + x]]
    rows.push(row)
  }
  return rows
}

describe('walking', () => {
  test('follows the floor over 1-tile steps and stops at a wall', () => {
    const g = game([
      '##########', //
      '#@.......#',
      '###..#...#',
      '#####.#.##',
      '##########',
    ])
    // down into the dip, up out of it, down, down again, up, then a 2-high wall
    assert.equal(swipe(g, 1, 0), 'wall')
    assert.deepEqual(pos(g), [8, 2])
  })

  test('stops at a drop of 2+', () => {
    const g = game([
      '#######', //
      '#@....#',
      '###.###',
      '###.###',
      '#######',
    ])
    assert.equal(swipe(g, 1, 0), 'ledge')
    assert.deepEqual(pos(g), [2, 1])
  })
})

describe('mining', () => {
  test('a swipe at a wall tunnels until something changes', () => {
    const g = game([
      '##########', //
      '#@##HH..##',
      '##########',
    ])
    assert.equal(swipe(g, 1, 0), 'harder') // soft, soft, then hard rock ahead
    assert.deepEqual(pos(g), [3, 1])
    assert.equal(swipe(g, 1, 0), 'open') // through the hard rock into the cave
    assert.deepEqual(pos(g), [5, 1])
  })

  test('stops before ore; mining it fills the pack; a full pack stops', () => {
    const g = game([
      '#########', //
      '#@#oo$###',
      '#########',
    ])
    assert.equal(swipe(g, 1, 0), 'loot')
    assert.equal(swipe(g, 1, 0), 'loot') // the next ore
    assert.equal(swipe(g, 1, 0), 'packFull') // 2 slots, loot ahead
    assert.deepEqual(g.pack, [Tile.Ore, Tile.Ore])
  })

  test('digging down into a cave stops at the breakthrough; down again climbs to its floor', () => {
    const g = game([
      '#####', //
      '#.@.#',
      '#####',
      '##.##',
      '#...#',
      '#####',
    ])
    assert.equal(swipe(g, 0, 1), 'open')
    assert.deepEqual(pos(g), [2, 2]) // clinging in the hole it dug
    assert.equal(swipe(g, 0, 1), 'floor')
    assert.deepEqual(pos(g), [2, 4])
  })

  test('never leaves the character hanging over a deep drop', () => {
    const rows = ['#####', '#.@.#', '#####']
    for (let i = 0; i < 8; i++) rows.push('.....')
    rows.push('#####')
    const g = game(rows)
    assert.equal(swipe(g, 0, 1), 'overhang') // through the ceiling, then nothing to climb and too far to drop
    assert.deepEqual(pos(g), [2, 2]) // braced in its own hole, rock on both sides
    assert.equal(g.world.tiles[1 * 5 + 1], Tile.Open)
    assert.equal(g.world.tiles[2 * 5 + 1], Tile.Soft)
  })
})

describe('ledges', () => {
  test('down at a ledge climbs down the wall to the floor', () => {
    const g = game([
      '#######', //
      '#@....#',
      '###.###',
      '###.###',
      '###.###',
      '###.###',
      '###.###',
      '###.###',
      '#######',
    ])
    assert.equal(swipe(g, 1, 0), 'ledge')
    assert.equal(swipe(g, 0, 1), 'floor')
    assert.deepEqual(pos(g), [3, 7])
  })
})

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

  test('building without ore stops', () => {
    const g = game(['#####', '#...#', '#@..#', '#####'])
    assert.equal(swipe(g, 1, -1), 'noOre')
  })
})

describe('dives', () => {
  test('teleport counts the pack into the stash and logs the dive', () => {
    const { world, home } = withSurface({ w: 8, h: 4, tiles: new Uint8Array(32).fill(Tile.Ore) }, 2, 1)
    const g = createGame(world, home, { ...CFG })
    assert.equal(swipe(g, 0, 1), 'loot') // crust, then ore below
    swipe(g, 0, 1)
    command(g, { type: 'teleport' })
    tick(g)
    assert.deepEqual(pos(g), [home.x, home.y])
    assert.deepEqual(g.stash, { ore: 1, loot: 0 })
    assert.equal(g.dives.length, 1)
    assert.equal(g.dives[0].mined, 2)
    assert.equal(g.dives[0].depth, 2)
  })

  test('deterministic: same commands, same world', () => {
    const play = () => {
      const g = game(['########', '#@#o$#H#', '#.#.##.#', '########'])
      for (const [dx, dy] of [[1, 0], [1, 0], [0, 1], [1, 0], [1, 1], [-1, 0]]) swipe(g, dx, dy)
      return [g.world.tiles, g.tick, pos(g)]
    }
    assert.deepEqual(play(), play())
  })
})
