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

## Feedback

## Conclusion → next
