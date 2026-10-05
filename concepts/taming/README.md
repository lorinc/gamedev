# Taming

Working folder for p13 · Taming ([the entry](../../spelunking/timeline/p13-taming/entry.md)). The design it builds
on is in [build-principles.md](../shape-exploration/build-principles.md) → *Pillars*.

- [gauge-model.html](gauge-model.html): what each animal dimension (size, agility, intelligence, diet) does to each
  motivation's gauge (hunger, comfort, curiosity): share, default, inertia (calm ↔ jumpy). The data is in
  [gauge-model.js](gauge-model.js); every cell is a draft until it has been gone through with the user, cell by cell.
  Since v10.4 it also has the motivations acting on each other, one extreme per sample animal, and scripted
  encounters turn by turn; its top box says what changed and why.

## What p13 has to prove (agreed)

The taming encounter is the game's base: what the player does over and over
([build-principles.md](../shape-exploration/build-principles.md) → *The base is found, not chosen*). So:

- **Fun once, with a few animals,** before the trait space, families or a roster multiply it. The sample animals stay
  a handful until a version plays well.
- **The animal's tells are part of the base.** Consequences must be painfully obvious, and here that means an
  animal's motivations show in how it looks and moves. That readability is core feedback, not mood, so it is in
  scope early (Slay the Spire's intents took about ten versions,
  [guide 11](../../guides/game-design/11-slay-the-spire-engagement.md)).
- **Open: playing actions or building the set** (build-principles.md, open question 6).

## What the deck-building references say

From [guide 18](../../guides/game-design/18-deck-building-roguelikes.md) (one player's opinion, over 30 games):

- Without physics, the same effect plays the same in every game; a twist is what sets a turn-based ability game apart,
  and abilities designed around the twist feel new even when familiar (Arcanium's Cleave).
- Simple commons that combine (Sword Boomerang) and a few strong, situational rares (Grand Finale). A rare equally
  strong in every build is boring (Judgment). No rarity makes builds hard to steer (Wildfrost).
- Fun over balance: the best feeling is winning easily through a combination the player chose (Balatro).
- Controlled randomness: pick one of three, every outcome usable (Astrea), random effects the player can steer.
- Players stare at the encounter screen for minutes; it must not feel like staring at numbers.

How these map onto taming is unverified inference, listed in the guide's last section.

## What v10.4's encounters show (2026-10-05)

- **The animals now behave differently.** The deer bolts if you only wait, is tamed by turn 4 if you calm it first,
  and stalls at 53 on bait alone. The bear's hunger stalls just below its high friendly line, and only the mixed play
  wins (turn 8). A repeated trick visibly wears out.
- **Jumpy animals are the easiest to tame, which is backwards.** The flea and the crow are tamed on turn 1:
  jumpiness only multiplies how far actions push, and every demo action pushes up. Nothing in an encounter pushes a
  needle down (no startles, no wrong moves, no side effects that cost another motivation).
- **The small animals' friendly line (60) is too low,** which makes it worse.

**Next: pressure downward,** so jumpiness is a risk again, not a free win. Two ways, both already in the design:
actions with side effects (Sonny's two-effect moves, like the snare that frightens), and animal moves that lower its
own needles (the motivation-driven animal, D187). Then tune the lines.
