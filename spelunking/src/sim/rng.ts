// Deterministic integer PRNG. Same seed → same sequence on every browser.
// Returns uint32 values; no floats anywhere in the sim.

export type Rng = () => number

export function mulberry32(seed: number): Rng {
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
export function hashSeed(...parts: number[]): number {
  let h = 0x811c9dc5
  for (const p of parts) {
    h = Math.imul(h ^ (p >>> 0), 0x01000193)
    h ^= h >>> 15
  }
  return h >>> 0
}

// true with probability permille / 1000
export function chance(rng: Rng, permille: number): boolean {
  return rng() % 1000 < permille
}
