// The sim is deterministic: the same seed and the same commands give the same state, bit for bit.
// That's what makes dive logs replayable, bug reports reproducible and P2P checks possible.

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { command, createGame, tick, withSurface } from './dig/game.js'
import { compile, migrate } from './dig/ruleset.js'
import { DEFAULT_TERRAIN, generateTerrain } from './gen/terrain.js'

const SIM = dirname(fileURLToPath(import.meta.url))
const TABLE = compile(migrate(JSON.parse(readFileSync(join(SIM, '../../rules/b1.2.json'), 'utf8')))).table

/** @type {import('./dig/rules.js').SimConfig} */
const CFG = {
  walkTicks: 2,
  climbTicks: 2,
  fallTicks: 1,
  buildTicks: 2,
  digTicks: { soft: 3, hard: 9, ore: 4, loot: 3, built: 2 },
  harmlessDrop: 4,
  packSlots: 3,
  rules: { wall: true, open: true, harder: true, loot: true, junction: true },
}

// A scripted dive: walk, mine a diagonal staircase down, mine sideways, turn around, go home.
const SCRIPT = [
  [1, 0],
  [1, 1],
  [1, 1],
  [1, 0],
  [-1, 1],
  [-1, 0],
  [1, 1],
  [1, 0],
]

function play(caveSeed = DEFAULT_TERRAIN.caveSeed) {
  const { world, home } = withSurface(generateTerrain({ ...DEFAULT_TERRAIN, caveSeed }), 4, 3)
  const g = createGame(world, home, structuredClone(CFG), TABLE)
  for (const [dx, dy] of SCRIPT) {
    command(g, { type: 'intent', dx, dy })
    for (let i = 0; i < 300; i++) tick(g)
  }
  command(g, { type: 'teleport' })
  for (let i = 0; i < 300; i++) tick(g)
  const h = createHash('sha256')
  h.update(g.world.tiles)
  h.update(JSON.stringify({ tick: g.tick, ch: g.ch, pack: g.pack, stash: g.stash, dives: g.dives }))
  return { hash: h.digest('hex'), g }
}

test('same seed + same commands → same state', () => {
  const a = play()
  const b = play()
  assert.equal(a.hash, b.hash)
  assert.ok(
    a.g.tick > 0 && (a.g.ch.x !== a.g.home.x || Object.values(a.g.stash).some((n) => n > 0) || a.g.dives.length > 0),
    'the script must actually do something',
  )
})

test('a different seed → a different state (the hash covers the world)', () => {
  assert.notEqual(play().hash, play(DEFAULT_TERRAIN.caveSeed + 100).hash)
})

test('sim code uses no clock or unseeded randomness', () => {
  const banned = /\bMath\.random\b|\bDate\b|\bperformance\.now\b|\bcrypto\b|\bsetTimeout\b|\bsetInterval\b|\brequestAnimationFrame\b/
  for (const file of readdirSync(SIM, { recursive: true }).map(String)) {
    if (!file.endsWith('.js') || file.endsWith('.test.js')) continue
    readFileSync(join(SIM, file), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, '')
        assert.ok(!banned.test(code), `${file}:${i + 1} uses ${code.match(banned)?.[0]}: seed it from src/sim/rng.js or pass it in`)
      })
  }
})
