// A ruleset as Markdown tables: the timeline's "Rules at close" and the Rule Lab's "copy as
// Markdown". Everything is generated from the JSON and the vocabulary's own descriptions.

import { ALWAYS_STOPS, CONDITIONS, INTENTS, MEANINGS, SIGNALS, STOPS } from './ruleset.js'

/** @typedef {import('./ruleset.js').Ruleset} Ruleset */
/** @typedef {import('./ruleset.js').Intent} Intent */

/** @param {string} c a condition id, `!` negates */
export function conditionText(c) {
  const text = CONDITIONS[c.replace(/^!/, '')]?.text ?? `unknown "${c}"`
  return c.startsWith('!') ? `not: ${text}` : text
}

/** @param {Ruleset} r @returns {string} */
export function rulesetMarkdown(r) {
  const cell = (/** @type {string} */ s) => s.replace(/\|/g, '\\|')
  const out = [
    `Ruleset \`${r.name}\`${r.note ? `: ${r.note}` : ''}`,
    '',
    '**What a swipe means** (the first matching row wins; "ahead" is the swipe\'s side, for ↓ ↑ the side you face):',
    '',
    '| Swipe | Situation | Action |',
    '|---|---|---|',
  ]
  for (const intent of /** @type {Intent[]} */ (Object.keys(INTENTS)))
    for (const row of r.table[intent] ?? []) {
      const conds = r.situations[row.if] ?? []
      const when = conds.length ? conds.map(conditionText).join(', ') : 'anything else'
      const m = MEANINGS[row.do]
      const what = row.do === 'refuse' ? `nothing (\`${row.reason}\`)` : `${m?.text ?? row.do}${row.place ? ` (places ${row.place})` : ''}`
      out.push(`| ${INTENTS[intent]} | \`${row.if}\`: ${cell(when)} | ${cell(what)} |`)
    }
  out.push('', '**Refusals** (every blocked reason names its signal, D027):', '', '| Reason | Signal |', '|---|---|')
  for (const [reason, signal] of Object.entries(r.reasons)) out.push(`| \`${reason}\` | ${signal}: ${SIGNALS[signal] ?? '?'} |`)
  out.push(
    '',
    '**Stop rules** (a run of steps goes on until one fires; a refusal always stops):',
    '',
    '| Rule | Stops the run when | |',
    '|---|---|---|',
  )
  for (const [k, text] of Object.entries(STOPS))
    out.push(`| \`${k}\` | ${text} | ${r.stops[/** @type {keyof typeof r.stops} */ (k)] ? 'on' : 'off'} |`)
  for (const [k, text] of Object.entries(ALWAYS_STOPS)) out.push(`| \`${k}\` | ${text} | always |`)
  out.push('', '**Numbers** (ticks at 60 per second):', '', '| Tunable | Value |', '|---|---|')
  const flat = (/** @type {Record<string, any>} */ o, prefix = '') =>
    Object.entries(o).forEach(([k, v]) => (typeof v === 'object' ? flat(v, `${prefix}${k}.`) : out.push(`| ${prefix}${k} | ${v} |`)))
  flat(r.numbers)
  flat(r.swipes, 'swipe.')
  return out.join('\n')
}
