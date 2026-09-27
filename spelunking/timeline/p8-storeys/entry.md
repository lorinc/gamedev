---
id: p8
title: Storeys (v6)
started: 2026-09-27
status: building
budget: 1d
from: p7
dev: v6.html
---

# p8 · Storeys (v6)

The lattice design is storeys (D068, `concepts/callisto_design.md` → *Storeys*): mostly horizontal
paths that follow cavern floors, 45° ramps between them, nothing vertical, grown from a pod underground.
This prototype draws a first storey pass over p7's settled quad caves, zoomed in on the ice layer.

## Question

Does a storey pass over the settled quad caves give a lattice that mostly runs on natural cavern floor,
reads as clean storeys, and needs few bridges and tunnels?

**Pass:** on most seeds the storeys look like a building's floors laid into the caves (the user's eye);
most of the storey length is natural floor; the pod always finds a place near the centre.

**Kill:** the storeys zigzag, pile up or bury themselves in rock whatever the knobs. Then the caves need
a floor skeleton before the WFC (pinned storey floors), not a pass after it.

## Assumptions

1. [?] The ½-storey follow rule keeps storeys on natural floor most of the way, with 3-cell storeys.
2. [?] One ramp per storey pair, near where the storey above started, is enough to reach the whole ice
   layer.
3. [?] Every seed has natural floor for the pod (10 cells wide, level within a cell) near the centre,
   under the crust.
4. [?] Merging storeys closer than ½ storey keeps the picture clean (no near-parallel lines).
5. [?] The pass is cheap: well under 50 ms a map on top of the WFC.

## Limitations

- [cut] No character, walking, building, walls, airlocks or candidates: only the storeys. Later.
- [cut] Only the ice layer. The pudding and brine come when the storeys hold up.
- [cut] Catwalks for prospecting (the highest storey under a ceiling) aren't placed yet.
- [constraint ?] Storeys follow floors column by column with a 45° smoothing pass, not cavern by cavern:
  is that the user's "the Y it had one cavern before"?
- [cut] A desktop tool page, not a phone layout.

## Built

Built in one session (D069). `v6.html` shows one seed's ice layer, zoomed to fit the window, under a
drawn, rugged ice sheet (scenery for the 90 m, no caves in it), with the pod, the storeys, the ramps and
the divergence points; toggles for storeys, points and the walkable floor; sliders for the storey knobs;
stats under the map. The caves are p7's settled quad WFC with `QKNOBS`, imported from `src/bundles/v5/`
unchanged; the URL carries the cave knobs too, so p7's links (seed 24474) open here. New modules in
`src/bundles/v6/`: `terrain.js` (the quad map as a raster, 4 px a cell), `storeys.js` (floors, pod,
storeys, ramps, points), `paint.js`. `node tools/storeys.js [seed] [n]` writes 4 stages for 4 seeds to
`gallery/p8/` and checks n seeds: a pod on each, every storey 45° at most across the wrap, the same seed
twice gives the same storeys. All pass.

- **Walkable floor:** an open pixel with rock under it and 2 cells of headroom (knob). Floor runs join
  neighbouring columns at most 1 px apart (45°); runs under 2 cells (knob) aren't followed.
- **A storey**, column by column from its start, both ways round the wrap: the same floor if it carries
  on; else the nearest floor within ½ storey (knob) of the current Y; else hold the Y. Then a 45° pass
  lifts the lower side of every jump into a slope. Each column is named by what's there: **floor**,
  **bridge** (air under it) or **tunnel** (rock, or a ceiling under 2 cells).
- **Ramps:** 45° down, a storey ± ½ storey long, within 15 cells (knob) of the storey's start, where the
  foot lands on real floor (then: shortest, least rock, nearest). The foot starts the next storey. It
  stops when a foot falls below the ice layer.
- **Merging:** a column closer than ½ storey to the storey above (or above it) is merged: not drawn,
  not counted.
- **Divergence points:** ramp heads and feet, and floor ↔ bridge/tunnel changes (runs under a cell
  ignored).
- **Storey height 3 cells** (user: "6 cells is too much expectation. 3 cells is enough").
- **The pod** (user): a dome 8 + 2 cells wide and 4 + 1 high, cut into the ceiling; a flat slab under
  it, a 2-cell door in each side wall. Its spot: on natural floor, in the ice, with a cell of ice over the
  dome; the central sixth of the width first (the shallowest spot there), then a third, then half; its
  width on floor if possible, then 80%, 60%, then the best-supported spot anywhere. **It may sink into
  the floor** (user: "cavern floor is not expected to be THAT flat and level"): a column counts as
  supported if floor lies up to 2 cells above the base or a cell below it.
  - Changed while building: "shallowest first, then outward" put pods 16 cells off the centre, so the
    central window comes first (Claude's call). Over 100 seeds: a pod on every seed, all within 10 cells
    of the centre (median 4), 80 fully on floor; depth under the crust median 11.5 cells, worst 34.5.
- **Measured, 300 seeds, default knobs:** 6.7 storeys a map; storey length **26% on floor, 36% bridge,
  38% tunnel**; the pass takes 11 ms median, 16 ms p90 in Node (the WFC ~270 ms in the browser, the
  raster ~25 ms).
- **Seen:** with 3-cell storeys the ice's caves are taller than a storey, so storeys cross most caves
  in mid-air and hit the thin walls of the maze-like ice: floors more than 1.5 cells off a storey's Y
  go unused. Chained follows let a storey drift over the map (seed 1: storey 1 climbs about 2 storeys
  from the pod to the map's edges). Screenshots: `gallery/p8/v6_page_seed1.png`, stages
  `gallery/p8/v6_seeds1-4_*.png`.

**Then (user, after seed 5512):** "Extend the network to above the pod as well, not just below. In early
game, the player wants to manually collect a lot of materials, not picking up, what's above our head
does not make any sense." A second chain now grows **up** from the pod's storey the same way (ramps up,
near where the last storey started), until a ramp's foot has no headroom under the crust; an upper
storey dips under the crust at 45° where it would break through (D070).
- **Dead ends were a bug** (user: "is this a bug, or there's logic behind it?"): a storey merging into
  the one it came from simply stopped, up to 1.5 cells short of it. Now it takes that storey's line where
  merged and climbs or drops into it at 45°; the join is a divergence point. The crust clip made
  fragments too, until it became a dip. `tools/storeys.js` checks for dead ends: none on 300 seeds.
- Measured, 300 seeds: 11.2 storeys a map; 23% floor, 37% bridge, 40% tunnel; 16 ms median, 45 ms p90.

**Then the rework: floors first, links second (D071).** The user on seed 5512: "1. there's no way to
path towards SW from the pod without unreasonable detour; 2. the div point immediately left from the
pod should have a SE ramp, leading to the walkable cave floor right after the gap; 3. that massive
accumulation of 7 + additional 9 connected div points … is a mess. That whole area could be 4-5 points
in total; 4. there's a large cavern touching the pod from NW, no path goes there, those resources are
gone." All four came from drawing map-wide lines first. Now (`storeys.js`, same file):
- **Nodes are cavern floors** (walkable floor pieces). **Candidate links:** sideways from a piece's end
  to floor within ½ storey (up to 12 cells, knob), and 45° ramps up or down from any point (every half
  cell), landing on floor or carrying on sideways to the first floor within the span (up to 2 storeys,
  knob). Cost: length, with rock at 2× (knob).
- **Cutoffs first** (user's tip, mid-build: "if you consider what tiny cutoffs ramps could connect cave
  walkable floor parts, and prioritized extending the walkable cavern floors this way, it would increase
  the ratio by a lot"): links up to 3 cells (knob) join one piece's end to near another's end, so a
  floor broken by a bump or a step is one floor. Drawn as floor (light green where carved).
- **Then a spanning tree** of the cheapest links between floors of 3+ cells (with their cutoffs), from
  the pod. **Then detours:** while the walk from the pod to some floor is more than 1.5× the straight line
  (knob; damped by 5 cells so the pod's neighbours don't count as huge), the link into it that shortens
  it most is added; a floor no single link fixes is left.
- **Divergence points** only at forks (3+ ways) and ends, merged within 2 cells.
- **No more full-width storeys:** a storey is as long as the floors it chains (the user OK'd this).
- Measured, 300 seeds: **98% of floors reached**, 41.8 links (of them ~20 cutoffs) and 38 divergence
  points a map; detour from the pod median 1.59×, the worst floor per map median 2.82× (p90 4.39×): the
  detour pass often finds no single link that helps. 58 ms median, 86 ms p90. Seed 5512: all 19
  floors, 20 cutoffs, 20 ramps, 4 sideways links, 51 points, worst detour 2.0×.
- Fixed on the way: the pod's own floor couldn't start a link (ramps were blocked in the whole pod area,
  doors included), and its dome roof counted as floor.

**Then the user's meaning of "floor" (D072):** "For me, cave floor means 'naturally generated area that
can be traversed in one run'… first, connect these, then try to build continuous paths from them."
And: "I have no problem with passages that are only 1 cell high"; "often walkable floors are cut by a
small drop that can be bridged with very little walkway or removal of a few blocks. In this case,
removal is preferred"; "connecting natural walkable paths, so that one swipe covers long distances.
Path follows the natural floor, wherever. The only exception is if they run very close to each other -
then only one path is needed."
- Headroom 1 cell. Cutoffs are chosen by their own cost, where a pixel of walkway costs 2 of removed
  rock, so a drop gets cut through its lip rather than bridged. A floor piece within ½ storey of a longer
  one for 70% of its length is left out.
- Divergence points only at forks now (a floor's end is a stop, not a choice), with stubs under a cell
  not counted as a way.
- Tried and reverted: turning down detour links that run alongside the network. Parallel links went
  down a little, but the worst detour rose (seed 5512: 2.2× → 4.8×) and the pass took twice as long.
- Measured, 300 seeds: 100% of floors reached; 81.6 links a map (about half of them cutoffs) and 28
  divergence points; detour median 1.63×, worst per map median 2.76× (p90 3.81×); 58 ms median.

## Feedback

## Conclusion → next
