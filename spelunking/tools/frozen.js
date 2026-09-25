// Frozen builds are never modified: each build folder carries MANIFEST.sha256 (sha256sum format)
// listing every file in it. tools/frozen.test.js checks every build against its manifest.
// Usage: node tools/frozen.js <build dir> ...   (writes the manifest; freeze.sh calls it)

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MANIFEST = 'MANIFEST.sha256'

/** @param {string} dir @returns {string} `<sha256>  <path>` lines, sorted, for every file except the manifest */
export function manifest(dir) {
  const files = readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f !== MANIFEST && statSync(join(dir, f)).isFile())
    .sort()
  return files.map((f) => `${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}  ${f}`).join('\n') + '\n'
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const dir of process.argv.slice(2)) {
    writeFileSync(join(dir, MANIFEST), manifest(dir))
    console.log(`${MANIFEST} → ${dir}`)
  }
}
