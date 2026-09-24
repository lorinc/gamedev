// Terrain from a CA Lab recipe: the recipe shapes the caves, the same recipe with another seed
// splits the rock into soft and hard, then ore and loot are placed in the rock.

import recipe from '../../../archive/2026-09-24_starter-caves_seed6712.json'
import { chance, mulberry32 } from '../rng'
import { runLayer, type LayerParams } from './ca'
import { migrate, runPipeline, type Pipeline } from './pipeline'
import { Tile, type World } from './world'

export interface TerrainParams {
  recipe: Pipeline // shape recipe from the CA Lab; its own seed is ignored
  caveSeed: number
  caveIsLive: boolean // which side of the recipe's binary grid is open cave
  hardSeed: number // same recipe, live = hard rock
  ore: LayerParams // live = ore, at the final size
  oreSeed: number
  loot: number // permille chance per rock tile
  lootSeed: number
}

export function generateTerrain(p: TerrainParams): World {
  const cave = runPipeline({ ...p.recipe, seed: p.caveSeed }).at(-1)!
  const hard = runPipeline({ ...p.recipe, seed: p.hardSeed }).at(-1)!
  const { w, h } = cave
  const ore = runLayer(p.ore, w, h, mulberry32(p.oreSeed))
  const lootRng = mulberry32(p.lootSeed)
  const openValue = p.caveIsLive ? 1 : 0

  const tiles = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    let t: Tile
    if (cave.cells[i] === openValue) t = Tile.Open
    else if (ore.cells[i]) t = Tile.Ore
    else if (chance(lootRng, p.loot)) t = Tile.Loot
    else if (hard.cells[i]) t = Tile.Hard
    else t = Tile.Soft
    tiles[i] = t
  }
  return { w, h, tiles }
}

export const DEFAULT_TERRAIN: TerrainParams = {
  recipe: migrate(recipe as Pipeline),
  caveSeed: recipe.seed,
  caveIsLive: true,
  hardSeed: recipe.seed + 1,
  ore: {
    density: 300,
    stepsX: 0,
    stepsY: 0,
    first: 'd0123 b5678',
    mid: 'd0123 b45678',
    last: 'd01234 b5678',
    edge: 'wrap',
  },
  oreSeed: recipe.seed + 2,
  loot: 50,
  lootSeed: recipe.seed + 3,
}
