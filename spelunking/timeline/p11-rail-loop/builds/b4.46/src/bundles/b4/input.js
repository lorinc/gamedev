// b4's input (D079): drag the screen or hold A W S D / the arrows, and the bot goes that way; let go, it
// stops. A drag is a joystick: its direction from where the finger went down, any angle (b4.3, the user;
// keys give 8), past a dead zone. In a car the same direction is the swipe that picks the rail. A short touch
// that didn't drag is a tap (Space on a keyboard): in a moving car it stops at the next node.
// In a bulb (b4.41, the user): a drag (or keys) picks one of the node's roots, letting go (or Space) confirms:
// the page turns `move` and `tap` into that while the bot is held.

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} h
 * @param {(dx: number, dy: number) => void} h.move 0, 0 = stop
 * @param {() => void} h.tap
 * @param {(steps: number) => void} h.zoom
 * @param {() => void} h.togglePanel
 * @param {() => void} h.gesture any first touch or key (for sound, one day)
 */
export function createInput(canvas, h) {
  const DEAD = 14 // CSS px before a drag has a direction
  const TURN = Math.PI / 90 // a drag's direction is sent again when it turned 2°

  // Keys: the direction of the ones held
  const held = new Set()
  const KEYS = /** @type {Record<string, [number, number]>} */ ({
    KeyA: [-1, 0],
    ArrowLeft: [-1, 0],
    KeyD: [1, 0],
    ArrowRight: [1, 0],
    KeyW: [0, -1],
    ArrowUp: [0, -1],
    KeyS: [0, 1],
    ArrowDown: [0, 1],
  })
  let kx = 0
  let ky = 0
  const keysChanged = () => {
    let x = 0
    let y = 0
    for (const k of held) {
      x += KEYS[k][0]
      y += KEYS[k][1]
    }
    x = Math.sign(x)
    y = Math.sign(y)
    if (x === kx && y === ky) return
    kx = x
    ky = y
    h.move(x, y)
  }
  window.addEventListener('keydown', (e) => {
    h.gesture()
    if (e.code === 'Backquote') return h.togglePanel()
    if (e.code === 'Space') {
      e.preventDefault()
      if (!e.repeat) h.tap()
      return
    }
    if (!KEYS[e.code]) return
    e.preventDefault()
    held.add(e.code)
    keysChanged()
  })
  window.addEventListener('keyup', (e) => {
    if (!held.delete(e.code)) return
    keysChanged()
  })
  window.addEventListener('blur', () => {
    held.clear()
    keysChanged()
  })

  // One finger (or the mouse) at a time; a second finger is ignored
  /** @type {{ id: number, x: number, y: number, dir: number | null, dragged: boolean } | null} */
  let p = null
  canvas.addEventListener('pointerdown', (e) => {
    h.gesture()
    if (p) return
    // the top-left corner opens the dev panel, as in b3
    if (e.clientX < 40 && e.clientY < 40) return h.togglePanel()
    canvas.setPointerCapture(e.pointerId)
    p = { id: e.pointerId, x: e.clientX, y: e.clientY, dir: null, dragged: false }
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!p || e.pointerId !== p.id) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (Math.hypot(dx, dy) < DEAD) return
    p.dragged = true
    // any angle
    const a = Math.atan2(dy, dx)
    if (p.dir !== null) {
      let d = Math.abs(a - p.dir)
      if (d > Math.PI) d = 2 * Math.PI - d
      if (d < TURN) return
    }
    p.dir = a
    h.move(Math.cos(a), Math.sin(a))
  })
  const up = (/** @type {PointerEvent} */ e) => {
    if (!p || e.pointerId !== p.id) return
    const was = p
    p = null
    if (was.dir !== null) h.move(0, 0)
    else if (!was.dragged) h.tap()
  }
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      h.zoom(e.deltaY < 0 ? 1 : -1)
    },
    { passive: false },
  )
}
