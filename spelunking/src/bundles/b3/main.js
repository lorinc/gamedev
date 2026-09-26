// b3 · Tamed Bugs (forked from b2.1, p6): wires sim + input + render + juice + dev panel. Fixed 60 Hz sim, render interpolates.
// The rules come from a ruleset: rules/b3.7.json, or with ?rules=lab the one the Rule Lab (v4.html)
// saved in this browser.

import { command, createGame, tick, withSurface } from '../../sim/dig/game.js'
import { compile, migrate, simConfig } from '../../sim/dig/ruleset.js'
import { DEFAULT_TERRAIN, generateTerrain } from '../../sim/gen/terrain.js'
import { createInput } from './input.js'
import { createJuice } from './juice.js'
import { createPanel } from './panel.js'
import { createRenderer } from './render.js'
import { createRecorder } from './report.js'
import { assignDeep, changedFrom, DEFAULTS, presetId, RANGES, ZOOM_PX } from './tunables.js'

/** @typedef {import('../../sim/dig/game.js').Dive} Dive */
/** @typedef {import('../../sim/dig/game.js').Stash} Stash */
/** @typedef {import('../../sim/dig/ruleset.js').Ruleset} Ruleset */
/** @typedef {import('../../sim/dig/ruleset.js').Table} Table */

const BUILD = 'b3-dev' // the live build; npm run freeze stamps the build id into frozen copies
const STORE = 'b3-tunables-changed' // only values tuned away from DEFAULTS
const LAB_STORE = 'rulelab-ruleset' // written by v4.html
const TICK_MS = 1000 / 60
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id))

/** @returns {Promise<Ruleset>} */
async function loadRuleset() {
  if (new URLSearchParams(location.search).get('rules') === 'lab') {
    try {
      const saved = localStorage.getItem(LAB_STORE)
      if (saved) return migrate(JSON.parse(saved))
    } catch {
      // no storage or bad JSON: the default ruleset
    }
    alert('No Rule Lab ruleset saved in this browser: playing rules/b3.7.json')
  }
  return migrate(await (await fetch('rules/b3.7.json', { cache: 'no-cache' })).json())
}

loadRuleset().then((ruleset) => {
  const { table, errors } = compile(ruleset)
  if (!table) return alert(`Ruleset "${ruleset.name}" has errors:\n${errors.join('\n')}`)
  // The ruleset's numbers, stops and swipe angles are the defaults; the panel tunes on top.
  // All of the ruleset's sim values: assignDeep would drop the ones DEFAULTS doesn't list (it lost
  // the crossing stop, D045, and holdPauseTicks).
  Object.assign(DEFAULTS.sim, simConfig(ruleset))
  assignDeep(DEFAULTS.input, ruleset.swipes)
  start(ruleset, table)
})

/** @param {Ruleset} ruleset @param {Table} table */
function start(ruleset, table) {
  /** @type {typeof DEFAULTS} */
  const tunables = JSON.parse(JSON.stringify(DEFAULTS))
  try {
    assignDeep(tunables, JSON.parse(localStorage.getItem(STORE) ?? '{}'))
  } catch {
    // no storage (private window, blocked): defaults
  }
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(changedFrom(DEFAULTS, tunables)))
    } catch {
      // not persisted; the panel still works for this session
    }
  }

  const { world, home } = withSurface(generateTerrain(DEFAULT_TERRAIN), 4, 3)
  const game = createGame(world, home, tunables.sim, table)
  const canvas = /** @type {HTMLCanvasElement} */ ($('game'))
  const juice = createJuice(tunables)
  const renderer = createRenderer(canvas, game, tunables, juice)
  const recorder = createRecorder(game, { build: BUILD, ruleset, preset: () => presetId(tunables) })
  const changed = () => {
    save()
    recorder.config() // a replay needs every sim value the dive ran with
  }

  const panel = createPanel($('panel'), tunables, RANGES, {
    onChange: changed,
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
          changed()
        },
      ],
      [
        'defaults',
        () => {
          assignDeep(tunables, DEFAULTS)
          panel.sync()
          changed()
        },
      ],
      ['copy dive log', () => copyText(game.dives.map(diveLine).join('\n') || 'no dives yet')],
    ],
  })

  /** A swipe was made and hasn't produced a step or a stop yet: its first outcome gets the cue. */
  let asked = false
  /** @type {number | null} input timestamp waiting for the sim to take its command */
  let pending = null
  let latency = 0
  const input = createInput(
    canvas,
    tunables,
    (cmd, stamp, how) => {
      recorder.record(cmd, how)
      command(game, cmd)
      if (cmd.type === 'intent') asked = true
      if (pending === null) pending = stamp
      if (cmd.type === 'intent') $('log').classList.remove('open')
    },
    { togglePanel: () => panel.toggle(), gesture: () => juice.sound.unlock(), zoom },
  )

  /** The wheel or a pinch: `steps` levels in (+) or out (-), clamped, remembered like a panel change (D050). @param {number} steps */
  function zoom(steps) {
    const now = renderer.level()
    const next = Math.min(Math.max(now + steps, 0), ZOOM_PX.length - 1)
    if (next === now) return
    tunables.view.zoom = next
    panel.sync()
    changed()
  }

  window.addEventListener('resize', () => renderer.resize())

  // Bug report: the last swipes, the map, a Rule Lab example and an exact replay, to the clipboard.
  const reportBug = () => copyText(recorder.report()).then(() => toast('Copied last events to clipboard'))
  $('bug').onclick = reportBug
  window.addEventListener('keydown', (e) => e.code === 'KeyB' && !e.repeat && reportBug())
  /** @type {number | undefined} */
  let toastTimer
  /** @param {string} text */
  function toast(text) {
    $('toast').textContent = text
    $('toast').classList.add('open')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => $('toast').classList.remove('open'), 2000)
  }

  // for the browser console and automated checks: read state, never write it
  Object.assign(window, { b3: { game, tunables, ruleset } })

  /** @param {Stash} s 'soft 3 hard 0 ore 1 loot 0' */
  const got = (s, sep = ' ') =>
    Object.entries(s)
      .map(([k, n]) => `${k} ${n}`)
      .join(sep)

  /** @param {Dive} d */
  function diveLine(d) {
    const stops = Object.entries(d.stops)
      .map(([k, n]) => `${k}:${n}`)
      .join(' ')
    const secs = (d.ticks / 60).toFixed(1)
    return `${BUILD} rules ${ruleset.name} #${d.n} ${secs}s ${got(d.got)} depth ${d.depth} mined ${d.mined} built ${d.built} | ${stops} | preset ${presetId(tunables)}`
  }

  /** @param {Dive} d */
  function showLog(d) {
    $('log-text').textContent =
      `Dive ${d.n}: ${(d.ticks / 60).toFixed(0)} s, ${got(d.got, ', ')}, ${d.depth} deep\nHome: ${got(game.stash, ', ')}`
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
      recorder.onEvent(e)
      if (e.type === 'mined' || e.type === 'built' || e.type === 'pulled') renderer.setTile(e.x, e.y)
      if (e.type === 'seen') renderer.seen(e.cells) // the darkness (D052)
      // The swipe cue (D032): what a swipe attempts, beside the character; red when it's refused.
      if (e.type === 'step' && e.fresh) {
        renderer.attempt(e.action.dx, e.action.dy, e.action.kind === 'build' ? 'build' : e.action.kind === 'mine' ? 'mine' : 'walk')
        asked = false
      }
      if (e.type === 'ring' && e.r === 1) asked = false // the probe's rings are the swipe's answer (D053)
      if (e.type === 'stop' && e.reason !== 'probe') {
        // a probe that ended shows no cue: its rings said it all
        const flash = table.signals[e.reason] === 'flash' // a refusal that shows even mid-run (D027)
        // a flick where only a hold would go on (D046) isn't refused: it stops with "?"
        if ((asked && e.reason !== 'hold') || flash)
          renderer.attempt(e.dx, e.dy, e.reason === 'noRock' ? 'build' : e.reason === 'packFull' ? 'mine' : 'walk', true)
        // a run that stopped on its own: just "?" (D034); a fall shows itself
        else if (e.next !== 'fall') renderer.attempt(e.dx, e.dy, 'walk', false, true)
        if (flash) renderer.fail()
        asked = false
      }
      if (e.type === 'teleport') {
        renderer.snap()
        if (e.dive) showLog(e.dive)
      }
      if (e.type === 'home' && e.dive) showLog(e.dive) // walked home with the loot (D055)
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
      `${BUILD} · rules ${ruleset.name} · preset ${presetId(tunables)}`,
      `frame ${avg.toFixed(1)} ms avg, ${max.toFixed(1)} max`,
      `input→sim ${latency.toFixed(0)} ms (${input.kind()})`,
      `dpr ${r.dpr} · ${innerWidth}×${innerHeight} css · tile ${r.tilePx} px`,
      `pos ${ch.x},${ch.y} · depth ${ch.y - home.y}${game.seen ? ` · light r ${game.radius}` : ''} · ${run ? `run ${run.dx},${run.dy}` : 'idle'}${step ? ` · ${step.action.kind}` : ''}${game.probe ? ` · probe ${game.probe.r}/${game.probe.min}-${game.probe.max}` : ''}`,
      `home: ${got(game.stash)} · dives ${game.dives.length}`,
      `bugs: ${game.bugs.filter((b) => b.kind === 'wild').length} wild (${game.bugs.filter((b) => b.chasing).length} chasing), fed ${game.fed} · bar ${game.bar.length} · placed ${game.bugs.filter((b) => b.kind === 'placed').length}`,
      '` or tap the top-left corner: close',
    ].join('\n')
  }
}
