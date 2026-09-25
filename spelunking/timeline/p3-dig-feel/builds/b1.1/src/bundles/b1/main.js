// b1 · Dig Feel: wires sim + input + render + juice + dev panel. Fixed 60 Hz sim, render interpolates.

import { command, createGame, tick, withSurface } from '../../sim/dig/game.js'
import { DEFAULT_TERRAIN, generateTerrain } from '../../sim/gen/terrain.js'
import { createInput } from './input.js'
import { createJuice } from './juice.js'
import { createPanel } from './panel.js'
import { createRenderer } from './render.js'
import { assignDeep, DEFAULTS, presetId, RANGES } from './tunables.js'

/** @typedef {import('../../sim/dig/game.js').Dive} Dive */

const BUILD = 'b1.1'
const STORE = 'b1-tunables'
const TICK_MS = 1000 / 60
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id))

/** @type {typeof DEFAULTS} */
const tunables = JSON.parse(JSON.stringify(DEFAULTS))
try {
  assignDeep(tunables, JSON.parse(localStorage.getItem(STORE) ?? '{}'))
} catch {
  // no storage (private window, blocked): defaults
}
const save = () => {
  try {
    localStorage.setItem(STORE, JSON.stringify(tunables))
  } catch {
    // not persisted; the panel still works for this session
  }
}

const { world, home } = withSurface(generateTerrain(DEFAULT_TERRAIN), 4, 3)
const game = createGame(world, home, tunables.sim)
const canvas = /** @type {HTMLCanvasElement} */ ($('game'))
const juice = createJuice(tunables)
const renderer = createRenderer(canvas, game, tunables, juice)

const panel = createPanel($('panel'), tunables, RANGES, {
  onChange: save,
  buttons: [
    ['copy preset', () => copyText(JSON.stringify(tunables, null, 2))],
    [
      'paste preset',
      () => {
        const text = prompt('Paste preset JSON')
        if (!text) return
        try {
          assignDeep(tunables, JSON.parse(text))
        } catch {
          return alert('Not valid JSON')
        }
        panel.sync()
        save()
      },
    ],
    [
      'defaults',
      () => {
        assignDeep(tunables, DEFAULTS)
        panel.sync()
        save()
      },
    ],
    ['copy dive log', () => copyText(game.dives.map(diveLine).join('\n') || 'no dives yet')],
  ],
})

/** @type {number | null} input timestamp waiting for the sim to take its command */
let pending = null
let latency = 0
const input = createInput(
  canvas,
  tunables,
  (cmd, stamp) => {
    command(game, cmd)
    if (pending === null) pending = stamp
    if (cmd.type === 'intent') $('log').classList.remove('open')
  },
  { togglePanel: () => panel.toggle(), gesture: () => juice.sound.unlock() },
)

window.addEventListener('resize', () => renderer.resize())

// for the browser console and automated checks: read state, never write it
Object.assign(window, { b1: { game, tunables } })

/** @param {Dive} d */
function diveLine(d) {
  const stops = Object.entries(d.stops)
    .map(([k, n]) => `${k}:${n}`)
    .join(' ')
  const secs = (d.ticks / 60).toFixed(1)
  return `${BUILD} #${d.n} ${secs}s ore ${d.ore} loot ${d.loot} depth ${d.depth} mined ${d.mined} built ${d.built} | ${stops} | preset ${presetId(tunables)}`
}

/** @param {Dive} d */
function showLog(d) {
  $('log-text').textContent =
    `Dive ${d.n}: ${(d.ticks / 60).toFixed(0)} s, ore ${d.ore}, loot ${d.loot}, ${d.depth} deep\n` +
    `Home: ore ${game.stash.ore}, loot ${game.stash.loot}`
  $('log').classList.add('open')
}
$('log-copy').onclick = () => copyText(game.dives.map(diveLine).join('\n'))

// Clipboard needs a secure context; a phone on http://<lan-ip> isn't one, so fall back.
/** @param {string} text */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // fall through
  }
  const area = document.createElement('textarea')
  area.value = text
  document.body.append(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (!ok) prompt('Copy this:', text)
}

let last = performance.now()
let acc = 0
let lastReadout = 0
/** @type {number[]} */
const frameMs = []

/** @param {number} now */
function frame(now) {
  const ms = now - last
  last = now
  frameMs.push(ms)
  if (frameMs.length > 60) frameMs.shift()
  acc = Math.min(acc + ms, 100)

  while (acc >= TICK_MS) {
    const hadCommand = game.queue.length > 0
    tick(game)
    acc -= TICK_MS
    if (hadCommand && pending !== null) {
      latency = performance.now() - pending
      pending = null
    }
  }

  for (const e of game.events) {
    juice.onEvent(e)
    if (e.type === 'mined' || e.type === 'built') renderer.setTile(e.x, e.y)
    if (e.type === 'teleport') {
      renderer.snap()
      if (e.dive) showLog(e.dive)
    }
  }
  game.events.length = 0

  const dt = Math.min(ms, 100) / 1000
  juice.update(dt)
  renderer.draw(acc / TICK_MS, dt, now / 1000, input.charge(now))

  if (panel.isOpen() && now - lastReadout > 250) {
    lastReadout = now
    panel.setReadout(readout())
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

function readout() {
  const avg = frameMs.reduce((a, b) => a + b, 0) / frameMs.length
  const max = Math.max(...frameMs)
  const r = renderer.info()
  const { ch, step, run } = game
  return [
    `${BUILD} · preset ${presetId(tunables)}`,
    `frame ${avg.toFixed(1)} ms avg, ${max.toFixed(1)} max`,
    `input→sim ${latency.toFixed(0)} ms (${input.kind()})`,
    `dpr ${r.dpr} · ${innerWidth}×${innerHeight} css · tile ${r.tilePx} px`,
    `pos ${ch.x},${ch.y} · depth ${ch.y - home.y} · ${run ? `run ${run.dx},${run.dy}` : 'idle'}${step ? ` · ${step.action.kind}` : ''}`,
    `home: ore ${game.stash.ore} loot ${game.stash.loot} · dives ${game.dives.length}`,
    '` or tap the top-left corner: close',
  ].join('\n')
}
