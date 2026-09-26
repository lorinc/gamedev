// Touch, mouse and keyboard → the same sim commands. One pointer recogniser serves touch and mouse:
// a swipe commits as soon as it travels swipePx (not on release), a short press is a tap (stop),
// holding still charges the teleport.
//
// Flick and hold (D046): a swipe is a flick unless the finger is still down holdMs after it (or was
// down holdMs before it: hold+swipe), which makes it a hold. The sim gets the intent at once, then
// `hold` at that mark or `release` when the finger lifts. Keys work the same way: a tap is a flick,
// a key held down is a hold, and letting go of every key is the release. The teleport charge shows
// only after holdMs of holding still, so the ring doesn't flash at the start of a hold+swipe.
//
// Zoom (D050): the mouse wheel (a trackpad pinch arrives as a wheel with ctrlKey: the same) and a
// two-finger pinch step the zoom level. A second finger down drops the first finger's pending tap,
// swipe or teleport charge; a swipe it already made still gets its `release` when it lifts.
//
// TODO (Lorinc, 2026-09-25): a tutorial for the controls. Flick vs hold is unusual, on PC especially.
// Teach it early in a no-brainer situation: a gap you can only cross by holding.

/** @typedef {import('../../sim/dig/game.js').Command} Command */
/** @typedef {import('./tunables.js').Tunables} Tunables */

const KEYS = /** @type {Record<string, [number, number]>} */ ({
  KeyW: [0, -1],
  KeyA: [-1, 0],
  KeyS: [0, 1],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowRight: [1, 0],
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
const WHEEL_PX = 100 // wheel travel per zoom level, for trackpads' small deltas
const NOTCH_PX = 50 // a wheel event this big (or in lines or pages) is a mouse notch: one level
const PINCH = 1.25 // the fingers' distance grows or shrinks by this factor per zoom level

/**
 * @param {HTMLElement} surface
 * @param {Tunables} t
 * @param {(cmd: Command, stamp: number, how: string) => void} send how: the raw input, in words, for bug reports
 * @param {{ togglePanel: () => void, gesture: () => void, zoom: (steps: number) => void }} hooks gesture: first user
 *   gesture (unlocks audio); zoom: this many levels in (+) or out (-)
 */
export function createInput(surface, t, send, hooks) {
  /**
   * A finger (or mouse button) down. swiped: when its swipe committed (null: not yet); held: it's a hold.
   * @type {{ id: number, x0: number, y0: number, t0: number, swiped: number | null, held: boolean, done: boolean } | null}
   */
  let press = null
  /** Direction keys down, and when the first went down; held: past holdMs. */
  const keys = new Set()
  let keysT0 = 0
  let keysHeld = false
  /** @type {{ t0: number, done: boolean } | null} numpad 5 held: charging the teleport */
  let key5 = null
  let kind = '–'
  /** @type {Map<number, { x: number, y: number }>} touch fingers down, by pointer id */
  const fingers = new Map()
  /** A pinch, from a second finger down until every finger is up; d: the distance at the last level step. */
  let pinch = /** @type {{ d: number } | null} */ (null)
  let wheel = 0

  surface.addEventListener('contextmenu', (e) => e.preventDefault())
  // iOS Safari ignores user-scalable=no: its own pinch zoom arrives as gesture events
  document.addEventListener('gesturestart', (e) => e.preventDefault())
  document.addEventListener('gesturechange', (e) => e.preventDefault())

  surface.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault() // never the page's scroll or zoom
      if (!e.deltaY) return
      if (Math.sign(e.deltaY) !== Math.sign(wheel)) wheel = 0
      // a notch is one level; small deltas add up, one level per WHEEL_PX. Up = in.
      if (e.deltaMode !== 0 || Math.abs(e.deltaY) >= NOTCH_PX) wheel = Math.sign(e.deltaY) * WHEEL_PX
      else wheel += e.deltaY
      if (Math.abs(wheel) < WHEEL_PX) return
      hooks.zoom(-Math.sign(wheel))
      wheel = 0
    },
    { passive: false },
  )

  /** The distance between the first two fingers down. */
  const spread = () => {
    const [a, b] = [...fingers.values()]
    return Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))
  }

  surface.addEventListener('pointerdown', (e) => {
    hooks.gesture()
    kind = e.pointerType
    if (e.pointerType === 'touch') fingers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (fingers.size >= 2) {
      // a pinch: the first finger's pending tap, swipe or charge is dropped (a swipe it made still gets its release)
      if (press) press.done = true
      pinch = { d: spread() }
      return
    }
    if (press || pinch) return // one finger at a time; a finger left from a pinch does nothing
    press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, swiped: null, held: false, done: false }
    surface.setPointerCapture(e.pointerId)
  })

  surface.addEventListener('pointermove', (e) => {
    const f = fingers.get(e.pointerId)
    if (f) {
      f.x = e.clientX
      f.y = e.clientY
    }
    if (pinch && fingers.size >= 2) {
      const d = spread()
      while (d >= pinch.d * PINCH) {
        pinch.d *= PINCH
        hooks.zoom(1)
      }
      while (d <= pinch.d / PINCH) {
        pinch.d /= PINCH
        hooks.zoom(-1)
      }
    }
    if (!press || e.pointerId !== press.id || press.done || press.swiped !== null) return
    const dx = e.clientX - press.x0
    const dy = e.clientY - press.y0
    if (Math.hypot(dx, dy) < t.input.swipePx) return
    press.swiped = e.timeStamp
    press.held = e.timeStamp - press.t0 >= t.input.holdMs // hold+swipe: a hold from the start
    const [ix, iy] = direction(dx, dy, t.input.horizontalDeg, t.input.verticalDeg)
    const deg = Math.round((Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI)
    const how = `${e.pointerType} ${press.held ? 'hold+swipe' : 'swipe'} ${deg}° off horizontal, ${Math.round(Math.hypot(dx, dy))} px`
    send({ type: 'intent', dx: ix, dy: iy, ...(press.held ? { held: true } : {}) }, e.timeStamp, how)
  })

  /** @param {PointerEvent} e */
  const release = (e) => {
    fingers.delete(e.pointerId)
    if (!fingers.size) pinch = null
    if (!press || e.pointerId !== press.id) return
    if (press.swiped !== null) send({ type: 'release' }, e.timeStamp, `${e.pointerType} up`)
    else if (!press.done && e.type === 'pointerup') {
      if (press.x0 < CORNER_PX && press.y0 < CORNER_PX) hooks.togglePanel()
      else send({ type: 'stop' }, e.timeStamp, `${e.pointerType} tap`)
    }
    press = null
  }
  surface.addEventListener('pointerup', release)
  surface.addEventListener('pointercancel', release)

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') return hooks.togglePanel()
    if (!KEYS[e.code] && e.code !== 'Numpad5') return
    e.preventDefault()
    if (e.repeat) return
    hooks.gesture()
    kind = 'keyboard'
    // Numpad 5 = tap and long-tap: stop on press (a key can't turn into a swipe), teleport if held.
    if (e.code === 'Numpad5') {
      key5 = { t0: e.timeStamp, done: false }
      return send({ type: 'stop' }, e.timeStamp, 'key Numpad5')
    }
    if (!keys.size) {
      keysT0 = e.timeStamp
      keysHeld = false
    }
    keys.add(e.code)
    // the keys down now give the direction (two = a diagonal); letting go of one doesn't change it
    let dx = 0
    let dy = 0
    for (const code of keys) {
      dx += KEYS[code][0]
      dy += KEYS[code][1]
    }
    dx = Math.sign(dx)
    dy = Math.sign(dy)
    const how = `key ${[...keys].join('+')}${keysHeld ? ' (held)' : ''}`
    if (dx || dy) send({ type: 'intent', dx, dy, ...(keysHeld ? { held: true } : {}) }, e.timeStamp, how)
  })

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Numpad5') key5 = null
    if (!keys.delete(e.code) || keys.size) return
    send({ type: 'release' }, e.timeStamp, `key ${e.code} up`)
  })
  window.addEventListener('blur', () => {
    if (keys.size) send({ type: 'release' }, performance.now(), 'window lost focus')
    keys.clear()
    key5 = null
  })

  /** The teleport charge 0..1 for a press that started at t0: nothing for holdMs, then it fills. @param {number} held ms */
  const chargeOf = (held) => (held - t.input.holdMs) / (t.input.longPressMs - t.input.holdMs)

  return {
    /**
     * Once per frame: says `hold` when a swipe or keys are still down holdMs on, and gives the teleport
     * charge 0..1 at the pointer (CSS px; null x / y = at the character), or null. It fires when full.
     * @param {number} now @returns {{ p: number, x: number | null, y: number | null } | null}
     */
    charge(now) {
      if (press && press.swiped !== null && !press.held && !press.done && now - press.swiped >= t.input.holdMs) {
        press.held = true
        send({ type: 'hold' }, now, `${kind} still down ${Math.round(now - press.swiped)} ms after the swipe`)
      }
      if (keys.size && !keysHeld && now - keysT0 >= t.input.holdMs) {
        keysHeld = true
        send({ type: 'hold' }, now, `key ${[...keys].join('+')} still down ${Math.round(now - keysT0)} ms`)
      }
      if (key5 && !key5.done) {
        const p = chargeOf(now - key5.t0)
        if (p < 1) return p > 0 ? { p, x: null, y: null } : null
        key5.done = true
        send({ type: 'teleport' }, now, 'hold Numpad5')
        return null
      }
      if (!press || press.done || press.swiped !== null) return null
      const p = chargeOf(now - press.t0)
      if (p >= 1) {
        press.done = true
        send({ type: 'teleport' }, now, 'long press')
        return null
      }
      return p > 0 ? { p, x: press.x0, y: press.y0 } : null
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
