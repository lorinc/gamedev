# 09 · Repetition with variety

Scope: why a game needs both a repeated core and varied content, and in what order to build them. General, for any
game.

**Source.** "How (and Why) to Design for 'Repetition With Variety'", Indie Game Clinic,
<https://www.youtube.com/watch?v=Jqh7SVpMR1o>, a video essay. The transcript was pasted by the user on 2026-10-01 and
has no timestamps. It is one educator's opinion, argued from examples (Halo, Vampire Survivors, Dream Daddy,
WarioWare); nothing in it is measured. The "70/30 or 90/10" split is his illustration, not a finding. Everything here
is from the transcript unless marked.

## The claims

### Two forces

- **Repetition** makes the game a game. The more repetitive it is, the easier to learn, and the player must be able
  to operate the rules consistently or it is button bashing. It also gives familiarity and comfort (a "comfort game"
  is one whose repeated parts put you in a particular state).
- **Variation** gives surprise and delight, and mechanically it stops players resting on their laurels.
- **Variation must vary the core skill.** If difficulty only rises by adding enemy health or cutting the time limit,
  the player is tested a bit more but never has to think differently. Levels with different things in them and
  enemies that actually do different things keep a game from going stale.
- **Halo.** "30 seconds of fun, over and over" was a misquote. The designer's full quote continued: those 30 seconds
  in different environments, weapons, vehicles and enemy combinations, sometimes enemies fighting each other. The
  sound bite kept the repetition and dropped the variety.

### Loops are stacked, not one circle

- A loop is a repeating string of behaviour: anticipate the challenge, do it, get the reward. Loops nest (hit an
  enemy, clear a room, clear a dungeon, unlock a region) and run at once, like gears.
- **Draw them from the side**, as a music editor does: a timeline with a 4-bar drum loop, a 16-bar chord loop, each
  starting and stopping at its own time. Seen this way, nesting is simple, and the player's experience is a linear
  line over time.
- Variation arises for free from several loops of different lengths going in and out of step, like layers in a song.
- A song is the model: repetition, repetition, something different, repetition. Games are performance over time (his
  other example: attack-sustain-decay in *Game Feel* comes from synthesizer design).

### Two failure extremes

- **All repetition:** the same thing with no development or surprise; bored. Flappy Bird is the one-loop game.
- **All variation:** a mish-mash that doesn't cohere, built before a solid core exists, so the player can't learn it.
  WarioWare is the deliberate exception: incoherence is the joke, in a party game.
- The target is repetition with variation, balanced differently per game.
- **Flow.** Too easy is boredom, too hard is anxiety. Total repetition keeps you in boredom; constant change keeps you
  in anxiety. But the ideal line is wobbly, not flat in the middle: sometimes slightly too hard, sometimes downtime.
  Balancing talks usually don't aim for smooth.

### Be generous with variety

- His claim for small indie games: among similar games in a genre, people usually pick the one with the most content
  variety (levels, unlockables, cards that do different things). Not a measurement.
- Spend the time where fans of *that genre* care. Hats matter little to a grand-strategy player.
- If the genre normally has 100 enemy types and you ship 10, you need a very good reason or another hook. Players
  bring their genre's expectations; "half the price, half the content" doesn't match how people decide to buy.
- **Examples.** Vampire Survivors' repeated parts: movement, attack patterns, pickups, the visible-reward grind. Its
  varied parts: loadouts that make you move differently, unlocks hidden in progression, levels with gimmicks and
  secrets. He says many clones copy only the first list. Dream Daddy: a fixed format (meet, date, debrief with a
  non-romantic character) plus one-off mini-games and plot twists.

### Order of work

1. **Mechanical prototype.** One simple repeated unit of fun. Note variation ideas, don't build them. It must be
   tested with a few people, not only checked for feasibility ("can I make a character climb?"). He says many games
   he's sent skip this and jump to loads of levels or guns while the controls are wrong, which two or three early
   playtesters would have caught.
2. **Variety experiments.** A separate round, a few weeks, deliberately messy and over-scoped: try every direction for
   where variety comes from, and what tools are needed to make the content (level editors, data handling). Nothing is
   locked in yet.
3. **Full production.** Now you have the repeated core, the sources of variety, and the tools. Decide what the story
   or other variety is *for* (a reward for finishing an area?) or whether you need it. No Steam page, no announced
   date, before this point; at most a little pre-marketing to find playtesters.
- His observation from running a developer Discord, mentoring and teaching: projects with a clear "what is repeated,
  what varies" finish fast; the ones with no clear vision drift.
- **Coherence** is his one universal quality metric: a clear vision where the parts relate, even in games he doesn't
  like. Scope should follow what the game needs, not just "what fits in 3 months at 4 hours a week", and the amount
  of variety is a big part of scope, so decide it early.

## Possible uses **[C]**

- *Overlaps with earlier guides:* the prototype-first order is [05](05-process-and-scope.md) and the "don't make 10
  weapons first" point in [08](08-engagement-vs-appeal.md); nested loops are [06](06-gameplay-loops.md); pacing and
  novelty are [07](07-keeping-players-engaged.md); authored-variety-on-a-fixed-skeleton is
  [03](03-levels-onboarding-difficulty.md). The new parts are the two-stage prototype (core, then a separate
  variety round with its tools), "variety must vary the core skill, not the numbers", the wobbly flow line, and
  genre-expectation as a measure of how much variety is enough.
- The "numbers only" warning is worth checking any incremental or idle design against: when a new upgrade or area
  arrives, does the player do something differently, or just do the same thing at a bigger number? Not from the video;
  the genre is the user's to judge (see the user's note on respecting idle games).
- The stacked-loop picture gives a cheap check on a design: list each loop's length, and see whether they start and
  stop out of step.
- Not from the video: how much variety is "enough" for the portal audience is a question for a web test, not for this
  guide.
