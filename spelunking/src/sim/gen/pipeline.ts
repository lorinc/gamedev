// A hand-built CA pipeline on one binary grid: noise, then any sequence of gen and scale steps.

import { mulberry32 } from '../rng'
import { nextgen, parseRule, scaleBy, seedGrid, type Edge, type Grid } from './ca'

export type Step =
  | { kind: 'gen'; rule: string; repeat: number }
  | { kind: 'scale'; x: number; y: number } // integer factors, 1 = unchanged

export interface Pipeline {
  seed: number
  width: number // size of the starting noise; scale steps grow it
  height: number
  density: number // permille live in the starting noise
  edge: Edge
  steps: Step[]
}

export function stepLabel(s: Step): string {
  if (s.kind === 'scale') return `scale ${s.x}×${s.y}`
  return `gen ${s.rule}${s.repeat > 1 ? ` ×${s.repeat}` : ''}`
}

// Returns the noise grid followed by the grid after each step.
// Stops early (fewer grids) if a scale step would exceed maxCells.
export function runPipeline(p: Pipeline, maxCells = Infinity): Grid[] {
  let g = seedGrid(p.width, p.height, mulberry32(p.seed), p.density)
  const out = [g]
  for (const s of p.steps) {
    if (s.kind === 'scale' && g.w * g.h * s.x * s.y > maxCells) break
    if (s.kind === 'scale') g = scaleBy(g, s.x, s.y)
    else {
      const rule = parseRule(s.rule)
      for (let i = 0; i < s.repeat; i++) g = nextgen(g, rule, p.edge)
    }
    out.push(g)
  }
  return out
}

// Older saved pipelines stored scale axes as booleans (double or not).
export function migrate(p: Pipeline): Pipeline {
  for (const s of p.steps as { kind: string; x: unknown; y: unknown }[])
    if (s.kind === 'scale') {
      if (typeof s.x === 'boolean') s.x = s.x ? 2 : 1
      if (typeof s.y === 'boolean') s.y = s.y ? 2 : 1
    }
  return p
}

// Share of cells that differ between two same-sized grids: how much a step disturbed things.
export function changedPermille(a: Grid, b: Grid): number | undefined {
  if (a.w !== b.w || a.h !== b.h) return undefined
  let n = 0
  for (let i = 0; i < a.cells.length; i++) n += a.cells[i] ^ b.cells[i]
  return Math.round((n * 1000) / a.cells.length)
}

export function livePermille(g: Grid): number {
  let n = 0
  for (const c of g.cells) n += c
  return Math.round((n * 1000) / g.cells.length)
}

// The notebook recipe that produced cave.png, at a smaller starting size.
export const NOTEBOOK_PIPELINE: Pipeline = {
  seed: 3,
  width: 8,
  height: 32,
  density: 450,
  edge: 'wrap',
  steps: [
    { kind: 'gen', rule: 'd012 b5678', repeat: 1 },
    { kind: 'scale', x: 2, y: 2 },
    { kind: 'gen', rule: 'd0123 b45678', repeat: 1 },
    { kind: 'scale', x: 2, y: 2 },
    { kind: 'gen', rule: 'd0123 b45678', repeat: 1 },
    { kind: 'scale', x: 2, y: 2 },
    { kind: 'gen', rule: 'd01234 b567', repeat: 1 },
  ],
}
