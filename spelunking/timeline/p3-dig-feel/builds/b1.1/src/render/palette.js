// Coloured squares only (self-imposed limit): near-black world, what matters glows.

import { Tile } from '../sim/gen/world.js'

/** @typedef {readonly [number, number, number]} Rgb */

/** @type {Record<Tile, Rgb>} */
export const TILE_RGB = {
  [Tile.Sky]: [26, 31, 58],
  [Tile.Open]: [8, 8, 12],
  [Tile.Soft]: [92, 70, 54],
  [Tile.Hard]: [52, 54, 66],
  [Tile.Ore]: [236, 164, 40],
  [Tile.Loot]: [64, 232, 214],
  [Tile.Built]: [150, 120, 70],
}

/** @type {{ loud: Rgb, panic: Rgb }} */
export const DROP_RGB = {
  loud: [250, 230, 60], // 3–4 tiles
  panic: [240, 50, 60], // 5+
}

/** @type {[Rgb, Rgb]} */
export const MASK_RGB = [
  [20, 20, 28],
  [230, 220, 90],
]
