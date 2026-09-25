// A bug report replays exactly: a session played the way b1 plays it (commands between frames,
// several ticks per frame) gives a report that tools/replay.js reproduces line for line.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createRecorder } from '../src/bundles/b1/report.js'
import { command, createGame, tick, withSurface } from '../src/sim/dig/game.js'
import { compile, simConfig } from '../src/sim/dig/ruleset.js'
import { DEFAULT_TERRAIN, generateTerrain } from '../src/sim/gen/terrain.js'
import { replay } from './replay.js'

test('a report replays exactly', () => {
  const ruleset = JSON.parse(readFileSync(new URL('../rules/b1.7.json', import.meta.url), 'utf8'))
  const { world, home } = withSurface(generateTerrain(DEFAULT_TERRAIN), 4, 3)
  const g = createGame(world, home, simConfig(ruleset), /** @type {any} */ (compile(ruleset).table))
  const rec = createRecorder(g, { build: 'test', ruleset, preset: () => 'p' })
  const frames = (/** @type {number} */ n) => {
    for (let f = 0; f < n; f++) {
      for (let t = 0; t < 1 + (f % 3); t++) tick(g) // uneven frames, like a real browser
      for (const e of g.events) rec.onEvent(e)
      g.events.length = 0
    }
  }
  const send = (/** @type {any} */ cmd, /** @type {string} */ how) => {
    rec.record(cmd, how)
    command(g, cmd)
  }
  send({ type: 'intent', dx: 1, dy: 0 }, 'test swipe 5°')
  frames(3)
  send({ type: 'release' }, 'test let go') // a flick
  frames(40)
  send({ type: 'stop' }, 'test tap')
  frames(5)
  send({ type: 'intent', dx: -1, dy: 1 }, 'test swipe 44°')
  frames(12)
  send({ type: 'hold' }, 'test still down') // a hold
  frames(120)
  send({ type: 'release' }, 'test let go')
  frames(40)
  g.cfg.rules.junction = false
  rec.config()
  send({ type: 'intent', dx: 1, dy: -1, held: true }, 'test hold+swipe 46°')
  frames(300)
  const report = rec.report()
  assert.match(report, /Last 3 swipes/)
  assert.match(report, /↙ hold/)
  assert.match(report, /let go \(test let go\)/)
  assert.match(report, /^EXAMPLE \{/m)
  const r = replay(report)
  assert.deepEqual(r.problems, [])
  assert.equal(r.report, report)
  assert.ok(r.same)
})
