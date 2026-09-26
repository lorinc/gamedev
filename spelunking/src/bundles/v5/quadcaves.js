// The relaxed quad grid (quads.js) ready for the quad WFC: the mesh, each quad's centre before and
// after relaxing, and its edges. Built once per grid seed.

import { edges, near, pair, relax, subdivide, triangles } from './quads.js'
import { quadLinks } from './quadwfc.js'

/** The quad map: 6 × 12 terrain hexes plus a sky row on top and an ocean row below (user: 1/5 of p7's
 * 16 × 32 each way, then twice that). */
export const QCOLS = 6
export const QROWS = 14

/**
 * The relaxed grid of cols × rows hexes. Fine cells: a hex is 10 wide, rows 9 apart, as in hex.js.
 * @param {number} seed @param {number} iters @param {number} cols @param {number} rows
 */
export function buildGrid(seed, iters, cols, rows) {
  const mesh = relax(subdivide(pair(triangles(cols, rows), seed)), iters, false)
  const Q = mesh.faces.length
  const W = cols * 10 // fine cells across (x wraps here)
  const H = (rows - 1) * 9 + 12 // fine cells down
  const cx = new Float64Array(Q) // quad centre, in fine cells
  const cy = new Float64Array(Q)
  const ex = new Float64Array(Q * 4) // edge k's midpoint, from the quad's centre, in fine cells
  const ey = new Float64Array(Q * 4)
  const ux = 10 / Math.sqrt(3)
  mesh.faces.forEach((f, q) => {
    const xs = f.map((v) => near(mesh.x[v], mesh.x[f[0]], mesh.wrap) * ux)
    const ys = f.map((v) => mesh.y[v] * 6)
    const mx = (xs[0] + xs[1] + xs[2] + xs[3]) / 4
    const my = (ys[0] + ys[1] + ys[2] + ys[3]) / 4
    cx[q] = ((((mx / ux) % mesh.wrap) + mesh.wrap) % mesh.wrap) * ux
    cy[q] = my + 6
    for (let k = 0; k < 4; k++) {
      ex[q * 4 + k] = (xs[k] + xs[(k + 1) & 3]) / 2 - mx
      ey[q * 4 + k] = (ys[k] + ys[(k + 1) & 3]) / 2 - my
    }
  })
  /** @type {[number, number][]} */
  const walls = [] // every edge's two vertices
  for (const [a, b] of edges(mesh)) walls.push([a, b])
  return { mesh, W, H, cx, cy, ex, ey, walls, links: quadLinks(mesh.faces) }
}
/** @typedef {ReturnType<typeof buildGrid>} Grid */
