---
id: p11
title: Rail Loop (b4)
started: 2026-09-27
status: building
budget: 3d
from: p10
dev: b4.html
build b4.1: 2026-09-27 · p11: b4 Rail Loop, step 1: the whole loop without bugs (new bundle, not a copy of b3; D079)
build b4.2: 2026-09-27 · p11: b4.2 built per next-b4.2.md, the world at 1 px of v5 with b3.7's rock, pack and bugs (D082)
build b4.3: 2026-09-27 · p11: b4.3, the incremental turn: one ledger, abstract tamed bugs, tap-drag-tap build, 8 px line-of-sight light, nodes never in rock, any-angle walk, 1 s scan (D083)
build b4.4: 2026-09-27 · p11: b4.4, the bot glides at every angle (sub-pixel), explored unlit areas 50% darker (D084)
build b4.5: 2026-09-27 · p11: b4.5, the bot mines while walking (D085)
build b4.6: 2026-09-27 · p11: b4.6, the scan fires only when something within its radius is unseen (D086)
---

# p11 · b4 · Rail Loop

The traverse node layer (D078, p10) goes into the game, with the travel network and the network-building
loop (user, 2026-09-27): "you wake up in the pod as a spider bot. You walk around with AWSD, phone-drag.
[…] When ore is revealed and you are in range, you automatically mine it (like the bug, not the wall
itself), so your ore pack should gradually fill. And when you get close to a hidden node, the node and
the outgoing edges start to glow. Each edge costs ores to build […] get in, swipe, travel. You find
yourself in a new cavern, everything works the same way, except there are bugs here that you can tame."

**Continue the b-thread, don't reinvent (user):** prospecting, mining, the pack, light and bugs are b3's
code as it is (`src/sim/dig/`). But b4 is **not a copy of b3** (user, 2026-09-27: "completely different
generation algo"): its world is p7's quad caves with p10's lattice, and the mechanics below replace b3's
swipes.

## Question

Does exploring as a spider bot, mining on the way, and building rails node by node make a loop you want
to repeat into the next cavern?

**Pass:** the player scans and mines to afford the next edge, not as a chore; building an edge and
riding it to a new cavern feels like a reward; they go for the next one without being asked.

**Kill:** walking around to fill the pack feels like waiting for the build, or the rails feel like a menu
rather than a place. Then the costs or the node spacing change before anything is added.

## The loop (user, 2026-09-27)

1. **Start:** you wake up in the pod as the spider bot, with an empty ore pack (user). The pod's nodes
   come out of the lattice for free (user: every map seen has 2 or 3 nodes inside the pod). The pod is
   only its interior open space, with no dome walls (user: the walls delete rock and ore).
2. **Move:** drag the screen or hold A/W/S/D and the bot moves that way; release, it stops. It moves
   through any open tile (it climbs the back wall, D077); rock blocks it. This replaces b3's swipes.
3. **Seismic scan:** b3's probe (`probe.js`, D053) with a new trigger: walking into a rock face triggers
   it at once (user; no 0.5 s wait); the 3 s cooldown stays, so leaning on a wall doesn't scan every frame
   (user); its radius is 6 tiles (user), not the light radius.
4. **Mining:** b3's pull as it is (`pull.js`, D062): revealed ore in range comes into the ore pack by
   itself, with the same particle effect as the bugs' mining (the wall stays).
5. **Nodes:** hidden until you come within 3 tiles (user); then the node glows. A revealed node is close
   enough to build from (user). Building an edge reveals the node at its far end (user: yes).
6. **Building an edge (user, 2026-09-27):** it costs ore; 8–12 is a reasonable price, tuned later with the
   rest of the economy (user). The gesture, on the node itself (no separate build icon):
   1. press and hold the node: its outgoing edges glow; release: they stop glowing (a preview you can
      skip, user);
   2. press the node and drag towards an edge: that edge is selected and two options appear, a red X
      (cancel) and a green hammer (build);
   3. release, then tap the hammer: ore streams into the node (b3's dust stream), and the travel pod and
      the monorail edge get built.
   The icons' style comes from b3's build cues (`render.js`, `drawCue`).
7. **Travel:** walk right onto the travel pod to get in. A swipe gives a rough direction, and the pod keeps
   going that way, node after node, until (user):
   - it can't go further that way: it stops at the last node;
   - you tap: it stops at the next node;
   - you swipe a new direction: from the next node it goes that way.
   At a fork, the edge is the one that best fits the swipe's direction (Claude's reading).
8. **The next cavern:** an edge doesn't have to end in a new cavern; the far side only needs room to mine
   enough ore for the next edge (user). Everything works the same, and there are bugs to tame: b3's bugs
   as they are (D056–D064).

## Assumptions

1. [?] b3's probe, pull, pack, light and bugs work unchanged on the new terrain once it's in b3's tile
   world (`Tile`: open, soft, hard, ore, loot).
2. [?] D078's lattice (3 cells apart, Gabriel, rock ×5, bend 15, overlap +100%, crossing 100) gives
   reachable, affordable edges from the pod on every seed.
3. [?] The player can't trap themselves (user: "we will have to adjust to make sure"): from wherever you
   stand, some edge is affordable, or ore to afford one is within reach.

## Limitations

- [cut] The shield timer (D077), walls, gates and buildables (small, big, titan): later (user).
- [cut] Rendering stays b3's Canvas2D; it moves to PixiJS later.

## Open (to settle while building, with the user)

- Ore and loot on the quad caves: b3's generator's ore layer (`sim/gen/world.js`, the CA `ore` layer,
  and loot by chance) over the quad caves' rock (user: yes).
- An edge's price: 8–12 ore for now (user); the formula is a balancing act, tuned later.

## Built

**b4 step 1, the whole loop without bugs (2026-09-27, `b4.html`, `src/bundles/b4/`).** A new bundle, not a
copy of b3 (D079). `world.js` makes the tile world: p7's quad caves, the pod's interior carved open (no
dome walls), p10's rails (mode C, D078's defaults) in tiles, and b3's CA ore layer over the rock, with loot
by chance. `game.js` is b4's own sim, reusing b3's probe rings, pull targeting, pack and light
(`src/sim/dig/`); `input.js`, `render.js` and `main.js` are new; the dev panel is b3's. Checked in headless
Chromium: walking and the scan, the hold preview, the drag selection with the red X and the green hammer,
the ore stream and the build, boarding the car, a swipe ride to the far node. Claude's calls while building:
- Ore: b3's ore layer seeds at 380‰ (knob `world.ore`), because b3's 280 leaves 20–60 ore tiles on this
  60 × 40 map; 380 gives 75–206 across five seeds.
- The pull: 1 s a unit (knob `sim.pull.ticks`), not b3's 5 s, or an edge is nearly a minute of standing still.
- The scan fires on the rock tile pointed at; a diagonal into rock slides along the open side first.
- A revealed node can be built from anywhere (user: "if the node is revealed, I'm standing close enough").
- Rails cross rock without carving it; cars are the only way through.
- In a car, drags are always swipes (the car stands on a node); pointing where no built edge fits, while
  stopped, gets you out and walking that way; Space is the keyboard's tap.
- You only get out of a car onto an open tile: a node's tile can be rock (the router rounds nodes to tiles),
  and getting out there shut the bot in the rock with its car out of reach (the build check's finding).
- Rails at the frame's bottom edge, where the router clamps a node, are dropped.
- Edges are short (3–7 tiles on seed 1): D078's spacing of 3 cells.
Not yet: the bugs (step 8). Not pushed: a new bundle needs the build check and a freeze (R13, R16).

**b4.2, the user's notes on b4.1 (2026-09-27, D080, D081, D082; plan: `next-b4.2.md`).** Built in the plan's order,
each step play-checked in headless Chromium (screenshots `gallery/p11/b4.2_*`):
1. The world: a tile is one v5 pixel, all of v5's map (240 × ~528 px) under v6's sheet (solid, drawn with no
   fog, stars above), the sea at the bottom solid; network C routed over the whole depth (rails 120–320 ms,
   the whole map 0.4–0.7 s); b3.7's ore layer (≈10% of rock, as b3.7), loot 50‰ and hard/soft split
   (≈42% hard) at the map's size, wrapping. The pod's interior starts seen; nothing is always lit.
2. Nodes: the network's show for good, the rest only within 12 px; edges build only from a network node
   within 12 px of the bot.
3. Speeds: walk 12 px/s, ride 80 px/s (knobs `sim.walkSpeed`, `sim.rideSpeed`, in px/s now).
4. The pack: b3.7's, ore and loot slots reserved, drawn at the top of the screen (the bot is 1 px), with the
   ore-against-price bar under it; a refused build blinks it red, as b3's did.
5. Bugs: b3.7's as they are, with b3.7's numbers. A 1 s hold within 60 CSS px of the bot places one (E held
   1 s on a keyboard), with b3's filling ring.
Claude's calls while building (D082):
- Lit rock goes 4 px deep (knob `sim.light.face`): at 1 px, b3's one-tile face was a hairline.
- The light grows +1 px per 4 ore or 2 loot (b3's per 16 / 8 tiles ×4); the scan runs a ring a tick (0.4 s to
  radius 24, about b4.1's 0.5 s). An edge's heading is read 12 px out (b4.1's 3 tiles).
- Nodes are drawn as rings: at 1 px a tamed bug is a warm dot too.
- The fog and the world textures change pixel by pixel (a whole repaint each step was too slow to play).
- Zoom levels 2–24 device px a tile, default about 100 px across the short side.
- b3's wild-bug glow through the fog is left out (2 px at this scale).
Seen in the check: the start cave is small and all lit, so no wild bug can appear in it (b3's rule: dark cells
only); in a big cave a chaser came at once and one was tamed within 5 s. b3.7's `seek` of 20 steps is 20 px now:
`sim.bugs.seek` is on the panel, with the other bug numbers, for tuning in play.

**b4.3, the user's notes on b4.2 (2026-09-27, D083; plan: `next-b4.3.md`).** The game turns incremental.
Built in the plan's order; tests (`src/bundles/b4/game.test.js`, the new sight tests in light.test.js) and a
headless Chromium check (screenshots `gallery/p11/b4.3*`):
1. The light: a fixed 8 px, line of sight (`sightCells` in `src/sim/dig/light.js`, b3 keeps its flood), rock lit
   1 px deep; its last 3 px fade out. The pull reaches 8 px too.
2. Nodes never in rock: v8 mode C skips a vertex whose tile centre is rock (v8's page gets it too). Seeds 1–5:
   0 nodes in rock (was 24–37), ~380 nodes on rails as before.
3. The ledger, top right: ore, loot, bugs. Pulls count there; the build gesture is tap node, drag, release,
   tap the green-flashing edge; the price shows on it; red pulse and a red ore count when short.
4. Wild bugs nibble the ledger; 16 fed is +1 bug (bugs.js's `ledger` switch; b3 unchanged). Tamed bugs:
   `swarm.js`, knobs `sim.swarm.*` on the panel (trip 2 min, 5 px/s, a unit a second within 2 px).
5. The user, mid-build: walking at any angle (a drag's angle; keys stay 8-way), the scan's cooldown 1 s.
Gone: the pack, the bug bar, placing bugs (the 1 s hold, E), placed bugs mining, the X and hammer, the ore
streaming into the node.
Seen in the check: the start cave has loot but little ore within 8 px, so the first edge takes some walking.
Then (D084, the user): walking glides at the drag's exact angle (a sub-pixel position; b4.3 still stepped in
8 ways on screen), and explored, unlit areas are 50% darker (17.5% bright). Then (D085, the user): the
pull goes on while walking (not in a moving car). Then (D086, the user): the scan fires only when some pixel
within its radius is still unseen.

## Feedback

- **b4.1 (user, 2026-09-27, `feedback/2026-09-27_lorinc_b4.1.md`):** wants v5's terrain gen and scale, p10's
  network C, v6's ice sheet, and b3.7's bugs, ore, hard/soft rock and inventory; problems: travel nodes should
  show only within 3 tiles, building only extends the existing network, the spider is too fast (the rails
  have no purpose), not enough ore on the map. The plan for b4.2: `next-b4.2.md` (build next session).
- **b4.2 (user, 2026-09-27, `feedback/2026-09-27_lorinc_b4.2.md`):** the light far too big and lighting 4 px into
  rock; wants line of sight; then the incremental turn: one ledger, abstract tamed bugs, a simpler build, a
  fixed light. The plan: `next-b4.3.md`; built as b4.3 (D083).

## Conclusion → next
