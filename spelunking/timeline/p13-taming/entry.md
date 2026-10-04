---
id: p13
title: Taming
started: 2026-10-03
status: building
budget: 3d
from: p12
---

# p13 · Taming

p12 ended with a lifecycle and three pillars, and the plan to simulate the whole lifecycle at once. That plan was
dropped: many co-dependent, vaguely defined mechanics with little content, run together, give results nobody can trace
to a cause. The game is built one component at a time instead, and taming comes first: the engagement is the core
gameplay and the most critical element of the game. This entry designs it, researches its references, and then builds
a toy of the taming alone.

## Question

Can one taming engagement be as easy to start and as hard to master as Slay the Spire, as strategic and intriguing as
Sonny, and as free as Noita's wand building, without luck and without killing?

**Pass:** in a toy of the taming alone, played by hand, a first encounter makes sense within seconds, and later
encounters are won by reading the animal and combining the kit in ways that weren't written as pairs.

**Kill:** the encounters read as solved puzzles with one answer each, or the interactions turn into noise that can't
be read on screen.

## Assumptions

1. [?] Full information and no luck still leave enough depth: the variety comes from scouting, the kit and procedurally generated animals, not from a draw.
2. [?] Moves with several effects, on a shared visible state (the team, the animal, the cavern), make combinations nobody wrote as pairs, and stay readable turn by turn.
3. [?] One engagement makes one game: scouting as team setup plus an automatic run in the simulation doesn't feel like a second, lesser game.
4. [?] Routes into a tame from different pillars keep bait from becoming a grind, even with a food chain of two or more tiers.
5. [?] Watchable replays let the user check that the simulator and its bot test the right thing.

## Limitations

- [constraint ?] No luck in the engagement: every encounter must be solvable by construction.
- [constraint ?] Turn-based only; real-time engagements are an idea for meta-progression, not built.
- [cut] Scouting: the next component; the food chain and the colony are content and balancing on the b4 system (D177; D188 in p12).
- [cut] Levelling, team size and slots: knobs or left out until the taming toy needs them.
- [cut] The market part of stage 4 from p12: parked.

## Built

**The decisions so far** (design, no build yet):

| Decision | What it settles |
|---|---|
| D195 | Fight or flight depends on the animal's strength against the team's; strong pets hold out longer when attacked but scare animals away |
| D194 | All models are wrong, but some are useful; "when scared" is no longer an axis: an animal fights, flees or hides by its strongest stat |
| D193 | Animals live in a trait space: discrete behaviour axes (diet, when scared, social) and stats (size and strength, agility, intelligence, nerve); traits add up to behaviour and pet skills, how is open |
| D187 | The taming gauge: willingness 0–100% in three zones, made of motivations, each with its own zones, temperament and decay; actions act on each motivation; a motivation-driven animal, to test |
| D186 | Learning an animal, kept abstract: observation can fill the whole card, with gaps when time ran out; engagements add the numbers and fill the gaps; shown, not told; families share rules; late game, animals bend them |
| D185 | The animal's card: scouting fills it by observation, taming through engagement; failed attempts reveal what scouting can't; attempts cost consumables, some from earlier tiers, never punitively (supersedes D184) |
| D183 | Routes into a tame come from different pillars; taming without bait is as hard, in another pillar's shape |
| D182 | Taming is the only engagement; scouting is team setup plus an automatic run; failure is the animal getting away and bait consumed |
| D181 | Turn-based, no time pressure, all cards on the table, the player acts every turn |
| D180 | The engagement is the core gameplay; the bar is Slay the Spire, Sonny and Noita's wand building |
| D179 | Taming plays like a deck-builder's combat with simpler UX: cooldowns instead of a deck, no luck, telegraphs, moves with several effects |
| D178 | Every simulated run can be watched: one rules core, replays from seed and actions, reports that link to runs |
| D177 | One component at a time: taming, the food chain, scouting, the colony |

**The research** ([guides/game-design](../../../guides/game-design/README.md)): what makes the references' engagements
work, and where they fail.

- [11 · Slay the Spire](../../../guides/game-design/11-slay-the-spire-engagement.md): intents clicked only with numbers; full information on the opponent's side is not shallow.
- [12 · Sonny](../../../guides/game-design/12-sonny-engagement.md): each boss is one exaggerated rule, answered from the existing kit, with more than one weakness.
- [13 · Noita's wand building](../../../guides/game-design/13-noita-wand-building.md): freedom runs through one shared, visible world state.
- [14 · Super Auto Pets](../../../guides/game-design/14-super-auto-pets-synergy.md): the cautionary case: synergy decided far from its result.
- [15 · Into the Breach](../../../guides/game-design/15-into-the-breach-combat.md): full telegraphs need an undodgeable stake; pushing, not killing, can be the core.

**Where it stands:** the design is in [build-principles](../../../concepts/shape-exploration/build-principles.md) →
*Pillars* and *Building it: one component at a time*. Open: whether the motivation-driven animal is fun and simple enough, and how the animal's state is shown.

## Feedback

No play sessions yet: this is design work.

## Conclusion → next

Not concluded. Next: a toy of the taming alone, played by hand, to check whether the motivation-driven animal is fun and simple enough.
