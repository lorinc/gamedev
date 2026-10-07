# Gaps: what the parts don't answer yet

A TBD list. Each entry is a place where the game's parts (taming, idle, simulation, pets) don't yet fit together, as
exposed by a known design framework. Entries are extended and resolved until the parts converge into one coherent
game. A resolved entry moves its answer into [build-principles.md](build-principles.md) (or the taming folder) and
stays here as a one-line pointer.

Frameworks are from [guide 20](../../guides/game-design/20-systemic-games-emergence.md) unless noted.

Status: **open** · **partly answered** (something in the design touches it) · **resolved** (answer lives elsewhere).

## 1. Taming is a duel; the systemic part is passive — open

- **Framework:** a systemic game is components that act on each other, not only on the player (Laidacker); Breath of
  the Wild's chemistry engine; Far Cry 4's "anecdote factory".
- **Gap:** animals acting on animals lives in the Simulation pillar, which is spectacle. The taming encounter, where
  the player acts, is closed: the player's team against one animal. The depth the frameworks promise comes from parts
  interacting, and the parts don't interact where the player decides.
- **Touches:** trait space (D193), fight-or-flight vs team strength (D195), simple local models.

## 2. No balancing loop at any scale — partly answered

- **Framework:** positive and negative feedback loops; Sellers' engine, economy, ecology.
- **Gap:** inside an encounter every action pushes the needles up (v10.4, [taming](../taming/README.md)). Above it,
  the idle economy only grows. "Climb differently, not faster" says how progression should feel, but no loop enforces
  it. Nothing named pushes back on the player's economy.
- **Touches:** downward pressure (next step in taming: side effects, the animal's own moves, D187).

## 3. Strategy without a counter — open

- **Framework:** interesting decisions with no dominant answer (rock-paper-scissors, no pure Nash equilibrium); yomi.
- **Gap:** the gauge has winning recipes ("mixed play wins"). Nothing in the animal answers how the player plays, so
  a solved recipe stays solved.
- **Touches:** a repeated trick wears out (v10.4), families that bend their rules.

## 4. Intentionality without a horizon — partly answered

- **Framework:** Steve Lee's player intentionality: choice, information, motivation, time; long-term goals without
  instructions (Hitman's target, landmarks); Leave Enough Room.
- **Gap:** time is covered (turn-based, D181). Information is open question 3 in build-principles (causality without
  walls of text). Motivation has no visible far goal: why tame *this* animal next, and what can be seen from far away
  that pulls the player toward it.
- **Touches:** mysteries are visuals only; unlocks; Ground (Unseen → Wild → Caverns → Colony).

## 5. What the rules argue — open

- **Framework:** procedural rhetoric (Bogost); Blow's dynamical meaning, motif aligned with mechanic.
- **Gap:** taming argues "understand the animal". The idle economy argues "harvest more". Whichever is louder is what
  the game says. Not yet chosen, so it will be decided by accident.
- **Touches:** no killing (D171), failed attempts reveal (D185), climb differently not faster.

## 6. Progression or emergence: which leads — open

- **Framework:** Juul, games of progression vs games of emergence; Breath of the Wild puts emergence inside a
  somewhat linear progression.
- **Gap:** idle is mostly progression; taming is meant to be emergence. Which one carries the game, and which one
  frames the other, is not said.
- **Touches:** genre = taming encounter, mode = incremental idle (guide 17).

## 7. Failure leaves no trace — partly answered

- **Framework:** persistence (Shadow of Mordor's nemesis); stories from systems (RimWorld).
- **Gap:** a failed attempt reveals information (D185), but the world doesn't remember it. Whether an animal that got
  away changes, and how that fits "no per-entity tracking", is open.
- **Touches:** watchable replays (D178), cheapest hook.

## 8. The team is not yet a network — open

- **Framework:** Will Wright's agents, networks, layers; synergy (Hearthstone, MMO roles); group-level AI (Total War).
- **Gap:** what a team is (open question 4) is undefined, so pets don't yet need each other. Herds and packs on the
  animal side could also decide as one, which is cheaper and more readable.
- **Touches:** pet management loop, beastmasters (D190).

## 9. Store or spend: the engine pattern — open

- **Framework:** Machinations engine (stockpile now or spend later); Sellers' engine (Burnout's boost).
- **Gap:** consumables and pet levels are resources, but where the player chooses between spending now and saving
  for later is not designed. Without it, idle income has no interesting decision attached.
- **Touches:** resource management loop, taming attempts cost consumables (D185).

## 10. Economy and ecology meet — open

- **Framework:** Sellers' economy (reinforcing) vs ecology (balancing).
- **Gap:** the idle layer is an economy; the wild is an ecology. Whether the player's economy can unbalance an
  ecology, whether that shows, and whether the ecology pushes back, is open.
- **Touches:** colonies in every biome, Simulation pillar, storms (D172).
