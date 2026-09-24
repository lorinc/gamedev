// Deterministic integer PRNG. Same seed → same sequence on every browser.
// Returns uint32 values; no floats anywhere in the sim.

/** @typedef {() => number} Rng */

/** @param {number} seed @returns {Rng} */
export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (t ^ (t >>> 14)) >>> 0
  }
}

// Derives independent sub-seeds (per layer, per chunk) from a world seed.
/** @param {...number} parts @returns {number} */
export function hashSeed(...parts) {
  let h = 0x811c9dc5
  for (const p of parts) {
    h = Math.imul(h ^ (p >>> 0), 0x01000193)
    h ^= h >>> 15
  }
  return h >>> 0
}

// true with probability permille / 1000
/** @param {Rng} rng @param {number} permille @returns {boolean} */
export function chance(rng, permille) {
  return rng() % 1000 < permille
}
