# What to build: the principle, the tool, the expectations

Supporting document for the [shape exploration](README.md). Current state only; how it got here is in
[log.md](log.md). Only sections marked **agreed** are settled.

## The principle: accessible, and never boring, through systems

Slay the Spire is the model: easy to play, impossible to master, and it gets there through systems rather than
content, which makes the dev effort valuable. The model is the principle, not Slay the Spire's structure (runs, a
deck, a map, fights); a run structure is not chosen.

**Why it is easy to play, and what that is in this game**:

| Slay the Spire | In this game |
|---|---|
| Simple verbs: play a card to attack or block | "Casual during play" ([brief.md](brief.md)) |
| Every enemy's intent is shown before the player acts | Consequences must be painfully obvious: the simulation shows what it is about to do |
| No time limit | The cerebral side of the map, and "peaceful" |

**Why it is hard to master, against this game's audience** (Discovery 30%, Strategy 30%, Power 20%, Story 10%,
Challenge 10%; see [README.md](README.md)):

| Slay the Spire | Motivation | Fit |
|---|---|---|
| Random rewards and layouts that the player must adapt to | Discovery and Strategy | the core of this audience (60%) |
| Planning several turns ahead | Strategy | fits |
| Ascension: higher levels punish small mistakes | Challenge | only 10%, and no killing: at most an optional dial on top ("difficulty as a dial", [03-consolidate.md](03-consolidate.md)) |

So depth comes from reading the system and adapting to the random draw, not from harsh losses.

**Content that combines, more than system instead of content**. Slay the Spire has a lot of content
(around 75 cards per character, four characters, over a hundred relics, three acts of enemies). The system makes
content multiply instead of add: a new card combines with every other card and relic. In a content-driven game each
new area adds one area. For dev effort: a small number of pieces, each of which changes how the others behave.

**The reference games split along this line** ([reference-games.md](reference-games.md)):

- **Combining, replayable:** Stacklands, Brotato, Super Auto Pets, 20 Minutes Till Dawn, Forager.
- **Played through about once:** A Short Hike, SUMMERHOUSE, Minami Lane. They succeed on mood and a short, polished
  experience: a different use of dev time.

The toy, an ecosystem simulation, is on the combining side: its parts change each other.

**The test for every piece** (from guide [09](../../guides/game-design/09-repetition-and-variety.md)):
does it change what the player decides? A species that makes the cave look different while the player does the same
thing is more content, not more depth.

## The tool: a system simulator and optimizer

A planned tool that makes balancing and the complexity of random permutations manageable. Combinations that multiply
can't be playtested by hand; a simulator plays thousands of random runs. Simple local models (few discrete states per
patch) are cheap to simulate in bulk. Its settings are knobs, searched the way the generators are tuned.

It gives, before there are players, a view like the one Slay the Spire's developers got from early-access data (card
pick and win rates).

**What it can see**:

- **Dead and dominant pieces:** a species, card or upgrade that never matters, or one that wins regardless.
- **Bad seeds:** random starts that are unwinnable or trivially easy, and the spread between seeds.
- **Runaway and collapse:** ecosystems that tip into one state whatever the player does.
- **Whether decisions matter:** a sensible bot and a random bot on the same seeds. If their outcomes are close, the
  player's choices don't change much. This is the measurable form of the test above.

**What it can't see**: whether it is fun or readable. A bot doesn't mind a hidden consequence or a flat
turn; those need the user, and players.

**Every run can be watched (agreed).** A headless batch nobody can watch can't be verified to test the right thing,
so:

- **One core, two speeds:** the simulator and the playable view run the same rules core; headless is the same game
  without drawing, at full speed.
- **Every run replays:** a run is its seed plus the bot's actions, and the rules are deterministic, so any run from a
  batch opens in the view and plays back exactly.
- **The report links to runs:** every number comes with its runs (best, worst and a typical seed, and an example of
  every flag), one click from watching it.
- **The bot shows its intent** in the view before it acts, the way an animal telegraphs.
- **Watch first, batch second:** batches start only after the bot has been watched on a few seeds and plays sensibly.

**What its questions depend on**: the audience. "Never boring" for a Discovery-and-Strategy player is a
different number than for a Challenge player.

## Building it: one component at a time (agreed)

The lifecycle is not simulated end to end first. Many co-dependent, vaguely defined mechanics with little content,
run together, give results nobody can trace to a cause. Each component is fleshed out on its own first:

- **Its own small question,** with pass and kill conditions, run in isolation. Its neighbours are stubbed with fixed
  inputs (taming gets a given team and a given animal, no food chain behind them).
- **Real content before simulating:** a handful of concrete pets and animals with numbers, enough to test whether the
  component produces decisions.
- **Wired together only once each one holds.** An end-to-end simulation comes last, if it is still needed.

**Order:**

1. **Taming:** the most defined piece ([idea-taming-and-breach.md](idea-taming-and-breach.md)) and the core decision,
   where the toy feeling within seconds has to come from. Small enough to watch whole.
2. **Scouting:** team setup, then an automatic run in the simulation.

The food chain and the colony are not new components: the ecosystem system already works in the b4 prototype, and a
colony is the same simulation, auto-harvesting. What they need is procedural content and balancing.

## Expectations of a good game (agreed)

**Tension–release cadence**

- Each win is progress.
- Release is not rest but a very different kind of challenge: switching to another pillar.
- There are also breathers, and places of tranquility: intensity drops altogether. Release and breather are two
  different things; the game needs both.
- The pillars are distinct and distant, or the cadence doesn't work. This matches the main finding in
  [findings.md](findings.md), the swing between pillars.

**Gameplay loops**

- The core is simple, and the fun toy feeling is reachable within seconds of loading the game. Not "fast" as in quick
  hands: for this audience the core is a small decision; speed, if any, lives in another loop.
- The core gives an "I've got this" feeling.
- Supporting loops add progress and structure.
- Side loops add release and relatedness.
- The loops average up to the audience's motivation profile, **and** every large share of the profile has a loop near
  it: two loops can average to the right spot while serving none of its motivations.
- Picking the game up again is not overwhelming.

**Mechanics depth**

- Few rules, infinite combinations, through a dense interaction graph between systems, **with every interaction
  visible.** A dense graph produces hidden consequences by nature; readability keeps the depth accessible.
- **Readability:** the system shows what it is about to do before the player acts (Slay the Spire's enemy intents).

**Difficulty**

- Input randomness is fun; output randomness is frustrating.
- Failures are near misses and actionable lessons.
- Lessons carry over to the next attempt; that is what mastery is.
- **The player chooses the cost of failure and when to face the next challenge,** with no constant pressure while
  preparing. The game does not adjust difficulty silently, which would be a hidden consequence. (Slay the Spire's
  Ascension; "difficulty as a dial".)

**Learning**

- Teach through directed experience, not abstract instructions.
- There is no learning under stress, so learning happens in the release and the breathers: the tension–release
  cadence is also the teaching cadence.
- Every action gets an immediate signal, and every delayed consequence can be traced back to its cause. For a
  Discovery-and-Strategy audience, delayed consequences are where strategy comes from, as long as they are traceable.
- New rules arrive one at a time, after the previous one is understood.

## Direction: a taming game

- **Theme: ecology.** Nothing the player uses is technology; every tool, trait and loadout piece is a living thing.
- **A taming game.** The player finds procedurally generated living things, from slime mold to an Arrakis-scale sand
  worm, raises them, and sends them on excursions.
- **Grinding is the difficulty setting.** Every pillar lets the player beef up for its challenge, so anything that
  feels hard can be made easier without a slider.

## Pillars

Three pillars, drawn on [map.html](map.html) as equal circles, set apart far enough to give release from one another.
They differ inside (one core loop, or two supporting loops, plus one or two side loops) but weigh the same.

| Pillar | Where | Role |
|---|---|---|
| P1 The Unseen | around 1a, 2a, 1b, toward Challenge | Strategy, Power, Challenge: scouts open an area never entered before, and beastmasters tame its fauna; it becomes Wild. Difficulty scales with progress, at steps the player chooses |
| P2 Prospecting | 14's height, 25's column, on the line from the audience to Story | Discovery and Story, the most kinetic pillar: exploring the world, flagging new areas to wake, spending time in woken caverns to collect intel, and bringing flora and fauna home |
| P3 Cultivation | around 2b, 17, 8, 3 | The simulation: natural enclosures for the living things, to farm resources, or to tame and level them for excursions |

Each pillar has a limit that is visible in the world and raised by what another pillar delivers:

| Pillar | Limit |
|---|---|
| P1 | the strength of the animal to tame: the stronger it is, the longer the taming, the stronger the team and the more food it needs |
| P2 | the conditions of each cavern (dark, flooded, toxic, hot, overgrown): only creatures with the matching traits get through |
| P3 | the palette: the simulation holds only the living things brought home |

Flows between the pillars (P3 is the hub):

- **P2 → P1:** new areas to wake.
- **P1 → P2:** the woken area, now Wild, for the foragers to study.
- **P2 → P3:** flora, collected by the foragers on field trips.
- **P1 → P3:** fauna, won by the beastmasters.
- **P3 → P3:** resources to host and level the flora and fauna.
- **P3 → P2:** foragers, the pets that catalogue a woken cavern and bring its flora home.
- **P3 → P1:** scouts, the pets that go first and open an area, and beastmasters, the pets that tame its fauna.

**Categories of pets:** economic, forager, scout and beastmaster.

**Flora:** all of it plays a systemic role; the economic plants also generate resources.

**Fauna is won by a peaceful pull, not a violent push.** The beastmasters face an animal in a kind of battle; a win means
the animal is tamed, a loss means it decided to stay. Coercion is allowed: it isn't brutal violence, the way a vet
sometimes restrains an animal to save it. Nature is not romanticised. Killing stays out. To tame, the beastmasters need:

- protection from the area's environment;
- something that intrigues the animal;
- a way to generate or deliver food for it. Nature is not romanticised: prey animals count as food.

The stronger the animal, the longer the taming takes, and the stronger the team and the more food or prey it needs.

**The engagement is the core gameplay and the most critical element of the game (agreed).** The bar: as easy to
start and as hard to master as Slay the Spire, as strategic and intriguing as Sonny, as free as Noita's wand building. Noita's freedom comes from the same root as
Sonny's depth: spells have several effects, and those effects interact, multiply and counteract one another, with each
other, the player, the environment and the enemy.

**One engagement: taming (agreed).** Scouting is not a second engagement, which would make two games:

- **Scouting is team setup, then an automatic run in the simulation.** The scouts stay close to an animal long enough
  to read its rules and moves. The decision is the match: which scouts can stay in this cavern and get close to this
  animal. The result shows what was learned, what wasn't, and why.
- **The kit is built before the taming, not during it.** The player arrives with the knowledge scouting brought back.
- **Failure is not death:** the animal got away, and some bait was consumed.

**The animal's card (agreed).** Each animal has a card of its rules and moves. Learning stays abstract, for a
simpler game, not a realistic one:

- **Observation can fill everything.** Scouting fills the card's lines, even for things that didn't happen in front
  of the scouts. When there wasn't enough time to observe everything, the card keeps gaps, and that is fine, even fun.
- **Engagements put the numbers on.** A taming fills in thresholds and cooldowns, and fills the gaps scouting left on
  the first attempt. Failed attempts reveal what scouting can't, so players are expected to try a new animal several
  times, and every attempt buys knowledge. Attempts cost consumables, some from earlier tiers, but not in a punitive
  way.
- **Shown, not told.** A line fills when the animal does the thing, with a number where there is one. Gaps show as
  blanks, so the player sees what is still unknown and can decide to try anyway. A failure says why it failed (it fled
  when fear reached 7), which fills a line and points at the fix.
- **Animals come in families that share rules,** so one animal teaches the next. The game is not scripted: a family is
  a shared set of rules the generator draws animals from, and learning carries over because the rules repeat.
- **Late game: an animal can bend its family's rules.** The card has taught the player to read, not to memorise.

**Taming plays like a deck-builder's combat, with simpler UX (agreed):**

- **Cooldowns instead of a deck and a shuffle.** The player never has to remember when a card comes back into play.
- **No luck, only strategy,** as in Sonny.
- **The animal telegraphs its moves,** sometimes several moves ahead.
- **Moves have several effects each;** that is where the encounter's complexity comes from.

**Truly strategic, never under pressure (agreed):**

- **Turn-based,** with no time pressure.
- **All the cards are on the table,** and the cooldowns are visible, WoW style.
- **Environmental effects too** are on the table, turn by turn, with their timing visible.
- **The player acts every turn,** never an auto-battle. Super Auto Pets makes pets' effects on each other the primary
  strategy, as here, but its auto-battle means playing the whole fight ahead in your head, like chess: too hard, and it
  draws only a narrow niche.

Idea, not decided: real-time engagements unlocked in meta-progression.

**The taming gauge (agreed).** Intuitive and familiar, even for small kids: only what everyone already knows
about animals.

- **One gauge, willingness to befriend us, 0–100%, in three zones:** flee or attack, neutral, friendly.
- **Motivations add up to the 100%:** a snail is safety and food; a bear is food, safety, curiosity and playfulness.
  Each motivation has its own zones, needle temperament (calm to jumpy) and decay.
- **Each animal draws its own zones.** A snail can just be picked up; a flea flees at anything; a bear is friendly
  only near the top. How easy an animal is to catch belongs to the animal, not to its tier.
- **A need can be filled:** a full animal ignores more of the same.
- **Fear is one motivation,** read through the animal's role: prey flees, a predator attacks (startled, territorial).
- **Pet actions and consumables act on each motivation separately,** through their main and side effects. That is
  where the game's fun comes from.

**Animals live in a trait space, not a list of families (agreed).** Readable because it has two kinds of dimension:

1. **Behaviour axes:** a few discrete values, each value one rule the player can learn.
   - **Diet:** plants, anything, meat.
   - **When scared:** flee, hide, freeze, fight.
   - **Social:** solitary, pair, group.
2. **Stats:** numbers that tune within those rules.
   - **Size and strength,** **agility,** **intelligence,** **nerve** (shy to curious).

The values are a first set. Families are names for common corners of the space (herd prey: plants, flee, group). The
direction: an animal's traits add up to its behaviour and stats, and, once tamed, to its skills as a pet. How they
translate into animal behaviour and pet skills is to be decided.

**The animal's behaviour (to test).** The animal acts, and its moves come from its motivations, not from a separate
move list: hungry, it goes for the nearest food (maybe the bait); curious, it inspects a pet; scared, prey edges
toward the exit and a predator goes for a pet; bored, it wanders off; friendly, it comes close. Its behaviour is the
gauges made visible, the telegraph follows from known decay, and an exaggerated rule is an extreme motivation
profile. The toy checks whether this is fun and simple enough.

Idea, not decided: showing the animal's state through basic procedural postures. A major effort for its value, so
handled with care.

**Routes into a tame come from different pillars (agreed).** Taming wild bait one by one is a major pain point,
worst with a food chain of two or more tiers, so the player gets several, very different routes. A different shape
means a different pillar: each route is prepared in its own pillar and paid out in the taming, and taming without
bait is as hard as with it, in another pillar's shape.

| Pillar | Route |
|---|---|
| Cultivation | bait from the colonies: livestock and crops from colonies in the same tier. Recreating the prey's environment in a colony stays only if it is really simple, for the player and to build; otherwise it is dropped |
| Prospecting | what the foragers and scouts bring back: flora that acts on the animal (psychoactive crops lower suspicion), and the knowledge that makes a taming without bait possible |
| The Unseen (the taming itself) | team skills that use what is on the board: driving wild prey toward the predator is one skill to have in a team, not a route of its own; skills that make the animal accept something else as food |

- **The gauges are where the routes meet.** Food fills hunger, Prospecting's finds act on suspicion and intrigue, and
  team skills act on fear and position. Each animal makes one route expensive, so the player switches pillars.
- **No breeding before a colony:** a biome's fauna breeds only in a colony there (see *Why every biome gets a colony*).

First ideas for accept-something-else skills, not decided: "hunger", which makes everyone hungry; "smells like", which
puts the local prey's smell on something else.

The pattern behind it, and a worked example: [idea-taming-and-breach.md](idea-taming-and-breach.md).

**Areas are asleep until woken.** Under the fog of war the simulation is suspended; an area looks alive only through
ambience, particle effects and shaders crossing the fog, never text or a symbol. Once woken, the foragers spend
time there to collect intel; without it the player sees the visuals and nothing more.

Beefing up, per pillar: P1 levels the beastmasters longer; P2 brings more foragers, better matched; P3 runs more generations.

**Tranquility lives in side loops,** around any pillar, not in a pillar of its own. Examples: a vivarium or zoo;
rare, beautiful event sightings during exploration; a riskless strategy-testing loop.

## Ground: Unseen → Wild → Caverns → Colony

The pillars are three states of the same ground, and every area moves through them in order. Each transition has its
own cost and challenge. Growth always has a clear frontier, so complexity does not explode: behind the frontier,
colonies settle into stable idle play.

- **The colony is not one place.** Biomes stay where they are; the player claims an area in place as a colony and does
  the economic play there. Nothing is carried home and rebuilt. Scouts, beastmasters and foragers leave from and return to any
  colony area.
- **Travel between colonies** is a teleport animation, or the mycelium travel network from the b-builds if it is kept
  and polished. No pathfinding either way.
- **Biome connections are limited,** which keeps growth manageable. Biomes come in tiers; baits and crops from the same
  tier give a heavy incentive to explore all of a tier before moving on.
- **A tier is depth.** Biomes are a descent into the depths of the moon: amorphous blobs with slightly randomized
  boundaries, not cake layers. Deeper
  biomes are likely more complex: more environmental threats and a deeper food chain.
- **No deep graph of cross-biome dependencies.** Needing baits from many earlier biomes is a Factorio-like mechanic,
  and much less intuitive here: a drag. Unless that is fixed, the dependency stays shallow. Team synergy is the more
  enjoyable mechanic, and carries the depth instead.
- **Resistances gate, abilities delight.** Resistances are a good gatekeeper but no fun at all, so pets carry exciting
  abilities that keep them in a team even with no resistance to the biome: psychoactive crops or bait (they lower the
  animal's suspicion), mating-dance imitators, resistance copiers, buffers, healers, burrowing super-prospectors.
  Lowering how picky an animal is about its food is another.

### How an area moves

**Every living thing goes through five stages:** unseen → wild → studied → foraged → cultivated. Fauna is never
foraged on its own: the beastmasters tame it, with the player taking part, so its stages are unseen → wild → studied →
tamed → cultivated.

**Terrain goes through the same stages:** its elements (ores, liquids, physical attributes) are studied and foraged by
the foragers; taming the top predator turns it into Caverns, and a colony cultivates it.

1. **Scouts open an Unseen area:** everything in it goes from unseen to wild.
2. **Foragers study the food chain bottom-up,** on their own.
3. **Studied flora is foraged,** on its own.
4. **What is foraged can be used in taming.** A creature can't be tamed until its natural diet is foraged.
5. **Tamed animals are used to tame predators:** the beastmasters must tame enough prey to capture a predator. A deep food
   chain needs exponentially more prey.
6. **Taming the top predator turns the area into Caverns,** ready for a colony: a triggered outcome, not a decision.
7. **The foragers build a colony there:** a player decision; its flora and fauna become cultivated.
8. **A cultivated area harvests itself,** both crops and prey.

**Only what needs a player decision gets a name:**

| Decision | Condition |
|---|---|
| Send scouts to open up an Unseen area | |
| Tame a creature | its natural diet is foraged |
| Tame a predator | enough of its prey tamed; a deep food chain needs exponentially more |
| Build a colony (foragers) | the area's top predator is tamed |

Studying and foraging run on their own, and a cultivated area harvests itself, so none of them needs a name.

**Foragers have several roles:** they study (prospecting), forage, bring home flora samples, and lift the fog of war.

**Complexity is depth and lore, not uninformed decisions.** A few principles apply to a few concepts, most of it runs
on autopilot, and it reads as natural.

**The hands-on work is the pets.** Levelling the teams so they are strong enough for the next Unseen; balancing a food
chain from minerals up to apex predators, across several biomes; keeping good forager, scout and beastmaster teams, probably with
synergising traits.

### Why every biome gets a colony

- **Tames have no native colony at first.** A tamed animal survives outside its native environment, but grows and
  reproduces only in ideal conditions. That is how the game tells the player to found a colony in every biome.
- **Tuning:** in a colony the player pushes the biosphere's balance into a more productive state.
- **Wonder:** awesome, powerful, spectacular tames; the unique mechanics of each biome; a chance at unique wonders (a
  breather loop).

### Gameplay loops (agreed)

A loop is something the player directly controls. Passive things (colonies harvesting, foragers foraging, scouts
gathering intel) are spectacle and lore, not loops.

| Loop | Role | Feels like | What the player does |
|---|---|---|---|
| Engagement | core | a card battle | engages an animal, whether the outcome is learning or taming; tests teams against the simulation |
| Pet management | core | a management game | builds teams of foragers, scouts and beastmasters, levels pets, sends them on missions |
| Resource management | support | idle farming | sees what is running low and steers the idle collection toward it: better forager teams, foragers split across the right biomes, more colonies in the right biomes |

**The Simulation pillar (passive).** The passive things together make a fourth pillar on the map, between
Discovery, Design and Story: the ecosystem running while the player is away, as spectacle and lore. The three active
loops sit in a dense zone toward Strategy; Simulation balances the pillars around the audience.

Open: whether pets level up by using their skills.

## Game shape: an incremental idle game (agreed)

You come in, move the needle, and reap the rewards: resources, lore, unlocks, and the taming game.

- **A session is one or more runs.** A run is anything that pushes the needle: levelling up pets, changing and testing
  teams, reviewing new info on scouted animals, deciding what to tame and with what strategy, and the taming itself.
  It is not a roguelike run.
- **The idle layer keeps working while the player is away:** colonies auto-harvest, foragers forage the Caverns, and
  scouts gather intel. A session starts by collecting what they brought back.
- **Taming is the one hands-on game** inside the idle frame.
- **Quantity piles up on its own; complexity enters only when the player goes looking for it.** More of the familiar
  and bigger numbers make coming back a reward, not a burden. Unlocked items that keep entering every choice would make
  later sessions more complex even after the player has forgotten much of the game (Magicraft's spells and trinkets);
  unlocked mechanics a player can ignore cost nothing. The variant that escapes it: the player curates the pool
  (Vampire Survivors' "seal").
- **The simulation gets all the time it needs,** because it runs while the player is away. Coming back to see what the
  ecosystem did on its own is surprise from discovery.

**Long-term progression: climb differently, not faster.** As in Slay the Spire, progress opens new, harder, more
complex challenges that ask for more mastery (deeper tiers, animals with more motivations, families that bend their
rules), not multipliers that make the same climb faster. The player chooses when to face them, as with Ascension.

## Open questions

1. **What should the simulator tell first?** The first thing the user can't judge by playing alone.
2. **How does a player who has mastered the game show it,** without beating anyone or anything? In Slay the Spire it
   is winning at higher Ascension.
3. **How does the causality get across without walls of text?** Mysteries are visuals only, and intel comes from
   time spent in a woken area.
4. **What is a team?** Its size, its slots, and how traits combine.
5. **What does levelling cost, and what does it raise?**
