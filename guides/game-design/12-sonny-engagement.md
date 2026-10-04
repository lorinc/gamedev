# 12 · Sonny's combat: what it is, why it works, where it fails

Scope: the combat system of Krin's Sonny games, at mechanism level: what an ability's effects can reach, how the
interactions stay readable, and where they turn into noise. No application here beyond checking the pattern already
drawn in [idea-taming-and-breach.md](../../concepts/shape-exploration/idea-taming-and-breach.md).

**Sources.** Researched 2026-10-04. The games: *Sonny* (Flash, Armor Games, released 2007-12-28), *Sonny 2* (Flash,
2008-12-19), and *Sonny* (2017), a from-scratch mobile and Steam remake. Note the dates: Sonny 2 is 2008, not 2010.
Mechanics and boss data are from the Sonny Wiki (sonny.wiki.gg, the fandom wiki's successor; fan-written, numbers
taken from the game files and play). Design intent is from two Armor Games interviews with Krin (2008 and 2016).
Reception is from two Jay is Games reviews and player guides. Anything not checked against one of these is marked
**[unverified]**. Wiki numbers are community data, not the developer's; they are good for mechanisms, but do not
read single values as exact.

## The core rules

- **One controlled unit, AI teammates.** The player controls only Sonny, "by selecting abilities to use on a
  particular target" (wiki). Allies (Veradux, Roald, Felicity and others) act on their own. Sonny 2 added five AI
  styles to choose from: Phalanx, Defensive, Tactical, Aggressive, Relentless (Krin, 2008).
- **Two resources: health and focus.** No mana pool that only drains. Most abilities cost focus, some scale with it,
  and some restore it. Focus is not raised with attribute points (wiki).
- **Cooldowns on everything strong.** "Using a technique usually costs focus and a certain number of turns before you
  can use it again" (JIG review of Sonny, 2008). Typical Flash-game values: Shatter Bolt 8 turns, Subversion 8 turns
  (Sonny 1) or 4 (Sonny 2), Disrupt 3, Crystallize 4, Mind Freeze 7.
- **Stats.** Strength and Instinct (Magic in Sonny 1) are damage coefficients; Vitality is health; Speed sets accuracy,
  evasion, crit chance and acting order within your team (wiki). Hits can miss and crit, so outcomes are not
  deterministic.
- **The loadout: an 8-slot ring.** "Before a fight, players can select a ring of 8 Abilities (the 'Combat Action Bar')
  ... Certain powerful abilities can be added twice to the ring, allowing for usage in successive turns" (wiki, Sonny
  2). The ring is free to change between fights. The ability tree is not: points are spent for good, and a reset costs
  money that JIG commenters called prohibitive early in Sonny 2. One Legend-run guide still respecs the whole build for
  zone 6.
- **Classes change the tree, not the rules.** Sonny 1 has four classes on one shared tree. Sonny 2 has three classes
  (Biological, Psychological, Hydraulic) with separate trees, which is why Krin needed every boss to have "more than
  one weakness" (below).

## What an ability's effects can reach

Every effect in the Flash games acts on one of these, and nothing else:

| Target | Examples |
|---|---|
| **Health**: damage, heal, damage over time | Decay (80/turn for 5 turns), Envenom (9 turns) |
| **Focus**: cost, drain, regen, lock-out | Disrupt destroys 50–100 focus; Mind Freeze blocks all focus abilities for 3 turns; Leading Strike restores 50 to the user |
| **The turn**: stun, speed | Shatter Bolt stuns 2 turns; BlackOut stuns 4; Shadow Blend +100% to +500% speed |
| **Cooldowns**: silence | Felicity's Garrote silences for 2 turns |
| **Buffs and debuffs**: apply, dispel | Disrupt dispels 1–2 buffs; Regenerate (2017) dispels one debuff at random |
| **Multipliers**: damage dealt, taken, healing received | Black Metal: healing on the unit 95% less effective, 5 turns; Holy Scars: damage taken ×10 for 3 turns |
| **The sign of an effect**: heal ↔ damage | Subversion: "switches damage with healing and healing with damage", 2 turns |

The **target** is also part of the reach. Crystallize, Subversion and Disrupt can be cast on anyone, friend or foe.
Krin on Crystallize: "It stuns the target for a couple of turns, yet at the same time shielding it from all damage.
This could be used both on friends and enemies, for both defensive and offensive purposes" (2008). One ability, two
opposite uses, chosen by where you aim it.

Effects never reach position, terrain or the enemy's choice directly. The only way to steer an enemy is to remove its
options (stun, silence, focus lock) or change what its options do (Subversion).

### The multi-effect ability

The strongest abilities bundle a main job with one or two smaller effects on other targets from the table:

- **Disrupt** (Sonny 2, Biological): damage, *and* destroys 50/100 focus, *and* dispels 1/2 buffs "of any element
  except Earth", *and* gives the target Shock Recovery, which restores 6 focus per turn for 5 turns. The last one is a
  drawback built into the ability: the drain is partly paid back.
- **Mind Freeze** (Sonny 2, Hydraulic): a small attack *and* "prevents the target from using any abilities that require
  Focus for 3 turns".
- **Shatter Bolt** (Sonny 1): weak ice damage (30% of Magic) *and* a 2-turn stun that cannot be dodged. Here the side
  effect is clearly the point.
- **Crystallize**: stun *and* shield, on anyone.

## Bosses: each one is built around a rule

The Flash bosses are where the system pays off. Most are built around one exaggerated rule, and the answer is an
ability that touches that rule.

- **Galiant the Paladin** (Sonny 1, end of Gadi'Kala). 4,000 focus; Paladin Heal costs 1,000 focus and heals 2000% of
  his Magic, no cooldown: "heal his entire health in a single turn". The wiki's answers: bait heals until his focus is
  gone, or cast Subversion so his heal hits himself. The fight before it shows him as your *ally* against Baron
  Brixius, so you watch the heal work before you face it.
- **Doctor Herregods** (Sonny 1, The Infinity). 1,000,000 health; Super Heal restores 2,000,000, free, triggered below
  99% health. Damage alone cannot win. Subversion (learned at level 8, long before) turns the heal into a lethal hit;
  the wiki calls it "essential for defeating Doctor Herregods without exploiting glitches".
- **Omen** (Sonny 1, The Infinity). Doctor's Fury heals him and applies Dark Omen: +2,000 damage, but more damage
  taken. The buff is the telegraph: "Stun him whenever he uses Doctor's Fury" (wiki), or Block ahead of it.
- **Baron Brixius** (Sonny 2). Deep Burning regains 100 focus at a cost of 5% health per turn. Drain his focus with
  Disrupt and he burns his own health to refill it. Below 50% he casts Holy Scars, damage taken ×10 for 3 turns, on
  himself. Stacked, the wiki reports damage multipliers "exceeding 100,000".
- **The Hydra** (Sonny 2, Labyrinth). Every strong attack needs focus and it has no fallback attack, so Mind Freeze
  shuts it down (wiki, Mind Freeze page). It fights beside a Fire Claw that should die first.
- **Felicity** (Sonny 2, New Alcatraz). Black Metal makes healing on her target 95% less effective; Serious Business
  below 50% health (50% less damage taken, 50% more dealt). Guides: keep her focus at zero with Disrupt (one Legend
  guide equips four), and burst her before 50%.
- **City Council** (Sonny 2, Hew). Shield costs their whole 2,000 focus; the Council Nuke costs 1,800. Their focus pool
  is the clock for the nuke. When an ally dies, Council Enrage gives 700 focus per turn.
- **Clemons the Deceiver** (Sonny 2, Ivory Line). The one designed lie. His opening cast is labelled only "Buff 1"; it
  applies "Unknown Condition" ("What is this? What did you do to me?"), which reverses healing and damage for 5 turns.
  On the affected unit, heals now hurt. The wiki advises setting your allies to Relentless "to avoid being damaged
  from heals", so your own AI healers become the threat. Which unit receives the condition is not stated clearly
  **[unverified]**.
  At 33% he drops the disguise: True Form heals 500% health but gives him 200% more damage taken, for 99 turns.

### Phases and telegraphs

Krin, 2008: "Bosses and fights can now have 'phases.' For example, once you get a boss down to 50% life, he might say
'Now I pwn you!'" Phase changes are tied to health thresholds (Baron Brixius at 50% and 30% in Sonny 1; Clemons at
66% and 33%; Hydra at 85% and 42%), and the boss says so.

What the Flash games show ahead of time is **state**, not intent: the buff a boss just gave itself (Dark Omen, Holy
Scars, True Form), its focus pool against the cost of its big move (City Council), and the phase line. Within a phase
the boss picks moves at random by weight: Sonny 1's Baron "uses BlackOut, Decay, and Smash randomly" above 50%; the
City Council has "a 50% chance to use Council Nuke or 50% chance to switch to offensive debuffs" (wiki). So you plan
against a known menu and a visible meter, not a declared next move. Explicit charge-up telegraphs (a boss that charges
a one-hit kill at full focus, answered by a stun) are documented for the 2017 remake, not the Flash games (Armor Games
walkthroughs of Sonny 2017).

## Why it works

1. **Few targets, all visible.** Seven things an effect can touch, each shown as a bar or a named icon with a turn
   count. Krin, on the Flash games: they relied on "a hover mouse to reveal information" (2016); every buff, debuff
   and ability had a tooltip **[the exact tooltip contents unverified]**.
2. **Bosses exaggerate one rule until it cannot be ignored.** Galiant's heal, Herregods' 2,000,000 heal, the Hydra's
   focus dependence. The player is told the problem by the scale of it.
3. **The answers were already in the kit.** Subversion, Disrupt, Mind Freeze and Shatter Bolt are all ordinary picks
   before the boss that needs them. The surprise is that a familiar ability is the key.
4. **The fight before teaches the boss.** Galiant heals as your ally, then you fight him.
5. **More than one answer per boss, on purpose.** Krin, 2008: "we need to make sure all bosses are beatable with any
   class. And since the classes all have different ability trees, we'll need to make bosses have more than one
   weakness". Galiant has three (bait, Subversion, burst); Baron has two (drain, Holy Scars window).
6. **Abilities that point both ways.** Crystallize and Subversion can save an ally or ruin an enemy, so a small kit has
   more uses than slots.
7. **The ring forces choices.** Eight slots, with doubles allowed, means you leave answers at home. Picking the ring
   for a boss is half the fight. Krin, 2016: "It's all about picking the right items, the right skills, the right
   teammates, and then making the right decisions in a fight to progress."

## Where it fails

- **Control locks break the game.** Two tier-3 Crystallizes "can permanently stun-lock an opponent" (wiki). In Sonny 2
  PvP, a speed Biological build can start "an unpreventable one-shot-kill setup ... as soon as the match begins", and
  cold Hydraulic can stun and silence an opponent into uselessness (wiki). The 2017 remake repeated it: "A
  Lightning+Frost character can solo the game on Legend because literally no one will ever take a turn"; "Speed and CC
  have ALWAYS been ridiculously overpowered in Krin's games" (Steam forum, 2017-04-28). Any effect on "the turn" that
  outlasts its own cooldown ends the game.
- **Multipliers stack into nonsense.** Deep Burning plus Holy Scars passing 100,000× damage is a readable cause with an
  unreadable result. Herregods' numbers (1M health, 2M heal) make the fight a lock that only one key opens; JIG
  commenters on Sonny were stuck at Herregods and Baron Brixius.
- **Uncontrolled actors make reversals noisy.** Sign-flip effects are clear on paper, but your AI allies keep casting
  heals into them. Subversion on an enemy healed by your Veradux can kill the wrong unit (wiki warning), and Clemons'
  fight is mostly about stopping your own team. The player pays for actions they did not choose.
- **Hidden exceptions.** Disrupt dispels buffs "of any element except Earth"; it also refills the target's focus over
  5 turns. Both are in the tooltip, and both are easy to miss in a fight.
- **Luck still decides some turns.** Misses, crits and damage spread ("Sometimes my destroy will hit for 130, other
  times 17", JIG Sonny 2 comment) and random move picks within a phase. A stun that misses breaks a plan made three
  turns ago.
- **Allies' AI.** JIG's Sonny review called "the relative stupidity of your allies' AI" the game's "major flaw"; Sonny 2
  answered with the five AI styles, and Krin designed the AI "so that you won't need to depend on them so much
  anymore" (2008).
- **Length.** "A tendency to let fights go on forever", reduced from Sonny 1 (JIG Sonny 2 review). Large health pools
  plus heals plus cooldown cycles means many turns repeat the same rotation.
- **Bugs inside interactions.** Crystallize refills shields from existing buffs, which hurts against the City Council
  and Twin Guardians; Felicity's Serious Business can be skipped by a stun at the right moment (wiki).
- **Respec cost.** The ring is cheap to change, the tree is not. Rebuilding for one boss is a grind, not a puzzle, early
  in Sonny 2.

## Checking the pattern in idea-taming-and-breach.md

The pattern holds in outline; several details are off.

- **Dates.** Sonny is 2007 (December) and Sonny 2 is 2008 (December), not 2008 and 2010.
- **"The answer is a side effect, promoted."** Partly. Disrupt against Felicity and Baron, Mind Freeze against the
  Hydra and Shatter Bolt against Omen fit it. Subversion against Galiant and Herregods does not: it is a single-purpose
  niche ability whose niche turns out to be the key. Both shapes appear.
- **"A challenge runs on one dial."** Krin designed the opposite for Sonny 2: "more than one weakness" per boss, so every
  class has a way in. One exaggerated rule per boss, several answers to it.
- **"The opponent telegraphs, as far ahead as planning needs" and "no luck".** Not the Flash games. They show state
  (buffs, focus, phase lines) and pick moves at random within a phase; hits miss and crit. Charge-up telegraphs answered
  by a stun are the 2017 remake. The Slay the Spire comparison (declared next move) does not apply to the Flash games.
- **"Rebuilding is expected ... cheap."** The 8-slot ring is verified and free to change; the ability tree behind it is
  costly to reset.
- **"New dials, now and then."** That is Krin on the 2017 remake ("a few new elements will begin to unlock a couple of
  zones in, which will change the nature of the combat (and boss fights especially)"), not the Flash games.
- **"Short enough to hold, two or three lines."** Also the 2017 remake, and a forced change: "I could no longer use
  paragraphs of text to explain a complicated skill, so I had to design a skill anyone could understand in 23 lines"
  (as printed; almost certainly "2–3 lines" with the dash lost). The Flash games used long tooltips.
- **"One lie, once trust exists."** Verified in spirit: Clemons the Deceiver's "Buff 1" hides a heal/damage reversal,
  midway through Sonny 2 (Ivory Line, the third of five main zones). It is a hidden effect, not a buff that "claims weakness"; his True Form is
  a real weakness that arrives with a full heal.

## Sources, by value per hour

1. Sonny Wiki boss pages: <https://sonny.wiki.gg/wiki/Doctor_Herregods_(Sonny)>,
   <https://sonny.wiki.gg/wiki/Galiant_the_Paladin>, <https://sonny.wiki.gg/wiki/Baron_Brixius_(Flash_Games)>,
   <https://sonny.wiki.gg/wiki/Clemons_the_Deceiver>, <https://sonny.wiki.gg/wiki/Felicity>,
   <https://sonny.wiki.gg/wiki/The_Hydra>, <https://sonny.wiki.gg/wiki/City_Council>, <https://sonny.wiki.gg/wiki/Omen>
2. Sonny Wiki ability pages: <https://sonny.wiki.gg/wiki/Disrupt_(Sonny_2)>, <https://sonny.wiki.gg/wiki/Subversion_(Sonny)>,
   <https://sonny.wiki.gg/wiki/Subversion_(Sonny_2)>, <https://sonny.wiki.gg/wiki/Crystallize>,
   <https://sonny.wiki.gg/wiki/Mind_Freeze_(Sonny_2)>, <https://sonny.wiki.gg/wiki/Shatter_Bolt_(Sonny)>
3. Krin interview, Sonny 2, 2008-06-26: <https://armorgames.com/news/sonny-2-interview-with-krin>
4. Krin interview, Sonny (2017), 2016-09-14: <https://armorgames.com/news/developer-interview-krin>
5. Sonny Wiki game pages: <https://sonny.wiki.gg/wiki/Sonny_(Game)>, <https://sonny.wiki.gg/wiki/Sonny_2>,
   <https://sonny.wiki.gg/wiki/Attributes_(Flash_Games)>
6. Jay is Games reviews: Sonny (2008-03-25) <https://jayisgames.com/review/sonny.php>; Sonny 2 (2008-12-19)
   <https://jayisgames.com/review/sonny-2.php>, including comments
7. Player guides: Sonny 2 boss guide <https://armorgames.com/community/thread/4632955/sonny-2-boss-guide>; Biological
   Legend run <https://armorgames.com/community/thread/8963623/sonny-2-biological-legend-run-walkthrough>; Sonny (2017)
   walkthrough <https://armorgames.com/community/thread/12641491/sonny2017-walkthrough>; Steam balance thread
   <https://steamcommunity.com/app/586750/discussions/0/1318836262654476424/>

Not reached: the 2011 freelanceflashgames.com interview with Krin (domain gone), TV Tropes (blocked), the Steam
Legend guide (rate-limited), speedrun.com guides (blocked).
