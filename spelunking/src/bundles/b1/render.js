// Canvas2D view of the game: the world as a 1-px-per-tile canvas scaled up with nearest-neighbour,
// a camera that follows with lookahead, the character, debris, the pack strip and the charge ring.

import { TILE_RGB } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'
import { wrap } from '../../sim/dig/rules.js'

/** @typedef {import('../../sim/dig/game.js').Game} Game */
/** @typedef {import('./tunables.js').Tunables} Tunables */
/** @typedef {ReturnType<import('./juice.js').createJuice>} Juice */

const BG = '#050508'
const BEDROCK = '#000'
const CHAR = '#f4f1de'

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
      for (let x = ix; x < ix + cols; ) {
        const srcX = wrap(x, world.w)
        const n = Math.min(world.w - srcX, ix + cols - x)
        if (y1 > y0) ctx.drawImage(tex, srcX, y0, n, y1 - y0, sx(x), sy(y0), n * tp, (y1 - y0) * tp)
        x += n
      }

      // Character: 1 tile in the sim, drawn ~1.3 tall. Squash on stops, a push while digging.
      const sq = juice.squash()
      const cw = tp * 0.7 * (1 + sq * 0.25)
      const chh = tp * 1.3 * (1 - sq * 0.2)
      let dig = 0
      if (p.digging && run) dig = Math.sin(time * 40) * 0.08 * tp
      const cx = sx(px + 0.5) + (run ? run.dx * dig : 0)
      const cy = sy(p.y + 1) + (run ? run.dy * dig : 0)
      ctx.fillStyle = CHAR
      ctx.fillRect(Math.round(cx - cw / 2), Math.round(cy - chh), Math.round(cw), Math.round(chh))
      ctx.fillStyle = BG // an eye on the facing side, so direction reads
      const eye = Math.max(2, Math.round(tp * 0.14))
      ctx.fillRect(Math.round(cx + game.ch.facing * cw * 0.18 - eye / 2), Math.round(cy - chh * 0.75), eye, eye)

      for (const c of juice.chunks) {
        ctx.fillStyle = c.color
        const s = Math.max(2, Math.round(tp * 0.18))
        ctx.fillRect(Math.round(sx(nearest(c.x, left, world.w))), Math.round(sy(c.y)), s, s)
      }

      drawPack(ctx, game, W, H, dpr)

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
/** @param {CanvasRenderingContext2D} ctx @param {Game} game @param {number} W @param {number} H @param {number} dpr */
function drawPack(ctx, game, W, H, dpr) {
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
}

// Where the character is drawn: between the step's start and end, alpha into the next tick.
// Mining happens in place; the move follows.
/** @param {Game} g @param {number} alpha */
export function charPos(g, alpha) {
  const s = g.step
  if (!s) return { x: g.ch.x, y: g.ch.y, digging: false }
  const t = s.t + alpha
  if (t <= s.digT) return { x: s.from.x, y: s.from.y, digging: true }
  const f = Math.min(1, (t - s.digT) / (s.dur - s.digT))
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
