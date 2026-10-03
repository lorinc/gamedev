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

## Open questions

1. **What should the simulator tell first?** The first thing the user couldn't judge by playing it alone.
2. **How does a player who has mastered the game show it,** without beating anyone or anything? In Slay the Spire it
   is winning at higher Ascension.
3. **"Like this" (answered in part):** the user's follow-up points to the principle (accessible, never boring,
   through systems), not to Slay the Spire's structure of runs, a deck, a map and fights. Not confirmed outright.
