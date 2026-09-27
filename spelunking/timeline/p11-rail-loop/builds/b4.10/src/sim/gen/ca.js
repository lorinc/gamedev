// Multi-scale cellular automaton, ported from the Kaggle "tileable cave generator":
// random seed field → smooth → scale ×2 → smooth → … Wraps horizontally (the moon is a ring),
// not vertically (depth runs top to bottom).

import { chance } from '../rng.js'

/** @typedef {import('../rng.js').Rng} Rng */

/**
 * @typedef {object} Grid
 * @property {number} w
 * @property {number} h
 * @property {Uint8Array} cells 0 or 1, row-major
 */

/**
 * Bitmasks over the live-neighbour count (bit n = count n, 0..8).
 * @typedef {{ birth: number, death: number }} Rule
 */

/**
 * What lies above the top and below the bottom: empty, filled, or the other side (full torus).
 * @typedef {0 | 1 | 'wrap'} Edge
 */

/**
 * @typedef {object} LayerParams
 * @property {number} density permille of live cells in the seed field
 * @property {number} stepsX ×2 scale-ups along x; blob width grows with this
 * @property {number} stepsY … along y. stepsX > stepsY stretches blobs sideways (galleries, strata),
 *   stepsY > stepsX stretches them vertically (shafts, chimneys)
 * @property {string} first rule for the pass on the seed field
 * @property {string} mid rule after each scale-up but the last
 * @property {string} last rule after the last scale-up
 * @property {Edge} edge
 */

// "d012 b5678" → death on 0,1,2 neighbours, birth on 5..8. Other counts keep the cell.
// Same shape as the notebook's {'d': [...], 'b': [...]}; 's' is accepted and ignored.
/** @param {string} text @returns {Rule} */
export function parseRule(text) {
  /** @type {Rule} */
  const rule = { birth: 0, death: 0 }
  for (const part of text.toLowerCase().split(/\s+/)) {
    const key = part[0]
    let mask = 0
    for (const ch of part.slice(1)) {
      const n = ch.charCodeAt(0) - 48
      if (n >= 0 && n <= 8) mask |= 1 << n
    }
    if (key === 'b') rule.birth = mask
    else if (key === 'd') rule.death = mask
  }
  return rule
}

/** @param {Rule} rule @returns {string} */
export function formatRule(rule) {
  /** @param {number} mask */
  const digits = (mask) => [...Array(9).keys()].filter((n) => mask & (1 << n)).join('')
  return `d${digits(rule.death & ~rule.birth)} b${digits(rule.birth)}`
}

/** @param {number} w @param {number} h @param {Rng} rng @param {number} density @returns {Grid} */
export function seedGrid(w, h, rng, density) {
  const cells = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) cells[i] = chance(rng, density) ? 1 : 0
  return { w, h, cells }
}

/** @param {Grid} g @param {Rule} rule @param {Edge} edge @returns {Grid} */
export function nextgen(g, rule, edge) {
  const { w, h, cells } = g
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        let yy = y + dy
        if (edge === 'wrap') yy = (yy + h) % h
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          if (yy < 0 || yy >= h) {
            n += edge === 1 ? 1 : 0
            continue
          }
          const xx = (x + dx + w) % w
          n += cells[yy * w + xx]
        }
      }
      const i = y * w + x
      let c = cells[i]
      if (rule.death & (1 << n)) c = 0
      if (rule.birth & (1 << n)) c = 1
      out[i] = c
    }
  }
  return { w, h, cells: out }
}

// Every cell becomes an fx × fy block.
/** @param {Grid} g @param {number} fx @param {number} fy @returns {Grid} */
export function scaleBy(g, fx, fy) {
  const w = g.w * fx
  const h = g.h * fy
  const cells = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) cells[y * w + x] = g.cells[Math.trunc(y / fy) * g.w + Math.trunc(x / fx)]
  }
  return { w, h, cells }
}

/** @param {Grid} g @returns {Grid} */
export function scaleUp(g, sx = true, sy = true) {
  return scaleBy(g, sx ? 2 : 1, sy ? 2 : 1)
}

// Width must be divisible by 2^stepsX, height by 2^stepsY. The one-axis scale-ups come first,
// so the stretch is set early and later passes smooth it. onStep sees every intermediate grid.
/**
 * @param {LayerParams} p
 * @param {number} width
 * @param {number} height
 * @param {Rng} rng
 * @param {(label: string, g: Grid) => void} [onStep]
 * @returns {Grid}
 */
export function runLayer(p, width, height, rng, onStep) {
  let g = seedGrid(width >> p.stepsX, height >> p.stepsY, rng, p.density)
  onStep?.('seed', g)
  g = nextgen(g, parseRule(p.first), p.edge)
  onStep?.(`gen ${p.first}`, g)
  const steps = Math.max(p.stepsX, p.stepsY)
  for (let i = 0; i < steps; i++) {
    const sx = i >= steps - p.stepsX
    const sy = i >= steps - p.stepsY
    g = scaleUp(g, sx, sy)
    onStep?.(`scale ${sx ? 'x' : ''}${sy ? 'y' : ''}`, g)
    const rule = i === steps - 1 ? p.last : p.mid
    g = nextgen(g, parseRule(rule), p.edge)
    onStep?.(`gen ${rule}`, g)
  }
  return g
}
