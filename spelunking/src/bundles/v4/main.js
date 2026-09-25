// v4 · Rule Lab: edit a dig ruleset (the swipe table, situations, refusal signals, stops, numbers)
// against the examples, which replay on every change. Both live in this browser until exported;
// b1.html?rules=lab plays the ruleset saved here.

import { TILE_RGB } from '../../render/palette.js'
import { conditionText, rulesetMarkdown } from '../../sim/dig/describe.js'
import { ARROWS, EXAMPLES_FORMAT, LEGEND, parseMap, runExample } from '../../sim/dig/examples.js'
import {
  ALWAYS_STOPS,
  compile,
  CONDITIONS,
  INTENTS,
  MEANINGS,
  migrate,
  PLACEABLE,
  RULESET_FORMAT,
  SIGNALS,
  simConfig,
  STOPS,
} from '../../sim/dig/ruleset.js'
import { Tile } from '../../sim/gen/world.js'
import { pretty } from './json.js'

/** @typedef {import('../../sim/dig/ruleset.js').Ruleset} Ruleset */
/** @typedef {import('../../sim/dig/ruleset.js').Intent} Intent */
/** @typedef {import('../../sim/dig/ruleset.js').Row} Row */
/** @typedef {import('../../sim/dig/examples.js').Example} Example */
/** @typedef {import('../../sim/dig/examples.js').ExampleResult} ExampleResult */
/** @typedef {{ format: string, version: number, legend: string, examples: Example[] }} ExampleFile */

const STORE = 'rulelab-ruleset' // b1.html?rules=lab plays this
const EX_STORE = 'rulelab-examples'
const INTENT_IDS = /** @type {Intent[]} */ (Object.keys(INTENTS))
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id))

/** @type {Ruleset} */
let rs
/** @type {ExampleFile} */
let exFile
/** @type {string | null} the selected row, "intent index" */
let selected = null

// ---- DOM helpers ----

/**
 * @param {string} tag
 * @param {Record<string, any>} [props] `on…` are listeners, `class` is className, the rest properties
 * @param {...(Node | string | null | false | undefined)} kids
 * @returns {HTMLElement}
 */
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else if (k === 'class') el.className = v
    else /** @type {any} */ (el)[k] = v
  }
  for (const kid of kids) if (kid !== null && kid !== false && kid !== undefined) el.append(kid)
  return el
}

/** @param {string} label @param {() => void} fn @param {string} [title] */
const button = (label, fn, title = '') => h('button', { onclick: fn, title }, label)

/**
 * @param {[string, string][]} options value, label
 * @param {string | undefined} value
 * @param {(v: string) => void} set
 */
function select(options, value, set) {
  const el = /** @type {HTMLSelectElement} */ (h('select', { onchange: () => change(() => set(el.value)) }))
  for (const [v, label] of options) el.append(h('option', { value: v, selected: v === value }, label))
  if (value !== undefined && !options.some(([v]) => v === value)) el.append(h('option', { value, selected: true }, `? ${value}`))
  return el
}

/** @param {() => void} fn */
function change(fn) {
  fn()
  save()
  render()
}

// ---- storage ----

/** @param {string} key */
function stored(key) {
  try {
    const text = localStorage.getItem(key)
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(rs))
    localStorage.setItem(EX_STORE, JSON.stringify(exFile))
  } catch {
    // not persisted: export before closing the tab
  }
}

/** @param {string} path */
const fetchJson = async (path) => (await fetch(path, { cache: 'no-cache' })).json()

async function load() {
  rs = migrate(stored(STORE) ?? (await fetchJson('rules/b1.3.json')))
  exFile = stored(EX_STORE) ?? (await fetchJson('rules/examples.json'))
  render()
}

// Clipboard needs a secure context; fall back to a prompt.
/** @param {string} text */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    flash('copied')
  } catch {
    prompt('Copy this:', text)
  }
}

/** @param {string} name @param {string} text */
function download(name, text) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name })
  a.click()
  URL.revokeObjectURL(/** @type {HTMLAnchorElement} */ (a).href)
}

/** @param {string} text */
function flash(text) {
  $('flash').textContent = text
  setTimeout(() => ($('flash').textContent = ''), 1500)
}

// ---- header ----

function header() {
  return [
    h('h1', {}, 'Rule Lab ', h('span', { class: 'dim' }, 'v4')),
    h('input', {
      value: rs.name,
      title: 'ruleset name',
      onchange: (/** @type {Event} */ e) => change(() => (rs.name = /** @type {HTMLInputElement} */ (e.target).value)),
    }),
    button('copy ruleset', () => copyText(pretty(rs) + '\n')),
    button('paste ruleset', pasteRuleset),
    button('download', () => download(`${rs.name}.json`, pretty(rs) + '\n'), 'save as rules/<name>.json'),
    button('copy examples', () => copyText(pretty(exFile) + '\n'), 'rules/examples.json'),
    button('paste examples', pasteExamples),
    button('paste bug report', pasteReport, "the text b1's 🐞 button copied: its last swipe becomes a draft example"),
    button('copy as Markdown', () => copyText(rulesetMarkdown(rs)), 'the "Rules at close" tables'),
    button('reset to files', reset, 'reload rules/b1.3.json and rules/examples.json, dropping edits'),
    button('▶ play in b1', () => {
      save()
      open('b1.html?rules=lab', 'b1')
    }),
    h('span', { id: 'flash' }),
  ]
}

function pasteRuleset() {
  const text = prompt('Paste ruleset JSON')
  if (!text) return
  try {
    const r = migrate(JSON.parse(text))
    if (r.format !== RULESET_FORMAT) return alert(`Not a ruleset (format should be "${RULESET_FORMAT}")`)
    change(() => ((rs = r), (selected = null)))
  } catch {
    alert('Not valid JSON')
  }
}

function pasteReport() {
  const text = prompt('Paste the bug report b1 copied')
  if (!text) return
  const line = text.split('\n').find((l) => l.startsWith('EXAMPLE '))
  if (!line) return alert('No EXAMPLE line in that text: copy the report again with the 🐞 button')
  try {
    /** @type {Example} */
    const ex = JSON.parse(line.slice('EXAMPLE '.length))
    const { numbers, stops, start } = ex
    Object.assign(draft, {
      id: ex.id,
      note: ex.note,
      map: ex.map.join('\n'),
      swipes: ex.swipes.map((s) => s.swipe).join(' '),
      editing: null,
    })
    draft.extra = { numbers, stops, start }
    draftOpen = true
    render()
    $('examples').scrollTop = 0
  } catch {
    alert('The EXAMPLE line is not valid JSON')
  }
}

function pasteExamples() {
  const text = prompt('Paste examples JSON')
  if (!text) return
  try {
    const e = JSON.parse(text)
    if (e.format !== EXAMPLES_FORMAT) return alert(`Not an examples file (format should be "${EXAMPLES_FORMAT}")`)
    change(() => (exFile = e))
  } catch {
    alert('Not valid JSON')
  }
}

async function reset() {
  if (!confirm('Drop all edits here and reload the files?')) return
  rs = await fetchJson('rules/b1.3.json')
  exFile = await fetchJson('rules/examples.json')
  selected = null
  save()
  render()
}

// ---- the rules pane ----

/** @param {string[]} errors @param {Map<string, Set<number>>} uses */
function rulesPane(errors, uses) {
  const situationOptions = /** @type {[string, string][]} */ (Object.keys(rs.situations).map((s) => [s, s]))
  const meaningOptions = /** @type {[string, string][]} */ (Object.keys(MEANINGS).map((m) => [m, m]))
  const out = []
  if (errors.length) out.push(h('ul', { class: 'errors' }, ...errors.map((e) => h('li', {}, e))))

  out.push(
    h(
      'h2',
      {},
      'What a swipe means ',
      h('span', { class: 'dim' }, 'first match wins · "ahead" = the swipe\'s side (↓ ↑: the side you face)'),
    ),
  )
  for (const intent of INTENT_IDS) {
    const rows = rs.table[intent] ?? (rs.table[intent] = [])
    const block = h('div', { class: 'intent' }, h('h3', {}, `${INTENTS[intent]} `, h('span', { class: 'dim' }, intent)))
    rows.forEach((row, i) => {
      const key = `${intent} ${i}`
      const n = uses.get(key)?.size ?? 0
      const m = MEANINGS[row.do]
      const conds = rs.situations[row.if] ?? []
      block.append(
        h(
          'div',
          { class: `row${selected === key ? ' sel' : ''}` },
          h('span', { class: 'n', title: 'show the examples that use this row', onclick: () => pick(key) }, String(i + 1)),
          select(situationOptions, row.if, (v) => (row.if = v)),
          h('span', { class: 'arrow' }, '→'),
          select(meaningOptions, row.do, (v) => setMeaning(row, v)),
          paramInput(row),
          h(
            'span',
            { class: `uses${n ? '' : ' none'}`, title: 'examples that use this row', onclick: () => pick(key) },
            n ? `${n} ex` : 'no example',
          ),
          button('↑', () => change(() => moveRow(intent, i, -1)), 'move up'),
          button('↓', () => change(() => moveRow(intent, i, 1)), 'move down'),
          button('✕', () => change(() => (rows.splice(i, 1), (selected = null))), 'delete row'),
        ),
        h('div', { class: 'desc' }, `${conds.length ? conds.map(conditionText).join(', ') : 'anything'} → ${m ? m.text : '?'}`),
      )
    })
    block.append(button('+ row', () => change(() => rows.push({ if: 'always', do: 'refuse', reason: 'noRule' }))))
    out.push(block)
  }

  out.push(h('h2', {}, 'Situations ', h('span', { class: 'dim' }, 'all of: click a condition to cycle ignore → needed → needed not')))
  const refs = (/** @type {string} */ name) => INTENT_IDS.reduce((n, i) => n + (rs.table[i] ?? []).filter((r) => r.if === name).length, 0)
  for (const [name, conds] of Object.entries(rs.situations)) {
    const n = refs(name)
    out.push(
      h(
        'div',
        { class: 'situation' },
        h('input', {
          class: 'name',
          value: name,
          onchange: (/** @type {Event} */ e) => renameSituation(name, /** @type {HTMLInputElement} */ (e.target).value),
        }),
        h('span', { class: 'chips' }, ...Object.keys(CONDITIONS).map((c) => chip(conds, c))),
        h('span', { class: `uses${n ? '' : ' none'}` }, `${n} rows`),
        n ? null : button('✕', () => change(() => delete rs.situations[name]), 'delete (unused)'),
      ),
    )
  }
  out.push(
    button('+ situation', () => {
      const name = prompt('Name of the new situation')
      if (name && !rs.situations[name]) change(() => (rs.situations[name] = []))
    }),
  )

  out.push(h('h2', {}, 'Refusals ', h('span', { class: 'dim' }, 'every blocked reason names its signal (D027)')))
  const signalOptions = /** @type {[string, string][]} */ (Object.entries(SIGNALS).map(([s, t]) => [s, `${s}: ${t}`]))
  for (const reason of Object.keys(rs.reasons))
    out.push(
      h(
        'div',
        { class: 'kv' },
        h('span', {}, reason),
        select(signalOptions, rs.reasons[reason], (v) => (rs.reasons[reason] = v)),
        button('✕', () => change(() => delete rs.reasons[reason]), 'delete'),
      ),
    )

  out.push(
    h(
      'h2',
      {},
      'Stop rules ',
      h(
        'span',
        { class: 'dim' },
        'a run of steps goes on until one fires; a refusal always stops (noOre / packFull mid-run give way to the stop the run would make anyway, D030)',
      ),
    ),
  )
  for (const [k, text] of Object.entries(STOPS)) {
    const key = /** @type {keyof Ruleset['stops']} */ (k)
    out.push(
      h(
        'label',
        { class: 'kv' },
        h('input', { type: 'checkbox', checked: rs.stops[key], onchange: () => change(() => (rs.stops[key] = !rs.stops[key])) }),
        h('span', {}, k),
        h('span', { class: 'dim' }, text),
      ),
    )
  }
  for (const [k, text] of Object.entries(ALWAYS_STOPS))
    out.push(
      h(
        'div',
        { class: 'kv' },
        h('input', { type: 'checkbox', checked: true, disabled: true }),
        h('span', {}, k),
        h('span', { class: 'dim' }, `${text} (always)`),
      ),
    )

  out.push(h('h2', {}, 'Numbers ', h('span', { class: 'dim' }, 'ticks at 60 per second · swipe: CSS px and degrees')))
  out.push(...numberInputs(rs.numbers, ''), ...numberInputs(rs.swipes, 'swipe.'))
  return out
}

/** @param {Row} row */
function paramInput(row) {
  const param = MEANINGS[row.do]?.param
  if (param === 'place')
    return select(
      Object.keys(PLACEABLE).map((p) => [p, `place ${p}`]),
      row.place ?? 'built',
      (v) => (row.place = v),
    )
  if (param !== 'reason') return h('span', { class: 'param' })
  const list = h('datalist', { id: 'reasons' }, ...Object.keys(rs.reasons).map((r) => h('option', { value: r })))
  const input = /** @type {HTMLInputElement} */ (
    h('input', {
      class: 'param',
      value: row.reason ?? '',
      title: 'the reason it refuses: pick one, or type a new one',
      onchange: () =>
        change(() => {
          row.reason = input.value
          if (input.value && !rs.reasons[input.value]) rs.reasons[input.value] = 'none'
        }),
    })
  )
  input.setAttribute('list', 'reasons')
  return h('span', {}, input, list)
}

/** @param {Row} row @param {string} meaning */
function setMeaning(row, meaning) {
  row.do = meaning
  delete row.reason
  delete row.place
  const param = MEANINGS[meaning]?.param
  if (param === 'reason') row.reason = 'noRule'
  if (param === 'place') row.place = 'built'
}

/** @param {Intent} intent @param {number} i @param {number} by */
function moveRow(intent, i, by) {
  const rows = rs.table[intent]
  const j = i + by
  if (j < 0 || j >= rows.length) return
  ;[rows[i], rows[j]] = [rows[j], rows[i]]
  if (selected === `${intent} ${i}`) selected = `${intent} ${j}`
  else if (selected === `${intent} ${j}`) selected = `${intent} ${i}`
}

/** @param {string} key */
function pick(key) {
  selected = selected === key ? null : key
  render()
}

/** @param {string[]} conds edited in place @param {string} c */
function chip(conds, c) {
  const state = conds.includes(c) ? 'need' : conds.includes(`!${c}`) ? 'not' : 'off'
  return h(
    'span',
    {
      class: `chip ${state}`,
      title: CONDITIONS[c].text,
      onclick: () =>
        change(() => {
          const next = { off: c, need: `!${c}`, not: null }[state]
          const kept = conds.filter((x) => x.replace(/^!/, '') !== c)
          conds.length = 0
          conds.push(...kept)
          if (next) conds.push(next)
        }),
    },
    state === 'not' ? `¬${c}` : c,
  )
}

/** @param {string} from @param {string} to */
function renameSituation(from, to) {
  if (!to || to === from) return render()
  if (rs.situations[to]) {
    alert(`There's already a situation "${to}"`)
    return render()
  }
  change(() => {
    rs.situations = Object.fromEntries(Object.entries(rs.situations).map(([k, v]) => [k === from ? to : k, v]))
    for (const i of INTENT_IDS) for (const row of rs.table[i] ?? []) if (row.if === from) row.if = to
  })
}

/** @param {Record<string, any>} obj edited in place @param {string} prefix @returns {HTMLElement[]} */
function numberInputs(obj, prefix) {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object'
      ? numberInputs(v, `${prefix}${k}.`)
      : typeof v === 'boolean'
        ? [
            h(
              'label',
              { class: 'kv' },
              h('span', {}, prefix + k),
              h('input', { type: 'checkbox', checked: v, onchange: () => change(() => (obj[k] = !obj[k])) }),
            ),
          ]
        : [
            h(
              'label',
              { class: 'kv' },
              h('span', {}, prefix + k),
              h('input', {
                type: 'number',
                value: v,
                onchange: (/** @type {Event} */ e) => change(() => (obj[k] = Number(/** @type {HTMLInputElement} */ (e.target).value))),
              }),
            ),
          ],
  )
}

// ---- the examples pane ----

/**
 * @param {ExampleResult[] | null} results
 * @param {Map<string, Set<number>>} uses
 */
function examplesPane(results, uses) {
  const out = [form()]
  if (!results) return [...out, h('p', { class: 'errors' }, 'The ruleset has errors: fix them to replay the examples.')]
  const failing = results.filter((r) => r.problems.length).length
  const only = selected ? uses.get(selected) : null
  out.push(
    h(
      'h2',
      {},
      `Examples: ${results.length - failing} pass`,
      failing ? h('span', { class: 'bad' }, `, ${failing} fail`) : '',
      selected ? h('span', { class: 'dim' }, ` · highlighting the ones row ${rowLabel(selected)} decides `) : '',
      selected ? button('show all', () => pick(/** @type {string} */ (selected))) : '',
    ),
  )
  const grid = h('div', { class: 'grid' })
  const order = exFile.examples
    .map((_, i) => i)
    .sort((a, b) => Number(!results[b].problems.length) - Number(!results[a].problems.length) || a - b)
  for (const i of order) grid.append(card(exFile.examples[i], results[i], only ? !only.has(i) : false)) // failing first
  out.push(grid)
  return out
}

/** @param {string} key "intent index" */
const rowLabel = (key) => {
  const [intent, i] = key.split(' ')
  return `${INTENTS[/** @type {Intent} */ (intent)]} ${Number(i) + 1}`
}

/** @param {Example} ex @param {ExampleResult} res @param {boolean} dim */
function card(ex, res, dim) {
  const canvas = /** @type {HTMLCanvasElement} */ (h('canvas'))
  drawExample(canvas, ex, res)
  const ok = !res.problems.length
  const lines = ex.swipes.map((s, n) => {
    const got = res.swipes[n]
    const tags = [...new Set(got?.rules.map((r) => `${r.intent} ${r.row}`) ?? [])]
    return h(
      'div',
      { class: `swipe ${got?.ok ? '' : 'bad'}` },
      `${s.swipe} ${got?.stop ?? '?'} @${got?.at ?? '?'} `,
      got?.ok ? '✓' : `✗ expected ${s.stop}${s.at ? ` @${s.at}` : ''}`,
      h(
        'span',
        { class: 'tags' },
        ...tags.map((t) => h('span', { class: `tag${t === selected ? ' sel' : ''}`, onclick: () => pick(t) }, rowLabel(t))),
      ),
    )
  })
  const other = res.problems.filter((p) => !p.startsWith('swipe'))
  return h(
    'div',
    { class: `card ${ok ? 'pass' : 'fail'}${dim ? ' dim' : ''}` },
    canvas,
    h(
      'div',
      { class: 'title' },
      ex.id,
      ex.numbers || ex.stops ? h('span', { class: 'dim', title: JSON.stringify({ ...ex.numbers, ...ex.stops }) }, ' · overrides') : '',
    ),
    h('div', { class: 'note' }, ex.note),
    ...lines,
    ...other.map((p) => h('pre', { class: 'bad' }, p)),
    h(
      'div',
      { class: 'buttons' },
      ok ? null : button('accept result', () => change(() => accept(ex, res)), 'the rules are right: record what happens now as expected'),
      button('edit', () => editExample(ex)),
      button('✕', () => confirm(`Delete example ${ex.id}?`) && change(() => exFile.examples.splice(exFile.examples.indexOf(ex), 1))),
    ),
  )
}

/** @param {Example} ex @param {ExampleResult} res */
function accept(ex, res) {
  ex.swipes.forEach((s, n) => {
    s.stop = res.swipes[n].stop
    if (s.at || !res.swipes[n].ok) s.at = res.swipes[n].at
  })
  if (ex.after) ex.after = res.after
  if (ex.pack) ex.pack = res.pack
}

/** @type {Record<string, number>} */
const TILE_OF = { ...LEGEND, '@': Tile.Open }

/** @param {HTMLCanvasElement} canvas @param {Example} ex @param {ExampleResult} res */
function drawExample(canvas, ex, res) {
  const w = ex.map[0].length
  const rows = ex.map.length
  const s = Math.max(6, Math.min(16, Math.floor(260 / w)))
  canvas.width = w * s
  canvas.height = rows * s
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))
  const rgb = (/** @type {number} */ t) => `rgb(${TILE_RGB[/** @type {Tile} */ (t)].join(',')})`
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < w; x++) {
      const before = TILE_OF[ex.map[y][x]] ?? Tile.Soft
      const after = TILE_OF[res.after[y]?.[x]] ?? before
      ctx.fillStyle = rgb(after)
      ctx.fillRect(x * s, y * s, s, s)
      if (after === Tile.Open && before !== Tile.Open) {
        // mined: a faint outline of what was there
        ctx.strokeStyle = rgb(before)
        ctx.strokeRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3)
      }
    }
  const c = (/** @type {number} */ v) => v * s + s / 2
  ctx.strokeStyle = '#e6dc5a'
  ctx.lineWidth = 2
  for (const sw of res.swipes) {
    ctx.beginPath()
    sw.path.forEach((p, i) => {
      const prev = sw.path[i - 1]
      if (i === 0 || Math.abs(p.x - prev.x) > 1) ctx.moveTo(c(p.x), c(p.y))
      else ctx.lineTo(c(p.x), c(p.y))
    })
    ctx.stroke()
    ctx.strokeStyle = 'rgba(240, 50, 60, 0.9)'
    for (const t of sw.tried) ctx.strokeRect(t.x * s + 1, t.y * s + 1, s - 2, s - 2)
    ctx.strokeStyle = '#e6dc5a'
  }
  const start = parseMap(ex.map).at
  ctx.strokeStyle = '#f4f1de'
  ctx.beginPath()
  ctx.arc(c(start.x), c(start.y), s / 3, 0, Math.PI * 2)
  ctx.stroke()
  const end = res.swipes[res.swipes.length - 1]?.at
  if (end) {
    ctx.fillStyle = '#f4f1de'
    ctx.fillRect(end[0] * s + s / 4, end[1] * s + s / 4, s / 2, s / 2)
  }
}

// ---- new / edited example ----

const draft = {
  id: '',
  note: '',
  map: '#######\n#@....#\n#######',
  swipes: '→',
  editing: /** @type {Example | null} */ (null),
  /** @type {Pick<Example, 'numbers' | 'stops' | 'start'>} from a bug report */
  extra: {},
}
let draftOpen = false

/** @param {Example} ex */
function editExample(ex) {
  Object.assign(draft, { id: ex.id, note: ex.note, map: ex.map.join('\n'), swipes: ex.swipes.map((s) => s.swipe).join(' '), editing: ex })
  render()
  $('examples').scrollTop = 0
}

/** The draft as an example, or the reason it isn't one yet. @returns {Example | string} */
function draftExample() {
  const map = draft.map
    .split('\n')
    .map((r) => r.trimEnd())
    .filter(Boolean)
  if (!map.length) return 'draw a map'
  if (map.some((r) => r.length !== map[0].length)) return 'every map row needs the same width'
  const bad = [...map.join('')].find((ch) => !(ch in LEGEND))
  if (bad) return `"${bad}" isn't in the legend: ${exFile.legend}`
  if (map.join('').split('@').length !== 2) return 'put exactly one @ (you) on the map'
  const swipes = [...draft.swipes].filter((ch) => ch in ARROWS)
  if (!swipes.length) return 'add a swipe'
  const base = draft.editing ?? draft.extra
  return { ...base, id: draft.id || 'new', note: draft.note, map, swipes: swipes.map((swipe) => ({ swipe, stop: '?' })) }
}

function form() {
  const preview = h('div', { class: 'preview' })
  const update = () => {
    preview.replaceChildren()
    const ex = draftExample()
    const { table } = compile(rs)
    if (typeof ex === 'string' || !table)
      return preview.append(h('span', { class: 'dim' }, typeof ex === 'string' ? ex : 'fix the ruleset first'))
    const res = runExample(ex, table, simConfig(rs))
    const canvas = /** @type {HTMLCanvasElement} */ (h('canvas'))
    drawExample(canvas, ex, res)
    preview.append(canvas, ...res.swipes.map((sw, n) => h('div', { class: 'swipe' }, `${ex.swipes[n].swipe} ${sw.stop} @${sw.at}`)))
  }
  const field = (
    /** @type {'id' | 'note' | 'map' | 'swipes'} */ k,
    /** @type {string} */ tag,
    /** @type {Record<string, any>} */ props = {},
  ) =>
    h(tag, {
      ...props,
      value: draft[k],
      oninput: (/** @type {Event} */ e) => {
        draft[k] = /** @type {HTMLInputElement} */ (e.target).value
        update()
      },
    })
  const swipes = /** @type {HTMLInputElement} */ (field('swipes', 'input', { placeholder: 'swipes, e.g. → ↘' }))
  const arrows = Object.keys(ARROWS).map((a) =>
    button(a, () => {
      draft.swipes += a
      swipes.value = draft.swipes
      update()
    }),
  )
  const save = () => {
    const ex = draftExample()
    if (typeof ex === 'string') return alert(ex)
    const { table } = compile(rs)
    if (!table) return alert('Fix the ruleset first')
    if (!draft.id) return alert('Give it an id')
    if (exFile.examples.some((e) => e.id === draft.id && e !== draft.editing)) return alert(`There's already an example "${draft.id}"`)
    const res = runExample(ex, table, simConfig(rs))
    ex.swipes.forEach((s, n) => ((s.stop = res.swipes[n].stop), (s.at = res.swipes[n].at)))
    change(() => {
      if (draft.editing) exFile.examples[exFile.examples.indexOf(draft.editing)] = ex
      else exFile.examples.unshift(ex)
      draft.editing = null
      draft.extra = {}
    })
  }
  const box = h(
    'details',
    {
      class: 'form',
      open: !!draft.editing || draftOpen,
      ontoggle: (/** @type {Event} */ e) => (draftOpen = /** @type {HTMLDetailsElement} */ (e.target).open),
    },
    h('summary', {}, draft.editing ? `Edit example ${draft.editing.id}` : 'New example'),
    h(
      'div',
      { class: 'form-body' },
      h(
        'div',
        {},
        field('id', 'input', { placeholder: 'id' }),
        field('note', 'input', { placeholder: 'what it shows' }),
        field('map', 'textarea', { rows: 8, spellcheck: false }),
        h('div', { class: 'dim' }, exFile.legend),
        swipes,
        h('div', {}, ...arrows),
        h(
          'div',
          { class: 'buttons' },
          button(draft.editing ? 'save example' : 'add example', save, 'records what happens now as expected: check the preview first'),
          draft.editing ? button('cancel', () => ((draft.editing = null), render())) : null,
        ),
      ),
      preview,
    ),
  )
  update()
  return box
}

// ---- render ----

function render() {
  $('head').replaceChildren(...header())
  const { table, errors } = compile(rs)
  /** @type {Map<string, Set<number>>} row → the examples that use it */
  const uses = new Map()
  /** @type {ExampleResult[] | null} */
  let results = null
  if (table) {
    const cfg = simConfig(rs)
    results = exFile.examples.map((ex, i) => {
      try {
        const res = runExample(ex, table, cfg)
        for (const s of res.swipes)
          for (const r of s.rules) {
            const key = `${r.intent} ${r.row}`
            if (!uses.has(key)) uses.set(key, new Set())
            uses.get(key)?.add(i)
          }
        return res
      } catch (e) {
        return { swipes: [], after: ex.map, pack: [], problems: [`can't run: ${e}`] }
      }
    })
  }
  $('rules').replaceChildren(...rulesPane(errors, uses))
  $('examples').replaceChildren(...examplesPane(results, uses))
}

load()
