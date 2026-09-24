import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { mulberry32 } from '../rng.js'
import { formatRule, nextgen, parseRule, scaleUp, seedGrid } from './ca.js'
import { findDrops } from './stats.js'
import { DEFAULT_PARAMS, generate, Tile } from './world.js'

describe('parseRule', () => {
  test('reads the notebook rule format', () => {
    assert.deepEqual(parseRule('d012 b5678'), { death: 0b111, birth: 0b111100000 })
  })
  test('formatRule round-trips, birth wins over death', () => {
    assert.equal(formatRule(parseRule('d01234 b567')), 'd01234 b567')
    assert.equal(formatRule(parseRule('d0125 b5')), 'd012 b5')
  })
  test('ignores s', () => {
    assert.deepEqual(parseRule('d0 s34 b8'), { death: 1, birth: 1 << 8 })
  })
})

describe('ca', () => {
  const shiftX = (g, k) => {
    const cells = new Uint8Array(g.w * g.h)
    for (let y = 0; y < g.h; y++)
      for (let x = 0; x < g.w; x++) cells[y * g.w + ((x + k) % g.w)] = g.cells[y * g.w + x]
    return { ...g, cells }
  }

  test('wraps horizontally: shifting the input shifts the output', () => {
    const g = seedGrid(16, 8, mulberry32(7), 450)
    const rule = parseRule('d0123 b45678')
    assert.deepEqual(nextgen(shiftX(g, 5), rule, 0).cells, shiftX(nextgen(g, rule, 0), 5).cells)
  })

  test('scaleUp doubles each cell', () => {
    const g = scaleUp({ w: 2, h: 1, cells: Uint8Array.of(1, 0) })
    assert.deepEqual([...g.cells], [1, 1, 0, 0, 1, 1, 0, 0])
  })
})

describe('generate', () => {
  test('same seed gives the same world', () => {
    assert.deepEqual(generate(DEFAULT_PARAMS).tiles, generate(DEFAULT_PARAMS).tiles)
  })

  test('different seeds give different worlds', () => {
    assert.notDeepEqual(generate({ ...DEFAULT_PARAMS, seed: 4 }).tiles, generate(DEFAULT_PARAMS).tiles)
  })

  test('sky on top, solid crust under it', () => {
    const w = generate(DEFAULT_PARAMS)
    const row = (y) => [...w.tiles.slice(y * w.w, (y + 1) * w.w)]
    assert.ok(row(0).every((t) => t === Tile.Sky))
    assert.ok(!row(DEFAULT_PARAMS.skyRows).some((t) => t === Tile.Open || t === Tile.Sky))
  })
})

describe('findDrops', () => {
  test('measures a drop off a ledge', () => {
    // # = rock, . = open. Standing at (1,0), stepping right into column 2 falls 3 tiles.
    const map = ['#..#', '##.#', '##.#', '##.#', '####']
    const tiles = Uint8Array.from(map.join(''), (c) => (c === '#' ? Tile.Soft : Tile.Open))
    const drops = findDrops({ w: 4, h: 5, tiles })
    assert.ok(drops.some((d) => d.x === 2 && d.y === 0 && d.height === 3))
  })
})
