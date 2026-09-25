---
id: p2
title: Atomic terrain
started: 2026-09-24
ended: 2026-09-24
status: concluded
budget: 1d   # retro: no time box was set; it took one day
from: p1
cover: media/cover.png
build v2: 2026-09-24 · CA Lab: one binary grid, a hand-built pipeline of gen and scale steps, every step visible
build v3: 2026-09-24 · Terrain: the archived v2 recipe gives the caves, soft / hard rock, ore and loot
---

# p2 · Atomic terrain

*Reconstructed on 2026-09-25 from the session notes. The timeline didn't exist yet.*

## Question

If one binary grid is designed step by step by hand, can it give good starter caves cheaply, with predictable output?

## Assumptions

1. [✓] One binary grid with a hand-built pipeline of `gen` (CA rule × repeat) and `scale` (integer X / Y) steps is predictable enough to design with.
2. [✓] Scaling X and Y separately gives caves a horizontal or vertical character without separate layers.
3. [✓] One recipe can be reused: with a different seed it splits soft from hard rock. Ore and loot go on top.
4. [✓] The v3 terrain is good enough to test digging in (b1).

## Limitations

- [constraint ✓] One binary grid only (live / dead): no layers, no materials in v2. It made the output predictable enough to design by hand.
- [constraint ✓] Every step is visible: the lab shows every intermediate grid, never just the result.
- [cut] No character and no digging: v3 is judged by eye and by its stats (open / soft / hard / ore / loot, drop counts).

## Built

**v2 · CA Lab**, the pattern-finding tool, frozen by request: "a fundamental tool for any terrain generation pattern finding".

- One binary grid (live / dead). The pipeline is a list of steps: `gen` runs a keep / born / die rule N times, and `scale` enlarges by integer factors, separately on X and Y.
- A thumbnail strip shows every step. You can see which rule changes what.
- Scaling started as "2× or nothing". It became any integer at Lorinc's request.
- The recipe Lorinc found is archived as [media/starter-caves_seed6712.json](media/starter-caves_seed6712.json):

```
seed 6712 · 128×64 · density 450 · wrap
gen  d012 b5678  ×2
scale 4×1
gen  d0124 b78   ×4
scale 2×2
gen  d012 b345   ×1
```

**v3 · Terrain**, the v2 recipe as a world:

- The recipe shapes the caves, and the same recipe with another seed splits soft from hard rock.
- Ore is its own CA layer (density 300, no scale steps, default rules), and loot is scattered at density 50. Both values come from the v1 generator.
- Its output is `src/sim/gen/terrain.js`, which b1 digs in.

## Feedback

- [2026-09-24 · Lorinc · desktop](feedback/2026-09-24_lorinc_desktop.md): "this is fairly good starter caves with minimal computation", and then for v3: "This is perfect for testing bundle 1".

## Conclusion → next

It worked: 5 steps on one binary grid give starter caves, cheaply and predictably. v2 stays frozen as the tool for finding terrain patterns. New terrain ideas become a new tool (v4, …). The v3 terrain feeds the first playtest: [p3 · Dig Feel](../p3-dig-feel/entry.md).

- Decisions: [D004, D005](../decisions.md).
- Deferred: depth tiers (the world is homogeneous for now), and chasms, which the recipe produces and which b1 now has to handle.
