// Copy of archive/2026-09-25_starter-caves_seed7727.json as a module: browsers can't import JSON
// on every target (iOS Safari < 17.2). A test keeps the two identical.

/** @type {import('./pipeline.js').Pipeline} */
export const STARTER_CAVES = {
  seed: 7727,
  width: 32,
  height: 32,
  density: 415,
  edge: 'wrap',
  steps: [
    { kind: 'scale', x: 4, y: 1 },
    { kind: 'gen', rule: 'd012 b678', repeat: 1 },
    { kind: 'scale', x: 3, y: 2 },
    { kind: 'gen', rule: 'd012 b345678', repeat: 1 },
  ],
}
