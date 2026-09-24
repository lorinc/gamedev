// Composes several CA layers into one material grid.

import { chance, hashSeed, mulberry32 } from '../rng'
import { runLayer, type Grid, type LayerParams } from './ca'

export const Tile = {
  Sky: 0,
  Open: 1,
  Soft: 2,
  Hard: 3,
  Ore: 4,
  Loot: 5,
} as const
export type Tile = (typeof Tile)[keyof typeof Tile]

export const TILE_NAMES = ['sky', 'open', 'soft', 'hard', 'ore', 'loot'] as const

export function isOpen(t: number): boolean {
  return t === Tile.Sky || t === Tile.Open
}

export interface GenParams {
  seed: number
  width: number // must be divisible by 2^stepsX of every layer (height: 2^stepsY)
  height: number
  skyRows: number // open surface rows at the top
  crustRows: number // solid rows under the surface, no cavities
  galleries: LayerParams // live = open; meant to be stretched sideways
  shafts: LayerParams // live = open; meant to be stretched vertically
  hard: LayerParams // live = hard rock
  ore: LayerParams // live = ore
  loot: number // permille chance per rock tile
}

export interface World {
  w: number
  h: number
  tiles: Uint8Array
}

export type LayerName = 'galleries' | 'shafts' | 'hard' | 'ore'
export const LAYER_NAMES: readonly LayerName[] = ['galleries', 'shafts', 'hard', 'ore']

export function generate(p: GenParams, onStep?: (layer: LayerName, label: string, g: Grid) => void): World {
  const { width: w, height: h } = p
  const layer = (name: LayerName, salt: number) =>
    runLayer(p[name], w, h, mulberry32(hashSeed(p.seed, salt)), onStep && ((label, g) => onStep(name, label, g)))
  const galleries = layer('galleries', 1)
  const shafts = layer('shafts', 5)
  const hard = layer('hard', 2)
  const ore = layer('ore', 3)
  const lootRng = mulberry32(hashSeed(p.seed, 4))

  const tiles = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      let t: Tile
      if (y < p.skyRows) t = Tile.Sky
      else if (y >= p.skyRows + p.crustRows && (galleries.cells[i] || shafts.cells[i])) t = Tile.Open
      else if (ore.cells[i]) t = Tile.Ore
      else if (chance(lootRng, p.loot)) t = Tile.Loot
      else if (hard.cells[i]) t = Tile.Hard
      else t = Tile.Soft
      tiles[i] = t
    }
  }
  return { w, h, tiles }
}

export const DEFAULT_PARAMS: GenParams = {
  seed: 3,
  width: 64,
  height: 256,
  skyRows: 4,
  crustRows: 3,
  galleries: {
    density: 330,
    stepsX: 4,
    stepsY: 2,
    first: 'd012 b5678',
    mid: 'd0123 b45678',
    last: 'd01234 b567',
    edge: 0,
  },
  shafts: {
    density: 290,
    stepsX: 1,
    stepsY: 3,
    first: 'd012 b5678',
    mid: 'd0123 b45678',
    last: 'd01234 b567',
    edge: 0,
  },
  hard: {
    density: 480,
    stepsX: 4,
    stepsY: 2,
    first: 'd012 b5678',
    mid: 'd0123 b45678',
    last: 'd01234 b567',
    edge: 1,
  },
  ore: {
    density: 280,
    stepsX: 2,
    stepsY: 1,
    first: 'd0123 b5678',
    mid: 'd0123 b45678',
    last: 'd01234 b5678',
    edge: 0,
  },
  loot: 7,
}
