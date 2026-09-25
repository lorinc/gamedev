---
id: p1
title: Cave generator
started: 2026-09-24
ended: 2026-09-24
status: concluded
cover: media/cover.png
build v1: 2026-09-24 · layered CA world, sliders for every parameter (TS + Vite + Pixi + Tweakpane, rebuilt 2026-09-25 from tag tools-v1-v3)
---

# p1 · Cave generator

*Reconstructed on 2026-09-25 from the session notes. The timeline didn't exist yet.*

## Question

Can a port of Lorinc's old tileable cave generator (a cellular automaton in a Kaggle notebook) produce a world that's worth spelunking?

## Assumptions

1. [✓] The Python notebook's cellular automaton ports to the browser and runs live with sliders.
2. [✗] Random CA caves are a good space to spelunk in.
3. [✗] Stacking several CA layers (sideways galleries, vertical shafts, hard rock, ore, loot) with separate horizontal and vertical biases gives controllable shapes.
4. [✓] Editing keep / born / die rules with an interactive control beats typing them as text.

## Built

- A layered CA world: **galleries** (open space, stretched sideways) and **shafts** (open space, stretched vertically), a **hard rock** layer, **ore** and **loot** drops, and a sky strip and crust on top.
- A slider for every layer parameter (seed, density, rule, steps, scale X / Y), a live map, stats and drop markers. The settings are saved in the browser.
- The rule editor: a keep / born / die toggle per neighbour count. It replaced free-text rules and survives in v2 and v3.
- During the session, the top / bottom differentiation was removed, which made the whole map homogeneous.
- Stack: TypeScript + Vite + PixiJS + Tweakpane. That stack was retired on 2026-09-25. The generator lives on as `src/sim/gen/world.js`, which `npm run gallery` uses to dump every stage as PNGs.

## Feedback

- [2026-09-24 · Lorinc · desktop](feedback/2026-09-24_lorinc_desktop.md): "these caves are truly random, and that does not make a great spelunking experience", and then: "a volatile system … collapsing into chaos after a few steps".

## Conclusion → next

Too volatile to design by hand: with several interacting layers, small input changes swing the output into chaos. Step back to a single binary grid, designed step by step: [p2 · Atomic terrain](../p2-atomic-terrain/entry.md).

- Kept: the keep / born / die rule editor, and horizontal wrapping (the map tiles sideways).
- Dropped: many-layer composition as the way to design terrain.
