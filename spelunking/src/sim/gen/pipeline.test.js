import assert from 'node:assert/strict'
import { test } from 'node:test'
import { finalGrid, migrate, NOTEBOOK_PIPELINE, runPipeline } from './pipeline.js'

test('one grid per step plus the noise', () => {
  assert.equal(runPipeline(NOTEBOOK_PIPELINE).length, NOTEBOOK_PIPELINE.steps.length + 1)
})

test('scale steps set the final size', () => {
  const g = finalGrid(NOTEBOOK_PIPELINE)
  assert.deepEqual([g.w, g.h], [64, 256])
})

test('integer scale factors per axis', () => {
  const p = { ...NOTEBOOK_PIPELINE, steps: [{ kind: 'scale', x: 3, y: 1 }] }
  const [noise, scaled] = runPipeline(p)
  assert.deepEqual([scaled.w, scaled.h], [24, 32])
  // cell (x, y) of the noise becomes columns 3x..3x+2 of row y
  for (let x = 0; x < 24; x++) assert.equal(scaled.cells[5 * 24 + x], noise.cells[5 * 8 + Math.trunc(x / 3)])
})

test('old boolean scale steps migrate to factors', () => {
  const old = { ...NOTEBOOK_PIPELINE, steps: [{ kind: 'scale', x: true, y: false }] }
  assert.deepEqual(migrate(old).steps[0], { kind: 'scale', x: 2, y: 1 })
})

test('repeat applies the rule several times', () => {
  const step = { kind: 'gen', rule: 'd0123 b45678', repeat: 1 }
  const twice = { ...NOTEBOOK_PIPELINE, steps: [step, step] }
  const repeat2 = { ...NOTEBOOK_PIPELINE, steps: [{ ...step, repeat: 2 }] }
  assert.deepEqual(finalGrid(repeat2).cells, finalGrid(twice).cells)
})

test('deterministic', () => {
  assert.deepEqual(finalGrid(NOTEBOOK_PIPELINE).cells, finalGrid(NOTEBOOK_PIPELINE).cells)
})
