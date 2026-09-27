---
id: p11
title: Rail Loop (b4)
started: 2026-09-27
status: building
budget: 3d
from: p10
---

# p11 · b4 · Rail Loop

The traverse node layer (D078, p10) goes into the game, with the travel network and the network-building
loop (user, 2026-09-27): "you wake up in the pod as a spider bot. You walk around with AWSD, phone-drag.
[…] When ore is revealed and you are in range, you automatically mine it (like the bug, not the wall
itself), so your ore pack should gradually fill. And when you get close to a hidden node, the node and
the outgoing edges start to glow. Each edge costs ores to build […] get in, swipe, travel. You find
yourself in a new cavern, everything works the same way, except there are bugs here that you can tame."

**Continue the b-thread, don't reinvent (user):** b4 starts as a copy of b3 (p6). Prospecting, mining,
the pack, light and bugs are b3's code as it is (`src/sim/dig/`); what changes is the terrain (p7's quad
caves with p10's lattice) and the mechanics below.

## Question

Does exploring as a spider bot, mining on the way, and building rails node by node make a loop you want
to repeat into the next cavern?

**Pass:** the player scans and mines to afford the next edge, not as a chore; building an edge and
riding it to a new cavern feels like a reward; they go for the next one without being asked.

**Kill:** walking around to fill the pack feels like waiting for the build, or the rails feel like a menu
rather than a place. Then the costs or the node spacing change before anything is added.

## The loop (user, 2026-09-27)

1. **Start:** you wake up in the pod as the spider bot. The pod's nodes come out of the lattice for free
   (user: every map seen has 2 or 3 nodes inside the pod).
2. **Move:** drag the screen or hold A/W/S/D and the bot moves that way; release, it stops. It moves
   through any open tile (it climbs the back wall, D077); rock blocks it. This replaces b3's swipes.
3. **Seismic scan:** b3's probe (`probe.js`, D053) with a new trigger: walking into a rock face for 0.5 s;
   a 3 s cooldown; its radius doesn't depend on the light radius.
4. **Mining:** b3's pull as it is (`pull.js`, D062): revealed ore in range comes into the ore pack, like
   the bugs mine it (the wall stays).
5. **Nodes:** hidden until you come close; then the node and its outgoing edges glow. Building an edge
   reveals the node at its far end (user: yes).
6. **Building an edge:** it costs ore, which you may already carry. Press the build icon: the outgoing
   edges glow more; release: less. Drag the icon towards one of the edges: that edge is selected, the
   icon turns into a red X (cancel) and the selected edge shows a green hammer. Tap the hammer: ore
   streams into the node (b3's dust stream), and the travel pod and the monorail edge get built.
7. **Travel:** get in, swipe, travel along built edges.
8. **The next cavern:** everything works the same, and there are bugs to tame: b3's bugs as they are
   (D056–D064).

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

- Where ore and loot come from on the quad caves. User: "earlier versions have solved this already";
  b3's generator has an ore layer (`sim/gen/world.js`, the CA `ore` layer, and loot by chance). Claude's
  reading: lay that ore layer over the quad caves' rock. Confirm.
- An edge's price. Claude's proposal: ore in proportion to the route's cost (length, rock ×5), so tunnels
  cost more than rails across open caverns. Not confirmed.
- The scan's radius (no longer the light's).

## Built

## Feedback

## Conclusion → next
