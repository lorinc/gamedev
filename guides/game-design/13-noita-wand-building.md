# 13 · Noita's wand building

Scope: how Noita's wands and spells work, why the system feels so free, and where it breaks down. Most attention goes
to three questions: what a spell's effects can reach, how the interactions stay readable, and where they turn into
noise.

**Sources.** Researched 2026-10-04. Items in the list below are cited by their letter.

- **[P]** Petri Purho (Nolla Games), *Exploring the Tech and Design of Noita*, GDC 2019,
  <https://www.youtube.com/watch?v=prXuyMCgbTc>. Read from the YouTube transcript. The talk is about emergence and
  physics, and it predates early access, so it says nothing about wands.
- **[T]** Arvi Teikari (Nolla), the spellcrafting section of the *Making of Noita* Games Now! lecture, given after the
  2019 early-access launch, <https://www.youtube.com/watch?v=Mr3E_voEG8Y>, also uploaded on its own as
  <https://www.youtube.com/watch?v=dKVwrE2L1AI>. Read from the transcript.
- **[I]** Purho interviewed by 80.lv, 2019-04-05,
  <https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation>.
- **[W]** The Noita Wiki (noita.wiki.gg), community-written: Guide: Wand Mechanics, Wands, Status Effects, Water,
  Perks, Omega, Requirement, Expert Guide: Divide By Spells, Spells To Power, Charm On Toxic Sludge, Critical on Oiled
  Enemies.
- **[D]** The game's spell definition file `data/scripts/gun/gun_actions.lua`, read from a mod repo that copies it
  (github.com/DarthZhu/noita_saveandload). The game version is unknown, so treat its numbers as illustrative. Times are
  in frames, at 60 per second.
- **[S]** The community *Noita Wand Simulator*, <https://github.com/salinecitrine/noita-wand-simulator>.
- Wikipedia, *Noita (video game)*, for dates: early access 2019-09-24, 1.0 on 2020-10-15.

Anything marked **[unverified]** was not confirmed against a source. Anything marked **[C]** is inference, not from a source.

## The mechanics

### Where it came from

- Around 2014 Purho suggested that the game's guns should work **like decks of cards**: each shot draws cards, and the
  cards decide what happens. The guns became magic wands when the theme settled. The first prototype had little to do
  with the physics engine. It stayed in because it was fun on its own, and physics-touching spells came later. **[T]**
- The named model is Dominion. Moving spells between wands is "much like the cards in a deck building game", and
  casting "draws up the 'cards' from the wand and applies the effects. It sounds easy in theory, but in practice, it
  creates a lot of interesting situations and combinations." **[I]**

### Wand stats (the deck's rules)

Every wand has these stats **[W]**:

- **Shuffle** (yes or no)
- **Spells/cast** (how many cards it draws)
- **Cast delay** (the gap between casts)
- **Recharge time** (the wait after the last spell)
- **Mana max** and **mana charge speed**
- **Capacity** (number of slots)
- **Spread**
- A hidden **speed multiplier**
- Optional **always-cast** spells, which are added to every cast

Wands are generated at random. You can edit them only in the Holy Mountain rest rooms between areas, unless you have
the *Tinker with Wands Everywhere* perk. Teikari calls a wand "just a clump of stats"; the spells are the star. **[T]**

### Spell types

The data file **[D]** has these types:

- **Projectile** (about 120)
- **Modifier** (about 130)
- **Static projectile** (about 37)
- **Material** (about 31)
- **Other** (29)
- **Multicast / draw-many** (13)
- **Utility** (13)
- **Passive** (5)

Teikari put the total at "like 250" at early access **[T]**, and the count has grown since.

### Casting is code

- **Order.** A non-shuffle wand casts left to right and recharges at the end. A shuffle wand randomises the order once
  per cycle. **[W]**
- **Modifiers** change the shared cast state and then draw the next card. The data shows this directly **[D]**:
  - Heavy Shot: damage +1.75 (internal units), cast delay +10, speed ×0.3, then draw 1.
  - Light Shot: speed ×7.5, cast delay −3, explosion radius −10, then draw 1.
  - Explosive Projectile: radius +15, cast delay +40, speed ×0.75.
- Modifiers stack. Three modifiers followed by a projectile apply all three to that projectile. **[W]**
- **Every spell also changes the wand's timing and mana.** Spark Bolt costs 5 mana and adds +3 cast delay, −1 spread
  and +5% crit chance. Blood Magic gives mana (−100 cost), cuts cast delay and recharge by 20 each, and takes HP from
  the caster. **[D]** So the wand's tempo is the sum of its cards.
- **Multicasts** (Double, Triple, Quad and so on) draw N cards and fire them together. If too few cards remain, the
  wand **wraps** to the start. **[W]**
- **Triggers, timers and death triggers** carry a payload. The next card fires when the carrier hits something, after
  a set time, or when the carrier expires. *Add Trigger* turns any projectile into a carrier. **[W][D]**
- Nesting gives you the classic chain **[T]**: "a homing fireball, and when it hits a wall it casts eight exploding
  deers in random directions, and those deers are leaking acid".
- **Spells that act on spells.**
  - *Greek letters* copy other spells. Alpha copies the first spell on the wand, Gamma the last, Tau the next two, and
    Omega every spell on the wand. Omega costs 320 mana and ignores the copies' mana and charges.
  - *Divide By N* casts N copies of the next spell, each with a damage penalty.
  - *Requirement* spells skip or cast the next spell based on HP, nearby enemy or projectile count, or every other
    cast, with *Otherwise* and *Endpoint* to close the block. **[W]**
  - *Spells To Power* eats your own nearby projectiles and adds their damage to the modified shot. **[W]**

### What a spell's effects reach

| Target | Mechanism, with examples |
|---|---|
| **Other spells** | Modifiers, multicasts, triggers, Greek copies, Divide By, Requirements, Spells To Power (above). |
| **The wand** | Each card's cast-delay, recharge and mana deltas. Cards with limited charges, refilled at Holy Mountain **[T]**. |
| **The environment** | Every pixel is a simulated material **[P]**. Spells dig (Digging Bolt, Luminous Drill, Black Hole), make matter (Sea of Lava, Circle of Water, material trails), and convert matter (Water to Poison, Blood to Acid, Lava to Blood, Toxic Sludge to Acid) **[D]**. Materials then react on their own: water + lava → rock + steam, water conducts electricity, fire spreads and wood burns **[W]**. The starting bomb is a physical object that breaks terrain and lights fires **[T]**. |
| **Enemies** | Damage, plus statuses: freeze, electrocute, fire, polymorph and chaos polymorph, charm and berserk fields **[D][W]**. **Stains** are the hinge. Wet, bloody, slimy and toxic stains block ignition; oil makes a creature burn longer **[W]**. Then *conditional* modifiers read the stain: Critical on Oiled, on Burning, on Bloody and on Wet; Charm on Toxic Sludge charms any creature coated in sludge for about 60 s **[W]**. |
| **The player** | The same rules apply to you. Explosions hurt the caster **[W]**. Giga Disc accelerates back toward its caster **[Wikipedia]**. Stains and fire work on you the same way **[W]**. Blood Magic trades HP for tempo **[D]**. Immunity perks (fire, explosion, electricity, toxic, melee) and projectile-repulsion perks let you switch off whole classes of self-harm **[W]**. |

The result is a chain of three layers: spell → material → status → conditional spell. One wand can stain a target with
a material, then fire a second card that pays off on that stain. Nobody authored that combination as a pair.

## Why it is so free and so fun

1. **One item category, one rule set.** Spells are the only loot, so every pickup is a card in the same system; the
   game needed no armour or weapon classes. "It could be easy to bloat the game with too many different categories of
   items." **[T]** **[C]** This is the high depth-per-system ratio from [10](10-depth-vs-complexity.md).
2. **The simple version is useful from minute one.** "This wand casts a fireball" is a complete wand, and so is the
   deer chain. The learning curve has no floor and no ceiling. **[T]**
3. **Spells write into the world, not into a hit-point table.** A dug tunnel, a lake of oil or a burning plank is a
   change everyone can see, and the physics carries it on after the spell ends. Experiments show off the physics even
   when they kill you: "I have a spell called nuke … I will cast it … and then you die". **[T]**
4. **Order is a design surface.** Non-shuffle wands let you compose a sequence on purpose. Shuffle wands turn the same
   cards into a probability game. **[T]**
5. **Broken builds are a feature, as long as the run ends.** Making Noita a permadeath roguelike let Nolla put back a
   drill that had broken combat in an earlier, persistent build. Because no run can count on finding it, the player
   who does find it feels "you found something that the designers don't know". **[P]**
6. **Spells are added because they are cool, not only because they are useful.** "Even if a spell idea is not very
   useful, if it's cool in some way or fun to use, it might be worthwhile to add … if it's wildly powerful there are
   many ways to … even things out." **[T]**

## How readability is kept

- **One visible causal substrate.** Purho's main design lesson: the gap between a player hating the game and blaming
  themselves is communication. Lava falling from nowhere feels like a glitch. A wooden plank under lava catching fire
  reads as "I wasn't careful enough". **[P]**
- **State gets an icon.** Liquid stains were invisible at first, and the oil-ignites rule confused players. Once
  stain icons appeared above the player, people "started attributing things" to them. They even assumed wet + electric
  damage before it was implemented. When the wet-resists-fire rule broke for two months, the team kept playing as if it
  worked. Visible state makes players attribute *more* than the system holds (Purho compares Dwarf Fortress and The
  Sims). **[P]**
- **Remove unreadable killers outright.** Rigid bodies could build up glitch forces, so they damage enemies but not
  the player. **[P]**
- **Editing happens in a safe room.** Wands are edited between areas, not mid-fight **[W]**. **[C]** Building and
  testing are separate phases.
- **Deterministic by default, chaos opt-in.** Non-shuffle order is readable left to right, and shuffle is a stat you
  can avoid. **[W][T]**
- **Self-harm is a dial.** Immunity perks remove a whole category of self-interaction at once. **[W]**

## Where it fails or turns into noise

- **Nolla never solved teaching.** "Even right now we still haven't fully figured out how the player should realize
  the depth of the system." Learning by trial is "cool but also frustrating"; a tutorial is "more limiting … less
  mysterious". **[T]**
- **The evaluation rules outgrow the screen.** Draw, wrapping, trailing modifiers that wrap, Requirement blocks
  leaking when the wand wraps, Omega's draw suppression with exceptions (Mu, Sigma, Add Trigger and Divide By all
  draw anyway), and Divide By's iteration caps all need the wiki's *Expert Guides* **[W]**. The community built a
  simulator mainly to show "a tree representing the evaluation sequence" **[S]**. **[C]** The in-game wand screen shows
  stats, not the call tree, so a late-game wand is readable only off-screen.
- **Hard caps and crashes.** Recursion is capped at 2 to stop infinite loops **[W]**. Spells To Power on an explosive
  shot that consumed nothing computes the log of zero and can crash the game **[W]**. Late-game multi-projectile wands
  fill the screen and slow the frame rate **[unverified: widely reported by players, no primary source checked]**.
- **Unfair-feeling deaths.** Players call deaths that feel unfair or unpredictable "Noita'd" (Wikipedia; its source
  is a wiki page). A shuffle wand with a trigger and Explosion may fire the explosion point-blank **[W]**.
  Self-targeting spells like Giga Disc kill the caster. **[C]** Each death is legal under the rules, but the cause is
  off-screen or random, which is exactly the failure Purho describes in [P].
- **Interactions that exist but rarely reach play.** Charm on Toxic Sludge needs a sludge stain, and the wiki says
  only Toxic Mist applies one reliably. Charming a whole Hiisi base fails "due to infighting and environmental
  hazards". **[W]** **[C]** Conditional payoffs are only as live as their setup is cheap.
- **Balance by limits was a long fight.** Some cards were too good. Nolla tried limited uses, then limited uses on
  everything, then gating spawns by depth. Losing spells forever frustrated players, and periodic refresh fixed it.
  Some questions were "left the way they were" at early access. **[T]**
- **Invisible effects don't count, and visible ones get over-credited.** The wet-and-fire bug went unnoticed for two
  months. **[P]** **[C]** Players respond to what they can see, not to the full rule set.

## Possible uses **[C]**

Inference, not from the sources, stated at the level of the bar "as free as Noita".

- Noita's freedom comes from **one substrate that every effect writes into and reads from**: materials and stains.
  Spells have few direct spell-on-enemy rules. Most interactions go spell → world state → spell. A taming game that
  wants the same freedom needs its own shared, visible state that every action changes and every action checks.
- **Conditional cards that read state** (Critical on Oiled, Charm on Sludge) make the multiplying combinations. They
  only work when the setup step is cheap and the state is shown, as with the stain icon.
- A turn-based game removes Noita's main noise source, effects resolving too fast to follow. The remaining one is the
  call tree. Noita shows the cards, not the order they resolve in.
- The same rules apply to the player, and that is where Noita gets both its tension and its "Noita'd" deaths. A
  no-killing game would need its own version of that two-sided risk, and its own immunity-style dial.
