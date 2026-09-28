// b4.25's flowers and flower bots (the user): the ash spawns large white flowers, one in 1 of `per` discs
// (b4.28, the user: "1/4 white flower per ash, this is waaaay too much", then b4.29: "halve even that", so 1
// in 8; b4.25's was 1 per 24 px of ash), on
// its ash once the fire in the disc is out; at least 5 px apart (a flower is 5 px across). After
// `bloomTicks` (2 minutes) a flower becomes a bot, like yours but without light, and the ash touching it
// (8-connected to its pixel) turns back to bare back wall. The bot zips straight to the nearest node on a built
// root (the pod's before anything is built), through rock (a cheat, like the lizards'), a px every
// `flyTicks`; then it lives on the network: at a node it rests 0.5–1.5 s, then zips along a random built root
// from it, a px every `zipTicks`. At a node with an unbuilt edge, when the ledger holds the price and its last
// extension was `buildGap` ago (60 s), it builds a random one of them from your ledger, 1 in `chance` stops
// ("randomly extends the network"). b4.33 (the user: "grow edges into new nodes in the network edge, not
// just increasing edge density in the centre"): it builds only edges to nodes not on the network yet, heads
// along built roots for the nearest node that has one (in hops), and waits there for the ore. After `builds` (3) it pops (event `poof`). Randomness from the tick.

import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { ASH, BURN } from './garden.js'
import { dist2, extend } from './game.js'

/** The flowers' numbers (the dev panel's). */
export const FLOWERS = {
  per: 8, // 1 in this many ash discs grows a flower (the user, b4.29; was 4)
  bloomTicks: 7200, // 2 minutes (the user)
  flyTicks: 2, // 30 px/s to the network
  zipTicks: 1, // 60 px/s along a root
  buildGap: 3600, // at least 60 s between its extensions (the user)
  chance: 2, // 1 in this many stops it may build at, it does
  builds: 3, // then it pops (the user)
}
/** @typedef {typeof FLOWERS} Flowers */

/**
 * @typedef {object} Flower
 * @property {number} x
 * @property {number} y
 * @property {number} at the tick it appeared
 */
/**
 * @typedef {object} FlowerBot
 * @property {number} x
 * @property {number} y
 * @property {number} node the node it's heading for or at
 * @property {boolean} onNet it has reached the network
 * @property {{ edge: number, i: number, dir: 1 | -1 } | null} run along a built root
 * @property {number} movedAt
 * @property {number} restUntil
 * @property {number} builtAt its last extension's tick
 * @property {number} builds
 */

const SALT = 0x5f10
const CHECK = 30 // ticks between the checks for finished discs

/** @param {import('./game.js').Game} g */
export function updateFlowers(g) {
  const c = g.cfg.flowers
  const G = g.garden
  const { w, h } = g.world
  const rng = mulberry32(hashSeed(SALT, g.tick))
  // discs whose fire is out: their flowers
  if (g.tick % CHECK === 0 && G.discs.length) {
    G.discs = G.discs.filter((d) => {
      const px = disc(g, d)
      if (px.some((i) => G.wall[i] === BURN)) return true
      const ash = px.filter((i) => G.wall[i] === ASH)
      const n = rng() % Math.max(1, c.per) === 0 ? 1 : 0
      /** @type {number[]} */
      const put = []
      for (let tries = 0; tries < 20 * n && put.length < n && ash.length; tries++) {
        const i = ash[rng() % ash.length]
        const at = xy(i, w)
        // 5 px apart, also from the neighbouring discs' flowers: a flower is 5 px across
        if (put.some((j) => dist2(g, at, xy(j, w)) < 25) || g.flowers.some((f) => dist2(g, at, f) < 25)) continue
        put.push(i)
      }
      for (const i of put) {
        g.flowers.push({ ...xy(i, w), at: g.tick })
        g.events.push({ type: 'flower', ...xy(i, w) })
      }
      return false
    })
  }
  // flowers bloom into bots; the ash touching them goes
  g.flowers = g.flowers.filter((f) => {
    if (g.tick - f.at < c.bloomTicks) return true
    const start = f.y * w + f.x
    if (G.wall[start] === ASH) {
      const got = new Set([start])
      for (const i of got) {
        const x = i % w
        const y = (i - x) / w
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const j = (y + dy) * w + wrap(x + dx, w)
            if (y + dy >= 0 && y + dy < h && G.wall[j] === ASH) got.add(j)
          }
      }
      for (const i of got) {
        G.wall[i] = 0
        G.changed.push(i)
      }
    }
    const node = nearestNode(g, f)
    if (node >= 0) {
      g.fbots.push({ x: f.x, y: f.y, node, onNet: false, run: null, movedAt: g.tick, restUntil: 0, builtAt: -1e9, builds: 0 })
      g.events.push({ type: 'bloom', x: f.x, y: f.y })
    }
    return false
  })
  g.fbots = g.fbots.filter((b) => {
    if (!b.onNet) {
      if (g.tick - b.movedAt < c.flyTicks) return true
      b.movedAt = g.tick
      const n = g.map.nodes[b.node]
      let dx = n.x - b.x
      if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w
      b.x = wrap(b.x + Math.sign(dx), w)
      b.y += Math.sign(n.y - b.y)
      if (b.x === n.x && b.y === n.y) ((b.onNet = true), (b.restUntil = g.tick + 30 + (rng() % 60)))
      return true
    }
    if (b.run) {
      if (g.tick - b.movedAt < c.zipTicks) return true
      b.movedAt = g.tick
      const e = g.map.edges[b.run.edge]
      b.run.i += b.run.dir
      b.x = e.path[b.run.i].x
      b.y = e.path[b.run.i].y
      if (b.run.i === (b.run.dir === 1 ? e.path.length - 1 : 0)) {
        b.node = b.run.dir === 1 ? e.b : e.a
        b.run = null
        b.restUntil = g.tick + 30 + (rng() % 60)
      }
      return true
    }
    if (g.tick < b.restUntil) return true
    // at a node: at the network's rim, maybe grow it outwards; else zip along a built root towards the rim
    const links = g.links[b.node]
    const out = frontier(g, b.node)
    if (out.length) {
      if (g.ledger.ore >= g.cfg.price && g.tick - b.builtAt >= c.buildGap && rng() % Math.max(1, c.chance) === 0) {
        extend(g, out[rng() % out.length], b.node)
        b.builtAt = g.tick
        if (++b.builds >= c.builds) {
          g.events.push({ type: 'poof', x: b.x, y: b.y })
          return false
        }
      } else {
        b.restUntil = g.tick + 60 // at the rim: it waits here for the ore, or its 60 s
        return true
      }
    }
    const built = links.filter((k) => g.built[k])
    if (!built.length) {
      b.restUntil = g.tick + 60 // nowhere to go yet
      return true
    }
    const toward = towardRim(g, b.node, rng)
    const edge = toward >= 0 ? toward : built[rng() % built.length]
    const e = g.map.edges[edge]
    b.run = e.a === b.node ? { edge, i: 0, dir: 1 } : { edge, i: e.path.length - 1, dir: -1 }
    return true
  })
}

/** Node n's unbuilt edges to nodes not on the network yet: the rim, where it grows (b4.33). @param {import('./game.js').Game} g @param {number} n */
function frontier(g, n) {
  return g.links[n].filter((k) => {
    const e = g.map.edges[k]
    return !g.built[k] && !g.railed[e.a === n ? e.b : e.a]
  })
}

/** The first built edge on a shortest (in hops) way from n to the nearest rim node, ties at random; -1: none.
 * @param {import('./game.js').Game} g @param {number} n @param {() => number} rng */
function towardRim(g, n, rng) {
  /** @type {Map<number, number>} node → the first edge taken from n to reach it */
  const first = new Map([[n, -1]])
  let front = [n]
  while (front.length) {
    /** @type {number[]} */
    const next = []
    /** @type {number[]} */
    const found = []
    for (const v of front)
      for (const k of g.links[v]) {
        if (!g.built[k]) continue
        const e = g.map.edges[k]
        const u = e.a === v ? e.b : e.a
        if (first.has(u)) continue
        first.set(u, v === n ? k : /** @type {number} */ (first.get(v)))
        next.push(u)
        if (frontier(g, u).length) found.push(u)
      }
    if (found.length) return /** @type {number} */ (first.get(found[rng() % found.length]))
    front = next
  }
  return -1
}

/** @param {number} i @param {number} w */
const xy = (i, w) => ({ x: i % w, y: Math.floor(i / w) })

/** A disc's open pixels. @param {import('./game.js').Game} g @param {{ i: number, r: number }} d */
function disc(g, d) {
  const { w, h } = g.world
  const x = d.i % w
  const y = (d.i - x) / w
  /** @type {number[]} */
  const out = []
  for (let dy = -d.r; dy <= d.r; dy++)
    for (let dx = -d.r; dx <= d.r; dx++)
      if (dx * dx + dy * dy <= d.r * d.r && y + dy >= 0 && y + dy < h) out.push((y + dy) * w + wrap(x + dx, w))
  return out
}

/** The nearest node on a built root (before any is built: on the network, the pod's), or -1. @param {import('./game.js').Game} g @param {{ x: number, y: number }} at */
function nearestNode(g, at) {
  let best = -1
  let bd = Infinity
  g.map.nodes.forEach((n, i) => {
    if (!(g.firstBuilt ? g.railed[i] : g.net[i])) return
    const d = dist2(g, n, at)
    if (d < bd) ((bd = d), (best = i))
  })
  return best
}
