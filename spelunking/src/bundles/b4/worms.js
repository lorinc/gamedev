// b4.12's worms (the user): where red fruit is dense, dark red striped worms 12 px long appear. Slower than
// bugs, they go from fruit to fruit and eat it; after `eat` fruit they burrow into the rock, never at the
// surface, curl up into an irregular 12 px shape wholly inside the wall, and become an ore deposit.
// Cheats, like the bugs (no pathfinding): every `checkTicks` a random fruit with `density` fruit within
// `radius` px spawns a worm there (at most `max` worms). A worm's head steps every `moveTicks` to the
// neighbouring open pixel nearest the nearest fruit within `sense` px (a random open one when none is nearer,
// or no fruit is in sense); the body follows the head. Full, it picks a site: the nearest soft or hard rock
// pixel within `site` px with no open pixel within 2, grown at random into `length` such pixels, none bordering open
// (8-way); then it goes straight there through the rock (not carving it), and at the site the pixels turn to
// ore (event `deposit`) and the worm is gone. No site found: it wanders and looks again every checkTicks.
// Randomness from the tick (rng.js).
// b4.60 (the user: "worms can tunnel towards fruits"): with a fruit in sense, the head steps to the neighbour
// nearest it through rock as well as air (not the sheet, sea or space; the rock stays as it is, as on the
// way to a site), so it reaches fruit in the next cave; with none in sense it wanders the open cave as before.

import { isOpen, Tile } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { FRUIT, fruitNear, pick } from './garden.js'
import { OPEN, ROCK } from './world.js'

/** The worms' numbers (the dev panel's). */
export const WORMS = {
  density: 6, // fruit within radius that spawn a worm
  radius: 12,
  checkTicks: 300, // 5 s
  max: 12,
  moveTicks: 20, // 3 px/s (bugs: 5)
  sense: 24, // px a worm smells fruit from
  eat: 8, // fruit, then it burrows (the user)
  length: 12, // px long, and the deposit's size (the user)
  site: 32, // px it looks for a deposit site within
}
/** @typedef {typeof WORMS} Worms */

/**
 * @typedef {object} Worm
 * @property {import('./world.js').Cell[]} body head first
 * @property {number} eaten
 * @property {number} movedAt
 * @property {number} lookedAt the tick it last looked for a site
 * @property {{ x: number, y: number, cells: number[] } | null} site where it curls up, once full
 */

const SALT = 0x3a1d
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

/** The squared distance, x the short way round. @param {number} w @param {{ x: number, y: number }} a @param {{ x: number, y: number }} b */
function d2(w, a, b) {
  let dx = Math.abs(a.x - b.x)
  dx = Math.min(dx, w - dx)
  return dx * dx + (a.y - b.y) ** 2
}

/** The worms' tick. @param {import('./game.js').Game} g */
export function updateWorms(g) {
  const c = g.cfg.worms
  const { w } = g.world
  const rng = mulberry32(hashSeed(SALT, g.tick))
  if (g.tick % Math.max(1, c.checkTicks) === 0 && g.worms.length < c.max && g.garden.fruit.size >= c.density) spawn(g, c, rng)
  g.worms = g.worms.filter((m) => {
    if (g.tick - m.movedAt < Math.max(1, c.moveTicks)) return true
    m.movedAt = g.tick
    const head = m.body[0]
    if (m.eaten < c.eat) {
      forage(g, c, m, rng)
      return true
    }
    if (!m.site) {
      if (g.tick - m.lookedAt >= c.checkTicks) {
        m.lookedAt = g.tick
        m.site = findSite(g, c, head, rng)
      }
      if (!m.site) {
        step(g, m, null, rng)
        return true
      }
    }
    const s = m.site
    if (head.x === s.x && head.y === s.y) {
      for (const i of s.cells) g.world.tiles[i] = Tile.Ore
      g.events.push({ type: 'deposit', cells: s.cells })
      return false
    }
    // straight for the site, through the rock (it doesn't carve it)
    let dx = s.x - head.x
    if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w
    move(g, m, { x: wrap(head.x + Math.sign(dx), w), y: head.y + Math.sign(s.y - head.y) })
    return true
  })
}

/** A random fruit with `density` fruit round it spawns a worm there. @param {import('./game.js').Game} g @param {Worms} c @param {() => number} rng */
function spawn(g, c, rng) {
  const fruit = [...g.garden.fruit]
  const { w } = g.world
  const i = fruit[rng() % fruit.length]
  const at = { x: i % w, y: Math.floor(i / w) }
  let n = 0
  for (const j of fruit) if (d2(w, at, { x: j % w, y: Math.floor(j / w) }) <= c.radius * c.radius) n++
  if (n < c.density) return
  const body = Array.from({ length: Math.max(1, c.length) }, () => ({ x: at.x, y: at.y }))
  g.worms.push({ body, eaten: 0, movedAt: g.tick, lookedAt: -1e9, site: null })
  g.events.push({ type: 'worm', x: at.x, y: at.y })
}

/** Toward the nearest fruit in sense; on it, eat it. @param {import('./game.js').Game} g @param {Worms} c @param {Worm} m @param {() => number} rng */
function forage(g, c, m, rng) {
  const head = m.body[0]
  const { w } = g.world
  if (g.garden.wall[head.y * w + head.x] === FRUIT) {
    pick(g, head.x, head.y)
    m.eaten++
    g.events.push({ type: 'eaten', x: head.x, y: head.y })
    return
  }
  const f = fruitNear(g, head, c.sense)
  step(g, m, f, rng)
}

/** One step through open pixels: the neighbour nearest `to`, if nearer than now, else a random open one. @param {import('./game.js').Game} g @param {Worm} m @param {{ x: number, y: number } | null} to @param {() => number} rng */
function step(g, m, to, rng) {
  const head = m.body[0]
  const { w, h, tiles } = g.world
  /** @type {{ x: number, y: number }[]} */
  const ok = []
  for (const [sx, sy] of STEPS) {
    const y = head.y + sy
    if (y < 0 || y >= h) continue
    const x = wrap(head.x + sx, w)
    if (isOpen(tiles[y * w + x])) ok.push({ x, y })
  }
  let best = null
  if (to) {
    // through the rock too (b4.60)
    let bd = d2(w, head, to)
    for (const [sx, sy] of STEPS) {
      const y = head.y + sy
      if (y < 0 || y >= h) continue
      const p = { x: wrap(head.x + sx, w), y }
      const k = g.map.kind[y * w + p.x]
      if ((k === ROCK || k === OPEN) && d2(w, p, to) < bd) ((bd = d2(w, p, to)), (best = p))
    }
  }
  if (!best && !ok.length) return
  move(g, m, best ?? ok[rng() % ok.length])
}

/** The head moves to p; the body follows. @param {import('./game.js').Game} g @param {Worm} m @param {{ x: number, y: number }} p */
function move(g, m, p) {
  m.body.unshift(p)
  m.body.pop()
  void g
}

/**
 * A deposit site: the nearest soft or hard rock pixel within `site` px with no open pixel within 2, grown
 * (randomly, 8-way) into `length` soft or hard pixels, none 8-bordering an open one. Null if none.
 * Lizards use it too, with their own `site` and `length` (1: a single crystal pixel).
 * @param {import('./game.js').Game} g @param {{ site: number, length: number }} c @param {{ x: number, y: number }} at @param {() => number} rng
 */
export function findSite(g, c, at, rng) {
  const { w, h, tiles } = g.world
  const kind = g.map.kind
  const rocky = (/** @type {number} */ i) => kind[i] === ROCK && (tiles[i] === Tile.Soft || tiles[i] === Tile.Hard)
  /** @param {number} x @param {number} y @param {number} r no open pixel within r (Chebyshev) */
  const buried = (x, y, r) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) return false
        const j = yy * w + wrap(x + dx, w)
        if (isOpen(tiles[j]) || kind[j] === OPEN) return false
      }
    return true
  }
  /** @type {{ i: number, d: number }[]} */
  const cands = []
  const R = c.site
  for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++) {
      const y = at.y + dy
      if (y < 0 || y >= h || dx * dx + dy * dy > R * R) continue
      const i = y * w + wrap(at.x + dx, w)
      if (rocky(i)) cands.push({ i, d: dx * dx + dy * dy })
    }
  cands.sort((p, q) => p.d - q.d || p.i - q.i)
  let tries = 0
  for (const { i } of cands) {
    const x = i % w
    const y = (i - x) / w
    if (!buried(x, y, 2)) continue
    if (++tries > 12) break
    // irregular: a random neighbour of a random pixel of the shape, until it's `length` long
    const cells = [i]
    const got = new Set(cells)
    for (let a = 0; a < 40 * c.length && cells.length < c.length; a++) {
      const from = cells[rng() % cells.length]
      const [sx, sy] = STEPS[rng() % 8]
      const cx = from % w
      const ny = (from - cx) / w + sy
      if (ny < 0 || ny >= h) continue
      const n = ny * w + wrap(cx + sx, w)
      if (got.has(n) || !rocky(n) || !buried(n % w, ny, 1)) continue
      got.add(n)
      cells.push(n)
    }
    if (cells.length >= c.length) return { x, y, cells }
  }
  return null
}
