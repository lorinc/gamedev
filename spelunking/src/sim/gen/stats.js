// Numbers for tuning the generator against the design: material mix, open space by depth,
// and ledge drop heights bucketed by the fall table (1–2 safe, 3–4 loud, 5+ panic).

import { isOpen, TILE_NAMES } from './world.js'

/** @typedef {import('./world.js').World} World */

/**
 * @typedef {object} Drop
 * @property {number} x the open tile you step off into
 * @property {number} y
 * @property {number} height tiles fallen before landing
 */

/**
 * @typedef {object} WorldStats
 * @property {Record<string, number>} materialPct
 * @property {number[]} openPctByQuarter
 * @property {{ safe: number, loud: number, panic: number }} drops
 * @property {Drop[]} dropList
 */

/** @param {World} world @returns {Drop[]} */
export function findDrops(world) {
  const { w, h, tiles } = world
  /** @param {number} x @param {number} y */
  const open = (x, y) => y < h && isOpen(tiles[y * w + ((x + w) % w)])
  /** @type {Drop[]} */
  const drops = []
  /** @type {Set<number>} */
  const seen = new Set()
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      // standing: open tile with ground below
      if (!open(x, y) || open(x, y + 1)) continue
      for (const dx of [-1, 1]) {
        const nx = (x + dx + w) % w
        if (!open(nx, y) || !open(nx, y + 1)) continue
        const key = y * w + nx
        if (seen.has(key)) continue
        seen.add(key)
        let height = 0
        while (open(nx, y + height + 1)) height++
        drops.push({ x: nx, y, height })
      }
    }
  }
  return drops
}

/** @param {World} world @returns {WorldStats} */
export function computeStats(world) {
  const { w, h, tiles } = world
  const counts = new Array(TILE_NAMES.length).fill(0)
  const quarterOpen = [0, 0, 0, 0]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = tiles[y * w + x]
      counts[t]++
      if (isOpen(t)) quarterOpen[Math.min(3, Math.trunc((y * 4) / h))]++
    }
  }
  /** @type {Record<string, number>} */
  const materialPct = {}
  TILE_NAMES.forEach((name, i) => (materialPct[name] = Math.round((counts[i] * 1000) / (w * h)) / 10))

  const dropList = findDrops(world)
  const drops = { safe: 0, loud: 0, panic: 0 }
  for (const d of dropList) {
    if (d.height <= 2) drops.safe++
    else if (d.height <= 4) drops.loud++
    else drops.panic++
  }

  return {
    materialPct,
    openPctByQuarter: quarterOpen.map((n) => Math.round((n * 400) / (w * h))),
    drops,
    dropList,
  }
}
