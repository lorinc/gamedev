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
