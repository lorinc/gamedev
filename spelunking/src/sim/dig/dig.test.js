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

  test('swiping into a gap within harmlessDrop drops to its floor, then walks on', () => {
    const g = game([
      '########', //
      '#@..####',
      '###.####',
      '###....#',
      '########',
    ])
    assert.equal(swipe(g, 1, 0), 'ledge') // walking never steps off unasked
    assert.equal(swipe(g, 1, 0), 'wall') // a fresh swipe drops 2, lands, walks to the wall
    assert.deepEqual(pos(g), [6, 3])
  })

  test('a gap deeper than harmlessDrop stays a ledge', () => {
    const rows = ['#####', '#@.##']
    for (let i = 0; i < 6; i++) rows.push('##.##')
    rows.push('#####')
    const g = game(rows)
    assert.equal(swipe(g, 1, 0), 'ledge')
    assert.equal(swipe(g, 1, 0), 'ledge')
    assert.deepEqual(pos(g), [1, 1])
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

  test('down on open floor never digs', () => {
    const g = game(['#####', '#.@.#', '#####', '#####'])
    assert.equal(swipe(g, 0, 1), 'down')
    assert.equal(g.world.tiles[2 * 5 + 2], Tile.Soft)
  })

  test('tunnelling into a chasm mines the wall but stays on solid ground', () => {
    const rows = ['#######', '#@##..#']
    for (let i = 0; i < 8; i++) rows.push('###...#')
    rows.push('#######')
    const g = game(rows)
    assert.equal(swipe(g, 1, 0), 'ledge') // mined (2,1) and (3,1); (3,1) has nothing under it
    assert.deepEqual(pos(g), [2, 1])
    assert.equal(g.world.tiles[1 * 7 + 3], Tile.Open)
  })

  test('a diagonal down into a chasm mines but does not step off', () => {
    const rows = ['######', '#@####', '######']
    for (let i = 0; i < 8; i++) rows.push('##...#')
    rows.push('######')
    const g = game(rows)
    // mines (2,1) and (2,2); (2,2) has a chasm under it, so it stays. Carrying on would build
    // a stair into the chasm (air is built), which needs ore.
    assert.equal(swipe(g, 1, 1), 'noOre')
    assert.deepEqual(pos(g), [1, 1])
    assert.equal(g.world.tiles[2 * 6 + 2], Tile.Open)
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
    assert.equal(swipe(g, 1, 1), 'loot') // a stair step through the crust, then ore ahead
    assert.equal(swipe(g, 1, 1), 'packFull') // took one ore; the next step holds 2 ore, 1 slot free
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
      for (const [dx, dy] of [[1, 0], [1, 0], [0, 1], [1, 0], [1, 1], [-1, 0]]) swipe(g, dx, dy)
      return [g.world.tiles, g.tick, pos(g)]
    }
    assert.deepEqual(play(), play())
  })
})

describe('junction stop (decided 2026-09-25: only a real side passage)', () => {
  const JCFG = { ...CFG, rules: { ...CFG.rules, junction: true } }

  test('walking out of a tunnel into an open cave takes the 1-tile step down and walks on', () => {
    const g = game(
      [
        '#####....#', //
        '#####....#',
        '#####....#',
        '#@.......#',
        '#####....#',
        '##########',
      ],
      JCFG,
    )
    assert.equal(swipe(g, 1, 0), 'wall')
    assert.deepEqual(pos(g), [8, 4])
  })

  test('walking under a narrow shaft still stops there', () => {
    const g = game(
      [
        '####.#####', //
        '####.#####',
        '#@.......#',
        '##########',
      ],
      JCFG,
    )
    assert.equal(swipe(g, 1, 0), 'junction')
    assert.deepEqual(pos(g), [3, 2])
  })

  test('mining out into a cave still stops at the break-out', () => {
    const g = game(
      [
        '#####....#', //
        '#####....#',
        '#@###....#',
        '#####....#',
        '##########',
      ],
      JCFG,
    )
    assert.equal(swipe(g, 1, 0), 'open')
    assert.deepEqual(pos(g), [4, 2])
  })
})
