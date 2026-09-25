import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { MANIFEST, manifest } from './frozen.js'

const TL = join(dirname(fileURLToPath(import.meta.url)), '..', 'timeline')

const builds = readdirSync(TL)
  .filter((d) => /^p\d+-/.test(d) && existsSync(join(TL, d, 'builds')))
  .flatMap((d) => readdirSync(join(TL, d, 'builds')).map((b) => join(d, 'builds', b)))

test('there are frozen builds to check', () => assert.ok(builds.length > 0))

for (const b of builds) {
  test(`frozen build ${b} is unchanged since it was frozen`, () => {
    const file = join(TL, b, MANIFEST)
    assert.ok(existsSync(file), `${b} has no ${MANIFEST}: freeze builds with npm run freeze`)
    assert.equal(manifest(join(TL, b)), readFileSync(file, 'utf8'), `${b} changed. Frozen builds are never edited: make a new build instead`)
  })
}
