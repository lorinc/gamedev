// Bug reports without guesswork. Records every command with its tick and the raw input behind it,
// and groups the sim's events by swipe. report() gives:
//   - the last swipes in words: the raw gesture, the intent it became, the ruleset row that chose
//     each step, where it went, why it stopped, what it tried;
//   - the map where the last swipe started;
//   - EXAMPLE: that moment as a Rule Lab example (v4: "paste bug report");
//   - REPLAY: the whole session's commands. The sim is deterministic, so tools/replay.js rebuilds
//     the exact state and checks it gets the same story.
// No DOM here: tools/replay.js runs it in Node.

import { LEGEND } from '../../sim/dig/examples.js'
import { packText } from '../../sim/dig/pack.js'
import { INTENTS, intentOf } from '../../sim/dig/ruleset.js'
import { Tile } from '../../sim/gen/world.js'

/** @typedef {import('../../sim/dig/game.js').Game} Game */
/** @typedef {import('../../sim/dig/game.js').GameEvent} GameEvent */
/** @typedef {import('../../sim/dig/game.js').Command} Command */
/** @typedef {import('../../sim/dig/rules.js').SimConfig} SimConfig */
/** @typedef {import('../../sim/dig/ruleset.js').Ruleset} Ruleset */
/** @typedef {import('../../sim/dig/examples.js').Example} Example */

/** A recorded command: [tick, 'i', dx, dy, how] | [tick, 's' | 't', how] | [tick, 'cfg', sim]. */
/** @typedef {[number, string, ...any[]]} Rec */

const KEEP = 5 // swipes in the report
const MAP_W = 31 // the map snippet around you
const MAP_H = 15
const ARROW = /** @type {Record<string, string>} */ ({
  '1,0': '→',
  '-1,0': '←',
  '0,1': '↓',
  '0,-1': '↑',
  '1,1': '↘',
  '-1,1': '↙',
  '1,-1': '↗',
  '-1,-1': '↖',
})

/** FNV-1a of the tiles: the replay checks it starts from the same world. @param {Uint8Array} tiles */
export function worldHash(tiles) {
  let h = 0x811c9dc5
  for (const t of tiles) h = Math.imul(h ^ t, 0x01000193)
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * @param {Game} game
 * @param {{ build: string, ruleset: Ruleset, preset: () => string }} info
 */
export function createRecorder(game, info) {
  const startHash = worldHash(game.world.tiles)
  const cfg = () => JSON.parse(JSON.stringify(game.cfg)) // structuredClone is iOS 15.4+ (R14)
  /** @type {Rec[]} */
  const cmds = [[0, 'cfg', cfg()]]
  /**
   * @typedef {{ n: number, tick: number, how: string, arrow: string, intent: string, from: { x: number, y: number }, facing: number,
   *   pack: string[], map: string[], at: [number, number] | null, steps: string[], end: string, stopAt: [number, number] | null, stop: string | null }} Swipe
   */
  /** @type {Swipe[]} */
  const swipes = []
  let n = 0

  const pos = (/** @type {{ x: number, y: number }} */ c) => `(${c.x},${c.y})`
  /** @param {{ intent: string, row: number } | undefined} r */
  const rowText = (r) => {
    if (!r) return 'no rule'
    const row = info.ruleset.table[/** @type {keyof Ruleset['table']} */ (r.intent)]?.[r.row]
    const label = `${INTENTS[/** @type {keyof typeof INTENTS} */ (r.intent)]} row ${r.row + 1}`
    return row ? `${label} ${row.if} → ${row.do}${row.reason ? `(${row.reason})` : ''}${row.place ? `(${row.place})` : ''}` : label
  }

  /** The map around (cx, cy): rows clipped to the world, x wraps. @returns {{ rows: string[], x0: number, y0: number }} */
  function snippet(/** @type {number} */ cx, /** @type {number} */ cy) {
    const { world } = game
    /** @type {Record<number, string>} */
    const chars = { [Tile.Sky]: '.' }
    for (const [c, t] of Object.entries(LEGEND)) if (c !== '@' && !(t in chars)) chars[t] = c
    const x0 = cx - (MAP_W >> 1)
    const y0 = Math.max(0, Math.min(world.h - MAP_H, cy - (MAP_H >> 1)))
    const rows = []
    for (let y = y0; y < Math.min(world.h, y0 + MAP_H); y++) {
      let row = ''
      for (let x = x0; x < x0 + MAP_W; x++) {
        const wx = ((x % world.w) + world.w) % world.w
        row += wx === cx && y === cy ? '@' : chars[world.tiles[y * world.w + wx]]
      }
      rows.push(row)
    }
    return { rows, x0, y0 }
  }

  return {
    /** A command the sim takes on its next tick. @param {Command} cmd @param {string} how */
    record(cmd, how) {
      const tick = game.tick + 1
      if (cmd.type === 'intent') {
        cmds.push([tick, 'i', cmd.dx, cmd.dy, how])
        const { x, y } = game.ch
        const snip = snippet(x, y)
        swipes.push({
          n: ++n,
          tick,
          how,
          arrow: ARROW[`${cmd.dx},${cmd.dy}`],
          intent: `the ${INTENTS[intentOf(cmd.dx, cmd.dy)]} rows`,
          from: { x, y },
          facing: cmd.dx ? Math.sign(cmd.dx) : game.ch.facing,
          pack: packText(game.pack),
          map: snip.rows,
          at: [x - snip.x0, y - snip.y0],
          steps: [],
          end: 'still running',
          stopAt: null,
          stop: null,
        })
        if (swipes.length > KEEP) swipes.shift()
      } else {
        cmds.push([tick, cmd.type === 'stop' ? 's' : 't', how])
        const last = swipes[swipes.length - 1]
        if (last && last.end === 'still running') last.end = cmd.type === 'stop' ? `you stopped it (${how})` : `teleported home (${how})`
      }
    },
    /** The sim config changed (dev panel): replays need it. */
    config() {
      const last = [...cmds].reverse().find((c) => c[1] === 'cfg')
      if (JSON.stringify(last?.[2]) !== JSON.stringify(game.cfg)) cmds.push([game.tick + 1, 'cfg', cfg()])
    },
    /** @param {GameEvent} e */
    onEvent(e) {
      const last = swipes[swipes.length - 1]
      if (!last) return
      if (e.type === 'step') {
        const a = e.action
        const what = a.digs.length || a.builds.length ? `${a.kind} (${a.digs.length} mined, ${a.builds.length} built)` : a.kind
        last.steps.push(`${what} → ${pos(a.to)}${a.fall ? ` falling ${a.fall}` : ''}  [${rowText(a.rule)}]`)
      }
      if (e.type === 'abort') last.steps.push('dig aborted by a new command')
      if (e.type === 'stop' && last.end === 'still running') {
        const signal = e.reason in info.ruleset.reasons ? ` · signal ${info.ruleset.reasons[e.reason]}` : ''
        last.end = `stop ${e.reason}${signal} at ${pos(game.ch)}  [${rowText(e.rule)}]${e.tried.length ? ` · tried ${e.tried.map(pos).join(' ')}` : ''}`
        last.stop = e.reason
        const x0 = last.from.x - (MAP_W >> 1)
        const y0 = last.from.y - /** @type {[number, number]} */ (last.at)[1]
        const dx = (((game.ch.x - x0) % game.world.w) + game.world.w) % game.world.w
        last.stopAt = dx < MAP_W && game.ch.y - y0 >= 0 && game.ch.y - y0 < last.map.length ? [dx, game.ch.y - y0] : null
      }
    },
    /** The whole report, as text for the clipboard. */
    report() {
      const g = game
      const lines = [
        `b1 bug report · ${info.build} · rules ${info.ruleset.name} · preset ${info.preset()} · tick ${g.tick}`,
        `now: at ${pos(g.ch)} facing ${g.ch.facing > 0 ? '→' : '←'} · pack [${packText(g.pack).join(', ')}]${g.run ? ` · running ${ARROW[`${g.run.dx},${g.run.dy}`]}` : ''}`,
        '',
        `Last ${swipes.length} swipes, oldest first:`,
      ]
      for (const s of swipes) {
        lines.push(
          `#${s.n} tick ${s.tick} · ${s.how} → ${s.arrow} (${s.intent}) · from ${pos(s.from)} facing ${s.facing > 0 ? '→' : '←'} · pack [${s.pack.join(', ')}]`,
        )
        const steps =
          s.steps.length > 12 ? [...s.steps.slice(0, 5), `… ${s.steps.length - 10} more steps …`, ...s.steps.slice(-5)] : s.steps
        for (const step of steps) lines.push(`    ${step}`)
        lines.push(`    ${s.end}`)
      }
      const last = swipes[swipes.length - 1]
      if (last) {
        lines.push('', `Map where swipe #${last.n} started (@ = you; . open · # soft · H hard · o ore · $ loot · = built):`, ...last.map)
        /** @type {Example} */
        const example = {
          id: `report-${last.tick}`,
          note: `Bug report, tick ${last.tick}: ${last.how}. Say what should happen here.`,
          map: last.map,
          swipes: [{ swipe: last.arrow, stop: last.stop ?? '?', ...(last.stopAt ? { at: last.stopAt } : {}) }],
        }
        if (last.pack.length) example.start = { pack: last.pack }
        lines.push('', `EXAMPLE ${JSON.stringify(example)}`)
      }
      const replay = { v: 1, build: info.build, world: startHash, ruleset: info.ruleset, at: g.tick, cmds }
      lines.push('', `REPLAY ${JSON.stringify(replay)}`)
      return lines.join('\n')
    },
  }
}
