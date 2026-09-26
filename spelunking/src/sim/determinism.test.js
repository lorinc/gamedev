// The sim is deterministic: the same seed and the same commands give the same state, bit for bit.
// That's what makes dive logs replayable, bug reports reproducible and P2P checks possible.

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { addBug } from './dig/bugs.js'
import { command, createGame, tick, withSurface } from './dig/game.js'
import { compile, migrate } from './dig/ruleset.js'
import { DEFAULT_TERRAIN, generateTerrain } from './gen/terrain.js'

const SIM = dirname(fileURLToPath(import.meta.url))
const TABLE = compile(migrate(JSON.parse(readFileSync(join(SIM, '../../rules/b1.2.json'), 'utf8')))).table

/** @typedef {import('./dig/rules.js').SimConfig} SimConfig */

/** @type {SimConfig} */
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

/**
 * @param {SimConfig['light']} [light] with it, the game keeps a seen map (D052), and the hash covers it
 * @param {SimConfig['bugs']} [bugs] with them, moon bugs (D056), and the hash covers them
 * @param {SimConfig['pull']} [pull] with it, you pull ore and loot while still (D062)
 */
function play(caveSeed = DEFAULT_TERRAIN.caveSeed, light, bugs, pull) {
  const { world, home } = withSurface(generateTerrain({ ...DEFAULT_TERRAIN, caveSeed }), 4, 3)
  const g = createGame(
    world,
    home,
    { ...structuredClone(CFG), ...(light && { light }), ...(bugs && { bugs }), ...(pull && { pull }) },
    TABLE,
  )
  if (bugs) g.bar.push(Object.assign(addBug(g, home.x, home.y), { kind: /** @type {const} */ ('bar'), block: -1 })) // one to place early
  let mined = 0
  SCRIPT.forEach(([dx, dy], k) => {
    if (k === 6 && bugs) command(g, { type: 'place' }) // with bugs: it's placed mid-dive, where there's ore to mine (D063)
    command(g, { type: 'intent', dx, dy })
    for (let i = 0; i < 300; i++) {
      tick(g)
      mined += g.events.filter((e) => e.type === 'pulled' && e.by > 0).length
      g.events.length = 0
    }
  })
  command(g, { type: 'place' }) // with bugs: the bar's first bug, if one was tamed (D060)
  command(g, { type: 'teleport' })
  for (let i = 0; i < 300; i++) tick(g)
  const h = createHash('sha256')
  h.update(g.world.tiles)
  h.update(
    JSON.stringify({
      tick: g.tick,
      ch: g.ch,
      pack: g.pack,
      stash: g.stash,
      dives: g.dives,
      bugs: g.bugs,
      fed: g.fed,
      refill: g.refill,
      stillFor: g.stillFor,
      pulling: g.pulling,
    }),
  )
  if (g.seen) h.update(g.seen)
  return { hash: h.digest('hex'), g, mined }
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

test('with light: same seed + same commands → the same seen map (D052)', () => {
  const light = { base: 4, orePer: 16, lootPer: 8 }
  const a = play(DEFAULT_TERRAIN.caveSeed, light)
  const b = play(DEFAULT_TERRAIN.caveSeed, light)
  assert.equal(a.hash, b.hash)
  assert.deepEqual(a.g.seen, b.g.seen)
  assert.deepEqual(a.g.lit, b.g.lit)
  const surface = a.g.surface.length
  assert.ok(a.g.seen && a.g.seen.reduce((n, v) => n + v, 0) > surface, 'the dive saw more than the surface')
  assert.equal(play().g.seen, null)
})

test('with bugs and the pull: same seed + same commands → the same bugs (D056, D062, D063)', () => {
  const light = { base: 4, orePer: 16, lootPer: 8 }
  const bugs = {
    block: 32,
    blocks: 64,
    chasers: 3,
    refillTicks: 60,
    near: 4,
    moveTicks: 4,
    seek: 20,
    nibbleTicks: 10,
    tame: 2,
    scareTicks: 60,
    den: 12,
    barSlots: 3,
    light: 2,
    barMoveTicks: 12,
    barNear: 2,
    barFar: 8,
    mine: { ticks: 30, reach: 12, carry: 8, hand: 4, handTicks: 6 }, // placed bugs mine (D063)
  }
  const a = play(DEFAULT_TERRAIN.caveSeed, light, bugs, { ticks: 30 })
  const b = play(DEFAULT_TERRAIN.caveSeed, light, bugs, { ticks: 30 })
  assert.equal(a.hash, b.hash)
  assert.ok(a.g.nextBug > 30, 'a bug per fog block (D061)')
  assert.ok(a.mined > 0, 'a placed bug mined (D063)')
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
