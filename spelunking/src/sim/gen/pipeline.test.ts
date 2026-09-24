import { expect, test } from 'vitest'
import { migrate, NOTEBOOK_PIPELINE, runPipeline, type Pipeline } from './pipeline'

test('one grid per step plus the noise', () => {
  expect(runPipeline(NOTEBOOK_PIPELINE)).toHaveLength(NOTEBOOK_PIPELINE.steps.length + 1)
})

test('scale steps set the final size', () => {
  const grids = runPipeline(NOTEBOOK_PIPELINE)
  expect(grids.at(-1)).toMatchObject({ w: 64, h: 256 })
})

test('integer scale factors per axis', () => {
  const p: Pipeline = { ...NOTEBOOK_PIPELINE, steps: [{ kind: 'scale', x: 3, y: 1 }] }
  const [noise, scaled] = runPipeline(p)
  expect(scaled).toMatchObject({ w: 24, h: 32 })
  // cell (x, y) of the noise becomes columns 3x..3x+2 of row y
  for (let x = 0; x < 24; x++) expect(scaled.cells[5 * 24 + x]).toBe(noise.cells[5 * 8 + Math.trunc(x / 3)])
})

test('old boolean scale steps migrate to factors', () => {
  const old = { ...NOTEBOOK_PIPELINE, steps: [{ kind: 'scale', x: true, y: false }] } as unknown as Pipeline
  expect(migrate(old).steps[0]).toEqual({ kind: 'scale', x: 2, y: 1 })
})

test('repeat applies the rule several times', () => {
  const once = { ...NOTEBOOK_PIPELINE, steps: [{ kind: 'gen' as const, rule: 'd0123 b45678', repeat: 1 }] }
  const twice = { ...NOTEBOOK_PIPELINE, steps: [once.steps[0], once.steps[0]] }
  const repeat2 = { ...NOTEBOOK_PIPELINE, steps: [{ ...once.steps[0], repeat: 2 }] }
  expect(runPipeline(repeat2).at(-1)!.cells).toEqual(runPipeline(twice).at(-1)!.cells)
})

test('deterministic', () => {
  expect(runPipeline(NOTEBOOK_PIPELINE).at(-1)!.cells).toEqual(runPipeline(NOTEBOOK_PIPELINE).at(-1)!.cells)
})
