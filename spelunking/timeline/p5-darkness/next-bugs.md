# p5 → next: tamed bugs mine for you, loot is carried home (design, not built)

## Context
After playing b2.1 (darkness + probe), the user pivots the theme. Swipe
control makes tunnelling and exploring easy, but mining by hand is messy.
So tamed moon bugs do the mining, while the player explores, prospects and
builds the network. Bugs are cute annoyances, never killed. There's no
teleport home: loot is carried back. The 1 s hold is freed for a rare, major
action later (outposts, TODO). This moves Bundle 3's idle production into
Bundle 2, and away from the vault/raid path: the concept doc gets updated.

## Decided by the user (2026-09-25)
- **Wild bugs** nibble ore from your pack, never loot. One that has eaten 16
  ore is tamed. The probe scares bugs off for a few seconds. Bugs can't climb
  planks.
- **Territory:** a tamed bug works within a radius of where it was tamed, and
  extracts only ore you have revealed (seen).
- **Rates:** a bug carries 8 ore at once and extracts 4 ore a minute.
  Extracted ore leaves no gap: the cell becomes rock (the rock it was
  generated from, or else the most common rock among its neighbours).
- **Delivery:** you walk around, and the bugs bring the ore to you. A bug
  holding ore glows for good.
- **Offline:** each bug collects 32 ore per 24 h and leaves it in piles at
  your base.
- **No teleport home.** You carry loot back. The 1 s hold is reserved for
  outposts (TODO).
- **The probe is centred on the probed block,** not on the player: ↓ probes
  around the block under you. **↑ into rock probes the ceiling** (replacing
  D043's mine-above) with the same reach, centred on the block above. You
  build planks to reach a ceiling.

- **Buried ore:** any revealed ore in range can be extracted, including ore
  inside rock that a probe revealed.
- **Hand-over:** ~~when you enter a bug's territory, a bug holding ore walks
  to you~~ (superseded below: the ore flies into you as you pass close). If
  your pack is full, it waits, glowing.
- **Territory:** a radius of 12 tiles (a ruleset number).
- **Save and offline come later, in their own step.** Storage is the
  browser's or the platform's (localStorage or a portal SDK), not a server.
  Offline yield = f(time since last seen, revealed ore in range of tamed
  bugs), up to 32 per 24 h per bug, left in piles at the base.

## Decided by the user, second pass (2026-09-25, after the gap review)
- **Ore and loot have no use yet, on purpose.** No placeholder use: "a gaping
  hole there is perfect." Later they get King of Thieves-style PvP uses.
- **Bugs are ambience with a function, with no physics.** They're like
  fireflies: beautiful dim lights that turn on briefly, then fade out again.
  They don't burrow. They suck ore through the cave wall, and a simple but
  obvious particle effect shows exactly which ore is drained into which bug.
- **Walking home with the loot is a triumph, not a chore,** especially
  through your own sleek tunnel system. Outposts are important and come
  later (TODO).
- **Wild bugs pop little hearts as they nibble your ore,** with the same
  particle effect as extraction (ore flying from your pack into the bug).
- **Wild bugs eat only from your pack** (not from tamed bugs). **There are no
  wild bugs inside a tamed bug's area.**
- **Hand-over doesn't interrupt anything:** you run past, and the ore flies
  into you when you get close to the bug. This replaces "the bug walks to
  you". With your pack full, it keeps glowing.
- **Bugs mine all revealed ore,** hard rock included.

## Still open (Claude's defaults, to confirm)
- Deep falls currently teleport you home (D035). Without the teleport, they
  just land, with no damage (casual).
- ~~Bugs can't climb planks.~~ Dropped (user): bugs ignore planks as if they
  weren't there.
- TODO: outposts (the 1 s hold), and PvP uses for ore and loot.
- There's no save game yet, and offline progress needs one: the world, the
  bugs and the pack have to be stored.
- Real-time rates become sim ticks: 4 per minute = 1 per 900 ticks. Offline
  time is wall-clock, so it has to come in as a recorded command on load, to
  keep the sim deterministic (R5).

## Decided by the user, third pass (2026-09-25): the friendly area
- **A tamed bug's area becomes friendly:** a bit more lit, mossy walls,
  bulbs and red grass growing on the floor, glowing lichen on the ceiling.
  "Do not complicate it, keep style as basic as the character."
- Claude's proposal, accepted: the area is the den's 12-tile radius; it
  decorates open cells and the rock faces bordering them (moss on faces next
  to air, bulbs and grass on floors, lichen hanging from ceilings). The
  lichen is the light: friendly cells stay dimly lit when you're away,
  brighter than seen, darker than your own light. Flat pixel shapes in a few
  solid colours, picked per cell from a hash of its position. It spreads from
  the taming spot in a growing ring over a couple of seconds (the probe's ring
  code). It shows where wild bugs never come.
- Defaults (Claude's): the whole radius, not only seen cells; tunnels dug
  there later get decorated too; overlapping areas merge.

## Decided by the user, fourth pass (2026-09-26, after playing b3.2): the bug bar (D060)
- Wild bugs' nibbles add up to one shared count; at 16, the last biter is tamed.
- Tamed bugs go into a bug bar: b1.1's slot row along the bottom, 4 slots. In the bar, a bug circles
  you and lights R = 2 like your light (seen for good). It doesn't mine.
- The 1 s hold is back: it places the bar's first bug 2 blocks above your head (the nearest open cell
  if that's rock). A placed bug is the mining utility, covering R = 12. Taking it back: later.
- Wild bugs show even in never-seen areas, and light R = 2 like your light while they blink on,
  for the moment only (they never lift the fog for good).
- So step 3 below is about **placed** bugs: the den is where you place one, not where it was tamed.

## Decided by the user, fifth pass (2026-09-26, after b3.3): bugs live in the fog (built as b3.4, D061)
The user said "save as plan, implement in next clean session"; built as planned, recorded as D061. *Italics* = Claude's defaults, shown to
the user with no objection.
1. **Blocks (user):** the world is cut into fixed 32×32-tile blocks (x wraps like the world). The 64
   blocks nearest you each hold 1 wild bug, if the block has a dark open cave cell: not lit now, not
   within 12 of a placed bug, *at least 4 steps from you*. Blocks beyond the nearest 64 lose theirs.
   Today's world is 384×71 = 12×3 blocks (36, the last row 7 tall), so the cap of 64 matters only for
   bigger worlds. They live in the sim (deterministic), unlike a screen-based count.
2. **Refill:** *a block whose bug is tamed or gone gets a new one after 5 s*, at a random dark cell of
   the block.
3. **Wanderers:** *drift around the open cells of their own block, never leaving it.* They can be in
   caves sealed off by rock: that's the point, they hint at hidden caves.
4. **Chasers (user: 3 at most):** at most 3 come for your ore at once, as in b3.3. *The nearest
   wanderers that can reach you through open cave within 20 steps (the field).* *A chaser still
   counts as its block's bug: no refill while it's out.* This replaces b3.3's spawn near you (`max`,
   spawnTicks near you).
5. **Drawing (user):** only bugs on screen are drawn; zoom decides how many you see.
6. Unchanged: the shared taming count, the bar, the hold, placed bugs (D060).
7. **Blinking (user):** wild bugs go between a **flicker, 3–5 s** and **dark, 5–9 s**, each length drawn
   anew per cycle (no sync), so they aren't constantly visible. Their temporary R 2 light follows the
   flicker. *The flicker fades in ~0.5 s, flickers irregularly 60–100%, fades out; dark = invisible, no
   dot, no light. A bug next to you glows steadily; a scared one flickers fast. Tamed ones glow
   steadily.* Blinking is drawing only: timings from a hash of the bug id and its cycle number.

Verification: ASCII-map tests (one bug per block, the 64 nearest only, refill after 5 s, wanderers stay
in their block, sealed-cave bugs, at most 3 chasers), determinism, the node fuzz for cost with ~36
bugs, headless screenshots zoomed out (never-seen caves with flickering bugs).

## Decided by the user, sixth pass (2026-09-26, session 3 start): pulling, and the bar calms the chasers (built as b3.5, D062)
- Standing still, you pull ore AND loot out of the walls like the bugs, 1 unit / 5 s; the cell reverts to stone.
- Each tamed bug in the bar removes one wild follower (chaser); the bar has 3 slots.
- Bar bugs fly around you like normal bugs, no circling.
- Claude's defaults (OK'd) and calls: D062.

## Decided by the user, seventh pass (2026-09-26): placed bugs mine, and the dust stream (built as b3.6, D063)
Build it in a fresh session: the rest of session 3. Record it as D063. *Italics* = Claude's defaults, shown
to the user; the user answered "a: ok" (read as: the stream as described, and ore only) and "2: R=4".
1. **Placed bugs mine** (D056 as adjusted by D060, D062): a placed bug pulls *seen* ore within 12 of its
   den, through the wall, reusing `pull.js` (`nearestValuable`, `toRock`): nearest first, the cell turns
   to the rock round it. *4 a minute = 1 per 900 ticks.* **Ore only** (loot stays yours to pull).
2. **Carry 8;** full, it stops pulling and glows (waits).
3. **Hand-over (user: R = 4):** you within 4 tiles (straight distance) of a placed bug with ore → its ore
   flies into your pack, *one unit every few ticks*, without stopping you; with your pack full, it waits.
4. **The dust stream (user's addition):** the pulling itself isn't shown anywhere, so while a pull is under
   way a continuous thin trickle of dust flows from the target cell to the puller (you or a placed bug), in
   the material's colour, specks drifting along a slight arc; the existing flight lands when a unit
   completes. *For you it starts ~0.5 s after you stop (short stops don't flicker it); for a bug whenever
   it's pulling; none with nothing in reach, a full pack/bug, or when you move.* The sim keeps the current
   target (`g.pulling` for you, `bug.target` per placed bug), picked by the same code as the pull, so the
   stream always points at the cell that goes. The dust is drawing only, from time, no particle state,
   on-screen only.
5. Also: the flight bug → you on hand-over, wall → bug on a bug's pull (the existing flight, ore colour).
Verification: ASCII-map tests (a placed bug pulls the nearest seen ore within 12 at its rate, only ore,
ore → rock, carries 8 then stops, hands over within 4 and not at 5, waits with your pack full, `g.pulling`
/ `bug.target` point at the next cell), determinism with placed bugs, headless screenshots of the stream
(you and a bug). Then ship as b3.6.

## Decided by the user, eighth pass (2026-09-26): the TODOs after playing b3.6 (plan, not built)
From the p6 feedback (`p6-tamed-bugs/feedback/2026-09-26_lorinc_b3.6.md`); the user's answers in **bold**.
1. **You and a bug on the same ore:** whoever targets it first keeps it; the other takes its next nearest
   (user: "ok").
2. **Reserved pack slots:** **1 each for ore, loot, soft stone and hard stone; the rest (2 of 6) are free
   for anything.** *A full reserved slot overflows into the free ones.*
3. **Leave base with 8 stone, every time:** banking at home tops the pack up to 8 stone.
4. **Taming progress** fills the bar's next empty slot as a 4×4 grid, like a pack slot (16 bites = 16
   cells) (user: "perfect").
5. **A placed bug whose area runs out of ore** seeks you out through the caves (**yes**, like a chaser),
   hands its ore over, and goes back into the bar. **With the bar full, it stays where it was placed.**
Open, Claude's defaults to show before building: which stone the 8 are (*soft*), what "runs out" means
(*no seen ore within reach and nothing left to pull*), and whether a seeking bug gives up past the field.

## Steps (sequential sub-sessions, like p5; each one playable, user OK 2026-09-25)
Sessions (user OK 2026-09-25): 0 + 1 · 2 · 3 · 3b + 4, each in a fresh session
that starts from the handoff and this file.
0. Me: record the concept change and decisions in the concept doc, decisions
   and a p6 entry; fork b3 from b2.1.
1. The probe centred on the probed block; ↑ into rock probes the ceiling;
   the teleport home is gone, and deep falls just land (ruleset b3.1).
   **The user plays it.**
2. Wild bugs, sim + drawing. Firefly-like (no physics, dim lights that blink
   in and out). They appear in the dark (never inside a tamed area), drift
   toward your glow, nibble pack ore (hearts + the ore particle effect), get
   shooed by the probe, ignore planks. Taming at 16. A tamed bug turns a
   warmer colour, so tamed and wild read apart at a glance (user,
   2026-09-26). **The user plays it.**
3. Tamed bugs, sim + drawing. Their den is where they were tamed, with a
   12-tile radius. They suck any seen ore in range through the wall at 4 a
   minute (the particle effect shows which ore goes to which bug), carry 8,
   and turn the ore into rock. Pass close to one and its ore flies into your
   pack; with your pack full, it waits, glowing. The ring and flood code is
   reused from light.js and probe.js. **The user plays it.**
   3b. The friendly area (above): drawing plus the lichen light, in its own
   session. **The user plays it.**
4. The build check, and freeze b3.1.
5. Later, its own step: save and load in browser or platform storage, plus
   offline piles at the base. The yield depends on the time away and the
   revealed ore in range, up to 32 per 24 h per bug. The time away comes in
   as a recorded command on load, to keep the sim deterministic.

## Verification
Sim steps: ASCII-map tests per rule (R8), determinism with bugs, b1/b2
rulesets unchanged (R9). Bundle steps: headless Chromium screenshots to
gallery/. Build check (R16) before the first push.
