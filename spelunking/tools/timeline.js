// Builds timeline/index.html: one card per prototype (timeline/pN-slug/entry.md), newest first,
// with its question, assumption marks, limitations, time box, Play buttons for its frozen builds,
// the conclusion and the decisions it made (timeline/decisions.md), and the full entry + feedback
// sessions behind a <details>. One static file; a few lines of inline JS count the time box days.
// Usage: node tools/timeline.js [--out file] [--dev <base url of live bN.html>] [--strict]
//   --strict  exit 1 on problems; otherwise they're printed as warnings.
// A line `<!-- ruleset: builds/b1.3/rules/b1.3.json -->` (path relative to the entry) becomes that
// ruleset's tables, so "Rules at close" is generated from the ruleset a frozen build played.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rulesetMarkdown } from '../src/sim/dig/describe.js'
import { escapeHtml, inline, mdToHtml, parseEntry, sections } from './md.js'

export const SECTIONS = ['Question', 'Assumptions', 'Limitations', 'Built', 'Feedback', 'Conclusion → next']
// The rules as they stood when a playtest closed. Required once an entry with bundle builds (bN.M)
// is concluded or killed, so the next prototype starts from a readable baseline.
export const RULES = 'Rules at close'

/**
 * Replaces each `<!-- ruleset: path -->` line with the ruleset's Markdown tables.
 * @param {string} md
 * @param {(path: string) => string | null} read the file's text, or null if it's missing
 * @returns {{ md: string, problems: string[] }}
 */
export function expandRulesets(md, read) {
  /** @type {string[]} */
  const problems = []
  const out = md.replace(/^<!-- ruleset: (\S+) -->$/gm, (line, path) => {
    const text = read(path)
    if (text === null) {
      problems.push(`ruleset ${path} not found`)
      return line
    }
    return rulesetMarkdown(JSON.parse(text))
  })
  return { md: out, problems }
}

const MARKS = /** @type {const} */ ({ '?': 'open', '✓': 'held', '✗': 'broken' })

/**
 * @typedef {{
 *   dir: string, id: string, title: string, meta: Record<string, string>,
 *   builds: { id: string, text: string, exists: boolean }[],
 *   parts: Record<string, string>, feedback: { name: string, md: string }[],
 *   assumptions: { mark: 'open' | 'held' | 'broken', text: string, postHoc: boolean }[],
 *   limitations: { kind: 'constraint' | 'cut', mark: 'open' | 'held' | 'broken' | null, text: string }[],
 * }} Entry
 */

/** @typedef {{ id: string, date: string, from: string, status: string, text: string }} Decision */

const POST_HOC = /\s*\(post-hoc\)\s*$/

/**
 * @param {string} dir  folder name, e.g. p3-dig-feel
 * @param {string} src  entry.md contents
 * @param {{ name: string, md: string }[]} feedback
 * @param {(buildId: string) => boolean} buildExists
 * @returns {{ entry: Entry, problems: string[] }}
 */
export function readEntry(dir, src, feedback, buildExists) {
  const { meta, builds, body } = parseEntry(src)
  const parts = sections(body)
  const problems = []
  for (const s of SECTIONS) if (!(s in parts)) problems.push(`${dir}: missing section "## ${s}"`)
  for (const k of ['id', 'title', 'started', 'status', 'budget']) if (!meta[k]) problems.push(`${dir}: missing "${k}:" in frontmatter`)
  const closed = meta.status === 'concluded' || meta.status === 'killed'
  if (closed && builds.some((b) => /^b\d/.test(b.id)) && !(RULES in parts)) problems.push(`${dir}: a closed playtest needs a "## ${RULES}" section`)
  if (meta.budget && !/^\d+d$/.test(meta.budget)) problems.push(`${dir}: budget must look like "3d", got "${meta.budget}"`)
  const mark = (/** @type {string} */ c) => MARKS[/** @type {keyof MARKS} */ (c)] ?? 'open'
  const assumptions = []
  for (const line of (parts['Assumptions'] ?? '').split('\n')) {
    const m = line.match(/^\s*(?:\d+\.|[-*])\s+\[(.)\]\s+(.*)$/)
    if (m) assumptions.push({ mark: mark(m[1]), text: m[2].replace(POST_HOC, ''), postHoc: POST_HOC.test(m[2]) })
  }
  const limitations = []
  for (const line of (parts['Limitations'] ?? '').split('\n')) {
    const m = line.match(/^\s*(?:\d+\.|[-*])\s+\[(constraint|cut)(?:\s+(.))?\]\s+(.*)$/)
    if (!m) continue
    const kind = /** @type {'constraint' | 'cut'} */ (m[1])
    limitations.push({ kind, mark: kind === 'constraint' ? mark(m[2] ?? '?') : null, text: m[3] })
  }
  const entry = {
    dir,
    id: meta.id ?? dir,
    title: meta.title ?? dir,
    meta,
    builds: builds.map((b) => ({ ...b, exists: buildExists(b.id) })),
    parts,
    feedback,
    assumptions,
    limitations,
  }
  for (const b of entry.builds) if (!b.exists) problems.push(`${dir}: build ${b.id} listed but builds/${b.id}/ is missing`)
  return { entry, problems }
}

/**
 * The decision ledger: table rows `| D012 | 2026-09-25 | p3 | active | text |`.
 * Status is `active` or `superseded by Dnnn`. `from` is an entry id, or `—` for decisions no prototype made.
 * @param {string} md
 * @param {Set<string>} entryIds
 * @returns {{ decisions: Decision[], problems: string[] }}
 */
export function parseDecisions(md, entryIds) {
  const decisions = []
  const problems = []
  for (const line of md.split('\n')) {
    const cells = line.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim())
    if (!/^D\d{3}$/.test(cells[0] ?? '')) continue
    const [id, date, from, status, ...rest] = cells
    decisions.push({ id, date, from, status, text: rest.join(' | ') })
  }
  const ids = new Set()
  for (const d of decisions) {
    if (ids.has(d.id)) problems.push(`decisions.md: ${d.id} is used twice`)
    ids.add(d.id)
    if (d.from !== '—' && !entryIds.has(d.from)) problems.push(`decisions.md: ${d.id} comes from unknown entry "${d.from}"`)
    const sup = d.status.match(/^superseded by (D\d{3})$/)
    if (!sup && d.status !== 'active') problems.push(`decisions.md: ${d.id} status must be "active" or "superseded by Dnnn"`)
  }
  for (const d of decisions) {
    const sup = d.status.match(/^superseded by (D\d{3})$/)
    if (sup && !ids.has(sup[1])) problems.push(`decisions.md: ${d.id} is superseded by missing ${sup[1]}`)
  }
  return { decisions, problems }
}

/** Calendar days from `start` to `end` (YYYY-MM-DD), both counted. */
export function daysUsed(/** @type {string} */ start, /** @type {string} */ end) {
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1
}

/** First paragraph of a markdown section, as inline HTML. */
function lead(/** @type {string | undefined} */ md, /** @type {(h: string) => string} */ url) {
  const para = (md ?? '').trim().split(/\n\s*\n/)[0] ?? ''
  return inline(para.replace(/\n/g, ' '), url)
}

/**
 * @param {Entry[]} entries
 * @param {{ game: string, devBase: string, decisions?: Decision[] }} opts
 */
export function renderPage(entries, opts) {
  const decisions = opts.decisions ?? []
  const byId = Object.fromEntries(entries.map((e) => [e.id, e]))
  const sorted = [...entries].sort((a, b) => b.id.localeCompare(a.id, 'en', { numeric: true }))
  const cards = sorted.map((e) => card(e, byId, opts.devBase, decisions.filter((d) => d.from === e.id))).join('\n')
  const count = (/** @type {string} */ k) => entries.reduce((n, e) => n + e.assumptions.filter((a) => a.mark === k).length, 0)
  const builds = entries.reduce((n, e) => n + e.builds.length, 0)
  const constraints = entries.reduce((n, e) => n + e.limitations.filter((l) => l.kind === 'constraint').length, 0)
  const active = decisions.filter((d) => d.status === 'active').length
  const ledger = decisions.length
    ? `<details class="ledger"><summary>Decision ledger · ${active} active · ${decisions.length - active} superseded</summary>
<table><thead><tr><th>ID</th><th>Date</th><th>From</th><th>Status</th><th>Decision</th></tr></thead><tbody>
${decisions.map((d) => `<tr id="${d.id}" class="${d.status === 'active' ? '' : 'sup'}"><td>${d.id}</td><td>${escapeHtml(d.date)}</td><td>${byId[d.from] ? `<a href="#${d.from}">${d.from}</a>` : escapeHtml(d.from)}</td><td>${inline(d.status.replace(/(D\d{3})/, '[$1](#$1)'))}</td><td>${inline(d.text)}</td></tr>`).join('\n')}
</tbody></table></details>`
    : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(opts.game)} · Timeline</title>
<link rel="icon" href="favicon.png">
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <h1>${escapeHtml(opts.game)} <span>· prototype timeline</span></h1>
  <p>Every prototype: what we believed, what we built, how it played, what we decided. Newest first. Each ▶ plays the build exactly as it was tested.</p>
  <p class="legend"><span class="a held">✓ ${count('held')} held</span> <span class="a broken">✗ ${count('broken')} broken</span> <span class="a open">? ${count('open')} open</span> · ${constraints} constraints · ${entries.length} prototypes · ${builds} builds · <a href="#ledger">${active} decisions</a></p>
</header>
<main class="line">
${cards}
</main>
<section class="ledger-wrap" id="ledger">${ledger}</section>
<footer>Generated by <code>npm run timeline</code> from <code>timeline/*/entry.md</code>.</footer>
<script>
// Open entries count their time box against today; closed ones were counted at generation time.
for (const el of document.querySelectorAll('.budget[data-start]')) {
  const d = Math.round((Date.now() - Date.parse(el.dataset.start)) / 86400000) + 1
  el.textContent = 'day ' + d + ' of ' + el.dataset.budget
  if (d > +el.dataset.budget) el.classList.add('over')
}
</script>
</body>
</html>
`
}

/**
 * @param {Entry} e
 * @param {Record<string, Entry>} byId
 * @param {string} devBase
 * @param {Decision[]} decided
 */
function card(e, byId, devBase, decided) {
  const url = (/** @type {string} */ href) => rewrite(href, e)
  const m = e.meta
  const status = escapeHtml(m.status ?? 'building')
  const from = m.from && byId[m.from] ? `<a class="from" href="#${m.from}">grew out of ${m.from} · ${escapeHtml(byId[m.from].title)}</a>` : ''
  const cover = m.cover ? `<img class="cover" src="${url(m.cover)}" alt="${escapeHtml(e.title)}" loading="lazy">` : ''
  const chips = e.assumptions
    .map((a) => `<li class="a ${a.mark}">${inline(a.text, url)}${a.postHoc ? ' <span class="ph" title="added after the first build">post-hoc</span>' : ''}</li>`)
    .join('')
  const limits = e.limitations
    .map((l) => `<li class="l ${l.kind} ${l.mark ?? ''}"><span class="k">${l.kind}</span>${inline(l.text, url)}</li>`)
    .join('')
  const budgetDays = +(m.budget ?? '').replace('d', '')
  const budget = !budgetDays
    ? ''
    : m.ended
      ? (() => {
          const d = daysUsed(m.started ?? m.ended, m.ended)
          return `<span class="budget${d > budgetDays ? ' over' : ''}">${d} of ${budgetDays} days</span>`
        })()
      : `<span class="budget" data-start="${escapeHtml(m.started ?? '')}" data-budget="${budgetDays}">budget ${budgetDays} days</span>`
  const dec = decided
    .map((d) => `<li class="${d.status === 'active' ? '' : 'sup'}"><a href="#${d.id}">${d.id}</a> ${inline(d.text, url)}</li>`)
    .join('')
  const play = e.builds
    .filter((b) => b.exists)
    .map((b) => `<a class="play" href="${e.dir}/builds/${b.id}/index.html">▶ ${escapeHtml(b.id)}</a><span class="bt">${inline(b.text, url)}</span>`)
    .join('')
  // dev: one or more live pages, comma-separated (dev: v4.html, b1.html)
  const dev = (m.dev ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<a class="play dev" href="${devBase}${p}">▶ live ${escapeHtml(p.replace(/\.html$/, ''))}</a><span class="bt">latest, unfrozen</span>`)
    .join('')
  const body = SECTIONS.filter((s) => s in e.parts)
    .map((s) => `<h2>${escapeHtml(s)}</h2>\n${mdToHtml(e.parts[s], url)}`)
    .join('\n')
  const fb = e.feedback
    .map((f) => `<section class="fb" id="${e.id}-fb-${slug(f.name)}"><h2>Feedback · ${escapeHtml(f.name.replace(/\.md$/, ''))}</h2>\n${mdToHtml(f.md.replace(/^#\s.*\n/, ''), url)}</section>`)
    .join('\n')
  const dates = `${escapeHtml(m.started ?? '')}${m.ended ? ` → ${escapeHtml(m.ended)}` : ''}`
  return `<article class="entry s-${status}" id="${e.id}">
  <header><span class="pid">${e.id}</span><h2>${escapeHtml(e.title)}</h2><span class="status">${status}</span><time>${dates}</time>${budget}${from}</header>
  ${cover}
  <p class="q">${lead(e.parts['Question'], url)}</p>
  ${chips ? `<ul class="chips">${chips}</ul>` : ''}
  ${limits ? `<ul class="limits">${limits}</ul>` : ''}
  ${play || dev ? `<div class="builds">${play}${dev}</div>` : ''}
  <p class="next"><b>→</b> ${lead(e.parts['Conclusion → next'], url) || '<i>open</i>'}</p>
  ${dec ? `<ul class="decided">${dec}</ul>` : ''}
  ${RULES in e.parts ? `<details class="rules"><summary>${RULES}</summary><div class="doc">${mdToHtml(e.parts[RULES], url)}</div></details>` : ''}
  <details><summary>Full entry${e.feedback.length ? ` · ${e.feedback.length} feedback session${e.feedback.length > 1 ? 's' : ''}` : ''}</summary>
<div class="doc">
${body}
${fb}
</div>
  </details>
</article>`
}

/** Makes a link inside an entry work from timeline/index.html. */
function rewrite(/** @type {string} */ href, /** @type {Entry} */ e) {
  if (/^([a-z]+:|#|\/)/i.test(href)) return href
  const fb = href.match(/^(?:\.\/)?feedback\/([^#]+\.md)$/)
  if (fb) return `#${e.id}-fb-${slug(fb[1])}`
  const other = href.match(/^(?:\.\.\/)+(p\d+)[^/]*\/entry\.md$/)
  if (other) return `#${other[1]}`
  const ledger = href.match(/^(?:\.\.\/)+decisions\.md(#D\d{3})?$/)
  if (ledger) return ledger[1] ?? '#ledger'
  return `${e.dir}/${href.replace(/^\.\//, '')}`
}

const slug = (/** @type {string} */ s) => s.replace(/\.md$/, '').replace(/[^\w-]+/g, '-')

const CSS = `
:root { --bg:#050508; --panel:#0d0d14; --line:#2a2a38; --fg:#ccc; --dim:#888; --acc:#e6dc5a;
  --held:#5ac86e; --broken:#e0604a; --open:#8a8aa0; }
* { box-sizing: border-box; }
body { margin:0; padding:24px 16px 64px; background:var(--bg); color:var(--fg); font:14px/1.5 monospace; }
a { color:var(--acc); }
code { background:#1a1a24; padding:0 3px; }
.top, .line, footer { max-width:880px; margin:0 auto; }
.top h1 { margin:0 0 4px; font-size:22px; } .top h1 span { color:var(--dim); font-weight:normal; }
.top p { margin:4px 0; color:var(--dim); }
.line { position:relative; padding-left:28px; margin-top:24px; }
.line::before { content:''; position:absolute; left:7px; top:6px; bottom:0; width:2px; background:var(--line); }
.entry { position:relative; background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:14px 16px; margin-bottom:28px; }
.entry::before { content:''; position:absolute; left:-27px; top:18px; width:12px; height:12px; border-radius:50%; background:var(--acc); border:2px solid var(--bg); }
.entry.s-concluded::before { background:var(--held); } .entry.s-killed::before { background:var(--broken); }
.entry > header { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 10px; }
.entry > header h2 { margin:0; font-size:18px; }
.pid { color:var(--dim); }
.status { font-size:11px; text-transform:uppercase; letter-spacing:1px; border:1px solid currentColor; border-radius:3px; padding:0 5px; color:var(--acc); }
.s-concluded .status { color:var(--held); } .s-killed .status { color:var(--broken); }
time { color:var(--dim); font-size:12px; }
.from { font-size:12px; margin-left:auto; }
.cover { display:block; width:100%; height:260px; object-fit:contain; image-rendering:pixelated; margin:12px 0 4px; border-radius:3px; background:#000; }
.q { font-size:15px; color:#eee; margin:10px 0; }
.chips { list-style:none; padding:0; margin:8px 0; display:flex; flex-direction:column; gap:4px; }
.a { border-left:3px solid; padding:1px 8px; font-size:13px; }
.a::before { font-weight:bold; margin-right:6px; }
.a.held { border-color:var(--held); } .a.held::before { content:'✓'; color:var(--held); }
.a.broken { border-color:var(--broken); } .a.broken::before { content:'✗'; color:var(--broken); }
.a.open { border-color:var(--open); color:#aaa; } .a.open::before { content:'?'; color:var(--open); }
.legend .a { display:inline; border:0; padding:0 6px 0 0; } .legend .a::before { content:none; }
.legend .held { color:var(--held); } .legend .broken { color:var(--broken); } .legend .open { color:var(--open); }
.builds { display:grid; grid-template-columns:auto 1fr; gap:6px 10px; align-items:center; margin:12px 0; }
.play { display:inline-block; text-decoration:none; background:var(--acc); color:#111; font-weight:bold; padding:3px 10px; border-radius:3px; text-align:center; }
.play.dev { background:transparent; color:var(--acc); border:1px dashed var(--acc); }
.bt { color:var(--dim); font-size:12px; }
.next { margin:10px 0 6px; } .next b { color:var(--acc); }
details { margin-top:8px; } summary { cursor:pointer; color:var(--dim); }
.doc { border-top:1px solid var(--line); margin-top:8px; padding-top:4px; overflow-wrap:anywhere; }
.doc h2 { font-size:15px; color:var(--acc); margin:18px 0 6px; } .doc h3 { font-size:14px; margin:14px 0 4px; }
.doc img { max-width:100%; image-rendering:pixelated; }
.doc table { border-collapse:collapse; display:block; overflow-x:auto; font-size:12px; margin:8px 0; }
.doc th, .doc td { border:1px solid var(--line); padding:3px 6px; text-align:left; vertical-align:top; }
.doc pre { background:#000; padding:8px; overflow-x:auto; font-size:12px; }
.doc blockquote { margin:6px 0; padding:2px 10px; border-left:3px solid var(--acc); color:#ddd; }
.doc ul, .doc ol { padding-left:20px; }
.fb { border-top:1px dashed var(--line); margin-top:16px; }
details.rules > summary { color:var(--acc); }
footer { color:var(--dim); font-size:12px; }
.budget { font-size:12px; color:var(--dim); border:1px dotted var(--line); border-radius:3px; padding:0 5px; }
.budget.over { color:var(--broken); border-color:var(--broken); }
.ph { font-size:10px; text-transform:uppercase; color:var(--broken); border:1px solid; border-radius:3px; padding:0 3px; margin-left:4px; }
.limits { list-style:none; padding:0; margin:8px 0; display:flex; flex-wrap:wrap; gap:4px 6px; }
.l { font-size:12px; border:1px dashed var(--line); border-radius:3px; padding:1px 6px; color:#bbb; }
.l .k { font-size:10px; text-transform:uppercase; letter-spacing:1px; margin-right:6px; color:var(--dim); }
.l.constraint { border-style:solid; border-color:var(--open); } .l.constraint .k::before { content:'⊘ '; }
.l.constraint.held { border-color:var(--held); } .l.constraint.broken { border-color:var(--broken); }
.l.cut .k::before { content:'✂ '; }
.decided { list-style:none; padding:0; margin:4px 0 6px; font-size:12px; color:#bbb; }
.decided li, .ledger tr { margin:2px 0; } .decided .sup, .ledger .sup td { text-decoration:line-through; color:var(--dim); }
.ledger-wrap { max-width:880px; margin:0 auto 24px; }
.ledger table { border-collapse:collapse; display:block; overflow-x:auto; font-size:12px; margin-top:8px; }
.ledger th, .ledger td { border:1px solid var(--line); padding:3px 6px; text-align:left; vertical-align:top; }
@media (max-width:520px) { .line { padding-left:18px; } .line::before { left:3px; } .entry::before { left:-21px; } .entry { padding:12px; } .from { margin-left:0; } }
`

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const tl = join(root, 'timeline')
  const args = process.argv.slice(2)
  const opt = (/** @type {string} */ k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined)
  const out = opt('--out') ?? join(tl, 'index.html')
  const devBase = opt('--dev') ?? '../'
  const problems = []
  const entries = []
  for (const dir of readdirSync(tl).filter((d) => /^p\d+-/.test(d)).sort()) { // _template/ and the rest are skipped
    const base = join(tl, dir)
    if (!existsSync(join(base, 'entry.md'))) continue
    const fbDir = join(base, 'feedback')
    const feedback = existsSync(fbDir)
      ? readdirSync(fbDir).filter((f) => f.endsWith('.md')).sort().map((name) => ({ name, md: readFileSync(join(fbDir, name), 'utf8') }))
      : []
    const expanded = expandRulesets(readFileSync(join(base, 'entry.md'), 'utf8'), (p) =>
      existsSync(join(base, p)) ? readFileSync(join(base, p), 'utf8') : null,
    )
    const r = readEntry(dir, expanded.md, feedback, (id) => existsSync(join(base, 'builds', id, 'index.html')))
    r.problems.push(...expanded.problems.map((p) => `${dir}: ${p}`))
    const listed = new Set(r.entry.builds.map((b) => b.id))
    const onDisk = existsSync(join(base, 'builds')) ? readdirSync(join(base, 'builds')) : []
    for (const b of onDisk) if (!listed.has(b)) r.problems.push(`${dir}: builds/${b}/ has no "build ${b}:" line in the frontmatter`)
    problems.push(...r.problems)
    entries.push(r.entry)
  }
  const ledgerFile = join(tl, 'decisions.md')
  const { decisions, problems: dp } = existsSync(ledgerFile)
    ? parseDecisions(readFileSync(ledgerFile, 'utf8'), new Set(entries.map((e) => e.id)))
    : { decisions: [], problems: ['timeline/decisions.md is missing'] }
  problems.push(...dp)
  const game = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name
  const title = game.charAt(0).toUpperCase() + game.slice(1)
  writeFileSync(out, renderPage(entries, { game: title, devBase, decisions }))
  for (const p of problems) console.warn('⚠', p)
  console.log(`timeline: ${entries.length} entries → ${relative(process.cwd(), out) || out}`)
  if (problems.length && args.includes('--strict')) process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
