// Touch, mouse and keyboard → the same sim commands. One pointer recogniser serves touch and mouse:
// a swipe commits as soon as it travels swipePx (not on release), a short press is a tap (stop),
// holding still charges the teleport.

// TODO (Lorinc, 2026-09-25), precise mode: a swipe that stays held still walks the run, but pauses
// ~0.3 s at every step, and a release stops it, so exact positioning is easy. While held, nothing
// asks for confirmation (the hold is the confirmation). Teach it early as a no-brainer tutorial
// situation (a spot where you must stop at an exact cell). Key hold (WASD) should mean the same.
// Swipe+hold is the same intent as hold+swipe (Lorinc): pressing, waiting, then swiping while still
// down is precise mode too. That clashes with holding still charging the teleport: the swipe must
// cancel the charge before it fires (longPressMs), or the charge needs another gesture.

/** @typedef {import('../../sim/dig/game.js').Command} Command */
/** @typedef {import('./tunables.js').Tunables} Tunables */

const WASD = /** @type {Record<string, [number, number]>} */ ({
  KeyW: [0, -1],
  KeyA: [-1, 0],
  KeyS: [0, 1],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowRight: [1, 0],
})
const NUMPAD = /** @type {Record<string, [number, number]>} */ ({
  Numpad7: [-1, -1],
  Numpad8: [0, -1],
  Numpad9: [1, -1],
  Numpad4: [-1, 0],
  Numpad6: [1, 0],
  Numpad1: [-1, 1],
  Numpad2: [0, 1],
  Numpad3: [1, 1],
})
const CORNER_PX = 48 // a tap in the top-left corner toggles the dev panel

/**
 * @param {HTMLElement} surface
 * @param {Tunables} t
 * @param {(cmd: Command, stamp: number, how: string) => void} send how: the raw input, in words, for bug reports
 * @param {{ togglePanel: () => void, gesture: () => void }} hooks gesture: first user gesture (unlocks audio)
 */
export function createInput(surface, t, send, hooks) {
  /** @type {{ id: number, x0: number, y0: number, t0: number, x: number, y: number, done: boolean } | null} */
  let press = null
  const held = new Set()
  /** @type {{ t0: number, done: boolean } | null} numpad 5 held: charging the teleport */
  let key5 = null
  let kind = '–'

  surface.addEventListener('contextmenu', (e) => e.preventDefault())

  surface.addEventListener('pointerdown', (e) => {
    hooks.gesture()
    kind = e.pointerType
    if (press) return // one finger at a time
    press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, x: e.clientX, y: e.clientY, done: false }
    surface.setPointerCapture(e.pointerId)
  })

  surface.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id || press.done) return
    press.x = e.clientX
    press.y = e.clientY
    const dx = e.clientX - press.x0
    const dy = e.clientY - press.y0
    if (Math.hypot(dx, dy) < t.input.swipePx) return
    press.done = true
    const [ix, iy] = direction(dx, dy, t.input.horizontalDeg, t.input.verticalDeg)
    const deg = Math.round((Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI)
    send(
      { type: 'intent', dx: ix, dy: iy },
      e.timeStamp,
      `${e.pointerType} swipe ${deg}° off horizontal, ${Math.round(Math.hypot(dx, dy))} px`,
    )
  })

  /** @param {PointerEvent} e */
  const release = (e) => {
    if (!press || e.pointerId !== press.id) return
    if (!press.done && e.type === 'pointerup') {
      if (press.x0 < CORNER_PX && press.y0 < CORNER_PX) hooks.togglePanel()
      else send({ type: 'stop' }, e.timeStamp, `${e.pointerType} tap`)
    }
    press = null
  }
  surface.addEventListener('pointerup', release)
  surface.addEventListener('pointercancel', release)

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') return hooks.togglePanel()
    const move = WASD[e.code] ?? NUMPAD[e.code]
    if (!move && e.code !== 'Numpad5') return
    e.preventDefault()
    if (e.repeat) return
    hooks.gesture()
    kind = 'keyboard'
    // Numpad 5 = tap and long-tap: stop on press (a key can't turn into a swipe), teleport if held.
    if (e.code === 'Numpad5') {
      key5 = { t0: e.timeStamp, done: false }
      return send({ type: 'stop' }, e.timeStamp, 'key Numpad5')
    }
    if (NUMPAD[e.code]) return send({ type: 'intent', dx: move[0], dy: move[1] }, e.timeStamp, `key ${e.code}`)
    held.add(e.code)
    sendHeld(e.timeStamp)
  })

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Numpad5') key5 = null
    if (!held.delete(e.code)) return
    sendHeld(e.timeStamp)
  })
  window.addEventListener('blur', () => {
    held.clear()
    key5 = null
  })

  // WASD: hold to move, two keys = diagonal, release all = stop. A stop rule pauses the run
  // (a soft stop) until a key is pressed again.
  /** @param {number} stamp */
  function sendHeld(stamp) {
    let dx = 0
    let dy = 0
    for (const code of held) {
      dx += WASD[code][0]
      dy += WASD[code][1]
    }
    dx = Math.sign(dx)
    dy = Math.sign(dy)
    const keys = `keys held: ${[...held].join('+') || 'none'}`
    if (dx || dy) send({ type: 'intent', dx, dy }, stamp, keys)
    else send({ type: 'stop' }, stamp, keys)
  }

  return {
    /** Teleport charge 0..1 at the pointer (CSS px; null x / y = at the character), or null. Fires when full. */
    /** @param {number} now @returns {{ p: number, x: number | null, y: number | null } | null} */
    charge(now) {
      if (key5 && !key5.done) {
        const p = (now - key5.t0) / t.input.longPressMs
        if (p < 1) return { p, x: null, y: null }
        key5.done = true
        send({ type: 'teleport' }, now, 'hold Numpad5')
        return null
      }
      if (!press || press.done) return null
      const p = (now - press.t0) / t.input.longPressMs
      if (p >= 1) {
        press.done = true
        send({ type: 'teleport' }, now, 'long press')
        return null
      }
      return { p, x: press.x0, y: press.y0 }
    },
    kind: () => kind,
  }
}

// Screen-space swipe → one of 8 directions. Wide horizontal zones, so a walk is rarely misread
// as a diagonal (which mines or builds and may cost ore).
/** @param {number} dx @param {number} dy @param {number} hDeg @param {number} vDeg @returns {[number, number]} */
export function direction(dx, dy, hDeg, vDeg) {
  const deg = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI // 0 = horizontal, 90 = vertical
  if (deg <= hDeg) return [Math.sign(dx), 0]
  if (deg >= 90 - vDeg) return [0, Math.sign(dy)]
  return [Math.sign(dx), Math.sign(dy)]
}
