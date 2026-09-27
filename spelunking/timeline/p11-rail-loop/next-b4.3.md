# p11 · b4.3 · the plan (written 2026-09-27; built as b4.3, D083)

The user's notes after playing b4.2 are in `feedback/2026-09-27_lorinc_b4.2.md`. **[user]** marks what the
user asked for, **[Claude]** a proposal the user hasn't confirmed, **Open** a question for the user.

## 1. The torchlight, half as big [user]

b4.2: radius 16 px + 1 per 4 ore or 2 loot (so up to +24 with a full pack). Halved: **base 8, +1 per 8 ore
or 4 loot**. Both stay knobs.
- **Open:** b3's pull takes seen ore **within the light radius**, so halving the light also halves the pull's
  reach (16 → 8 px). Keep them tied, or give the pull its own reach (16)?
- Not touched unless asked: the scan (24 px, now 3× the light, was 1.5× in b4.1) and the node radius (12 px).

## 2. No light inside the rock [user]

b4.2's `light.face` 4 (D082) lit rock 4 px deep: that goes back to b3's rule, only the rock face bordering
the air is lit (1 px). The scan stays the only way to see inside the rock (D053).

## 3. Line-of-sight light [user asked if it's expensive]

**It's cheap.** Today the light floods through open cells within the radius, so it goes round corners and
lights caves you can't see. Line of sight = shadowcasting from the bot's pixel (the standard roguelike
algorithm): it touches each cell within the radius about once, so at radius 8 about 200 cells and at the full
pack's 20 about 1,300, recomputed only when the bot moves a pixel (12 a second) or the pack changes. That's
well under a millisecond; b4.2's render already redraws only the pixels that change.
- **[Claude]** What's lit: open cells in sight, and the first rock pixel each line hits (the face). Bugs' lights
  the same way.
- **[Claude]** For the atmosphere, a soft edge: the lit area fades out over its last few pixels instead of
  b3's hard edge (drawing only; the sim keeps lit / not lit). Remembered cells stay dim, as now.
- It's a new function next to b3's `litCells` in `src/sim/dig/light.js`, with tests; b3 keeps its flood.
- The wrap in x and the pod need care: the pod starts seen.

## 4. Tamed bugs work on their own [user]

What changes against b3.7 (D060–D064): a tamed bug no longer goes into the bug bar and isn't carried or
placed. It mines ore out of the walls, and the ore goes to the network and along the rails to the pod.
Consequences, all gone with the bar: the 1 s hold (D080), the bar HUD, bar bugs lighting round you and keeping
chasers away (D062), placed bugs seeking you when their area runs out (D064), the hand-over to you (D063).
Kept: wild bugs in the fog, nibbling ore from your pack, 16 fed tames one (D060).

Gaps to settle:
- **Open: where a tamed bug works.** (a) Right where it was tamed (next to you: you tame it where you stand).
  (b) It flies off by itself to the nearest seen ore it can reach through the caves, and works there. (a) is
  what b3's placed bugs do and needs nothing new.
- **Open: how ore gets from the bug to the node.** (a) A dust stream straight through the rock, like the pull,
  only if a network node is within some reach of the bug; out of reach, the bug fills up (8) and waits.
  (b) The bug flies there through the caves, carrying up to 8, and back. (a) is cheap and painfully obvious;
  (b) looks alive but needs pathfinding, and a node's pixel can be in rock.
- "Nearest connected node": every node on the network is connected to the pod (you only build from the
  network, D080), so it means the nearest network node. **[Claude]** Nearest by straight distance.
- **[Claude]** Ore on the rails: units travel node to node along built edges, the shortest way (in edges'
  length) to the nearest pod node, drawn as specks on the rail at ride speed. A new edge can change the way:
  ore under way finishes its current edge, then takes the new shortest way.
- **Open: what the ore in the pod is for.** Today an edge is paid from your pack, where you stand. Ore piling
  up in the pod pays for nothing unless: (a) a build is paid from the pod's store when the pack is short (the
  network carries the pod's ore to you: the rails and bugs make building easier as they grow); (b) you
  ride home to fill the pack; (c) nothing yet, a count on screen. **[Claude]** (a): it gives the bugs and the
  rails a purpose at once, and the more bugs you tame, the faster you build.
- **[Claude]** A bug whose reach runs out of seen ore stays where it is, dark and idle (no seeking you: there's
  no bar to go back to). Its light still shows the way, a lamp on your old paths.
- **[Claude]** The bugs' code: a switch in `cfg.bugs` (b3 keeps its bar; b4 turns it off), so b3's live page
  and tests don't change.
- The pod store in the HUD: **[Claude]** a second, smaller pack-like counter by the pack, or a number.

## The user's answers (2026-09-27)

1. The pull stays tied to the light (user: "I'm mining far too far"): both halve, 16 → 8 px.
2. A tamed bug flies off to ore it can reach through the caves, "and it keeps doing it".
3. It flies the ore to the node through the caves (b). "Nodes sitting in rock is not okay": never inside a
   wall; if that's complex, an open space of radius 3 round each node.
4. Yes, and more: "the backpack should dump everything into the nearest node, the same way bugs do it, and
   building costs are deducted from a central ore ledger."

## Nodes in rock (measured 2026-09-27)

Nodes are picked **after** the WFC (v8 `chords()`): grid vertices in open air, the most open first. Mode C then
moves each to the centre of its 4 px cell, since the rails run cell to cell, and that centre can be rock. Five
seeds: 24–37 of ~400 nodes (6–9%) end in rock, and ~45% are open but within 3 px of rock.
**[Claude]** The fix at the source: a vertex whose cell centre isn't open is not a candidate (the next most open
vertex takes its place), so no node is ever in a wall. Cheap, no carving. Requiring 3 px of clearance
instead would drop about half the candidates and thin the network: not proposed. (The r3 carve stays the
fallback if the filter fights the router.)

## The ore economy, as answered

- **[Claude]** You within `nodeReach` (12 px) of a network node: the pack empties into it by itself, unit by
  unit, as the build's stream did (no gesture). Wild bugs still nibble ore from the pack on the way.
- Ore at a node travels the rails to the pod (point 4 above); **[Claude]** it's counted in the ledger when it
  reaches the pod, so the rails carry something you wait for. A dump at a pod node counts at once.
- Building: still from a network node within reach, the price taken from the ledger (not the pack). The HUD
  shows the ledger against the price; the pack stays on screen too.
- A bug (b): flies through open air to the nearest seen ore it can reach, pulls from next to it, up to 8, then
  flies to the nearest network node it can reach through the air and drops it; again, forever. Ways through the
  air: one distance field from all network nodes (rebuilt when an edge is built), one from each bug for ore
  (b3's `seek` field, larger). **[Claude]** It mines only seen ore (b3's rule), so your scans feed the bugs.
  A bug whose cave holds no network node fills up and waits, dark: bugs are worth taming in caves the network
  reaches.
- Bugs fly 5 px/s at b3.7's `moveTicks` 12: slow for long trips; a knob.

Still open:
- **Open: the light.** It grows with what the pack holds (D051). Dumping at every node drops you to the base
  light (8 px) each time. Keep it (carrying = brighter, a reason to hold on), or have the light grow with the
  ledger, or stay at the base?
- **Open: loot.** "Everything" goes into the node, loot too. The ledger keeps loot as a second count with no
  use yet (b3's rule: no use for loot on purpose), or loot stays in the pack?

## The user's second answers (2026-09-27): an incremental game with simulation aesthetics

These replace the ore economy and the bugs above wherever they differ (the sections above stay as the record).
- **Nodes never in rock:** the candidate filter, and no fallback: make it work (user).
- **The ledger:** every collectible (ore, loot, bugs) goes to one central ledger, a column in the top-right
  corner. Loot stays on it, for tech unlocks later.
- **Building:** tap the node, drag to select, release: the selected edge flashes green; tap it: it builds. Not
  enough ore: a red pulse, nothing built. Built: ore particles stream from the ledger's ore icon to the site.
  The red X, the hammer and the hold preview go.
- **Bugs are abstract:** a count on the ledger. They spawn anywhere near network nodes, random-walk for n
  minutes collecting, then send what they got straight to the ledger's icons (not to nodes). No pathfinding,
  no deep simulation; there will be a lot of them.
- **Light:** a fixed radius (half of b4.2's: 8 px); it grows later by buying light upgrades, not with the pack.

**[Claude]** defaults for the bugs: a trip lasts 2 minutes (knob); the walk stays in open air (a random step
into a neighbouring open pixel: no pathfinding, and bugs never enter rock, D056); a bug pulls any ore or loot
within 2 px of it, seen or not, and the pixel turns to rock; at the trip's end its haul flies to the ledger and
a new trip starts near another network node. b3's `bugs.js` isn't used for them: a small new b4 module.

Still open:
- **Open: your own mining.** Straight to the ledger too (particles to the top-right, no pack, no dumping, no ore
  on the rails)? Or the pack, dumped at the nearest node, riding the rails to the pod, as answered before?
- **Open: how a bug gets onto the ledger.** Wild bugs in the fog tamed by feeding them 16 ore (b3.7's, D060),
  now from the ledger when one reaches you? Or bought, or found, or something else?

## The user's last answers (2026-09-27, 17th session)

- **Your own mining** goes straight to the ledger, with no particle stream from the bot to the ledger. No pack,
  no dumping, no ore on the rails. **[Claude]** The pull's stream from the wall to the bot stays (it shows what
  you're mining); a unit counts on the ledger when it reaches you. The rails are for riding.
- **Bugs on the ledger:** wild bugs in the fog are tamed by feeding them 16 ore (b3.7's rule, D060), taken
  from the ledger when they nibble. **[Claude]** A nibble takes one ore from the ledger (it was the pack); the
  16th bite puts +1 on the ledger's bug count and the wild bug is gone (it's abstract now).

## Order of work

1. Light: a fixed 8 px, the 1 px face (points 1, 2): minutes, play-check.
2. Line of sight and the soft edge (point 3), with tests.
3. Nodes never in rock (the candidate filter).
4. The ledger column and the simpler build gesture (red pulse, particles from the ledger).
5. Abstract bugs: trips from near network nodes, random walk, haul to the ledger.
6. Play-check each step in headless Chromium, screenshots to `gallery/p11/`; ship as b4.3 (`npm run ship`,
   pushed, so the user can test on the phone).
