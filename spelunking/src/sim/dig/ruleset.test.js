// rules/b1.2.json must mean exactly what b1.2's code meant: the interpreter and the legacy
// resolve() are compared on thousands of random small worlds, every swipe, both facings.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { mulberry32 } from '../rng.js'
import { Tile } from '../gen/world.js'
import { resolve } from './rules.js'
import { compile, interpret, migrate, simConfig } from './ruleset.js'

// migrated: building is paid in rock now (noRock, D038); the table itself is untouched
const B12 = migrate(JSON.parse(readFileSync(new URL('../../../rules/b1.2.json', import.meta.url), 'utf8')))

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
]
const TILES = [Tile.Open, Tile.Open, Tile.Open, Tile.Soft, Tile.Hard, Tile.Ore, Tile.Loot, Tile.Built, Tile.Sky]

describe('rules/b1.2.json', () => {
  test('compiles without errors', () => {
    assert.deepEqual(compile(B12).errors, [])
  })

  test('means exactly what the b1.2 code meant', () => {
    const table = /** @type {import('./ruleset.js').Table} */ (compile(B12).table)
    const rng = mulberry32(12)
    const int = (/** @type {number} */ n) => rng() % n
    let compared = 0
    for (let world = 0; world < 3000; world++) {
      const w = 4 + int(5)
      const h = 3 + int(5)
      const tiles = Uint8Array.from({ length: w * h }, () => TILES[int(TILES.length)])
      const at = { x: int(w), y: int(h) }
      tiles[at.y * w + at.x] = Tile.Open
      const cfg = { ...simConfig(B12), harmlessDrop: int(5) }
      const free = int(3)
      const inv = { fits: (/** @type {number[]} */ t) => t.length <= free, buildable: int(3) }
      for (const [dx, dy] of DIRS)
        for (const facing of [-1, 1]) {
          const want = resolve({ w, h, tiles }, at, dx, dy, facing, cfg, inv)
          const { rule, intended, ...got } = interpret(table, { w, h, tiles }, at, dx, dy, facing, cfg, inv)
          got.builds = got.builds.map(({ x, y }) => ({ x, y }))
          assert.deepEqual(got, want, `world ${world} ${JSON.stringify({ w, h, at, dx, dy, facing })}`)
          compared++
        }
    }
    assert.equal(compared, 3000 * 16)
  })
})

describe('compile', () => {
  const broken = (/** @type {(r: any) => void} */ edit) => {
    const r = structuredClone(B12)
    edit(r)
    return compile(r)
  }

  test('names every unknown id', () => {
    const { table, errors } = broken((r) => {
      r.situations.walkable.push('!flying')
      r.table.side[0].do = 'teleport'
      r.table.down[0].if = 'nowhere'
    })
    assert.equal(table, null)
    assert.deepEqual(errors, [
      'situation walkable: unknown condition "!flying"',
      'table side row 1: unknown meaning "teleport"',
      'table down row 1: unknown situation "nowhere"',
    ])
  })

  test('every refusal needs a signal (D027)', () => {
    const { errors } = broken((r) => {
      r.table.up[0].reason = 'straightUp'
      delete r.reasons.packFull
      r.reasons.ledge = 'shout'
    })
    assert.deepEqual(errors, [
      'reasons: "packFull" has no signal',
      'reasons: "ledge" has an unknown signal "shout"',
      'reasons: "straightUp" has no signal',
    ])
  })

  test('the row that chose an action is reported', () => {
    const table = /** @type {import('./ruleset.js').Table} */ (compile(B12).table)
    const tiles = Uint8Array.from('#####' + '#...#' + '#####', (c) => (c === '#' ? Tile.Soft : Tile.Open))
    const a = interpret(table, { w: 5, h: 3, tiles }, { x: 1, y: 1 }, 1, 0, 1, simConfig(B12), { fits: () => true, buildable: 0 })
    assert.deepEqual([a.kind, a.rule], ['walk', { intent: 'side', row: 0 }])
  })
})
