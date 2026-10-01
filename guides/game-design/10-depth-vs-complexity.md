# 10 · Depth versus complexity

Scope: two terms for judging a design, and one rule of thumb for growing it. General, for any game.

**Source.** "Depth Vs Complexity - Game Design Theory", Tim Ruswick (the user's spelling; the transcript's closing
line says "Tim Renwick", and the auto-captions get other words wrong), <https://www.youtube.com/watch?v=VhCrO43wn88>,
first in his game-design-theory series. The transcript was pasted by the user on 2026-10-01 and has no timestamps. It
is one indie developer's opinion, argued from his own games (a stealth-hacking roguelike, about 900 hours in, and a
magnet platformer) and from chess and shooters; nothing in it is measured. Everything here is from the transcript
unless marked.

## The claims

### The two definitions

- **Complexity** = the number of systems or rule sets in the game. He separates complexity under the hood (code, data,
  procedural systems) from complexity the player has to learn.
- **Depth** = the number of *viable* options the player has at any one time. Options alone are not depth: if one gun,
  card or move is always best, the rest are not viable and the depth is zero. A "meta" is what that looks like in
  multiplayer games: a top tier, and everything under it stops counting.
- His fix in shooters: weapons that are good at different ranges and situations, so no single one dominates.

### Depth from simple rules, and from many

- **Chess** is his model: almost no complexity (a few piece moves, players alternate), near-endless depth, a different
  game every time, because each piece has several viable moves and the players react to each other.
- Depth can also come from complexity. The easiest way to add depth *is* to add a system: add grenades to a shooter and
  every fight gets a new question (save it? are the enemies grouped? is there one big target?). A well-made item
  carries its own depth, which is why grenades appear in so many games.
- The goal he sets himself: **the highest depth-to-complexity ratio**, the most viable options for the fewest systems.
  Hard to do, because programmers like building systems, and it is tempting to read "more systems" as "better game".

### What complexity costs

- Adding systems as a quick way to make decisions more interesting works, like "an egg in the radiator": fast, and it
  can wreck things later. (His joke, not a finding.)
- **Code cost**, and **design cost**: it disjoints the design, makes the game harder to learn, and narrows the audience
  to people who will spend half an hour to an hour working out what is going on. He got lucky: roguelike players
  expect that. Steam buyers refund, and on mobile "you've got ten seconds".
- **His own story:** in the stealth-hacking game he kept adding abilities, procedural generation and items, believing the
  fun came from the things. The game got very complex; he was right that it added depth, and wrong not to count the
  complexity bill. The procedural and item systems were each rebuilt several times.
- **A system added on top is often a band-aid for a problem in the core.**

### The alternative: add underneath

- In the magnet platformer the player pulls a metal egg around with a magnet. He tried collectibles as a new system on
  top. Better: make the coins metal, so they react to the magnet like everything else. The one tool now has two uses,
  with no new rule to learn.
- The habit: before adding a system, ask whether the existing ones can give the player an extra viable option.
- Target he states for himself: a strategy game you can hand to someone without a tutorial, but deep enough to keep
  an experienced player. His examples of the wrong side: games he wants to play but not to learn (Stellaris, EVE).

## Possible uses **[C]**

- *Overlaps with earlier guides:* "make one verb do many jobs" is [01](01-foundations.md) TL;DR 3 and §2.3;
  "subtract" is 01 §2.11; "a decision only counts if the right answer depends on the situation" (01 §2.5, Meier) is
  the same idea as "viable"; new patterns from interactions between existing systems rather than new content is 01's
  note on Koster (§2.4); systemic design as few rules that multiply is 01 §2.9; the complexity staircase and
  "players learn components" are [03](03-levels-onboarding-difficulty.md); the ten-second mobile test is
  [04](04-motivation-and-audience.md) and [08](08-engagement-vs-appeal.md). The new parts are the two definitions,
  the depth-to-complexity ratio as a number-free review question, and "add underneath, not on top".
- **A check for an incremental or idle design (user's own concern; the video does not discuss idle games).** When a
  build adds a system, ask: does it give an existing thing a second job, or add a new thing to learn? And does it
  add a viable option, or a new best move? The first answer is a cheap review of each b4.N entry, not a verdict on the
  thread. From the build titles in the timeline, both kinds appear (for example worms turning fruit into ore, and
  loot that upgrades lizards, reuse things already there; gas, moths, hives and slime are new systems, and the hives
  were cut again at b4.75), so the pattern is mixed, not one-way.
- **Where the video stops short.** His audience and genre are strategy games and roguelikes. Whether "complexity to the
  player" costs the same in an idle game, where systems unlock slowly and the player learns one at a time, is the
  user's to judge; the cost he names (onboarding, ten seconds on mobile) depends on how fast the player meets the
  systems, not only on how many exist. Not from the video.
- Under-the-hood complexity and player-facing complexity are separate costs. A hidden system that the player never has
  to learn costs code and testing but not onboarding; the user's rule that meaningful effects must be obvious (a
  project note, not the video) means a system that matters is also one the player must learn.

## The user's leanings (2026-10-01, not from the video, not decided)

Said while discussing the video; recorded as leanings, to be weighed when a build needs them.

- **Goldilocks cycle.** A game is like any life experience: we enjoy it in the zone of difficulty that is just hard
  enough to feel real competence without too much stress. The designer's job is to engineer such wins, then give the
  player time to rest before they want it again, with better skills, tools or knowledge. Already in the library in
  pieces: the flow channel and sawtooth ([03](03-levels-onboarding-difficulty.md)), pacing and challenge
  ([07](07-keeping-players-engaged.md)), and Koster's pattern-learning (01 §2.4). It fits the wobbly flow line in [09](09-repetition-and-variety.md): the
  goldilocks *zone* has width, and the wobble (slightly too hard now, downtime later) happens inside it.
- **The count of viable options per situation is a dial for that zone.** One viable option tests execution; a few make
  a decision; too many freeze the player. "Engineering" the count per situation is the user's extension of the
  video's shotgun and sniper examples, not something he says.
- **Complexity plateaus; depth keeps growing inside it.** Systems are added early and then capped. After that, growth
  is a viable answer getting an upgrade while the number of viable answers stays the same, not more answers.
- **An upgrade must change the play.** The new toy either breaks through a wall, or feels like a meaningful step
  toward an imminent breakthrough. A bigger number alone is a paycheck ([04](04-motivation-and-audience.md); "numbers
  only" in 09).
- **In a simulation, everything is a number, and the tipping points are where it gets interesting:** a breakthrough is
  when some numbers overwhelm others, or trigger a feedback loop (01 §2.7). So an upgrade can be judged by which
  tipping point it moves the player toward or through.
