// Paints the ice layer with its storeys into RGBA pixels (no DOM: the page puts them in an ImageData,
// the gallery script in a PNG). Crude on purpose, as in p7: flat colours, black outlines where cave
// meets rock. On top, a drawn sheet of ice stands for the 90 m over the pod (user): scenery only.

import { hash11 } from '../v5/wfc.js'
import { BRIDGE, FLOOR, MERGED, TUNNEL, podPart } from './storeys.js'
import { K, OPEN, ROCK, SEA, SKY } from './terrain.js'

/** @typedef {[number, number, number]} RGB */
/** @type {RGB[]} rock by band: surface, ice, pudding, brine */
const ROCKC = [
  [205, 212, 218],
  [174, 226, 255],
  [138, 90, 43],
  [95, 127, 128],
]
/** @type {RGB} */ const CAVE = [21, 21, 24]
/** @type {RGB} */ const WATER = [5, 11, 40]
/** @type {RGB} */ const SPACE = [8, 10, 26]
/** @type {RGB} */ const SHEET = [150, 184, 204]
/** @type {RGB} */ const SHEET2 = [138, 172, 194]
/** @type {RGB} */ const FLOORC = [70, 120, 70]
/** @type {RGB} */ const SHELL = [240, 138, 36]
/** @type {RGB} */ const INSIDE = [70, 46, 24]
/** @type {RGB[]} storey line by kind: floor, bridge, tunnel */
export const KIND_RGB = [
  [80, 235, 110],
  [245, 205, 60],
  [235, 70, 60],
]
/** @type {RGB} */ export const RAMP_RGB = [225, 90, 235]

export const SHEET_PX = 10 * K // the drawn ice sheet's rows above the map
/** @typedef {{floors: boolean, points: boolean, storeys: boolean}} View */

/**
 * @param {import('./terrain.js').Terrain} T @param {import('./storeys.js').Storeys} S @param {View} view
 * @param {number} seed
 */
export function paintStoreys(T, S, view, seed) {
  const { w, cls, band, crust } = T
  // the picture: the sheet, then the map from its top down to a little below the ice layer
  let bottom = 0
  for (let i = 0; i < cls.length; i++) if (band[i] === 1) bottom = Math.max(bottom, Math.floor(i / w))
  const rows = Math.min(T.h, bottom + 3 * K)
  const H = SHEET_PX + rows
  const px = new Uint8ClampedArray(w * H * 4)
  const set = (/** @type {number} */ x, /** @type {number} */ y, /** @type {RGB} */ c) => {
    if (y < 0 || y >= H) return
    const i = (y * w + (((x % w) + w) % w)) * 4
    px[i] = c[0]
    px[i + 1] = c[1]
    px[i + 2] = c[2]
    px[i + 3] = 255
  }
  const at = (/** @type {number} */ x, /** @type {number} */ y) => (y < 0 ? SKY : cls[Math.min(T.h - 1, y) * w + (((x % w) + w) % w)])

  // the sheet's rugged top: two octaves of smooth noise, periodic in the map's width
  const noise = (/** @type {number} */ x, /** @type {number} */ period, /** @type {number} */ salt) => {
    const n = Math.max(2, Math.round(w / period))
    const f = (x / w) * n
    const i = Math.floor(f)
    const t = f - i
    const s = t * t * (3 - 2 * t)
    const knot = (/** @type {number} */ j) => hash11(seed, salt, ((j % n) + n) % n)
    return knot(i) * (1 - s) + knot(i + 1) * s
  }
  for (let x = 0; x < w; x++) {
    const top = Math.round(SHEET_PX * 0.35 + noise(x, 12 * K, 91) * 3 * K + noise(x, 3 * K, 92) * K)
    const floorOfSheet = SHEET_PX + crust[x]
    for (let y = 0; y < floorOfSheet; y++) {
      if (y < top) {
        set(x, y, hash11(seed, 93, y * w + x) > 0.99 ? [200, 200, 220] : SPACE)
        continue
      }
      if (y === top) {
        set(x, y, [0, 0, 0])
        continue
      }
      // strata: wavy bands of two shades
      const s = Math.floor((y + noise(x, 8 * K, 94 + ((y / (2 * K)) | 0)) * K) / (2 * K)) & 1
      set(x, y, s ? SHEET : SHEET2)
    }
  }
  // the map
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < w; x++) {
      const c = cls[y * w + x]
      if (c === SKY) continue // the sheet is drawn there
      if (c === SEA) set(x, SHEET_PX + y, WATER)
      else if (c === OPEN) {
        const edge = at(x - 1, y) === ROCK || at(x + 1, y) === ROCK || at(x, y - 1) === ROCK || at(x, y + 1) === ROCK
        set(x, SHEET_PX + y, edge ? [0, 0, 0] : CAVE)
      } else set(x, SHEET_PX + y, ROCKC[Math.min(3, band[y * w + x])])
    }
  // the pod
  if (S.pod) {
    const { c, base } = S.pod
    for (let dx = -8 * K; dx < 8 * K; dx++)
      for (let dy = -K; dy <= 6 * K; dy++) {
        const p = podPart(dx, dy)
        if (p) set(c + dx, SHEET_PX + base - dy, p === 1 ? SHELL : INSIDE)
      }
  }
  if (view.floors) for (let x = 0; x < w; x++) for (const y of S.floors[x]) if (y < rows) set(x, SHEET_PX + y, FLOORC)
  if (view.storeys) {
    for (const r of S.ramps) for (let i = 0; i <= r.len; i++) set(r.x + r.dir * i, SHEET_PX + r.y + (r.up ? -i : i), RAMP_RGB)
    for (const s of S.list)
      for (let x = 0; x < w; x++) {
        const k = s.kind[x]
        if (k === MERGED || s.y[x] >= rows) continue
        set(x, SHEET_PX + s.y[x], KIND_RGB[k === FLOOR ? 0 : k === BRIDGE ? 1 : k === TUNNEL ? 2 : 0])
      }
  }
  if (view.points)
    for (const p of S.points)
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) set(p.x + dx, SHEET_PX + p.y + dy, [255, 255, 255])
  return { w, h: H, px }
}
