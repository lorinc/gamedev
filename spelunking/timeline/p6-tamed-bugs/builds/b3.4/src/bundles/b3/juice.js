// Feedback that reads sim events and never writes sim state: debris chunks, trauma shake,
// squash on stops, and one synthesized sound per material (no audio files). A low ping per probe ring (D053).
// Moon bugs (D056): a nibble sends an ore flying from the pack into the bug, and a heart pops when it
// lands; a taming pops a few. These show what happened to your ore, so they stay on with the juice off.

import { TILE_RGB } from '../../render/palette.js'
import { Tile } from '../../sim/gen/world.js'

/** @typedef {import('../../sim/dig/game.js').GameEvent} GameEvent */
/** @typedef {import('./tunables.js').Tunables} Tunables */

const MAX_CHUNKS = 160
const GRAVITY = 40 // tiles / s²
export const FLIGHT_S = 0.35 // an ore's flight from the pack into a bug
export const HEART_S = 0.9 // a heart's rise and fade

/** @param {Tunables} t */
export function createJuice(t) {
  /** @type {{ x: number, y: number, vx: number, vy: number, life: number, color: string }[]} */
  const chunks = []
  let trauma = 0
  let squash = 0
  let kick = { x: 0, y: 0 } // shake bias along the last dig
  const sound = createSound(t)
  /** @type {{ x0: number, y0: number, x1: number, y1: number, age: number }[]} ore in flight, tile coords, seconds */
  const flights = []
  /** @type {{ x: number, y: number, age: number }[]} hearts over bugs; a negative age waits */
  const hearts = []

  const on = () => t.juice.on

  /** @param {number} x @param {number} y @param {number} tile @param {number} n */
  function burst(x, y, tile, n) {
    if (!on() || !t.juice.chunks) return
    const [r, g, b] = TILE_RGB[/** @type {Tile} */ (tile)]
    for (let i = 0; i < n; i++) {
      if (chunks.length >= MAX_CHUNKS) chunks.shift()
      chunks.push({
        x: x + 0.2 + Math.random() * 0.6,
        y: y + 0.2 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 8 - kick.x * 3,
        vy: -Math.random() * 8 - 2,
        life: 0.35 + Math.random() * 0.3,
        color: `rgb(${r},${g},${b})`,
      })
    }
  }

  /** @param {number} amount */
  const shake = (amount) => {
    if (on() && t.juice.shake) trauma = Math.min(1, trauma + amount)
  }

  return {
    chunks,
    flights,
    hearts,
    sound,
    /** @param {GameEvent} e */
    onEvent(e) {
      if (e.type === 'step') {
        kick = { x: e.action.dx, y: e.action.dy }
      } else if (e.type === 'mined') {
        burst(e.x, e.y, e.tile, e.tile === Tile.Hard ? 9 : 6)
        shake(e.tile === Tile.Hard ? 0.12 : 0.05)
        sound.play(e.tile === Tile.Hard ? 'hard' : e.tile === Tile.Ore ? 'ore' : e.tile === Tile.Loot ? 'loot' : 'soft')
      } else if (e.type === 'built') {
        burst(e.x, e.y, Tile.Built, 3)
        sound.play('build')
      } else if (e.type === 'ring') {
        sound.play('ping')
      } else if (e.type === 'stop' && e.reason !== 'probe') {
        squash = on() ? 1 : 0
        if (e.reason === 'harder') {
          shake(0.25)
          sound.play('thunk')
        } else if (e.reason === 'open') {
          shake(0.35)
          sound.play('break')
        } else sound.play('bump')
      } else if (e.type === 'teleport') {
        sound.play('teleport')
      } else if (e.type === 'nibble') {
        flights.push({ x0: e.from.x + 0.5, y0: e.from.y + 0.35, x1: e.x + 0.5, y1: e.y + 0.5, age: 0 })
        hearts.push({ x: e.x + 0.5, y: e.y + 0.2, age: -FLIGHT_S }) // pops when the ore lands
        sound.play('nibble')
      } else if (e.type === 'tamed') {
        for (let k = 1; k <= 3; k++) hearts.push({ x: e.x + 0.5 + (k - 2) * 0.4, y: e.y + 0.2, age: -FLIGHT_S - k * 0.15 })
        sound.play('tamed')
      } else if (e.type === 'placed') {
        sound.play('placed')
      }
    },
    /** @param {number} dt seconds */
    update(dt) {
      trauma = Math.max(0, trauma - dt * 1.6)
      squash = Math.max(0, squash - dt * 8)
      for (const f of flights) f.age += dt
      for (const h of hearts) h.age += dt
      while (flights.length && flights[0].age > FLIGHT_S) flights.shift()
      for (let i = hearts.length - 1; i >= 0; i--) if (hearts[i].age > HEART_S) hearts.splice(i, 1)
      for (let i = chunks.length - 1; i >= 0; i--) {
        const c = chunks[i]
        c.life -= dt
        if (c.life <= 0) chunks.splice(i, 1)
        c.vy += GRAVITY * dt
        c.x += c.vx * dt
        c.y += c.vy * dt
      }
    },
    /** Camera offset in tiles: smooth noise scaled by trauma², nudged along the dig. */
    /** @param {number} time seconds */
    shakeOffset(time) {
      const s = t.juice.maxShake * trauma * trauma
      const n = (/** @type {number} */ a) => Math.sin(time * 37 + a) * 0.6 + Math.sin(time * 71 + a * 3) * 0.4
      return { x: s * (n(0) + kick.x * 0.5), y: s * (n(9) + kick.y * 0.5) }
    },
    squash: () => squash,
  }
}

/** @typedef {'soft' | 'hard' | 'ore' | 'loot' | 'build' | 'thunk' | 'break' | 'bump' | 'teleport' | 'ping' | 'nibble' | 'tamed' | 'placed'} SoundName */

/** @param {Tunables} t */
function createSound(t) {
  /** @type {AudioContext | null} */
  let ctx = null
  /** @type {AudioBuffer | null} */
  let noise = null

  // One tone and / or noise burst per sound: [wave, startHz, endHz, noiseFilterHz, seconds, gain]
  /** @type {Record<SoundName, [OscillatorType | null, number, number, number, number, number]>} */
  const SOUNDS = {
    soft: [null, 0, 0, 500, 0.08, 0.5],
    hard: ['square', 110, 70, 250, 0.1, 0.35],
    ore: ['triangle', 660, 990, 1500, 0.12, 0.35],
    loot: ['triangle', 880, 1760, 2500, 0.18, 0.35],
    build: ['square', 220, 260, 0, 0.06, 0.2],
    thunk: ['sine', 90, 50, 180, 0.16, 0.8],
    break: [null, 0, 0, 1200, 0.2, 0.6],
    bump: ['sine', 160, 120, 0, 0.05, 0.25],
    teleport: ['sine', 200, 1400, 0, 0.35, 0.3],
    ping: ['sine', 150, 110, 0, 0.14, 0.3], // a probe ring: low and short, a ring every 5 ticks (83 ms) overlaps a little
    nibble: ['triangle', 1200, 1600, 0, 0.05, 0.15], // a wild bug's bite: tiny and high
    tamed: ['sine', 520, 1040, 0, 0.4, 0.3],
    placed: ['sine', 780, 390, 0, 0.3, 0.3], // a bug set down (D060): the taming's chime, falling
  }

  return {
    /** Call from a user gesture: browsers only start audio after one. */
    unlock() {
      if (ctx) return void ctx.resume()
      // iOS 14.0–14.4 only has the prefixed name (R14)
      const Ctx = window.AudioContext ?? /** @type {any} */ (window).webkitAudioContext
      ctx = /** @type {AudioContext} */ (new Ctx())
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    },
    /** @param {SoundName} name */
    play(name) {
      if (!ctx || !noise || !t.juice.on || !t.juice.sound || ctx.state !== 'running') return
      const [wave, f0, f1, filterHz, dur, gain] = SOUNDS[name]
      const now = ctx.currentTime
      const jitter = 1 + (Math.random() - 0.5) * 0.16
      const out = ctx.createGain()
      out.gain.setValueAtTime(gain * t.juice.volume, now)
      out.gain.exponentialRampToValueAtTime(0.001, now + dur)
      out.connect(ctx.destination)
      if (wave) {
        const osc = ctx.createOscillator()
        osc.type = wave
        osc.frequency.setValueAtTime(f0 * jitter, now)
        osc.frequency.exponentialRampToValueAtTime(f1 * jitter, now + dur)
        osc.connect(out)
        osc.start(now)
        osc.stop(now + dur)
      }
      if (filterHz) {
        const src = ctx.createBufferSource()
        src.buffer = noise
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = filterHz * jitter
        src.connect(filter).connect(out)
        src.start(now)
        src.stop(now + dur)
      }
    },
  }
}
