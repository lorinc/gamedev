# What to build: the principle, the tool, the expectations

Supporting document for the [shape exploration](README.md). Current state only; how it got here is in
[log.md](log.md). Only sections marked **agreed** are settled; **candidate** = not chosen.

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

**What its questions depend on**: the audience. "Never boring" for a Discovery-and-Strategy player is a
different number than for a Challenge player.

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
| P1 The Unseen | around 1a, 2a, 1b, toward Challenge | Strategy, Power, Challenge: the pioneers wake a cavern never entered before; a successful push makes it part of the caverns. Difficulty scales with progress, at steps the player chooses |
| P2 Caverns | 14's height, 25's column, on the line from the audience to Story | Discovery and Story, the most kinetic pillar: exploring the world, flagging new areas to wake, spending time in woken caverns to collect intel, and bringing flora and fauna home |
| P3 Colony | around 2b, 17, 8, 3 | The simulation: natural enclosures for the living things, to farm resources, or to tame and level them for excursions |

Each pillar has a limit that is visible in the world and raised by what another pillar delivers:

| Pillar | Limit |
|---|---|
| P1 | the strength of the animal to tame: the stronger it is, the longer the taming, the stronger the team and the more food it needs |
| P2 | the conditions of each cavern (dark, flooded, toxic, hot, overgrown): only creatures with the matching traits get through |
| P3 | the palette: the simulation holds only the living things brought home |

Flows between the pillars (P3 is the hub):

- **P2 → P1:** new areas to wake.
- **P1 → P2:** the woken area, now part of the caverns and the foragers' domain.
- **P2 → P3:** flora, collected by the foragers on field trips.
- **P1 → P3:** fauna, won by the pioneers.
- **P3 → P3:** resources to host and level the flora and fauna.
- **P3 → P2:** foragers, the pets that catalogue a woken cavern and bring its flora home.
- **P3 → P1:** pioneers, the pets that go first and wake an area.

**Three categories of pets:** economic, forager and pioneer.

**Flora:** all of it plays a systemic role; the economic plants also generate resources.

**Fauna is won by a peaceful pull, not a violent push.** The pioneers face an animal in a kind of battle; a win means
the animal follows them back to the colony, a loss means it decided to stay. To tame, the pioneers need:

- protection from the area's environment;
- something that intrigues the animal;
- a way to generate or deliver food for it. Nature is not romanticised: prey animals count as food.

The stronger the animal, the longer the taming takes, and the stronger the team and the more food or prey it needs.

**Areas are asleep until woken.** Under the fog of war the simulation is suspended; an area looks alive only through
ambience, particle effects and shaders crossing the fog, never text or a symbol. Once woken, the foragers spend
time there to collect intel; without it the player sees the visuals and nothing more.

Beefing up, per pillar: P1 levels the pioneers longer; P2 brings more foragers, better matched; P3 runs more generations.

**Tranquility lives in side loops,** around any pillar, not in a pillar of its own. Examples: a vivarium or zoo;
rare, beautiful event sightings during exploration; a riskless strategy-testing loop.

## Candidate A: the short run that keeps only knowledge (candidate)

A short run where complexity does not carry over, only knowledge: Noita, Super Auto Pets. It follows from "picking the
game up again is not overwhelming".

**The antipattern: unlocks that grow the random pool.** Unlocked mechanics a player can ignore cost a returning
player nothing (Magicraft's mechanics). Unlocked items that appear in every draw cost them every run (Magicraft's
spells and trinkets): later runs get more complex even when the player has forgotten much of the game.

Refinements:

- **It is a matter of degree.** Slay the Spire also unlocks cards into the pool, but few, within the first hours,
  while the player is still active. The antipattern bites when the pool keeps growing after the player stopped
  tracking it.
- **The variant that escapes it: the player curates the pool.** Vampire Survivors' "seal" removes items from the
  random pool. As a rule: nothing enters the random pool without the player's say.
- **Power lives inside the run.** The audience's 20% Power usually comes from progression across runs. With only
  knowledge kept, each run needs a satisfying power curve of its own (the team in Super Auto Pets, the build in
  Brotato).
- **On the pool:** shape 10a ("Run: nothing kept", toward Challenge) paired with the knowledge loop, 26 (near
  Discovery). For this audience, what carries over is knowledge of the ecosystem's rules rather than execution skill,
  which pulls the shape toward 26.

**The tension with the simulation.** Short runs bring many restrictions, which are useful creative constraints, but
the simulated world needs time to run its course. Ways to fit its arc inside one run, without splitting the game into
two modes:

1. **Compress time:** few discrete states per patch let a generation take a second instead of a minute (Noita's world
   resolves in seconds). The speed is a knob.
2. **Shrink the space:** a small cave reaches its course within the run, and is easier to read.
3. **Set up, then watch it play out:** a calm phase, then the simulation runs its course fast. Pool shapes 17
   ("Pressure: deadline") and 24 ("One trigger"); it gives distant pillars and the toy feeling in seconds.

Which one works depends on what in the simulation needs the time (population growth, slow spreading, succession):
open. Candidate B takes the other route: the world keeps running between sessions.

## Candidate B: idle with prestige (candidate)

Incremental and idle games are popular now; the angle stays open. The b4 work already points this way (D164,
"intelligent idle game").

Reading:

- **Idle escapes the antipattern when what piles up is quantity, not complexity.** More of the familiar and bigger
  numbers make coming back a reward, not a burden. New rules entering the draw would still be the antipattern.
- **It dissolves the time tension from the other side:** the simulation gets all the time it needs, because it runs
  while the player is away. Coming back to see what the ecosystem did on its own is surprise from discovery.
- **It doesn't compete with runs: prestige is a run.** The question between the candidates is what survives the
  reset.

| | A: short run, knowledge only | B: idle with prestige |
|---|---|---|
| What carries over | only what the player learned | multipliers or unlocks, plus knowledge |
| Where Power lives | inside the run | across resets (the idle genre's main pull) |
| Simulation time | must fit inside the run | free: it runs while away |
| Risk | the simulation's arc too slow for a run | complexity piling up across resets (the Magicraft antipattern) |

With 20% Power in the audience, B has the more natural home for it.

## Open questions

1. **What should the simulator tell first?** The first thing the user can't judge by playing alone.
2. **How does a player who has mastered the game show it,** without beating anyone or anything? In Slay the Spire it
   is winning at higher Ascension.
3. **How does the causality get across without walls of text?** Mysteries are visuals only, and intel comes from
   time spent in a woken cavern.
