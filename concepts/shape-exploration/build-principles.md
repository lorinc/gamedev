# What to build: the principle and the tool

Supporting document for the [shape exploration](README.md). Written 2026-10-03, at the user's request: "save these
ideas, these are relevant and important at this 'what to build' stage". Quotes are the user's, with spelling lightly
fixed. Points marked **Claude** are Claude's additions; nothing here is a design decision unless it says so.

## The principle: accessible, and never boring, through systems

The user's starting point was a summary of why Slay the Spire is easy to play and impossible to master, with: "I
really would like to build the game like this."

The user's reading of why it sold:

> "Why I think Slay the Spire was a financial success is that it is both accessible, but never gets boring. And it
> does it through system, not by content, which makes the dev effort valuable."

**Why it is easy to play** (from the summary the user pasted), and what each point would be in this game (**Claude**):

| Slay the Spire | In this game |
|---|---|
| Simple verbs: play a card to attack or block | "Casual during play" ([brief.md](brief.md)) |
| Every enemy's intent is shown before the player acts | The user's rule that consequences must be painfully obvious: the simulation shows what it is about to do |
| No time limit | The cerebral side of the map, and "peaceful" |

**Why it is hard to master**, against this game's audience (Discovery 30%, Strategy 30%, Power 20%, Story 10%,
Challenge 10%; see [README.md](README.md)) (**Claude**):

| Slay the Spire | Motivation | Fit |
|---|---|---|
| Random rewards and layouts that the player must adapt to | Discovery and Strategy | the core of this audience (60%) |
| Planning several turns ahead | Strategy | fits |
| Ascension: higher levels punish small mistakes | Challenge | only 10%, and no killing: it can only be an optional dial on top (the pool's anchor "difficulty as a dial", [03-consolidate.md](03-consolidate.md)) |

So the depth would have to come from reading the system and adapting to the random draw, not from harsh losses.

**Claude's refinement: "content that combines", more than "system instead of content".** Slay the Spire has a lot of
content (around 75 cards per character, four characters, well over a hundred relics, three acts of enemies). What
the system does is make content multiply instead of add: a new card combines with every other card and relic, so it
adds many new situations. In a content-driven game each new area adds one area. For dev effort the lesson is a small
number of pieces, each of which changes how the others behave.

**The reference games split along this line** (**Claude**, [reference-games.md](reference-games.md)):

- **Combining, replayable:** Stacklands, Brotato, Super Auto Pets, 20 Minutes Till Dawn, Forager.
- **Played through about once:** A Short Hike, SUMMERHOUSE, Minami Lane. They succeeded too, on mood and a short,
  polished experience: a different use of dev time.

The toy, an ecosystem simulation, is already on the combining side: its parts change each other.

**The test for every piece** (**Claude**, from guide
[09](../../guides/game-design/09-repetition-and-variety.md)): does it change what the player decides? If a new
species makes the cave look different but the player does the same thing, it reads as more content, not more depth.

## The tool: a system simulator and optimizer

> "I plan to build a system optimizer / simulator, that makes the balancing and the complexity of random permutations
> manageable."

Combinations that multiply can't be playtested by hand. A simulator can play thousands of random runs. It suits the
user's rule of simple local models (few discrete states per patch): a few states per patch is cheap to
simulate in bulk. Its settings become knobs, searched the way the user already tunes the generators.

Slay the Spire's developers balanced with data from real players in early access (card pick and win rates).
A simulator gives a similar view before there are players (**Claude**).

**What it can see** (**Claude**):

- **Dead and dominant pieces:** a species, card or upgrade that never matters, or one that wins regardless.
- **Bad seeds:** random starts that are unwinnable or trivially easy, and how wide the spread between seeds is.
- **Runaway and collapse:** ecosystems that tip into one state whatever the player does.
- **Whether decisions matter:** a sensible bot and a random bot on the same seeds. If their outcomes are close, the
  player's choices don't change much. This is the measurable form of the test above.

**What it can't see** (**Claude**): whether it is fun or readable. A bot doesn't mind a hidden consequence or a flat
turn. Those still need the user, and players.

**What its questions depend on** (**Claude**): the audience. "Never boring" for a Discovery-and-Strategy player is a
different number than for a Challenge player.

## Expectations of a good game (agreed 2026-10-03)

The user: "We know enough already to describe some expectations of a good game." The user drafted the list; Claude
objected to three points, sharpened four and added two; the user agreed to all of it. This is the agreed version. The
user's own wording is kept where it did not change.

**Tension–release cadence**

- Each win is progress.
- Release is not rest but a very different kind of challenge: switching to another pillar.
- There must also be breathers, and even places of tranquility: intensity drops altogether. Release and breather are
  two different things, and the game needs both.
- The pillars must be distinct and distant, or the cadence doesn't work (user: "I need distinct, distant pillars for
  the tension cadence to work"). This matches the main finding in [findings.md](findings.md), the swing between
  pillars.

**Gameplay loops**

- The core must be simple, and the fun toy feeling must be reachable within seconds of loading the game (user: "the
  core should be possible to reach the fun toy feeling in seconds of loading the game"). Not "fast" in the sense of
  quick hands: for this audience the core is a small decision, and speed, if any, lives in another loop.
- The core must give an "I've got this" feeling.
- Supporting loops add progress and structure.
- Side loops add release and relatedness.
- The loops must average up to the audience's motivation profile, **and** every large share of the profile must have
  a loop near it: two loops can average to the right spot while serving none of its motivations.
- Picking the game up again must not be overwhelming.

**Mechanics depth**

- Few rules, infinite combinations, through a dense interaction graph between systems, **with every interaction
  visible.** A dense graph produces hidden consequences by nature; readability is what keeps the depth accessible.
- **Readability:** the system shows what it is about to do before the player acts (Slay the Spire's enemy intents;
  the user's rule that consequences must be painfully obvious).

**Difficulty**

- Input randomness is fun; output randomness is frustrating.
- Failures must be near misses and actionable lessons.
- Lessons carry over to the next attempt; that is what mastery is.
- **The player chooses the cost of failure and when to face the next challenge;** the game does not adjust it
  silently, which would be a hidden consequence. The user: "I love games where you choose when to face the next
  challenge, and you are under no constant pressure while preparing." (Slay the Spire's Ascension; the pool's
  "difficulty as a dial".)

**Learning**

- Teach through directed experience, not abstract instructions.
- There is no learning under stress, so learning happens in the release and the breathers: the tension–release
  cadence is also the teaching cadence.
- Every action gets an immediate signal, and every delayed consequence can be traced back to its cause. (The draft
  said "the only useful feedback is the immediate"; for a Discovery-and-Strategy audience delayed consequences are
  where strategy comes from, as long as they are traceable.)
- New rules arrive one at a time, after the previous one is understood.

## A strong candidate shape: the short run that keeps only knowledge (2026-10-03, not chosen)

The user, from "picking the game up again must not be overwhelming":

> "This points towards a very specific game shape: a short run, where complexity does not carry over, only
> knowledge, like Noita, or Super Auto Pets. Magicraft is borderline, because you unlock mechanics, but they can be
> ignored. What can not be ignored in Magicraft is the unlocked spells / trinkets in your random pool, that WILL make
> subsequent runs more complex, even if you forgot a lot about the game. That's an antipattern."

**Status:** "just a strong candidate". Not chosen; the expectations above still say "the next attempt".

**The antipattern:** unlocks that grow the random pool. Unlocked mechanics a player can ignore cost a returning player
nothing; unlocked items that appear in every draw cost them every run.

Claude's refinements:

- **It is a matter of degree.** Slay the Spire also unlocks cards into the pool, but few, and within the first hours,
  while the player is still active. The antipattern bites when the pool keeps growing after the player has stopped
  tracking it.
- **The variant that escapes it: the player curates the pool.** Vampire Survivors added a "seal" that removes items
  from the random pool. As a rule: nothing enters the random pool without the player's say.
- **Power must live inside the run.** The audience has 20% Power, which usually comes from progression across runs.
  With only knowledge kept, each run needs a satisfying power curve of its own (the team in Super Auto Pets, the build
  in Brotato).
- **On the pool:** this is shape 10a ("Run: nothing kept", toward Challenge) with the knowledge loop, 26 (near
  Discovery), as its pair. For a Discovery-and-Strategy audience, what carries over should be knowledge of the
  ecosystem's rules rather than execution skill, which pulls the shape toward 26.

## Open questions

1. **What should the simulator tell first?** The first thing the user couldn't judge by playing it alone.
2. **How does a player who has mastered the game show it,** without beating anyone or anything? In Slay the Spire it
   is winning at higher Ascension.
3. **"Like this" (answered in part):** the user's follow-up points to the principle (accessible, never boring,
   through systems), not to Slay the Spire's structure of runs, a deck, a map and fights. A run structure is not
   chosen: the expectations below say "the next attempt" (user, 2026-10-03).
