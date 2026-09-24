import { expect, test } from 'vitest'
import { runPipeline } from './pipeline'
import { DEFAULT_TERRAIN, generateTerrain } from './terrain'
import { Tile } from './world'

test('caves are exactly the recipe grid', () => {
  const world = generateTerrain(DEFAULT_TERRAIN)
  const cave = runPipeline({ ...DEFAULT_TERRAIN.recipe, seed: DEFAULT_TERRAIN.caveSeed }).at(-1)!
  expect(world).toMatchObject({ w: cave.w, h: cave.h })
  for (let i = 0; i < cave.cells.length; i++) expect(world.tiles[i] === Tile.Open).toBe(cave.cells[i] === 1)
})

test('flipping caveIsLive swaps open and rock', () => {
  const a = generateTerrain(DEFAULT_TERRAIN)
  const b = generateTerrain({ ...DEFAULT_TERRAIN, caveIsLive: false })
  for (let i = 0; i < a.tiles.length; i++) expect(a.tiles[i] === Tile.Open).toBe(b.tiles[i] !== Tile.Open)
})

test('all four materials appear in the rock', () => {
  const world = generateTerrain(DEFAULT_TERRAIN)
  for (const t of [Tile.Soft, Tile.Hard, Tile.Ore, Tile.Loot]) expect(world.tiles.includes(t)).toBe(true)
})

test('deterministic', () => {
  expect(generateTerrain(DEFAULT_TERRAIN).tiles).toEqual(generateTerrain(DEFAULT_TERRAIN).tiles)
})
