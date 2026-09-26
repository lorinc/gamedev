// Paints the Townscaper-style grid inside the hexes, stage by stage, to gallery/p7/grid_*.png: the
// whole 16 × 32 map, and a close-up of its top-left corner. Usage: node tools/quadgrid.js [seed]

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SQ3 } from '../src/bundles/v5/hex.js'
import { edges, near, pair, relax, subdivide, triangles } from '../src/bundles/v5/quads.js'
import { encodePng } from './png.js'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'gallery', 'p7')
const seed = Number(process.argv[2] || 1)
const ITERS = 150

/** @typedef {import('../src/bundles/v5/quads.js').Mesh} Mesh */

// unit space → fine cells (a hex 10 cells wide, rows 9 apart), then × px per cell
const fx = (/** @type {number} */ x) => (x * 10) / SQ3
const fy = (/** @type {number} */ y) => y * 6 + 6

/** @param {number} w @param {number} h */
function canvas(w, h) {
  const rgb = Buffer.alloc(w * h * 3)
  for (let i = 0; i < w * h; i++) rgb.set([14, 14, 20], i * 3)
  /** @param {number} x @param {number} y @param {number[]} c */
  const set = (x, y, c) => {
    x = Math.round(x)
    y = Math.round(y)
    if (x >= 0 && y >= 0 && x < w && y < h) rgb.set(c, (y * w + x) * 3)
  }
  /** @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {number[]} c @param {number} t */
  const line = (x0, y0, x1, y1, c, t) => {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1
    for (let s = 0; s <= n; s++) {
      const x = x0 + ((x1 - x0) * s) / n
      const y = y0 + ((y1 - y0) * s) / n
      for (let dy = 0; dy < t; dy++) for (let dx = 0; dx < t; dx++) set(x + dx - (t >> 1), y + dy - (t >> 1), c)
    }
  }
  /** @param {number[][]} pts @param {number[]} c */
  const fill = (pts, c) => {
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++)
      for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
        let inside = false
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i]
          const [xj, yj] = pts[j]
          if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside
        }
        if (inside) set(x, y, c)
      }
  }
  return { rgb, w, h, line, fill }
}

/**
 * @param {Mesh} m @param {string} name
 * @param {{fillTris?: boolean}} [opt]
 */
function draw(m, name, opt = {}) {
  const views = [
    { tag: 'map', px: 4, x0: 0, y0: 0, w: 160 * 4, h: 291 * 4 },
    { tag: 'close', px: 14, x0: 0, y0: 0, w: 50 * 14, h: 50 * 14 },
  ]
  for (const v of views) {
    const c = canvas(v.w, v.h)
    const P = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ shift) => [
      (fx(x + shift) - v.x0) * v.px,
      (fy(y) - v.y0) * v.px,
    ]
    for (const shift of [-m.wrap, 0, m.wrap]) {
      if (opt.fillTris)
        m.faces.forEach((f) => {
          const pts = f.map((q) => P(near(m.x[q], m.x[f[0]], m.wrap), m.y[q], shift))
          c.fill(pts, f.length === 3 ? [200, 90, 60] : [40, 60, 90])
        })
      /** @type {number[][]} */
      const outline = []
      for (const [a, b, fs] of edges(m)) {
        const [x0, y0] = P(m.x[a], m.y[a], shift)
        const [x1, y1] = P(near(m.x[b], m.x[a], m.wrap), m.y[b], shift)
        if (fs.length === 2 && m.hex[fs[0]] !== m.hex[fs[1]]) outline.push([x0, y0, x1, y1])
        else c.line(x0, y0, x1, y1, [150, 150, 165], 1)
      }
      // the hex outlines on top, so you can see how far they bend
      for (const [x0, y0, x1, y1] of outline) c.line(x0, y0, x1, y1, [240, 150, 40], v.px > 6 ? 3 : 2)
    }
    const file = join(OUT, `grid_seed${seed}_${name}_${v.tag}.png`)
    writeFileSync(file, encodePng(c.w, c.h, c.rgb))
    console.log(`wrote ${file}`)
  }
}

mkdirSync(OUT, { recursive: true })
const tri = triangles(16, 32) // p7's first map; the page's quad map is 3 × 6
const paired = pair(tri, seed)
const sub = subdivide(paired)
console.log(
  `${tri.faces.length} triangles → ${paired.faces.length} faces (${paired.faces.filter((f) => f.length === 3).length} triangles left) → ${sub.faces.length} quads`,
)
draw(tri, '1_triangles')
draw(paired, '2_paired', { fillTris: true })
draw(sub, '3_subdivided')
draw(relax(sub, ITERS, true), '4_relaxed-hexes-pinned')
draw(relax(sub, ITERS, false), '5_relaxed-whole-mesh')
