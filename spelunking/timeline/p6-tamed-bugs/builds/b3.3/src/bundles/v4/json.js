// JSON the way the rules files are written: anything that fits on a line stays on one line,
// so a table row, a situation or a short map is one line in a diff.

const WIDTH = 110

/** @param {unknown} v @returns {string} */
function inline(v) {
  if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`
  if (v && typeof v === 'object')
    return Object.keys(v).length
      ? `{ ${Object.entries(v)
          .map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`)
          .join(', ')} }`
      : '{}'
  return JSON.stringify(v)
}

/** @param {unknown} v @param {string} [indent] @returns {string} */
export function pretty(v, indent = '') {
  const one = inline(v)
  if (!v || typeof v !== 'object' || (indent && one.length + indent.length <= WIDTH)) return one
  const inner = indent + '  '
  if (Array.isArray(v)) return `[\n${v.map((x) => inner + pretty(x, inner)).join(',\n')}\n${indent}]`
  const body = Object.entries(v).map(([k, x]) => `${inner}${JSON.stringify(k)}: ${pretty(x, inner)}`)
  return `{\n${body.join(',\n')}\n${indent}}`
}
