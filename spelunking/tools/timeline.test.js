import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { mdToHtml, parseEntry, sections } from './md.js'
import { readEntry, renderPage } from './timeline.js'

const ENTRY = `---
id: p9
title: Test
started: 2026-01-01
status: playtesting   # a comment
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
    assert.deepEqual(Object.keys(s), ['', 'Question', 'Assumptions', 'Built', 'Feedback', 'Conclusion → next'])
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
    assert.deepEqual(entry.assumptions.map((a) => a.mark), ['held', 'broken', 'open'])
    assert.deepEqual(problems, ['p9-test: build x1.2 listed but builds/x1.2/ is missing'])
  })
  test('missing sections are reported', () => {
    const { problems } = readEntry('p9-test', ENTRY.replace('## Built', '## Made'), [], () => true)
    assert.deepEqual(problems, ['p9-test: missing section "## Built"'])
  })
})

describe('renderPage', () => {
  const fb = [{ name: '2026-01-02_me_phone.md', md: '# title\n\n> quote' }]
  const { entry } = readEntry('p9-test', ENTRY, fb, () => true)
  const html = renderPage([entry], { game: 'Game', devBase: '../' })
  test('play links point into the entry folder', () => {
    assert.match(html, /href="p9-test\/builds\/x1\.1\/index\.html">▶ x1\.1</)
  })
  test('feedback and entry links become in-page anchors', () => {
    assert.match(html, /href="#p9-fb-2026-01-02_me_phone"/)
    assert.match(html, /id="p9-fb-2026-01-02_me_phone"/)
    assert.match(html, /href="#p10"/)
  })
})
