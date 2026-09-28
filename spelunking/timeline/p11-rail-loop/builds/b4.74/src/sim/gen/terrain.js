// Terrain from a CA Lab recipe: the recipe shapes the caves, the same recipe with another seed
// splits the rock into soft and hard, then ore and loot are placed in the rock.

import { chance, mulberry32 } from '../rng.js'
import { runLayer } from './ca.js'
import { finalGrid } from './pipeline.js'
import { STARTER_CAVES } from './starterCaves.js'
import { Tile } from './world.js'

/** @typedef {import('./ca.js').LayerParams} LayerParams */
/** @typedef {import('./pipeline.js').Pipeline} Pipeline */
/** @typedef {import('./world.js').World} World */

/**
 * @typedef {object} TerrainParams
 * @property {Pipeline} recipe shape recipe from the CA Lab; its own seed is ignored
 * @property {number} caveSeed
 * @property {boolean} caveIsLive which side of the recipe's binary grid is open cave
 * @property {number} hardSeed same recipe, live = hard rock
 * @property {LayerParams} ore live = ore, at the final size
 * @property {number} oreSeed
 * @property {number} loot permille chance per rock tile
 * @property {number} lootSeed
 */

/** @param {TerrainParams} p @returns {World} */
export function generateTerrain(p) {
  const cave = finalGrid({ ...p.recipe, seed: p.caveSeed })
  const hard = finalGrid({ ...p.recipe, seed: p.hardSeed })
  const { w, h } = cave
  const ore = runLayer(p.ore, w, h, mulberry32(p.oreSeed))
  const lootRng = mulberry32(p.lootSeed)
  const openValue = p.caveIsLive ? 1 : 0

  const tiles = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    /** @type {Tile} */
    let t
    if (cave.cells[i] === openValue) t = Tile.Open
    else if (ore.cells[i]) t = Tile.Ore
    else if (chance(lootRng, p.loot)) t = Tile.Loot
    else if (hard.cells[i]) t = Tile.Hard
    else t = Tile.Soft
    tiles[i] = t
  }
  return { w, h, tiles }
}

/** @type {TerrainParams} */
export const DEFAULT_TERRAIN = {
  recipe: STARTER_CAVES,
  caveSeed: STARTER_CAVES.seed,
  caveIsLive: true,
  hardSeed: STARTER_CAVES.seed + 1,
  ore: {
    density: 300,
    stepsX: 0,
    stepsY: 0,
    first: 'd0123 b5678',
    mid: 'd0123 b45678',
    last: 'd01234 b5678',
    edge: 'wrap',
  },
  oreSeed: STARTER_CAVES.seed + 2,
  loot: 50,
  lootSeed: STARTER_CAVES.seed + 3,
}
