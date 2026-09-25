// The oldest target is iOS 14 Safari (R2, R14). `tsc` with lib ES2020 catches newer JS built-ins,
// but not newer syntax or DOM APIs: any of these gives a black screen (or a dead sound system) on
// iOS 14 while every other check stays green. Versions from MDN browser-compat-data; see
// guides/engineering/03-web-portal-requirements.md. Comments are ignored; the list only grows when
// something slips through (the incident rule in ENGINEERING.md).

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** @type {[RegExp, string][]} what, and why it's out */
const DENY = [
  [/\bstructuredClone\s*\(/, 'structuredClone is iOS 15.4+: copy plain data with JSON.parse(JSON.stringify(…))'],
  [/new\s+AudioContext\s*\(/, 'AudioContext is only prefixed before iOS 14.5: use window.AudioContext ?? webkitAudioContext'],
  [/^\s*(?:static\s+)?#\w+\s*[=;(]/m, 'private class fields / methods are iOS 14.5+ / 15+'],
  [/^\s*static\s+\w+\s*=/m, 'static class fields are iOS 14.5+'],
  [/^\s*static\s*\{/m, 'static blocks are iOS 16.4+'],
  [/\(\?<[=!]/, 'regex lookbehind is iOS 16.4+'],
  [/^(?:export\s+)?(?:(?:const|let|var)\s+[\w{}\s,]+=\s*)?await\b/m, 'top-level await is iOS 15+'],
  [/\bOffscreenCanvas\b/, 'OffscreenCanvas is iOS 16.4+'],
  [/\.roundRect\s*\(/, 'CanvasRenderingContext2D.roundRect is iOS 16+'],
]

/** Everything a browser loads: the pages and src/, without tests. */
function shipped() {
  const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'))
  const src = readdirSync(join(ROOT, 'src'), { recursive: true })
    .map((f) => join('src', String(f)))
    .filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'))
  return [...pages, ...src]
}

/** Blanks /* … *\/ and // comments, keeping line numbers (roughly: a // inside a string ends the line early, which only hides text). */
const code = (/** @type {string} */ s) => s.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, '')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')

test('nothing in shipped code needs more than iOS 14', () => {
  const files = shipped()
  assert.ok(files.length > 5)
  const problems = []
  for (const file of files) {
    const src = code(readFileSync(join(ROOT, file), 'utf8'))
    for (const [re, why] of DENY) {
      const m = src.match(re)
      if (m) problems.push(`${file}:${src.slice(0, m.index).split('\n').length}: ${why}`)
    }
  }
  assert.deepEqual(problems, [])
})

test('the denylist catches what it names', () => {
  const hits = (/** @type {string} */ s) => DENY.filter(([re]) => re.test(code(s))).length
  assert.equal(hits('const a = structuredClone(b)'), 1)
  assert.equal(hits('ctx = new AudioContext()'), 1)
  assert.equal(hits('class A {\n  #n = 1\n}'), 1)
  assert.equal(hits('class A {\n  static max = 1\n}'), 1)
  assert.equal(hits('const r = await fetch(u)'), 1)
  assert.equal(hits('// structuredClone(b) in a comment\nconst Ctx = window.AudioContext'), 0)
  assert.equal(hits('async function f() {\n  const r = await fetch(u)\n}'), 0)
})
