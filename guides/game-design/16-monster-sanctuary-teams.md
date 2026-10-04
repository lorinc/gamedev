# 16 · Monster Sanctuary: levelling, team building, synergy

Scope: how Monster Sanctuary (Moi Rai Games, 2020) levels its monsters, how a team is put together, how monsters
work through each other, what makes building a team satisfying, and where it fails. Combat appears only as far as it
explains a team-building choice. Written for a taming game whose pet-management loop should feel like a management
game.

**Sources.** Researched 2026-10-04 from the web. Mechanics are from the Monster Sanctuary fan wiki (Fandom), read
through its API because the pages block normal fetching. Developer statements are from two interviews with Denis
Sinner (2018, 2024); neither covers the skill-tree or synergy design, so the design intent here is inferred from
how the systems behave. Player and critic judgements are from the reviews and Steam threads listed at the end.
Items marked **[unverified]** were not checked against a source or the current patch.

## The mechanics

### Levelling: shared XP, one skill point per level

- **XP is shared, not earned.** After each battle every monster in the active six gets the same XP, whether it
  fought or not. Monsters outside the six get nothing (except in New Game+, until they reach their old level)
  (wiki, *Level*; GameSpew, 2020). So a new monster levels just by being carried.
- **Catch-up is built in.** Eggs hatch 1–3 levels below your highest monster. Level Badges level a monster up to
  two levels below your highest. At the cap (42) further XP turns into Level Badge 42s, so the last levels are free
  (wiki, *Level*, *Monster egg*). The rule is "never far behind your best monster", not "earn every level".
- **One skill point per level** (two at level 1; the Spectral Familiar starters get one more), plus one from a Skill
  Potion, usable once per monster (Steam thread, *Skill Points*, early access; wiki, *Skill Potion*).
- **The tree.** Each monster has three or four trees (Grummy has three, Monk four), each with five tiers; a new tier
  opens every ten levels. Active skills appear in several tiers as upgrade steps (Grummy's Acid Rain sits in all five
  tiers of its first tree, so it can be raised to level 5). Around them sit passives: stat plusses, auras, combo
  passives (wiki, *Grummy*, *Monk*, *Level*).
- **Budget.** Grummy's three trees hold about 66 nodes; a level-42 monster has about 44 points (counted from the wiki
  tree **[C]**). The player can take roughly two thirds of a tree, so every monster is a specialisation.
- **Ultimates** at level 40: three per monster, pick one, free to re-pick (wiki, *Ultimate skills*).
- **Respec costs an item.** A Skill Resetter resets one monster's whole tree; it costs 300 gold from a merchant and is
  also found in chests and as a Monster Army reward (wiki, *Skill Resetter*).

### Team building: the six, the bench, Shift, equipment, eggs

- **Six active, three fighting.** Fights are 3 vs 3; the other three of the six come in as monsters fall (GameSpew;
  Wikipedia). The six are both the fighting reserve and the XP pool. Everything else waits on the bench
  (or in a Monster Farm for storage), or is donated to the Monster Army for loot and gold; donated monsters keep
  getting a share of XP and raise "army strength", which pays out item rewards at thresholds (wiki, *Monster Army*).
- **Shift (Light or Dark).** After a story point every monster can be shifted with a Shift Stone (Switch Stone to
  flip, Clear Stone to undo). Shifting adds stats and one Shift passive, fixed per species: e.g. Grummy gets Curse
  Resistance (Light) or Debuff Mastery (Dark, "apply an additional stack of each Debuff"); Spectral Eagle gets Charged
  Up or Dual Wield (two weapons) (wiki, *Shift*, *Debuff Mastery*). Shifted eggs also drop from wild shifted
  monsters, so Shift Stones are best spent on starters and rare monsters (wiki). Sinner: the idea comes from 16-bit
  recoloured enemies and serves to keep early monsters viable late (jpswitchmania, 2024).
- **Equipment.** One weapon, up to three accessories, each upgradable five times at the Smith (wiki, *Equipment*).
  Some passives depend on gear: Goblin Brute's Stick Focus gives 300 Attack, 60 Defense and a 600 team shield only
  while it holds the starting Wooden Stick; Ring Focus raises ring values by 80% (wiki, *Passive Skills*). Food adds
  up to three temporary stat bonuses (Steam guide, *Beginner Tips*).
- **Eggs and catalysts.** New monsters come from eggs dropped after fights (a rarer reward, likelier for species you
  do not own). A few species evolve at the Tree of Evolution with a species-specific catalyst, and evolution is
  **sideways, not up**, and irreversible: Magmapillar is a shield/Regeneration support, its evolution Magmamoth a
  critical-hit damage dealer (wiki, *Monster egg*, *Evolution*).

### Synergy: how monsters work through each other

Combat is the place synergy is paid out, but it is decided in the tree and the team. Four mechanisms do the work:

- **The combo meter ties turn order to roles.** Every hit (damage, heal, shield or buff) adds 5% to the next
  damaging action that turn; the meter resets each turn (wiki, *Combo*). So the first two monsters are built to
  produce many small hits and the third to cash them in. TheGamer's review: "have your weaker monsters do multi-hit
  attacks first so that your heavy-hitter will hit even harder at the end" (Latour, 2020).
- **Auras make passives team-wide.** An aura works for all allies, and normal auras stack: Vasuki and Imori both with
  Acid Spit give each reptile two extra chances to apply Burn or Poison. Unique auras do not stack (wiki, *Battles*).
  Fatal Upkeep (Yowie, Vasuki and others) adds 20% to Poison, Burn and Congeal damage (wiki).
- **Passives that turn one action into several.** Mentor: a single-target skill on an ally gives the caster two random
  buffs. Combo Buffing: every buff action adds one more random buff (and combo). Shared Regeneration: when this
  monster gets Regeneration, a random ally gets it too (wiki). Each is a one-line rule whose value depends on what
  the teammates do.
- **Pay-off passives that count the setup.** Troll's Death Blow adds 5% damage per debuff on the target; Bleed Out
  (Dark Shift) stops Bleed stacks being removed by Bleed damage (Steam thread, 2023; wiki).

**Roles follow.** Players and guides describe teams as builder → payer: Fungi and G'rulu stack debuffs, then Troll
with Death Blow uses Flurry of Blows on everyone; Megataur buffs the team with Might and Sorcery, Thanatos and Ucan
multiply it with Shared Might and Duality, then Ucan attacks; Ice Blob shields and Congeals, Yowie tanks, heals and
brings Fatal Upkeep, "put the two of them with almost any strong attacker" (Steam threads 2023; *Successful Teams*,
2022). A beginner rule from one review: two healers and one or two buffers (Save or Quit, 2020).

## Why building a team is satisfying

- **A monster is a build, not a species.** About two thirds of a tree, a Shift passive, a weapon and three
  accessories: two Grummies can play different roles. Critics singled the trees out ("go pretty deep", TheGamer;
  "a feature fully welcomed", Save or Quit).
- **Synergy is visible as arithmetic.** The combo meter shows its number on screen, Death Blow counts debuffs you can
  see, auras state their range. The player can predict a team's payoff before testing it.
- **Shared XP removes the cost of trying a monster.** A new hatchling joins near the top level and levels while
  sitting in the six. Supersven: "once you reach max level, getting monsters to the same level is done in no time"
  (2022).
- **Opponents force rebuilds.** Keeper battles and champions use synergy teams themselves ("boss teams ... make
  excellent use of combo interplay", RPGFan, 2024); a difficulty spike "usually means that you need to switch up your
  team and try a different strategy" (Supersven). The answer to a wall is a new team, not more levels.
- **Patching for synergy, not stats.** The 2021 Legendary Keeper balance notes change kits, not numbers: Crackle
  Knight gets Multi Shock so it no longer needs a partner to work; Goblin Miner's buff, debuff and charge parts are
  joined up, since they "didn't fit together very well"; Kame loses its "Shield Burst-jutsu" one-shot and becomes a
  physical support (Steam forum overview, Aug 2021 **[author not verified as the developer]**).

## Where it fails

- **Debuff stacking dominates.** A 2021 Steam thread, "Debuff stacks are too strong": "The most reliably potent teams
  I've played ... have been some kind of debuff stackers"; "it is MUCH easier to build an effective debuff team,
  where as direct damage teams are much more limited in mons"; one player's tank/support/damage team failed late
  until "the classic fungi/fungi/troll build ... melted everything". One reply puts it in the design: no one-shots, so
  set-up turns always pay. Damage over time scales with the enemy, not your stats. A forum view, not a measure.
- **Respec by item.** Save or Quit: "MS isn't set up in a way that lets players experiment easily", because a respec
  needs an item. Supersven read the same system as "done without problems or heavy costs". Resetters are cheap gold
  but still a stock to manage; the two reviewers disagree on whether that matters.
- **Grind for new monsters late.** Save or Quit: a new late monster means hatching at 37, a badge to 39, then about
  200,000 XP; "The grind is so tedious". GameSpew: grinding levels before a fight "does break up the flow". Shared XP
  fixes the early game, not the last levels before a hard fight **[C]**.
- **Analysis paralysis.** Save or Quit: "several minutes looking through all the possible skill trees and
  combinations ... not really knowing if I was choosing wisely or not". With 100+ monsters, each with ~66 nodes, the
  player cannot judge a choice before trying it, and trying costs a Resetter.
- **Management gets unwieldy.** RPGFan: "Managing your huge range of monsters can be a pain later on". TheGamer:
  buff and debuff fights "go on a little too long".
- **Synergy that needs a partner.** The 2021 notes treat a monster that only works next to one other monster
  (Crackle Knight before Multi Shock) as a fault and fix it; a kit whose parts "didn't fit together" was overlooked
  "in favor of monsters that were more focused" (Goblin Miner).

## Possible uses **[C]**

- **Keep:** shared XP for the whole active group plus "never far below your best" catch-up, so trying a new pet
  costs a slot, not a grind; trees too big to fill, so each pet is a specialisation; one-line team-wide passives
  (auras) whose value depends on the rest of the team.
- **Keep:** a visible counter that rewards order (the combo meter) turns "who goes first" into a role choice at
  team-building time.
- **Change:** make respec free or nearly so in a management loop; the cost is in the player's attention, not an item.
  Show a predicted payoff before committing a point, to cut the "not knowing if I was choosing wisely" problem.
- **Watch:** effects that scale with the enemy (damage over time, per-debuff bonuses) beat effects that scale with
  your own pet. If one family of pay-offs is cheaper to build, it becomes the meta.
- **Watch:** synergy that needs one specific partner reads as a weak pet. Each pet should work alone and get better
  with partners.

## Sources (by value per hour)

1. Monster Sanctuary wiki (Fandom): *Level*, *Combo*, *Shift*, *Battles* (auras), *Passive Skills*, *Skill
   Resetter*, *Monster egg*, *Evolution*, *Monster Army*, *Grummy*, *Monk*. <https://monster-sanctuary.fandom.com/wiki/Level>
2. Steam forum, "Debuff stacks are too strong" (Feb 2021). <https://steamcommunity.com/app/814370/discussions/0/4366772972647695238/>
3. Steam forum, "Legendary Keeper Balance Update Overview" (Aug 2021). <https://steamcommunity.com/app/814370/discussions/0/3046109410074546317/>
4. Fruit N Doggie, Save or Quit review (17 Dec 2020). <https://saveorquit.com/2020/12/17/review-monster-sanctuary/>
5. Steam guide, *Successful Teams* (2022, updated 2024). <https://steamcommunity.com/sharedfiles/filedetails/?id=2842494526>
6. Steam forum, "What's your most Broken Team?" (Mar 2023). <https://steamcommunity.com/app/814370/discussions/0/3829788180800235349/>
7. Jamie Latour, TheGamer review (7 Dec 2020). <https://www.thegamer.com/monster-sanctuary-review/>
8. Kim Snaith, GameSpew review (7 Dec 2020). <https://www.gamespew.com/2020/12/monster-sanctuary-review/>
9. Reviews by Supersven (18 Jun 2022). <https://reviewsbysupersven.com/monster-sanctuary/>
10. Mark Roddison, RPGFan review (13 Sep 2024). <https://www.rpgfan.com/review/monster-sanctuary/>
11. Interviews with Denis Sinner: Gaming Boulevard (20 Nov 2018), jpswitchmania (30 Jan 2024).
    <https://gamingboulevard.com/2018/11/interview-denis-sinner-moi-rai-games-monster-hunter-sanctuary/>,
    <https://www.jpswitchmania.com/post/interview-027-denis-sinner-moi-rai-games>
12. Steam forum, "Skill Points" (early access). <https://steamcommunity.com/app/814370/discussions/0/3609015230782814877/>
13. Wikipedia, *Monster Sanctuary*; Steam store page (read 2026-10-04). <https://en.wikipedia.org/wiki/Monster_Sanctuary>,
    <https://store.steampowered.com/app/814370/Monster_Sanctuary/>

Not read: the Steam guide *Beginner Tips and Detailed Explanation* beyond its tips section; no developer talk on
the skill-tree or synergy design was found.
