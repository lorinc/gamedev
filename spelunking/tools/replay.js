// Replays a b1 bug report: rebuilds the world, plays every recorded command at its tick on the
// report's ruleset and sim config, then checks the replay tells the same story as the report.
// Usage: npm run replay -- report.txt   (the text the 🐞 button copied)

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { command, createGame, tick, withSurface } from '../src/sim/dig/game.js'
import { compile, migrate } from '../src/sim/dig/ruleset.js'
import { DEFAULT_TERRAIN, generateTerrain } from '../src/sim/gen/terrain.js'
import { createRecorder, worldHash } from '../src/bundles/b1/report.js'

/**
 * @param {string} text a bug report
 * @returns {{ report: string, same: boolean, problems: string[] }}
 */
export function replay(text) {
  const line = text.split('\n').find((l) => l.startsWith('REPLAY '))
  if (!line) return { report: '', same: false, problems: ['no REPLAY line in the report'] }
  const r = JSON.parse(line.slice('REPLAY '.length))
  const problems = []
  const { world, home } = withSurface(generateTerrain(DEFAULT_TERRAIN), 4, 3)
  if (worldHash(world.tiles) !== r.world) problems.push(`the world differs from the report's (${r.world}): the terrain changed since`)
  // a report from before b1.5 compiles, but pays for builds in rock now (D038): expect it to differ
  const { table, errors } = compile(migrate(r.ruleset))
  if (!table) return { report: '', same: false, problems: [...problems, ...errors] }
  const g = createGame(world, home, structuredClone(r.cmds[0][2]), table)
  const preset = text.match(/ · preset (\w+)/)?.[1] ?? '?'
  const rec = createRecorder(g, { build: r.build, ruleset: r.ruleset, preset: () => preset })
  let i = 1
  while (g.tick < r.at) {
    for (; i < r.cmds.length && r.cmds[i][0] === g.tick + 1; i++) {
      const [, type, ...rest] = r.cmds[i]
      if (type === 'cfg') {
        g.cfg = structuredClone(rest[0])
        rec.config()
      } else {
        const cmd = type === 'i' ? { type: 'intent', dx: rest[0], dy: rest[1] } : { type: type === 's' ? 'stop' : 'teleport' }
        rec.record(/** @type {any} */ (cmd), type === 'i' ? rest[2] : rest[0])
        command(g, /** @type {any} */ (cmd))
      }
    }
    tick(g)
    for (const e of g.events) rec.onEvent(e)
    g.events.length = 0
  }
  const story = (/** @type {string} */ t) =>
    t
      .split('\n')
      .filter((l) => !l.startsWith('REPLAY '))
      .join('\n')
      .trimEnd() // a saved or pasted report often gains a final newline
  const report = rec.report()
  return { report, same: story(report) === story(text), problems }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2]
  if (!file) {
    console.error('usage: npm run replay -- report.txt')
    process.exit(2)
  }
  const { report, same, problems } = replay(readFileSync(file, 'utf8'))
  for (const p of problems) console.warn('⚠', p)
  console.log(
    report
      .split('\n')
      .filter((l) => !l.startsWith('REPLAY '))
      .join('\n'),
  )
  console.log(same ? '\n✓ replayed exactly: same swipes, same stops, same map' : '\n✗ the replay differs from the report (see above)')
  process.exit(same ? 0 : 1)
}
