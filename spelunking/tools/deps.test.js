// Dependencies are bad by default: zero runtime dependencies, and every dev dependency has a
// line in the README's Dependencies table saying why ~100 lines of our own code can't replace it.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8')

test('zero runtime dependencies', () => {
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), [], 'the browser APIs are the engine')
})

test('every dev dependency is justified in the README ledger', () => {
  for (const name of Object.keys(pkg.devDependencies ?? {})) {
    assert.match(readme, new RegExp(`^\\| \`${name.replace(/[/@.]/g, '\\$&')}\` \\|`, 'm'), `${name} needs a row in README.md → Dependencies`)
  }
})
