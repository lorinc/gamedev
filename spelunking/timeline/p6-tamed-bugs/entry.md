---
id: p6
title: Tamed Bugs (b3)
started: 2026-09-25
status: building
budget: 3d
from: p5
dev: b3.html
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
2. Wild bugs (D056).
3. Tamed bugs (D056).
3b. The friendly area (D057).
4. The build check, and b3.1 frozen.

**The probe and the walk home (step 1, D055, D058):** ruleset `b3.1` = b2.1 with ↓ on a floor → `probeBelow`, ↑ into rock → `probeAbove`, and `teleport: false`.
- **The probe:** its rings spread from the block under you (↓) or the block above you (↑), with b2.1's reach: light + 2 for a flick, up to light + 4 held. The ceiling isn't mined any more. Ring 1 holds the centre cell too.
- **No teleport:** the command does nothing, and a deep fall just lands (stop `fell`), pack and all.
- **Home:** stepping onto the home cell with anything in the pack counts it in and shows the dive log; the pack empties and the light goes back to base.
- **Tests:** 3 probe tests and 5 walk-home tests on ASCII maps; b2.1 still probes around you and teleports after a deep fall.

Claude's calls, not discussed:
- Only the home cell counts the pack in, and only when there's something in it, so walking past home logs no empty dives.
- Home is a plain orange pod, 2 tiles wide, since you walk back to it now.
- A long press does nothing in b3 (no ring), and Numpad 5 is a tap only (stop).

## Feedback

None yet.

## Conclusion → next

Open.
