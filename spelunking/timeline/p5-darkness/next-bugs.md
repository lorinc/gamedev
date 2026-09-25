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
- **Hand-over:** when you enter a bug's territory, a bug holding ore walks to
  you and hands it over into your pack. If your pack is full, it waits,
  glowing.
- **Territory:** a radius of 12 tiles (a ruleset number).
- **Save and offline come later, in their own step.** Storage is the
  browser's or the platform's (localStorage or a portal SDK), not a server.
  Offline yield = f(time since last seen, revealed ore in range of tamed
  bugs), up to 32 per 24 h per bug, left in piles at the base.

## Still open (Claude's defaults, to confirm)
- Deep falls currently teleport you home (D035). Without the teleport, they
  just land, with no damage (casual).
- Ore and loot beyond taming: ore buys upgrades at base (pack, probe reach,
  a drill for hard rock, bug capacity, outposts later); loot unlocks things.
  Undecided; not in the first prototype.
- There's no save game yet, and offline progress needs one: the world, the
  bugs and the pack have to be stored.
- Real-time rates become sim ticks: 4 per minute = 1 per 900 ticks. Offline
  time is wall-clock, so it has to come in as a recorded command on load, to
  keep the sim deterministic (R5).

## Proposed steps (sequential sub-sessions, like p5)
0. Me: record the concept change and decisions in the concept doc, decisions
   and a p6 entry; fork b3 from b2.1.
1. Sim: the probe centred on the probed block; ↑ into rock probes the
   ceiling; the teleport home is gone, and deep falls change (ruleset b3.1).
2. Sim: wild bugs. They spawn in the dark, drift toward your glow, nibble
   pack ore, get shooed by the probe, can't cross planks. Taming at 16.
3. Sim: tamed bugs. Their den is where they were tamed, with a 12-tile
   radius. They extract any seen ore in range at 4 a minute, carry 8, and
   turn the ore into rock. When you enter a bug's territory, it brings you
   its ore; with your pack full, it waits, glowing. The ring and flood code
   is reused from light.js and probe.js.
4. b3: drawing bugs (wild, tamed, glowing as light), hand-over cues.
5. Later, its own step: save and load in browser or platform storage, plus
   offline piles at the base. The yield depends on the time away and the
   revealed ore in range, up to 32 per 24 h per bug. The time away comes in
   as a recorded command on load, to keep the sim deterministic.
6. The build check, and freeze b3.1.

## Verification
Sim steps: ASCII-map tests per rule (R8), determinism with bugs, b1/b2
rulesets unchanged (R9). Bundle steps: headless Chromium screenshots to
gallery/. Build check (R16) before the first push.
