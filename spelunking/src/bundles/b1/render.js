// Canvas2D view of the game: the world as a 1-px-per-tile canvas scaled up with nearest-neighbour,
// a camera that follows with lookahead, the character with the backpack on its back, debris and the
// charge ring, the swipe cue (a white disc beside the character showing what it attempts; red when
// refused) and the red "can't do" flash of the pack when an action is refused for lack of rock or pack space.

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
const BODY_H = 1.3 // the character's drawn height, in tiles (1 in the sim)
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

      cue.left = Math.max(0, cue.left - dt)
      if (cue.left > 0) {
        // one step out from the drawn body, in the swipe's direction: beside, above, below or diagonal
        const d = tp * 1.15
        drawCue(ctx, cx + cue.dx * d, cy - chh / 2 + cue.dy * d, Math.max(9 * dpr, tp * 0.45), cue, cue.left / CUE_S)
      }

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
