// Examples: small ASCII maps, the swipes made on them, and where each run should stop and why.
// They're the dig tests (examples.test.js) and the Rule Lab's previews (v4), from one file:
// rules/examples.json. A run records the ruleset rows it used, so the editor can show which
// examples a row affects.

import { Tile } from '../gen/world.js'
import { command, createGame, tick } from './game.js'
import { packText, parsePack } from './pack.js'

/** @typedef {import('./ruleset.js').Table} Table */
/** @typedef {import('./rules.js').SimConfig} SimConfig */
/** @typedef {import('./rules.js').Cell} Cell */

export const EXAMPLES_FORMAT = 'spelunking-examples'

/** '@' is you, standing in open space. */
/** @type {Record<string, number>} */
export const LEGEND = {
  '.': Tile.Open,
  '#': Tile.Soft,
  H: Tile.Hard,
  o: Tile.Ore,
  $: Tile.Loot,
  '=': Tile.Built,
  '-': Tile.Plank,
  '@': Tile.Open,
}

/** @type {Record<string, [number, number]>} */
export const ARROWS = {
  '→': [1, 0],
  '←': [-1, 0],
  '↓': [0, 1],
  '↑': [0, -1],
  '↘': [1, 1],
  '↙': [-1, 1],
  '↗': [1, -1],
  '↖': [-1, -1],
}

/**
 * @typedef {{ swipe: string, hold?: number, stop: string, at?: [number, number] }} Swipe hold: held for that many steps,
 *   then released (stop `released`); without it, a flick (released at once, D046)
 * @typedef {object} Example
 * @property {string} id
 * @property {string} note
 * @property {string[]} map rows of equal width; x wraps, so give maps side walls
 * @property {Swipe[]} swipes made in order, each run to its stop
 * @property {string[]} [after] the map at the end
 * @property {string[]} [pack] the pack at the end, one entry per slot: 'soft 3', or '-' for an empty one
 * @property {Partial<Omit<SimConfig, 'rules'>>} [numbers] overrides the ruleset's
 * @property {Partial<SimConfig['rules']>} [stops] overrides the ruleset's
 * @property {{ pack?: string[] }} [start] what you carry at the start (like `pack`)
 */

/**
 * @typedef {object} SwipeResult
 * @property {string} stop
 * @property {[number, number]} at
 * @property {Cell[]} path cells stood on, from the start
 * @property {Cell[]} tried
 * @property {{ intent: string, row: number }[]} rules the rows it used, the stopping one last
 * @property {boolean} ok matches the expected stop and position
 *
 * @typedef {object} ExampleResult
 * @property {SwipeResult[]} swipes
 * @property {string[]} after
 * @property {string[]} pack
 * @property {string[]} problems empty when the example passes
 */

/** @param {string[]} rows */
export function parseMap(rows) {
  const w = rows[0].length
  const text = rows.join('')
  const tiles = Uint8Array.from(text, (c) => LEGEND[c] ?? Tile.Soft)
  const i = text.indexOf('@')
  return { world: { w, h: rows.length, tiles }, at: { x: i % w, y: Math.trunc(i / w) } }
}

/** @param {import('../gen/world.js').World} world @param {Cell} at */
export function mapRows(world, at) {
  /** @type {Record<number, string>} */
  const chars = {}
  for (const [c, t] of Object.entries(LEGEND)) if (c !== '@' && !(t in chars)) chars[t] = c
  chars[Tile.Sky] = '.'
  const rows = []
  for (let y = 0; y < world.h; y++) {
    let row = ''
    for (let x = 0; x < world.w; x++) row += x === at.x && y === at.y ? '@' : chars[world.tiles[y * world.w + x]]
    rows.push(row)
  }
  return rows
}

/**
 * Plays an example on a compiled ruleset and checks it.
 * @param {Example} ex
 * @param {Table} table
 * @param {SimConfig} cfg the ruleset's
 * @returns {ExampleResult}
 */
export function runExample(ex, table, cfg) {
  const { world, at } = parseMap(ex.map)
  const g = createGame(world, at, { ...cfg, ...JSON.parse(JSON.stringify(ex.numbers ?? {})), rules: { ...cfg.rules, ...ex.stops } }, table)
  g.pack = parsePack(ex.start?.pack ?? [])
  /** @type {string[]} */
  const problems = []
  const swipes = ex.swipes.map((s, n) => {
    const [dx, dy] = ARROWS[s.swipe] ?? [0, 0]
    /** @type {Cell[]} */
    const path = [{ x: g.ch.x, y: g.ch.y }]
    /** @type {SwipeResult['rules']} */
    const rules = []
    let stop = 'never stopped'
    /** @type {Cell[]} */
    let tried = []
    command(g, { type: 'intent', dx, dy, held: !!s.hold })
    if (!s.hold) command(g, { type: 'release' })
    let steps = 0
    // run to the stop, and through a fall that follows it (gravity)
    for (let i = 0; i < 2000 && (stop === 'never stopped' || g.step); i++) {
      tick(g)
      for (const e of g.events) {
        if (e.type === 'step') {
          path.push(e.action.to)
          if (e.action.rule) rules.push(e.action.rule)
          if (e.action.kind !== 'fall') steps++
        }
        if (e.type === 'stop') {
          stop = e.reason
          tried = e.tried
          if (e.rule) rules.push(e.rule)
        }
      }
      g.events.length = 0
      if (steps === s.hold && !g.step && g.run) {
        command(g, { type: 'release' }) // let go in the pause after the last step
        stop = 'released'
      }
    }
    /** @type {[number, number]} */
    const pos = [g.ch.x, g.ch.y]
    const ok = stop === s.stop && (!s.at || (s.at[0] === pos[0] && s.at[1] === pos[1]))
    if (!ok) problems.push(`swipe ${n + 1} ${s.swipe}: expected ${s.stop}${s.at ? ` at ${s.at}` : ''}, got ${stop} at ${pos}`)
    return { stop, at: pos, path, tried, rules, ok }
  })
  const after = mapRows(g.world, g.ch)
  if (ex.after && after.join('\n') !== ex.after.join('\n'))
    problems.push(`map after: expected\n${ex.after.join('\n')}\ngot\n${after.join('\n')}`)
  const pack = packText(g.pack)
  if (ex.pack && pack.join() !== ex.pack.join()) problems.push(`pack: expected [${ex.pack}], got [${pack}]`)
  return { swipes, after, pack, problems }
}
