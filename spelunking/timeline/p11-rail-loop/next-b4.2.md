# p11 · b4.2 · the plan (written 2026-09-27, build next session)

The user's notes after playing b4.1 are in `feedback/2026-09-27_lorinc_b4.1.md`. Each point below
records what b4.1 does now (measured), what changes, and the questions still open. A **[user]** tag
marks what the user asked for. A **[Claude]** tag marks a proposal the user hasn't confirmed.
**Everything is settled (D080, D081), and nothing is open.** Where "The points" and the answers below
disagree, the answers win. The points keep the original question, marked ~~struck~~ where an answer replaced it.

## The facts behind it (measured 2026-09-27)

| | b3.7 | b4.1 |
|---|---|---|
| map | 384 × 64 tiles (24,576) | 60 × 40 tiles (2,400): only v5's ice layer, 1 tile = 1 fine cell |
| rock tiles | ~13,200 | ~1,000 |
| ore | 10.7% of rock, scattered: 369 clusters, median 2 tiles, max 30 (CA ore layer at full size, `stepsX/Y 0`, density 300) | 7.5–19.6% of rock in a few big blobs (world.js' ore layer, `stepsX 2, stepsY 1`, density 380) |
| ore tiles | 1,414 | 75–206 |
| loot | 50‰ of rock (4.5%) | 7‰ (0.5–1.2%) |
| hard rock | 40.5% of rock: the cave recipe (STARTER_CAVES) run again with another seed | none: all rock is soft |
| walk | 7 ticks/tile (8.6 tiles/s), with gravity | 8 ticks/tile (7.5 tiles/s) in 8 directions, no gravity, climbs anywhere |
| rails | none | 4 ticks/tile (15 tiles/s); edges 4 tiles median, 5 at p90 |
| pull | 300 ticks per unit | 60 ticks per unit |
| pack | 6 slots × 16, reserved slots ore / loot / soft / hard, leave home with 8 soft stone, drawn on the character's back | the same pack, but only the ore count shows (the squares at the top) |

The main reason there's too little ore is the map size: b4.1's map is a tenth of b3.7's. The ore's
share of rock is about the same.

## The points

1. **Terrain gen and scale of v5 [user].** b4.1 already runs v5's quad WFC with v5's default knobs
   (`QKNOBS`), but only its ice layer (40 of 129 rows), and each fine cell becomes one tile, sampled at
   its centre. That sampling loses the half-cell marching-squares edges v5 draws, so diagonal walls turn
   into steps. ~~Open: what "scale of v5" means.~~ → answered: a 1 px bot in v5's pixels, all of v5's map (D080, D081).
   - A. The whole depth of v5's map (sky, ice, pudding, brine, ocean: 60 × 129 tiles), 1 tile = 1 cell.
   - B. v5's paint resolution: 1 tile = 1 v5 pixel (4 per cell). The ice layer alone becomes about 240 × 160
     tiles, and the caves keep v5's shapes. Nodes 3 cells apart become 12 tiles apart. This clashes with
     D075 (the character is 2 tiles high, and storeys and headroom are counted in cells).
   - C. Both.
2. **Node network type C [user].** Already: `rails(…, 'C', RKNOBS)` with D078's defaults. It stays. If the
   scale changes, it's computed on the new grid.
3. **The ice sheet above, from v6 [user].** v6 draws it (`v6/paint.js` `paintStoreys`): 10 cells above the
   crust, a rugged top made of two octaves of noise, wavy strata in two shades, space with a few stars
   above. It's a drawing only (D068). In b4.1 those rows are walkable sky that is always lit.
   **[Claude]** The sheet's tiles are solid and can't be entered or scanned. The space above is out of the
   map. With no sky inside the map, b3's always-lit surface goes.
4. **Bugs from b3.7 [user].** `src/sim/dig/bugs.js` as it is (D056–D064): wild bugs in the fog (blocks of 32,
   up to 3 chasers), they nibble ore from the pack, 16 fed tames one into the bar (3 slots), a 1 s hold
   places it, and a placed bug mines seen ore within 12 of its den, carries 8 and hands them over when you
   pass. b4's game carries the fields bugs.js reads (`bugs`, `bar`, `fed`, `refill`, `bugField`,
   `worldRev`), and the scan rings scare wild bugs as the probe's do. **[Claude]** The place gesture: a 1 s
   press on empty ground without dragging (in b4 a drag is a move and a press on a node is a build).
5. **Ore density and distribution of b3.7 [user].** b3's own ore layer (`sim/gen/terrain.js`
   `DEFAULT_TERRAIN.ore`: density 300, `stepsX/Y 0`, wrapping) at the map's size, and loot at 50‰, in place
   of world.js' blob layer. The `world.ore` knob goes. Whether that's enough ore depends on point 1: at
   b3.7's share, b4.1's map would hold about 107 ore tiles (about 10 edges), and B's map about 16 times that.
6. **Hard / soft rock gen of b3.7 [user].** b3's split: the cave recipe (STARTER_CAVES) run again with the
   hard seed, live = hard rock. The recipe's grid is 384 × 64 and wraps at 384, so b4 crops or tiles it
   to its width. ~~Crop it.~~ → run it natively at the map's size, so it wraps with no seam (answers, 3).
7. **The inventory of b3.7 [user].** The pack as it is, drawn as b3 draws it (`b3/render.js` `drawPack`: 2 × 3
   slots on the character's back, each a 4 × 4 grid filling from the bottom) instead of b4.1's squares.
   ~~Open~~ → answered: no digging, a pack of ore and loot only (answers, 2). The question was: in b3 soft and hard rock enter the pack only by digging, and b4 has no digging (the bot walks
   through open tiles only). Does digging come back in b4, or does the pack hold only ore and loot? And do
   the reserved soft/hard slots and the 8 soft stone at home still mean anything?
8. **Only show travel nodes within 3 tiles [user].** b4.1 shows a node for good once it has been within 3
   tiles, the pod's nodes from the start, and an edge's far node once built. Change: an unbuilt node shows
   only while the bot is within 3 tiles. **[Claude]** Nodes on the built network stay shown (you ride
   between them).
9. **Only allow extending the existing network [user].** b4.1 builds from any revealed node. Change: an edge
   can be built only from a node on the network (the pod's nodes, or an end of a built edge). With point 8
   that also means within 3 tiles of it, so the frontier is where you have to go.
10. **The spider is too fast; the rails have no purpose [user].** Walking is 7.5 tiles/s and riding 15 tiles/s,
    on edges of 4–5 tiles. ~~Walk 3 / ride 20 tiles/s~~ → at 1 px: walk 12 / ride 80 px/s to start (D081). The intent:
    the rail becomes about 7× faster than walking. Both stay knobs. The bot still climbs anywhere (D077);
    if the rails still have no purpose after that, the next lever is the terrain (longer edges, point 1).
11. **Not enough ore [user].** Points 1 and 5 together: b3.7's share scattered in small clusters, so most
    scans find some, on a bigger map. The price stays 10 (user: 8–12). The pull stays 1 s per unit, unless
    the user wants b3's 5 s back.

## The user's answers (2026-09-27, D080)

1. Scale: "I want to be a 1px character in a world drawn in v5. not a 1 tile character. 1px." A tile is one
   v5 pixel (`QS` = `K` = 4 per fine cell), so the world is v6's raster (`T.cls`) as it is, with no
   sampling. The rails are routed on cells, so each edge's path (cell centres 4 px apart) is filled in
   pixel by pixel, 8-way.
2. "True. No digging, no rock in inventory (yet). But the visuals of that hard/soft rock was natural, I need
   that." The pack holds ore and loot and is drawn as b3.7's (the reserved soft/hard slots and the home
   stone go). b3.7's hard/soft split stays, for its look.
3. The solid ice sheet: yes. A bug: a 1 s hold near the bot places one, if a bug is tamed. The hard/soft
   split wraps: STARTER_CAVES scales 12× across and 2× down, so it runs with a base of map width / 12 ×
   map height / 2 (240 px → 20), wrapping natively with no seam. Network nodes stay shown: yes. Walk
   3 / ride 20 tiles/s: "sure, test it".

## Settled after (2026-09-27, D081)

1. **Depth: all of v5's map (user).** About 240 × 516 px: the sheet on top, then ice, pudding, brine and ocean.
   The network C is routed over the whole depth (`rails()` gets the whole map as its frame, not v7's
   ice-only `frame()`), and so are the ore and the hard/soft split. The pod stays where `placePod` puts it
   (in the ice, under the crust).
2. **Numbers: the intent, not D079's figures (user: "careful, you just modified walk and ride speed, but
   intent is okay").** The rails are much faster than walking (about 7×). Start at walk 12 / ride 80 px/s
   and test them as knobs. The light and the node detection radius grow with the scale ("otherwise the
   player will not find them"). **[Claude]** Start from ×4 (light base 16, nodes within 12 px, scan 24 px),
   all knobs. b3.7's bug numbers (blocks 32, reach 12, den 12) start as they are and get tuned in play.

## Build notes (Claude, 2026-09-27)

- The world is 240 × 516 px, about 124k tiles, against b4.1's 2.4k. The fog is rebuilt as a whole image on
  each light change (b4 `render.js` `paintFog`): at that size, repaint only the rows the change touches. Not
  render tuning, just so it stays playable (see memory: no Canvas2D render tuning).
- Rails over the whole depth: measure `rails()`' time on the full map first (on the ice layer it was part
  of 270–550 ms map generation). If it's much slower, say so before looking for a fix.
- A 1 px bot at the zoom levels: b4.1's `ZOOM_PX` (10–48 device px per tile) shows only about 20 cells on a
  phone. The levels need to go lower (e.g. 2–12 device px per tile), and the bot needs to be seen at its
  pixel: its own colour plus a small halo, still 1 px in the sim.
- The always-lit surface goes (there's no sky inside the map any more). The pod's interior starts seen.
- b3.7's hard/soft split: `finalGrid({ ...STARTER_CAVES, width: W / 12, height: H / 2, seed })`, where W is
  240 (a multiple of 12) and H is rounded up to even.

## Order of work


1. The world: scale, the sheet, b3.7's ore, loot, hard/soft (points 1, 3, 5, 6).
2. Nodes and building: points 8 and 9.
3. Speeds: point 10.
4. The inventory: point 7.
5. The bugs: point 4.
6. Play-check in headless Chromium at each step. Ship as b4.2 with `npm run ship` (a point freeze, so no build
   check is needed).
