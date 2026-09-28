// b4.77's slime (the user: "Slime grows on EVERY surface that is not occupied and has a node nearby - built or not -
// that has gas. It grows aggressively, does not consume gas. On the other hand - it releases gas, when a tamed bug
// is nearby. Lichen can grow over it, replacing it. Fire does not kill it. It looks like a particle-thin layer of
// green gooey"; asked: it grows on the rock surface, not the back wall, so it never competes with moss; lichen,
// which also sits on the rock surface, replaces it wherever it grows; a release uses the slime up).
// The rock surface is lichen.js's: open pixels with rock among their 8 neighbours. A pixel is free for slime
// with no lichen on it; it's fed while its station (gas.js: the node nearest it through open pixels, built or
// not) holds gas. Every `growTicks` each slime pixel spreads to one random free, fed surface neighbour (8-way),
// and every fed station with no slime yet seeds one on a random surface pixel of its own, 1 in `seed` a step.
// It takes no gas. Every `releaseTicks` each tamed bug (moths too) turns the nearest slime pixel within `reach`
// px into 1 gas at that pixel's station (event `evaporated`, the pools' wisp). Fire (garden.js) never touches it:
// it isn't cover. Randomness from the tick (rng.js).

import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { stationOf, stations } from './gas.js'
import { surface } from './lichen.js'

/** The slime's numbers (the dev panel's). */
export const SLIME = {
  growTicks: 30, // a spread step every 0.5 s ("aggressively")
  seed: 4, // a fed station with no slime starts a patch 1 in this many steps
  releaseTicks: 60, // a tamed bug takes a slime pixel's gas every 1 s
  reach: 4, // px from the bug (its mining reach)
}

/** @typedef {{ on: Uint8Array, count: number[], changed: number[] }} SlimeState per pixel 1 = slime; per station its slime pixels */

/** @param {number} n pixels @param {number} nodes @returns {SlimeState} */
export const createSlime = (n, nodes) => ({ on: new Uint8Array(n), count: new Array(nodes).fill(0), changed: [] })

const SALT = 0x511e
const AROUND = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
]

/** @type {WeakMap<object, number[][]>} each station's surface pixels, per map */
const bySt = new WeakMap()

/** @param {import('./game.js').Game} g */
function surfaceOf(g) {
  let s = bySt.get(g.map)
  if (s) return s
  const { w, h } = g.world
  const { own } = stations(g)
  s = g.map.nodes.map(() => /** @type {number[]} */ ([]))
  for (let y = 1; y < h - 1; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (own[i] >= 0 && surface(g, x, y)) s[own[i]].push(i)
    }
  bySt.set(g.map, s)
  return s
}

/** Free for slime and fed: rock surface, no slime or lichen, its station holding gas. @param {import('./game.js').Game} g @param {number} x @param {number} y */
function fertile(g, x, y) {
  const i = y * g.world.w + wrap(x, g.world.w)
  return !g.slime.on[i] && !g.lichen.on[i] && surface(g, x, y) && g.gas[stationOf(g, i)] > 0
}

/** @param {import('./game.js').Game} g @param {number} i @param {number} v */
function set(g, i, v) {
  const S = g.slime
  if (S.on[i] === v) return
  S.on[i] = v
  S.count[stationOf(g, i)] += v ? 1 : -1
  S.changed.push(i)
}

/** Lichen takes a pixel: the slime there goes. @param {import('./game.js').Game} g @param {number} i */
export const unslime = (g, i) => set(g, i, 0)

/** The slime's tick. @param {import('./game.js').Game} g */
export function updateSlime(g) {
  const c = g.cfg.slime
  if (g.tick % Math.max(1, c.releaseTicks) === 0) release(g, c)
  if (g.tick % Math.max(1, c.growTicks) !== 0) return
  const { w } = g.world
  const S = g.slime
  const rng = mulberry32(hashSeed(SALT, g.tick))
  // spread: every slime pixel as it was at the start of the step
  /** @type {number[]} */
  const born = []
  for (let i = 0; i < S.on.length; i++) {
    if (!S.on[i]) continue
    const x = i % w
    const y = (i - x) / w
    const k0 = rng() % 8
    for (let n = 0; n < 8; n++) {
      const [sx, sy] = AROUND[(k0 + n) % 8]
      if (!fertile(g, x + sx, y + sy)) continue
      born.push((y + sy) * w + wrap(x + sx, w))
      break
    }
  }
  for (const i of born) set(g, i, 1)
  // seed: fed stations with no slime
  const surf = surfaceOf(g)
  g.gas.forEach((gas, k) => {
    if (!(gas > 0) || S.count[k] > 0 || !surf[k].length || rng() % Math.max(1, c.seed) !== 0) return
    const i = surf[k][rng() % surf[k].length]
    if (!S.on[i] && !g.lichen.on[i]) set(g, i, 1)
  })
}

/** Each tamed bug takes the nearest slime pixel within reach: 1 gas at its station. @param {import('./game.js').Game} g @param {typeof SLIME} c */
function release(g, c) {
  const { w, h } = g.world
  const r = Math.max(0, c.reach)
  for (const b of g.swarm) {
    let best = -1
    let bd = Infinity
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const y = b.y + dy
        const d = dx * dx + dy * dy
        if (y < 0 || y >= h || d > r * r || d >= bd) continue
        const i = y * w + wrap(b.x + dx, w)
        if (g.slime.on[i]) ((best = i), (bd = d))
      }
    if (best < 0) continue
    const node = stationOf(g, best)
    set(g, best, 0)
    g.gas[node]++
    g.events.push({ type: 'evaporated', x: best % w, y: Math.floor(best / w), node })
  }
}
