# 19 · Rain World's procedural animation

Scope: how Rain World animates its creatures in code, and why the look is kept apart from the simulation. General, for
any game with many simulated creatures that only need to look detailed while someone is watching.

**Source.** A conference talk by Rain World's two developers, Joar Jakobsson (creature design, animation, AI,
programming) and James Therrien (level design, audio, narrative). The captions garble both names; most likely
"The Rain World Animation Process", GDC 2016. The transcript (auto-captions, no timestamps) was pasted by the user on
2026-10-05; section references below are the talk's chapter titles. It's a short talk, mostly one developer describing
his own practice. Nothing in it is measured. Everything outside the last section comes from the talk.

## The claims

### 1. What Rain World is, and why it needs this [Intro]

- A survival action platformer. The player is a weak "slugcat" in a large open-world ecosystem of AI creatures.
- The aim is for creatures to have as much agency as the player: they move around the world on their own, hunt, look
  for food and are afraid of things.
- Creatures exist all the time, on screen and off. You can walk into a room and find an interaction that has been
  going on for 20 minutes.
- Sometimes hundreds of creatures are active at once.
- Creatures shown: the vulture (switches between climbing like a monkey and flying like a bird; "dual-nature"
  creatures recur across the game), centipedes ("a generalised sense of clockwork", inverse kinematics in the legs), a
  large friendly deer you can climb in, anchored worm grass, lantern mice (usable as light if you don't scare them),
  the leviathan, Miros birds (hunt in packs), lizards (the main antagonist; they hunt in packs, surround the player and
  cooperate; the white one camouflages), and the scavenger. The scavenger is "the jewel" of the AI: it moves exactly
  as well as the player, uses tools and is at ease on poles or flat ground.

### 2. Procedural animation means code drives the visuals [Procedural Animation]

- Defined as animation that is neither drawn frame by frame nor a rigged character replaying clips. Interactive code
  decides how the visuals move.
- **Why it matters here: AI behaviour equals what you see.** When a lizard hunts, you see it notice you. When it can't
  reach you, it looks frustrated as it tries to find a way around.
- **Players project personality onto it.** They see a creature do something interesting that isn't scripted and say
  "this creature is mad at me". That isn't really true, but because "all of the ingredients are visible", each
  creature seems to have a personality.
- The opposite is a black box: a robot stands still, then something happens. With nothing visible to infer from,
  players read nothing. Procedural animation gives visible cause and effect.

### 3. The physics simulation and the look are separate [Separation of cosmetics and physics]

- Example: a tentacle creature growing out of a wall, which grabs things and pulls them in. Three layers are shown:
  - thin red lines: **pathfinding** toward the goal through the terrain;
  - blocky squares: **the AI's view of the tile grid** (the terrain is tile-based), so it reaches around a wall
    instead of through it;
  - beads joined by sticks: **the actual physics**, a simple 2D float-vector simulation that only keeps points at a
    set distance from each other (pushed together when too far apart, apart when too close).
- On top of this sits the look: a more complex visual layer with dangling bits.
- **The dependency runs one way.** The look depends on the simple simulation, never the reverse. Two reasons:
  - **Performance.** The world keeps going off-screen, so many creatures, sometimes hundreds, are active at once.
    Off-screen, only the simple simulation runs. The dangling bits cost a lot of processing but don't affect how the
    creature interacts with anything, so they only need to run while the creature is on screen.
  - **Control.** The simple simulation is easy to tune. The look can then be laid on top without disturbing behaviour
    that already works. If the dangling bits were simulated physics, they could pull on the main tentacle, weigh it
    down, start wobbling or become unstable. Because the dependency runs one way, the creature always does what it was
    built to do.

### 4. Pragmatism: fake it rather than make it [Pragmatism]

- The developer comes to programming from art: art is the goal, programming the means. He is largely self-taught.
- He knows how it should look and feel; the code only has to get there. Purity of implementation isn't the point.
- "Faking it is easier than making it." Given a choice between a correct simulation of a complex phenomenon and
  something that only looks like it, he picks the second. The illusionist's approach: if you don't have to actually
  pull a rabbit out of a hat, don't. When the result looks the same, take the easier route.

### 5. AI and behaviour are the animation [AI/behaviour == animation]

- There is no line between AI and animation.
- A top-level AI makes decisions, mostly about where to go.
- A **locomotion AI**, as much animation as AI, decides where to put the limbs, how to orient the body and how to move
  through the world. The environment around the creature informs all of it.
- Example: the vulture flaps its wings at one point. Nobody animated that for that moment. The locomotion AI found it
  had lost both grips, or had no good place to grab, so it switched to flying and then back to climbing.

### 6. Building a creature step by step: the daddy longlegs [Let's make a Rain World Creature!]

- A ball of tentacles, "between a spider and a spider's web", messy and stumbling: an ideal Rain World creature.
- **A moving box.** A blob body and a goal point. The AI sets the goal; A* pathfinds through the terrain toward it.
  At this stage it moves like a car in a racing game, a physics object heading for its destination at an even speed.
- **Legs.** The same tentacles as the wall creature: tile-aware AI tentacles plus the bead-and-stick physics, which is
  where the tentacle actually is. The tile layer is "more like its brain".

### 7. Where the legs go: cheap random search [Where do all the legs go?]

- Climbing is one decision made over and over: where to grab, when to let go.
- Each leg has three points:
  - **yellow, the ideal grab position**, where it would grab if every point were grabbable. It sits ahead of the
    creature along its direction of travel;
  - **green, a temporary goal**, the best valid grab position found so far;
  - **blue, the current goal**, where the tentacle is actually moving.
- A scoring function grades any coordinate as a grab position: thin air scores minus infinity; terrain scores higher
  the closer it is to the ideal point.
- **Each frame, pick one random position** (in the room or near the creature), score it, and swap it in if it beats
  the current temporary goal. Over several frames the goal drifts toward a better spot.
- Checking every position and picking the best would cost too much processing. The random search doesn't always find
  the best spot, only a goodish one, and "that little bit of randomness adds some character to the animation".
- The grab cycle: the body moves, the leg reaches the blue point and latches on, the body keeps going, and when the
  leg trails too far behind it lets go, takes the current green point as its new goal and reaches for it. Repeated,
  that's climbing.

### 8. Faking weight and balance [Faking weight and balance]

- Real rope physics with elasticity on every tentacle was beyond what the developer could handle.
- Instead, each frame he **counts the tentacles touching terrain**.
  - Fewer grips: gravity affects the body more.
  - More grips: the body may move toward its goal faster.
  - No grips: 100% gravity, no movement toward the goal; it falls.
  - All grips: no gravity; very efficient movement.
- In play, it's rarely either extreme. A few tentacles hold on while others search, so the creature is sometimes
  weighed down and sometimes surges forward.
- The eye connects grip with speed, so the creature seems to hold itself up by its tentacles. "Which is not at all the
  case. It's just floating through the air", but the illusion of support works.

### 9. The look on top [Cosmetic detail]

- The look is "a paper doll pasted on top of the logic", placed by where the physics objects are, but not exactly:
  jagged physics tentacles are drawn as smooth curves.
- **There are more tentacles than the physics has.** Some are dead, dangling tentacles that do nothing in the game and
  touch nothing. They look the same as the working ones, so you can't tell them apart, and it all reads as "one gross
  unit".
- In play, the daddy longlegs is blind and hunts by sound: when the player lands on the ground, it sends a tentacle to
  feel where the sound came from, and grabs.

### 10. The technique comes from the circumstances [Technique from circumstances]

- One person is the artist, designer and programmer, so he can work within the technical limits and find a "sweet
  spot" himself, instead of a programmer telling an artist that something can't be built.
- **The creatures are fantasy creatures.** Nobody knows how they should move, so slightly wonky movement gets the
  benefit of the doubt. A human or a horse would be very difficult; for a tentacle creature, "that's what a tentacle
  creature looks like".
- His advice: some design solutions sit between art and programming, and a team of an excellent artist and an
  excellent programmer can still miss them. Artists should learn "more programming than you're comfortable with";
  programmers should learn what motivates artists and how they work, so both meet halfway.
- Q&A: the physics is homegrown, no engine. PC at the time; console ports planned.

## Unverified inference **[C]**

Thoughts on this project, not from the talk, and not checked against play or other sources. Weigh before using.
Background: thousands of animals, low-res, detail only when the player zooms in; central ledger with abstract
random-walk animals and no pathfinding (project-incremental-not-deep-sim); final rendering on PixiJS or three.js with
procedural animation, shaders and particles, so pixels and Canvas2D are prototype-only.

### The main takeaway: cost grows with what's on screen, not with population

Rain World's rule (expensive things run only while watched, and nothing expensive feeds back) is what lets a few
thousand animals be cheap. Applied to zoom, it's even stronger than Rain World's version. Zoomed far out, the screen
holds many animals but each is a few pixels. Zoomed in, each animal is detailed but only a few dozen fit on screen.
Detailed-animation cost is then bounded by screen area, roughly constant across zoom levels, and the population size
stops mattering. That only holds if nothing about an animal's look is needed by anything but the renderer.

### Three tiers, and two kinds of zoom-in layer

Rain World has two layers (simple body, look). This project would have three tiers:

| Tier | When | What exists | Writes to the ledger? |
|---|---|---|---|
| Ledger | off-screen, far zoom | counts, gauge values, maybe a patch position | it *is* the ledger |
| Simple body | visible | position, heading, speed, a pose state or two | yes, if it's a local sim |
| Look | zoomed in | the paper doll: limbs, curves, fake limbs, particles | **never** |

There are two kinds of zoom-in layer, and they shouldn't be mixed:

- **A local simulation** (the local sim decided earlier): animals get real positions and interact. What happens there
  counts, so it *must* write back into the ledger when the player zooms out (who got tamed, who fled, food eaten).
- **The look**: limbs, curves, fake limbs. It must *never* write back. This is exactly Rain World's one-way rule.

The trap is a look that slowly starts to matter (a tentacle that "catches" prey, a tail that blocks). Once the look
matters, it has to run off-screen too, and the cost model collapses. Rain World's dead tentacles are the reminder: in
the look, *most* of what you see may be fake.

### Zooming in starts with no history

Rain World only shows the look for creatures on screen, and a creature that enters a room arrives with its body
already in motion. Zooming in is harsher: the detail has to appear out of ledger values, with no past. So:

- **Seed every animal's look from its id**, so the same animal looks the same every time the player zooms in, and
  two zoom-ins don't disagree. Animals generated from a trait space make this natural: the trait values are the seed.
- **Let the look settle in a few frames**, the way the random grab search drifts to a good spot. Limbs that start in a
  default pose and find their grips within half a second read as "waking up into view", not as popping.
- **Zooming out throws the look away.** No state to save.

### Behaviour = animation is the strongest link to taming

The taming design already says the animal telegraphs its moves, effects are shown not told, and failed attempts reveal
what scouting can't. Rain World's point 2 is the mechanism behind all three: if the visuals are driven by the same
values that drive behaviour, the player learns the animal by watching it. Concretely:

- **The motivation gauge drives the body.** Fear, hunger and curiosity each map to a few pose and motion parameters
  (crouch, speed, jitter, head direction, distance kept). Then a scared animal *looks* scared because it *is*, and the
  card's lines fill from things the player saw happen.
- **The fear response is a mode switch you can see**, like the vulture switching from climbing to flying. Fight, flee
  and hide (from the strongest stat) can be three locomotion modes, chosen by the same rule the taming logic uses. The
  telegraph then is the animal starting to change mode.
- **Zoom becomes a reading tool, not just a cosmetic.** Far out you see a herd's mood in motion; zoomed in you see one
  animal's motivations in its posture. That gives zooming in a reason in play, which an idle game's camera usually
  lacks.

### The danger in "players project personality"

Rain World *wants* players to read in moods that aren't there ("it's mad at me"). For a survival game that's free
atmosphere. For taming it's risky: the player is learning rules from the animal's behaviour, and the rule against
hidden consequences says effects must be painfully obvious. If the look suggests a motivation the gauge doesn't hold
(a tail swish that looks annoyed but means nothing), players learn false rules and blame the game. The rule that
follows:

- **The look may only express gauge state and decoration that clearly is decoration.** Idle motion (breathing, ear
  flicks, fake limbs) is fine if it never varies with anything the player could mistake for a signal. Anything that
  varies must vary *because* of a real value.

Rain World can let players over-read. Taming can only let them read.

### Weight from one number scales down to low res

The grip-count trick is the pattern: one cheap value, two opposing effects (gravity vs. goal speed), and the eye fills
in a whole physical story. For this project:

- **One or two gauge values drive everything visible** at every zoom level. Far out: speed, direction changes and
  spacing from neighbours, which is all a 3-pixel animal can show. Mid zoom: a crouch or a lean. Close: full posture.
  Same numbers, more channels as pixels allow.
- **Motion is the only channel that survives low res.** Shape and colour vanish at a few pixels, but hesitating,
  darting or circling stay readable. So far-out animals should differ in *how* they move, not how they look.
- **A pet team's state can work the same way**: how well the team "holds" an animal (the taming progress) could be
  the grip count, with an animal that pulls away when the hold is weak and settles when it's strong. One value, a
  physical story.

### Cheap random search fits thousands of animals

One random sample per animal per frame, keeping the better one, spreads the cost over time and never solves anything
in full. The same pattern could pick where a random-walk animal drifts next (one candidate per tick, scored by
food, fear and the team's position), staying inside the no-pathfinding rule. Combined with time-slicing (only a
fraction of the ledger animals update each frame), the cost per frame stays flat as the population grows. The
randomness gives character for free, as the talk says.

### Fantasy creatures get the benefit of the doubt

Generated animals from a trait space are fantasy creatures. Bodies can be assembled procedurally (segments, leg
counts, tentacles drawn from traits) and move a bit wonkily, and that reads as "that's how that one moves". Two
consequences:

- **Avoid real animals with well-known gaits** in the generated pool, or keep them small enough that the gait doesn't
  show. A wobbly horse looks broken; a wobbly six-legged moss thing looks alive.
- **Body plans can follow traits**, so the look itself teaches families: animals that share a rule share a way of
  moving. That's the trait space shown, not told.

### What not to copy

- **Simulation depth.** Rain World runs pathfinding, tile-aware limbs and point physics for every creature, even
  off-screen, and only for hundreds. This project's ledger is deliberately shallower. Copy the layering and the
  behaviour-you-can-see principle, not their per-creature AI.
- **The 20-minute-old interaction in a room.** That comes from the real off-screen simulation. A ledger can't produce
  it, so a zoom-in has to *invent* a plausible scene from ledger values (two counts near each other become a chase in
  progress). It can be done, but it's a separate design job and probably a cheat; the watchable replays decision is
  the nearest existing hook.
- **Timing.** None of this belongs in p13. The taming prototype only needs the gauge to show on the animal in the
  crudest way (one value as speed or size), which already tests "behaviour = animation". Point physics, fake limbs and
  zoom tiers are final-game work for PixiJS or three.js, after taming is fun once.

### Overlaps with earlier guides

The behaviour-you-can-see point is close to [02 Game feel](02-game-feel.md) (juice that carries information) and to
the open enemy intents in [11 Slay the Spire](11-slay-the-spire-engagement.md). Sonny's telegraphs that show state, not
intent ([12](12-sonny-engagement.md)), match the gauge driving the body. Into the Breach's fixed, learnable enemies
([15](15-into-the-breach-combat.md)) are the argument for keeping the look honest.
