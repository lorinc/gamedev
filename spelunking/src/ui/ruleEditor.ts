// Clickable CA rule editor: one button per live-neighbour count (0–8).
// Each click cycles keep → born → die. Stored back as the notebook-style string ("d012 b5678").

import type { FolderApi } from 'tweakpane'
import { formatRule, parseRule } from '../sim/gen/ca'

type State = 'keep' | 'born' | 'die'

const NEXT: Record<State, State> = { keep: 'born', born: 'die', die: 'keep' }
const COLORS: Record<State, { bg: string; fg: string }> = {
  keep: { bg: '#3a3b44', fg: '#aaa' },
  born: { bg: '#e6dc5a', fg: '#222' },
  die: { bg: '#b8404e', fg: '#fff' },
}

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) => Object.assign(el.style, style)

function row(): HTMLDivElement {
  const div = document.createElement('div')
  css(div, { display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 4px', font: '11px monospace' })
  return div
}

export function addRuleLegend(folder: FolderApi) {
  const div = row()
  css(div, { color: '#999', flexWrap: 'wrap' })
  div.append('neighbours 0–8, click:')
  for (const s of ['keep', 'born', 'die'] as const) {
    const chip = document.createElement('span')
    chip.textContent = s
    css(chip, { background: COLORS[s].bg, color: COLORS[s].fg, padding: '0 4px', borderRadius: '2px' })
    div.append(chip)
  }
  folder.addBlade({ view: 'separator' }).element.replaceChildren(div)
}

// Returns a refresh function for when the underlying string changes elsewhere (reset, load).
export function addRuleEditor<K extends string>(
  folder: FolderApi,
  target: Record<K, string>,
  key: K,
  label: string,
  onChange: () => void,
): () => void {
  const div = row()
  const name = document.createElement('span')
  name.textContent = label
  css(name, { width: '40px', color: '#bbb' })
  div.append(name)

  const states: State[] = []
  const buttons = [...Array(9).keys()].map((n) => {
    const b = document.createElement('button')
    b.textContent = String(n)
    css(b, { width: '22px', height: '22px', border: 'none', borderRadius: '3px', cursor: 'pointer', font: 'inherit' })
    b.onclick = () => {
      states[n] = NEXT[states[n]]
      const rule = { birth: 0, death: 0 }
      states.forEach((s, i) => {
        if (s === 'born') rule.birth |= 1 << i
        if (s === 'die') rule.death |= 1 << i
      })
      target[key] = formatRule(rule)
      paint()
      onChange()
    }
    div.append(b)
    return b
  })

  function paint() {
    buttons.forEach((b, n) => css(b, { background: COLORS[states[n]].bg, color: COLORS[states[n]].fg }))
  }

  function refresh() {
    const rule = parseRule(target[key])
    for (let n = 0; n < 9; n++)
      states[n] = rule.birth & (1 << n) ? 'born' : rule.death & (1 << n) ? 'die' : 'keep'
    paint()
  }

  refresh()
  folder.addBlade({ view: 'separator' }).element.replaceChildren(div)
  return refresh
}
