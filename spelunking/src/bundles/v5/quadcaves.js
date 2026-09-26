// The relaxed quad grid (quads.js) ready for the quad WFC: the mesh, each quad's centre before and
// after relaxing, and its edges. Built once per grid seed.

import { edges, near, pair, relax, subdivide, triangles } from './quads.js'
import { quadLinks } from './quadwfc.js'

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
  mesh.faces.forEach((f, q) => {
    let rx = 0
    let ry = 0
    for (const v of f) {
      rx += near(mesh.x[v], mesh.x[f[0]], mesh.wrap)
      ry += mesh.y[v]
    }
    cx[q] = ((((rx / 4) % mesh.wrap) + mesh.wrap) % mesh.wrap) * (10 / Math.sqrt(3))
    cy[q] = (ry / 4) * 6 + 6
  })
  /** @type {[number, number][]} */
  const walls = [] // every edge's two vertices
  for (const [a, b] of edges(mesh)) walls.push([a, b])
  return { mesh, W, H, cx, cy, walls, links: quadLinks(mesh.faces) }
}
/** @typedef {ReturnType<typeof buildGrid>} Grid */
