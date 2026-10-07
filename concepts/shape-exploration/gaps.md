# Gaps: what the parts don't answer yet

A TBD list. Frameworks show gaps, and often hint at the solution. Each entry is a place where the game's parts
(taming, idle, simulation, pets, lore) don't yet fit together, or a whole domain the design hasn't looked at, as
exposed by a known framework. Entries are extended and resolved until the parts converge into one coherent, good game.
A resolved entry moves its answer into [build-principles.md](build-principles.md) (or the taming folder) and stays here
as a one-line pointer.

Frameworks are from [guide 20](../../guides/game-design/20-systemic-games-emergence.md) unless noted. Almost every
concept in it exposes something; the ones not yet applied are listed at the end.

Status: **open** · **partly answered** (something in the design touches it) · **resolved** (answer lives elsewhere).

## Missing views: domains the design can't see

The design has no instrument for these, so gaps inside them are invisible. Each needs a view (a ledger, a graph, a
table) before its gaps can be listed.

### A. No ledger of interactions — open

- **Framework:** emergence appears once the density of interactions passes a threshold; the interactions must be
  deterministic and discernible (Rules of Play, complexity theory).
- **Gap:** nowhere lists which element acts on which (animal on animal, motivation on motivation, team on animal,
  weather on biome, colony on ecosystem). Without that graph, the density can't be judged, and emergence is out of view.
- **Touches:** gauge-model's motivations acting on each other (v10.4), the trait space (D193).

### B. No ledger of interesting decisions — open

- **Framework:** Sid Meier's interesting decisions: risk vs reward, short vs long term; no dominant answer
  (rock-paper-scissors); yomi; mapping puzzles under fog of war.
- **Gap:** nowhere lists the decisions the player makes, of which kind, at which loop. Only information gathering
  (scouting, intel) is planned.
- **Touches:** gameplay loops table (build-principles), scouting automatic (D182).

### C. Dynamics, topologies and paradigms were not used at creation — open

- **Framework:** Will Wright's dynamics: agents, networks, layers; feedback loops, looping dynamics, state spaces,
  dynamic AI; Machinations' sources, drains, converters, traders; Sellers' engines, economies, ecologies.
- **Gap:** the parts were chosen from the shape exploration (preferences × skills × audience), not from their
  dynamics. Which loops reinforce, which balance, what the topology of the whole game is, has not been drawn.
- **Touches:** the planned simulator and optimizer (build-principles).

## Emergence across kinds

### 1. Strategic, systemic and narrative emergence are not considered systematically — open

- **Framework:** three kinds of emergence, and how they turn into each other (Quake's rocket jump: systemic →
  strategic; This War of Mine: all three in one choice).
- **Gap:** no part of the design is checked for which kind of emergence it can produce, or how one could feed another.

### 2. Mechanics-dynamics-aesthetics against systemic-strategic-narrative — open

- **Framework:** MDA, read against the three kinds: systemic emergence arises from mechanics, strategic from dynamics,
  narrative is part of the aesthetics.
- **Gap:** the design has never been read on both axes at once: which mechanic hosts which dynamic, which dynamic meets
  which aesthetic, and where emergence enters on each layer.

## The parts

### 3. The simulation is a backdrop, not a place to test hypotheses — open

- **Framework:** Will Wright: games as dynamic systems where the player builds a hypothesis and tests it (SimCity).
- **Gap:** the game has a large simulation, but it runs as spectacle (the Simulation pillar is passive). The player
  watches it; they don't ask it questions. Testing teams against the simulation (engagement loop) is the nearest hook.

### 4. Taming is a duel; the systemic part is passive — open

- **Framework:** a systemic game is components that act on each other, not only on the player (Laidacker); Breath of
  the Wild's chemistry engine; Far Cry 4's "anecdote factory".
- **Gap:** animals acting on animals lives in the Simulation pillar. The taming encounter, where the player acts, is
  closed: the player's team against one animal. The parts don't interact where the player decides.
- **Touches:** trait space (D193), fight-or-flight vs team strength (D195), simple local models.

### 5. No balancing loop at any scale — partly answered

- **Framework:** positive and negative feedback loops; Sellers' engine, economy, ecology.
- **Gap:** inside an encounter every action pushes the needles up (v10.4, [taming](../taming/README.md)). Above it,
  the idle economy only grows. "Climb differently, not faster" says how progression should feel, but no loop enforces
  it.
- **Touches:** downward pressure (next step in taming: side effects, the animal's own moves, D187).

### 6. Strategy without a counter — open

- **Framework:** no dominant answer (no pure Nash equilibrium); yomi.
- **Gap:** the gauge has winning recipes ("mixed play wins"). Nothing in the animal answers how the player plays, so
  a solved recipe stays solved.
- **Touches:** a repeated trick wears out (v10.4), families that bend their rules.

### 7. Intentionality without a horizon — partly answered

- **Framework:** Steve Lee's player intentionality: choice, information, motivation, time; long-term goals without
  instructions (Hitman's target, landmarks); Leave Enough Room.
- **Gap:** time is covered (turn-based, D181). Information is open question 3 in build-principles (causality without
  walls of text). Motivation has no visible far goal: why tame *this* animal next, and what can be seen from far away.
- **Touches:** mysteries are visuals only; unlocks; Ground (Unseen → Wild → Caverns → Colony).

### 8. Progression or emergence: which leads — open

- **Framework:** Juul, games of progression vs games of emergence.
- **Gap:** idle is mostly progression; taming is meant to be emergence. Which one carries the game, and which frames
  the other, is not said.
- **Touches:** genre = taming encounter, mode = incremental idle (guide 17).

### 9. The team is not yet a network — open

- **Framework:** Will Wright's agents, networks, layers; synergy; group-level AI (Total War).
- **Gap:** what a team is (open question 4) is undefined, so pets don't yet need each other. Herds and packs could
  also decide as one.
- **Touches:** pet management loop, beastmasters (D190).

### 10. Store or spend — open

- **Framework:** Machinations engine; Sellers' engine (Burnout's boost).
- **Gap:** no point where the player chooses between spending now and saving for later. Without it, idle income has no
  interesting decision attached.
- **Touches:** resource management loop, taming attempts cost consumables (D185).

### 11. Economy and ecology meet — open

- **Framework:** Sellers' economy (reinforcing) vs ecology (balancing).
- **Gap:** the idle layer is an economy; the wild is an ecology. Whether the economy can unbalance an ecology, whether
  that shows, and whether the ecology pushes back, is open.
- **Touches:** colonies in every biome, Simulation pillar, storms (D172).

## Meaning

### 12. Lore without planned meaning, and no meaning emerging from play — open

- **Framework:** Blow's dynamical meaning (Braid: time mechanic, regret theme); mechanics as metaphor (Ico); procedural
  rhetoric (Bogost); narrative emergence (Missile Command, RimWorld).
- **Gap:** there is lore, but no decided meaning, and nothing in play is built to produce one.
- **Touches:** no killing (D171), failed attempts reveal (D185).

### 13. What the rules argue — open

- **Framework:** procedural rhetoric: every system argues something (Civilization: progress is good).
- **Gap:** taming argues "understand the animal"; the idle economy argues "harvest more". Whichever is louder is what
  the game says, and it is not chosen.
- **Touches:** climb differently, not faster.

### 14. Failure leaves no trace — partly answered

- **Framework:** persistence (Shadow of Mordor's nemesis); stories from systems (RimWorld).
- **Gap:** a failed attempt reveals information (D185), but the world doesn't remember it. How that fits "no
  per-entity tracking" is open.
- **Touches:** watchable replays (D178), cheapest hook.

## Frameworks not yet applied

Each is a lens still to hold against the design. When one exposes a gap, it becomes an entry above.

- Multiplicative design: set a goal, let systems supply the means; at least one solution and several (Breath of the
  Wild)
- Stealth's indirect means: awareness meters, noise and light as tools; the environment as the player's tool
- Constraints vs multiple solutions (puzzles, Zachtronics)
- Learned helplessness; withholding information to leave room (Nels Anderson, Leave Enough Room)
- Affordances: things that show their function (Norman)
- Consistent, precise rules as a precondition (Laidacker)
- Choice within fixed outcomes (Spec Ops); consequences shown back (The Witcher 3, Undertale)
- Aligning the player's state of mind with the avatar's (Half-Life 2)
- Strategic choices with narrative weight (Papers, Please)
- Changing what players expect from games (RimWorld: death as story; Civilization: turn-based for intent)
- Story directors and drama managers (RimWorld's storyteller, Façade)
- Systemic genres as models: immersive sim, roguelike, stealth
- Meta-patterns: resource, combat, construction, socio-political systems
