// Multi-scale cellular automaton, ported from the Kaggle "tileable cave generator":
// random seed field → smooth → scale ×2 → smooth → … Wraps horizontally (the moon is a ring),
// not vertically (depth runs top to bottom).

import { chance, type Rng } from '../rng'

export interface Grid {
  w: number
  h: number
  cells: Uint8Array // 0 or 1, row-major
}

// Bitmasks over the live-neighbour count (bit n = count n, 0..8).
export interface Rule {
  birth: number
  death: number
}

export interface LayerParams {
  density: number // permille of live cells in the seed field
  stepsX: number // ×2 scale-ups along x; blob width grows with this
  stepsY: number // … along y. stepsX > stepsY stretches blobs sideways (galleries, strata),
  // stepsY > stepsX stretches them vertically (shafts, chimneys)
  first: string // rule for the pass on the seed field
  mid: string // rule after each scale-up but the last
  last: string // rule after the last scale-up
  edge: Edge
}

// "d012 b5678" → death on 0,1,2 neighbours, birth on 5..8. Other counts keep the cell.
// Same shape as the notebook's {'d': [...], 'b': [...]}; 's' is accepted and ignored.
export function parseRule(text: string): Rule {
  const rule: Rule = { birth: 0, death: 0 }
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

export function formatRule(rule: Rule): string {
  const digits = (mask: number) => [...Array(9).keys()].filter((n) => mask & (1 << n)).join('')
  return `d${digits(rule.death & ~rule.birth)} b${digits(rule.birth)}`
}

export function seedGrid(w: number, h: number, rng: Rng, density: number): Grid {
  const cells = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) cells[i] = chance(rng, density) ? 1 : 0
  return { w, h, cells }
}

// What lies above the top and below the bottom: empty, filled, or the other side (full torus).
export type Edge = 0 | 1 | 'wrap'

export function nextgen(g: Grid, rule: Rule, edge: Edge): Grid {
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
export function scaleBy(g: Grid, fx: number, fy: number): Grid {
  const w = g.w * fx
  const h = g.h * fy
  const cells = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) cells[y * w + x] = g.cells[Math.trunc(y / fy) * g.w + Math.trunc(x / fx)]
  }
  return { w, h, cells }
}

export function scaleUp(g: Grid, sx = true, sy = true): Grid {
  return scaleBy(g, sx ? 2 : 1, sy ? 2 : 1)
}

// Width must be divisible by 2^stepsX, height by 2^stepsY. The one-axis scale-ups come first,
// so the stretch is set early and later passes smooth it. onStep sees every intermediate grid.
export function runLayer(
  p: LayerParams,
  width: number,
  height: number,
  rng: Rng,
  onStep?: (label: string, g: Grid) => void,
): Grid {
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
