---
id: p10
title: Rails (v8)
started: 2026-09-27
status: building
budget: 1d
from: p9
dev: v8.html
---

# p10 · Rails (v8)

The vehicle can be a monorail pod (user), so the path no longer has to follow floors: straight rails
between nodes, "mostly on a grid, adjusted only to look good organic on the map". The user: "I'd be very
interested seeing the rail running on relaxed edges. Not sure it will work well, but it might potentially
be awesome. Just make it a straight line, it is a rail." Design: `concepts/callisto_lattice.md`.

## Question

Do straight rails on a relaxed grid look good over the caves, and do they run mostly through open air
rather than boring rock?

**Pass:** the user finds one of the two ways (A or B) good-looking on most seeds, with a small share of
rail length through rock.

**Kill:** both look like a net thrown over the caves, or most of the rail bores rock. Then the nodes and
corridors move into the WFC (the caves grow around the rails).

## Assumptions

1. [?] The caves' own relaxed grid is too fine for rails (edges ~0.9 cells), so A takes chords between
   its vertices and B a coarse relaxed grid of its own.
2. [?] Nodes in the most open places (A) bore less rock than a grid that ignores the caves (B).

## Limitations

- [cut] No buildables, no routing, no choosing: only the candidate rails and their nodes.
- [cut] How the rail hangs (ceiling, pylons, free) isn't decided; rails are drawn as lines.
- [cut] Only the ice layer.

## Built

`v8.html` + `src/bundles/v8/{rails,main}.js`, reusing p8's pod and p9's terrain painter.

- **A · chords between cave-grid vertices:** the caves' relaxed-grid vertices in open air, the farthest
  from rock first, kept `spacing` apart (8 cells), joined by a relative neighbourhood graph (a and b are
  joined unless some c is closer to both): straight rails at any angle, no crossings.
- **B · coarse relaxed grid:** a triangle lattice of `cols` triangles across (5), wrapping with the map,
  then p7's own steps: paired into quads, subdivided, relaxed (20 rounds). Vertices are nodes, edges
  rails. The caves' own grid is ~0.9 cells an edge after relaxing, so it can't be used directly.
- A rail is white through open air and red where it would bore rock; a toggle drops rails steeper than
  45° (nothing vertical, D068).
- **Measured, seed 5512:** A: 27 nodes, 38 rails, median 8.8 cells, 34% of rail length bores rock, 16
  steeper than 45°. B: 78 nodes (34 in open air), 142 rails, median 5.5 cells, 49% bores rock, 83
  steeper than 45°. Screenshots: `gallery/p9/v8_A.png`, `v8_B.png`.

**Then (user, on A):** "This is ideal density for the travel nodes, and I also like the cavern-central
placements" (at 4 cells apart). "Can you connect nodes with similar density and placement … with these
constraints? Rails use only the 8 angles, can be made of multiple segments, and digging has a 50%
penalty."
- **C · A routed in 8 directions:** A's nodes (snapped to tiles) and A's pairs, each routed on the tile
  grid by Dijkstra over (tile, heading): a step costs its length (√2 diagonal), ×1.5 in rock (knob); a
  45° bend costs 3 tiles, a 90° bend 6 (knob); sharper bends aren't allowed; sky and sea can't be
  crossed. The 45° toggle forbids upright steps.
- **Measured, 4 cells apart:** seed 69866: 90 nodes, 126 rails, 28% of rail length bores rock (A: 30%),
  87 bends (0.7 a rail), routes 1.05× the straight line. Seed 5512: 89 nodes, 134 rails, 28% bores rock,
  96 bends. Rails often share stretches where routes run together.
- **Fixed:** B's `relax` knob was renamed `rrelax`; it shared its name with the caves' `relax` in the URL,
  so a shared link rebuilt the caves with B's 20 rounds instead of 150.

**Then (user): "The map misrepresents the tunnelling needs"** (screenshot of seed 69866 in C). Each
tile was classed by its centre pixel alone, and each step coloured by the tile it entered: 100 of 553
steps showed the wrong colour for the rock actually under the line (52 bored rock drawn white, 48 open
air drawn red). Now each step's rock is sampled along its line, pixel by pixel, and that one measure
drives the route's cost, the colour and the numbers; every rail (A, B, C) is drawn that way. The totals
barely moved (the errors roughly cancelled): seed 69866 C 28% bores rock, seed 5512 C 27%.

## Feedback

## Conclusion → next
