// b4.10's garden (the user): tamed bugs turn the cave's back wall (open pixels) dark green where they pass,
// a pixel and its 4 neighbours (`trail`); green is for good. On green, vines grow: 1 in `sprout` pixels
// turning green starts a vine there, and every `growTicks` each vine's tip grows a pixel into a green
// neighbour, keeping its heading if it can, else any; a tip with no green round it stops. Every
// `perFruit` px of vine makes a red fruit every `fruitTicks` (on average: an accumulator, then a random vine
// pixel with no fruit gets one). Fruit doesn't glow (b4.12); it's a resource: if it exists, it can be harvested (the user),
// seen or not, by you (your pull, within the light) and by bugs (within reach, up to swarm.fruitCarry each).
// Randomness from the tick (rng.js), like the bugs.

import { isOpen } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'

/** The garden's numbers (the dev panel's). */
export const GARDEN = {
  trail: 1, // px round a bug that turn green
  sprout: 40, // 1 in this many pixels turning green starts a vine
  growTicks: 300, // a vine's tip grows 1 px every 5 s
  perFruit: 12, // px of vine (the user)
  fruitTicks: 3600, // make a fruit every minute (the user)
}
/** @typedef {typeof GARDEN} Garden */

/** g.wall's states, per pixel */
export const GREEN = 1
export const VINE = 2
export const FRUIT = 3

const SALT = 0x6a4d
// the 8 neighbours, round the clock (a vine grows 8-way)
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

/**
 * @typedef {object} GardenState
 * @property {Uint8Array} wall per pixel: 0, GREEN, VINE or FRUIT
 * @property {{ i: number, dir: number }[]} tips growing vine tips
 * @property {number[]} vines every vine pixel (with or without fruit)
 * @property {Set<number>} fruit pixels holding a fruit
 * @property {number} acc the fruit accumulator: vine px × ticks
 * @property {number} sown pixels turned green so far (for `sprout`)
 * @property {number[]} changed pixels whose look changed since the view last drew them
 */

/** @param {number} n pixels @returns {GardenState} */
export function createGarden(n) {
  return { wall: new Uint8Array(n), tips: [], vines: [], fruit: new Set(), acc: 0, sown: 0, changed: [] }
}

/** @param {import('./game.js').Game} g @param {number} i */
const openAt = (g, i) => isOpen(g.world.tiles[i])

/** A bug at (x, y) greens the back wall round it. @param {import('./game.js').Game} g @param {number} x @param {number} y */
export function greenAround(g, x, y) {
  const { w, h } = g.world
  const G = g.garden
  const r = Math.max(0, g.cfg.garden.trail)
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const yy = y + dy
      if (Math.abs(dx) + Math.abs(dy) > r || yy < 0 || yy >= h) continue
      const i = yy * w + wrap(x + dx, w)
      if (G.wall[i] || !openAt(g, i)) continue
      G.wall[i] = GREEN
      G.changed.push(i)
      if (++G.sown % Math.max(1, g.cfg.garden.sprout) === 0) {
        G.wall[i] = VINE
        G.vines.push(i)
        G.tips.push({ i, dir: (x + y + G.sown) % 8 })
      }
    }
}

/** The garden's tick: vines grow, fruit appears. @param {import('./game.js').Game} g */
export function updateGarden(g) {
  const G = g.garden
  const c = g.cfg.garden
  const { w, h } = g.world
  const rng = mulberry32(hashSeed(SALT, g.tick))
  if (g.tick % Math.max(1, c.growTicks) === 0) {
    G.tips = G.tips.filter((t) => {
      const x = t.i % w
      const y = (t.i - x) / w
      const at = (/** @type {number} */ k) => {
        const yy = y + STEPS[k][1]
        return yy < 0 || yy >= h ? -1 : yy * w + wrap(x + STEPS[k][0], w)
      }
      let k = t.dir
      if (G.wall[at(k)] !== GREEN || rng() % 3 === 0) {
        const ok = [0, 1, 2, 3, 4, 5, 6, 7].filter((j) => at(j) >= 0 && G.wall[at(j)] === GREEN)
        if (!ok.length) return false // no green round it: the vine stops
        k = ok[rng() % ok.length]
      }
      const n = at(k)
      if (n < 0 || G.wall[n] !== GREEN) return false
      G.wall[n] = VINE
      G.vines.push(n)
      G.changed.push(n)
      t.i = n
      t.dir = k
      return true
    })
  }
  // every perFruit px of vine: a fruit per fruitTicks, on average
  G.acc += G.vines.length
  const per = Math.max(1, c.perFruit) * Math.max(1, c.fruitTicks)
  while (G.acc >= per) {
    G.acc -= per
    for (let tries = 0; tries < 8; tries++) {
      const i = G.vines[rng() % G.vines.length]
      if (G.wall[i] !== VINE) continue
      G.wall[i] = FRUIT
      G.fruit.add(i)
      G.changed.push(i)
      break
    }
  }
}

/** The nearest fruit within r of `at` (ties: the lowest index), or null. @param {import('./game.js').Game} g @param {{ x: number, y: number }} at @param {number} r */
export function fruitNear(g, at, r) {
  const { w, h } = g.world
  let best = -1
  let bestD = Infinity
  for (let dy = -r; dy <= r; dy++) {
    const y = at.y + dy
    if (y < 0 || y >= h) continue
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d > r * r || d > bestD) continue
      const i = y * w + wrap(at.x + dx, w)
      if (g.garden.wall[i] !== FRUIT || (d === bestD && i > best)) continue
      best = i
      bestD = d
    }
  }
  return best < 0 ? null : { x: best % w, y: Math.floor(best / w), d: bestD }
}

/** A fruit is picked: its vine stays. @param {import('./game.js').Game} g @param {number} x @param {number} y */
export function pick(g, x, y) {
  const i = y * g.world.w + x
  g.garden.wall[i] = VINE
  g.garden.fruit.delete(i)
  g.garden.changed.push(i)
}
