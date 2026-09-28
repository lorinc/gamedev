// b4.37's ash worms (the user: "ash areas should spawn 12s lifetime grey worms, that have a series of small
// lights on their sides and quickly burrow in a snake path towards unexplored areas and lift the fog
// permanently"). One in `chance` ash discs sends one out once its fire is out (flowers.js calls `spawnAshworm`).
// A worm is `length` px of grey; every `moveTicks` its head steps (8-way, through rock and air alike, not
// into the sheet, the sea or space; the rock stays as it is) towards the nearest unseen pixel within `sense`
// (sought again once that one is seen), swinging a step to either side in turn: a snake. Everything within
// `light` px of its head becomes seen for good. After `life` ticks it's gone. Randomness from the tick.

import { reveal } from '../../sim/dig/game.js'
import { wrap } from '../../sim/dig/rules.js'
import { OPEN, ROCK } from './world.js'

/** The ash worms' numbers (the dev panel's). */
export const ASHWORMS = {
  chance: 2, // 1 in this many ash discs sends a worm out
  life: 720, // 12 s (the user)
  moveTicks: 3, // 20 px/s
  length: 8,
  light: 3, // px round its head it lifts the fog
  sense: 64, // px it looks for the unexplored within
}
/** @typedef {typeof ASHWORMS} AshWorms */

/**
 * @typedef {object} AshWorm
 * @property {{ x: number, y: number }[]} body head first
 * @property {{ x: number, y: number } | null} target the unseen pixel it heads for
 * @property {number} born
 * @property {number} steps
 */

const STEPS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
]
// its swing, a step at a time: ahead, ahead, a turn to one side, ahead, ahead, the other side
const SWING = [0, 0, 1, 1, 0, 0, -1, -1]

/** A disc's fire is out: maybe a worm from its centre. @param {import('./game.js').Game} g @param {number} i the centre pixel @param {() => number} rng */
export function spawnAshworm(g, i, rng) {
  if (rng() % Math.max(1, g.cfg.ashworms.chance) !== 0) return
  const w = g.world.w
  const at = { x: i % w, y: Math.floor(i / w) }
  g.ashworms.push({ body: [at], target: null, born: g.tick, steps: 0 })
  g.events.push({ type: 'ashworm', x: at.x, y: at.y })
}

/** @param {import('./game.js').Game} g @param {number} x @param {number} y */
const ground = (g, x, y) => {
  if (y < 0 || y >= g.world.h) return false
  const k = g.map.kind[y * g.world.w + wrap(x, g.world.w)]
  return k === ROCK || k === OPEN
}

/** @param {import('./game.js').Game} g */
export function updateAshworms(g) {
  const c = g.cfg.ashworms
  const { w } = g.world
  g.ashworms = g.ashworms.filter((z) => {
    if (g.tick - z.born >= c.life) {
      g.events.push({ type: 'ashwormGone', x: z.body[0].x, y: z.body[0].y })
      return false
    }
    if ((g.tick - z.born) % Math.max(1, c.moveTicks) !== 0) return true
    const head = z.body[0]
    if (!z.target || g.seen[z.target.y * w + z.target.x]) z.target = unseenNear(g, head, c.sense)
    let dir = z.steps % 8 // nothing unseen near: it circles
    if (z.target) {
      let dx = z.target.x - head.x
      if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w
      dir = Math.round(Math.atan2(z.target.y - head.y, dx) / (Math.PI / 4)) & 7
    }
    z.steps++
    for (const turn of [SWING[z.steps % 8], 0, 1, -1, 2, -2, 3, -3, 4]) {
      const [sx, sy] = STEPS[(dir + turn + 8) & 7]
      if (!ground(g, head.x + sx, head.y + sy)) continue
      z.body.unshift({ x: wrap(head.x + sx, w), y: head.y + sy })
      if (z.body.length > Math.max(1, c.length)) z.body.pop()
      break
    }
    // it lifts the fog round its head, for good
    const h0 = z.body[0]
    const r = Math.max(0, c.light)
    /** @type {number[]} */
    const cells = []
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy <= r * r && ground(g, h0.x + dx, h0.y + dy)) cells.push((h0.y + dy) * w + wrap(h0.x + dx, w))
    reveal(/** @type {any} */ (g), cells)
    return true
  })
}

/** The nearest unseen pixel of rock or cave within r (rings out from `at`), or null. @param {import('./game.js').Game} g @param {{ x: number, y: number }} at @param {number} r */
function unseenNear(g, at, r) {
  const w = g.world.w
  for (let d = 1; d <= r; d++)
    for (let k = -d; k <= d; k++)
      for (const [x, y] of [
        [at.x + k, at.y - d],
        [at.x + k, at.y + d],
        [at.x - d, at.y + k],
        [at.x + d, at.y + k],
      ])
        if (ground(g, x, y) && !g.seen[y * w + wrap(x, w)]) return { x: wrap(x, w), y }
  return null
}
