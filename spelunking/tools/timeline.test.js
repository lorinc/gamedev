import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { mdToHtml, parseEntry, sections } from './md.js'
import { daysUsed, parseDecisions, readEntry, renderPage } from './timeline.js'

const ENTRY = `---
id: p9
title: Test
started: 2026-01-01
status: playtesting   # a comment
budget: 3d
from: p8
build x1.1: 2026-01-02 · first
build x1.2: 2026-01-03 · second
---

# p9 · Test

## Question

Is it *fun*?

## Assumptions

1. [✓] It runs.
2. [✗] It's obvious.
3. [?] It's fun.
4. [✗] Nobody gets stuck. (post-hoc)

## Limitations

- [constraint ✓] No sound.
- [constraint] No enemies.
- [cut] Zipline, back in x1.2.

## Built

- a
  - nested

## Feedback

- [one](feedback/2026-01-02_me_phone.md)

## Conclusion → next

Go on to [p10](../p10-next/entry.md).
`

describe('parseEntry', () => {
  test('flat frontmatter, comments stripped, build lines in order', () => {
    const { meta, builds, body } = parseEntry(ENTRY)
    assert.equal(meta.status, 'playtesting')
    assert.equal(meta.from, 'p8')
    assert.deepEqual(builds.map((b) => b.id), ['x1.1', 'x1.2'])
    assert.equal(builds[1].text, '2026-01-03 · second')
    assert.match(body, /^\n# p9/)
  })
  test('no frontmatter: all body', () => {
    assert.deepEqual(parseEntry('# hi\n').meta, {})
  })
  test('sections split on ## only', () => {
    const s = sections(parseEntry(ENTRY).body)
    assert.deepEqual(Object.keys(s), ['', 'Question', 'Assumptions', 'Limitations', 'Built', 'Feedback', 'Conclusion → next'])
  })
})

describe('mdToHtml', () => {
  test('inline markup, escaping, code protected', () => {
    assert.equal(mdToHtml('**b** *i* `a*b<c` [l](u) <x>'), '<p><strong>b</strong> <em>i</em> <code>a*b&lt;c</code> <a href="u">l</a> &lt;x&gt;</p>')
  })
  test('nested lists', () => {
    assert.equal(mdToHtml('- a\n  - b\n- c'), '<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>')
  })
  test('table without the separator row', () => {
    assert.equal(mdToHtml('| h |\n|---|\n| c |'), '<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table>')
  })
  test('fence, quote, heading', () => {
    assert.equal(mdToHtml('# T\n\n> q\n\n```\n<a>\n```'), '<h1>T</h1>\n<blockquote><p>q</p></blockquote>\n<pre><code>&lt;a&gt;</code></pre>')
  })
})

describe('readEntry', () => {
  test('assumption marks and missing builds', () => {
    const { entry, problems } = readEntry('p9-test', ENTRY, [], (id) => id === 'x1.1')
    assert.deepEqual(entry.assumptions.map((a) => a.mark), ['held', 'broken', 'open', 'broken'])
    assert.deepEqual(entry.assumptions.map((a) => a.postHoc), [false, false, false, true])
    assert.equal(entry.assumptions[3].text, 'Nobody gets stuck.')
    assert.deepEqual(problems, ['p9-test: build x1.2 listed but builds/x1.2/ is missing'])
  })
  test('limitations: constraints get a verdict (default open), cuts do not', () => {
    const { entry } = readEntry('p9-test', ENTRY, [], () => true)
    assert.deepEqual(
      entry.limitations.map((l) => [l.kind, l.mark]),
      [['constraint', 'held'], ['constraint', 'open'], ['cut', null]],
    )
  })
  test('budget is required and must be whole days', () => {
    assert.deepEqual(readEntry('p9-test', ENTRY.replace('budget: 3d', 'budget: 3 days'), [], () => true).problems, [
      'p9-test: budget must look like "3d", got "3 days"',
    ])
    assert.deepEqual(readEntry('p9-test', ENTRY.replace('budget: 3d\n', ''), [], () => true).problems, [
      'p9-test: missing "budget:" in frontmatter',
    ])
  })
  test('a closed playtest needs its rule table', () => {
    const closed = ENTRY.replace('status: playtesting', 'status: concluded').replace(/build x1/g, 'build b1')
    assert.deepEqual(readEntry('p9-test', closed, [], () => true).problems, ['p9-test: a closed playtest needs a "## Rules at close" section'])
    const withRules = closed.replace('## Conclusion → next', '## Rules at close\n\n| a | b |\n\n## Conclusion → next')
    assert.deepEqual(readEntry('p9-test', withRules, [], () => true).problems, [])
    const html = renderPage([readEntry('p9-test', withRules, [], () => true).entry], { game: 'G', devBase: '../' })
    assert.match(html, /<details class="rules"><summary>Rules at close<\/summary>/)
  })
  test('missing sections are reported', () => {
    const { problems } = readEntry('p9-test', ENTRY.replace('## Built', '## Made'), [], () => true)
    assert.deepEqual(problems, ['p9-test: missing section "## Built"'])
  })
})

describe('parseDecisions', () => {
  const LEDGER = `| ID | Date | From | Status | Decision |
|---|---|---|---|---|
| D001 | 2026-01-01 | p9 | superseded by D002 | Old way. |
| D002 | 2026-01-02 | — | active | New way. |
| D003 | 2026-01-03 | p7 | retired | Bad. |
| D003 | 2026-01-03 | p9 | superseded by D009 | Twice. |`
  const { decisions, problems } = parseDecisions(LEDGER, new Set(['p9']))
  test('rows parse, header skipped', () => {
    assert.deepEqual(decisions.map((d) => d.id), ['D001', 'D002', 'D003', 'D003'])
    assert.equal(decisions[0].status, 'superseded by D002')
  })
  test('ledger problems: duplicates, unknown entries, bad status, dangling supersede', () => {
    assert.deepEqual(problems, [
      'decisions.md: D003 comes from unknown entry "p7"',
      'decisions.md: D003 status must be "active" or "superseded by Dnnn"',
      'decisions.md: D003 is used twice',
      'decisions.md: D003 is superseded by missing D009',
    ])
  })
})

test('daysUsed counts both ends', () => {
  assert.equal(daysUsed('2026-09-24', '2026-09-24'), 1)
  assert.equal(daysUsed('2026-09-28', '2026-10-01'), 4)
})

describe('renderPage', () => {
  const fb = [{ name: '2026-01-02_me_phone.md', md: '# title\n\n> quote' }]
  const { entry } = readEntry('p9-test', ENTRY, fb, () => true)
  const { decisions } = parseDecisions('| D001 | 2026-01-01 | p9 | active | Keep it. |', new Set(['p9']))
  const html = renderPage([entry], { game: 'Game', devBase: '../', decisions })
  test('limitations, post-hoc badge, live time box, decisions on the card and in the ledger', () => {
    assert.match(html, /<li class="l constraint held"><span class="k">constraint<\/span>No sound\.<\/li>/)
    assert.match(html, /Nobody gets stuck\. <span class="ph"/)
    assert.match(html, /class="budget" data-start="2026-01-01" data-budget="3"/)
    assert.match(html, /<ul class="decided"><li class=""><a href="#D001">D001<\/a> Keep it\.<\/li><\/ul>/)
    assert.match(html, /<tr id="D001"/)
  })
  test('play links point into the entry folder', () => {
    assert.match(html, /href="p9-test\/builds\/x1\.1\/index\.html">▶ x1\.1</)
  })
  test('feedback and entry links become in-page anchors', () => {
    assert.match(html, /href="#p9-fb-2026-01-02_me_phone"/)
    assert.match(html, /id="p9-fb-2026-01-02_me_phone"/)
    assert.match(html, /href="#p10"/)
  })
})
