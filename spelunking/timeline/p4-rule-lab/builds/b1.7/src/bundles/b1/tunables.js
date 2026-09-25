// Every number b1 is tuned with. The dev panel edits this object live; presets are copies of it.
// Sim values are in ticks at 60 ticks/s. At start, `sim` and the swipe angles in `input` are replaced
// by the loaded ruleset's (rules/*.json); the values here are its fallback shape.

export const DEFAULTS = {
  /** @type {import('../../sim/dig/rules.js').SimConfig} */
  sim: {
    walkTicks: 7,
    climbTicks: 10,
    fallTicks: 3,
    buildTicks: 14,
    digTicks: { soft: 14, hard: 42, ore: 21, loot: 14, built: 7 }, // + walkTicks to step in: soft = 3× a walk
    harmlessDrop: 4,
    packSlots: 6, // of 16 units each (sim/dig/pack.js)
    gravity: false, // rulesets from b1.3 on turn it on
    rules: { wall: true, open: true, harder: true, loot: true, junction: true },
  },
  input: {
    swipePx: 24, // CSS px of travel that commits a swipe
    horizontalDeg: 30, // ± around left / right that reads as a walk
    verticalDeg: 25, // ± around up / down; the rest is diagonal
    holdMs: 300, // a swipe still down this long is a hold (D046); the teleport ring shows only after it
    longPressMs: 1000, // teleport: holding still this long (the ring fills from holdMs on)
  },
  view: {
    tilesShort: 48, // tiles across the screen's short side
    camLerp: 0.12, // per 1/60 s
    lookahead: 3, // tiles ahead in the intent direction
    packFit: 0.75, // the backpack's height / the body's (render.js drawPack)
  },
  juice: {
    on: true, // master switch: judge the stop rules with it off first
    sound: true,
    volume: 0.5,
    shake: true,
    maxShake: 0.35, // tiles
    chunks: true,
  },
}

/** @typedef {typeof DEFAULTS} Tunables */

// [min, max, step] per slider; anything missing gets [0, 3 × default, 1].
/** @type {Record<string, [number, number, number]>} */
export const RANGES = {
  'sim.walkTicks': [2, 30, 1],
  'sim.climbTicks': [2, 40, 1],
  'sim.harmlessDrop': [0, 8, 1],
  'sim.packSlots': [1, 6, 1],
  'input.swipePx': [8, 80, 1],
  'input.horizontalDeg': [10, 45, 1],
  'input.verticalDeg': [10, 45, 1],
  'input.holdMs': [100, 800, 10],
  'input.longPressMs': [400, 2000, 50],
  'view.tilesShort': [8, 96, 1],
  'view.camLerp': [0.02, 1, 0.01],
  'view.lookahead': [0, 8, 0.5],
  'juice.volume': [0, 1, 0.05],
  'juice.maxShake': [0, 1, 0.05],
}

// Copies `src` into `dst` in place, key by key, so objects others hold a reference to stay live.
// Keys `dst` doesn't have are ignored (stale presets can't add junk).
/** @param {Record<string, any>} dst @param {Record<string, any>} src */
export function assignDeep(dst, src) {
  for (const k of Object.keys(dst)) {
    if (!(k in src)) continue
    if (typeof dst[k] === 'object') assignDeep(dst[k], src[k])
    else if (typeof dst[k] === typeof src[k]) dst[k] = src[k]
  }
  return dst
}

// Only the values that differ from `base`, as a nested object. Stored settings hold just these,
// so a changed default reaches every browser that didn't tune that value itself.
/** @param {Record<string, any>} base @param {Record<string, any>} t @returns {Record<string, any>} */
export function changedFrom(base, t) {
  /** @type {Record<string, any>} */
  const out = {}
  for (const k of Object.keys(base)) {
    if (typeof base[k] === 'object') {
      const sub = changedFrom(base[k], t[k])
      if (Object.keys(sub).length) out[k] = sub
    } else if (t[k] !== base[k]) out[k] = t[k]
  }
  return out
}

/** Short hash of a preset, printed in the dive log so a pasted log names its preset. */
/** @param {Tunables} t */
export function presetId(t) {
  let h = 0x811c9dc5
  for (const c of JSON.stringify(t)) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193)
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6)
}
