// b4's Canvas2D view (throwaway: rendering moves to PixiJS later, so nothing here is tuned). b3's look: the
// world 1 px per tile scaled up, b3's palette, b3's fog (never seen = black, seen = dim, lit = clear), the
// probe's rings. At b4.2 a tile is one v5 pixel (D080): the sheet, the space above it and the sea are drawn
// as v6 draws them, the sheet and space with no fog (scenery); the bot is its pixel with a halo, so it's
// seen; the zoom levels go down to 2 device px a tile; the textures change pixel by pixel, never whole
// (123k tiles: a whole repaint each step was too slow to play, not tuning).
// New: nodes glow (the network's, and the rest near the bot), built rails, the travel pods (cars), the spider bot, ore flying
// into the pack and out into a node, the ore count against an edge's price, and the build buttons in b3's
// cue style (a disc with its symbol cut out): a red X and a green hammer.

import { cellRgb } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'
import { count } from '../../sim/dig/pack.js'
import { drawPack, failAlpha, packLayout } from '../b3/render.js'
import { botAt, shown } from './game.js'
import { OPEN, ROCK, SHEET, SPACE } from './world.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./world.js').Cell} Cell */
/** @typedef {{ preview: number | null, select: { node: number, edge: number } | null, refusedAt: number }} Ui */

export const ZOOM_PX = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24] // tile sizes in device px
const AUTO_TILES = 100 // the default zoom: about this many tiles across the short side

const BG_RGB = [5, 5, 8]
const DIM_A = 0.65
const CHAR = '#f4f1de'
const NODE = [255, 200, 40]
const RAIL = '#d8d8e0'
const CAR = '#e6a03c'
const ORE = 'rgb(236,164,40)'
const GREEN = '#5ac878'
const RED = '#ff2828'
const RING_TRAIL = 4
const PACK_TP = 44 // the pack is drawn as b3's character's at this many CSS px a tile
const PACK_FIT = 0.75 // b3's view.packFit

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
    if (scenic(i)) timg.data.set(map.scenery.subarray(i * 4, i * 4 + 4), i * 4)
    else timg.data.set([...cellRgb(/** @type {any} */ (world.tiles[i])), 255], i * 4)
  }
  const lit = new Uint8Array(w * h)
  const DIM = Math.round(DIM_A * 255)
  /** @param {number} i */
  const paintFogAt = (i) => {
    fimg.data[i * 4 + 3] = lit[i] || unfogged(i) ? 0 : game.seen[i] ? DIM : 255
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
  /** @type {{ from: Cell, to: Cell, s: number, dur: number, color: string }[]} */
  const flights = []

  /** @param {import('./game.js').GameEvent} e @param {number} now seconds */
  function onEvent(e, now) {
    if (e.type === 'seen') e.cells.forEach(fogChanged)
    else if (e.type === 'pulled') {
      const i = e.y * w + e.x
      paintTile(i)
      tctx.putImageData(timg, 0, 0, e.x, e.y, 1, 1)
      flights.push({ from: { x: e.x, y: e.y }, to: e.to, s: now, dur: 0.45, color: e.tile === Tile.Ore ? ORE : 'rgb(64,232,214)' })
    } else if (e.type === 'fed') {
      flights.push({ from: e.from, to: map.nodes[e.node], s: now, dur: 0.35, color: ORE })
    } else if (e.type === 'ring') rings.push({ x: e.x, y: e.y, r: e.r, s: now })
  }

  /** Where the build buttons are, in tiles (centres): the X over the node, the hammer along the edge, a thumb apart on screen. */
  function buttons() {
    const s = ui.select
    if (!s) return null
    const e = map.edges[s.edge]
    const p = e.a === s.node ? e.path : [...e.path].reverse()
    const k = Math.min(p.length - 1, Math.round((56 * dpr) / T))
    const n = map.nodes[s.node]
    return { cancel: { x: n.x + 0.5, y: n.y + 0.5 - (48 * dpr) / T }, build: { x: p[k].x + 0.5, y: p[k].y + 0.5 } }
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
    for (let x = x0; x < W; x += w * T) ctx.drawImage(fog, 0, 0, w, h, x, sy(0), w * T, h * T)
    drawRails(now) // over the fog: you built them, and a glowing edge shows where it would go
    drawNodes(now)
    drawCars(bot)
    if (!game.ride) drawBot(bot, now)
    drawRings(now)
    drawStreams(now)
    drawFlights(now)
    drawButtons(now)
    drawHud(now)
  }

  /** A path through tile centres. @param {Cell[]} p */
  function pathLine(p) {
    ctx.beginPath()
    let [x, y] = at(p[0])
    ctx.moveTo(x, y)
    for (let i = 1; i < p.length; i++) {
      const [nx, ny] = at(p[i])
      // across the wrap: start again on the near side
      if (Math.abs(nx - x) > T * 2) ctx.moveTo(nx, ny)
      else ctx.lineTo(nx, ny)
      x = nx
      y = ny
    }
  }

  /** @param {number} now */
  function drawRails(now) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    map.edges.forEach((e, i) => {
      if (!game.built[i]) return
      pathLine(e.path)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = Math.max(T * 0.9, 4 * dpr)
      ctx.stroke()
      ctx.strokeStyle = RAIL
      ctx.lineWidth = Math.max(T * 0.45, 2 * dpr)
      ctx.stroke()
    })
    // the edges of the node held, or the one selected, over the fog: they glow (D079)
    const glow = (/** @type {number} */ i, /** @type {number} */ a, /** @type {number} */ wd) => {
      pathLine(map.edges[i].path)
      ctx.strokeStyle = `rgba(${NODE},${a})`
      ctx.lineWidth = Math.max(T, 4 * dpr) * wd * 2
      ctx.stroke()
    }
    const pulse = 0.55 + 0.25 * Math.sin(now * 6)
    if (ui.preview !== null)
      map.edges.forEach((e, i) => !game.built[i] && (e.a === ui.preview || e.b === ui.preview) && glow(i, pulse, 0.3))
    if (game.building) glow(game.building.edge, 0.9, 0.35)
    if (ui.select) glow(ui.select.edge, 0.95, 0.4)
  }

  /** @param {number} now */
  function drawNodes(now) {
    map.nodes.forEach((n, i) => {
      if (!shown(game, i)) return
      const [x, y] = at(n)
      const busy = ui.preview === i || ui.select?.node === i
      const r = Math.max(T * 0.7, 3.5 * dpr) * (busy ? 1.4 : 1) * (1 + 0.12 * Math.sin(now * 4 + i))
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
      halo.addColorStop(0, `rgba(${NODE},0.55)`)
      halo.addColorStop(1, `rgba(${NODE},0)`)
      ctx.fillStyle = halo
      ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6)
      ctx.fillStyle = `rgb(${NODE})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  /** @param {{ x: number, y: number }} bot */
  function drawCars(bot) {
    game.cars.forEach((c, i) => {
      const riding = game.ride?.car === i
      const p = riding ? bot : map.nodes[c.node]
      const [x, y] = at(p)
      const cw = Math.max(T * 3, 14 * dpr)
      const ch = cw * 0.7
      ctx.fillStyle = '#000'
      ctx.fillRect(x - cw / 2 - 2, y - ch / 2 - 2, cw + 4, ch + 4)
      ctx.fillStyle = CAR
      ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch)
      ctx.fillStyle = riding ? CHAR : '#3a2a14'
      ctx.fillRect(x - cw / 4, y - ch / 4, cw / 2, ch / 3) // the window: you, when you're in
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

  /** Dust from the tile being pulled to the bot, and from the bot into the node being fed. @param {number} now */
  function drawStreams(now) {
    const bot = { x: game.ch.x, y: game.ch.y }
    if (game.pulling && game.stillFor > 20) specks(game.pulling, bot, now, ORE)
    if (game.building) specks(bot, map.nodes[game.building.from], now, ORE)
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
      if (t >= 1) {
        flights.splice(i, 1)
        continue
      }
      const [x0, y0] = at(f.from)
      const [x1, y1] = at(f.to)
      const s = Math.max(T * 1.2, 4 * dpr) * (1 - t * 0.5)
      ctx.fillStyle = f.color
      ctx.fillRect(x0 + (x1 - x0) * t - s / 2, y0 + (y1 - y0) * t - Math.max(T * 4, 16 * dpr) * Math.sin(t * Math.PI) - s / 2, s, s)
    }
  }

  /** b3's cue style: a disc with the symbol cut out of it. @param {number} now */
  function drawButtons(now) {
    const b = buttons()
    if (!b) return
    const r = Math.max(T * 0.6, 20 * dpr)
    const refused = now - ui.refusedAt < 0.7 && Math.sin((now - ui.refusedAt) * Math.PI * 8) > 0
    disc(b.cancel, r, RED, (u) => {
      ctx.lineWidth = u * 0.32
      ctx.beginPath()
      ctx.moveTo(-u * 0.6, -u * 0.6)
      ctx.lineTo(u * 0.6, u * 0.6)
      ctx.moveTo(u * 0.6, -u * 0.6)
      ctx.lineTo(-u * 0.6, u * 0.6)
      ctx.stroke()
    })
    disc(b.build, r, refused ? RED : GREEN, (u) => {
      // a hammer: the handle up to the right, the head across its top
      ctx.rotate(-Math.PI / 4)
      ctx.fillRect(-u * 0.14, -u * 0.2, u * 0.28, u * 1.1)
      ctx.fillRect(-u * 0.7, -u * 0.75, u * 1.4, u * 0.5)
    })
  }
  /** @param {{ x: number, y: number }} c @param {number} r @param {string} color @param {(u: number) => void} symbol */
  function disc(c, r, color, symbol) {
    ctx.save()
    ctx.translate(sx(c.x), sy(c.y))
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgb(${BG_RGB})`
    ctx.strokeStyle = `rgb(${BG_RGB})`
    ctx.lineCap = 'round'
    symbol(r * 0.62)
    ctx.restore()
  }

  /**
   * The pack as b3.7 draws it (b4.2, D080): 2 × 3 slots, each a 4 × 4 grid filling from the bottom, the
   * reserved ore and loot slots first; the bot is 1 px, so it's at the top of the screen, the size of b3's
   * character at a middle zoom, not on its back. Under it, the ore against an edge's price: green when
   * there's enough. A refused build blinks it red, as b3's pack did.
   * @param {number} now
   */
  function drawHud(now) {
    const tp = Math.round(PACK_TP * dpr)
    const bh = Math.round(tp * 1.3) // b3's BODY_H
    const rows = Math.ceil(game.cfg.packSlots / 2)
    const pw = packLayout(tp, bh, rows, PACK_FIT).x.len
    const cx = Math.round(W / 2 + pw / 2)
    const top = Math.round(10 * dpr)
    const f = (now - ui.refusedAt) / 0.7
    const pack = /** @type {any} */ ({ ...game, ch: { facing: 1 } }) // drawn facing right: slot 1 bottom left
    ctx.fillStyle = '#000'
    ctx.fillRect(cx - pw - 2 * dpr, top - dpr, pw + 4 * dpr, Math.round(PACK_FIT * bh) + 2 * dpr)
    drawPack(ctx, pack, /** @type {any} */ ({ packFit: PACK_FIT }), cx, top + bh - 1, 0, bh, tp, CHAR, f >= 0 && f < 1 ? failAlpha(f) : 0)
    const ore = count(game.pack, Tile.Ore)
    const price = game.cfg.price
    const y = top + Math.round(PACK_FIT * bh) + 3 * dpr
    const bw = Math.round(pw)
    const bhh = Math.max(3, Math.round(3 * dpr))
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(cx - pw, y, bw, bhh)
    ctx.fillStyle = ore >= price ? GREEN : ORE
    ctx.fillRect(cx - pw, y, Math.round((bw * Math.min(ore, price)) / Math.max(1, price)), bhh)
  }

  return {
    draw,
    resize,
    onEvent,
    toWorld,
    buttons,
    level,
    tilePx: () => T,
    dpr: () => dpr,
  }
}
