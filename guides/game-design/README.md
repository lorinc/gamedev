# Game design library: index

Five guides researched in parallel on 2026-09-24 (five more, on loops, engagement, appeal, repetition with variety, and depth versus complexity, were added 2026-09-30 and 2026-10-01 from pasted transcripts; five more, on the engagement references Slay the Spire, Sonny, Noita, Super Auto Pets and Into the Breach, were researched in parallel on 2026-10-04, and one on Monster Sanctuary's pet teams the same day; one more, on genre, mode and mood, from a pasted transcript on 2026-10-05, one on deck-building roguelikes the same day, and one on Rain World's procedural animation the same day), starting from GMTK. Each has a TL;DR, principles in depth with an "apply to spelunking" note, an overengineering-traps section, and a source list ranked by value per hour.

| # | Guide | Answers |
|---|---|---|
| 01 | [Foundations](01-foundations.md) | What makes a game work: verbs, decisions, loops, randomness, systemic vs. authored |
| 02 | [Game feel](02-game-feel.md) | How to make dig and walk feel good cheaply, and browser input pitfalls |
| 03 | [Levels, onboarding, difficulty](03-levels-onboarding-difficulty.md) | How to teach without text, how much procgen to build, how to pace a dive |
| 04 | [Motivation and audience](04-motivation-and-audience.md) | What holds portal players, the portals' own numbers, social play without text |
| 05 | [Process and scope](05-process-and-scope.md) | How to find the fun, finish, and not overengineer. Has a 4-week cycle and tripwires |
| 06 | [Gameplay loops](06-gameplay-loops.md) | Core, medium and meta loops, and why one medium loop with a forcing limit keeps players returning; built from a video transcript, added later than the other five (opinion, not measured) |
| 07 | [Keeping players engaged](07-keeping-players-engaged.md) | GMTK's factors for why players finish a game or drop it: pacing, novelty, anticipation, goals, challenge; from a pasted transcript (one designer's opinion) |
| 08 | [Engagement versus appeal](08-engagement-vs-appeal.md) | Two separate jobs, making people look and making them stay: toys vs games, interesting decisions, central fantasy, testing appeal early; from a pasted transcript (one educator's opinion, much overlaps 01, 02, 05, 06) |
| 09 | [Repetition with variety](09-repetition-and-variety.md) | Why a repeated core needs varied content, stacked loops, the wobbly flow line, and the order: core prototype, then a separate variety round, then production; from a pasted transcript (one educator's opinion, overlaps 03, 05, 06, 07, 08) |
| 10 | [Depth versus complexity](10-depth-vs-complexity.md) | Depth = viable options, complexity = systems; aim for the most depth per system, and add depth underneath (a second use for an existing thing) rather than on top; from a pasted transcript (one indie developer's opinion, much overlaps 01 and 03) |
| 11 | [Slay the Spire: combat and card design](11-slay-the-spire-engagement.md) | Slay the Spire's turn (3 energy, 5 cards, hand discarded), why it is easy to start (open enemy intents with exact numbers, decks built one pick at a time, simple cards that combine) and hard to master (planning per turn, combat and run; skipping cards; enemies that punish single strategies; Ascension), how set-up and pay-off cards combine, how intents took about ten versions (random moves, flavour text and bare icons all failed), and where it fails (dead draws, solved strategies, infinites, misleading metrics); from Mega Crit's GDC 2019 talk, Yano's 2026 AIAS interview and GMTK, web research 2026-10-04 |
| 12 | [Sonny: combat and boss design](12-sonny-engagement.md) | How Sonny and Sonny 2 (Krin, Flash, 2007 and 2008) fight: health and focus, cooldowns, an 8-slot ability ring, AI allies; what an effect can reach (health, focus, the turn, cooldowns, buffs, multipliers, the sign of heal and damage, friend or foe), bosses each built around one exaggerated rule with more than one answer (Galiant, Herregods, Baron Brixius, Hydra, Clemons), telegraphs that show state not intent, and where it fails (stun-locks, runaway multipliers, AI allies inside reversals, luck, long fights); checks the pattern in idea-taming-and-breach.md; from the Sonny Wiki, Krin's 2008 and 2016 interviews and Jay is Games, web research 2026-10-04 |
| 13 | [Noita's wand building](13-noita-wand-building.md) | How Noita's wands and spells work (wand stats as deck rules, modifiers, multicasts, triggers, spells that copy spells), what a spell's effects reach (spells, wand, materials, enemies, the caster), how readability is kept (one visible material substrate, stain icons, safe-room editing) and where it turns to noise (an evaluation tree no screen shows, unfair self-deaths, payoffs whose setup is too costly); from Nolla's talks and the wiki, web research 2026-10-04 |
| 14 | [Super Auto Pets: pet synergy](14-super-auto-pets-synergy.md) | How SAP's pets act on each other (one trigger-to-effect ability each, chains through faints and summons, attack-order resolution), why it works, and where it fails: the auto-battle makes the player predict a hidden 25-step cascade, and chains converge on a meta; web research 2026-10-04 (little developer commentary exists) |
| 15 | [Into the Breach: combat mechanics](15-into-the-breach-combat.md) | How Into the Breach fights (8x8 grid, three mechs, four- or five-turn missions, telegraphed Vek attacks with no hit chance, buildings as the health bar, multi-effect weapons built on push), why it works (the turn becomes a puzzle, fixed buildings restore the threat that telegraphing removed, moving enemies beats killing them, weapons designed to fit the UI, fixed learnable enemies), and where it fails (one enemy too many makes a turn unsolvable, a luck patch for checkmate states, fixed enemies limit tuning, players fight genre habits, repetition); from Matthew Davis's GDC 2019 postmortem and interviews with Ma and Davis, web research 2026-10-04 |
| 16 | [Monster Sanctuary: levelling, team building, synergy](16-monster-sanctuary-teams.md) | How Monster Sanctuary (Moi Rai Games, 2020) levels monsters (the same XP for all six active monsters, catch-up from eggs and Level Badges, one skill point per level into trees too big to fill, respec by a 300-gold item), how a team is built (three fight, six share XP, Light/Dark Shift passives, one weapon and three accessories, sideways evolution by catalyst), how monsters work through each other (the combo meter turns order into roles, stacking auras, passives like Mentor and Death Blow), why building is satisfying (visible arithmetic, cheap trials, opponents that force rebuilds) and where it fails (debuff stacking dominates, respec and late grind, analysis paralysis, partner-dependent kits); from the fan wiki, reviews and Steam threads, web research 2026-10-04 (no developer commentary on the tree design found) |
| 17 | [Genre, mode and mood](17-genre-mode-mood.md) | Genre = what the player does moment to moment (the 3C), mode = the structure over sessions (roguelike, metroidvania, deck-builder in Slay the Spire), mood = the aesthetic; the pyramid they stack into, why most good mashups are one genre in another's mode (Spelunky), and four pitfalls: mashups with no design reason, generators before the game is fun once, content before the activity is proven, starting from a mood or mode you can't build yet; from a pasted transcript (one designer's opinion, overlaps 05 and 09) |
| 18 | [What makes a good deck-building roguelike](18-deck-building-roguelikes.md) | Why a twist matters more in turn-based card games than in action games (no physics; a big card pool alone is a Slay the Spire clone), the time between fights (breathers, shops, risk-and-reward events), card design (simple commons that combine, strong but situational rares, rarity for steerable builds, fun over balance, Judgment as the boring rare, controlled randomness: Discover, Astrea's dice), deck-building without cards (dice, orbs, backpack items), and visuals for a static screen; from a pasted transcript (one player's opinion, overlaps 11 and 14); project inferences flagged as unverified |
| 19 | [Rain World's procedural animation](19-rain-world-procedural-animation.md) | How Rain World animates its creatures in code: a simple simulation (point physics) kept apart from the look, with a one-way dependency so the look runs only on screen; AI and behaviour as the animation (visible cause and effect, players project personality); a cheap random search for grab points; weight faked from one number (grip count); fake limbs that blend in; fantasy creatures excuse wonkiness; from a pasted conference-talk transcript (the developers on their own practice); project inferences flagged as unverified (zoom tiers, gauge driving posture, keeping the look honest) |

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

## Decided: 4 to 8 months per game (user, 2026-09-30)

The user adopted the 4–8 month cycle from [game-strategy.md](../game-strategy.md) ("this guy knows better than I do, and I want to be successful, not right"). The monthly cadence in 01, 04 and 05 is superseded. Their research still stands, but read "a month" as "a cycle". The question below was settled by that choice.

**Flagship or monthly? (settled, see above)** Guides 01, 04 and 05 each flag this on their own. The Spelunking Base concept is a multi-month game, but the goal is one game a month. Pick one:

- **(a)** Spelunking Base is the flagship. Accept a multi-month timeline, and the monthly practice pauses or runs as small spin-offs.
- **(b)** The monthly practice wins. Month 1 ships the smallest game inside Spelunking Base (roughly b1 + b2: dig, loot, recall, greed vs. darkness), and the rest becomes later months or never happens.

The choice decides what b1 needs to prove and what the devops round (CI, portal SDK, deploys) has to support.
