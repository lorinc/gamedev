// The relaxed quad grid (quads.js) ready for the quad WFC: the mesh, each quad's centre before and
// after relaxing, and its edges. Built once per grid seed.

import { WRAP, edges, near, pair, relax, subdivide, triangles } from './quads.js'
import { quadLinks } from './quadwfc.js'

/** The relaxed grid, built once per grid seed. @param {number} seed @param {number} iters */
export function buildGrid(seed, iters) {
  const mesh = relax(subdivide(pair(triangles(), seed)), iters, false)
  const Q = mesh.faces.length
  const cx = new Float64Array(Q) // quad centre, in fine cells (x wraps at 160)
  const cy = new Float64Array(Q)
  mesh.faces.forEach((f, q) => {
    let rx = 0
    let ry = 0
    for (const v of f) {
      rx += near(mesh.x[v], mesh.x[f[0]])
      ry += mesh.y[v]
    }
    cx[q] = ((((rx / 4) % WRAP) + WRAP) % WRAP) * (10 / Math.sqrt(3))
    cy[q] = (ry / 4) * 6 + 6
  })
  /** @type {[number, number][]} */
  const walls = [] // every edge's two vertices
  for (const [a, b] of edges(mesh)) walls.push([a, b])
  return { mesh, cx, cy, walls, links: quadLinks(mesh.faces) }
}
/** @typedef {ReturnType<typeof buildGrid>} Grid */
