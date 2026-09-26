// Pulling ore and loot out of the walls (D062): you, while you stand still, and placed bugs next (step 3).
// A pull takes the nearest seen ore or loot cell within reach (straight distance, x the short way round,
// through the wall), and the cell turns to rock, so no gap is left.
//
// You (`cfg.pull`): still = no step and no run, or a probe in progress. Every `ticks` of standing still,
// one unit comes to you from within your light radius: the nearest that fits in the pack (ties to the
// lowest cell index). Any move restarts the count. Event `pulled`.

import { Tile } from '../gen/world.js'
import { lightRadius } from './light.js'
import { add, fits, valuable } from './pack.js'
import { wrap } from './rules.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./rules.js').Cell} Cell */
/** @typedef {{ ticks: number }} Pull ticks of standing still per unit pulled */

/**
 * The nearest seen ore or loot cell within r of `at` that `ok` accepts (ties to the lowest cell index), or null.
 * @param {Game} g @param {Cell} at @param {number} r @param {(tile: number) => boolean} ok
 * @returns {Cell | null}
 */
export function nearestValuable(g, at, r, ok) {
  const { w, h, tiles } = g.world
  const seen = g.seen
  if (!seen) return null
  let best = -1
  let bestD = Infinity
  for (let dy = -r; dy <= r; dy++) {
    const y = at.y + dy
    if (y < 0 || y >= h) continue
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d > r * r || d > bestD) continue
      const i = y * w + wrap(at.x + dx, w)
      if (!seen[i] || !valuable(tiles[i]) || !ok(tiles[i])) continue
      if (d < bestD || i < best) {
        best = i
        bestD = d
      }
    }
  }
  return best < 0 ? null : { x: best % w, y: Math.trunc(best / w) }
}

/** Turns cell (x, y) into the most common rock among its 8 neighbours (soft on a tie or none); the new tile. @param {Game} g @param {number} x @param {number} y */
export function toRock(g, x, y) {
  const { w, h, tiles } = g.world
  let soft = 0
  let hard = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || y + dy < 0 || y + dy >= h) continue
      const t = tiles[(y + dy) * w + wrap(x + dx, w)]
      if (t === Tile.Soft) soft++
      else if (t === Tile.Hard) hard++
    }
  }
  const t = hard > soft ? Tile.Hard : Tile.Soft
  tiles[y * w + wrap(x, w)] = t
  return t
}

/** Your pull, each tick (D062). @param {Game} g */
export function updatePull(g) {
  const p = g.cfg.pull
  if (!p || !g.cfg.light) return
  if (g.step || (g.run && !g.probe)) {
    g.stillFor = 0
    return
  }
  if (++g.stillFor % Math.max(1, p.ticks)) return
  const slots = g.cfg.packSlots
  const c = nearestValuable(g, g.ch, lightRadius(g.pack, g.cfg.light), (t) => fits(g.pack, slots, [t]))
  if (!c) return
  const tile = g.world.tiles[c.y * g.world.w + c.x]
  add(g.pack, slots, tile)
  toRock(g, c.x, c.y)
  g.litFor.r = -1 // the pack and the rock changed: the light is read anew
  g.events.push({ type: 'pulled', x: c.x, y: c.y, tile, to: { x: g.ch.x, y: g.ch.y } })
}
