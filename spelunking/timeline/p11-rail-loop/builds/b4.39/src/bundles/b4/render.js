// b4's Canvas2D view (throwaway: rendering moves to PixiJS later, so nothing here is tuned). b3's look: the
// world 1 px per tile scaled up, b3's palette, b3's fog (never seen = black, seen = dim, lit = clear), the
// probe's rings. At b4.2 a tile is one v5 pixel (D080): the sheet, the space above it and the sea are drawn
// as v6 draws them, the sheet and space with no fog (scenery); the bot is its pixel with a halo, so it's
// seen; the zoom levels go down to 2 device px a tile; the textures change pixel by pixel, never whole
// (123k tiles: a whole repaint each step was too slow to play, not tuning).
// New: nodes glow (the network's, and the rest near the bot), built rails, the spider
// bot, ore flying to the bot as it's pulled. b4.3: the light fades out over its last EDGE px (drawing only);
// the ledger, a column in the top-right corner (ore, loot, bugs); the selected edge flashes green, a refused
// build pulses it red, a build streams ore from the ledger's ore icon to the site; tamed bugs at work (warm
// dots) and their hauls flying to the ledger's icons. b4.10: the green back wall and vines in the texture, the
// red fruit as a plain red pixel under the fog (it glowed in b4.10; the user: "fruits should not glow"), fruit
// on the ledger. b4.12: worms, dark red and striped, drawn over the fog (so you see them burrow), and their
// deposits turning to ore in the texture. b4.14: ore and loot in the wall are rock-coloured pixels with a speck
// in them (drawn under the fog, so seen and lit apply), hearts when a bug is tamed, lizards. b4.15: purple
// lichen in the texture, its curly leaf under the fog; the bot's row on the ledger, loot as count/target.

import { cellRgb } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'
import { botAt, botCost, FRUIT_TILE, nextCost, shown } from './game.js'
import { ASH, BURN, FRUIT, GREEN as MOSS, VINE } from './garden.js'
import { LEAF_PX, WITHERED_PX } from './lichen.js'
import { OPEN, ROCK, SHEET, SPACE } from './world.js'
import { ledgerKinds } from './ledger.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./world.js').Cell} Cell */
/** @typedef {{ select: { node: number, edge: number } | null, refusedAt: number }} Ui */

export const ZOOM_PX = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24] // tile sizes in device px
const AUTO_TILES = 100 // the default zoom: about this many tiles across the short side

const BG_RGB = [5, 5, 8]
const DIM_A = 0.825 // seen, not lit: 17.5% bright (b4.2's 35%, 50% darker: the user, b4.3)
const CHAR = '#f4f1de'
const NODE = [255, 200, 40]
// a root's two shades (b4.22), dim (b4.27, the user: "it outshines the whole map")
const ROOT = 'rgb(120,64,24)'
const ROOT2 = 'rgb(96,50,20)'
// a node's bulb, core, body, rim (b4.22): dim while still, bright while it holds the bot (b4.27); a still
// bulb you can build from keeps a dim core, one on a built root has none
const BULB_DIM = ['rgb(168,110,52)', 'rgb(128,70,26)', 'rgb(94,50,18)']
const BULB_HELD = ['rgb(255,214,120)', 'rgb(246,150,44)', 'rgb(196,96,24)']
const ORE = 'rgb(236,164,40)'
const RED = '#ff2828'
const LOOT = 'rgb(240,240,240)' // white (the user, b4.28; was b3's teal)
const BUG = [255, 190, 90] // tamed: amber (D059)
const WILD = [90, 170, 255] // wild: blue (D059)
const LICHEN_RGB = [96, 44, 128]
const OPEN_RGB = [36, 44, 62] // the cave's back wall: dark grey-blue, not the unexplored black (the user, b4.16)
// the rock, much darker than b3's (the user, b4.18): under the back wall, so the caves read as the lit part
/** @type {Record<number, number[]>} */
const ROCK_RGB = { [Tile.Soft]: [40, 30, 24], [Tile.Hard]: [22, 23, 28] }
/** A tile's colour in b4: its rock, else b3's palette. @param {number} t */
const rgb = (t) => ROCK_RGB[t] ?? cellRgb(/** @type {any} */ (t))
const RING_TRAIL = 4
const EDGE = 3 // px over which the light fades out
const FRUIT_C = [235, 40, 50]
/** @type {Record<number, number[]>} */
const WALL_RGB = { [MOSS]: [22, 58, 30], [VINE]: [60, 140, 55], [FRUIT]: FRUIT_C, [BURN]: [120, 28, 8], [ASH]: [96, 94, 92] }
/** @type {Record<number, number[]>} */
const LICHEN_PX_RGB = { [LEAF_PX]: [176, 104, 220], [WITHERED_PX]: [112, 84, 56] } // b4.21: a sparked lichen's leaf, withered brown

/** @param {HTMLCanvasElement} canvas @param {Game} game @param {Ui} ui @param {{ zoom: number }} view */
export function createRenderer(canvas, game, ui, view) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }))
  const { world, map } = game
  const { w, h } = world

  const tex = document.createElement('canvas')
  tex.width = w
  tex.height = h
  const tctx = /** @type {CanvasRenderingContext2D} */ (tex.getContext('2d'))
  const fog = document.createElement('canvas')
  fog.width = w
  fog.height = h
  const fctx = /** @type {CanvasRenderingContext2D} */ (fog.getContext('2d'))
  const scenic = (/** @type {number} */ i) => map.kind[i] !== ROCK && map.kind[i] !== OPEN
  const unfogged = (/** @type {number} */ i) => map.kind[i] === SHEET || map.kind[i] === SPACE // scenery: the sea is fogged
  const timg = tctx.createImageData(w, h)
  const fimg = fctx.createImageData(w, h)
  /** @param {number} i */
  const paintTile = (i) => {
    const wall = game.garden.wall[i]
    if (game.lichen.on[i] && world.tiles[i] === Tile.Open) timg.data.set([...(LICHEN_PX_RGB[game.lichen.on[i]] ?? LICHEN_RGB), 255], i * 4)
    else if (scenic(i)) timg.data.set(map.scenery.subarray(i * 4, i * 4 + 4), i * 4)
    else if (wall && world.tiles[i] === Tile.Open) timg.data.set([.../** @type {number[]} */ (WALL_RGB[wall]), 255], i * 4)
    else if (world.tiles[i] === Tile.Ore || world.tiles[i] === Tile.Loot) timg.data.set([...rgb(rockUnder(i)), 255], i * 4)
    else if (world.tiles[i] === Tile.Open) timg.data.set([...OPEN_RGB, 255], i * 4)
    else timg.data.set([...rgb(world.tiles[i]), 255], i * 4)
  }
  /** The rock an ore or loot pixel sits in: its 8 neighbours' majority, soft on a tie (pull.js's toRock). @param {number} i */
  function rockUnder(i) {
    const x = i % w
    const y = (i - x) / w
    let soft = 0
    let hard = 0
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || y + dy < 0 || y + dy >= h) continue
        const t = world.tiles[(y + dy) * w + ((x + dx + w) % w)]
        if (t === Tile.Soft) soft++
        else if (t === Tile.Hard) hard++
      }
    return hard > soft ? Tile.Hard : Tile.Soft
  }
  const lit = new Uint8Array(w * h)
  const DIM = Math.round(DIM_A * 255)
  /** @param {number} i */
  const paintFogAt = (i) => {
    let a = unfogged(i) ? 0 : game.seen[i] ? DIM : 255
    if (lit[i] && a) {
      // the soft edge: clear inside, fading to the seen dim over the last EDGE px
      const x = i % w
      let dx = Math.abs(x - game.ch.x)
      dx = Math.min(dx, w - dx)
      const d = Math.hypot(dx, (i - x) / w - game.ch.y)
      a = Math.round(DIM * Math.min(1, Math.max(0, (d - (game.radius - EDGE)) / EDGE)))
    }
    fimg.data[i * 4 + 3] = a
  }
  for (let i = 0; i < w * h; i++) {
    paintTile(i)
    fimg.data.set(BG_RGB, i * 4)
    paintFogAt(i)
  }
  tctx.putImageData(timg, 0, 0)
  fctx.putImageData(fimg, 0, 0)
  /** @type {number[]} */
  let litDrawn = []
  /** @type {{ x0: number, x1: number, y0: number, y1: number } | null} */
  let fogBox = null
  /** @param {number} i */
  const fogChanged = (i) => {
    paintFogAt(i)
    const x = i % w
    const y = (i - x) / w
    fogBox = fogBox
      ? { x0: Math.min(fogBox.x0, x), x1: Math.max(fogBox.x1, x), y0: Math.min(fogBox.y0, y), y1: Math.max(fogBox.y1, y) }
      : { x0: x, x1: x, y0: y, y1: y }
  }
  /** The fog, only where it changed: the light's old and new cells, and the ones seen since. */
  function paintFog() {
    if (litDrawn !== game.lit) {
      for (const i of litDrawn) lit[i] = 0
      for (const i of game.lit) lit[i] = 1
      for (const i of litDrawn) fogChanged(i)
      for (const i of game.lit) fogChanged(i)
      litDrawn = game.lit
    }
    if (!fogBox) return
    const b = fogBox
    fctx.putImageData(fimg, 0, 0, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1)
    fogBox = null
  }

  let dpr = 1
  let W = 0
  let H = 0
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 3)
    W = Math.round(canvas.clientWidth * dpr)
    H = Math.round(canvas.clientHeight * dpr)
    canvas.width = W
    canvas.height = H
  }
  resize()

  /** The zoom level in use: the chosen one, or the one closest to AUTO_TILES across the short side. */
  function level() {
    if (view.zoom >= 0) return Math.min(view.zoom, ZOOM_PX.length - 1)
    const want = Math.min(W, H) / AUTO_TILES
    let best = 0
    ZOOM_PX.forEach((px, i) => Math.abs(px - want) < Math.abs(ZOOM_PX[best] - want) && (best = i))
    return best
  }

  const start = botAt(game, 0)
  const cam = { x: start.x + 0.5, y: start.y + 0.5 }
  let T = ZOOM_PX[level()]

  /** The copy of world x nearest the camera. @param {number} x */
  const nearCam = (x) => x - Math.round((x - cam.x) / w) * w
  const sx = (/** @type {number} */ x) => (nearCam(x) - cam.x) * T + W / 2
  const sy = (/** @type {number} */ y) => (y - cam.y) * T + H / 2
  /** A tile's centre on screen. @param {Cell} c */
  const at = (c) => [sx(c.x + 0.5), sy(c.y + 0.5)]

  /** @type {{ x: number, y: number, r: number, s: number }[]} */
  const rings = []
  /** @typedef {() => [number, number]} End a point on screen, device px, read each frame (the camera moves) */
  /** @type {{ from: End, to: End, s: number, dur: number, color: string, arc: number }[]} */
  const flights = []
  /** @type {{ x: number, y: number, s: number, k: number }[]} hearts from a tamed bug (b4.14) */
  const hearts = []
  /** @type {{ x: number, y: number, vx: number, vy: number, s: number, life: number, color: string, size: number }[]} embers and puffs, world px (b4.25) */
  const embers = []
  /** @param {number} x @param {number} y @param {number} now @param {number} n @param {string[]} colors @param {number} speed */
  const puff = (x, y, now, n, colors, speed) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.random()
      const v = speed * (0.4 + Math.random() * 0.6)
      embers.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: now, life: 0.6 + Math.random() * 0.5, color: colors[k % colors.length], size: 0.6 })
    }
  }
  /** @param {Cell} c @returns {End} */
  const cell = (c) => () => /** @type {[number, number]} */ (at(c))
  /** @param {string} kind @returns {End} */
  const icon = (kind) => () => ledgerIcon(kind)
  /** @param {End} from @param {End} to @param {number} s @param {number} dur @param {string} color @param {number} [arc] */
  const fly = (from, to, s, dur, color, arc = 1) => flights.push({ from, to, s, dur, color, arc })

  /** @param {import('./game.js').GameEvent} e @param {number} now seconds */
  function onEvent(e, now) {
    if (e.type === 'seen') e.cells.forEach(fogChanged)
    else if (e.type === 'pulled' || e.type === 'dug') {
      paintTile(e.y * w + e.x)
      tctx.putImageData(timg, 0, 0, e.x, e.y, 1, 1)
      // yours flies to you (and counts on the ledger: no stream to it, the user), a bug's to the bug, the same
      // flight (b4.7); each follows its puller as it moves
      const who = e.type === 'dug' ? game.swarm[e.by] : null
      const to = () => /** @type {[number, number]} */ (at(who ? workerAt(who, 0) : botAt(game, 0)))
      fly(cell(e), to, now, 0.45, e.tile === FRUIT_TILE ? `rgb(${FRUIT_C})` : e.tile === Tile.Ore ? ORE : LOOT)
    } else if (e.type === 'deposit')
      for (const i of e.cells) {
        paintTile(i)
        tctx.putImageData(timg, 0, 0, i % w, Math.floor(i / w), 1, 1)
      }
    else if (e.type === 'ring') rings.push({ x: e.x, y: e.y, r: e.r, s: now })
    else if (e.type === 'bloom') puff(e.x, e.y, now, 14, ['#ffffff', '#f4f0ff'], 8)
    else if (e.type === 'ashwormGone') puff(e.x, e.y, now, 10, ['#9a9aa0', '#7c7c84'], 5)
    else if (e.type === 'poof') puff(e.x, e.y, now, 32, ['#ffffff', '#eef4ff', '#ffffff'], 14)
    else if (e.type === 'botUpgrade')
      for (let k = 0; k < 8; k++) fly(icon('loot'), icon('bot'), now + k * 0.05, 0.6, LOOT, 0)
    else if (e.type === 'upgrade')
      for (let k = 0; k < 8; k++) fly(icon('fruit'), icon('bugs'), now + k * 0.05, 0.6, `rgb(${FRUIT_C})`, 0) // no particles for a nibble (b4.13)
    else if (e.type === 'tamed') {
      fly(cell(e), icon('bugs'), now, 0.9, `rgb(${BUG})`, 0)
      for (let k = 0; k < 6; k++) hearts.push({ x: e.x + 0.5, y: e.y + 0.5, s: now + k * 0.07, k }) // b4.14
    } else if (e.type === 'licked') {
      // to the lizard's head as it licked: g.lizards is refiltered, so an index could name another one, or none
      // (the user's crash in b4.28)
      fly(cell(e), cell(e.to), now, 0.3, ORE, 0.3)
    }
    else if (e.type === 'haul') {
      for (let k = 0; k < Math.min(e.ore, 12); k++) fly(cell(e), icon('ore'), now + k * 0.06, 0.9, ORE, 0)
      for (let k = 0; k < Math.min(e.loot, 6); k++) fly(cell(e), icon('loot'), now + k * 0.08, 0.9, LOOT, 0)
      for (let k = 0; k < e.fruit; k++) fly(cell(e), icon('fruit'), now + k * 0.08, 0.9, `rgb(${FRUIT_C})`, 0)
    } else if (e.type === 'built') {
      const site = cell(map.nodes[e.from])
      for (let k = 0; k < e.price; k++) fly(icon('ore'), site, now + k * 0.05, 0.7, ORE, 0)
    }
  }

  // The ledger (b4.3): a column in the top-right corner, an icon and its count a row
  const ROW = 30
  /** An icon's centre, device px. @param {string} kind @returns {[number, number]} */
  function ledgerIcon(kind) {
    const k = Math.max(0, ledgerKinds.indexOf(kind))
    return [W - 22 * dpr, (22 + k * ROW) * dpr]
  }
  /** @param {number} now */
  function drawLedger(now) {
    const refused = now - ui.refusedAt < 0.7 && Math.sin((now - ui.refusedAt) * Math.PI * 8) > 0
    const L = game.ledger
    // fruit shows the next upgrade's target; bugs a bug icon per upgrade, next to the first (b4.13)
    const text = { ore: `${L.ore}`, loot: `${L.loot}/${botCost(game)}`, bot: '', bugs: `${L.bugs}`, fruit: `${L.fruit}/${nextCost(game)}` }
    ctx.font = `bold ${Math.round(16 * dpr)}px monospace`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (const kind of ledgerKinds) {
      const [x, y] = ledgerIcon(kind)
      const r = 7 * dpr
      const icons = kind === 'bugs' ? 1 + game.level : kind === 'bot' ? 1 + game.botLevel : 1
      const gap = 16 * dpr
      const label = text[/** @type {'ore' | 'loot' | 'bot' | 'bugs' | 'fruit'} */ (kind)]
      const tx = x - 14 * dpr - (icons - 1) * gap
      const bw = ctx.measureText(label).width + (tx - x) * -1 + 26 * dpr
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(x + 14 * dpr - bw, y - 13 * dpr, bw, 26 * dpr)
      for (let k = 0; k < icons; k++) {
        const ix = x - k * gap
        if (kind === 'fruit') {
          ctx.fillStyle = `rgb(${FRUIT_C})`
          ctx.beginPath()
          ctx.arc(ix, y, r * 0.8, 0, Math.PI * 2)
          ctx.fill()
        } else if (kind === 'bugs') dot(ix, y, r, r * 1.8, BUG)
        else if (kind === 'bot') dot(ix, y, r, r * 1.8, [244, 241, 222])
        else {
          ctx.fillStyle = kind === 'ore' ? ORE : LOOT
          ctx.fillRect(ix - r, y - r, 2 * r, 2 * r)
        }
      }
      ctx.fillStyle = kind === 'ore' && refused ? RED : CHAR
      ctx.fillText(label, tx, y + dpr)
    }
  }

  /** A stream's colour: the unit at c. @param {Cell} c */
  function unitColor(c) {
    const i = c.y * w + c.x
    return game.garden.wall[i] === FRUIT ? `rgb(${FRUIT_C})` : world.tiles[i] === Tile.Loot ? LOOT : ORE
  }

  /** The garden's changed pixels into the texture (b4.10; fruit is a red pixel there, b4.12). */
  function drawGarden() {
    const G = game.garden
    for (const i of G.changed) {
      paintTile(i)
      tctx.putImageData(timg, 0, 0, i % w, Math.floor(i / w), 1, 1)
    }
    G.changed.length = 0
  }

  /** Ore and loot in the wall (b4.14): a speck, half a pixel across, at a hashed spot in its pixel. Under the fog. */
  function drawSpecks() {
    const s = Math.max(1, Math.round(T * 0.5))
    const cols = Math.ceil(W / T) + 2
    const rows = Math.ceil(H / T) + 2
    const tx0 = Math.floor(cam.x - W / 2 / T) - 1
    const ty0 = Math.max(0, Math.floor(cam.y - H / 2 / T) - 1)
    for (let ty = ty0; ty < Math.min(h, ty0 + rows); ty++)
      for (let k = 0; k < cols; k++) {
        const x = (((tx0 + k) % w) + w) % w
        const i = ty * w + x
        const t = world.tiles[i]
        if (t !== Tile.Ore && t !== Tile.Loot) continue
        if (!game.seen[i]) continue
        const hsh = Math.imul(i, 2654435761) >>> 0
        const ox = T > s ? hsh % (T - s + 1) : 0
        const oy = T > s ? (hsh >>> 8) % (T - s + 1) : 0
        ctx.fillStyle = t === Tile.Ore ? ORE : LOOT
        ctx.fillRect(Math.round(sx(tx0 + k)) + ox, Math.round(sy(ty)) + oy, s, s)
      }
  }

  /** Lichen (b4.15): its changed pixels (patch and leaf, b4.18) into the texture. */
  function drawLichen() {
    const Lc = game.lichen
    for (const i of Lc.changed) {
      paintTile(i)
      tctx.putImageData(timg, 0, 0, i % w, Math.floor(i / w), 1, 1)
    }
    Lc.changed.length = 0
  }

  /** Hearts rising from a bug being tamed (b4.14). @param {number} now */
  function drawHearts(now) {
    for (let i = hearts.length - 1; i >= 0; i--) {
      const p = hearts[i]
      const t = (now - p.s) / 1.2
      if (t < 0) continue
      if (t >= 1) {
        hearts.splice(i, 1)
        continue
      }
      const u = 3 * dpr * (1 + 0.3 * Math.sin(t * Math.PI))
      const x = sx(p.x) + Math.sin(p.k * 2.1 + t * 5) * 8 * dpr + (p.k - 2.5) * 3 * dpr
      const y = sy(p.y) - t * 40 * dpr
      ctx.fillStyle = `rgba(255,90,140,${1 - t})`
      ctx.beginPath()
      ctx.arc(x - u * 0.5, y, u * 0.55, Math.PI, 0)
      ctx.arc(x + u * 0.5, y, u * 0.55, Math.PI, 0)
      ctx.lineTo(x, y + u * 1.2)
      ctx.closePath()
      ctx.fill()
    }
  }

  /** Lizards (b4.14): 3 px of green, the head lighter; dull since b4.28, over the fog since b4.39. */
  function drawLizards() {
    const s = Math.max(T, 2 * dpr)
    for (const z of game.lizards)
      for (let k = z.body.length - 1; k >= 0; k--) {
        const [x, y] = at(z.body[k])
        if (x < -s || y < -s || x > W + s || y > H + s) continue
        ctx.fillStyle = k === 0 ? 'rgb(104,168,78)' : 'rgb(58,128,60)' // not glowing (b4.28; was (150,255,120), (60,215,80))
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s))
      }
  }

  /** Worms (b4.12): 12 px of dark red, striped every other px; the head a little brighter. */
  function drawWorms() {
    const s = Math.max(T, 2 * dpr)
    for (const m of game.worms) {
      for (let k = m.body.length - 1; k >= 0; k--) {
        const [x, y] = at(m.body[k])
        if (x < -s || y < -s || x > W + s || y > H + s) continue
        ctx.fillStyle = k === 0 ? 'rgb(170,40,45)' : k % 2 ? 'rgb(70,8,14)' : 'rgb(125,22,30)'
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s))
      }
    }
  }

  /** A worker between its last pixel and this one. @param {import('./swarm.js').Worker} b @param {number} alpha */
  function workerAt(b, alpha) {
    const f = Math.min(1, (game.tick - b.movedAt + alpha) / Math.max(1, game.cfg.swarm.moveTicks))
    let dx = b.x - b.from.x
    if (Math.abs(dx) > 1) dx = -Math.sign(dx)
    return { x: b.from.x + dx * f, y: b.from.y + (b.y - b.from.y) * f }
  }

  /** Wild bugs (b4.13): like the tamed, in blue. @param {number} alpha */
  function drawWild(alpha) {
    const s = Math.max(T, 2 * dpr)
    const hr = Math.max(T * 2, 6 * dpr)
    for (const b of game.bugs) {
      const f = Math.min(1, (game.tick - b.movedAt + alpha) / Math.max(1, game.cfg.bugs.moveTicks))
      let dx = b.x - b.from.x
      if (Math.abs(dx) > 1) dx = -Math.sign(dx)
      const [x, y] = at({ x: b.from.x + dx * f, y: b.from.y + (b.y - b.from.y) * f })
      if (x < -hr || y < -hr || x > W + hr || y > H + hr) continue
      dot(x, y, s, hr, WILD)
    }
  }

  /** A bug: its pixel and a small halo. @param {number} x @param {number} y @param {number} s @param {number} hr @param {number[]} rgb */
  function dot(x, y, s, hr, rgb) {
    const halo = ctx.createRadialGradient(x, y, 0, x, y, hr)
    halo.addColorStop(0, `rgba(${rgb},0.5)`)
    halo.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = halo
    ctx.fillRect(x - hr, y - hr, hr * 2, hr * 2)
    ctx.fillStyle = `rgb(${rgb})`
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s))
  }

  /** Tamed bugs at work (b4.3): warm dots with a small halo, drawn over the fog (they're yours). @param {number} alpha @param {number} now */
  function drawSwarm(alpha, now) {
    const s = Math.max(T, 2 * dpr)
    const hr = Math.max(T * 2, 6 * dpr)
    for (const b of game.swarm) {
      const p = workerAt(b, alpha)
      const [x, y] = at(p)
      if (x < -hr || y < -hr || x > W + hr || y > H + hr) continue
      if (b.target && b.pullFor > 20) specks(b.target, p, now, unitColor(b.target)) // your dust stream (b4.7)
      const halo = ctx.createRadialGradient(x, y, 0, x, y, hr)
      halo.addColorStop(0, `rgba(${BUG},0.5)`)
      halo.addColorStop(1, `rgba(${BUG},0)`)
      ctx.fillStyle = halo
      ctx.fillRect(x - hr, y - hr, hr * 2, hr * 2)
      ctx.fillStyle = `rgb(${BUG})`
      ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s))
    }
  }

  /** CSS px → tiles (fractional, x wrapped). @param {number} cx @param {number} cy */
  function toWorld(cx, cy) {
    const x = (cx * dpr - W / 2) / T + cam.x
    return { x: ((x % w) + w) % w, y: (cy * dpr - H / 2) / T + cam.y }
  }

  /** @param {number} alpha @param {number} dt @param {number} now seconds */
  function draw(alpha, dt, now) {
    paintFog()
    T = ZOOM_PX[level()]
    const bot = botAt(game, alpha)
    // the camera follows the bot, the short way round
    const k = 1 - Math.pow(1 - 0.15, dt * 60)
    let dx = bot.x + 0.5 - cam.x
    dx -= Math.round(dx / w) * w
    cam.x = (((cam.x + dx * k) % w) + w) % w
    cam.y += (bot.y + 0.5 - cam.y) * k

    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = `rgb(${BG_RGB})`
    ctx.fillRect(0, 0, W, H)
    // the world and the fog, as many copies across as the screen needs
    const x0 = sx(0) - Math.ceil(sx(0) / (w * T)) * w * T
    for (let x = x0; x < W; x += w * T) {
      ctx.drawImage(tex, 0, 0, w, h, x, sy(0), w * T, h * T)
    }
    drawSpecks()
    drawLichen()
    drawRails() // under the fog too (the user, b4.32: "network is still WAAAY too dominant")
    drawNodes(now, false)
    for (let x = x0; x < W; x += w * T) ctx.drawImage(fog, 0, 0, w, h, x, sy(0), w * T, h * T)
    drawGarden()
    drawFire(now, dt) // over the fog: a fire is seen from afar (b4.25)
    drawFlowers()
    drawAim(now) // over the fog: the bulb holding you and the edges it offers
    drawNodes(now, true)
    drawFbots()
    drawAshworms(now)
    drawBot(bot, now)
    drawRings(now)
    drawStreams(now)
    drawWild(alpha) // b3.7's wild bugs (D056–D061), drawn like the tamed ones, in blue (b4.13)
    drawSwarm(alpha, now)
    drawWorms()
    drawLizards() // over the fog, like every moving animal (the user, b4.39), in b4.28's dull greens: no glow
    drawHearts(now)
    drawEmbers(now, dt)
    drawMask()
    drawFlights(now)
    drawLedger(now)
  }

  // the flame's colours, hot to cool (b4.25, the user: "brighter, more colorful")
  const FLAME = ['#fffbe0', '#fff27a', '#ffd23c', '#ff9f1c', '#ff5a1f', '#f0263c', '#c81e8c']
  /** Burning pixels, flickering from hot (just caught) to cool, and embers rising off them. @param {number} now @param {number} dt */
  function drawFire(now, dt) {
    const G = game.garden
    for (const i of G.burning) {
      const age = G.step - (G.caught.get(i) ?? G.step)
      const k = Math.min(FLAME.length - 1, Math.max(0, age * 2 + ((Math.random() * 3) | 0) - 1))
      ctx.fillStyle = FLAME[k]
      px(i % w, Math.floor(i / w))
      if (embers.length < 600 && Math.random() < dt * 3) {
        embers.push({
          x: (i % w) + Math.random(),
          y: Math.floor(i / w) + Math.random(),
          vx: (Math.random() - 0.5) * 3,
          vy: -4 - Math.random() * 6,
          s: now,
          life: 0.4 + Math.random() * 0.6,
          color: FLAME[(Math.random() * 5) | 0],
          size: 0.5,
        })
      }
    }
  }

  /** Sparks and puffs (b4.25): world px, drifting, shrinking. @param {number} now @param {number} dt */
  function drawEmbers(now, dt) {
    for (let i = embers.length - 1; i >= 0; i--) {
      const p = embers[i]
      const t = (now - p.s) / p.life
      if (t >= 1) {
        embers.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 1 - dt * 2
      p.vy *= 1 - dt * 2
      const s = Math.max(1, Math.round(T * p.size * (1 - t * 0.6)))
      ctx.globalAlpha = 1 - t * t
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(sx(p.x) - s / 2), Math.round(sy(p.y) - s / 2), s, s)
    }
    ctx.globalAlpha = 1
  }

  // a flower (b4.25): white petals in a ring round a pale yellow heart, 5 px across
  const PETALS = [
    [0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2],
    [0, -1], [-1, 0], [1, 0], [0, 1],
  ]
  /** Flowers on the ash, over the fog. */
  function drawFlowers() {
    for (const f of game.flowers) {
      ctx.fillStyle = 'rgb(168,166,160)' // dim (the user, b4.29; was white)
      for (const [dx, dy] of PETALS) px(f.x + dx, f.y + dy)
      ctx.fillStyle = 'rgb(170,150,84)'
      px(f.x, f.y)
    }
  }

  /** A round mask over the world (b4.39, the user): a circle round the screen's middle as wide as the map,
   * fading out over its outer fifth, so the map's repeat across x never shows. Flights and the ledger are
   * drawn over it. */
  function drawMask() {
    const R = (w * T) / 2
    if (R * R > (W * W + H * H) / 4) return // it'd lie off the screen
    const g = ctx.createRadialGradient(W / 2, H / 2, R * 0.8, W / 2, H / 2, R)
    g.addColorStop(0, `rgba(${BG_RGB},0)`)
    g.addColorStop(1, `rgb(${BG_RGB})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  /** Ash worms (b4.37, the user): grey, with a row of small lights on both sides, over the fog. @param {number} now */
  function drawAshworms(now) {
    for (const z of game.ashworms) {
      z.body.forEach((c, k) => {
        ctx.fillStyle = k === 0 ? 'rgb(170,170,176)' : 'rgb(118,118,126)'
        px(c.x, c.y)
      })
      // the lights: a small warm dot on each side of every other segment, across its heading, twinkling
      const s = Math.max(1, Math.round(T * 0.45))
      for (let k = 1; k < z.body.length; k += 2) {
        const a = z.body[k - 1]
        const b = z.body[k]
        let dx = a.x - b.x
        if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w
        const dy = a.y - b.y
        const l = Math.hypot(dx, dy) || 1
        const [x, y] = at(b)
        ctx.globalAlpha = 0.65 + 0.35 * Math.sin(now * 9 + k)
        ctx.fillStyle = 'rgb(255,236,150)'
        for (const side of [-1, 1]) {
          const ox = (-dy / l) * side * T * 0.8
          const oy = (dx / l) * side * T * 0.8
          ctx.fillRect(Math.round(x + ox - s / 2), Math.round(y + oy - s / 2), s, s)
        }
      }
      ctx.globalAlpha = 1
    }
  }

  /** Flower bots (b4.25): a pixel like yours, white-lilac, no halo (no light). */
  function drawFbots() {
    const s = Math.max(T, 2 * dpr)
    ctx.fillStyle = '#e6dcff'
    for (const b of game.fbots) {
      const [x, y] = at(b)
      ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s))
    }
  }

  /** A world pixel's square on screen. @param {number} x @param {number} y */
  function px(x, y) {
    ctx.fillRect(Math.round(sx(x)), Math.round(sy(y)), Math.ceil(T), Math.ceil(T))
  }

  /** Roots (b4.22, the user): pixels, like everything else; two shades of orange, hashed per pixel; under the fog (b4.32). */
  function drawRails() {
    map.edges.forEach((e, k) => {
      if (!game.built[k]) return
      for (const c of e.path) {
        ctx.fillStyle = (Math.imul(c.y * w + c.x, 2654435761) >>> 29) & 1 ? ROOT : ROOT2
        px(c.x, c.y)
      }
    })
  }

  /** @param {number} now */
  function drawAim(now) {
    // held in a node: its unbuilt edges, faint; the one aimed at flashes green; refused, it pulses red (b4.3)
    const n = game.engulf
    if (n === null) return
    const aim = ui.select?.node === n ? ui.select.edge : -1
    for (const k of game.links[n]) {
      if (game.built[k] || k === aim) continue
      ctx.fillStyle = `rgba(${NODE},${0.3 + 0.15 * Math.sin(now * 4)})`
      for (const c of map.edges[k].path) px(c.x, c.y)
    }
    if (aim < 0) return
    const refused = now - ui.refusedAt < 0.7
    const a = refused ? 0.5 + 0.5 * Math.sin((now - ui.refusedAt) * Math.PI * 8) : 0.55 + 0.45 * Math.sin(now * 10)
    ctx.fillStyle = refused ? `rgba(255,40,40,${a})` : `rgba(90,200,120,${a})`
    for (const c of map.edges[aim].path) px(c.x, c.y)
  }

  /** Nodes (b4.22, the user): an orange bulb of pixels, still and dim, a 5 px plus under the fog (b4.32); the one
   * holding the bot beats, r 2–3, bright, over the fog (b4.27, the user). @param {number} now @param {boolean} held only the one holding the bot, else only the rest */
  function drawNodes(now, held) {
    map.nodes.forEach((n, i) => {
      const live = shown(game, i)
      if (!live && !game.railed[i]) return
      if ((game.engulf === i) !== held) return
      const r = held ? 2 + (Math.sin(now * 4) > 0.2 ? 1 : 0) : 1
      const [core, body, rim] = held ? BULB_HELD : BULB_DIM
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const d = dx * dx + dy * dy
          if (d > r * r + (held ? r : 0)) continue
          if (held) ctx.fillStyle = d <= 1 ? core : d <= r * r - r ? body : rim
          else ctx.fillStyle = d === 0 && live ? core : body // a buildable one keeps a lit heart
          px(n.x + dx, n.y + dy)
        }
    })
  }

  /** The spider bot at 1 px (D080): its pixel in its own colour, and a small halo so it's seen at every zoom. @param {{ x: number, y: number }} bot @param {number} now */
  function drawBot(bot, now) {
    const [x, y] = at(bot)
    const hr = Math.max(T * 3, 10 * dpr) * (1 + 0.08 * Math.sin(now * 5))
    const halo = ctx.createRadialGradient(x, y, 0, x, y, hr)
    halo.addColorStop(0, 'rgba(244,241,222,0.45)')
    halo.addColorStop(1, 'rgba(244,241,222,0)')
    ctx.fillStyle = halo
    ctx.fillRect(x - hr, y - hr, hr * 2, hr * 2)
    const s = Math.max(T, 2 * dpr)
    ctx.fillStyle = CHAR
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s))
  }

  /** @param {number} now */
  function drawRings(now) {
    const ringS = game.cfg.scan.ringTicks / 60
    while (rings.length && now - rings[0].s > ringS * RING_TRAIL) rings.shift()
    ctx.lineWidth = Math.max(1, dpr)
    for (const r of rings) {
      const a = 1 - (now - r.s) / (ringS * RING_TRAIL)
      ctx.strokeStyle = `rgba(230,230,255,${a})`
      ctx.beginPath()
      const [x, y] = at(r)
      ctx.arc(x, y, r.r * T, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  /** Dust from the pixel being pulled to the bot. @param {number} now */
  function drawStreams(now) {
    if (game.pulling && game.stillFor > 20) specks(game.pulling, botAt(game, 0), now, unitColor(game.pulling))
  }
  /** @param {Cell} from @param {Cell} to @param {number} now @param {string} color */
  function specks(from, to, now, color) {
    const [x0, y0] = at(from)
    const [x1, y1] = at(to)
    ctx.fillStyle = color
    const d = Math.hypot(x1 - x0, y1 - y0) / T
    for (let i = 0; i < 4; i++) {
      const t = (now * (12 / Math.max(4, d)) + i / 4) % 1
      const s = Math.max(T * 0.6, 2 * dpr)
      ctx.fillRect(x0 + (x1 - x0) * t - s / 2, y0 + (y1 - y0) * t - d * T * 0.15 * Math.sin(t * Math.PI) - s / 2, s, s)
    }
  }

  /** @param {number} now */
  function drawFlights(now) {
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i]
      const t = (now - f.s) / f.dur
      if (t < 0) continue // staggered: not yet
      if (t >= 1) {
        flights.splice(i, 1)
        continue
      }
      const [x0, y0] = f.from()
      const [x1, y1] = f.to()
      const e = t * t * (3 - 2 * t)
      const s = Math.max(T * 1.2, 4 * dpr) * (1 - t * 0.5)
      ctx.fillStyle = f.color
      ctx.fillRect(x0 + (x1 - x0) * e - s / 2, y0 + (y1 - y0) * e - Math.max(T * 4, 16 * dpr) * f.arc * Math.sin(t * Math.PI) - s / 2, s, s)
    }
  }

  return {
    draw,
    resize,
    onEvent,
    toWorld,
    level,
    tilePx: () => T,
    /** The bot on screen, CSS px. */
    botCss: () => {
      const [x, y] = at(botAt(game, 0))
      return { x: x / dpr, y: y / dpr }
    },
    dpr: () => dpr,
  }
}
