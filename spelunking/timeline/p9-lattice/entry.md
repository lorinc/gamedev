---
id: p9
title: Lattice (v7)
started: 2026-09-27
status: building
budget: 1d
from: p8
dev: v7.html
---

# p9 · Lattice (v7)

p8 drew one good collapsed network: the result of good choices. The user (2026-09-27): "What we want to
build is a dense network of potential pathways (and walls), that the user can choose from. What I see in
these simulations is the network + what making good choices would build for the player." So this
prototype draws the lattice itself: every candidate link and wall over p8's floors, and what building one
collapses (`concepts/callisto_design.md` → *One candidate set, two roles*).

## Question

Is the candidate lattice dense enough to offer real choices everywhere, while each build clears its
neighbourhood enough that what's left stays readable?

**Pass:** clicking through a few builds on a seed, the user can always find a link or a wall where they
want one, and after each build the candidates left around it still make sense (no parallels, no X
crossings, no airlock clusters).

**Kill:** the lattice is either a blur (too many candidates to read) or collapses to nothing after a few
builds. Then the candidate set needs a coarser skeleton (fewer, pre-merged candidates) first.

## Assumptions

1. [?] p8's candidate links (cheapest per pair of floors, direction and 4-cell stretch) are the right
   density for choosing from.
2. [?] p8's clash rule (D073: a crossing, or running parallel within a storey for over 30% of the middle)
   works as the collapse rule: a candidate dies when it clashes with the floors or a build.
3. [?] Walls at waists (locally narrowest rock-to-rock crossings of open air, 4 directions) are the
   useful wall candidates.
4. [?] Airlocks placed automatically where walls cross paths, kept apart by a minimum gap, don't need
   their own candidates.

## Limitations

- [cut] No character, no walking: builds are clicks on the map. Later.
- [cut] Only the ice layer, as in p8.
- [cut] Walls don't change the terrain or the floors: they're drawn over it, and they don't create new
  floor.
- [cut] A desktop tool page, not a phone layout.

## Built

Built in one session (D074). `v7.html` shows p8's ice layer (p7's settled caves, p8's pod and floors)
with every candidate drawn thin over it; builds are thick. Click a candidate to build it, click a build
to revert it; hovering shows in cyan what the click would collapse (or bring back). The URL carries the
seed, every knob and the builds (`b=`), so a state can be shared. New in `src/bundles/v7/`:
`lattice.js` (candidates and collapse), `paint.js`, `main.js`; p8's pod code is imported (`carvePod` is
now exported from v6).

- **The user on the page (before building):** no v6 toggle ("I can see what a good layout looks like");
  "airlocks are just plank-behaviour blocks (can pass through, can stand on it), automatically placed
  where walls and paths intersect. Just like parallel paths, airlocks are also discouraged to be in close
  proximity"; the map size is right, but bigger pixels and more contrast: rock keeps its colours, open
  air is darker.
- **Picture:** the map fits the window's width (zoom − / + buttons), cropped to the crust and the ice.
  Open air is near black (4, 4, 7, was 21, 21, 24) with no outlines; the drawn ice sheet is gone (only
  a strip of sky). The lattice is drawn as lines at screen resolution on a second canvas.
- **Candidate links** are p8's, unchanged: cutoffs (short, end to end), sideways links from a floor's
  end, 45° ramps from every half cell of floor (carrying on sideways), the cheapest per pair of floors,
  direction and 4-cell stretch.
- **Candidate walls:** straight rock-to-rock crossings of open air (level, upright, both 45°), up to 6
  cells (knob), at waists (open a cell away on both sides, nothing narrower the same way within 2 cells),
  the shortest first, 3 cells apart (knob); none lying along a floor, none in the pod.
- **Airlocks** (user): wherever a built wall crosses a path (a floor or a built link), one per crossing,
  a cell-sized block.
- **Collapse** (all recomputed from the build list, so a revert is exact): a link dies if it crosses a
  built link or runs within a storey of a path going the same way for over 30% of its middle (knob)
  (p8's D073 rule, with the natural floors counting as paths from the start); a link or wall dies if it
  would place an airlock within 5 cells (knob) of another; a wall dies within a cell of a built wall.
- **Measured, seed 5512:** 50 cutoffs, 68 sideways links, 391 ramps and 77 walls; the floors alone
  collapse 32 sideways links and 219 ramps, leaving 50 / 36 / 172 / 77. A build near the pod collapses
  0 to 13 candidates. The lattice takes ~150 ms, a collapse ~10 ms.
- **Seen (Claude):** where rock is thick, the ramps that carry on sideways stack up as bundles of
  near-parallel tunnels a pixel or two apart (the cheapest per 4-cell stretch keeps one per stretch, and
  neighbouring stretches give near-copies). Clicking one collapses the bundle, but before that it reads
  as a blur. Screenshots: `gallery/p9/v7_seed5512*.png`.

## Feedback

## Conclusion → next
