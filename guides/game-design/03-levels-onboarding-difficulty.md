# Levels, Onboarding, Difficulty & Procgen as a Design Tool

Part 3 of the game-design reference library. Scope: teaching without tutorials, difficulty and pacing, navigation underground, and procedural generation used as a *design* tool rather than a tech showcase. Other topics live in their own guides and are not repeated here: design foundations / MDA, game feel / juice, player motivation and web-portal audiences, indie scope and process.

Written against the current project: **spelunking** (see [spelunking_base.md](../../concepts/spelunking_base.md), [b1-dig-feel](../../spelunking/timeline/p3-dig-feel/entry.md)). Every principle ends with "apply to spelunking".

---

## 1. TL;DR: the principles that matter most

1. **Teach with the level, not with text.** Introduce a verb in a safe space, develop it, twist it, then test it (Nintendo's four steps / kishōtenketsu). One idea per beat.
2. **Learning needs zero pressure.** Valve measured it: the learning rate drops if the player is under any threat while being taught. Teach first, threaten later.
3. **Force the first encounter, then get out of the way.** Mario 1-1's first Goomba and Mega Man X's opening stage are built so the player *can't miss* the lesson, and neither says a word.
4. **Procgen exists to make interesting spaces, not random ones.** Write down what a "good" cave is as checkable properties *before* touching the algorithm (Compton). Random is cheap; interesting is the whole job.
5. **Guarantee first, decorate second.** Spelunky builds a guaranteed solution path, *then* fills rooms. Structure is deterministic and checked; variety is layered on top.
6. **Hybrid beats pure.** Hand-authored chunks placed by a generator (Spelunky, Dead Cells, Noita) give you authored quality at procgen variety. Pure noise gives you oatmeal.
7. **Players learn components, not layouts.** In a procgen game the player masters the *rules of the pieces* (snake, arrow trap, soft rock, ore vein). Make every piece readable and consistent; that's where depth lives.
8. **Perceptual uniqueness comes from a few landmarks, not from millions of different pixels.** One huge cavern, one derelict, one glowing vein per dive is remembered; 10,000 slightly different tunnels are not.
9. **Measure the generator on hundreds of seeds, not on the screenshot you like.** Sampling + a few metrics catches the 5% of broken seeds your eyes never see (Cook).
10. **Let the player choose difficulty through play.** flOw's "dive deeper or go back up" is dynamic difficulty the player controls. Spelunking's depth already is this: don't add a hidden DDA on top.
11. **Pace in sawtooth waves: build-up, peak, relax.** Left 4 Dead's Director is four states and a timer. Your dive loop (dig → greed → bug pressure → recall → home) is the same shape; tune it deliberately.
12. **Casual difficulty: if it's hard, make it short; and don't confuse hard with fun.** King's data: long levels are less fun, crazy-hard levels never pay off long-term, retention wins.

---

## 2. Principles in depth

### 2.1 Teach with the level: the four-step structure (kishōtenketsu)

**What.** Koichi Hayashida (director, Super Mario 3D Land / Galaxy 2) described Nintendo's level template in a 2012 interview: (1) introduce a mechanic in a safe setting, (2) develop it with a slightly harder situation, (3) twist it so the player sees it differently, (4) conclude with a test that uses what was learned. He tied it explicitly to *kishōtenketsu*, the four-panel comic structure, via Miyamoto's manga background. GMTK's "Super Mario 3D World's 4 Step Level Design" traces the same template from Galaxy to Captain Toad and makes the key point: each idea gets properly taught in about five minutes, then the level *ends* and the idea is retired or recombined.

**Why.** It front-loads safety, guarantees understanding before testing, and the twist is where delight comes from. It also bounds content: one mechanic, four beats, done. That's a scope tool as much as a teaching tool.

**Example.** A 3D World level introduces a platform that flips on each jump: first over solid ground, then over a gap, then flipping platforms that also move, then a sprint through a long sequence.

**Apply to spelunking.** The derelict fragments already *are* a four-step structure spread across the first five minutes: fragment = intro (one broken defense, weak), real base = development (defenses working), getting shot + the visible flaw = twist ("oh, there's another way"), beating it = test. Keep each fragment to exactly one lesson. Resist making fragment 3 also teach bugs. For Bundle 1, use the same idea for *terrain* verbs: the first 20 tiles below the hatch should contain a soft-rock run (dig verb), a 1-tile step (auto-climb), a 2+ ledge (zipline), then a hard-rock band that stops you (the "push or recall?" decision). That's a stamped, hand-authored opening chunk, not something CA noise will reliably produce.

### 2.2 Learning happens only without pressure

**What.** At GDC 2006 Valve's Jay Stelly reported from Half-Life 2 playtests that "the learning rate diminished if the player was put under any type of pressure during training time or… exposed to any sort of peril or even combat situations." Valve used three training modes: learning by example (an NPC demonstrates), learning by deduction (the pieces are there, figure it out), and explicit testing. The gravity gun is taught in a safe yard, then Ravenholm becomes the long, scary exam, full of saw blades that were already shown.

**Why.** Under threat, players fall back on verbs they already trust and ignore the new one.

**Apply to spelunking.** Your concept doc already has this right: fragments knock you back without sending you home; the pod is safe; recall is free. Two things to guard: (a) **no bugs in the first dive**, or at least not until the player has dug, looted and recalled once; (b) the first zipline ledge should have nothing dangerous nearby. Bundle 2's first darkness/bugs exposure should also start from a calm state (an empty, dim pack is tense but not threatened).

### 2.3 Force the first encounter, then let go

**What.** In Mario 1-1 (Miyamoto and Tezuka, Eurogamer interview 2015), the first Goomba walks toward you on a flat plain, and the first mushroom is bounced so it's very hard to avoid. The level is built so the lesson is almost unavoidable, then it's "their game." Egoraptor's "Sequelitis: Mega Man Classic vs. Mega Man X" (2011; often misattributed to GMTK) breaks down how X's intro stage teaches the dash and wall-jump by building the geometry so you must use them, with no text.

**Why.** An optional lesson is a lesson half your players skip. Web-portal players churn in seconds; they won't discover a verb by accident.

**Apply to spelunking.** Every verb gets one **forced** first encounter: the hatch drops you onto soft rock (dig is the only move), the first ledge is right in front of home (zipline), the first loot is visible within ~10 s (concept target). The "heat glow leads to the first base" milestone should be forced the same way: guaranteed within N tiles on every seed, placed by the generator, not left to chance. That makes it a *placement constraint*, which is cheap (see 2.5).

### 2.4 Procgen should make interesting spaces: define "good" first

**What.** Kate Compton's "So you want to build a generator…" (2016) is the essay to read before writing any more generator code. Core moves: list the properties of a good artifact and the hard constraints ("the most reliable generators are the ones where you can concretely describe constraints"); aim for a *possibility space* where most outputs are good and none are broken; pick among distribution, parametric, tile-based, grammar, constraint and agent/simulation methods for the job; and beware the **10,000 bowls of oatmeal** problem: everything unique, nothing distinguishable. She separates *perceptual differentiation* (outputs look different) from *perceptual uniqueness* (outputs are memorable), and the second is the one that's hard.

**Why.** Generators fail by being boring far more often than by being broken.

**Apply to spelunking.** Write a one-page "a good dive column is…" list and turn each line into a check. Draft:
- Reachable: from the hatch, every ore/loot tile is reachable with Engineer verbs (walk, dig, zipline, climb down). *Constraint.*
- First loot within ~10 s of walking/digging from the hatch. *Constraint.*
- First heat glow within the first minutes, on every seed. *Constraint.*
- At least one "scale shot" cavern per ~N screens of depth. *Property.*
- Hard-rock bands that create "push or recall?" choices, not solid walls with no alternative. *Property.*
- No stretch of more than K screens without a landmark (vein, cavern, derelict, pipe). *Property.*
If you can't write a check for a property, it probably shouldn't drive generator work yet.

### 2.5 Guarantee first, decorate second (the Spelunky pattern)

**What.** Spelunky's generator (Derek Yu; best explained by Darius Kazemi's interactive "Spelunky Generator Lessons" and GMTK's "How (and Why) Spelunky Makes its Own Levels"): the level is a 4×4 grid of rooms. A random walk from a top-row start room moves left/right and sometimes down, assigning room *types* by required exits (left-right; with a bottom drop; with a top entry) until it reaches the bottom row, which gets the exit. That's the **solution path**, guaranteed traversable. Every other grid cell gets an unconstrained room. Each room type is then filled from a pool of hand-drawn templates, templates contain probabilistic tiles and "obstacle blocks" (small randomized sub-chunks), and only after that are enemies, traps and items placed. Yu wrote about the design reasoning (randomization, challenge, the "indifferent" world) in his Boss Fight Books *Spelunky*.

**Why.** Correctness comes from a tiny, provable skeleton. Variety comes from authored pieces. Neither job leaks into the other, so each is easy to debug.

**Example.** Brogue does the same with different parts: rooms are accreted one at a time onto a growing structure, so the result is traversable by construction (a tree from the first room); loops, lakes and bridges are then added, followed by "machines" (authored puzzle/vault setups). Unexplored (Joris Dormans) generates a *graph of cycles and lock/key pairs first*, then turns it into space.

**Apply to spelunking.** You already have the "decorate" half (v3 CA terrain). What you're missing is a cheap guarantee layer, and it can be tiny: after CA, run a flood fill from the hatch using Engineer movement rules, then either (a) carve a connector to any required feature that's unreachable, or (b) reject the seed and reroll. For a 2–3-minute dive column, rerolling is fine and simpler. Place required features (first loot, first heat glow, first base) by picking positions *on the reachable set* at the right depth. That's maybe 100–200 lines; it's not a new generator.

### 2.6 Hybrid beats pure: authored chunks, generated arrangement

**What.** Dead Cells (Sébastien Benard, 2017): a fixed hand-designed world frame, handcrafted room tiles per biome tagged by entrances/exits and purpose, a designer-drawn concept graph per biome, and the algorithm only picks rooms to fit the graph, then places enemies by rules tied to combat-tile count. The stated goal was having the algorithm involved "in the most restrained way possible." Noita does it with Sean Barrett's herringbone Wang tiles (pre-made pieces laid in a pattern that hides seams) plus hand-made "pixel scenes" stamped into biomes. Spelunky's templates are the same idea at smaller scale.

**Why.** Authored pieces carry intent (a readable puzzle, a composed view, a joke). Generation carries replayability. You get both, and you can improve quality by editing data rather than code.

**Apply to spelunking.** The *old city* layer is the obvious hybrid: author 15–30 small ruin chunks by hand (rooms, pipe runs, a collapsed stair, a machine room), and stamp them into the CA terrain in the top band. Same for derelict fragments: a template per lesson (flickering sensor / cracked wall / exposed turret wiring) with a few random slots, stamped at chosen depths. That's more reliable and faster to ship than making the base generator's `decay` parameter produce readable lessons. Stamps also give you the "Scale shots" cavern: author 3–5 big cavern shapes and carve one in every so often, instead of hoping CA makes one.

### 2.7 Players learn components, not layouts

**What.** The core insight of the GMTK Spelunky video, restated in the Procedural Generation blog's commentary on it: procgen shifts the player's learning "from figuring out the individual levels to… figuring out the implications of the individual components." Spelunky's components are few but dense with interactions (arrow traps fire at anything, including items and enemies; shopkeepers react to theft; bombs change terrain). You don't memorize 1-2; you know what an arrow trap *means*.

**Why.** This is where replayable depth comes from, and it's much cheaper than more layouts. Brogue and Caves of Qud are built on the same bet: a modest number of systemic parts, many interactions.

**Apply to spelunking.** Your "components" are materials (soft, hard, ore, loot), terrain shapes (1-step, 2+ ledge, overhang ≤45°/steeper, junction), bugs, glow and noise. Make each one **readable at a glance** (color/shape, per-material sound and dig resistance) and **consistent** (hard rock always stops mining; bugs always come to glow). Investing here (in b1/b2) beats investing in more terrain variety. When you add a new material or hazard, ask what it does with *every existing* component. If the answer is "nothing," it's oatmeal.

### 2.8 Perceptual uniqueness: landmarks and set pieces

**What.** Kevin Lynch's *The Image of the City* (1960) gives the vocabulary level designers still use: paths, edges, districts, nodes, landmarks. The Level Design Book's wayfinding chapter turns it into practice: players look where they're moving and at contrast; lit exits, framed views and "weenies" (a distant, visible goal) pull them; start subtle and add stronger cues only if playtests need them. In Breath of the Wild (GDC 2017 "Change and Constant"; GMTK's "How Nintendo Solved Zelda's Open World Problem"), big triangular landforms act as landmarks while medium ones *hide* what's behind them, so cresting a hill reveals the next thing and keeps pulling the player on.

**Why.** Caves are the worst case for navigation: everything is rock, everything is dark, the view is limited. Without landmarks, procedural caves blur into one. The player's memory of a dive is its landmarks.

**Apply to spelunking.** Your concept already contains the right tools; treat them as *navigation* features, not only atmosphere:
- **Depth districts:** old city → derelicts → natural rock → deep, each with its own color, light and sound. That's Lynch's districts, and it tells you where you are with no UI.
- **Landmarks:** glowing ore veins, heat glow through rock, a derelict's silhouette, a zipline you left last dive. Guarantee a landmark density (see the check in 2.4).
- **Weenies:** "visible but unreachable" background caverns and heat glow are exactly this. Place them so they're *just* out of reach and imply a route.
- **The triangle trick underground:** occlusion is free (rock). Make sure the generator produces *reveals*: narrow tunnels that open into rooms. CA with too much smoothing gives uniform blobs; too little gives noise. Neither has reveals. The stamped "scale shot" cavern is your big-triangle landmark.
- **Player-made landmarks:** tunnels you dug and ziplines you left are persistent marks. They're the cheapest landmarks you'll ever get; make them visible (lit, distinct).

### 2.9 Measure the generator by sampling

**What.** Michael Cook's interactive tutorial "Sampling and Measuring Generators": generate hundreds of outputs, compute a few metrics per output, and look at the distributions, not one sample. He's clear that metrics have blind spots ("difficulty" and "coolness" resist measurement) and that averages hide outliers. Expressive-range analysis is the next step up (plot two metrics against each other across many seeds).

**Why.** You tune generators by looking at the nice seed on screen. Players get the bad 3%.

**Apply to spelunking.** Your CA tools already dump PNGs to `gallery/`; add a headless batch that runs 500 seeds and writes a CSV: % reachable ore, depth of first loot, depth of first heat glow, number of 2+ ledges per screen, cavern count, and **stops per 100 tiles walked** (simulate the walker on the floor with your b1 stop rules). The last one matters a lot: your whole control scheme is "move until something changes," so terrain noise directly becomes twitchy input. If CA leaves lots of 1-tile nubs and tiny junctions, walks will stop constantly. That's a generator bug that looks like a controls bug. Look at histograms and the worst 10 seeds, not the mean.

### 2.10 Difficulty the player chooses: flow, and why casual games do DDA differently

**What.** Jenova Chen's MFA thesis *Flow in Games* (2006) takes Csikszentmihalyi's flow channel (challenge matched to skill; too hard → anxiety, too easy → boredom) and argues against *passive*, hidden dynamic difficulty adjustment. Instead, embed difficulty choices in play. In *flOw*, you dive deeper to face harder creatures or float up to easier ones, without a menu. Contrast Crash Bandicoot's hidden DDA (Andy Gavin, "Making Crash Bandicoot – part 6"): after repeated deaths you get a free mask, the boulder slows, a crate becomes a checkpoint; the rule was to "help weaker players without changing the game for the better players."

**Why.** Hidden DDA works in linear, death-heavy games but can make wins feel unearned, and it's hard to get right. Casual audiences don't want to *pick* a difficulty in a menu; they want to be able to *back off* in play.

**Apply to spelunking.** Depth *is* your flOw axis: deeper = harder rock, more hazards, better loot, and the player picks how far to go. Recall is the "float up." That's the whole DDA system; don't build a hidden one. Two cheap, honest levers if playtests show frustration: (a) near-home depletion pushes players down gradually, not abruptly; (b) bug pressure scales with *glow*, which the player controls (spend ore to build, dim the pack). Both are visible player-driven difficulty, the flOw model.

### 2.11 Pacing: sawtooth tension and release

**What.** Left 4 Dead's AI Director (Michael Booth, Valve) runs a four-state loop driven by an estimated "survivor intensity": **build-up** (full threat until intensity peaks), **sustain peak** (a few seconds more), **peak fade** (minimal threat until intensity decays), **relax** (30–45 s of calm or until players advance), then repeat. Stage-to-stage, most well-paced games use a *sawtooth* curve: difficulty rises, drops when something new is introduced or a power is gained, then climbs to a higher peak. Kenta Cho (ABA Games), whose small arcade games are the closest analogue to monthly browser releases, recommends gentle sqrt-shaped ramps for short games, with periodic saw-tooth drops so it doesn't get monotonous.

**Why.** Constant tension numbs. Relief makes the next peak land. A small state machine gets you most of the way; you don't need a model of the player.

**Apply to spelunking.** Your dive already has this shape: calm start (dim, empty pack) → greed builds (glow rises, bugs gather) → peak (swarm, hard rock, a find) → recall = release → home ritual (pet greets, camera pulls back) = relax. Tune it on purpose:
- **Within a dive:** bug pressure is your build-up curve. Make sure there's a *peak fade*: after a swarm steals bulk ore, fewer bugs for a while (glow dropped, so this can fall out of the existing rule).
- **Across dives:** each new depth band is a sawtooth drop: new material + slight easing, then ramp.
- **Home is the valley.** Keep home short and satisfying; it's the relax state, not a second game to grind.
Use the Bundle 2 dive log ("swarmed / full / found something") as your intensity trace.

### 2.12 Casual difficulty: short-if-hard, fun ≠ hard, prune the worst

**What.** King's level design talks (Jeremy Kang, GDC Europe 2016, "Level Design Saga") and later interviews (mobilegamer.biz, 2024): separate fun from difficulty ("hard levels can be fun… easy levels may lack engagement"); "the longer the level is, the less likely it is to be fun," so hard content should be short; measure "time to abandon" and "time to pass"; fix the 100 least-enjoyed levels regularly; "crazy hard levels never pay off, at least in the long term." Blockers are introduced on a "complexity staircase."

**Why.** Casual players give you seconds, not patience. Difficulty spikes cost retention more than they add challenge.

**Apply to spelunking.** Vault chambers (the hard content) are one screen: already short-if-hard, keep it. For procgen caves, "prune the worst" means rejecting bad seeds automatically (2.9), and later using the dive log to find the dive types players abandon. Blockers-on-a-staircase = one new hazard or material per depth band.

---

## 3. Anti-patterns and overengineering traps

Procgen is the single most tempting rabbit hole in this project. The concept doc already leans on generators everywhere (terrain, old city, base generator, decay, bots, skyline). Treat each as a cost.

**Procgen traps**

- **Building a generator before knowing what "good" is.** If you can't write the checks in 2.4, you're generating oatmeal at scale. Write the list first.
- **Algorithm shopping.** Wolverson's Roguelike Celebration talk is a great tour (BSP, CA, drunkard's walk, Voronoi, Wave Function Collapse, prefab stamping), and its real lesson is *combine two or three simple ones*. You already have CA. The smallest high-value addition is **stamped authored chunks + flood-fill reachability + reroll**. Not WFC, not graph grammars, not a Dormans-style cyclic system: those pay off for lock-and-key dungeons, which a free-digging game doesn't have, because every wall is breakable.
- **Tuning on one seed.** The seed in your screenshot isn't the game. Batch-sample (2.9).
- **Generating what should be hand-made.** Hand-author when: the content teaches something (first 5 minutes, derelict lessons, the first flawed vault; Bundle 4 already uses a hand-made starter vault, good), it appears once per player, it must be readable at a glance, or you need fewer than ~30 of it. Generate when: players see it hundreds of times, variety matters more than precision, and failures are cheap (terrain filler, ore scatter, bug spawns).
- **A generator per system.** The concept doc wants terrain, old city, derelicts, bot bases, skyline and neighborhood all generated. Month-one reality: one terrain generator + a stamp library + parameter tables. The base generator can start as "pick 1 of 8 hand-made base templates, randomize slot contents." Upgrade only when players have seen all 8.
- **Simulation for its own sake.** Dwarf Fortress and Caves of Qud (whole histories, cultures, myths) are decades-long or years-long projects by specialists. Tarn Adams's motive, "it always comes back to surprising ourselves," is fine for a lifetime project, not a monthly ship. Take the attitude (systemic parts that combine), not the scope.
- **Physics-sim world envy.** Noita's falling-sand world is the result of years of engine work (see Purho's GDC talk). The borrowable part is the *design* layer: Wang-tile stamps and pixel scenes over a biome. Your grid is intentionally discrete and deterministic; keep it that way.
- **Guaranteeing with search when construction will do.** Don't write a pathfinder-driven "is this level solvable" AI when a flood fill with your movement rules, or building the guaranteed path first (Spelunky), answers it.

**Onboarding and difficulty traps**

- **Text tutorials and popups.** Your wordless pillar already bans them; the risk is sneaking them back as "just one arrow." Try level solutions first (forced encounter, lit path, weenie).
- **Teaching under threat.** Bugs, raids or timers during first exposure to a verb (2.2).
- **Optional lessons for required verbs.** If a verb is needed later, its first encounter must be forced (2.3).
- **Hidden DDA as a patch for bad tuning.** Fix the curve or give the player the lever (depth, glow). Don't add a secret rubber band.
- **Flat pressure.** Bug pressure that only rises, with no fade, turns greed into a chore. The dive log "swarmed" reason is your alarm.
- **Long and hard.** A long dive that's also hard (deep rock + heavy swarms) breaks King's rule. Hard should mean short: harder depths, shorter useful dives.
- **Uniform caves.** CA smoothed until everything is a round blob: no reveals, no landmarks, nothing to talk about. Stamp set pieces.

---

## 4. Annotated sources, ranked by value per hour

★ = watch/read first. All links checked September 2026.

### Tier 1: read or watch first

1. ★ **Kate Compton, "So you want to build a generator…"** (essay, 2016, ~20 min). The single best pre-procgen read: artifacts, properties vs. constraints, possibility space, 10,000 bowls of oatmeal. https://www.tumblr.com/galaxykate0/139774965871/so-you-want-to-build-a-generator
2. ★ **Darius Kazemi, "Spelunky Generator Lessons"** (interactive, ~30 min). Spelunky's solution-path + templates generator in runnable JS. Directly portable to your column-of-rooms. http://tinysubversions.com/spelunkyGen/
3. ★ **GMTK, "How (and Why) Spelunky Makes its Own Levels"** (video). Why the approach works: players learn components. https://www.youtube.com/watch?v=Uqk5Zf0tw3o
4. ★ **GMTK, "Super Mario 3D World's 4 Step Level Design"** (video, 12 min). Teaching a mechanic in five minutes with no text. https://www.youtube.com/watch?v=dBmIkEvEBtA — with the source interview: **"The secret to Mario level design"** (Hayashida, Game Developer, 2012). https://www.gamedeveloper.com/design/the-secret-to-i-mario-i-level-design
5. ★ **Sébastien Benard, "Building the Level Design of a procedurally generated Metroidvania: a hybrid approach"** (article, 2017, ~20 min). The hybrid recipe step by step, from the Dead Cells lead designer. https://www.gamedeveloper.com/design/building-the-level-design-of-a-procedurally-generated-metroidvania-a-hybrid-approach- (also on his site: https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/)

### Tier 2: high value, short

6. **Michael Cook, "Sampling and Measuring Generators"** (interactive tutorial, ~20 min). How to evaluate a generator over hundreds of seeds. https://www.possibilityspace.org/tutorial-sampling/index.html
7. **Post-GDC: Physical Gameplay in Half-Life 2** (Game Developer, 2006, ~10 min). Valve's evidence that pressure kills learning; three training modes. https://www.gamedeveloper.com/design/post-gdc-physical-gameplay-in-i-half-life-2-i-
8. **Miyamoto & Tezuka on World 1-1** (Eurogamer video) and the Game Developer write-up. https://www.youtube.com/watch?v=zRGRJRUWafY · https://www.gamedeveloper.com/design/how-miyamoto-built-i-super-mario-bros-i-legendary-world-1-1
9. **The Level Design Book, "Wayfinding"** (web chapter, ~20 min). Lynch's elements, lighting, weenies, breadcrumbs, applied to levels. https://book.leveldesignbook.com/process/blockout/wayfinding
10. **RogueBasin, "Cellular Automata Method for Generating Random Cave-Like Levels"** (~10 min). The 4-5 rule, iteration counts, pillar variant, connectivity caveats. Reference for your existing CA tools. https://www.roguebasin.com/index.php/Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels
11. **Herbert Wolverson, "Procedural Map Generation Techniques"** (Roguelike Celebration 2020, with code). Best one-sitting survey of map algorithms and how to combine them. Watch it *to decide what not to build*. https://www.youtube.com/watch?v=TlLIOgWYVpI · code: https://github.com/thebracket/roguelike-celebration-2020
12. **Andy Gavin, "Making Crash Bandicoot – part 6"** (blog, ~15 min). Concrete hidden-DDA rules and their goal. https://all-things-andy-gavin.com/2011/02/07/making-crash-bandicoot-part-6/
13. **How King defines a "good" Candy Crush level** (mobilegamer.biz, 2024, ~10 min). Fun ≠ difficulty, short-if-hard, pruning. https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/

### Tier 3: worth it when the topic comes up

14. **Jenova Chen, *Flow in Games*** (MFA thesis, 2006, ~45 min). Flow channel and player-chosen DDA; the theory behind "depth as difficulty." https://www.jenovachen.com/flowingames/Flow_in_games_final.pdf
15. **Left 4 Dead AI Director** (build-up / sustain / fade / relax). Booth's GDC slides are mirrored unofficially; the wiki summary is accurate enough for the pacing model. https://left4dead.fandom.com/wiki/The_Director
16. **GMTK, "How Nintendo Solved Zelda's Open World Problem"** (article/video, ~15 min). Triangle rule, landmark gravity, reveals. https://gmtk.substack.com/p/how-nintendo-solved-zeldas-open-world · GDC session page: https://www.gdcvault.com/play/1024562/Change-and-Constant-Breaking-Conventions
17. **Egoraptor, "Sequelitis: Mega Man Classic vs. Mega Man X"** (video, 2011; profane, opinionated). The classic teardown of teaching through level design. https://www.youtube.com/watch?v=8FpigqfcvlM
18. **Brian Walker, "Procedural level design in Brogue and beyond"** (Roguelike Celebration 2018). Accretion, loops, "machines" (authored setpieces in generated maps). https://www.youtube.com/watch?v=Uo9-IcHhq_w · written walkthrough: http://anderoonies.github.io/2020/03/17/brogue-generation.html
19. **Boris the Brave, "Dungeon Generation in Unexplored"** (article, ~25 min). Cyclic, lock/key, graph-rewriting generation. Read to understand the ceiling, not to copy it. https://www.boristhebrave.com/2021/04/10/dungeon-generation-in-unexplored/
20. **Kate Compton, "Practical Procedural Generation for Everyone"** (GDC 2017). The essay's ideas as a talk, with simple data-structure-driven generators. https://www.youtube.com/watch?v=WumyfLEa6bU
21. **Petri Purho, "Exploring the Tech and Design of Noita"** (GDC 2019). Mostly tech; the design part covers roguelite choices. https://www.youtube.com/watch?v=prXuyMCgbTc · Noita's herringbone Wang tiles + pixel scenes: https://noita.wiki.gg/wiki/World_generation · Sean Barrett's original: https://nothings.org/gamedev/herringbone/herringbone_tiles.html
22. **Derek Yu, *Spelunky*** (Boss Fight Books, 2016, a few hours). Randomization, challenge, the "indifferent" world, and finishing a game, from the creator. Also good for the scope/process guide. https://bossfightbooks.com/products/spelunky-by-derek-yu
23. **Jeremy Kang (King), "Level Design Saga: Creating Levels for Casual Games"** (GDC Europe 2016). https://www.youtube.com/watch?v=LuNH9Rz2e2k
24. **Kenta Cho / ABA Games, "Joys of Small Game Development": Rising Difficulty Curve** (~5 min). sqrt ramps and sawtooth drops for very short games. https://abagames.github.io/joys-of-small-game-development-en/difficulty/curve.html

### Tier 4: deep reference, low value per hour for this project

25. **Grinblat & Bucklew, "End-to-End Procedural Generation in Caves of Qud"** (GDC 2019). Village and history generation, impressive and far beyond monthly scope. https://www.youtube.com/watch?v=jV-DZqdKlnE
26. **Tanya Short & Tarn Adams (eds.), *Procedural Generation in Game Design*** (CRC Press, 2017). Chapter-per-topic anthology from practitioners; dip in, don't read cover to cover. https://www.routledge.com/Procedural-Generation-in-Game-Design/Short-Adams/p/book/9781498799195
27. **Tarn Adams: "It always comes back to surprising ourselves"** (Game Developer interview). The Dwarf Fortress mindset: systemic parts combined freely. https://www.gamedeveloper.com/design/-i-dwarf-fortress-i-dev-it-always-comes-back-to-surprising-ourselves-

**Attribution notes:** The widely cited Mega Man X level-design breakdown is Egoraptor's, not GMTK's. GMTK does have *Half-Life 2's Invisible Tutorial* (https://www.youtube.com/watch?v=MMggqenxuZc, listed in [04](04-motivation-and-audience.md)). The primary source is still Valve's own GDC 2006 talk (item 7).
