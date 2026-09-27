// Dev panel: a slider per number and a checkbox per flag in the tunables object, live readouts,
// and preset copy / paste. Replaces Tweakpane in ~100 lines.

/**
 * @param {HTMLElement} root
 * @param {Record<string, any>} tunables edited in place
 * @param {Record<string, [number, number, number]>} ranges
 * @param {{ onChange: () => void, buttons: [string, () => void][] }} opts
 */
export function createPanel(root, tunables, ranges, opts) {
  const readout = document.createElement('pre')
  root.append(readout)

  const bar = document.createElement('div')
  bar.className = 'buttons'
  for (const [label, fn] of opts.buttons) {
    const b = document.createElement('button')
    b.textContent = label
    b.onclick = fn
    bar.append(b)
  }
  root.append(bar)

  /** @type {(() => void)[]} refreshes each control from the object, after a preset load */
  const syncs = []

  /** @param {HTMLElement} parent @param {Record<string, any>} obj @param {string} path */
  function build(parent, obj, path) {
    for (const [key, value] of Object.entries(obj)) {
      const full = path ? `${path}.${key}` : key
      if (typeof value === 'object') {
        const box = document.createElement('fieldset')
        const legend = document.createElement('legend')
        legend.textContent = key
        box.append(legend)
        build(box, value, full)
        parent.append(box)
        continue
      }
      const row = document.createElement('label')
      const name = document.createElement('span')
      name.textContent = key
      const input = document.createElement('input')
      row.append(name, input)
      if (typeof value === 'boolean') {
        input.type = 'checkbox'
        input.onchange = () => {
          obj[key] = input.checked
          opts.onChange()
        }
        syncs.push(() => (input.checked = obj[key]))
      } else {
        const [min, max, step] = ranges[full] ?? [0, Math.max(1, value * 3), 1]
        const out = document.createElement('output')
        Object.assign(input, { type: 'range', min, max, step })
        input.oninput = () => {
          obj[key] = Number(input.value)
          out.textContent = input.value
          opts.onChange()
        }
        row.append(out)
        syncs.push(() => {
          input.value = String(obj[key])
          out.textContent = String(obj[key])
        })
      }
      parent.append(row)
    }
  }
  build(root, tunables, '')
  syncs.forEach((s) => s())

  return {
    toggle: () => root.classList.toggle('open'),
    isOpen: () => root.classList.contains('open'),
    /** @param {string} text */
    setReadout: (text) => (readout.textContent = text),
    sync: () => syncs.forEach((s) => s()),
  }
}
