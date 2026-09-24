import { describe, expect, test } from 'vitest'
import { mulberry32 } from '../rng'
import { formatRule, nextgen, parseRule, scaleUp, seedGrid, type Grid } from './ca'
import { findDrops } from './stats'
import { DEFAULT_PARAMS, generate, Tile, type World } from './world'

describe('parseRule', () => {
  test('reads the notebook rule format', () => {
    expect(parseRule('d012 b5678')).toEqual({ death: 0b111, birth: 0b111100000 })
  })
  test('formatRule round-trips, birth wins over death', () => {
    expect(formatRule(parseRule('d01234 b567'))).toBe('d01234 b567')
    expect(formatRule(parseRule('d0125 b5'))).toBe('d012 b5')
  })
  test('ignores s', () => {
    expect(parseRule('d0 s34 b8')).toEqual({ death: 1, birth: 1 << 8 })
  })
})

describe('ca', () => {
  const shiftX = (g: Grid, k: number): Grid => {
    const cells = new Uint8Array(g.w * g.h)
    for (let y = 0; y < g.h; y++)
      for (let x = 0; x < g.w; x++) cells[y * g.w + ((x + k) % g.w)] = g.cells[y * g.w + x]
    return { ...g, cells }
  }

  test('wraps horizontally: shifting the input shifts the output', () => {
    const g = seedGrid(16, 8, mulberry32(7), 450)
    const rule = parseRule('d0123 b45678')
    expect(nextgen(shiftX(g, 5), rule, 0).cells).toEqual(shiftX(nextgen(g, rule, 0), 5).cells)
  })

  test('scaleUp doubles each cell', () => {
    const g = scaleUp({ w: 2, h: 1, cells: Uint8Array.of(1, 0) })
    expect([...g.cells]).toEqual([1, 1, 0, 0, 1, 1, 0, 0])
  })
})

describe('generate', () => {
  test('same seed gives the same world', () => {
    expect(generate(DEFAULT_PARAMS).tiles).toEqual(generate(DEFAULT_PARAMS).tiles)
  })

  test('different seeds give different worlds', () => {
    expect(generate({ ...DEFAULT_PARAMS, seed: 4 }).tiles).not.toEqual(generate(DEFAULT_PARAMS).tiles)
  })

  test('sky on top, solid crust under it', () => {
    const w = generate(DEFAULT_PARAMS)
    const row = (y: number) => [...w.tiles.slice(y * w.w, (y + 1) * w.w)]
    expect(row(0).every((t) => t === Tile.Sky)).toBe(true)
    expect(row(DEFAULT_PARAMS.skyRows).some((t) => t === Tile.Open || t === Tile.Sky)).toBe(false)
  })
})

describe('findDrops', () => {
  test('measures a drop off a ledge', () => {
    // # = rock, . = open. Standing at (1,0), stepping right into column 2 falls 3 tiles.
    const map = ['#..#', '##.#', '##.#', '##.#', '####']
    const tiles = Uint8Array.from(map.join(''), (c) => (c === '#' ? Tile.Soft : Tile.Open))
    const world: World = { w: 4, h: 5, tiles }
    expect(findDrops(world)).toContainEqual({ x: 2, y: 0, height: 3 })
  })
})
