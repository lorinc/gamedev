// b4's Canvas2D view (throwaway: rendering moves to PixiJS later, so nothing here is tuned). b3's look: the
// world 1 px per tile scaled up, b3's palette, b3's fog (never seen = black, seen = dim, lit = clear), the
// probe's rings. New: revealed nodes glow, built rails, the travel pods (cars), the spider bot, ore flying
// into the pack and out into a node, the ore count against an edge's price, and the build buttons in b3's
// cue style (a disc with its symbol cut out): a red X and a green hammer.

import { cellRgb } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'
import { count } from '../../sim/dig/pack.js'
import { botAt } from './game.js'

/** @typedef {import('./game.js').Game} Game */
/** @typedef {import('./world.js').Cell} Cell */
/** @typedef {{ preview: number | null, select: { node: number, edge: number } | null, refusedAt: number }} Ui */

export const ZOOM_PX = [10, 12, 14, 16, 18, 20, 24, 30, 36, 40, 48] // tile sizes in device px
const AUTO_TILES = 22 // the default zoom: about this many tiles across the short side

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
  let tilesDirty = true
  let fogDirty = true
  /** @type {number[]} */
  let litDrawn = []

  function paintTiles() {
    const img = tctx.createImageData(w, h)
    for (let i = 0; i < w * h; i++) img.data.set([...cellRgb(/** @type {any} */ (world.tiles[i])), 255], i * 4)
    tctx.putImageData(img, 0, 0)
    tilesDirty = false
  }
  function paintFog() {
    const img = fctx.createImageData(w, h)
    const lit = new Uint8Array(w * h)
    for (const i of game.lit) lit[i] = 1
    const a = Math.round(DIM_A * 255)
    for (let i = 0; i < w * h; i++) img.data.set([BG_RGB[0], BG_RGB[1], BG_RGB[2], lit[i] ? 0 : game.seen[i] ? a : 255], i * 4)
    fctx.putImageData(img, 0, 0)
    litDrawn = game.lit
    fogDirty = false
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
    if (e.type === 'seen') fogDirty = true
    else if (e.type === 'pulled') {
      tilesDirty = true
      flights.push({ from: { x: e.x, y: e.y }, to: e.to, s: now, dur: 0.45, color: e.tile === Tile.Ore ? ORE : 'rgb(64,232,214)' })
    } else if (e.type === 'fed') {
      flights.push({ from: e.from, to: map.nodes[e.node], s: now, dur: 0.35, color: ORE })
    } else if (e.type === 'ring') rings.push({ x: e.x, y: e.y, r: e.r, s: now })
  }

  /** Where the build buttons are, in tiles (centres): the X over the node, the hammer 3 tiles along the edge. */
  function buttons() {
    const s = ui.select
    if (!s) return null
    const e = map.edges[s.edge]
    const p = e.a === s.node ? e.path : [...e.path].reverse()
    const k = Math.min(p.length - 1, 3)
    const n = map.nodes[s.node]
    return { cancel: { x: n.x + 0.5, y: n.y - 1.1 }, build: { x: p[k].x + 0.5, y: p[k].y + 0.5 } }
  }

  /** CSS px → tiles (fractional, x wrapped). @param {number} cx @param {number} cy */
  function toWorld(cx, cy) {
    const x = (cx * dpr - W / 2) / T + cam.x
    return { x: ((x % w) + w) % w, y: (cy * dpr - H / 2) / T + cam.y }
  }

  /** @param {number} alpha @param {number} dt @param {number} now seconds */
  function draw(alpha, dt, now) {
    if (tilesDirty) paintTiles()
    if (fogDirty || litDrawn !== game.lit) paintFog()
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
      ctx.lineWidth = T * 0.45
      ctx.stroke()
      ctx.strokeStyle = RAIL
      ctx.lineWidth = T * 0.18
      ctx.stroke()
    })
    // the edges of the node held, or the one selected, over the fog: they glow (D079)
    const glow = (/** @type {number} */ i, /** @type {number} */ a, /** @type {number} */ wd) => {
      pathLine(map.edges[i].path)
      ctx.strokeStyle = `rgba(${NODE},${a})`
      ctx.lineWidth = T * wd
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
      if (!game.revealed[i]) return
      const [x, y] = at(n)
      const busy = ui.preview === i || ui.select?.node === i
      const r = T * (busy ? 0.42 : 0.3) * (1 + 0.12 * Math.sin(now * 4 + i))
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
      const cw = T * 1.1
      const ch = T * 0.8
      ctx.fillStyle = '#000'
      ctx.fillRect(x - cw / 2 - 2, y - ch / 2 - 2, cw + 4, ch + 4)
      ctx.fillStyle = CAR
      ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch)
      ctx.fillStyle = riding ? CHAR : '#3a2a14'
      ctx.fillRect(x - cw / 4, y - ch / 4, cw / 2, ch / 3) // the window: you, when you're in
    })
  }

  /** The spider bot: a pale body, four legs a side, scuttling while it moves. @param {{ x: number, y: number }} bot @param {number} now */
  function drawBot(bot, now) {
    const [x, y] = at(bot)
    const moving = !!game.step
    ctx.strokeStyle = CHAR
    ctx.lineWidth = Math.max(1, T * 0.08)
    for (let s = -1; s <= 1; s += 2)
      for (let l = 0; l < 4; l++) {
        const a = ((l - 1.5) * 0.45 + (moving ? Math.sin(now * 20 + l * 1.7 + s) * 0.25 : 0)) * s
        const ex = x + s * Math.cos(a) * T * 0.48
        const ey = y + Math.sin(a) * T * 0.4 + T * 0.1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo((x + ex) / 2 + s * T * 0.05, (y + ey) / 2 - T * 0.15)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
    ctx.fillStyle = CHAR
    ctx.beginPath()
    ctx.arc(x, y, T * 0.24, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgb(${BG_RGB})`
    ctx.fillRect(x + game.ch.facing * T * 0.08 - T * 0.04, y - T * 0.08, T * 0.08, T * 0.08) // an eye
  }

  /** @param {number} now */
  function drawRings(now) {
    const ringS = game.cfg.scan.ringTicks / 60
    while (rings.length && now - rings[0].s > ringS * RING_TRAIL) rings.shift()
    ctx.lineWidth = Math.max(1, T * 0.08)
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
      const t = (now * (3 / Math.max(1, d)) + i / 4) % 1
      const s = T * 0.12
      ctx.fillRect(x0 + (x1 - x0) * t - s / 2, y0 + (y1 - y0) * t - T * 0.6 * Math.sin(t * Math.PI) * 0.4 - s / 2, s, s)
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
      const s = T * 0.3 * (1 - t * 0.5)
      ctx.fillStyle = f.color
      ctx.fillRect(x0 + (x1 - x0) * t - s / 2, y0 + (y1 - y0) * t - T * Math.sin(t * Math.PI) - s / 2, s, s)
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

  /** The ore you carry against an edge's price: a square per unit, filled as it comes. @param {number} now */
  function drawHud(now) {
    const ore = count(game.pack, Tile.Ore)
    const price = game.cfg.price
    const s = Math.round(12 * dpr)
    const gap = Math.round(3 * dpr)
    const n = Math.max(price, ore)
    const x0 = Math.round(W / 2 - (n * (s + gap)) / 2)
    const y0 = Math.round(12 * dpr)
    const red = now - ui.refusedAt < 0.7
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i < ore ? ORE : red ? 'rgba(255,40,40,0.5)' : 'rgba(255,255,255,0.15)'
      ctx.fillRect(x0 + i * (s + gap), y0, s, s)
    }
    if (ore >= price) {
      ctx.fillStyle = GREEN
      ctx.fillRect(x0 - gap, y0 + s + gap, n * (s + gap) + gap, Math.max(2, dpr * 2)) // enough for an edge
    }
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
