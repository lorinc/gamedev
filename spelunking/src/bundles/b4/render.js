// b4's Canvas2D view (throwaway: rendering moves to PixiJS later, so nothing here is tuned). b3's look: the
// world 1 px per tile scaled up, b3's palette, b3's fog (never seen = black, seen = dim, lit = clear), the
// probe's rings. At b4.2 a tile is one v5 pixel (D080): the sheet, the space above it and the sea are drawn
// as v6 draws them, the sheet and space with no fog (scenery); the bot is its pixel with a halo, so it's
// seen; the zoom levels go down to 2 device px a tile; the textures change pixel by pixel, never whole
// (123k tiles: a whole repaint each step was too slow to play, not tuning).
// New: nodes glow (the network's, and the rest near the bot), built rails, the travel pods (cars), the spider
// bot, ore flying to the bot as it's pulled. b4.3: the light fades out over its last EDGE px (drawing only);
// the ledger, a column in the top-right corner (ore, loot, bugs); the selected edge flashes green, a refused
// build pulses it red, a build streams ore from the ledger's ore icon to the site; tamed bugs at work (warm
// dots) and their hauls flying to the ledger's icons.

import { cellRgb } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'
import { drawBugs } from '../b3/render.js'
import { botAt, shown } from './game.js'
import { OPEN, ROCK, SHEET, SPACE } from './world.js'
import { ledgerKinds } from './ledger.js'

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
const LOOT = 'rgb(64,232,214)'
const BUG = [255, 190, 90] // tamed: amber (D059)
const RING_TRAIL = 4
const EDGE = 3 // px over which the light fades out

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
      // yours flies to you (and counts on the ledger: no stream to it, the user); a bug's to the bug
      fly(cell(e), cell(e.to), now, e.type === 'pulled' ? 0.45 : 0.3, e.tile === Tile.Ore ? ORE : LOOT, e.type === 'pulled' ? 1 : 0.2)
    } else if (e.type === 'ring') rings.push({ x: e.x, y: e.y, r: e.r, s: now })
    else if (e.type === 'nibble') fly(icon('ore'), cell(e), now, 0.5, ORE, 0)
    else if (e.type === 'tamed') fly(cell(e), icon('bugs'), now, 0.9, `rgb(${BUG})`, 0)
    else if (e.type === 'haul') {
      for (let k = 0; k < Math.min(e.ore, 12); k++) fly(cell(e), icon('ore'), now + k * 0.06, 0.9, ORE, 0)
      for (let k = 0; k < Math.min(e.loot, 6); k++) fly(cell(e), icon('loot'), now + k * 0.08, 0.9, LOOT, 0)
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
    const counts = { ore: L.ore, loot: L.loot, bugs: L.bugs }
    ctx.font = `bold ${Math.round(16 * dpr)}px monospace`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (const kind of ledgerKinds) {
      const [x, y] = ledgerIcon(kind)
      const r = 7 * dpr
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(x - 90 * dpr, y - 13 * dpr, 104 * dpr, 26 * dpr)
      if (kind === 'bugs') {
        const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8)
        halo.addColorStop(0, `rgba(${BUG},0.8)`)
        halo.addColorStop(1, `rgba(${BUG},0)`)
        ctx.fillStyle = halo
        ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4)
        ctx.fillStyle = `rgb(${BUG})`
        ctx.fillRect(x - r / 2, y - r / 2, r, r)
      } else {
        ctx.fillStyle = kind === 'ore' ? ORE : LOOT
        ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
      }
      ctx.fillStyle = kind === 'ore' && refused ? RED : CHAR
      ctx.fillText(String(counts[/** @type {'ore' | 'loot' | 'bugs'} */ (kind)]), x - 14 * dpr, y + dpr)
    }
  }

  /** Tamed bugs at work (b4.3): warm dots with a small halo, drawn over the fog (they're yours). @param {number} alpha */
  function drawSwarm(alpha) {
    const s = Math.max(T, 2 * dpr)
    const hr = Math.max(T * 2, 6 * dpr)
    for (const b of game.swarm) {
      const f = Math.min(1, (game.tick - b.movedAt + alpha) / Math.max(1, game.cfg.swarm.moveTicks))
      let dx = b.x - b.from.x
      if (Math.abs(dx) > 1) dx = -Math.sign(dx)
      const [x, y] = at({ x: b.from.x + dx * f, y: b.from.y + (b.y - b.from.y) * f })
      if (x < -hr || y < -hr || x > W + hr || y > H + hr) continue
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
    for (let x = x0; x < W; x += w * T) ctx.drawImage(fog, 0, 0, w, h, x, sy(0), w * T, h * T)
    drawRails(now) // over the fog: you built them, and a glowing edge shows where it would go
    drawNodes(now)
    drawCars(bot)
    if (!game.ride) drawBot(bot, now)
    drawRings(now)
    drawStreams(now)
    drawBugs(ctx, /** @type {any} */ (game), alpha, now, sx, sy, T) // b3.7's wild bugs (D056–D061)
    drawSwarm(alpha)
    drawFlights(now)
    drawPrice()
    drawLedger(now)
  }

  /** The selected edge's price, along it: green when the ledger has it, else red. */
  function drawPrice() {
    const s = ui.select
    if (!s) return
    const e = map.edges[s.edge]
    const p = e.path[e.a === s.node ? Math.floor(e.path.length * 0.6) : Math.floor(e.path.length * 0.4)]
    const [x, y] = at(p)
    const ok = game.ledger.ore >= game.cfg.price
    ctx.font = `bold ${Math.round(14 * dpr)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const label = `${game.cfg.price}`
    const bw = (label.length * 9 + 22) * dpr
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(x - bw / 2, y - 26 * dpr, bw, 20 * dpr)
    ctx.fillStyle = ORE
    ctx.fillRect(x - bw / 2 + 5 * dpr, y - 20 * dpr, 8 * dpr, 8 * dpr)
    ctx.fillStyle = ok ? GREEN : RED
    ctx.fillText(label, x + 6 * dpr, y - 15 * dpr)
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
    // the selected edge flashes green; refused, it pulses red (b4.3)
    if (ui.select) {
      const refused = now - ui.refusedAt < 0.7
      pathLine(map.edges[ui.select.edge].path)
      const a = refused ? 0.5 + 0.5 * Math.sin((now - ui.refusedAt) * Math.PI * 8) : 0.45 + 0.45 * Math.sin(now * 10)
      ctx.strokeStyle = refused ? `rgba(255,40,40,${a})` : `rgba(90,200,120,${a})`
      ctx.lineWidth = Math.max(T, 4 * dpr) * 0.9
      ctx.stroke()
    }
  }

  /** @param {number} now */
  function drawNodes(now) {
    map.nodes.forEach((n, i) => {
      if (!shown(game, i)) return
      const [x, y] = at(n)
      const busy = ui.preview === i || ui.select?.node === i
      const r = Math.max(T * 1.2, 5 * dpr) * (busy ? 1.4 : 1) * (1 + 0.12 * Math.sin(now * 4 + i))
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5)
      halo.addColorStop(0, `rgba(${NODE},0.4)`)
      halo.addColorStop(1, `rgba(${NODE},0)`)
      ctx.fillStyle = halo
      ctx.fillRect(x - r * 2.5, y - r * 2.5, r * 5, r * 5)
      // a ring, not a dot: at 1 px a tile a tamed bug is a warm dot too (b4.2)
      ctx.strokeStyle = `rgb(${NODE})`
      ctx.lineWidth = Math.max(2 * dpr, r * 0.4)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
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

  /** Dust from the pixel being pulled to the bot. @param {number} now */
  function drawStreams(now) {
    if (game.pulling && game.stillFor > 20) specks(game.pulling, { x: game.ch.x, y: game.ch.y }, now, ORE)
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
