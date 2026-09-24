// Coloured squares only (self-imposed limit): near-black world, what matters glows.

import { Tile } from '../sim/gen/world'

export type Rgb = readonly [number, number, number]

export const TILE_RGB: Record<Tile, Rgb> = {
  [Tile.Sky]: [26, 31, 58],
  [Tile.Open]: [8, 8, 12],
  [Tile.Soft]: [92, 70, 54],
  [Tile.Hard]: [52, 54, 66],
  [Tile.Ore]: [236, 164, 40],
  [Tile.Loot]: [64, 232, 214],
}

export const DROP_RGB = {
  loud: [250, 230, 60] as Rgb, // 3–4 tiles
  panic: [240, 50, 60] as Rgb, // 5+
}

export const MASK_RGB: [Rgb, Rgb] = [
  [20, 20, 28],
  [230, 220, 90],
]
