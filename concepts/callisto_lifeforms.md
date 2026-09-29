# Callisto: life forms, one record from slime mould to giant worm

Status: exploration, 2026-09-29. Written from a conversation about Lindenmayer systems (L-systems). Everything is
Claude's draft unless marked (user). Numbers marked *(estimate)* are ballparks, not measurements.

Related:
- **What lives there:** [callisto_elements.md → Native life](callisto_elements.md#native-life-callisto) (the list).
- **How it should look:** [callisto_lore.md → The look](callisto_lore.md#the-look) and
  [spelunking_base.md → View, Art & Customization](spelunking_base.md#view-art--customization) (light, particles,
  procedural animation).
- **What it does:** [player-influences-but-system-has-its-own-trajectory.md → Links](player-influences-but-system-has-its-own-trajectory.md#4-links-the-micro-interactions)
  (the interactions, L01–L52).
- **Why variety matters now:** [callisto_design.md → The game: an intelligent idle game](callisto_design.md#the-game-an-intelligent-idle-game-user-2026-09-28);
  after b4.77 the user found the simulation flat, "like an open world game that looks the same everywhere you go".
- **Performance background:** [guides/engineering/ideal_sw_architecture.md](../guides/engineering/ideal_sw_architecture.md)
  (level of detail, fields, the sim as numbers); art tools in [toolbox.md → Art Tooling](toolbox.md#art-tooling).

## 1. The question (user)

Can L-systems make the ecosystem more varied while keeping the simulation simple and deterministic? Can they
represent many forms of life (slime mould → grasshopper → giant space worm) in one standard way, and generate each
creature's looks, movement and interactions from it?

**Short answer:** yes for form, partly for movement, no for interactions.

## 2. Decided (user, 2026-09-29)

- Rendering is PixiJS or three.js, not Canvas2D.
- "Only the prototype is this pixelated, the final game will have simple procedural animations, shaders, particle
  effects." So creatures will be big enough for their shape to read; b4's 1–3 px bugs are no argument.
- A zoo / benchmark spike is not needed yet.

## 3. The species record

One small record per species. Interactions are written by hand; everything visible is generated from the record.

```js
species = {
  links:   ['L46', 'L47', 'L48'],                  // hand-written: what it eats, drops, fears
  body:    { axiom: 'H S T', rules: { S: 'S[L][L]' }, gen: [2, 4, 7] },  // larva → adult → giant
  move:    'chain',                                // derived from the body if left out (§6)
  palette: 'ash',                                  // what it eats shows in how it looks
  fx:      { tip: 'gas-wisp' },                    // particle emitters attached to grammar symbols
}
```

- **Growth stages are grammar rounds:** growing up means running the same rules for more rounds. A worm that has
  eaten enough visibly gets more segments. That makes a level-up anyone can read, hung on one count (D164: unlock
  moments must explain themselves).
- **Effects sit on the body:** a symbol can mark where a particle emitter is attached, for example gas wisps at
  slime tips (L51), sparks where lichen catches (L23), spores at vine ends. The effect shows the link at the part
  that does it (no hidden consequences).

## 4. Function first, form follows

- **Never derive interactions from shape** ("has mandibles, so it eats X"). That's Spore's dream. It creates hidden
  consequences and densifies the graph, against two standing rules: painfully obvious or out of the graph, and
  don't densify (D164).
- **The other way round:** the links table says what a species does; its looks are generated to *show* it. Ash
  eaters look ashy, predators trail strings (as b4's already do).
- **Variety only where it means something.** Grammars that differ between biomes with no difference in behaviour
  are the "10,000 bowls of oatmeal" problem: noise, not identity. A biome's grammar should differ where the biome
  behaves differently (brittle ice vines burn fast, so they look brittle).

## 5. Grammars

**What an L-system is:** rewrite rules applied to every symbol of a string at once, for n rounds; a "turtle" then
reads the string as drawing commands (`F → F[+F]F[-F]F` gives a branching plant).

- **Deterministic:** the same rules, seed and n always give the same shape. Randomness comes from a seeded hash
  of the symbol's position (a stochastic L-system).
- **Parametric:** symbols carry numbers (`Seg(len, width)`), so one rule set covers small and large versions.
- **Environmentally sensitive:** a query symbol asks the world (rock? gas? light?) and the rule branches on the
  answer. Cave growth needs it, so a vine bends round rock.
- **n is the sim state.** The sim stores a small integer per patch (this vine at round 5); the view rebuilds the
  shape from (seed, n) on arrival. Offline catch-up is n += k. That fits the few-discrete-states model and the
  sim-as-numbers offline plan.
- **Smooth growth for free:** each vertex stores the round it was born in, and the shader fades in the geometry
  between n and n+1. The player sees continuous growth; the sim keeps integers.
- **Shared baked variants:** a few precomputed shapes per species and stage (say 8, picked by a seeded hash), not
  one per individual. 3,000 grasshoppers are 3,000 indexes into 8 meshes.
- **Cap the rounds:** strings grow exponentially; 6–7 rounds is usually the limit.
- **Re-derive rarely:** an environment query re-runs only when its patch changes, and a few patches a frame at
  most.

**Which tool for which form:**

| Form | Tool |
|---|---|
| segmented bodies (worms, centipedes, the giant worm) | grammar: `Body → Head Seg^n Tail`, `Seg → Seg[Leg][Leg]` |
| branching flora (vines, frost ferns, mycelial threads) | grammar, environment-sensitive in caves |
| growth that seeks something (slime mould toward food, roots) | space colonization (tips grow toward attractor points) usually beats a plain L-system |
| fixed body plans (a grasshopper) | a parametric template: reads better, especially to a 6-year-old |

## 6. Movement

The grammar gives no movement by itself, but its output (a tree of segments and joints) is exactly what
procedural animation takes as input.

| Body | Locomotion mode |
|---|---|
| network, no body | growth is the movement: tips extend toward food, the rest retracts |
| chain, no legs | follow-the-leader chain (Rain World-style worms and lizards) |
| legs | a foot steps when its target drifts too far |
| large hind legs | hop |

Each mode is written once and shared by every species that uses it.

**Where it runs:**
- **Shader (most creatures):** the baked mesh stores each vertex's place on the skeleton (segment index, distance
  along the body, which leg). Per frame the CPU updates only position, heading and phase; the vertex shader does
  the wriggle, leg cycles, breathing, hops. One instanced draw per species, in PixiJS or three.js alike.
- **CPU skeletons (the few that react to the world):** a worm squeezing through a tunnel, a beast placing feet on
  real rock. The architecture guide's near/far split, applied to animation.

## 7. Budget: a few thousand creatures on an old phone

Realistic on PixiJS or three.js with shader animation. The CPU budget goes to the sim, not to drawing.

| Work | When | Cost *(estimate)* |
|---|---|---|
| running a grammar | once per species × stage, cached | a few hundred to a few thousand symbols: well under 1 ms |
| flora and slime shapes | on a round change, not per frame | small, spread over frames |
| shader animation | per frame, on the GPU | one instanced draw per species |
| CPU skeletons | per frame, a few dozen creatures | a chain joint is ~10–20 arithmetic operations; 24k joints ≈ 1–3 ms, leg IK a few times more |

Measure before designing around these numbers (a throttled Chromium at 4–6× roughly stands in for an old phone).

## 8. Open

- **Is b4's sameness visual or behavioural?** Grammars fix "every cave looks the same". "Every cave plays the
  same" needs biomes with different links.
- **A zoo / benchmark spike** (not needed yet, user): slime mould, grasshopper and giant worm from one record, the
  stages dumped to `gallery/`, one chain-crawl worm moving, 3,000 entities measured. It would bring the renderer in
  as a dependency early, so it needs the user's sign-off.
