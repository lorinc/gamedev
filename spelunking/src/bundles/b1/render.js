// Canvas2D view of the game: the world as a 1-px-per-tile canvas scaled up with nearest-neighbour,
// a camera that follows with lookahead, the character, debris, the pack strip and the charge ring,
// the swipe cue (a white disc beside the character showing what it attempts; red when refused)
// and the red "can't do" flash of the pack when an action is refused for lack of ore or pack space.

import { TILE_RGB } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'

/** @typedef {import('../../sim/dig/game.js').Game} Game */
/** @typedef {import('./tunables.js').Tunables} Tunables */
/** @typedef {ReturnType<import('./juice.js').createJuice>} Juice */

const BG = '#050508'
const BEDROCK = '#000'
const CHAR = '#f4f1de'
const FELL = '#ff5a5a' // the character at the bottom of a deep fall
const FAIL_S = 0.7 // seconds the red "can't do" flash of the pack lasts
const CUE_S = 0.6 // seconds the swipe cue takes to fade out
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
  for (let i = 0; i < world.tiles.length; i++) {
    img.data.set([...TILE_RGB[/** @type {Tile} */ (world.tiles[i])], 255], i * 4)
  }
  tctx.putImageData(img, 0, 0)

  let dpr = 1
  let tilePx = 16
  const cam = { x: game.ch.x + 0.5, y: game.ch.y + 0.5 }
  /** Seconds left of the pack's red flash. */
  let failLeft = 0
  /** The swipe cue: what the character attempts, which way, refused or not, seconds left. */
  let cue = { dx: 0, dy: 0, kind: /** @type {CueKind} */ ('walk'), refused: false, ask: false, left: 0 }

  function resize() {
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(window.innerWidth * dpr)
    canvas.height = Math.round(window.innerHeight * dpr)
    tilePx = Math.max(4, Math.round(Math.min(canvas.width, canvas.height) / t.view.tilesShort))
  }
  resize()

  return {
    resize,
    /** @param {number} x @param {number} y */
    setTile(x, y) {
      tctx.fillStyle = css(TILE_RGB[/** @type {Tile} */ (world.tiles[y * world.w + x])])
      tctx.fillRect(x, y, 1, 1)
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
     * Show the swipe cue: what the character attempts in direction (dx, dy). refused: red. ask: a run
     * stopped on its own: the disc shows just "?" (D034).
     */
    attempt(/** @type {number} */ dx, /** @type {number} */ dy, /** @type {CueKind} */ kind, refused = false, ask = false) {
      cue = { dx, dy, kind, refused, ask, left: CUE_S }
    },
    info: () => ({ dpr, tilePx, w: canvas.width, h: canvas.height }),
    /**
     * @param {number} alpha 0..1 into the next tick
     * @param {number} dt seconds since the last frame
     * @param {number} time seconds
     * @param {{ p: number, x: number | null, y: number | null } | null} charge at the pointer, or at the character
     */
    draw(alpha, dt, time, charge) {
      if (Math.round(Math.min(canvas.width, canvas.height) / t.view.tilesShort) !== tilePx) resize()
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

      // the pack's "can't do": two quick red blinks that fade
      failLeft = Math.max(0, failLeft - dt)
      const failA = failLeft > 0 ? failAlpha(1 - failLeft / FAIL_S) : 0

      // Character: 1 tile in the sim, drawn ~1.3 tall. Squash on stops, a push while digging.
      const sq = juice.squash()
      const cw = tp * 0.7 * (1 + sq * 0.25)
      const chh = tp * 1.3 * (1 - sq * 0.2)
      let dig = 0
      if (p.digging && run) dig = Math.sin(time * 40) * 0.08 * tp
      const cx = sx(px + 0.5) + (run ? run.dx * dig : 0)
      const cy = sy(p.y + 1) + (run ? run.dy * dig : 0)
      // a deep fall: at the bottom, red, while the teleport charges (D036)
      const s = game.step
      const homing = s && s.home && s.hold ? Math.min(1, Math.max(0, (s.t + alpha - (s.dur - s.hold)) / s.hold)) : 0
      ctx.fillStyle = homing > 0 ? FELL : CHAR
      ctx.fillRect(Math.round(cx - cw / 2), Math.round(cy - chh), Math.round(cw), Math.round(chh))
      ctx.fillStyle = BG // an eye on the facing side, so direction reads
      const eye = Math.max(2, Math.round(tp * 0.14))
      ctx.fillRect(Math.round(cx + game.ch.facing * cw * 0.18 - eye / 2), Math.round(cy - chh * 0.75), eye, eye)

      for (const c of juice.chunks) {
        ctx.fillStyle = c.color
        const s = Math.max(2, Math.round(tp * 0.18))
        ctx.fillRect(Math.round(sx(nearest(c.x, left, world.w))), Math.round(sy(c.y)), s, s)
      }

      cue.left = Math.max(0, cue.left - dt)
      if (cue.left > 0) {
        // one step out from the drawn body, in the swipe's direction: beside, above, below or diagonal
        const d = tp * 1.15
        drawCue(ctx, cx + cue.dx * d, cy - chh / 2 + cue.dy * d, Math.max(9 * dpr, tp * 0.45), cue, cue.left / CUE_S)
      }

      drawPack(ctx, game, W, H, dpr, failA)

      if (homing > 0) charge = { p: homing, x: null, y: null }
      if (charge && charge.p > 0.12) {
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

// The only persistent on-screen element: pack slots along the bottom edge.
/**
 * @param {CanvasRenderingContext2D} ctx @param {Game} game @param {number} W @param {number} H @param {number} dpr
 * @param {number} failA alpha of the red "can't do" flash over the whole strip, 0 = none
 */
function drawPack(ctx, game, W, H, dpr, failA) {
  const slots = game.cfg.packSlots
  const s = Math.round(26 * dpr)
  const gap = Math.round(6 * dpr)
  const x0 = Math.round(W / 2 - (slots * (s + gap) - gap) / 2)
  const y = H - s - Math.round(14 * dpr)
  for (let i = 0; i < slots; i++) {
    const x = x0 + i * (s + gap)
    ctx.fillStyle = '#000' // opaque, so world tiles behind never read as items
    ctx.fillRect(x - dpr, y - dpr, s + 2 * dpr, s + 2 * dpr)
    const item = game.pack[i]
    ctx.fillStyle = item === undefined ? '#333' : css(TILE_RGB[/** @type {Tile} */ (item)])
    const inset = item === undefined ? s / 2 - dpr : 3 * dpr
    ctx.fillRect(x + inset, y + inset, s - 2 * inset, s - 2 * inset)
  }
  if (failA > 0) {
    ctx.fillStyle = `rgba(255,40,40,${failA})`
    ctx.fillRect(x0 - 3 * dpr, y - 3 * dpr, slots * (s + gap) - gap + 6 * dpr, s + 6 * dpr)
  }
}

// The swipe cue: an opaque white disc with the attempted action cut out of it (negative): an arrow
// for a walk or climb, stairs for a build, a pickaxe for a dig. A refused one blinks red. Fades out.
/**
 * @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y centre, device px @param {number} r radius
 * @param {{ dx: number, dy: number, kind: CueKind, refused: boolean, ask: boolean }} cue @param {number} life 1 → 0
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
  if (cue.ask) {
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
