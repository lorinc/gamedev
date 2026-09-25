// The markdown subset the timeline entries use, converted to HTML without a dependency:
// headings, paragraphs, nested lists, blockquotes, fenced code, tables, rules,
// **bold**, *italic*, `code`, [links](url) and ![images](url).
// Anything else passes through as text. Keep entries inside this subset.

/** @param {string} s */
export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Inline markup. `url` rewrites every link and image target (e.g. to make paths relative to the page).
 * @param {string} s
 * @param {(href: string) => string} url
 */
export function inline(s, url = (h) => h) {
  const codes = /** @type {string[]} */ ([])
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`)
  s = escapeHtml(s)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${url(src)}" alt="${alt}">`)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => `<a href="${url(href)}">${text}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?![*\w])/g, '$1<em>$2</em>')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(codes[+i])}</code>`)
}

/**
 * @param {string} src
 * @param {(href: string) => string} [url]
 * @returns {string}
 */
export function mdToHtml(src, url) {
  const lines = src.replace(/\r/g, '').split('\n')
  const out = /** @type {string[]} */ ([])
  let i = 0
  const inl = (/** @type {string} */ s) => inline(s, url)

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    let m
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      out.push(`<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`)
      i++
    } else if (/^```/.test(line)) {
      const body = []
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) body.push(lines[i])
      i++
      out.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`)
    } else if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr>')
      i++
    } else if (/^>/.test(line)) {
      const body = []
      for (; i < lines.length && /^>/.test(lines[i]); i++) body.push(lines[i].replace(/^>\s?/, ''))
      out.push(`<blockquote>${mdToHtml(body.join('\n'), url)}</blockquote>`)
    } else if (/^\|/.test(line)) {
      const rows = []
      for (; i < lines.length && /^\|/.test(lines[i]); i++) rows.push(lines[i])
      out.push(table(rows, inl))
    } else if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const block = []
      for (; i < lines.length && (/^\s*([-*]|\d+\.)\s/.test(lines[i]) || /^\s{2,}\S/.test(lines[i])); i++) block.push(lines[i])
      out.push(list(block, inl))
    } else {
      const para = []
      for (; i < lines.length && lines[i].trim() && !/^(#|```|>|\||\s*([-*]|\d+\.)\s)/.test(lines[i]); i++) para.push(lines[i].trim())
      out.push(`<p>${inl(para.join(' '))}</p>`)
    }
  }
  return out.join('\n')
}

/**
 * @param {string[]} rows
 * @param {(s: string) => string} inl
 */
function table(rows, inl) {
  const cells = (/** @type {string} */ r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
  const [head, ...body] = rows
  if (body.length && /^[\s|:-]+$/.test(body[0])) body.shift() // the |---|---| line
  const th = cells(head).map((c) => `<th>${inl(c)}</th>`).join('')
  const tb = body.map((r) => `<tr>${cells(r).map((c) => `<td>${inl(c)}</td>`).join('')}</tr>`).join('\n')
  return `<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`
}

/**
 * Nested lists by indentation. Continuation lines (indented, no marker) join the item above.
 * @param {string[]} block
 * @param {(s: string) => string} inl
 */
function list(block, inl) {
  /** @type {{ indent: number, ordered: boolean, text: string }[]} */
  const items = []
  for (const l of block) {
    const m = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
    if (m) items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] })
    else if (items.length) items[items.length - 1].text += ' ' + l.trim()
  }
  let i = 0
  /** @param {number} indent @returns {string} */
  const level = (indent) => {
    const tag = items[i].ordered ? 'ol' : 'ul'
    let html = `<${tag}>`
    while (i < items.length && items[i].indent >= indent) {
      const it = items[i++]
      html += `<li>${inl(it.text)}`
      if (i < items.length && items[i].indent > it.indent) html += level(items[i].indent)
      html += '</li>'
    }
    return html + `</${tag}>`
  }
  let html = ''
  while (i < items.length) html += level(items[i].indent)
  return html
}

/**
 * Splits `---`-fenced flat `key: value` frontmatter from the body. `build <id>: <text>` lines
 * collect into `builds`, in file order. No YAML: values are plain strings; ` # …` is a comment.
 * @param {string} src
 * @returns {{ meta: Record<string, string>, builds: { id: string, text: string }[], body: string }}
 */
export function parseEntry(src) {
  src = src.replace(/\r/g, '')
  const meta = /** @type {Record<string, string>} */ ({})
  const builds = /** @type {{ id: string, text: string }[]} */ ([])
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { meta, builds, body: src }
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w .-]+?):\s*(.*)$/)
    if (!kv) continue
    const b = kv[1].match(/^build\s+(\S+)$/)
    if (b) builds.push({ id: b[1], text: kv[2].replace(/\s+#.*$/, '') })
    else meta[kv[1].trim()] = kv[2].replace(/\s+#.*$/, '')
  }
  return { meta, builds, body: src.slice(m[0].length) }
}

/**
 * Splits a body into `## ` sections: { heading → markdown }. Text before the first `## ` is under ''.
 * @param {string} body
 */
export function sections(body) {
  const out = /** @type {Record<string, string>} */ ({ '': '' })
  let cur = ''
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.*)$/)
    if (h) out[(cur = h[1].trim())] = ''
    else out[cur] += line + '\n'
  }
  return out
}
