# Callisto: gameplay design (exploration, not decided)

Status: exploration, 2026-09-26. The system comes first; numbers, build steps and formats come later
(user: "Let's have a what-affects-what map first"). The world is in [callisto_lore.md](callisto_lore.md).

## Hard constraints (user, 2026-09-26)
- Input is **swipes, taps and holds** only.
- It works on **phone, tablet and PC**, at their resolutions and with their inputs.
- It **must please 6-year-old kids too.** For them it's **a pretty sandbox where exciting things
  happen**: they can have pretty pets, or burn stuff down, "like in the epic-awesome dan-ball Powder
  Game" (user). Balancing isn't their game. The **data room** with charts is for nerd players only.
- **No numbers competition** (user: "the most boring kind of user interaction").
- Casual: nothing punishing, and a reached milestone stays reached.

## Painfully obvious, or out of the graph (user, 2026-09-26)
"Hidden game mechanics with major consequences is NOT fun." And further: **anything that can have a
meaningful effect must be painfully obvious, even without paying attention to details.** This is the
"two kinds of random" principle ([guides/game-design/01-foundations.md](../guides/game-design/01-foundations.md),
point 8): known input randomness is fun; unknown output randomness is game-breaking. So **everything we
can't communicate very clearly is removed from the interaction graph.** It's the pruning test for every
element and every reaction.
- **Nothing people don't already know** (user). Clathrates become **colourful gas bubbles in ice**; the
  colour tells which gas, from **very few, very distinct gas kinds**. It's input randomness: "a cavity
  that will have gas X if I heat it up" is fun. "The farm I've been building for 4 days exploded out of
  the blue, f*** this game" is not.

## Model principle (user, 2026-09-26)
"I do not want to do Oxygen-not-included-level gas-heat-radiation simulation. 'All models are wrong, but
some are useful.' I want simple approximations that are intuitive, plausible, interesting, and have a
low local complexity. Meaning: you can fix a system by walking around and improving conditions, based on
a very few, local, intuitive inputs."

So: no fluid, gas or heat diffusion. The map below is the *story* of how things relate; the *model* is a
handful of local rules (see *A simple model*).

## Decided so far (user)
- **Bugs feed the hearth:** placed bugs carry dust to their den themselves.
- **Band numbers should drive base-design decisions:** more tamed areas, more ocean taps, more
  dust-gathering organisms. "Interacting, self-balancing ecosystems, but the player still needs to design
  the environment for them to be in the right balance."
- **Self-balancing through negative feedback loops**, because players can't be trusted to balance it by
  hand: "if a needle goes out of the ideal zone in one direction, the lichens start to feel very good,
  spread and eat up the isotopes… this kind of thing."
- **The ultimate goal:** an environment where Earth's ecosystem coexists with Callisto's in a natural
  balance, with ecological milestones along the way (as in Terraforming Mars).
- The player's identity: undecided.

## The character and the interaction model (user, 2026-09-26)

**The character stays, with a bounded role:** exploration, discovery and bridging systems. Terraforming
and large-scale resource gathering are **not** its role. (User, on a god-mode/character split: "I do not
want to solve a game design problem by saying 'let's do it all'.")

**The problem it solves:** today's swipe controls feel good but are arbitrary: "I want to climb this slope
down, but I'm 2px away, so my char took my SW swipe as 'dig diag'. That's BAD." And playtests with kids,
on phone and PC: none of them found the full range of interactions.

**The hidden path lattice (user's idea):**
- The terrain generator also makes a hidden lattice of possible paths (tunnels, slopes, bridges), from
  the random terrain, so it's not a grid. Its nodes are **divergence points**.
- Choosing a path **collapses** the options: the path becomes the environment, and nearby candidates go
  (no parallel tunnel one block below an existing one). Changes happen only at divergence points.
- Claude's addition, not decided: natural cavities are nodes too, so the lattice doubles as the
  ecosystem's topology (cavities = patches, realized paths = the one-hop links, sealing = cutting a link).

**Moving:**
- **Runs don't stop between divergence points.** The character walks; a tap or swipe is interpreted at
  the next divergence point reached (like Pac-Man turning at the junction).
- Claude's details, to confirm in play: the queued command shows at the next point; the latest command
  wins; with no command, keep going straight, and stop where you can't.

**Build intent:**
- Buildable and interactable divergence points are **not shown during plain flick play**, only on build
  intent: a **hold-and-drag**, or **arriving at a graph endpoint**.
- **On a hold,** the character finishes its run, stops at the divergence point, and shows the actions and
  builds available **in the direction of the pointer**.
- **Ghost, then tap:** the pointer moves a ghost of what will be built, snapped to the lattice, divergence
  point to divergence point. On release the ghost stays, blinking; a tap confirms; the character builds
  **the whole thing**.
- **Revert:** builds are deterministic, so a structure can be reverted to the original state: it
  disappears, and the nearby divergence points become available again. Open (Claude): structures built on
  a structure being reverted, and life growing on it (proposal: it turns to spores and drifts off).

**Every placeable environmental element is a divergence-point action:** hearths (placing a bug), airlocks,
air vents, and anything else the player puts into the environment. You place it on a lattice point, and
that point becomes that element, with all the consequences. (Placing a bug replaces the 1 s hold, D060.)
This is also how you **isolate and connect cavities**: airlocks between two cavities stop their mixing
(two airlocks eliminate it; see *Physics*), the character still walks through, and an air vent links a
cavity to the surface on purpose.

## Sandbox, synergy events and discovery (user, 2026-09-26)
- **The pitch (user):** "a dan-ball spin on this cave-traversing character interacting with the
  environment to tweak it to trigger synergy events would be AWESOME." Noita is the proof that a character
  inside a falling-sand world works.
- **The 32 (user, 2026-09-26):** "a dense (but not full) graph of 32 things that together can create a
  pulsating positive-negative feedback loop of chaos, that the user must tame and breed. And it should
  really tell the Callisto-ghost-town-to-alien-eden story." Collecting catalogue entries is **not** the
  fun (user: not "a widely adopted form of fun... but playing out interactions IS"). Draft list:
  callisto_elements.md, *The 32*.
- **Whatever the player discovers becomes a seed to place** (user): "a mix of Powder Game + Doodle God +
  Terraria terrain". Discovering happens in the world by doing (not by combining icons in a menu), and the
  codex of discoveries becomes the palette you place from.
- Claude's proposals, not decided:
  - **Placing is free, surviving isn't:** anything can be placed anywhere, and it only thrives where the
    conditions fit. Kids get unlimited toys; balance players still design the environment.
  - **The brakes make destruction safe:** set a cave ablaze or flood it with dust, and it heals.
  - **Fire needs air,** so burning stuff down is unlocked by growing air; the ruins feed the slime moulds.
  - **The ground stays still:** only the fun things move (fluids, fire, particles, creatures); the ice and
    rock stay put unless an event melts or cracks them, so traversal stays stable.
  - Example synergy events: dust by an ice wall → meltwater → brine → glowing snow feeders; an overheated
    hearth → a lichen storm; a probe thump under an ice ceiling → an ice quake of sparkling shards;
    ammonia brine on an Earth plant → it wilts, but with nitrifying bacteria first → a green explosion; a
    pet asleep by a hearth → its glow changes colour.
  - Next design step: the **interaction graph** of the 32 (which pairs react, and how).

**"Losing is Fun" (user, 2026-09-26):** "I think we just brought Dwarf Fortress' 'Losing is Fun' concept
into this game. Many interactive elements mean shit spiralling out of control all the time, unless you
really know what you are doing." Claude's reading, not decided: the spiral is the show and the loss is
cheap. Catastrophes stay local, nature rebuilds, and the brakes slowly win by default, so chaos pulses
instead of ending the game. Kids enjoy the chaos; experts enjoy the control.

## Physics: what is simulated, and what isn't (agreed with the user, 2026-09-26)
**Not Powder Game's physics engine.** It looks like Powder Game; underneath, **the cavity is the unit of
the whole simulation, and pixels are only a drawing of its state** (user: "the cavity is just a visual
representation of the cavity state mix, not a pixel-by-pixel simulation"). It's "easy to simulate in a
spreadsheet".

**1. Nothing loose persists.** No piles, no erosion, no cleaning, no mixed junk on the floor. Every
material is always in one of four places:
- **in a cell:** ice, rock, gas bubbles in ice (they free their gas when warmed), the relics; isotope
  dust lives in the walls;
- **in the cavity's skin mix:** the coatings of its floor, walls and ceiling as **shares**, like the air
  (soil 40%, moss 25%, ash 10%, bare ice 25%). New fauna producing a different soil just shifts the
  shares;
- **in the cavity's other values:** the air mix, life (which organisms, how much), heat, a water level
  (a full cavity spills over its lowest link into the next one, as a waterfall);
- **being carried, visibly:** dust in a bug's or your own stream.
Radiation is a short halo around its source, blocked by ice. The ice and rock grid stays still (the
lattice needs stable ground).

**2. The rules are spreadsheet rows per cavity**, e.g. "moss grows where there's soil and air", "fire
turns moss share into ash share while there's air", "slime turns ash into bare floor". Falling, flowing
and burning are **transitions you watch** (particles, drips, a creeping front), not state to manage.

**How it's drawn:** each skin or life type **spreads from its origins** (the lattice point where it was
placed, where a creature settled, where a fire started): it claims the cavity's cells nearest its origins
until its share is filled, ties broken by a fixed hash. When moss goes from 30% to 40%, the next cells in
distance order turn to moss, so a front creeps across the floor. Per-cavity numbers, cell-by-cell look.

**Saving: causes, not pixels.** The save is the *current* state, never the history:
- the world = the terrain seed + the player's edits (realized paths, airlocks, vents, hearths); the terrain
  is regenerated from the seed on load;
- per cavity: its shares and values, plus a short list of origins (a few dozen numbers).
Loading reads the numbers and draws them: nothing is replayed (moss that wilted long ago already *is* the
humus share). Estimated size: ~200 cavities × ~40 small numbers ≈ 16 KB, plus a few KB of edits: tens of
KB. To check against the save limits of the platforms we pick (browser localStorage is ~5 MB; some
portal cloud saves are much smaller). What's lost: incidental history (the exact path a fire took); the
spread-from-origin rule puts things where they plausibly were.

**Offline progress (open):** either the world pauses while closed (free), or it catches up in coarse,
capped steps (e.g. 1 step per minute, up to 8 h = 480 steps: a few million simple operations, well under
a second).

**The real engineering risk** isn't size or speed but **stability of the drawing**: the same save must
draw the same picture after code changes, and cavities need stable identities when the player builds,
seals or reverts. Both are solvable (a versioned drawing rule; cavities keyed by lattice nodes), but they
must be designed in from the start.

**3. Fields are one value per cavity, never a grid.** The only things that travel between cavities:
- **heat:** it evens out inside a cavity and trickles to a neighbour only through an open link. Hot
  spots near a hearth are *drawn*, not simulated;
- **the air mix:** very few, very distinct gas kinds (heading for three: breathable air, burning gas, heavy
  choking gas), plus steam;
- **spores**, drifting with the air.

**4. There is no pressure, no wind and no velocity map.**
- A cavity's air is **a mix of shares that always add up to 100%**, or **nothing at all** (vacuum, when
  it's open to the surface). Gas sources change the *mix*, never the *amount*, so nothing can build up:
  no alerts, no venting chores, no "vent / equalize / open" menu.
- Lore: at the 90-metre line the ice's own weight holds about one atmosphere; more gas makes the ice
  creep and seep, so pressure limits itself.
- **The only trace of pressure is the doorway moment:** opening a link between two different mixes shows
  a visible swirl of particles as they blend. Spectacle only; the consequence is the new mix.
- Why: pressure fields are hidden mechanics ("the farm exploded out of the blue"), they're the Oxygen
  Not Included trap, and per-cavity values can be fast-forwarded for offline progress while a per-cell
  field can't.

**Tunnels are links, not simulation grounds** (user's question, Claude's answer): a player-made tunnel,
slope or bridge has no state of its own (no air, skins, life or heat). It's the link between two
cavities, and what crosses it follows the per-link rules below. It's drawn in bare ice or rock, with the
doorway effects (the mixing swirl, a bang) shown in it. Life grows only in cavities. This matches the
character's role: it bridges systems; it doesn't dig rooms.

**Splitting and merging cavities** (Claude's proposal; user: "okay"):
- The player can split a cavity, **only at waists the lattice offers** (narrow places where a short wall
  or an airlock fits), never anywhere. That keeps walls short and obvious and the number of cavities
  under control. It gives two climates in one big cave, and big caverns get split by the player, not
  zoned by the generator.
- **Split:** each side gets the shares its own cells *showed* at that moment, plus the origins on its side
  (a type with cells on a side but no origin there gets one at its nearest cell). What you see is what
  each side gets.
- **Merge** (removing the isolation, a revertable edit): shares combine, weighted by size; origins are
  pooled; the cavity gets one identity keyed by its lattice nodes. The drawing is recomputed from the
  pooled origins; fronts near the old wall may shift, shown as a short settling. Removing a wall reverts
  terrain only: the ecology carries on from the merged state.
- Round trips stay consistent: every split reads the current picture.
- Open: is the splitter its own placeable, or simply an airlock placed at a waist (one thing fewer to
  learn)?

**5. Mixing happens only through open links, and collisions happen there:** a cave full of burning gas
opened onto an airy one with a warm hearth goes bang in the doorway.
- **How much mixes, per link (user):**
  - **an open link** (no airlock): continuous mixing, but never instant or equal: a fixed small amount of
    air (x units) is exchanged per time step, so the two mixes drift toward each other;
  - **one airlock:** mixing only when the character walks through, and only a small amount, never a full
    mix;
  - **two airlocks:** no mixing at all.
- **Keep it cheap** (user): no fine granularity. One exchange per link per step is all the simulation
  there is.
- An air vent opens a cavity to the surface: its heat leaks out, and its air goes (vacuum).

**The player's decisions are about *what* is in the air, never *how much*.**

## Gauges drawn in the world (Claude's draft, not decided)
- **Temperature:** the colour of light (cold blue to warm amber); ice sweats and drips when warm, frost
  creeps when cold; heat haze over hot spots.
- **Air or vacuum:** light scatters in gas, so a vacuum is crisp black with sharp lights, and a cavity
  with air gives every light a soft halo. (There's no pressure, so no density gauge.)
- **Composition, shown by the ambient life it attracts (user, 2026-09-26):** decorative life with no game
  mechanics, e.g. alien bugs where there's ammonia gas, gas jellies where there's hydrogen. It can show
  per layer (heavy gases low, light gases high). Drawing only; the sim keeps one mix per cavity.
  **Keep this system really simple** (user): "hidden game mechanics with major consequences is NOT fun."
  (Note: ammonia gas isn't one of the 32 yet.)
- **Radiation:** sparkling specks in the halo round a source.
- **Life:** its own look (lichen blazing, moss drooping, spores greying).
- **The character and pets as gauges:** breath puffs in cold breathable air, the helmet coming off,
  pets reacting.

## No dead ends, no unrecoverable collapse (user: "what we must carefully design against")
Claude's rules, not decided:
1. **Discoveries are permanent seeds,** so nothing is ever lost for good: re-seed it from the codex.
2. **Life goes dormant instead of dying:** spores stay in place and wake when conditions return.
3. **Every destruction feeds a recovery:** fire → ash → slime; melt → brine → snow feeders; collapsed ice
   → rubble with dust → bugs. An output that feeds nothing is a design bug, visible on the matrix.
4. **Basic elements never run out:** ice everywhere, dust in every wall, taps never dry, wild bugs refill.
5. **Brakes stop at the band, not at zero.**
6. **Catastrophes are bounded by their own rules** (fire stops where the air ends).
7. **You can never be trapped,** and every structure can be reverted.
8. Test it: the sim is deterministic, so a headless "chaos monkey" can play random actions for hours and
   check that nothing stays dead.

## The needles (draft)

| Needle | Too low | Too high |
|---|---|---|
| Heat | life sleeps | the ice sags, caverns close |
| Radiation | no energy for life | cells die |
| Ammonia (nutrient) | growth stalls | toxic |
| Air (N₂/O₂/Ar) | a goal, never a meter | — |

Heat and radiation share a source (dust) but behave differently: **radiation stays local** (ice blocks
it), while **heat spreads** through tunnels and ice. A few big hearths make radioactive hot spots; many
small ones spread warmth thin. That's a design choice for the player, not a number to tune.

## What affects what (draft)

```
          ┌──────────── bugs gather dust (only while their hearth is below the band) ◀─┐
          ▼                                                                            │
   free dust ──▶ radiation (local) ──▶ radiotroph mats ──▶ biomass, O₂                 │
          │           │                                                                │
          │           └──(too high)──▶ cells die ──▶ slime food                        │
          ▼                                                                            │
        heat (spreads) ──▶ lichen thrive ──▶ lichen LOCK dust ──▶ less free dust   [L1 hot brake]
          │                                                                            │
          │    cold / starved lichen die ──▶ slime moulds eat them ──▶ dust + ammonia back   [L2 cold brake]
          │
          ├──▶ ice melts (soaks up heat) ──▶ heat capped, brine pools         [L3 ice buffer]
          ├──▶ ice sags (slow; the thing you avoid)
          └──▶ old argon freed from the ice ──▶ air
   ammonia ──▶ all growth ──▶ uses ammonia up                              [L4 nutrient brake]
   ammonia ──▶ anammox microbes ──▶ N₂ ──▶ air
   bloom light ──▶ more seen cells ──▶ more dust bugs can reach ──▶ more bloom   [R1 growth]
   open to the surface / wild dark ──▶ heat and air leak away
```

## A simple model (Claude's earlier proposal; superseded by *Physics*: the patches are the cavities)
- **The world is cut into patches** (the sim already has fixed 32×32 blocks from D061; or a den's area).
  The patch is the only unit anything is computed on.
- **Each patch has three needles with three states each:** too low · just right · too high. They come
  from **counts inside the patch**: dust (warmth and radiation, one needle or two), a revived tap or not
  (ammonia), lichen, mats and slime present or not.
- **Neighbours matter one hop only,** and only through an open tunnel: a connected patch shares a little
  warmth and ammonia. No diffusion, no chains.
- **Brakes are one-line rules per organism,** checked now and then: "in a too-hot patch, lichen spread
  a step and lock one dust"; "in a too-cold patch, a lichen dies and slime returns its dust"; "in a patch
  without ammonia, nothing grows".
- **Air is a patch property:** breathable when the patch is sealed off from the surface and the wild
  dark, and its bloom is mature. The flood fill used for light answers "sealed".
- **Fixing things = walking over and changing a count:** pull dust out or bring it in, place or move a
  bug, dig or seal one connection, revive a tap, seed an organism. Each patch *looks* its state (lichen
  blazing, plants drooping, ice sagging), so you see where to go. *(User: the "No" was only to expecting
  kids to play toward real ecological balance; the patch model stays a live proposal.)*

- **L1–L4 are brakes:** a drifting needle wakes the organism that pulls it back. Players can't wreck the
  system; they can only make it slow, lopsided or stuck.
- **R1 is the growth engine**, and the brakes cap it.
- **The player's levers are spatial, never numbers:**
  - where hearths go (placing bugs), and how many;
  - **topology:** connecting spreads heat, air and nutrients; airlocks keep them apart; an air vent lets heat
    and air out (all built on the lattice, see *The character and the interaction model*);
  - **ocean taps** (the user's "ocean-surface-thingie", open). Proposal: the old colony's boreholes to the
    ocean, dead now, which you revive; they bring up ammonia brine;
  - which organisms you seed where.

## Earth and Callisto together: zonation (draft)

| | Callisto life | Earth life |
|---|---|---|
| Radiation | needs it | is harmed by it |
| Ammonia | eats it | toxic in brine, but useful as nitrate |
| Air | doesn't need it | needs O₂ |
| Heat | cool to warm | needs it above 0 °C |

So coexistence means **zones**, like a seashore: a **hearth core** (Callisto, radioactive) → an
**ecotone** where the two meet → an **Earth garden** at the edge, in grown air. Across the border:

- Callisto lichen soak up radiation and lock dust, shielding the Earth side.
- Earth nitrifying bacteria turn ammonia into nitrate for Earth plants.
- **The bridge species is real:** black radiotrophic fungi grow in the ruins of Chernobyl reactor 4. They
  are Earth life that feeds on radiation, so they can live next to a hearth.
- Earth seeds come from the old colony (a dead seed vault or frozen farm), revived like the boreholes.

**"Natural balance", the endgame:** the habitat holds every band, in every zone, for a long time with no
player action.

## Milestones (draft; TM-style, but about balance, not maximums)
In Terraforming Mars the tracks only go up. Here they're bands held by brakes, so milestones are about
**holding a balance**:
First Warmth (a hearth in band) · First Bloom · Closed Loop (both brakes seen working) · Living Water (a
revived borehole) · First Breath (a sealed pocket of air) · Earth Seed (the Chernobyl fungus beside a
hearth) · Ecotone (a stable border) · Self-Sustaining (all bands held with no input).

## Sharing and challenge (directions the user floated, not decided)
Not scores. The user's ideas:
- **Breed dual-planet animals** (Earth × Callisto features) and race them in a survival-of-the-fittest
  environment.
- **Categories that stretch the system to extremes:** "deepest human habitable zone", "brightest glowing
  pet".

Claude's earlier ideas that still fit: strains that mutate in your cave and can be shared as codes; cave
postcards (an image or GIF of your glowing cave); visit links (seed + edits, opened read-only as a
garden). All work without a server (P2P and browser only).

## Next: two prototypes (user, 2026-09-26)
1. **Lattice generation:** generate the hidden path lattice (divergence points, candidate paths, natural
   cavities as nodes, waists) from the random terrain, and look at it.
2. **Lattice traversal, building and undo:** runs that take commands at the next divergence point, build
   intent (hold or a graph endpoint), ghost then tap, building the whole structure, revert.
The ecology (the 32, the cavity states) comes after these.

## Open
The player's identity · what the ocean taps are · the element list and the interaction matrix · patches
vs per-cell rules for the ecology · hybrids: what they are, how they breed, what "racing" means · how the
current prototype (b3: swipe digging, pack, pulling, the bar) maps onto the lattice · the training area
(short and spectacular, 5 s / 5 min / 5 h).
