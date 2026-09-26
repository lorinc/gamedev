// Canvas2D view of the game: the world as a 1-px-per-tile canvas scaled up with nearest-neighbour,
// a camera that follows with lookahead, the character with the backpack on its back, debris and the
// charge ring, the swipe cue (a white disc beside the character showing what it attempts; red when
// refused) and the red "can't do" flash of the pack when an action is refused for lack of rock or pack space.
// Darkness (D052): a fog canvas, 1 px per tile like the world's, over the world and the planks: never
// seen is opaque background, seen but not lit now is the background at 65% (about 35% brightness),
// lit now is clear. Whole tiles, a hard edge. It changes only on `seen` events and when `game.lit` does.
// The probe (D053): thin circles over the fog around the cell it spreads from, the newest ring solid and
// the ones before it fading out; they fade on for a moment after it ends.
// Moon bugs (D056, D059, D060, D061): a small square with a soft halo, over the fog (they're lights), so
// they show even where nothing is seen yet; only the ones on screen are drawn. Wild ones are cool blue
// and go between a flicker (3–5 s) and dark (5–9 s, not drawn at all), steady next to you, flickering
// fast while scared; while on, they show the cave 2 around them through the fog, fading out from the
// bug (a radial gradient, not whole tiles), for the moment only (their light never makes anything
// seen). Tamed ones are warm amber and glow steadily: in the bar they roam round you, placed they
// hover at their den; a full one's halo swells (D063). They drift between cells and bob a little. The
// bug bar: b1.1's slot row along the bottom edge, a tamed bug per slot. A dust stream flows from the
// cell a pull takes to you or the placed bug pulling it (D063).

import { cellRgb, TILE_RGB, TREAD } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'
import { PROBE } from '../../sim/dig/probe.js'
import { litCells } from '../../sim/dig/light.js'
import { wrap } from '../../sim/dig/rules.js'
import { FLIGHT_S, HEART_S } from './juice.js'
import { AUTO_TILES, ZOOM_PX } from './tunables.js'

/** @typedef {import('../../sim/dig/game.js').Game} Game */
/** @typedef {import('./tunables.js').Tunables} Tunables */
/** @typedef {ReturnType<import('./juice.js').createJuice>} Juice */

const BG_RGB = [5, 5, 8]
const BG = `rgb(${BG_RGB})`
const DIM_A = 0.65 // the fog's alpha over seen cells that aren't lit now
const DIM = `rgba(${BG_RGB},${DIM_A})`
const BEDROCK = '#000'
const CHAR = '#f4f1de'
const FELL = '#ff5a5a' // the character at the bottom of a deep fall
const HOME = '#e6a03c' // the home pod: you walk back to it (D055)
const FAIL_S = 0.7 // seconds the red "can't do" flash of the pack lasts
const CUE_S = 0.6 // seconds the swipe cue takes to fade out
const BODY_H = 1.3 // the character's drawn height, in tiles (1 in the sim)
const RING_TRAIL = 4 // probe rings drawn: the newest and the ones before it, fading out over this many rings' time
const WILD = [150, 190, 255] // a wild bug: cool
const TAMED = /** @type {const} */ ([255, 196, 90]) // a tamed bug: warm (user, 2026-09-26)
const HEART = '#ff7aa0'
const WILD_LIGHT = 2 // a wild bug's light radius, for the moment it's on (D060)
const WILD_FADE = 2.5 // its light fades from full at the bug to nothing this many tiles out
const STREAM_WAIT = 30 // ticks you stand still before your pull's dust stream shows (short stops don't flicker it)
const DUST_SPEED = 3 // tiles / s a speck of dust flows
// a heart, in pixels
const HEART_PX = ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..']
/** @typedef {'walk' | 'build' | 'mine'} CueKind the symbol: an arrow, stairs, a pickaxe */

/** @param {import('../../render/palette.js').Rgb} c */
const css = ([r, g, b]) => `rgb(${r},${g},${b})`

/** @param {HTMLCanvasElement} canvas @param {Game} game @param {Tunables} t @param {Juice} juice */
export function createRenderer(canvas, game, t, juice) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }))
  const { world } = game

  const tex = document.createElement('canvas')
  tex.width = world.w
  tex.height = world.h
  const tctx = /** @type {CanvasRenderingContext2D} */ (tex.getContext('2d'))
  const img = tctx.createImageData(world.w, world.h)
  // a plank's cell shows what's around it: sky above the surface (home stands on it), else open
  const cell = (/** @type {number} */ x, /** @type {number} */ y) => {
    const t = /** @type {Tile} */ (world.tiles[y * world.w + x])
    return t === Tile.Plank && y <= game.home.y ? TILE_RGB[Tile.Sky] : cellRgb(t)
  }
  for (let i = 0; i < world.tiles.length; i++) img.data.set([...cell(i % world.w, Math.trunc(i / world.w)), 255], i * 4)
  tctx.putImageData(img, 0, 0)
  /** Cells (y * w + x) holding a plank, kept in step with setTile: drawing the treads scans these, not the view. */
  const planks = new Set()
  for (let i = 0; i < world.tiles.length; i++) if (world.tiles[i] === Tile.Plank) planks.add(i)

  // The fog (D052), only with light in the config: without it (a Rule Lab ruleset) no fog at all.
  const fog = game.seen ? document.createElement('canvas') : null
  const fctx = fog && /** @type {CanvasRenderingContext2D} */ (fog.getContext('2d'))
  /** 1 = the fog is clear there: the cell was in the `lit` last drawn. */
  const litNow = new Uint8Array(game.seen ? world.w * world.h : 0)
  /** The `lit` list the fog was last updated from; the sim replaces it when it changes. */
  let litDrawn = game.lit
  if (fog && fctx && game.seen) {
    fog.width = world.w
    fog.height = world.h
    for (const i of game.lit) litNow[i] = 1
    // built from the state, not events: createGame lit and revealed before this renderer existed
    const fimg = fctx.createImageData(world.w, world.h)
    const a = Math.round(DIM_A * 255)
    for (let i = 0; i < game.seen.length; i++)
      fimg.data.set([BG_RGB[0], BG_RGB[1], BG_RGB[2], litNow[i] ? 0 : game.seen[i] ? a : 255], i * 4)
    fctx.putImageData(fimg, 0, 0)
    fctx.fillStyle = DIM
  }
  /** Fog over a cell: dim (seen, not lit now) or clear (lit now). @param {number} i @param {boolean} lit */
  const fogCell = (i, lit) => {
    if (!fctx) return
    const x = i % world.w
    const y = (i - x) / world.w
    fctx.clearRect(x, y, 1, 1)
    if (!lit) fctx.fillRect(x, y, 1, 1)
  }
  // `lit` changed: clear the cells that joined it, dim the ones that left (both lists are sorted)
  function relight() {
    const a = litDrawn
    const b = game.lit
    let j = 0
    let k = 0
    while (j < a.length || k < b.length) {
      if (k >= b.length || (j < a.length && a[j] < b[k])) {
        litNow[a[j]] = 0
        fogCell(a[j++], false)
      } else if (j >= a.length || b[k] < a[j]) {
        litNow[b[k]] = 1
        fogCell(b[k++], true)
      } else {
        j++
        k++
      }
    }
    litDrawn = b
  }

  let dpr = 1
  let tilePx = 16
  const cam = { x: game.ch.x + 0.5, y: game.ch.y + 0.5 }
  /** Seconds left of the pack's red flash. */
  let failLeft = 0
  /** The swipe cue: what the character attempts, which way, refused or not, seconds left. */
  let cue = { dx: 0, dy: 0, kind: /** @type {CueKind} */ ('walk'), refused: false, question: false, left: 0 }
  /** The probe's rings as last drawn; age: seconds since ring r came, so they keep fading after the probe ends. */
  const rings = { x: 0, y: 0, r: 0, age: Infinity }
  /** Per wild bug: the cells its light shows, for the cell and world it was computed for. @type {Map<number, { key: string, cells: number[] }>} */
  const wildLit = new Map()
  // a wild bug's light (D061 follow-up): one scratch canvas and one gradient, remade only when the zoom
  // changes, and one 5×5 px mask for its lit cells. The gradient is built round (0, 0) and moved with
  // setTransform, so it serves every bug.
  const scratch = {
    canvas: document.createElement('canvas'),
    ctx: /** @type {CanvasRenderingContext2D | null} */ (null),
    tp: 0,
    fade: /** @type {CanvasGradient | null} */ (null),
    maskCanvas: document.createElement('canvas'),
    maskCtx: /** @type {CanvasRenderingContext2D | null} */ (null),
    mask: /** @type {ImageData | null} */ (null),
  }
  scratch.maskCanvas.width = scratch.maskCanvas.height = 2 * WILD_LIGHT + 1
  scratch.maskCtx = /** @type {CanvasRenderingContext2D} */ (scratch.maskCanvas.getContext('2d'))
  scratch.mask = scratch.maskCtx.createImageData(2 * WILD_LIGHT + 1, 2 * WILD_LIGHT + 1)
  /** The scratch, sized for tile px tp; its side in px. @param {number} tp */
  function scratchFor(tp) {
    const side = (2 * WILD_LIGHT + 1) * tp
    if (scratch.tp !== tp) {
      scratch.canvas.width = scratch.canvas.height = side
      scratch.ctx = /** @type {CanvasRenderingContext2D} */ (scratch.canvas.getContext('2d'))
      scratch.ctx.imageSmoothingEnabled = false
      const fade = scratch.ctx.createRadialGradient(0, 0, 0, 0, 0, WILD_FADE * tp)
      fade.addColorStop(0, 'rgba(0,0,0,1)')
      fade.addColorStop(0.45, 'rgba(0,0,0,0.6)')
      fade.addColorStop(1, 'rgba(0,0,0,0)')
      scratch.fade = fade
      scratch.tp = tp
    }
    return side
  }
  /** The zoom setting tilePx was last set from (the camera keeps its world centre, so zooming is centred on the character). */
  let zoomSeen = NaN

  /** The zoom level shown: the setting, or the default (the level closest to AUTO_TILES across the short side). */
  function level() {
    const z = t.view.zoom
    if (z >= 0) return Math.min(Math.round(z), ZOOM_PX.length - 1)
    const want = Math.min(canvas.width, canvas.height) / AUTO_TILES
    let best = 0
    for (let i = 1; i < ZOOM_PX.length; i++) if (Math.abs(ZOOM_PX[i] - want) < Math.abs(ZOOM_PX[best] - want)) best = i
    return best
  }

  function resize() {
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(window.innerWidth * dpr)
    canvas.height = Math.round(window.innerHeight * dpr)
    tilePx = ZOOM_PX[level()]
    zoomSeen = t.view.zoom
  }
  resize()

  return {
    resize,
    level,
    /** @param {number} x @param {number} y */
    setTile(x, y) {
      tctx.fillStyle = css(cell(x, y))
      tctx.fillRect(x, y, 1, 1)
      const i = y * world.w + x
      if (world.tiles[i] === Tile.Plank) planks.add(i)
      else planks.delete(i)
    },
    /** Cells seen for the first time (a `seen` event): dim, unless the fog is already clear there. @param {number[]} cells */
    seen(cells) {
      for (const i of cells) if (!litNow[i]) fogCell(i, false)
    },
    /** Snap the camera to the character (after a teleport). */
    snap() {
      cam.x = game.ch.x + 0.5
      cam.y = game.ch.y + 0.5
    },
    /** Flash the pack red: "can't do" for lack of ore or pack room. */
    fail() {
      failLeft = FAIL_S
    },
    /**
     * Show the swipe cue: what the character attempts in direction (dx, dy). refused: red. question: a run
     * stopped on its own: the disc shows just "?" (D034).
     */
    attempt(/** @type {number} */ dx, /** @type {number} */ dy, /** @type {CueKind} */ kind, refused = false, question = false) {
      cue = { dx, dy, kind, refused, question, left: CUE_S }
    },
    info: () => ({ dpr, tilePx, w: canvas.width, h: canvas.height }),
    /**
     * @param {number} alpha 0..1 into the next tick
     * @param {number} dt seconds since the last frame
     * @param {number} time seconds
     * @param {{ p: number, x: number | null, y: number | null } | null} charge at the pointer, or at the character
     */
    draw(alpha, dt, time, charge) {
      if (t.view.zoom !== zoomSeen) {
        tilePx = ZOOM_PX[level()]
        zoomSeen = t.view.zoom
      }
      const W = canvas.width
      const H = canvas.height
      const tp = tilePx
      const viewW = W / tp
      const viewH = H / tp

      // Camera: lerp toward the character plus lookahead along the intent, frame-rate independent.
      const p = charPos(game, alpha)
      const px = nearest(p.x, cam.x - 0.5, world.w)
      const run = game.run
      const tx = px + 0.5 + (run ? run.dx * t.view.lookahead : 0)
      const ty = p.y + 0.5 + (run ? run.dy * t.view.lookahead : 0)
      const k = 1 - Math.pow(1 - t.view.camLerp, dt * 60)
      cam.x += (tx - cam.x) * k
      cam.y += (ty - cam.y) * k
      cam.y = Math.min(Math.max(cam.y, viewH / 2 - 3), world.h + 2 - viewH / 2)
      if (cam.x > world.w * 2 || cam.x < -world.w) cam.x = wrap(cam.x, world.w) // keep floats small

      const shake = juice.shakeOffset(time)
      const left = cam.x - viewW / 2 + shake.x
      const top = cam.y - viewH / 2 + shake.y
      // everything is drawn relative to whole tiles, offset by whole device pixels: crisp edges
      const ix = Math.floor(left)
      const iy = Math.floor(top)
      const ox = Math.round((ix - left) * tp)
      const oy = Math.round((iy - top) * tp)
      // tile coords → device px
      const sx = (/** @type {number} */ x) => ox + (x - ix) * tp
      const sy = (/** @type {number} */ y) => oy + (y - iy) * tp

      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      const cols = Math.ceil(viewW) + 2
      const y0 = Math.max(0, iy)
      const y1 = Math.min(world.h, iy + Math.ceil(viewH) + 2)
      if (iy < 0) {
        ctx.fillStyle = css(TILE_RGB[Tile.Sky])
        ctx.fillRect(0, 0, W, sy(0))
      }
      if (y1 === world.h) {
        ctx.fillStyle = BEDROCK
        ctx.fillRect(0, sy(world.h), W, H)
      }
      // the world wraps: draw it in slices that don't cross x = 0
      for (let x = ix; x < ix + cols;) {
        const srcX = wrap(x, world.w)
        const n = Math.min(world.w - srcX, ix + cols - x)
        if (y1 > y0) ctx.drawImage(tex, srcX, y0, n, y1 - y0, sx(x), sy(y0), n * tp, (y1 - y0) * tp)
        x += n
      }
      // planks: a tread along the top of their (open) cell (D039)
      ctx.fillStyle = css(TILE_RGB[Tile.Plank])
      const tread = Math.max(2, Math.round(tp * TREAD))
      for (const i of planks) {
        const y = Math.trunc(i / world.w)
        if (y < y0 || y >= y1) continue
        // every copy of the plank's column in view (the world wraps)
        for (let x = ix + wrap((i % world.w) - ix, world.w); x < ix + cols; x += world.w) ctx.fillRect(sx(x), sy(y), tp, tread)
      }
      // the darkness (D052) over the world and the treads, sliced like the world; the sky above y = 0 stays lit
      if (fog) {
        if (game.lit !== litDrawn) relight()
        for (let x = ix; x < ix + cols;) {
          const srcX = wrap(x, world.w)
          const n = Math.min(world.w - srcX, ix + cols - x)
          if (y1 > y0) ctx.drawImage(fog, srcX, y0, n, y1 - y0, sx(x), sy(y0), n * tp, (y1 - y0) * tp)
          x += n
        }
      }

      // the probe's rings (D053)
      const probe = game.probe
      if (probe && (probe.r !== rings.r || probe.x !== rings.x || probe.y !== rings.y)) {
        rings.x = probe.x
        rings.y = probe.y
        rings.r = probe.r
        rings.age = 0
      } else rings.age += dt
      const ringS = Math.max(1, (game.cfg.probe ?? PROBE).ringTicks) / 60
      const fade = rings.age / ringS // rings' time since the newest came
      if (fade < RING_TRAIL) {
        const rx = sx(nearest(rings.x, px, world.w) + 0.5)
        const ry = sy(rings.y + 0.5)
        ctx.strokeStyle = CHAR
        ctx.lineWidth = Math.max(1, Math.round(tp / 14))
        for (let k = 0; k < RING_TRAIL && k < rings.r; k++) {
          const a = 1 - (k + fade) / RING_TRAIL
          if (a <= 0) break
          ctx.globalAlpha = a
          ctx.beginPath()
          ctx.arc(rx, ry, (rings.r - k) * tp, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }

      // a wild bug's light: the cave around it, over the fog, while it's on (never seen for good)
      for (const b of game.bugs) {
        if (b.kind !== 'wild') continue
        const bx = sx(nearest(b.x, px, world.w))
        const by = sy(b.y)
        if (bx < -3 * tp || by < -3 * tp || bx > W + 3 * tp || by > H + 3 * tp) continue // off screen (D061)
        const on = glow(b, game, time)
        if (on <= 0.02) continue
        const key = `${b.x},${b.y},${game.worldRev}`
        let cells = wildLit.get(b.id)
        if (cells?.key !== key) wildLit.set(b.id, (cells = { key, cells: litCells(world, b, WILD_LIGHT) }))
        // the 5×5 cells round it into the scratch, then two cuts: the lit cells as a 5×5 px mask scaled
        // up smoothly (its pixel centres on the cells' centres, so the set's edge fades over a tile), and
        // the gradient centred where the bug is drawn; then over the fog
        const side = scratchFor(tp)
        const sc = /** @type {CanvasRenderingContext2D} */ (scratch.ctx)
        const n = 2 * WILD_LIGHT + 1
        const alphas = /** @type {ImageData} */ (scratch.mask).data
        alphas.fill(0)
        for (const i of cells.cells) {
          const x = i % world.w
          alphas[((i - x) / world.w - b.y + WILD_LIGHT) * n * 4 + (wrapDelta(x - b.x, world.w) + WILD_LIGHT) * 4 + 3] = 255
        }
        ;/** @type {CanvasRenderingContext2D} */ (scratch.maskCtx).putImageData(/** @type {ImageData} */ (scratch.mask), 0, 0)
        sc.globalCompositeOperation = 'source-over'
        sc.clearRect(0, 0, side, side)
        for (let dy = -WILD_LIGHT; dy <= WILD_LIGHT; dy++) {
          const y = b.y + dy
          if (y < 0 || y >= world.h) continue
          for (let dx = -WILD_LIGHT; dx <= WILD_LIGHT; dx++) {
            sc.drawImage(tex, wrap(b.x + dx, world.w), y, 1, 1, (dx + WILD_LIGHT) * tp, (dy + WILD_LIGHT) * tp, tp, tp)
          }
        }
        sc.globalCompositeOperation = 'destination-in'
        sc.imageSmoothingEnabled = true
        sc.drawImage(scratch.maskCanvas, 0, 0, side, side)
        sc.imageSmoothingEnabled = false
        const at = drifted(b, game, alpha, time)
        sc.setTransform(1, 0, 0, 1, (wrapDelta(at.x - b.x, world.w) + WILD_LIGHT) * tp, (at.y - b.y + WILD_LIGHT) * tp)
        sc.fillStyle = /** @type {CanvasGradient} */ (scratch.fade)
        sc.fillRect(-2 * side, -2 * side, 4 * side, 4 * side)
        sc.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = on * 0.8
        ctx.drawImage(scratch.canvas, sx(nearest(b.x, px, world.w)) - WILD_LIGHT * tp, sy(b.y) - WILD_LIGHT * tp)
        ctx.globalAlpha = 1
      }
      if (wildLit.size > game.bugs.length) for (const id of wildLit.keys()) if (!game.bugs.some((b) => b.id === id)) wildLit.delete(id)
      drawBugs(ctx, game, alpha, time, (x) => sx(nearest(x, px, world.w)), sy, tp)

      // the dust streams (D063): from the cell a pull takes to you (once you've stood still a moment) or to
      // the placed bug pulling it
      const streamTo = (/** @type {import('../../sim/dig/rules.js').Cell} */ c, /** @type {number} */ x1, /** @type {number} */ y1) => {
        const x0 = nearest(c.x + 0.5, x1, world.w)
        drawStream(
          ctx,
          x0,
          c.y + 0.5,
          x1,
          y1,
          TILE_RGB[/** @type {Tile} */ (world.tiles[c.y * world.w + c.x])],
          c.y * world.w + c.x,
          time,
          sx,
          sy,
          tp,
        )
      }
      if (game.pulling && game.stillFor >= STREAM_WAIT) streamTo(game.pulling, px + 0.5, p.y + 0.35)
      for (const b of game.bugs) {
        if (!b.target) continue
        const at = drifted(b, game, alpha, time, false) // the bob's middle: a bobbing end would sway the whole arc
        streamTo(b.target, nearest(at.x, px, world.w), at.y)
      }

      // the pack's "can't do": two quick red blinks that fade
      failLeft = Math.max(0, failLeft - dt)
      const failA = failLeft > 0 ? failAlpha(1 - failLeft / FAIL_S) : 0

      // Home: a plain pod on the home cell, behind the character (D055: there's no teleport to it)
      ctx.fillStyle = HOME
      // 2 tiles wide, 1 tall, centred on the cell, so it shows from behind the character
      ctx.fillRect(Math.round(sx(nearest(game.home.x, px, world.w) - 0.5)), Math.round(sy(game.home.y)), Math.round(tp * 2), Math.round(tp))

      // Character: 1 tile in the sim, drawn ~1.3 tall. Squash on stops, a push while digging.
      const sq = juice.squash()
      const cw = tp * 0.7 * (1 + sq * 0.25)
      const chh = tp * BODY_H * (1 - sq * 0.2)
      let dig = 0
      if (p.digging && run) dig = Math.sin(time * 40) * 0.08 * tp
      const cx = sx(px + 0.5) + (run ? run.dx * dig : 0)
      const cy = sy(p.y + 1) + (run ? run.dy * dig : 0)
      // a deep fall: at the bottom, red, while the teleport charges (D036)
      const s = game.step
      const homing = s && s.home && s.hold ? Math.min(1, Math.max(0, (s.t + alpha - (s.dur - s.hold)) / s.hold)) : 0
      const body = homing > 0 ? FELL : CHAR
      ctx.fillStyle = body
      ctx.fillRect(Math.round(cx - cw / 2), Math.round(cy - chh), Math.round(cw), Math.round(chh))
      ctx.fillStyle = BG // an eye on the facing side, so direction reads
      const eye = Math.max(2, Math.round(tp * 0.14))
      ctx.fillRect(Math.round(cx + game.ch.facing * cw * 0.18 - eye / 2), Math.round(cy - chh * 0.75), eye, eye)
      drawPack(ctx, game, t.view, cx, cy, cw, chh, tp, body, failA)

      for (const c of juice.chunks) {
        ctx.fillStyle = c.color
        const s = Math.max(2, Math.round(tp * 0.18))
        ctx.fillRect(Math.round(sx(nearest(c.x, left, world.w))), Math.round(sy(c.y)), s, s)
      }

      // ore flying from the pack into a wild bug, and the hearts it pops (D056); ore or loot pulled out
      // of the wall flying to you (D062)
      const oreS = Math.max(2, Math.round(tp * 0.2))
      for (const f of juice.flights) {
        ctx.fillStyle = css(TILE_RGB[/** @type {Tile} */ (f.tile)])
        const k = Math.min(1, f.age / FLIGHT_S)
        const e = k * (2 - k) // eases out
        const x0 = nearest(f.x0, px, world.w)
        const x = x0 + (nearest(f.x1, x0, world.w) - x0) * e
        const y = f.y0 + (f.y1 - f.y0) * e - Math.sin(k * Math.PI) * 0.6 // a little arc
        ctx.fillRect(Math.round(sx(x) - oreS / 2), Math.round(sy(y) - oreS / 2), oreS, oreS)
      }
      const hp = Math.max(1, Math.round(tp / 12))
      ctx.fillStyle = HEART
      for (const h of juice.hearts) {
        if (h.age < 0) continue
        const k = h.age / HEART_S
        ctx.globalAlpha = 1 - k * k
        const hx = Math.round(sx(nearest(h.x, px, world.w)) - 2.5 * hp)
        const hy = Math.round(sy(h.y - k) - 5 * hp)
        HEART_PX.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) if (row[i] === 'x') ctx.fillRect(hx + i * hp, hy + j * hp, hp, hp)
        })
      }
      ctx.globalAlpha = 1

      cue.left = Math.max(0, cue.left - dt)
      if (cue.left > 0) {
        // one step out from the drawn body, in the swipe's direction: beside, above, below or diagonal
        const d = tp * 1.15
        drawCue(ctx, cx + cue.dx * d, cy - chh / 2 + cue.dy * d, Math.max(9 * dpr, tp * 0.45), cue, cue.left / CUE_S)
      }

      if (game.cfg.bugs) drawBar(ctx, game, W, H, dpr)

      if (homing > 0) charge = { p: homing, x: null, y: null }
      if (charge && charge.p > 0) {
        const r = 28 * dpr
        ctx.strokeStyle = CHAR
        ctx.lineWidth = 4 * dpr
        ctx.beginPath()
        const rx = charge.x === null ? cx : charge.x * dpr
        const ry = charge.y === null ? cy - chh / 2 : charge.y * dpr
        ctx.arc(rx, ry, r, -Math.PI / 2, -Math.PI / 2 + charge.p * Math.PI * 2)
        ctx.stroke()
      }
    },
  }
}

/** A number in 0..1 from a bug id, its blink cycle and a salt. @param {number} id @param {number} n @param {number} k */
function hash01(id, n, k) {
  let h = Math.imul(id, 0x9e3779b1) ^ Math.imul(n + 1, 0x85ebca6b) ^ Math.imul(k + 1, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  return ((h ^ (h >>> 13)) >>> 0) / 2 ** 32
}

/** A wild bug's blink cycle n (D061): a flicker, then dark, lengths in seconds. @param {number} id @param {number} n */
const cycle = (id, n) => ({ flick: 3 + 2 * hash01(id, n, 0), dark: 5 + 4 * hash01(id, n, 1) })

/** Per wild bug: its current blink cycle and when it started (drawing only; renderers share it). @type {Map<number, { n: number, start: number }>} */
const blinks = new Map()

const FADE_S = 0.5 // a flicker fades in and out over this long

/**
 * How bright a bug is now, 0..1. Wild (D061): cycles of a flicker (fades in, 60–100% irregularly, fades
 * out) and dark (0), each length drawn anew per cycle from the bug's id, so they never sync; steady next
 * to you; flickering fast while scared. Tamed: a steady glow.
 * @param {import('../../sim/dig/bugs.js').Bug} b @param {Game} game @param {number} time seconds
 */
function glow(b, game, time) {
  if (b.kind !== 'wild') return 0.8 + 0.2 * Math.sin(time * 2 + b.id)
  if (game.tick < b.scared) return Math.sin(time * 30 + b.id) > 0 ? 0.9 : 0.2
  const dx = wrapDelta(b.x - game.ch.x, game.world.w)
  const dy = b.y - game.ch.y
  if (dx * dx + dy * dy <= 2) return 1
  let s = blinks.get(b.id)
  if (!s) {
    const c = cycle(b.id, 0)
    blinks.set(b.id, (s = { n: 0, start: time - hash01(b.id, 0, 2) * (c.flick + c.dark) })) // it starts mid-cycle
  }
  let c = cycle(b.id, s.n)
  while (time >= s.start + c.flick + c.dark) {
    s.start += c.flick + c.dark
    c = cycle(b.id, ++s.n)
  }
  const u = time - s.start
  if (u >= c.flick) return 0
  const fade = Math.min(1, u / FADE_S, (c.flick - u) / FADE_S)
  return fade * (0.8 + 0.2 * Math.sin(time * 7.3 + b.id) * Math.sin(time * 3.1 + b.id * 1.7))
}

/**
 * Where a bug is drawn, in tiles (its centre): between the cell it drifted from and its
 * cell, bobbing. They float in the upper part of their cell, fanned out, so two in one cell (or one
 * beside you) read apart. bob = false: the middle of its bob, which holds still (a dust stream's end, D063).
 * @param {import('../../sim/dig/bugs.js').Bug} b @param {Game} game @param {number} alpha @param {number} time seconds
 */
function drifted(b, game, alpha, time, bob = true) {
  const cfg = /** @type {NonNullable<Game['cfg']['bugs']>} */ (game.cfg.bugs)
  const move = Math.max(1, b.kind === 'bar' ? b.pace || cfg.barMoveTicks : cfg.moveTicks)
  const f = Math.min(1, Math.max(0, (game.tick + alpha - b.movedAt) / move))
  const fx = b.from.x + wrapDelta(b.x - b.from.x, game.world.w) * f
  return {
    x: fx + 0.5 + (bob ? Math.sin(time * 1.3 + b.id * 2.1) * 0.3 : 0),
    y: b.from.y + (b.y - b.from.y) * f + 0.2 - (b.id % 3) * 0.3 + (bob ? Math.cos(time * 1.7 + b.id) * 0.2 : 0),
  }
}

/**
 * The moon bugs (D056, D060, D062): between the cell they drifted from and their cell, bobbing.
 * @param {CanvasRenderingContext2D} ctx @param {Game} game @param {number} alpha @param {number} time seconds
 * @param {(x: number) => number} sx tile x → device px, the copy nearest the character
 * @param {(y: number) => number} sy @param {number} tp tile px
 */
function drawBugs(ctx, game, alpha, time, sx, sy, tp) {
  const cfg = game.cfg.bugs
  if (!cfg) return
  const core = Math.max(2, Math.round(tp * 0.3))
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  if (blinks.size > game.bugs.length) for (const id of blinks.keys()) if (!game.bugs.some((b) => b.id === id)) blinks.delete(id)
  for (const b of game.bugs) {
    const { x, y } = drifted(b, game, alpha, time)
    const cx = sx(x)
    const cy = sy(y)
    if (cx < -2 * tp || cy < -2 * tp || cx > W + 2 * tp || cy > H + 2 * tp) continue // off screen (D061)
    const on = glow(b, game, time)
    if (on <= 0) continue // dark: no dot, no halo
    const [r, g, bl] = b.kind === 'wild' ? WILD : TAMED
    // a placed bug that's full waits for you, its halo swelling slowly (D063)
    const full = b.kind === 'placed' && cfg.mine && b.carry >= cfg.mine.carry
    const hr = tp * (full ? 1.7 + 0.4 * Math.sin(time * 3 + b.id) : 1.1)
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr)
    halo.addColorStop(0, `rgba(${r},${g},${bl},${(full ? 0.5 : 0.35) * on})`)
    halo.addColorStop(1, `rgba(${r},${g},${bl},0)`)
    ctx.fillStyle = halo
    ctx.fillRect(cx - hr, cy - hr, hr * 2, hr * 2)
    ctx.fillStyle = `rgba(${r},${g},${bl},${0.15 + 0.85 * on})`
    ctx.fillRect(Math.round(cx - core / 2), Math.round(cy - core / 2), core, core)
  }
}

/**
 * A dust stream (D063): specks in the material's colour flowing from (x0, y0) to (x1, y1) along a slight
 * arc, fading in and out at the ends. Drawing only: where a speck is comes from the time, so there's no
 * particle state. Off screen, nothing is drawn.
 * @param {CanvasRenderingContext2D} ctx @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 tiles
 * @param {import('../../render/palette.js').Rgb} rgb @param {number} seed the stream's cell, so its arc and specks stay put
 * @param {number} time seconds @param {(x: number) => number} sx @param {(y: number) => number} sy @param {number} tp tile px
 */
function drawStream(ctx, x0, y0, x1, y1, rgb, seed, time, sx, sy, tp) {
  const ax = sx(x0)
  const ay = sy(y0)
  const bx = sx(x1)
  const by = sy(y1)
  const m = 2 * tp
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  if (Math.max(ax, bx) < -m || Math.min(ax, bx) > W + m || Math.max(ay, by) < -m || Math.min(ay, by) > H + m) return
  const len = Math.hypot(x1 - x0, y1 - y0)
  if (len < 0.1) return
  // the arc: a control point off the middle, to the side the seed picks
  const side = hash01(seed, 0, 3) < 0.5 ? -1 : 1
  const nx = (-(by - ay) / (len * tp)) * side
  const ny = ((bx - ax) / (len * tp)) * side
  const cx = (ax + bx) / 2 + nx * len * tp * 0.2
  const cy = (ay + by) / 2 + ny * len * tp * 0.2
  const n = Math.max(4, Math.round(len * 3))
  const T = len / DUST_SPEED + 0.2
  const size = Math.max(2, Math.round(tp * 0.1))
  ctx.fillStyle = css(rgb)
  for (let i = 0; i < n; i++) {
    const h = hash01(seed, i, 4)
    const u = (((time / T + (i + h * 0.6) / n) % 1) + 1) % 1
    const v = 1 - u
    const wob = Math.sin(time * 5 + i * 2.3) * tp * 0.08
    const x = v * v * ax + 2 * u * v * cx + u * u * bx + nx * wob
    const y = v * v * ay + 2 * u * v * cy + u * u * by + ny * wob
    ctx.globalAlpha = 0.8 * Math.sin(u * Math.PI)
    ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size)
  }
  ctx.globalAlpha = 1
}

// The bug bar (D060): b1.1's pack row, back as the only HUD. barSlots squares along the bottom edge,
// opaque, so the world behind never reads as a bug; a tamed bug is an amber square, an empty slot a
// grey dot.
/** @param {CanvasRenderingContext2D} ctx @param {Game} game @param {number} W @param {number} H @param {number} dpr */
function drawBar(ctx, game, W, H, dpr) {
  const slots = /** @type {NonNullable<Game['cfg']['bugs']>} */ (game.cfg.bugs).barSlots
  const s = Math.round(26 * dpr)
  const gap = Math.round(6 * dpr)
  const x0 = Math.round(W / 2 - (slots * (s + gap) - gap) / 2)
  const y = H - s - Math.round(14 * dpr)
  for (let i = 0; i < slots; i++) {
    const x = x0 + i * (s + gap)
    ctx.fillStyle = '#000'
    ctx.fillRect(x - dpr, y - dpr, s + 2 * dpr, s + 2 * dpr)
    const full = i < game.bar.length
    ctx.fillStyle = full ? css(TAMED) : '#333'
    const inset = full ? Math.round(7 * dpr) : s / 2 - dpr
    ctx.fillRect(x + inset, y + inset, s - 2 * inset, s - 2 * inset)
  }
}

/** A step in x, the short way round the wrap. @param {number} d @param {number} w */
const wrapDelta = (d, w) => d - w * Math.round(d / w)

// The backpack on the character's back (D038): 2 slots wide, filled bottom to top; each slot a 4×4
// grid of units filled row by row from the bottom. Mirrored with the facing: slot 1 is always at
// the bottom, on the outer side. Solid, in the body's colour, sunk into the body's back, so only
// the units stand out. Its top is 1 px below the body's top; it ends at least 1 px above the feet
// (else the character reads as a snail). About `view.packFit` of the body's height at every zoom:
// unit rows and columns differ by at most 1 px to get there (square units made the size jump with
// zoom). At tp ≤ 17 the slots touch (no body-coloured grid between them), which saves pixels.
// TODO (2026-09-25): zoomed out, the pack should scale up past the character's proportions to stay legible.
const PACK_COLS = 2
const SLOT_SIDE = 4 // √SLOT

/** n whole-pixel sizes adding up to total, as even as possible. @param {number} total @param {number} n */
const split = (total, n) => Array.from({ length: n }, (_, k) => Math.floor(((k + 1) * total) / n) - Math.floor((k * total) / n))

/**
 * Where each unit column or row starts along one axis, and its size.
 * @param {number[]} sizes one per unit @param {number} gap between slots
 */
function axis(sizes, gap) {
  const at = []
  let p = 0
  for (let k = 0; k < sizes.length; k++) {
    if (k && k % SLOT_SIDE === 0) p += gap
    at.push(p)
    p += sizes[k]
  }
  return { at, sizes, len: p }
}

/**
 * The pack's unit grid for a body `bh` px tall at tile size tp.
 * @param {number} tp @param {number} bh @param {number} slotRows @param {number} fit
 */
export function packLayout(tp, bh, slotRows, fit) {
  const gap = tp <= 17 ? 0 : Math.max(1, Math.round(tp / 40))
  const nx = PACK_COLS * SLOT_SIDE
  const ny = slotRows * SLOT_SIDE
  const gaps = (slotRows - 1) * gap
  const target = Math.min(bh - 2, Math.round(fit * bh)) - gaps // unit pixels available: 1 px free above and below
  const hy = Math.max(ny, target)
  return { x: axis(split(Math.max(nx, Math.round((hy * nx) / ny)), nx), gap), y: axis(split(hy, ny), gap) }
}

/** @type {{ key: string, layout: ReturnType<typeof packLayout> } | null} rebuilt only when the zoom, slots or fit change */
let packCache = null

/**
 * @param {CanvasRenderingContext2D} ctx @param {Game} game @param {Tunables['view']} view
 * @param {number} cx @param {number} cy the character's bottom centre, device px
 * @param {number} cw @param {number} chh its drawn width and height @param {number} tp tile px
 * @param {string} body the body's colour
 * @param {number} failA alpha of the red "can't do" flash over the pack, 0 = none
 */
function drawPack(ctx, game, view, cx, cy, cw, chh, tp, body, failA) {
  const f = game.ch.facing
  const slotRows = Math.ceil(game.cfg.packSlots / PACK_COLS)
  // sized by the unsquashed body, so a squash moves the pack but never resizes it
  const bh = Math.round(tp * BODY_H)
  const key = `${tp} ${bh} ${slotRows} ${view.packFit}`
  if (packCache?.key !== key) packCache = { key, layout: packLayout(tp, bh, slotRows, view.packFit) }
  const { x, y } = packCache.layout
  const w = x.len
  const h = y.len
  // its inner edge sits 40% of the way into the body; its top 1 px below the body's
  const inner = cx - f * (cw / 2 - cw * 0.4)
  const x0 = Math.round(f > 0 ? inner - w : inner)
  const y0 = Math.round(cy - chh) + 1
  // local x runs from the outer edge toward the body
  const fill = (/** @type {number} */ lx, /** @type {number} */ ly, /** @type {number} */ lw, /** @type {number} */ lh) =>
    ctx.fillRect(f > 0 ? x0 + lx : x0 + w - lx - lw, y0 + ly, lw, lh)
  ctx.fillStyle = body
  fill(0, 0, w, h)
  for (let i = 0; i < game.cfg.packSlots; i++) {
    const slot = game.pack[i]
    if (!slot) continue
    const col0 = (i % PACK_COLS) * SLOT_SIDE
    const row0 = (slotRows - 1 - Math.floor(i / PACK_COLS)) * SLOT_SIDE // slot 1 at the bottom
    ctx.fillStyle = css(TILE_RGB[/** @type {Tile} */ (slot.tile)])
    for (let k = 0; k < slot.n; k++) {
      const c = col0 + (k % SLOT_SIDE)
      const r = row0 + SLOT_SIDE - 1 - Math.floor(k / SLOT_SIDE)
      fill(x.at[c], y.at[r], x.sizes[c], y.sizes[r])
    }
  }
  if (failA > 0) {
    ctx.fillStyle = `rgba(255,40,40,${failA})`
    fill(-1, -1, w + 2, h + 2)
  }
}

// The swipe cue: an opaque white disc with the attempted action cut out of it (negative): an arrow
// for a walk or climb, stairs for a build, a pickaxe for a dig. A refused one blinks red. Fades out.
/**
 * @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y centre, device px @param {number} r radius
 * @param {{ dx: number, dy: number, kind: CueKind, refused: boolean, question: boolean }} cue @param {number} life 1 → 0
 */
function drawCue(ctx, x, y, r, cue, life) {
  ctx.save()
  ctx.globalAlpha = life
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  const red = cue.refused && Math.sin((1 - life) * Math.PI * 4) > 0
  ctx.fillStyle = cue.refused ? (red ? '#ff2828' : '#ffd0d0') : '#fff'
  ctx.fill()
  ctx.fillStyle = BG
  ctx.strokeStyle = BG
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const u = r * 0.62
  if (cue.question) {
    // a run stopped on its own: just "?", readable at a glance (D034). The exact trigger is in the bug report.
    ctx.font = `bold ${Math.round(r * 1.4)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', 0, r * 0.08)
  } else if (cue.kind === 'walk') {
    ctx.rotate(Math.atan2(cue.dy, cue.dx))
    ctx.lineWidth = u * 0.32
    ctx.beginPath()
    ctx.moveTo(-u, 0)
    ctx.lineTo(u * 0.35, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(u, 0)
    ctx.lineTo(u * 0.1, -u * 0.6)
    ctx.lineTo(u * 0.1, u * 0.6)
    ctx.closePath()
    ctx.fill()
  } else if (cue.kind === 'build') {
    // three steps rising toward the side you build up to (↗ ↖) or away from it (↘ ↙)
    ctx.scale(cue.dy < 0 ? Math.sign(cue.dx) || 1 : -Math.sign(cue.dx) || 1, 1)
    const s = (2 * u) / 3
    ctx.beginPath()
    ctx.moveTo(-u, u)
    ctx.lineTo(-u, u - s)
    ctx.lineTo(-u + s, u - s)
    ctx.lineTo(-u + s, u - 2 * s)
    ctx.lineTo(-u + 2 * s, u - 2 * s)
    ctx.lineTo(-u + 2 * s, -u)
    ctx.lineTo(u, -u)
    ctx.lineTo(u, u)
    ctx.closePath()
    ctx.fill()
  } else {
    // a pickaxe swinging toward the swipe's side
    ctx.scale(Math.sign(cue.dx) || 1, 1)
    ctx.lineWidth = u * 0.26
    ctx.beginPath()
    ctx.moveTo(-u * 0.75, u) // handle
    ctx.lineTo(u * 0.3, -u * 0.35)
    ctx.stroke()
    ctx.lineWidth = u * 0.3
    ctx.beginPath()
    ctx.moveTo(-u * 0.55, -u * 0.95) // head: a curved blade across the handle's top
    ctx.quadraticCurveTo(u * 0.55, -u * 0.75, u * 0.95, u * 0.35)
    ctx.stroke()
  }
  ctx.restore()
}

/** Alpha of the "can't do" flash at progress f (0..1): two blinks, fading out. */
/** @param {number} f */
function failAlpha(f) {
  return 0.85 * (1 - 0.5 * f) * (Math.sin(f * Math.PI * 4) > 0 ? 1 : 0.25)
}

// Where the character is drawn: between the step's start and end, alpha into the next tick.
// Mining happens in place; the move follows.
/** @param {Game} g @param {number} alpha */
export function charPos(g, alpha) {
  const s = g.step
  if (!s) return { x: g.ch.x, y: g.ch.y, digging: false }
  const t = s.t + alpha
  if (t <= s.digT) return { x: s.from.x, y: s.from.y, digging: true }
  const f = Math.min(1, (t - s.digT) / (s.dur - (s.hold ?? 0) - s.digT))
  const to = { x: nearest(s.action.to.x, s.from.x, g.world.w), y: s.action.to.y }
  const fall = s.action.fall
  if (fall) {
    // move one tile, then drop the rest
    const moveEnd = { x: to.x, y: to.y - fall }
    const split = 1 / (1 + fall)
    if (f < split) {
      const k = f / split
      return { x: s.from.x + (moveEnd.x - s.from.x) * k, y: s.from.y + (moveEnd.y - s.from.y) * k, digging: false }
    }
    const k = (f - split) / (1 - split)
    return { x: to.x, y: moveEnd.y + fall * k * k, digging: false }
  }
  return { x: s.from.x + (to.x - s.from.x) * f, y: s.from.y + (to.y - s.from.y) * f, digging: false }
}

// The copy of x (mod w) closest to ref: keeps positions continuous across the x = 0 seam.
/** @param {number} x @param {number} ref @param {number} w */
function nearest(x, ref, w) {
  return x + w * Math.round((ref - x) / w)
}
