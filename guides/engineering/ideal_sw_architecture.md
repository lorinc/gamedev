# Ideal software architecture for a living-cave simulation

What an architecture needs for a game like b4 to run a large ecosystem (bugs, moss, gas, slime, predators…) on a
budget phone's browser. Written 2026-09-28 from a conversation during p11, after b4.77 was left running and
grew 3,000+ moths. It's a direction for a future architecture spike, not a plan for the current throwaway
prototype.

Numbers marked *(estimate)* are my own ballpark, not measurements. Measure before designing around them.

## The question

> "With the proper software architecture, a game like this could run a simulation with millions of entities on a
> potato's browser. Right? What makes a good architecture?" (the user)

**Short answer:** millions of *things that look alive*, yes. Millions of *individually thinking agents* at 60 Hz,
no.

- Plain JS over typed arrays manages about 10–100 ns per agent per tick, depending on how much it looks around
  *(estimate)*. A million agents: 10–100 ms a tick, over the ~16 ms a whole frame allows on a good machine.
- Games that feel like millions simulate **densities** and draw **individuals only where you look**.

## Two problems, not one

The b4.77 runaway was **not** a performance problem. Nothing limits how many bugs an area can hold:
- every 30 s each built node with gas hatches a moth, for free;
- slime keeps gas from ever running out;
- predators are capped at one per 4 nodes, and can't keep up.

So the architecture has to answer two separate things:

1. **Speed:** how the sim stays cheap as the counts grow (sections 1–5, 7).
2. **Stability:** how the ecosystem stays bounded whatever the counts (section 6).

## 1. Shared fields (the "bus")

The user's guess: a simulation bus that tracks values per cell / area, which entities query for environmental
data instead of each working it out itself. **The idea is right.** The usual names are *shared fields*, a
*blackboard*, or *stigmergy* (agents coordinating through the environment). "Bus" usually means messages; b4
already has that part: `g.events` carries messages from the sim to the view.

A field is a grid of values the whole sim reads:

| Field | Resolution |
|---|---|
| gas | per station (cave share; already exists: `g.gas`, `stations()`) |
| moss / cover | per 16 px block |
| bugs, tamed and wild | per block |
| ore and crystals, unmined | per block |
| fire (burning pixels) | per block |
| slime | per block |

Rules for fields:

- **Written once per tick, or only where something changed** (dirty blocks), then read by everyone.
- **Coarse by default.** A field update must cost less than the scans it replaces: per block or per cave, not
  per pixel, unless per pixel is the point.
- **Read from last tick, write to next tick** (double buffering), so the order systems run in doesn't change the
  outcome. It also keeps determinism simple for P2P.
- **Multi-resolution when needed:** pixel → block → cave. A question asked of an area reads the level that
  answers it.

### Where b4 scans on its own today (b4.77)

| Code | What it does per call | Field that replaces it |
|---|---|---|
| swarm.js `fireNear` | each bug walks the whole burning list | fire per block |
| swarm.js `unitNear`, `pull` | each bug scans the r² pixels round it for ore | ore per block (then a small scan only where the block has any) |
| predators.js `spawn` | compares every bug with every other bug | bugs per block |
| slime.js `updateSlime` | scans all ~126k pixels every 0.5 s | a list or bitmap of live slime pixels per block |
| beasts.js `moss` | counts cover in a 12 px circle per candidate node | cover per block |

swarm.js `vineNear` is already the pattern: a per-block vine count built once a tick, shared by every query.

## 2. Data layout: numbers in arrays, not objects

- **Struct of arrays:** an entity is an index into typed arrays (`x[i]`, `y[i]`, `state[i]`, `timer[i]`), not an
  object with fields.
- **No allocation per tick:** no `{ x, y }` objects in hot loops, no `filter`/`map` producing new arrays each
  tick, preallocated capacity, dead entries reused (a free list or swap-remove).
- **Why:** no garbage-collection pauses, and a memory layout the CPU streams through. This is usually the single
  biggest speed step in JS.
- **Save/load** stays easy: the save already run-length-encodes `Uint8Array` layers; other typed arrays need the
  same treatment.

## 3. Level of detail in the simulation

The user's second guess, "the sim could work with flocks or density vectors or whatever representation fits best,
instead of entities", **is this.**

- **Near you:** individual bugs, moths, predators, drawn and simulated one by one.
- **Off-screen:** an area is just numbers (bugs 37, moss 0.6, gas 12), updated by rates.
- **Materialise on entry:** when you walk into an area, its numbers become individuals, placed plausibly. When you
  leave, they fold back into numbers.
- **Level of detail in time too:** far areas update once a second, not 60 times.
- **Invariant:** both representations obey the same flows (section 6), so an area simulated as numbers ends up
  where it would have as individuals, on average.
- **Superseded by the user's simpler model (D169, 2026-09-29):** off-screen areas don't evolve at all. Their state
  freezes and only passive resource production is calculated; the real simulation runs only where the player is.
  See `concepts/callisto_design.md` → *The genesis freeze*.

b4's tamed swarm is already halfway there: abstract workers, no pathfinding, cheating freely (see the
incremental-not-deep-sim direction in the project notes).

## 4. Simulation separate from drawing

b4 mostly has this already: a fixed deterministic tick, events out to the view, and a renderer that interpolates
between ticks. The next steps:

- **The sim in a Web Worker,** so drawing never waits on it.
  - **Constraint:** sharing memory between threads (`SharedArrayBuffer`) needs cross-origin isolation headers
    (COOP/COEP). GitHub Pages and most game portals can't set them (see [03](03-web-portal-requirements.md)).
  - **So:** pass snapshots with `postMessage` (transferring the buffers), which costs a copy or a swap per frame.
    Check the cost before choosing.
- **The view never mutates sim state.** It reads a snapshot and the events.
- **Draw on the GPU, in batches:** one draw call for all bugs (instanced sprites), not one gradient per bug.
  Canvas2D with a radial-gradient halo per bug is likely the real potato-killer at 3k moths, more than the sim
  *(estimate: measure)*. This fits the planned move to PixiJS/three.js; until then, no Canvas2D render tuning
  (a standing decision).

## 5. A grid index for "who's near me"

- Once a tick, sort entities into block buckets (a counting sort over their block index: two passes, no
  allocation).
- "Bugs within 24 px" then means reading the few buckets the circle overlaps, not comparing against everyone.
- The same buckets give the bugs-per-block field (section 1) for free.

## 6. Stability as architecture

Speed doesn't stop runaways; rules about flows do.

- **Conservation:** a stock (gas, ore, bugs) changes only through declared sources and sinks. The control-panel
  doc ([player-influences-but-system-has-its-own-trajectory.md](../../concepts/player-influences-but-system-has-its-own-trajectory.md))
  is already that map; the code could enforce it, for example with a small flow API that every change goes
  through and that can be logged per tick.
- **Every stock needs a sink that can't saturate.** Gas's only sink is moss, which stops once the back wall is
  covered: that's why gas climbed to 7,000 in 15 minutes in b4.77.
- **Carrying capacity per area:** births ∝ food × (1 − density ÷ capacity), with density read from the
  bugs-per-block field. Hatching slows as an area fills, whatever else happens. This is the "nature
  self-balances: surplus raises the consumer population" idea, made a rule instead of a hope.
- **Consumers scale with surplus:** predators and the planned ore-eating mouse spawn from field values (bugs per
  block, unmined ore per block), so their numbers track the surplus they exist to eat.
- **Watch the loops:** every loop in the control-panel doc is marked reinforcing or balancing. A reinforcing loop
  with no balancing loop on the same stock is a runaway waiting to happen.

## 7. Measure per system

- **A time budget per system** (ms per tick for gas, slime, swarm, bugs, predators, render) on the dev panel, so
  it's visible which system eats the frame.
- **Counts on the dev panel** (bugs, moths, slime px, gas) with a short history, so a runaway shows as a curve,
  not as a surprise after an hour.
- **Headless measurement scripts,** like the ones used during p11: N minutes of sim at fixed seeds, reporting
  counts per minute. They caught the predator bug drain and the gas pulse.

## 8. A scenario engine: goals in, knobs out

> "What I would love is an engine, where I could run fast simulation or even optimizations. E.g. 'I want this
> terrain, these actors, this climate, and in 5 minutes, I want actor A overwhelm Actor B, and event C
> triggered'." (the user)

This is **goal-directed tuning**: describe a scenario and the outcome, and a search finds the knob settings that
produce it. A small version exists: `tools/knobsearch.js` searched the cave generator's knobs (random search, then
refinement, on 8 cores) until seed 18142's look came out steadily.

What it needs:

1. **A scenario file** (JSON):
   - the terrain: seed and map knobs;
   - the actors placed at the start: bugs, beasts, predators, pools, built nodes;
   - the climate: gas, liquid, moss;
   - which knobs the search may change, and their ranges.
2. **Goals as tests on the sim over time,** each returning a *distance*, not just pass/fail (a search needs a slope):
   - "by 5:00, tamed bugs > 3 × wild bugs";
   - "a fire starts between 2:00 and 4:00";
   - "gas never passes 500".
3. **A fast headless runner.** The sim is already deterministic and runs without drawing. At ~0.1 ms a tick
   (b4.77), 5 game minutes ≈ 2 s on one core, so 8 cores try ~4 settings a second, ~15,000 an hour
   *(estimate)*. Sections 1–3 would multiply that.
4. **A search:** random search then refinement, like knobsearch. Something smarter only if that proves too slow.
5. **Guards against cheating answers.** An optimiser will make "A overwhelms B" true by setting predator speed to
   1000:
   - knobs within sane ranges;
   - a small penalty for straying far from the defaults;
   - above all, every setting scored across several seeds, so it can't fit one map by luck.
6. **Readable output:** the winning knobs as a shareable URL (how the user already tunes), a per-minute count
   table per seed, and optionally which knobs mattered most for the goal.

**The same engine is a test harness.** A design rule becomes a scenario that runs on every build: "30 minutes
idle, bugs stay under 200" would have caught the b4.77 runaway before it was played. Worth adding to the checks
(see [02](02-pre-commit-and-release-checks.md)) once it exists.

**First version when it's wanted:** a throwaway `tools/scenario.js` for b4: a scenario plus goals, a search over a
few chosen knobs on 8 cores, printing the best URL and the count curve. First test case: the runaway ("no more
than 200 bugs in 30 minutes").

## Keep what already works

- **Deterministic ticks:** integer maths and a seeded RNG from the tick. Needed for P2P and for replays.
- **Knobs:** every constant on the dev panel, shareable by URL.
- **Events as the only way the sim talks to the view.**
- **Plain JS, JSDoc types, `tsc`, no build step, no runtime dependencies.** Nothing above needs a library. A GPU
  renderer (PixiJS/three.js) would be the first dependency, and needs its own justification and sign-off.

## Suggested sequencing

The current b4 is a throwaway prototype and the open question is the design, so no restructuring now.

1. **Now, cheap:** a carrying cap on hatching (a node hatches only while fewer than ~8 bugs are near it), and
   per-system timing on the dev panel. Optionally the first `tools/scenario.js` (section 8), with the runaway as
   its first test.
2. **When the loop feels right: an architecture spike, research first.** A write-up here (how existing games do
   fields, simulation level of detail and worker snapshots in the browser, with sources), then a lean build: the
   fields module, struct-of-arrays bugs, then simulation level of detail. Measure it against the last b4 build
   at the same seeds.
3. **With the renderer move:** GPU batched drawing and, if snapshots are cheap enough, the sim in a worker.

## Open questions

- How big can the "near you" window of individuals be on the floor devices (Galaxy A41, iOS 14) before the frame
  slips? Measure.
- Snapshot transfer cost per frame for the sim-in-a-worker option, without `SharedArrayBuffer`.
- Which stocks need hard conservation (gas, ore) and which can stay loose (moss, slime, cosmetic particles).
- How materialising individuals from numbers stays deterministic for P2P (seed each area's materialisation from
  its block index and the tick).
