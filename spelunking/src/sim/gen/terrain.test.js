import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { finalGrid } from './pipeline.js'
import { STARTER_CAVES } from './starterCaves.js'
import { DEFAULT_TERRAIN, generateTerrain } from './terrain.js'
import { Tile } from './world.js'

test('the recipe module matches the archived JSON', () => {
  const url = new URL('../../../archive/2026-09-25_starter-caves_seed7727.json', import.meta.url)
  assert.deepEqual(STARTER_CAVES, JSON.parse(readFileSync(url, 'utf8')))
})

test('caves are exactly the recipe grid', () => {
  const world = generateTerrain(DEFAULT_TERRAIN)
  const cave = finalGrid({ ...DEFAULT_TERRAIN.recipe, seed: DEFAULT_TERRAIN.caveSeed })
  assert.deepEqual([world.w, world.h], [cave.w, cave.h])
  for (let i = 0; i < cave.cells.length; i++) assert.equal(world.tiles[i] === Tile.Open, cave.cells[i] === 1)
})

test('flipping caveIsLive swaps open and rock', () => {
  const a = generateTerrain(DEFAULT_TERRAIN)
  const b = generateTerrain({ ...DEFAULT_TERRAIN, caveIsLive: false })
  for (let i = 0; i < a.tiles.length; i++) assert.equal(a.tiles[i] === Tile.Open, b.tiles[i] !== Tile.Open)
})

test('all four materials appear in the rock', () => {
  const world = generateTerrain(DEFAULT_TERRAIN)
  for (const t of [Tile.Soft, Tile.Hard, Tile.Ore, Tile.Loot]) assert.ok(world.tiles.includes(t))
})

test('deterministic', () => {
  assert.deepEqual(generateTerrain(DEFAULT_TERRAIN).tiles, generateTerrain(DEFAULT_TERRAIN).tiles)
})
