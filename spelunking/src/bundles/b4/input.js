// b4's input (D079): drag the screen or hold A W S D / the arrows, and the bot goes that way; let go, it
// stops. A drag is a joystick: its direction from where the finger went down, in 8 ways, past a dead zone.
// In a car the same direction is the swipe that picks the rail. A short touch that didn't drag is a tap
// (Space on a keyboard): in a moving car it stops at the next node.
// On a node of the network near the bot the finger builds instead (D079, D080): holding it shows its edges; dragging from it towards
// an edge selects that edge (a red X and a green hammer appear); after letting go, tapping the hammer builds
// and the X cancels. The page decides what's under the finger (`hit`) and draws the rest.
// A 1 s hold near the bot, without dragging, places a tamed bug (D080); on a keyboard, E held 1 s. Dragging
// away from there before the second is up is a move, as anywhere.

/** @typedef {{ kind: 'button', id: 'build' | 'cancel' } | { kind: 'node', node: number } | { kind: 'bot' } | null} Hit */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} h
 * @param {(dx: number, dy: number) => void} h.move 0, 0 = stop
 * @param {() => void} h.tap
 * @param {(x: number, y: number) => Hit} h.hit CSS px → what's there
 * @param {(node: number | null) => void} h.preview holding a node (null: let go)
 * @param {(node: number, dx: number, dy: number) => void} h.aim dragging from a node, CSS px from where it went down
 * @param {(id: 'build' | 'cancel') => void} h.button
 * @param {(at: { x: number, y: number } | null) => void} h.charge a hold that places a bug began at (CSS px), or ended (null)
 * @param {() => void} h.place the hold reached 1 s
 * @param {(steps: number) => void} h.zoom
 * @param {() => void} h.togglePanel
 * @param {() => void} h.gesture any first touch or key (for sound, one day)
 */
export function createInput(canvas, h) {
  const DEAD = 14 // CSS px before a drag has a direction
  const PLACE_MS = 1000 // b3's long press (D060)
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let placeTimer
  /** @param {{ x: number, y: number } | null} at */
  const charge = (at) => {
    clearTimeout(placeTimer)
    h.charge(at)
    if (at)
      placeTimer = setTimeout(() => {
        h.charge(null)
        h.place()
      }, PLACE_MS)
  }

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
    if (e.code === 'KeyE') {
      if (!e.repeat) charge({ x: innerWidth / 2, y: innerHeight / 2 })
      return
    }
    if (!KEYS[e.code]) return
    e.preventDefault()
    held.add(e.code)
    keysChanged()
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyE') return charge(null)
    if (!held.delete(e.code)) return
    keysChanged()
  })
  window.addEventListener('blur', () => {
    held.clear()
    keysChanged()
  })

  // One finger (or the mouse) at a time; a second finger is ignored
  /** @type {{ id: number, x: number, y: number, hit: Hit, dir: string, dragged: boolean } | null} */
  let p = null
  canvas.addEventListener('pointerdown', (e) => {
    h.gesture()
    if (p) return
    // the top-left corner opens the dev panel, as in b3
    if (e.clientX < 40 && e.clientY < 40) return h.togglePanel()
    canvas.setPointerCapture(e.pointerId)
    const hit = h.hit(e.clientX, e.clientY)
    p = { id: e.pointerId, x: e.clientX, y: e.clientY, hit, dir: '0,0', dragged: false }
    if (hit?.kind === 'node') h.preview(hit.node)
    if (hit?.kind === 'bot') charge({ x: e.clientX, y: e.clientY })
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!p || e.pointerId !== p.id) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (Math.hypot(dx, dy) < DEAD) return
    p.dragged = true
    if (p.hit?.kind === 'bot') {
      charge(null)
      p.hit = null // a move from here on
    }
    if (p.hit?.kind === 'node') return h.aim(p.hit.node, dx, dy)
    if (p.hit?.kind === 'button') return
    // 8 ways
    const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
    const ex = Math.round(Math.cos((a * Math.PI) / 4))
    const ey = Math.round(Math.sin((a * Math.PI) / 4))
    const dir = `${ex},${ey}`
    if (dir === p.dir) return
    p.dir = dir
    h.move(ex, ey)
  })
  const up = (/** @type {PointerEvent} */ e) => {
    if (!p || e.pointerId !== p.id) return
    const was = p
    p = null
    if (was.hit?.kind === 'bot') charge(null)
    if (was.hit?.kind === 'node') return h.preview(null)
    if (was.hit?.kind === 'button') {
      if (!was.dragged) h.button(was.hit.id)
      return
    }
    if (was.dir !== '0,0') h.move(0, 0)
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
