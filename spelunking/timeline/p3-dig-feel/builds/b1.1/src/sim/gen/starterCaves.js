// Copy of archive/2026-09-24_starter-caves_seed6712.json as a module: browsers can't import JSON
// on every target (iOS Safari < 17.2). A test keeps the two identical.

/** @type {import('./pipeline.js').Pipeline} */
export const STARTER_CAVES = {
  seed: 6712,
  width: 128,
  height: 64,
  density: 450,
  edge: 'wrap',
  steps: [
    { kind: 'gen', rule: 'd012 b5678', repeat: 2 },
    { kind: 'scale', x: 4, y: 1 },
    { kind: 'gen', rule: 'd0124 b78', repeat: 4 },
    { kind: 'scale', x: 2, y: 2 },
    { kind: 'gen', rule: 'd012 b345', repeat: 1 },
  ],
}
