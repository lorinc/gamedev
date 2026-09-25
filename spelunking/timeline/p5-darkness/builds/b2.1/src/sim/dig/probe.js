// The seismic probe (D053), as pure functions the game calls. ↓ on a floor sends rings out from
// you: ring r is the cells with (r − 1)² < dx² + dy² ≤ r² (dx the short way round the x wrap),
// rock interiors, ore, loot and caves alike, and each becomes seen for good. Its reach is measured
// from your light: a flick reaches radius + flick rings, a hold up to radius + hold.
// Cells are indices y * w + x. Integers only, like the rest of the sim (rng.js).

import { wrap } from './rules.js'

/** @typedef {import('../gen/world.js').World} World */
/** @typedef {import('./rules.js').Cell} Cell */
/** @typedef {{ flick: number, hold: number, ringTicks: number }} Probe rings past the light's radius (a flick's, a hold's most), ticks per ring */

/** The numbers when a config has none: 2 and 4 rings past the light, 5 ticks a ring (D053). */
export const PROBE = { flick: 2, hold: 4, ringTicks: 5 }

/** The rings a probe reaches from a light of `radius`: at least 1, and max never below min. @param {number} radius @param {Probe} p */
export function probeReach(radius, p) {
  const min = Math.max(1, radius + p.flick)
  return { min, max: Math.max(min, radius + p.hold) }
}

/**
 * Ring r around `at`: the cells with (r − 1)² < dx² + dy² ≤ r², inside the world's rows. Each cell
 * once, even when the ring is wider than the world. Ring 1 leaves out your own cell (it's lit).
 * @param {World} world @param {Cell} at @param {number} r ≥ 1
 * @returns {number[]}
 */
export function ringCells(world, at, r) {
  const { w, h } = world
  const inner = (r - 1) * (r - 1)
  const outer = r * r
  // the offsets that are the short way round: a wider ring meets itself round the back
  const half = Math.floor(w / 2)
  const lo = Math.max(-r, w % 2 ? -half : 1 - half)
  const hi = Math.min(r, half)
  /** @type {number[]} */
  const out = []
  for (let dy = -r; dy <= r; dy++) {
    const y = at.y + dy
    if (y < 0 || y >= h) continue
    for (let dx = lo; dx <= hi; dx++) {
      const d2 = dx * dx + dy * dy
      if (d2 > inner && d2 <= outer) out.push(y * w + wrap(at.x + dx, w))
    }
  }
  return out
}
