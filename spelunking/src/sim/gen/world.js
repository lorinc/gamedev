// Composes several CA layers into one material grid.

import { chance, hashSeed, mulberry32 } from '../rng.js'
import { runLayer } from './ca.js'

/** @typedef {import('./ca.js').Grid} Grid */
/** @typedef {import('./ca.js').LayerParams} LayerParams */

export const Tile = /** @type {const} */ ({
  Sky: 0,
  Open: 1,
  Soft: 2,
  Hard: 3,
  Ore: 4,
  Loot: 5,
  Built: 6, // placed by the player, never generated
})
/** @typedef {(typeof Tile)[keyof typeof Tile]} Tile */

export const TILE_NAMES = /** @type {const} */ (['sky', 'open', 'soft', 'hard', 'ore', 'loot', 'built'])

/** @param {number} t @returns {boolean} */
export function isOpen(t) {
  return t === Tile.Sky || t === Tile.Open
}

/**
 * @typedef {object} GenParams
 * @property {number} seed
 * @property {number} width must be divisible by 2^stepsX of every layer (height: 2^stepsY)
 * @property {number} height
 * @property {number} skyRows open surface rows at the top
 * @property {number} crustRows solid rows under the surface, no cavities
 * @property {LayerParams} galleries live = open; meant to be stretched sideways
 * @property {LayerParams} shafts live = open; meant to be stretched vertically
 * @property {LayerParams} hard live = hard rock
 * @property {LayerParams} ore live = ore
 * @property {number} loot permille chance per rock tile
 */

/**
 * @typedef {object} World
 * @property {number} w
 * @property {number} h
 * @property {Uint8Array} tiles
 */

/** @typedef {'galleries' | 'shafts' | 'hard' | 'ore'} LayerName */
/** @type {readonly LayerName[]} */
export const LAYER_NAMES = ['galleries', 'shafts', 'hard', 'ore']

/**
 * @param {GenParams} p
 * @param {(layer: LayerName, label: string, g: Grid) => void} [onStep]
 * @returns {World}
 */
export function generate(p, onStep) {
  const { width: w, height: h } = p
  /** @param {LayerName} name @param {number} salt */
  const layer = (name, salt) =>
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
      /** @type {Tile} */
      let t
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

/** @type {GenParams} */
export const DEFAULT_PARAMS = {
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
