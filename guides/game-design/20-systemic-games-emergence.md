# 20 · Systemic games and emergence

Scope: a survey of the main theories and concepts around emergence and systemic design: three kinds of emergence,
how well-known designers and books frame systems, systemic genres, how to get players to think systemically, and
emergent narrative. General, for any game built from interacting rules.

**Source.** "How Game Designers Create Systemic Games | Emergence, Dynamic Narrative and Systems in Game Design" by
The Game Overanalyser (YouTube, https://www.youtube.com/watch?v=OrmyLaLCaIo). The transcript (auto-captions, no
timestamps) and the video's source list were pasted by the user on 2026-10-07; section references below are the
video's chapter titles. Unlike the earlier talk guides, this is an enumeration: one essayist summarising many
designers, talks and books, often in a sentence each. Nothing in it is measured, and the summaries are second-hand;
check the original before relying on one. The captions garble several names; they are corrected here where the
source list makes them clear (Aleissia Laidacker, Steve Lee, Nels Anderson, Jesper Juul, Janet Murray, Ian Bogost,
Tynan Sylvester). Everything outside the last section comes from the video.

## The claims

### 1. Three kinds of emergence [Introduction, Systemic Emergence]

- **Strategic emergence**: a game's rules generate a rich possibility space for strategic play. Chess has few rules
  (a goal, how each piece moves), yet an enormous number of strategies emerge; it became the "holy grail" of AI
  research up to Deep Blue beating Kasparov. Games differ in how much depth their rules generate, from tic-tac-toe's
  small state space to Go's near-endless one.
- **Systemic emergence**: rules combine in dynamic ways to produce novel outcomes. In Breath of the Wild, stasis lets
  you freeze an object and launch it by striking it; you can also climb any object. Combined, you can launch yourself
  across great distances.
- **Narrative emergence**: a sequence of play events forms a story the rules tell. In Missile Command you protect six
  cities from nuclear weapons, make sacrifices as chaos grows, and inevitably lose: a parable about the futility of
  nuclear war, told by rules alone.

### 2. What emergence is [Emergence]

- The whole system shows properties its parts don't have ("the whole is greater than the sum of its parts"). It
  matters to games because games are systems built from rules.
- *Rules of Play* (Salen and Zimmerman) uses complexity theory: complex systems have enough connections to produce
  discernible, non-random phenomena, and emergence appears once a threshold of connectivity is reached.
- Jonathan Blow (talks on truth in game design): simple rules yielding infinite structure (the Mandelbrot set,
  Conway's Game of Life) are a template for games as simple-rule systems that can explore truths about the universe.
- Emergence exists at every scale: ants follow simple pheromone rules while the anthill thermoregulates; brains from
  neurons, computers from bits. Fritjof Capra (*The Web of Life*) argues the universe may be built from its own
  emergence, with life part of the process.

### 3. Three designers, three kinds of emergence [Emergence in Game Design]

- **Sid Meier, strategic**: "games are a series of interesting decisions": risk versus reward (Tetris: pile up blocks
  or clear lines), long term versus short term (Civilization: when to attack).
  - Game-theory configurations with no dominant solution, i.e. no pure-strategy Nash equilibrium: most fighting games
    are rock-paper-scissors, most strategy games a "fog of war mapping puzzle" (caption garbled).
  - **Yomi**: reading an opponent's moves and countering them. Bluffing, deception and information gathering become
    part of play (poker, chess, Go).
- **Will Wright, systemic**: games are dynamic interactive systems for simulating and testing hypotheses. In SimCity,
  systems with their own rules interact and produce dynamic outcomes. Design should borrow from systems and complexity
  theory: feedback loops, looping dynamics, state spaces, dynamic AI systems.
- **Jonathan Blow, narrative**: *dynamical meaning*, our instinct to map stories onto rules and interactions (talk:
  "The Main Conflicts in Modern Game Design"). Games must mind the meaning they convey to be taken seriously as art.
  Braid's mechanic is time manipulation, so its themes are regret and changing the past: motif aligned with mechanic.

### 4. The three kinds mix [Emergence in Game Design]

- Quake's rocket jumping: the blast radius pushes players, combined with a jump it boosts mobility. Systemic
  emergence turned strategic.
- This War of Mine: murdering and stealing may help you survive, but take a psychological toll on characters trying
  to keep their humanity. Strategic, systemic and narrative emergence in one scenario.
- In MDA terms (mechanics → dynamics → aesthetics), emergence runs both vertically and horizontally: systemic
  emergence arises from mechanics, strategic from dynamics, narrative is part of the aesthetics. They reinforce each
  other; combining them may open frontiers not yet explored.

### 5. What makes a game systemic [Systemic Games]

- **Aleissia Laidacker** ("Systems Are Everywhere", GCAP 2016): a systemic game is a set of individual components that
  can influence one another because they were designed to interact in specific ways. The rules must be precise and
  consistent. Design how objects interact with things **other than the player**, and enable player-driven stories and
  choices through these systems.
- **Far Cry 4**, called an "anecdote factory" by its creators: you can lure animals into enemy bases, because entities
  interact with each other predictably. Strategic depth through systems, and a player-driven story.
- **Breath of the Wild** (talk: "Breaking Conventions with The Legend of Zelda"):
  - The goal was freedom of play. **Multiplicative design**: systems create scenarios that set a goal and let players
    work out how to reach it.
  - A **chemistry engine** connects everything: water douses fire, fire ignites grass, electricity is conducted by
    water, wind is included too.
  - Creativity is rewarded by gameplay: designers made sure each scenario had at least one solution, and several.

### 6. Agents, networks, layers; synergy; feedback loops [Systemic Games]

- **Will Wright, "Dynamics for Designers"**: games break into **agents** (individual parts), **networks** (how they
  interact) and **layers** (an ossified set of rules inside a network). In Battlefield you are an agent; your squad is
  a network that needs a configuration (an engineer for the tank, a medic, infantry for cover).
- **Synergy**: elements of a game working in harmony. Hearthstone cards that complement each other; MMO roles working
  together on hard encounters.
- **Group-level thinking**: in Total War you build individual units but in battle think of them as groups. Shogun's
  AI worked at group level following Sun Tzu's *The Art of War*; for example it acted differently depending on
  whether it was outnumbered. Even Go's stones bunch into territorial groups.
- **SimCity's urban decay** cycle: population up → crime up → neighbourhood value down → people leave → crime down →
  population boom again. The video says this was completely unintended by the designer.
- **Positive feedback loops** reinforce themselves and push toward imbalance (Call of Duty killstreaks make more kills
  likely). **Negative feedback loops** pull the system back to balance (rubber-banding AI in racing games).

### 7. Internal economies: Machinations [Game Mechanics: Advanced Game Design]

- *Game Mechanics: Advanced Game Design* (Ernest Adams with Joris Dormans): a game's physics, internal economy,
  elements, rules and systems form a network with its own emergent dynamics. It introduces **Machinations**, a formal
  language for systems.
- An internal economy has four kinds of element: **sources** (produce a resource), **drains** (deplete it),
  **converters** and **traders** (turn one resource into another, automatically or by player action).
- Pac-Man in these terms: dots are a resource converted into points; the power pill is a converter that switches the
  game into a powered-up state, which drains over time.
- These components form recurring patterns. One is the **engine**: stockpile a resource to spend now or keep for
  later. Strategy games have a long gathering phase, then allocation: in Civilization, first food for cities, then
  resources for military units, later gold for research. That gives interesting decisions, feedback loops and
  systemic dynamics.
- Stepping back further, narrative emergence shows: Civilization's rules encode values about history and treat
  expansion and progress as inherently good.

### 8. Engines, economies, ecologies [Game Mechanics: Advanced Game Design]

- *Advanced Game Design: A Systems Approach* (Michael Sellers): games teach people to think systemically because they
  expose a system's workings in precise, measurable ways. Covers low-level loops (feel, engagement) and three systemic
  devices:
  - **Engine**: reinforcing or balancing with the *same* resource. Burnout's boost (store it or use it now).
  - **Economy**: dominated by a reinforcing loop where value grows from *exchanging* one resource for another, not
    from reinvesting the same one. Civilization, as above.
  - **Ecology**: like an economy, but the exchanges make each part *balance* the others rather than reinforce them.
    EVE Online's player economy (niches, supply and demand, jobs, corporations, supply chains) balances itself.
- Combining Machinations' sources, drains, traders and converters, the patterns they make, and engines, economies
  and ecologies gives meta-patterns: resource, combat, construction and socio-political systems.

### 9. Systemic genres [Systemic Genres]

- **Immersive sims** (Deus Ex, System Shock, Thief): interconnected systems the player uses as they like. Deus Ex
  allows stealthy, diplomatic or aggressive play, or bizarre self-made solutions.
- **Roguelikes** (from Rogue): procedural generation plus systemic design for novel experiences. Spelunky is a precise
  set of rules that always interact the same way.
- **Stealth**, an often-neglected systemic genre (Nels Anderson, "How Systems Will Save Us All"): from Castle
  Wolfenstein and the first Metal Gear, games about *avoiding* things had to make play through indirect means. Enemies
  have **awareness meters**, sound-detection profiles, and notice more of their environment than in other games. In
  Metal Gear Solid you make noise to pull a guard's pathfinding; in Mark of the Ninja you play with light to open a
  route. Stealth has spread to all genres because it creates strategic depth through systems.

### 10. Getting players to think creatively [Systemic Genres, Leave Players Room]

- Stealth shows two design problems: getting players to think creatively, and giving them space to plan.
- **Constraints**: puzzles with one solution force divergent thinking; the player must search the space harder.
  Zachtronics argue the opposite also works: **multiple solutions** create agency and creativity.
- Nels Anderson: players have a **learned helplessness**, following tutorials and conventions.
- Beyond systems and constraints, a third way to break it is **withholding information**. The GDC talk "Leave Enough
  Room": not explicitly telling the player what to do leaves room to experiment. SimCity did this exceptionally well.
- **Steve Lee, "An Approach to Holistic Level Design"**: levels for systemic games must enable **player
  intentionality**: conscious choices with specific goals and tools in mind. Players need **choice, information,
  motivation and time**. Example: Dishonored 2's "Edge of the World" mission.
  - Clear **affordances** (Don Norman, *The Design of Everyday Things*): things that communicate their function, which
    gets the player thinking about possibilities.
  - **Long-term goals without instructions** on how to reach them: landmarks, or Hitman's assassination target and
    then stepping back.
- **Jesper Juul, "The Open and the Closed"**: a dichotomy between games of **progression** (linear, Mario) and games
  of **emergence** (Go). The line is permeable: most games mix them, and Breath of the Wild builds emergence into a
  somewhat linear progression.
- Consistent rules, horizons of intentional action and not spelling out the path all help, but must be built into
  the structure:
  - **Sid Meier moved Civilization from real-time to turn-based** to enable player intentionality.
  - **Warren Spector** deliberately built multiple solutions to every problem in Deus Ex.
  - **Tynan Sylvester (RimWorld)** had to change players' assumption that skill should be rewarded, and get them to
    see death as part of the game's dynamic narrative. Making players think systemically may mean changing how they
    approach games in general.

### 11. Dynamic narrative [Dynamic Narrative]

- **Choice within fixed outcomes**: Spec Ops: The Line forces a choice between killing two people; thinking laterally,
  you can shoot the snipers instead. Outcomes are always the same, but being able to choose in context makes players
  think systemically.
- **Showing consequences**: in The Witcher 3, romancing both Triss and Yennefer leads to a scene where both reject you,
  humorously. Undertale shifts its story with your actions.
- **Narrative intentionality** (Steve Lee): clear, consistent rules and the ability to plan ahead. In Dark Souls any
  NPC can be killed, so you're wary of attacking them; being able to change the world's course makes actions feel
  meaningful.
- **Aligning player and avatar**: Half-Life 2 makes you hate the guards as much as Gordon does by making you endure
  their abuse.
- **Persistence**: Shadow of Mordor's nemesis system promotes orcs who kill you, folding your failures into a dynamic
  story, "something like a militaristic sports drama".
- **Three forms of narrative emergence**:
  1. **Mechanics as metaphor**: Ico expresses empathy by tying your health to Yorda.
  2. **Stories from systems**: RimWorld's systems produce bizarre dynamic narratives.
  3. **Interactive**: the player affects the world with some intentionality, or the world responds to the player.
- Designing narrative emergence means anticipating the whole possibility space, then highlighting, enhancing or
  contextualising what's in it (Laidacker's player-mediated narrative).
- **Strategic choices with narrative weight** (Nels Anderson): Papers, Please (feed your family or yield to an
  authoritarian state; optimising in the game conflicts with your values outside it), Cart Life.
- **Procedural rhetoric** (Ian Bogost, *Persuasive Games*): mechanics, rules and systems communicate ideas and argue
  for points of view. September 12 shows the futility of interventionist policy: attacking insurgents causes
  collateral damage. Civilization implicitly says progress is good; SimCity implicitly advocates public transit
  (it helps you expand), and models urban decay in a way the video reads as social-democratic, pro-transit and rooted
  in commercialism. All systems embed meanings and values.
- **Story that responds to the player** is still unsolved: agency creates a permutation problem. Detroit: Become Human
  explores it in rudimentary ways.
  - Janet Murray (*Hamlet on the Holodeck*): games will become story factories like the holodeck.
  - Many think only AI systems that manage and guide emergence can solve it: Ken Levine's modular "narrative Lego",
    Jesse Schell on voice and face recognition, Façade's drama manager offering scenarios modularly, RimWorld's
    choosable AI storyteller that injects events.
  - **Dwarf Fortress**: building a tavern brought dwarves to drink, which brought rats, which brought cats; dwarves
    splashed the cats with alcohol, and the cats' automatic grooming got them drunk. Absurd; the future needs better
    control over the meaning of systems.

### 12. Conclusion [Conclusion]

- The Witness couples pattern-tracing (strategic and systemic emergence) with audio logs and framing to convey ideas
  Blow thinks are built into the universe. Meaning need not be explicit: the act of play tells its own story.
- Chess makes a story unique to each game and pair of players (Duchamp admired its artistry). Clint Hocking: every Go
  game has its own internal story; one famous game serves as a metaphor for tradition versus progress.
- Frank Lantz: games are "the medium of thought", making thinking visible to itself as an aesthetic; designers are
  artists who think about thinking.
- The video's closing argument: centuries of scientific reductionism are giving way to emergence in 21st-century
  science and art. Using systems needs a vocabulary for designing them and training to think systemically.

### Sources listed by the video

Links are the ones in the video's description, checked 2026-10-07: every video link was live and matched its title
except where marked. The video gave no links for books; those link to Open Library by ISBN.

**Talks**

| Source | Link | Used in |
|---|---|---|
| Jonathan Blow, Truth in Game Design (GDC Europe 2011) | [YouTube](https://www.youtube.com/watch?v=C5FUtrmO7gI) | §2 |
| Sid Meier, Interesting Decisions (GDC 2012) | [YouTube](https://www.youtube.com/watch?v=WggIdtrqgKg) | §3 |
| Will Wright, Dynamics for Designers (GDC 2003) | [YouTube](https://www.youtube.com/watch?v=JBcfiiulw-8) | §3, §6 |
| Jonathan Blow, Conflicts in Game Design (2008) | [YouTube](https://www.youtube.com/watch?v=mGTV8qLbBWE) | §3 |
| Aleissia Laidacker, Systems Are Everywhere (GCAP 2016) | [YouTube](https://www.youtube.com/watch?v=Gelpn4mksXQ) | §5, §11 |
| Breaking Conventions with The Legend of Zelda: Breath of the Wild (GDC 2017) | [YouTube](https://www.youtube.com/watch?v=QyMsF31NdNc) | §5 |
| Nels Anderson, How Systems Will Save Us All | [YouTube](https://www.youtube.com/watch?v=X8w1ScEulfU) (unavailable on 2026-10-07; no other copy found) | §9, §10, §11 |
| Steve Lee, An Approach to Holistic Level Design (GDC) | [YouTube](https://www.youtube.com/watch?v=CpOoTAVeEcU) | §10, §11 |
| Leave Enough Room: Design that Supports Player Expression (GDC) | [YouTube](https://www.youtube.com/watch?v=B1evPcFmddc) | §10 |
| Open-Ended Puzzle Design at Zachtronics (GDC) | [YouTube](https://www.youtube.com/watch?v=U4uH1ynH3Rs) | §10 |
| Classic Game Postmortem: Sid Meier's Civilization (GDC) | [YouTube](https://www.youtube.com/watch?v=AJ-auWfJTts) | §10 |
| Classic Game Postmortem: Deus Ex (GDC) | [YouTube](https://www.youtube.com/watch?v=tffX3VljTtI) | §10 |
| Tynan Sylvester, RimWorld: Contrarian, Ridiculous, and Impossible Game Design Methods (GDC) | [YouTube](https://www.youtube.com/watch?v=VdqhHKjepiE) | §10, §11 |
| Ken Levine on "Narrative Lego" (GDC) | [YouTube](https://www.youtube.com/watch?v=p40p0AVUH70) | §11 |
| Jesse Schell, The Future of Storytelling: How Medium Shapes Story (GDC) | [YouTube](https://www.youtube.com/watch?v=BjrO-di22v8) | §11 |
| Eurogamer, Why Dwarf Fortress started killing cats | [YouTube](https://www.youtube.com/watch?v=6yWf6BHqiWM) | §11 |
| Clint Hocking, Dynamics: The State of the Art (GDC) | [GDC Vault](https://www.gdcvault.com/play/1014597/Dynamics-The-State-of-the) | §12 |
| Frank Lantz, Hearts and Minds (GDC) | [GDC Vault](https://www.gdcvault.com/play/1020788/Hearts-and-Minds) | §12 |
| Frank Lantz, This Is Your Brain on Games (GDC) | [GDC Vault](https://www.gdcvault.com/play/1025011/This-is-Your-Brain-on) | §12 |

**Papers**

| Source | Link | Used in |
|---|---|---|
| Hunicke, LeBlanc, Zubek, MDA: A Formal Approach to Game Design and Game Research | [PDF](https://users.cs.northwestern.edu/~hunicke/MDA.pdf) | §4 |
| Jesper Juul, The Open and the Closed: Games of Emergence and Games of Progression | [jesperjuul.net](https://www.jesperjuul.net/text/openandtheclosed.html) | §10 |
| Solera Dillon, The Open, the Closed and the Emergent (Game Studies 19/2) | [gamestudies.org](http://gamestudies.org/1902/articles/soleradillon) | not cited in the transcript |

**Books**

| Source | Link | Used in |
|---|---|---|
| Katie Salen, Eric Zimmerman, *Rules of Play* (MIT Press, 2003) | [Wikipedia](https://en.wikipedia.org/wiki/Rules_of_Play) | §2 |
| Fritjof Capra, *The Web of Life* (1996) | [Open Library](https://openlibrary.org/isbn/9780385476751) | §2 |
| Ernest Adams, Joris Dormans, *Game Mechanics: Advanced Game Design* (New Riders, 2012) | [Open Library](https://openlibrary.org/isbn/9780321820273) | §7 |
| Michael Sellers, *Advanced Game Design: A Systems Approach* (Addison-Wesley, 2017) | [Open Library](https://openlibrary.org/isbn/9780134667607) | §8 |
| Ian Bogost, *Persuasive Games* (MIT Press, 2007) | [Wikipedia](https://en.wikipedia.org/wiki/Persuasive_Games) | §11 |
| Janet Murray, *Hamlet on the Holodeck* (1997) | [Wikipedia](https://en.wikipedia.org/wiki/Hamlet_on_the_Holodeck) | §11 |
| Stuart Kauffman, *At Home in the Universe* (Oxford, 1995) | [Open Library](https://openlibrary.org/isbn/9780195111309) | not cited in the transcript |
| Melanie Mitchell, *Complexity: A Guided Tour* (Oxford, 2009) | [Open Library](https://openlibrary.org/isbn/9780199798100) | not cited in the transcript |

## Unverified inference **[C]**

Thoughts on this project, not from the video, and not checked against play or other sources. Weigh before using.
Background: an incremental idle taming game; the taming encounter is the base (turn-based, a gauge of motivations);
an idle layer of colonies, foragers and scouts; a Simulation pillar (the ecosystem running while away); a central
ledger with simple local models; a planned simulator and optimizer for balancing; no killing; no hidden consequences.

### The current taming problem is a missing negative feedback loop

v10.4 found that jumpy animals are the easiest to tame because every action pushes the needles up and nothing pushes
them down. In this video's terms the encounter is all positive feedback: each step makes the next one easier. Two
fixes already in the design map onto the video's vocabulary:

- **A drain** (Machinations): something that lowers a needle every turn or on a trigger, such as the animal's own
  moves (D187) or an action's side effect.
- **A balancing loop that scales with the push**: the further a needle is pushed, the harder it pushes back
  (rubber-banding inside one animal). Jumpiness then multiplies both the push and the pushback, so a jumpy animal
  swings, which is the risk the design wants.

### The stealth awareness meter is the closest genre to taming

Stealth games built depth around an enemy's internal state shown as a meter, changed by indirect actions (noise,
light) rather than direct attacks. Taming is the same shape with a friendly goal: the gauge is an awareness meter
read the other way round, and the player's actions are indirect (bait, calm, wait). Stealth also points to what
taming lacks: in stealth the *environment* is a tool (shadows, sound surfaces). An encounter on a patch could let the
patch matter (cover, food nearby, other animals) without per-entity tracking, as one or two patch counts.

### Ecology is the right word for the Simulation pillar

Sellers' split fits the two halves of the game:

- **The idle layer is an economy**: foragers convert time into resources, colonies are sources, resources buy
  upgrades. Reinforcing, as idle games are supposed to be.
- **The wild ecosystem is an ecology**: species balance each other. That's what makes it watchable without
  exploding, and it's the balancing counterweight to the economy's reinforcing loop.

The risk is letting the economy feed the ecology without a return path (colonies drain a biome forever). Whether the
player's economy is allowed to unbalance an ecology, and whether that is visible, is a design call, not something the
model gives.

### Machinations is a candidate vocabulary for the simulator

The planned simulator needs a way to describe the ledger. Sources, drains, converters and traders are a small, known
vocabulary that covers colonies (sources), forager trips (converters), consumables for taming (drains) and trades.
Worth a look before inventing a notation; the Machinations diagrams also show engines and feedback loops at a glance.
Not a dependency: the vocabulary, not the tool.

### "Objects interact with things other than the player"

Laidacker's rule and BotW's chemistry engine, applied here: animals act on each other, not only on the player's team
(predator near prey changes the prey's fear; a full belly changes curiosity). The trait space (D193) is the
chemistry table. Two constraints from this project bend it:

- **No hidden consequences.** Dwarf Fortress's drunk cats are the warning: a chain nobody can see is noise, not
  emergence. Each interaction needs to show on the animals involved.
- **Simple local models.** BotW's chemistry is a few elements with a few rules each, which fits; a Dwarf Fortress
  depth of interaction does not.

### Group-level AI: fight or flight against team strength

Shogun's AI acting on whether it's outnumbered is what D195 (fight-or-flight versus team strength) already does at
the animal level. The video's framing adds one idea: herds and packs could decide as a group (one gauge for the
group), which is cheaper and more readable than per-animal decisions, and fits the ledger.

### Yomi without an opponent

Yomi needs an opponent with intentions. The animal has motivations, so a mild form exists: reading what this animal
is about to do from its tells and acting before it. That is the readable-intent principle again (guides 11, 12), not
bluffing; an animal that bluffs would break "no hidden consequences".

### Turn-based for intentionality

Sid Meier's move from real-time to turn-based Civilization is an outside data point for D181 (turn-based): it gives
the player the time that Steve Lee lists among choice, information, motivation and time.

### Procedural rhetoric: what the rules say

Every system argues for something. This game's rules already say "understand, don't overpower": no killing, failed
attempts that reveal, climbing differently rather than faster. The point to watch is that the idle economy doesn't
argue the opposite (harvest everything, more is better) more loudly than the taming says it.

### Anecdote factory and watchable replays

Far Cry 4's "anecdote factory" and RimWorld's stories from systems are what watchable replays (D178) could capture:
the ecosystem making a small story while the player was away. Shadow of Mordor's nemesis is a hint for failed taming
attempts: the animal that got away could be remembered (it's warier next time), which is persistence turning a
failure into a story. That's per-entity state, so only for a few named animals, if at all.

### What not to copy

- **Emergent narrative as a goal.** Story is 10% of this audience; narrative emergence is a by-product here, not a
  target. Drama managers and story directors are out of scope.
- **Multiple-solution levels.** This game has no authored levels. The taming equivalent is "more than one way to tame
  an animal" (D183 tame routes per pillar), which already exists.
- **Withholding instructions** in the "Leave Enough Room" sense fits Discovery players, but is bounded by no hidden
  consequences: withhold the path, never what an action did.

### Overlaps with earlier guides

Much of the first half restates [01 Foundations](01-foundations.md): MDA (§2.1), interesting decisions (§2.5),
feedback loops (§2.7) and systemic versus authored design (§2.9). Depth from a few combining systems is
[10 Depth versus complexity](10-depth-vs-complexity.md). Juul's progression versus emergence is close to
[17 Genre, mode and mood](17-genre-mode-mood.md) (mode over sessions). Readable intent and telegraphs are in
[11](11-slay-the-spire-engagement.md), [12](12-sonny-engagement.md) and [15](15-into-the-breach-combat.md).
