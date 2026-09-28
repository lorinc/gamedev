// b4.10's garden (the user): tamed bugs turn the cave's back wall (open pixels) dark green where they pass,
// a pixel and its 4 neighbours (`trail`); green is for good. On green, vines grow: 1 in `sprout` pixels
// turning green starts a vine there, and every `growTicks` each vine's tip grows a pixel into a green
// neighbour, keeping its heading if it can, else any; a tip with no green round it stops. Every
// `perFruit` px of vine makes a red fruit every `fruitTicks` (on average: an accumulator, then a random vine
// pixel with no fruit gets one). Fruit doesn't glow (b4.12); it's a resource: if it exists, it can be harvested (the user),
// seen or not, by you (your pull, within the light) and by bugs (within reach, up to swarm.fruitCarry each).
// Randomness from the tick (rng.js), like the bugs.
// b4.21's fire (the user): a lichen's ember (lichen.js) sets the cover (green, vine, fruit) burning; every
// `burnTicks` each burning pixel sets the cover in its 8 neighbours burning and goes out, so the fire runs
// through the whole connected cover like a cellular automaton and leaves bare back wall. Where a pixel catches
// with no ash centre within 8–12 px (`ashGap`–`ashGapMax`), it becomes one: a disc of r 3–5 (`ash`–`ashMax`)
// whose bare pixels turn to ash at once and whose cover flares up and turns to ash as it goes out. Ash is
// permanent: bugs don't green it, vines don't grow into it (the user: a function for it comes later).
// b4.25 (the user: "flames can be brighter"): a pixel burns for `burnFor` steps before it goes out, so the
// front is a band, not a line; it spreads once, the step after it caught. Each disc is kept in `discs` for
// its flowers (flowers.js).
// b4.33 (the user: "make vines that touch ash hyper-productive… now there's not enough ore"; fruit, asked):
// a vine pixel with ash among its 8 neighbours makes fruit `hyper` (10) times as fast: it counts that many
// times in the accumulator, and the next fruit lands on such a pixel with that weight. The list is rebuilt
// every `HYPER_TICKS`.

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
  burnTicks: 6, // the fire spreads 1 px every 0.1 s
  burnFor: 4, // steps a pixel burns (b4.25): 0.4 s
  ash: 3, // an ash disc's radius, px: ash–ashMax (the user: 3–5)
  ashMax: 5,
  ashGap: 8, // px between ash centres: ashGap–ashGapMax (the user: 8–12)
  ashGapMax: 12,
  hyper: 10, // a vine pixel touching ash makes fruit this many times as fast (the user, b4.33)
}
/** @typedef {typeof GARDEN} Garden */

/** g.wall's states, per pixel */
export const GREEN = 1
export const VINE = 2
export const FRUIT = 3
export const BURN = 4
export const ASH = 5
/** @param {number} v a g.wall state @returns {boolean} cover the fire eats */
export const cover = (v) => v === GREEN || v === VINE || v === FRUIT
const BLOCK = 16 // the ash centres' lookup grid, px
const HYPER_TICKS = 60

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
 * @property {number[]} burning pixels on fire (b4.21)
 * @property {Set<number>} toAsh burning pixels inside an ash disc: ash when they go out
 * @property {Map<number, number[]>} centres ash centres (pixel indices) by BLOCK × BLOCK block
 * @property {Map<number, number>} caught burning pixel → the fire step it caught at (b4.25)
 * @property {number} step the fire's steps so far
 * @property {{ i: number, r: number }[]} discs ash discs whose flowers aren't placed yet (flowers.js)
 * @property {number[]} hyper vine pixels touching ash (b4.33)
 */

/** @param {number} n pixels @returns {GardenState} */
export function createGarden(n) {
  return {
    wall: new Uint8Array(n),
    tips: [],
    vines: [],
    fruit: new Set(),
    acc: 0,
    sown: 0,
    changed: [],
    burning: [],
    toAsh: new Set(),
    centres: new Map(),
    caught: new Map(),
    step: 0,
    discs: [],
    hyper: [],
  }
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
  if (G.burning.length && g.tick % Math.max(1, c.burnTicks) === 0) burn(g, rng)
  // vines touching ash (b4.33)
  if (g.tick % HYPER_TICKS === 0)
    G.hyper = G.vines.filter((i) => {
      const x = i % w
      const y = (i - x) / w
      return STEPS.some(([sx, sy]) => y + sy >= 0 && y + sy < h && G.wall[(y + sy) * w + wrap(x + sx, w)] === ASH)
    })
  // every perFruit px of vine: a fruit per fruitTicks, on average; a hyper pixel counts `hyper` times
  const boost = Math.max(1, c.hyper) - 1
  G.acc += G.vines.length + boost * G.hyper.length
  const per = Math.max(1, c.perFruit) * Math.max(1, c.fruitTicks)
  while (G.acc >= per) {
    G.acc -= per
    const onHyper = G.hyper.length && rng() % (G.vines.length + boost * G.hyper.length) < (boost + 1) * G.hyper.length
    const from = onHyper ? G.hyper : G.vines
    for (let tries = 0; tries < 8; tries++) {
      const i = from[rng() % from.length]
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

/** Sets pixel i burning (b4.21): the lichen's ember, or the fire spreading. @param {import('./game.js').Game} g @param {number} i @param {() => number} rng */
export function ignite(g, i, rng) {
  const G = g.garden
  if (G.wall[i] === FRUIT) G.fruit.delete(i)
  G.wall[i] = BURN
  G.burning.push(i)
  G.caught.set(i, G.step)
  G.changed.push(i)
  ashDisc(g, i, rng)
}

/** A new ash centre at i if none is within ashGap–ashGapMax: its disc. @param {import('./game.js').Game} g @param {number} i @param {() => number} rng */
function ashDisc(g, i, rng) {
  const G = g.garden
  const c = g.cfg.garden
  const { w, h, tiles } = g.world
  const x = i % w
  const y = (i - x) / w
  const gap = c.ashGap + (rng() % Math.max(1, c.ashGapMax - c.ashGap + 1))
  const bw = Math.ceil(w / BLOCK)
  const bx = Math.floor(x / BLOCK)
  const by = Math.floor(y / BLOCK)
  const reach = Math.ceil(gap / BLOCK)
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++)
      for (const j of G.centres.get((by + dy) * bw + ((((bx + dx) % bw) + bw) % bw)) ?? []) {
        const cx = j % w
        const ddx = Math.min(Math.abs(cx - x), w - Math.abs(cx - x))
        const ddy = (j - cx) / w - y
        if (ddx * ddx + ddy * ddy < gap * gap) return
      }
  const key = by * bw + bx
  G.centres.set(key, [...(G.centres.get(key) ?? []), i])
  const r = c.ash + (rng() % Math.max(1, c.ashMax - c.ash + 1))
  G.discs.push({ i, r })
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const yy = y + dy
      if (dx * dx + dy * dy > r * r || yy < 0 || yy >= h) continue
      const j = yy * w + wrap(x + dx, w)
      if (!isOpen(tiles[j]) || G.wall[j] === ASH) continue
      if (G.wall[j] === BURN) G.toAsh.add(j)
      else if (cover(G.wall[j])) {
        G.toAsh.add(j)
        if (G.wall[j] === FRUIT) G.fruit.delete(j)
        G.wall[j] = BURN // the disc flares up
        G.burning.push(j)
        G.caught.set(j, G.step)
        G.changed.push(j)
      } else {
        G.wall[j] = ASH
        G.changed.push(j)
      }
    }
}

/** The fire's step: the cover round the pixels caught last step catches; pixels burning `burnFor` steps go out. @param {import('./game.js').Game} g @param {() => number} rng */
function burn(g, rng) {
  const G = g.garden
  const { w, h } = g.world
  const was = G.burning
  G.burning = []
  G.step++
  for (const i of was) {
    if (G.caught.get(i) !== G.step - 1) continue
    const x = i % w
    const y = (i - x) / w
    for (const [sx, sy] of STEPS) {
      const yy = y + sy
      if (yy < 0 || yy >= h) continue
      const j = yy * w + wrap(x + sx, w)
      if (cover(G.wall[j])) ignite(g, j, rng)
    }
  }
  for (const i of was) {
    if (G.step - /** @type {number} */ (G.caught.get(i)) < Math.max(1, g.cfg.garden.burnFor)) {
      G.burning.push(i)
      continue
    }
    G.caught.delete(i)
    G.wall[i] = G.toAsh.delete(i) ? ASH : 0
    G.changed.push(i)
  }
  G.vines = G.vines.filter((i) => G.wall[i] === VINE || G.wall[i] === FRUIT)
  G.tips = G.tips.filter((t) => G.wall[t.i] === VINE)
}
