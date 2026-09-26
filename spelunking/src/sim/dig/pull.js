// Pulling ore and loot out of the walls (D062): you, while you stand still, and placed bugs (D063).
// A pull takes the nearest seen ore or loot cell within reach (straight distance, x the short way round,
// through the wall), and the cell turns to rock, so no gap is left.
//
// You (`cfg.pull`): still = no step and no run, or a probe in progress. Every `ticks` of standing still,
// one unit comes to you from within your light radius: the nearest that fits in the pack (ties to the
// lowest cell index). Any move restarts the count. Event `pulled`.
//
// Placed bugs (`cfg.bugs.mine`, D063): each pulls the nearest seen ore (never loot) within `reach` of its
// den, one unit every `ticks`, until it carries `carry`; full, it waits. You within `hand` tiles take its
// ore, one unit every handTicks, without stopping; with your pack full, it waits. Events `pulled` (with
// the bug's id) and `handed`.
//
// The target of a pull under way is kept (`g.pulling` for you, `bug.target`), picked by the same code
// as the pull, so the dust stream the renderers draw always points at the cell that goes.

import { Tile } from '../gen/world.js'
import { lightRadius } from './light.js'
import { add, fits, valuable } from './pack.js'
import { dist2 } from './bugs.js'
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
  g.pulling = null
  if (!p || !g.cfg.light) return
  if (g.step || (g.run && !g.probe)) {
    g.stillFor = 0
    return
  }
  const slots = g.cfg.packSlots
  const c = nearestValuable(g, g.ch, lightRadius(g.pack, g.cfg.light), (t) => fits(g.pack, slots, [t]))
  g.pulling = c
  if (++g.stillFor % Math.max(1, p.ticks) || !c) return
  const tile = g.world.tiles[c.y * g.world.w + c.x]
  add(g.pack, slots, tile)
  toRock(g, c.x, c.y)
  g.pulling = null // it's gone; the next one is picked next tick
  g.litFor.r = -1 // the pack and the rock changed: the light is read anew
  g.events.push({ type: 'pulled', x: c.x, y: c.y, tile, to: { x: g.ch.x, y: g.ch.y }, by: 0 })
}

/** Placed bugs pull ore and hand it over (D063), each tick after your pull. @param {Game} g */
export function updateMine(g) {
  const m = g.cfg.bugs?.mine
  if (!m) return
  const slots = g.cfg.packSlots
  for (const bug of g.bugs) {
    if (bug.kind !== 'placed' || !bug.den) continue
    // hand-over first: a unit that leaves makes room for the next pull
    if (bug.carry > 0 && g.tick >= bug.handAt && dist2(g, bug, g.ch) <= m.hand * m.hand && fits(g.pack, slots, [Tile.Ore])) {
      add(g.pack, slots, Tile.Ore)
      bug.carry--
      bug.handAt = g.tick + m.handTicks
      g.litFor.r = -1 // the pack changed: so may the light
      g.events.push({ type: 'handed', id: bug.id, x: bug.x, y: bug.y, to: { x: g.ch.x, y: g.ch.y } })
    }
    bug.target = bug.carry < m.carry ? nearestValuable(g, bug.den, m.reach, (t) => t === Tile.Ore) : null
    if (!bug.target) {
      bug.pullFor = 0
      continue
    }
    if (++bug.pullFor < Math.max(1, m.ticks)) continue
    const c = bug.target
    bug.pullFor = 0
    bug.carry++
    bug.target = null
    toRock(g, c.x, c.y)
    g.events.push({ type: 'pulled', x: c.x, y: c.y, tile: Tile.Ore, to: { x: bug.x, y: bug.y }, by: bug.id })
  }
}
