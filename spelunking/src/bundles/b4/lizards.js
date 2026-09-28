// b4.14's lizards (the user): where ore is plentiful, bright green lizards appear; they zip, stop and zip
// round the cave surfaces, mine the ore, and after 16 they burrow and make one crystal in the wall.
// Cheats, like the worms (no pathfinding): every `checkTicks` a random pixel within `near` px of the bot with
// `density` reachable ore within `radius` px (ore within `reach` of a surface pixel: what a lizard can mine;
// b4.20, the user: they got stuck short of 16) spawns a lizard on the nearest surface pixel there (open,
// 8-bordering a solid one), at most `max`. A lizard runs only on surface pixels: a zip of 4–12 px, a px every
// `zipTicks`, along its route (else on its heading, else anywhere): as a zip starts, a flood over the surface
// up to `sense` × 2 steps finds the nearest surface pixel (in steps) with ore within `reach`, and the route
// there (b4.20, the user: they got stuck; heading straight for ore snagged on the cave's shape), then a stop of 0.7–2 s,
// taking an ore within `reach` px every `mineTicks` while it stops (the pixel turns to rock). Full, it
// takes the worms' site finder with a 1 px site: a soft or hard rock pixel with no open one within 2; it
// goes straight there through the rock, and that pixel turns to a crystal (event `deposit`). Randomness from the
// tick (rng.js).
// b4.22 (the user: "lizards must not spawn in small enclosures"): the spawn pixel's cave must hold at least
// `room` open pixels (an 8-way flood that stops once it has counted them).
// b4.54 (the user: "change lizard mechanics. it should spawn in areas with ash, have a 6 mining radius, eat up
// ash tiles, and when burrows, creates 5 crystal resources"): everything above that said ore now means ash (the
// burned back wall, garden.js): `density` ash pixels within `radius` spawn one, it goes for and licks ash
// within `reach` 6, a licked ash pixel is bare back wall again (bugs can green it); full, it burrows into a
// 5 px site (`crystalPx`) that turns to crystals.
// b4.55 (the user: "lizards can leave the walls for a short dash to reach ash in the cavern centre, but goes
// back to the safety of the wall at the next movement"): no wall pixel in its route range reaching ash, it
// dashes straight through the air towards the nearest ash within `dash` px, stops within reach and licks;
// its next move is straight back to the nearest wall pixel. Off the wall = its head not on a surface pixel.

import { isOpen } from '../../sim/gen/world.js'
import { CRYSTAL } from './world.js'
import { wrap } from '../../sim/dig/rules.js'
import { hashSeed, mulberry32 } from '../../sim/rng.js'
import { ASH } from './garden.js'
import { gain } from './game.js'
import { findSite } from './worms.js'

/** The lizards' numbers (the dev panel's). */
export const LIZARDS = {
  density: 24, // ash px within radius that spawn a lizard (b4.54; reachable ore since b4.20)
  radius: 16, // the lizard's sense
  near: 64, // px from the bot a spawn is tried
  checkTicks: 300,
  max: 6,
  zipTicks: 3, // 20 px/s while zipping
  sense: 16,
  reach: 6, // px it licks ash within (the user, b4.54; 3 for ore); × 1.2 a lizard level (crystals, b4.56)
  mineTicks: 90, // a lick every 1.5 s (the user, b4.57: 3× slower; was 30)
  eat: 27, // ash px, then it burrows (b4.57: 16 × 5/3, so 3× slower eating makes a 5× longer life, ~40 s; ore until b4.54)
  crystalPx: 5, // crystal px it burrows into (the user, b4.54; was 1)
  dash: 16, // px off the wall it dashes for ash (b4.55)
  site: 24,
  room: 400, // open px the cave must hold for a spawn (b4.22)
}
/** @typedef {typeof LIZARDS} Lizards */

/**
 * @typedef {object} Lizard
 * @property {{ x: number, y: number }[]} body head first, 3 px
 * @property {number} dir its heading, an index into STEPS
 * @property {number} zip px left in this zip
 * @property {number} movedAt
 * @property {number} restUntil
 * @property {number} mineAt
 * @property {number} eaten
 * @property {{ x: number, y: number, cells: number[] } | null} site
 * @property {number} lookedAt the tick it last looked for a site
 * @property {{ x: number, y: number }[]} route the surface pixels to its goal, next first (b4.20)
 */

const SALT = 0x11a2
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

/** The px a lizard licks within: `reach`, 20% more a lizard level, bought with crystals (b4.56, the user). @param {import('./game.js').Game} g */
const reachOf = (g) => Math.round(g.cfg.lizards.reach * gain(g, g.lizardLevel))

/** Open, and 8-bordering a solid pixel: a cave surface. @param {import('./game.js').Game} g @param {number} x @param {number} y */
function surface(g, x, y) {
  const { w, h, tiles } = g.world
  if (y < 1 || y >= h - 1 || !isOpen(tiles[y * w + wrap(x, w)])) return false
  for (const [sx, sy] of STEPS) if (!isOpen(tiles[(y + sy) * w + wrap(x + sx, w)])) return true
  return false
}

/** The nearest ash pixel within r of `at`, or null (b4.54; ore before). @param {import('./game.js').Game} g @param {{ x: number, y: number }} at @param {number} r */
function ashNear(g, at, r) {
  const { w, h } = g.world
  const wall = g.garden.wall
  let best = null
  let bd = Infinity
  for (let dy = -r; dy <= r; dy++) {
    const y = at.y + dy
    if (y < 0 || y >= h) continue
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d > r * r || d >= bd) continue
      const x = wrap(at.x + dx, w)
      if (wall[y * w + x] !== ASH) continue
      best = { x, y }
      bd = d
    }
  }
  return best
}

/**
 * A lizard's route: a flood over surface pixels (8-way) from `at`, up to sense × 2 steps, to the nearest one
 * (in steps) with an ore within `reach`; its pixels, next first; empty if none, or if it's there.
 * @param {import('./game.js').Game} g @param {Lizards} c @param {{ x: number, y: number }} at
 */
function routeFor(g, c, at) {
  const { w } = g.world
  const reach = reachOf(g)
  const start = at.y * w + at.x
  /** @type {Map<number, number>} */
  const from = new Map([[start, -1]])
  let front = [start]
  for (let d = 0; d <= c.sense * 2 && front.length; d++) {
    /** @type {number[]} */
    const next = []
    for (const i of front) {
      const x = i % w
      const y = (i - x) / w
      if (ashNear(g, { x, y }, reach)) {
        /** @type {{ x: number, y: number }[]} */
        const route = []
        for (let j = i; j !== start; j = /** @type {number} */ (from.get(j))) route.unshift({ x: j % w, y: Math.floor(j / w) })
        return route
      }
      for (const [sx, sy] of STEPS) {
        const nx = wrap(x + sx, w)
        const n = (y + sy) * w + nx
        if (from.has(n) || !surface(g, nx, y + sy)) continue
        from.set(n, i)
        next.push(n)
      }
    }
    front = next
  }
  return []
}

/** The lizards' tick. @param {import('./game.js').Game} g */
export function updateLizards(g) {
  const c = g.cfg.lizards
  const reach = reachOf(g)
  const { w } = g.world
  const rng = mulberry32(hashSeed(SALT, g.tick))
  if (g.tick % Math.max(1, c.checkTicks) === 0 && g.lizards.length < c.max) spawn(g, c, rng)
  g.lizards = g.lizards.filter((z) => {
    const head = z.body[0]
    if (z.eaten >= c.eat) {
      if (!z.site && g.tick - z.lookedAt >= c.checkTicks) {
        z.lookedAt = g.tick
        z.site = findSite(g, { site: c.site, length: Math.max(1, c.crystalPx) }, head, rng)
      }
      if (!z.site) return true // nowhere to burrow yet: it waits, and looks again checkTicks later
      if (g.tick - z.movedAt < c.zipTicks) return true
      z.movedAt = g.tick
      const s = z.site
      if (head.x === s.x && head.y === s.y) {
        for (const i of s.cells) g.world.tiles[i] = CRYSTAL
        g.events.push({ type: 'deposit', cells: s.cells })
        return false
      }
      let dx = s.x - head.x
      if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w
      move(z, { x: wrap(head.x + Math.sign(dx), w), y: head.y + Math.sign(s.y - head.y) })
      return true
    }
    if (g.tick < z.restUntil) {
      // stopped: it mines
      if (g.tick >= z.mineAt) {
        const o = ashNear(g, head, reach)
        if (o) {
          const i = o.y * w + o.x
          g.garden.wall[i] = 0 // bare back wall again
          g.garden.changed.push(i)
          z.eaten++
          z.mineAt = g.tick + c.mineTicks
          g.events.push({ type: 'licked', x: o.x, y: o.y, to: { x: head.x, y: head.y } }) // where it is: an index goes stale (b4.29)
        }
      }
      return true
    }
    if (!z.zip) {
      if (!surface(g, head.x, head.y)) {
        // off the wall after a dash: straight back (b4.55)
        const back = surfaceNear(g, head, c.dash * 2)
        z.route = back ? line(g, head, back, 0) : []
        z.zip = Math.max(1, z.route.length)
      } else {
        // b4.57 (the user: "zip around the walls 5x longer… I barely see them"): after every rest it zips on,
        // even with ash still in reach (it stayed and licked on before)
        z.route = routeFor(g, c, head)
        if (!z.route.length && !ashNear(g, head, reach)) {
          // nothing from the wall: a dash for ash in the open (b4.55)
          const a = ashNear(g, head, c.dash)
          if (a) z.route = line(g, head, a, reach)
        }
        z.zip = z.route.length ? Math.min(z.route.length, c.dash + 12) : 4 + (rng() % 9)
      }
    }
    if (g.tick - z.movedAt < Math.max(1, c.zipTicks)) return true
    z.movedAt = g.tick
    step(g, c, z, rng)
    if (--z.zip <= 0) {
      z.zip = 0
      z.restUntil = g.tick + 40 + (rng() % 80)
    }
    return true
  })
}

/** @param {import('./game.js').Game} g @param {Lizards} c @param {() => number} rng */
function spawn(g, c, rng) {
  const { w, h } = g.world
  const n = Math.max(1, c.near)
  const p = { x: wrap(g.ch.x + (rng() % (2 * n + 1)) - n, w), y: g.ch.y + (rng() % (2 * n + 1)) - n }
  if (p.y < 0 || p.y >= h) return
  // ash round there (b4.54): it's on the back wall, so always within reach of a cave surface
  let ash = 0
  const r = c.radius
  const wall = g.garden.wall
  for (let dy = -r; dy <= r && ash < c.density; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const y = p.y + dy
      if (y >= 0 && y < h && dx * dx + dy * dy <= r * r && wall[y * w + wrap(p.x + dx, w)] === ASH) ash++
    }
  if (ash < c.density) return
  // the nearest surface pixel within the radius
  let best = null
  let bd = Infinity
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d > r * r || d >= bd || !surface(g, p.x + dx, p.y + dy)) continue
      best = { x: wrap(p.x + dx, w), y: p.y + dy }
      bd = d
    }
  if (!best) return
  const b = /** @type {{ x: number, y: number }} */ (best)
  if (!roomy(g, b, c.room)) return
  g.lizards.push({ body: [b, { ...b }, { ...b }], dir: rng() % 8, zip: 0, movedAt: g.tick, restUntil: g.tick + 30, mineAt: 0, eaten: 0, site: null, lookedAt: -1e9, route: [] })
  g.events.push({ type: 'lizard', x: b.x, y: b.y })
}

/** The open pixels 8-connected to `at` number at least n. @param {import('./game.js').Game} g @param {{ x: number, y: number }} at @param {number} n */
function roomy(g, at, n) {
  const { w, h, tiles } = g.world
  const got = new Set([at.y * w + at.x])
  for (const i of got) {
    if (got.size >= n) return true
    const x = i % w
    const y = (i - x) / w
    for (const [sx, sy] of STEPS) {
      const yy = y + sy
      const j = yy * w + wrap(x + sx, w)
      if (yy >= 0 && yy < h && isOpen(tiles[j])) got.add(j)
    }
  }
  return got.size >= n
}

/** One px: along its route, else on its heading, else anywhere on the surface. @param {import('./game.js').Game} g @param {Lizards} c @param {Lizard} z @param {() => number} rng */
function step(g, c, z, rng) {
  const head = z.body[0]
  const { w } = g.world
  const r = z.route.shift()
  if (r && isOpen(g.world.tiles[r.y * w + r.x])) {
    const k = STEPS.findIndex(([sx, sy]) => wrap(head.x + sx, w) === r.x && head.y + sy === r.y)
    if (k >= 0) z.dir = k
    move(z, r)
    if (!z.route.length) z.zip = 1 // there: stop and mine
    return
  }
  z.route = []
  const ok = [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => surface(g, head.x + STEPS[k][0], head.y + STEPS[k][1]))
  if (!ok.length) return
  const k = ok.includes(z.dir) && rng() % 4 ? z.dir : ok[rng() % ok.length]
  z.dir = k
  move(z, { x: wrap(head.x + STEPS[k][0], w), y: head.y + STEPS[k][1] })
  void c
}

/** The open pixels on the straight line from `a` towards `b`, a's excluded, ending once within `within` px of b
 * (0: at b) or before the first solid one (b4.55). @param {import('./game.js').Game} g @param {{ x: number, y: number }} a @param {{ x: number, y: number }} b @param {number} within */
function line(g, a, b, within) {
  const { w, tiles } = g.world
  let dx = b.x - a.x
  if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w
  const dy = b.y - a.y
  const n = Math.max(Math.abs(dx), Math.abs(dy))
  /** @type {{ x: number, y: number }[]} */
  const out = []
  for (let k = 1; k <= n; k++) {
    const x = wrap(a.x + Math.round((dx * k) / n), w)
    const y = a.y + Math.round((dy * k) / n)
    if (!isOpen(tiles[y * w + x])) break
    out.push({ x, y })
    const rx = Math.round(dx * (1 - k / n))
    const ry = Math.round(dy * (1 - k / n))
    if (within && rx * rx + ry * ry <= within * within) break
  }
  return out
}

/** The nearest surface pixel within r of `at`, or null. @param {import('./game.js').Game} g @param {{ x: number, y: number }} at @param {number} r */
function surfaceNear(g, at, r) {
  let best = null
  let bd = Infinity
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d > r * r || d >= bd || !surface(g, at.x + dx, at.y + dy)) continue
      best = { x: wrap(at.x + dx, g.world.w), y: at.y + dy }
      bd = d
    }
  return best
}

/** @param {Lizard} z @param {{ x: number, y: number }} p */
function move(z, p) {
  z.body.unshift(p)
  z.body.pop()
}
