# Game design library: index

Five guides researched in parallel on 2026-09-24, starting from GMTK. Each has a TL;DR, principles in depth with an "apply to spelunking" note, an overengineering-traps section, and a source list ranked by value per hour.

| # | Guide | Answers |
|---|---|---|
| 01 | [Foundations](01-foundations.md) | What makes a game work: verbs, decisions, loops, randomness, systemic vs. authored |
| 02 | [Game feel](02-game-feel.md) | How to make dig and walk feel good cheaply, and browser input pitfalls |
| 03 | [Levels, onboarding, difficulty](03-levels-onboarding-difficulty.md) | How to teach without text, how much procgen to build, how to pace a dive |
| 04 | [Motivation and audience](04-motivation-and-audience.md) | What holds portal players, the portals' own numbers, social play without text |
| 05 | [Process and scope](05-process-and-scope.md) | How to find the fun, finish, and not overengineer. Has a 4-week cycle and tripwires |

---

## Where all five agree

The guides were written independently, and they reach the same conclusions:

1. **The verb comes first.** Nothing else matters until swipe and dig are fun as coloured squares (01 §2.2, 02 §2.11, 05 §2.2).
2. **Subtract.** The concept doc's "Month One" list is a year of work. b1–b3, or even b1 + b2, is already a complete small game (01 §2.11, 04 §4, 05 §2.10).
3. **Depth is the difficulty setting.** The player chooses the risk by diving deeper. Don't add a difficulty menu or a hidden rubber band (03 §2.10, 04 §2.2).
4. **The first minute decides everything, and the first session is the game.** Portal day-1 retention is 10–15%, so most players never come back (04 §3, 05 §2.7).
5. **Teach through the world, and do it safely.** Force each first encounter, keep threats away while teaching, no text (03 §2.1–2.3, 04 §2.6).
6. **Keep glow as one universal rule.** Everything that glows lights the way and attracts bugs, with no exceptions (01 §2.3, §2.9).
7. **Cosmetics never touch the sim.** Juice reads sim events and never writes sim state. Hitstop pauses the accumulator, so determinism holds (02 §2.2, §2.6).

## Tensions between guides, resolved

| Tension | Resolution |
|---|---|
| 03 proposes new generator work (a 500-seed batch, stamped chunks, flood-fill reachability). 05 says freeze v3 until a playtest asks for more. | **05 wins for now.** The one exception is the *stops per 100 tiles* metric. It needs only the b1 walker, which b1 builds anyway, plus a loop over seeds. It answers a b1 question: is a stop caused by bad controls or by noisy terrain? Stamps and reachability wait until a b1 or b2 playtest asks for them. |
| 02's juice checklist starts with touch and swipe fixes. 05 says b1.1 should be keyboard only. | Order by bundle: **b1.1** keyboard, juice off, tween between tiles, Tweakpane with presets (02 items 3–4). **b1.2** swipes, bringing in 02 items 1, 2 and 5. The juice pass comes after the juice-off verdict. |
| 04 wants the first 10 minutes to be a complete arc: dive, install, base humming. 05's option (b) ships b1 + b2 with just a score. | This depends on the flagship decision below. For (b), the arc is dive → loot → recall → best depth, with no base. |
| Tool-building vs. research as procrastination. | 05's tripwire applies to this library as well: during a build cycle, read at most about 1 hour of design theory per week. |

## Corrections made while checking

- **Poki numbers (checked against Poki's own docs pages):**
  - Player Fit Test: 500 players. Healthy means over 3 minutes average playtime and at least 25% of plays over 3 minutes. Watching 10 playtest recordings unlocks it.
  - Recommended before final review: 65%+ conversion to play and 5+ minutes average (10+ for management and sim games).
  - Platform average: about 70% conversion and 6+ minutes.
  - Guides 04 and 05 agree on these.
- **GMTK *Half-Life 2's Invisible Tutorial* exists.** Guide 03 said it didn't, and that note is now fixed.
- **The Mega Man X teaching breakdown is Egoraptor's "Sequelitis",** not a GMTK video.
- **GMTK renamed "How To Steal Like a Game Designer"** to "How To Think Like A Game Designer" (same video ID).

## Core reading list (~2.5 h, in this order)

Everything else in the guides is for when the topic comes up.

1. Derek Yu, *Finishing a Game*, 10 min ([05](05-process-and-scope.md))
2. Derek Yu, *Death Loops*, 15 min ([05](05-process-and-scope.md))
3. Gabler et al., *How to Prototype a Game in Under 7 Days*, 25 min ([05](05-process-and-scope.md))
4. GMTK, *Nintendo – Putting Play First*, 12 min ([01](01-foundations.md))
5. Jonasson & Purho, *Juice It or Lose It*, 15 min ([02](02-game-feel.md))
6. Maddy Thorson, Celeste game-feel thread, 5 min ([02](02-game-feel.md))
7. GMTK, *The Two Types of Random*, 19 min ([01](01-foundations.md))
8. Soren Johnson, *Water Finds a Crack*, 10 min ([01](01-foundations.md))
9. Kate Compton, *So you want to build a generator*, 20 min ([03](03-levels-onboarding-difficulty.md))
10. Poki developer docs: testing, player fit test, easy access. 20 min ([04](04-motivation-and-audience.md))

## Open decision (for the user)

**Flagship or monthly?** Guides 01, 04 and 05 each flag this on their own. The Spelunking Base concept is a multi-month game, but the goal is one game a month. Pick one:

- **(a)** Spelunking Base is the flagship. Accept a multi-month timeline, and the monthly practice pauses or runs as small spin-offs.
- **(b)** The monthly practice wins. Month 1 ships the smallest game inside Spelunking Base (roughly b1 + b2: dig, loot, recall, greed vs. darkness), and the rest becomes later months or never happens.

The choice decides what b1 needs to prove and what the devops round (CI, portal SDK, deploys) has to support.
