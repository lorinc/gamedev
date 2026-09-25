// The dig rules' spec (R8): every example in rules/examples.json plays out as written on
// the current ruleset (rules/b1.7.json), and every row of its table is used by at least one example.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { runExample } from './examples.js'
import { compile, simConfig } from './ruleset.js'

const read = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../rules/${f}`, import.meta.url), 'utf8'))
const B12 = read('b1.7.json') // the current ruleset
const { examples } = read('examples.json')
const table = /** @type {import('./ruleset.js').Table} */ (compile(B12).table)

describe('examples on the current ruleset', () => {
  for (const ex of examples)
    test(`${ex.id}: ${ex.note}`, () => {
      assert.deepEqual(runExample(ex, table, simConfig(B12)).problems, [])
    })

  test('every row is used by an example', () => {
    const used = new Set()
    for (const ex of examples)
      for (const s of runExample(ex, table, simConfig(B12)).swipes) for (const r of s.rules) used.add(`${r.intent} ${r.row + 1}`)
    const unused = Object.entries(B12.table).flatMap(([intent, rows]) =>
      rows.map((/** @type {any} */ _, /** @type {number} */ i) => `${intent} ${i + 1}`).filter((k) => !used.has(k)),
    )
    assert.deepEqual(unused, [])
  })
})
