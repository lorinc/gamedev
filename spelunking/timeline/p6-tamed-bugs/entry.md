---
id: p6
title: Tamed Bugs (b3)
started: 2026-09-25
status: building
budget: 3d
from: p5
dev: b3.html
build b3.1: 2026-09-26 · p6 · b3 Tamed Bugs: the pivot recorded, the probe centred on the probed block, ↑ probes the ceiling, no teleport home (D054–D058)
build b3.2: 2026-09-26 · p6 · b3 Tamed Bugs step 2: wild bugs drift to you, nibble ore with hearts, tamed at 16 turn warm (D059)
build b3.3: 2026-09-26 · p6 · b3 Tamed Bugs step 2b: shared taming, the bug bar, the hold places a bug, bug lights (D060)
build b3.4: 2026-09-26 · p6 · b3 Tamed Bugs step 2c: wild bugs live in the fog, 1 per 32×32 block, flicker and dark (D061), the wild light fades out
build b3.5: 2026-09-26 · p6 · b3 Tamed Bugs step 3a: standing still pulls ore and loot, the bar calms the chasers, bar bugs roam (D062), bar bugs fly 2 to 8 off with inertia
build b3.6: 2026-09-26 · p6 · b3 Tamed Bugs step 3: placed bugs mine and hand their ore over as you pass, the dust stream (D063), the bug stream holds still
---

# p6 · b3 · Tamed Bugs

After playing b2.1, the theme pivots (D054). Swipes make tunnelling and exploring easy, but mining by hand is messy. So tamed moon bugs mine for you, while you explore, probe and build the tunnel network. Nothing teleports you home: you carry the loot back. b3 starts as a copy of b2.1. The design, with every decision and its source, is in [p5-darkness/next-bugs.md](../p5-darkness/next-bugs.md).

## Question

Does taming bugs that mine what you've revealed turn exploring into a loop you want to come back to?

**Pass:** you probe to find ore for your bugs, not for yourself; you swing by your dens to collect; the walk home with a full pack through your own tunnels feels like a triumph.

**Kill:** the bugs feel like a chore (herding, waiting), or like a tax you can't escape; walking home feels like a punishment for the lost teleport.

## Assumptions

1. [?] Losing wild-bug nibbles from your pack reads as cute, not as punishment: the hearts and the taming at 16 make it an investment.
2. [?] Tamed bugs mining only what you've revealed makes the probe a tool for your bugs, and gives exploring a purpose.
3. [?] Collection by running past (no stopping, no menu) is enough of a hand-over.
4. [?] Walking home without a teleport is a triumph, not a chore, once your own tunnels lead there.
5. [?] The friendly areas make your territory readable at a glance, and pleasant to come back to.
6. [?] Ore with no use yet doesn't kill the motivation to collect it, for now.

## Limitations

- [constraint ?] No use for ore or loot, on purpose (D054).
- [constraint ?] No teleport home.
- [cut] Save and offline piles at the base: step 5, after this.
- [cut] Outposts (the 1 s hold) and PvP uses for ore and loot: later.
- [cut] Noise, the other loadouts, and the "why go home" drill.

## Built

Built in steps, one per session (user, 2026-09-25): 0 + 1 · 2 · 3 · 3b + 4.

0. The b3 bundle, forked from b2.1; this entry; decisions D054–D057.
1. The probe centred on the probed block; ↑ into rock probes the ceiling; no teleport home (D055, ruleset b3.1).
2. Wild bugs (D056, D059).
2b. Shared taming, the bug bar, placing bugs with the hold (D060), after playing b3.2.
2c. Wild bugs live in the fog (D061), after playing b3.3.
3. Pulling ore and loot while you stand still, the bar calms the chasers, bar bugs roam (D062); then placed bugs mine, with the dust stream (D063).
3a. The TODOs after playing b3.6: shared ore, reserved slots, 8 stone from home, taming progress in the bar, bugs going back to the bar (D064).
3b. The friendly area (D057).
4. The build check, and b3.1 frozen.

**The probe and the walk home (step 1, D055, D058):** ruleset `b3.1` = b2.1 with ↓ on a floor → `probeBelow`, ↑ into rock → `probeAbove`, and `teleport: false`.
- **The probe:** its rings spread from the block under you (↓) or the block above you (↑), with b2.1's reach: light + 2 for a flick, up to light + 4 held. The ceiling isn't mined any more. Ring 1 holds the centre cell too.
- **No teleport:** the command does nothing, and a deep fall just lands (stop `fell`), pack and all.
- **Home:** stepping onto the home cell with anything in the pack counts it in and shows the dive log; the pack empties and the light goes back to base.
- **Tests:** 3 probe tests and 5 walk-home tests on ASCII maps; b2.1 still probes around you and teleports after a deep fall.

**Wild bugs (step 2, D059):** ruleset `b3.2` = b3.1 + `bugs` numbers. Wild moon bugs appear in the dark, drift to you through open cells, and nibble ore (never loot) from your pack, with an ore flying into them and a heart popping. The 16th ore tames one where it is, and it turns warm amber (wild ones are cool blue). A probe ring scares them off for 4 s. No wild bug comes within 12 tiles of a tamed one. Tamed bugs just stay at their den for now (step 3 puts them to work). The Claude's calls are listed in D059.
- **Tests:** 8 bug tests on ASCII maps (drift, nibble and taming, never loot, the probe's scare, the wander and despawn, where they appear, den areas kept clear, none in b3.1), plus a determinism test with bugs.
- **Screenshots** (local, `gallery/p6/`, not in the repo): a nibble with its heart, a taming, and a tamed bug at its den with wild ones blinking out in the dark.

**Shared taming, the bug bar and the hold (step 2b, D060):** ruleset `b3.3`. After playing b3.2, the user redesigned the tamed side: several wild bugs split the nibbles, so none of them got tamed.
- All wild bugs' bites add up to one count; at 16, the last biter is tamed into the **bug bar**, b1.1's slot row along the bottom (4 slots).
- Bar bugs circle you and light 2 around themselves, seen for good.
- The 1 s hold is back: it places the bar's first bug 2 above your head (or at the nearest open cell), where it's the mining utility for step 3, lit, with no wild bugs within 12.
- Wild bugs show everywhere and light 2 around them for the moment they blink on, without making anything seen.
- **Tests:** 12 bug tests (the shared count, a full bar, the orbit's light, placing, above rock, an empty bar) plus determinism with a `place`; 178 in all.

**Bugs live in the fog (step 2c, D061):** ruleset `b3.4`. After b3.3, the user wanted wild bugs out in the dark, not spawning near you.
- The world is cut into 32×32-tile blocks. The 64 nearest you each hold 1 wild bug, in a dark cave cell of the block, sealed caves included: they hint at hidden caves. Today's world has 36 blocks, so every block has one.
- Wild bugs wander inside their block. At most 3, the nearest that can reach you within 20 steps of open cave, come for your ore as before. A block whose bug is tamed or gone gets a new one 5 s later.
- Wild bugs flicker for 3–5 s, then go dark for 5–9 s, with no sync between them. Only bugs on screen are drawn, so zooming out shows more.
- **Tests:** 7 new bug tests (one per block, the nearest blocks only, the refill, wanderers stay in their block, a sealed cave, at most 3 chasers, a lost chaser), and determinism covers the blocks; 184 in all. With 36 bugs the sim costs 0.03 ms a tick (0.01 without bugs).
- **Screenshots** (local, `gallery/p6/`): zoomed out, the never-seen caves with the bugs flickering in them.
- A wild bug's light fades out from the bug (user, 2026-09-26: "the strict integer hard-cut light of the bugs is weird"): a radial gradient, and its lit cells' edge softened over a tile. Wild bugs only; your light and tamed bugs' keep the fog's hard tile edge (D052).

**Pulling, and the bar calms the chasers (step 3, first part, D062):** ruleset `b3.5`. The user: "manually collecting ore to tame bugs goes against the 'let's build tidy and regular hallways' goal. You zip around, try to mine with precision with a system that was designed for loose intent."
- Standing still, you pull the nearest seen ore or loot within your light out of the wall, 1 every 5 s, and the cell turns to rock (soft or hard, like the rock round it). Any move restarts the count; the probe counts as standing.
- Each bug in the bar keeps one wild chaser away: 3 chasers with an empty bar, none with a full one. The bar has 3 slots now.
- Bar bugs roam round you instead of circling. After playing, the user found them hysterical ("their speed and random walk and their need to stay close is annoying"), then jittery ("like it's being pulled back then flies, then pulled back"; a pause snapped the drawing back a cell, fixed). Now they fly 2 to 8 steps from you at wild-bug speed (faster only to catch up), never pause, keep their heading for at least 2 steps, and turn round only when nothing else works.
- **Tests:** 7 pull tests (nearest first, the rock round it, seen only, the light's reach, a move restarts, what fits, none in b3.4), 3 bug tests (roaming with its distance and inertia, following and the jump, the chaser cap); determinism covers the pull; 195 in all.
- **Screenshots** (local, `gallery/p6/b3.5_*`): an ore pulled out of the wall, flying to you, eaten by the one chaser left with 2 bugs in the bar.

**Placed bugs mine, and the dust stream (step 3, second part, D063):** ruleset `b3.6`, as planned in next-bugs.md's seventh pass.
- A placed bug pulls the nearest seen ore (never loot) within 12 of its den, 4 a minute, and the cell turns to rock. It carries 8; full, it waits, its halo swelling.
- Pass within 4 tiles of one with ore and it flies into your pack, 10 a second, without stopping you; with your pack full, it waits.
- While a pull is under way, a thin trickle of dust in the material's colour flows from the cell that goes to the puller: to you half a second after you stop, to a placed bug whenever it's pulling.
- **Tests:** 7 new pull tests (a bug's nearest seen ore, ore only, the rate and the rock; it carries 8 then waits; the hand-over within 4 and not at 5; a full pack waits; walking past a full bug; b3.5's bugs only hover; `g.pulling` points at the next cell), and determinism places a bug mid-dive that mines; 202 in all.
- **Screenshots** (local, `gallery/p6/b3.6_*`): both streams at once, a full bug's swollen halo, a hand-over.

**The TODOs after playing b3.6 (D064):** ruleset `b3.7`, as planned in next-bugs.md's eighth pass.
- The first to target an ore keeps it: you and a bug never pull the same cell.
- The pack's first 4 slots are reserved for ore, loot, soft and hard stone; the last 2 are free, and a full reserved slot overflows into them.
- You leave home with 8 soft stone, topped up each time you bank.
- The taming count fills the bar's next free slot as a 4×4 grid, like a pack slot.
- A placed bug whose area has run out comes to you, hands its ore over and goes back into the bar, but only when a bar slot is wholly empty (no taming started in it); otherwise it stays.
- **Tests:** 7 new tests (the first target keeps its ore, both ways; reserved slots and overflow; 8 stone from home and the top-up; a new game's 8 with no empty dive logged; a bug coming back to the bar; none with taming started in the last free slot; a bug that never pulled stays, and one beyond the field waits at its den); determinism covers the reserve and the stone; 210 in all.
- **Screenshots** (local, `gallery/p6/b3.7_*`): the 8 stone on your back, a bug coming back, the bar with a bug and the taming half done.

Claude's calls in step 1, not discussed:
- Only the home cell counts the pack in, and only when there's something in it, so walking past home logs no empty dives.
- Home is a plain orange pod, 2 tiles wide, since you walk back to it now.
- A long press does nothing in b3 (no ring), and Numpad 5 is a tap only (stop).

## Feedback

- [2026-09-26 · b3.6](feedback/2026-09-26_lorinc_b3.6.md): the bug's dust stream swayed (fixed in the refreeze). The user's TODOs, built in b3.7 (D064):
  - you and a bug can target the same ore;
  - reserve one pack slot for loot and one for ore;
  - leave base with 8 stone;
  - show the taming progress the way a 4×4 pack slot fills up;
  - when a placed bug's area runs out of ore, it seeks you out, hands its ore over, and goes back into the bar.

## Conclusion → next

Open.
