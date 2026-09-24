// The sim stays dependency-free: its modules import only other sim modules.
// Tests (*.test.js) may use node: built-ins.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const SIM = dirname(fileURLToPath(import.meta.url))

test('sim modules import nothing outside src/sim', () => {
  const files = readdirSync(SIM, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'))
  assert.ok(files.length > 0)
  for (const file of files) {
    const src = readFileSync(join(SIM, file), 'utf8')
    for (const [, spec] of src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
      const target = resolve(SIM, dirname(file), spec)
      const inside = spec.startsWith('.') && !relative(SIM, target).startsWith('..')
      assert.ok(inside, `${file} imports '${spec}'`)
    }
  }
})
