// b4.62's save (the user: "how could you save game state […] and reload it, when the site is visited again?
// all this without a lag spike of massive files stored"). The cave never changes shape, so a save is what's
// layered over the map as made: the per-pixel layers (seen, the garden's wall, the lichen, the liquid) run-length
// encoded (mostly zeros, a few blobs: a few KB), the pixels whose tile changed kind (ore and loot pulled, worm
// ore laid) as a diff against the map as made, and the rest of the state (lists, numbers) as JSON. Randomness
// comes from the tick (rng.js), so there's no generator state: restore `tick` and the game goes on as it would
// have. A load is the map as made (already paid on every visit) plus one pass over its pixels.
// Generic over the state, so a new system's state is saved without touching this file. Not saved: what the
// map gives or the game rebuilds by itself (the map, the config from the URL, the links, the light, the bug
// field, the queues, the view's `changed` lists). A load merges into a fresh game, so a field the save lacks
// keeps its fresh value.

/** Top-level fields never saved. */
const SKIP = new Set(['map', 'world', 'cfg', 'links', 'queue', 'events', 'bugField', 'lit', 'litFor'])
/** Fields never saved, at any depth: the view's repaint lists. */
const SKIP_ANY = new Set(['changed'])
const VERSION = 1

/** Runs of a byte array: value, count, value, count… @param {Uint8Array} a @returns {number[]} */
export function rle(a) {
  /** @type {number[]} */
  const out = []
  for (let i = 0; i < a.length;) {
    const v = a[i]
    let j = i + 1
    while (j < a.length && a[j] === v) j++
    out.push(v, j - i)
    i = j
  }
  return out
}

/** @param {number[]} runs @param {number} n @returns {Uint8Array} */
export function unrle(runs, n) {
  const a = new Uint8Array(n)
  let i = 0
  for (let k = 0; k < runs.length; k += 2) {
    a.fill(runs[k], i, i + runs[k + 1])
    i += runs[k + 1]
  }
  if (i !== n) throw new Error(`rle: ${i} of ${n}`)
  return a
}

/** @param {any} v @returns {any} */
function enc(v) {
  if (v instanceof Uint8Array) return { $u8: rle(v), n: v.length }
  if (v instanceof Set) return { $set: [...v].map(enc) }
  if (v instanceof Map) return { $map: [...v].map(([k, x]) => [enc(k), enc(x)]) }
  if (Array.isArray(v)) return v.map(enc)
  if (v && typeof v === 'object') {
    /** @type {Record<string, any>} */
    const o = {}
    for (const k of Object.keys(v)) if (!SKIP_ANY.has(k) && v[k] !== undefined) o[k] = enc(v[k])
    return o
  }
  return v
}

/** @param {any} v @returns {any} */
function dec(v) {
  if (Array.isArray(v)) return v.map(dec)
  if (!v || typeof v !== 'object') return v
  if ('$u8' in v) return unrle(v.$u8, v.n)
  if ('$set' in v) return new Set(v.$set.map(dec))
  if ('$map' in v) return new Map(v.$map.map((/** @type {any[]} */ [k, x]) => [dec(k), dec(x)]))
  /** @type {Record<string, any>} */
  const o = {}
  for (const k of Object.keys(v)) o[k] = dec(v[k])
  return o
}

/** Saved into fresh: plain objects field by field (fresh keeps what the save lacks), anything else replaced.
 * @param {any} fresh @param {any} saved @returns {any} */
function merge(fresh, saved) {
  const plain = (/** @type {any} */ x) => x && typeof x === 'object' && Object.getPrototypeOf(x) === Object.prototype
  if (!plain(fresh) || !plain(saved)) return saved
  for (const k of Object.keys(saved)) fresh[k] = merge(fresh[k], saved[k])
  return fresh
}

/**
 * The game as a string.
 * @param {import('./game.js').Game} g @param {Uint8Array} made the map's tiles as made
 */
export function save(g, made) {
  /** @type {Record<string, any>} */
  const state = {}
  for (const k of Object.keys(g)) if (!SKIP.has(k)) state[k] = enc(/** @type {any} */ (g)[k])
  /** @type {number[]} */
  const tiles = [] // index, tile, index, tile…
  const t = g.world.tiles
  for (let i = 0; i < t.length; i++) if (t[i] !== made[i]) tiles.push(i, t[i])
  return JSON.stringify({ v: VERSION, state, tiles })
}

/**
 * A save into a fresh game on the map as made (createGame's): throws if it doesn't fit, and then the game is
 * half-loaded (make a fresh one).
 * @param {import('./game.js').Game} g @param {string} s
 */
export function load(g, s) {
  const { v, state, tiles } = JSON.parse(s)
  if (v !== VERSION) throw new Error(`save version ${v}`)
  const t = g.world.tiles
  for (let k = 0; k < tiles.length; k += 2) {
    if (tiles[k] >= t.length) throw new Error('tile out of the map')
    t[tiles[k]] = tiles[k + 1]
  }
  for (const k of Object.keys(state)) {
    if (SKIP.has(k)) continue
    const fresh = /** @type {any} */ (g)[k]
    const saved = dec(state[k])
    if (fresh instanceof Uint8Array && (!(saved instanceof Uint8Array) || saved.length !== fresh.length)) throw new Error(`${k}: size`)
    ;/** @type {any} */ (g)[k] = merge(fresh, saved)
  }
  g.litFor = { x: -1, y: -1, r: -1, glows: '' } // the next tick lights it again
}
