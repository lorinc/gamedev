# Spelunking Base (working title)

Dome Keeper-style spelunking with randomized loot, feeding an underground automated base that other players can visit and raid asynchronously.

Built on the pillars in [opinionated_games.md](opinionated_games.md).

---

### Core Loop

* **Dig → Loot → Install → Produce → Dig Deeper**
* **Dig:** walk, drill, and climb down through procedurally generated rock; teleport home when it's time (see *Why Go Home*).
* **Loot:** beyond resources, find randomized relics, gadgets, and **automation modules**.
* **Install:** modules and relics go into the base, changing how its machines work.
* **Produce:** the base converts installed setup into passive yield.
* **Dig deeper:** yield funds better gear for deeper, riskier dives with better loot.
* *Core Value:* Spelunking and automation are one loop, not two games. Loot is the bridge.


* **Depth Is Risk**
* Deeper layers: harder rock, more hazards, rarer loot.
* **The top layer is not dirt, it's the old city.** Below the settlement lie the buried ruins of earlier colonists: collapsed rooms, pipes, machinery, and derelict bases. Dense with loot by nature, so the first seconds of digging are bountiful. Real geology starts below the ruins.
* Depth reads as a story without text: **old city → derelict bases → natural rock → the deep.**
* Maps onto the three-tier world: your bases are the **Sanctuary**, the rock between bases and the mid-depth shared caverns are the **Commons**, the abyss is the **Frontier** (shared deeper layers are a later tier; see Scope).

---

### Setting: A Little Moon Colony

* **Why We Dig**
* A tiny colony on a small moon orbiting a **giant ringed gas planet**. The surface is beautiful but has **no air**: anything you live in or run must be sealed underground.
* Kept light and pretty, never grim: no radiation or doom, just no air. Colonists are cute and round.
* The player looks at the surface a lot, so the sky is a showpiece: the gas giant, its rings, a nebula, auroras. Exactly what the light-is-the-art style does well.


* **The Setting Explains the Mechanics for Free**
* Heat signatures are thermal imaging; beacons are transponders; teleporters, drones, and sensors are native. Engineer / Demolitionist / Ghost fit without magic.
* **Derelicts** are the ruins of earlier colonists; **relics** are their leftovers. Story without text.
* The **skyline** is other colonies' beacons shining across the moon's surface under the planet.
* The **starter base** is a landed pod on the surface (a nod to Dome Keeper's dome).


* **The Surface Settlement**
* A pretty, half-buried community hub: a real settlement with shops, colonists, and pets. It sets the game's vibe.
* **Circular:** the settlement wraps around the little moon. Walk in one direction and you arrive back home.
* **Starter bases line the ring:** each player's pod is half-buried in the settlement. Other players' pods are **visible but not accessible**, neither from above nor below. They are visuals for drooling, not gameplay: tuned glows, particle fountains, and materials on display feed the bucket list (pin what you love).
* Your own pod is home. **A hatch in its floor opens down into the Commons**, where digging starts.
* Populated by colonists (NPCs) and bots at launch; real players' avatars later.
* **Later: districts.** Players can move to a different district of the ring with different visuals and probably perks.
* **Open:** what the shops do. They must respect *Earned, Never Free* (e.g., fabricate from materials you mined, never sell finished things outright).


* **Open: Surface Mechanics**
* The surface needs mechanics at some point, but only ones that integrate into the core loop (dig → loot → install → produce → dig deeper). Standalone surface events are rejected.

---

### View, Art & Customization

* **Pure 2D Side-Scroller Gameplay, 2.5D Visuals**
* Gameplay is a 2D side-view integer grid: readable, touch-friendly, deterministic (needed for replays and verification).
* 2.5D is presentation only: **parallax layers** give depth, scale, and background promises (skyline, distant caverns).
* Vaults stay one-screen, King of Thieves style. No 3D or multi-plane gameplay complexity.


* **Art Style: Light, Particles, Procedural Animation**
* No large tileset, no hand-painted art. The art is code: shaders, dynamic lighting, particles, procedural animation, procedural rock textures.
* **Everything that matters glows** in a near-black world: ore veins, loot, machines, beacons, and above all **heat**. The core mechanic is the visual language: cold Ghost bases are literally dark, hot fortresses blaze.
* **Richness from motion, not variety:** ore streaming on conveyors, sparks, heat shimmer, animated machines (as in Mindustry / Factorio).
* A small set of bold, simple sprites (character, machines); AI generation handles those well.
* References: Kingdom Two Crowns (simple art made gorgeous by light and reflections), Noita (light and reactive caves), Downwell (3 colors, great feel), Limbo / Inside (silhouettes), shapez.io (minimal art, browser → Steam).
* Striking on portal thumbnails: a glowing ant farm on black.


* **What Makes It HOME**
* **Warm light in the dark:** a pocket of glowing, humming, ordered machinery inside hostile darkness. The first lamp is the first act of making a home.
* **Safety against danger** (the Project Zomboid lesson): home is a place you made safe. Heat and raids are "what's out there"; defenses are the barricades.
* **Arrival ritual:** recall home, camera pulls back, the base hums.
* **Personal marks:** tunnels you dug, trophy wall, tuned visuals, path gear.


* **Exploration Feeling (Techniques, Not Rendering)**
* **Visible but unreachable:** heat glow through rock, caverns in background parallax layers, the skyline. Curiosity comes from seeing what you can't reach yet.
* **Scale shots:** after long tight tunnels, the generator occasionally opens a huge cavern with a tiny player inside it.
* **Depth changes atmosphere:** light color, sound, and rock type shift per layer.
* **Secrets behind walls:** every wall is breakable; derelicts and caches hide behind them.
* **Reactive world:** falling rock, chain reactions, particles.


* **Customization by Parameters, Not Pixels**
* Players tune how their base looks: light color, pulse rhythm, particle fountains, glow patterns, machine motion.
* You can't write words with a particle emitter: rich expression that keeps the wordless rule and needs no moderation.


* **Loot Carries Visual Genes**
* Relics, modules, and materials bring new visual parameters: a flame color, a spark pattern, a crystal growth shape (like No Man's Sky creature mutations).
* A base's look is its owner's loot history.


* **Earned, Never Free**
* Nothing is given or copied. If you want a sparkly wall, you mine the crystal or manufacture it. The world must feel real and earned.
* Seeing something you love in another base (visit, raid, clanmate) does **not** let you copy it.


* **Pin It: The Bucket List**
* Pin anything you see and love (a glow pattern, a machine, a gear piece, a wall material). It goes on your **bucket list**, together with **how to get it**.
* "How to get it" is shown wordlessly: source depth band, biome glyph, required ingredients and machines as icons, path affinity.
* A FOMO-driven quest system: other players' bases generate your goals. Aspiration turns directly into a route.

---

### Controls & Genre

* **Swipe Until Something Changes (Active Play)**
* Difficulty comes from composition, matchups, and knowledge, not dexterity, so controls are low-effort and low-error. Follows the platform's *No Menus* pillar. Proven model: Tomb of the Mask (swipe, slide until something stops you).
* **Scope:** these controls cover spelunking. Base-building controls are designed later.
* **Swipe = intent, not steps.** Eight directions (four straight, four diagonal); the character carries the intent out by itself until the environment changes or you tap the character. Lemmings-style terrain traversal, except the character isn't dumb: it stops at danger instead of walking into it. A new swipe replaces the current intent.
* **The character is 1 tile tall** in the simulation (no crouching), drawn ~1.3 tiles tall so climbing a 1-tile step reads naturally (Spelunky precedent: 1-tile character, automatic ledge scramble).
* **Chill by design: no falling.** Walking in the dark is the point; a wrong move never ends a dive. Nothing the player does starts a harmful fall (see *Ledges, Gaps & Descents*).
* **What a swipe means depends on where you stand:**
* **On open floor:** left / right = **walk**: follows the floor, climbs 1-tile steps up and steps down 1-tile drops without stopping, so ragged cave floors are walkable ground. Diagonal = **mine / build** that way (diagonal stairs are the way down). Down does nothing: **no digging straight down** (decided in b1, 2026-09-25).
* **At a wall** (walking stops at every wall 2+ tiles high, any material): swipe into it = **mine** until the environment changes. Diagonal = mine / build. Up = **climb straight up, Ghost only**; everyone else builds diagonally up.
* **At a ledge** (walking stops at every drop of 2+ tiles): swipe into the gap = **cross it**. Diagonal = mine / build. Down = **climb down**, the same for everyone. Crossing is a path signature (see *Ledges, Gaps & Descents*).
* **Mine or build:** the tile decides. Rock is mined, air is built. A diagonal makes a 1-tile staircase, which the walker's automatic step climbing then walks: the non-Ghost way up.
* **Mine first, then look:** a mining step moves into the mined cell only if it has a floor (or a 1-tile step down to one); otherwise the character stays at the edge, so a tunnel never walks you into a chasm (decided in b1, 2026-09-25).
* **Mining, digging, and building continue until the environment changes or you tap the character.** Soft rock does not stop mining, so a long tunnel is one flick; harder rock stops it, so continuing is a decision. Material boundaries become meaningful choices.
* **Digging is slower than walking:** placeholder 3× slower; later set by mining gear × rock type. Open galleries feel like travel, rock feels like work.
* **Building costs a little ore:** 1 bulk ore per 12 tiles built, taken from the pack. Spending glowing bulk also dims the pack, so building doubles as relief from bug pressure.
* **Stop rules** (what counts as a change): walking: a wall, a 2+ drop; mining / building: breaking into open space, a new material (harder rock, ore vein, loot); always: a hazard, bugs or detection starting, a tunnel junction.
* **Tap the character = stop now.** Tapping the idle character: detect surroundings (TBD).
* **Tap anywhere else = light that way.** Unlimited and free (casual, not survival): Engineer torchlight, Demolitionist flare, Ghost listens.
* **Long-tap = charge the teleport home;** it fires at full charge, so the charge time prevents accidents. Released or moved before full charge, it simply counts as the tap or swipe it was.
* **No drag gestures, and pinch only zooms.** Every touch is a swipe, a tap, a long-tap, or a pinch-to-zoom.
* **Swipe angle zones:** wide horizontal zones (~±30°), narrower diagonals, so a walk is rarely misread as slower, ore-costing mining or building. Tuned in Bundle 1.
* **Bump to interact:** swiping *into* loot picks it up, into a door opens it, into a turret acts on it with your gear (rewire, charge, sneak past). One verb, always intentional, no small tap targets to hit by accident.
* Deterministic and discrete: replays, proofs, and verification stay trivial.


* **PC: WASD + Mouse**
* **WASD: hold to move / mine / build** tile by tile; release to stop. Two keys together (W+D, S+A, …) = diagonal.
* **Numpad: one key per intent,** the classic roguelike layout: 7 8 9 / 4 6 / 1 2 3 = the eight directions, 5 = stop (same as tapping the character). Diagonals without chording.
* **Stop rules become soft stops:** at a wall, a new material, a detection-zone edge, a ledge, or open space, the character pauses; press again to continue. Same decision points as swiping, no accidental slides into sensor beams.
* **Mouse click:** click the character to stop, anywhere else to light that way (same as tap); in the base overview, designate rooms, tap ports, place and move ghosts.
* **Mouse hold:** charge the teleport home (same as long-tap).
* **Mouse wheel:** zoom (the mode switch).
* **Fairness rule:** both inputs drive the **same simulation commands on the same grid**: grid-discrete movement, same speed, raid-relevant stops (detection zones, cover) identical. No precision advantage on PC, so a vault armed on PC is beatable on a phone and vice versa.


* **Designate to Carve (Base Building)**
* Pinch out into the base overview and **mark rooms to carve**; the character (or drones) digs them out. Carving rooms swipe by swipe would be tedious; planning is where designation shines.
* Machines and pipes follow *Building Interaction* (long-press tiles, tap ports, ghosts).


* **Other Controls**
* **Recall:** long-tap anywhere (see *Swipe Until Something Changes*); no button on screen.
* **Pinch only zooms.** Zoomed far enough out, the view becomes the map.
* **Location is the mode:** in your base you build; in the Commons you dig; in a vault chamber you raid.


* **Things Live in the World**
* Pack: a 3–5 slot strip at the screen edge (the only persistent on-screen element). Stored items sit on shelves in the base.
* Gear / loadout: a physical gear rack in the pod; the result shows on the silhouette.
* Bucket list: a pinboard in the pod with holographic items and direction markers.
* Raid replays: holograms inside your own vault chamber.
* Clans and sharing: the device's native share sheet (links, not screens).


* **Any Aspect Ratio**
* Must run in portrait, landscape, and square (YouTube Playables requirement).
* **The vault chamber is roughly square (1:1)** so it fits every ratio without scrolling.
* Elsewhere the camera adapts: portrait shows **deeper** (shaft, depth: digging), landscape shows **wider** (base cross-section: building).


* **Raid Pacing: Swipes in Real Time**
* Raids use the same swipe controls: swipe, slide, stop at the sensor beam's edge, wait for the sweep, swipe again. Stop rules include "entering a detection zone" and "reaching cover."
* Defenses keep moving in real time while you slide, so adrenaline stays; precision pressure mostly disappears because commands are discrete.
* This sits between the earlier options (real-time tap commands vs. step-based Hitman GO style). Step-based remains the fallback if phone playtests show real time still feels unfair.


* **Resulting Genre**
* Not a platformer (no precision jumps), not idle (but with an idle layer: offline production).
* Roughly: **Core Keeper-style digging and base-building + King of Thieves raid structure + Mindustry automation, played with swipes on any screen.** Short active sessions (dives, raids) with an idle base in between.


* **Feel Test (Bundle 1 in *Playtest Bundles*)**
* **Tuning the stop rules is the whole design:** too many stops feel twitchy, too few overshoot. Tomb of the Mask's feel came from its stop rules.
* Juice still carries digging: screen shake, chunks flying, rock resisting as you slide through it.
* Test on a cheap Android phone and in all three aspect ratios from the start.

---

### Hooks: 5 Seconds / 5 Minutes / 5 Hours

* **First 5 Seconds: "This feels good, and there's something down there."**
* Drilling immediately: rock cracks, chunks fly, sound differs by rock type.
* Around: the settlement ring with other players' glowing pods, and the skyline of beacons under the gas giant. *Others are here, and they're bigger.*
* Below: rock with loot showing through; first loot pop at ~10 seconds.
* Recall is always available, so digging down costs nothing mentally.
* **Solved by the setting:** the top layer is the buried old city, not dirt: rooms, pipes, and machinery, dense with loot.


* **First 5 Minutes: "I can beat these" → "I WANT that" → "I'll be smarter next time."**
* 1. Derelict fragments: beat each on the first or second try, get a starter gear piece.
* 2. A heat glow leads to a real base, way cooler than yours.
* 3. Get shot: the defense that got you is highlighted, the other flaws are visible. *I played it wrong; next time, the other way.*
* 4. Back in seconds; beat it; win the underground beacon.
* 5. Plant it; the first drill mines while you're gone.
* Detection, the three paths, raiding, and building learned without a word; the first path grows out of whichever fragment the player enjoyed.
* *Risk:* tuning the fragments to be easy but not trivial.


* **First 5 Hours: "My base is me, I have rivals, and my clan needs me."**
* **Identity echoing through every system:** path → attack style → what you can arm → defense style → heat color others read.
* **Trade-offs with no right answer:** production vs. cooling vs. defense; each outpost pushes deeper but adds heat; each teleport blip might reveal a hidden outpost.
* **Pushing deeper:** outposts break the "walk there" tax step by step; the exploration frontier keeps moving.
* **A growing bucket list:** every base you visit, raid, or test adds pinned wants with a route to earn them. Other players generate your goals.
* **Nemesis:** raid replay with the attacker's path through your vault → fix the gap → revenge (ignores shields).
* **Clans:** clanmates arm vaults you couldn't, sigils on vaults, shared Blueprints, "beat my vault" links in the group chat. Specializing is weak alone, strong together.
* **Why come back tomorrow:** offline production, plus "you were raided, watch it."


* **Open Questions**
* **Bots are weak nemeses.** In month one, rivalry and clans depend on real players; until they exist, generator variety must carry hours 1–5.
* **Hour 20 is undefined.** The epic base is a milestone, not a goal. Needs a one-sentence answer to "what am I ultimately working toward?" before pitching. Frontier and abyss are still "later."
* **Timing of the first raid on you:** after the player has had time to build defenses, but before the end of hour 1, or the defense half of the loop arrives too late.

---

### Opening: Surface Base & First Discovery

* **Start With a Small Surface Base**
* The player spawns in their own small, nearly empty **starter pod**, half-buried in the surface settlement, with a **starter-tier beacon**. The **floor hatch** opens into the Commons below; the player is digging within 3 seconds. No cutscene.
* The starter base is a home and storage point: where recalled loot lands. Too small and cold to be raided.


* **The Starter Pet**
* A small, procedurally animated local critter lives at the starter base from the first second.
* **Arrival ritual:** it greets the player on every recall home. The emotional anchor that makes the starter base home from minute one.
* **To test:** wordless hints (perks up and sniffs toward nearby loot or heat). One small rule; keep only if playtests show it helps.
* First sign of the later tenants, pets, and Tamer path.


* **Derelict Base Fragments: Win Before You Lose**
* Between the surface and the first real base, digging through the buried old city breaks into **derelict fragments**: ruined, partial bases with broken defenses. Cold and dead, so found by digging, not by heat glow.
* Each fragment holds **one broken defense and one lesson**, beatable on the first or second try:
* a sensor with a flickering blind spot (sneak: Ghost),
* a cracked wall (blast: Demolitionist),
* exposed wiring on a turret (rewire: Engineer).
* Broken defenses still warn and fire, but weakly (slow, inaccurate); getting hit here knocks you back without sending you home. The player learns damage and detection softly.
* Each fragment's reward is a **starter gear piece of that path**. The player arrives at the real base having *already beaten defenses*, carrying the tool for at least one approach. Their first path emerges from what they enjoyed, not from a menu.
* Same base generator with a **decay** parameter; no hand-authored content.
* *Core Value:* Stacking visceral primitives: one defense, one lesson, one reward at a time, before they're combined in a real base.


* **First Milestone: Discovering an Underground Base**
* Digging down, the player sees their first **heat glow through rock**: a direction, not an explanation. Following it breaks into a cavern holding an underground base (a bot at launch; later a low-rating real player) that is *way* cooler than theirs: flowing conveyors, heat shimmer, turrets, a trophy wall.
* Guaranteed on every seed within the first minutes of digging, but found by following a signal, not placed on a scripted path.
* The first heat signature the player ever follows teaches heat-as-visibility before they own any heat.
* *Core Value:* The "I want a base like this" moment, earned by exploring, not staged.


* **Poke Around, Learn by Being Pushed Back**
* The player can wander through the base freely. Trying to break something wakes the defenses.
* **Warning before fire:** turret swivels, lights go red, a rising tone, *then* it shoots. Teaches that bases *detect*.
* **Getting shot is spectacle, not punishment:** sparks, knockback, a quick teleport back to the surface base. Costs seconds.
* **The critical lesson:** getting shot must read as *"I must get that, but I must be smarter / stronger / sneakier next time"*, never "impossible" or "unfair". If this lesson fails, the player doesn't come back and the loop breaks.
* What makes it land:
* **Prior success:** the derelict fragments already proved defenses can be beaten, so failure reads as "played it wrong," not "can't be done."
* **Legible cause:** the moment of failure highlights the defense that got you (the sensor that saw you, the turret that fired). You know *what* beat you.
* **Visible alternatives:** the real first base contains **one flaw per path** (a blind spot, a weak wall, exposed wiring), matching the fragments' lessons. Whatever the player's gear, a way in exists, and they can see the others.
* This is the raid engine with nothing at stake: no separate tutorial content or tech.


* **Wanderer vs. Raider**
* **Before owning an underground beacon, the player is a wanderer:** poking never costs the owner anything.
* **Reaching the vault** earns a system-minted **trespasser's prize**: the **underground beacon**. Two valid approaches, player's choice:
* **Find the flaw:** the first discovered base has one weakness per path in its design. Spotting and exploiting one teaches how to defend your own base by seeing a flawed one. The first "I outsmarted it" moment.
* **Brute force:** blast through the defenses. Defenses reset on every attempt; the player must *get good* at brute force by gearing up from spelunking loot (Demolitionist gear at launch; Juggernaut armor and healing later). Parallel specialization paths apply from the very first milestone (see *Paths*).
* Either way, the owner loses nothing.
* **After planting an underground beacon**, the same action is a real raid (dropoff, shields, revenge apply).


* **Bots Around the Opening**
* Advanced bots are visibly *doing* things in the Commons: blasting through a chain reaction, blasting down a shaft trailing fire, rope-swinging across a chasm with glowing loot.
* Bots sometimes gift small items to newcomers (ordinary bot behavior, not a staged moment).


* **Progress Must Be Visible**
* Every major upgrade changes the silhouette or effects: drill shape, flare color, relic auras, particle trails, how rock breaks around you.
* Gear *is* the status display, consistent with the no-UI pillar. If progression isn't visible, there is nothing to aspire to.


* **Near Goals, Not Just Far Ones**
* Mix on display: mostly players a few minutes ahead, some an hour ahead, one legend.
* Pay off fast: something seen early becomes obtainable within minutes ("I saw green flares, and two minutes later I had them").
* The first discovered base is a few minutes to an hour ahead of the player, not a legend.


* **Skyline From the Surface Base**
* Behind the surface base, a parallax background layer shows the **skyline**: heat plumes and beacon beams rising over the landscape, dozens of bases visible as columns of light, bright and faint.
* The long-term aspiration: "I want *that* base."


* **Showcase Content**
* **At launch:** bot loadouts and bases come from a **base generator** (see *Market Positioning*), tuned by archetype and difficulty parameters. The designer controls what players aspire to through the parameters, not by hand-authoring each base.
* **Later:** real players' snapshots from other browsers are mixed in, **only if they pass verification**. Forged gear must never advertise things nobody can actually get.

---

### Spelunking & Loot

* **Visceral Digging**
* Dig down within 3 seconds of loading. Digging, carrying, and dodging hazards are the primitive actions; later layers combine them.


* **Recall Teleport, No Lift**
* The player can teleport home at any time, carrying their pack. No lifts, no climbing back up.
* Not free: the next dive starts from home again, so the distance dug and walked to get down there is lost. The decision is *when* to recall (see *Why Go Home*).


* **Ledges, Gaps & Descents (No Falling)**
* **No fall damage, no falls.** A chill game: walking in the dark, where one wrong move ends the turn, is not chill. 1-tile drops are walked down; walking stops at every drop of 2+ tiles.
* **At a ledge, swipe into the gap = cross it (path signature):**
* **Engineer: permanent zipline.** Stays in the world for return trips and future dives.
* **Ghost: rope-swing,** free.
* **Demolitionist: builds a bridge, slowly** (normal building cost). Strong, loud, heavy: no graceful shortcuts.
* Ziplines, ropes, lights, and explosives are free and never run out: casual, not survival.
* **At a ledge, swipe down = climb down, the same for everyone.** Overhangs up to 45° keep the climb going; a steeper overhang stops it. Stuck there:
* **Floor 4 or fewer tiles below:** anyone can drop (a harmless drop).
* **Otherwise, a path signature:** the **Engineer** ziplines out, the **Ghost** ropes down, the **Demolitionist** must teleport home.
* **Climbing up (Ghost only):** straight up any wall, with the same 45° overhang rule. Stuck under a steeper overhang: tap to light, long-tap to teleport home, build diagonally, drop if there is floor 4 or fewer tiles below, or rope down.
* **The Ghost's trade:** massive traversal boost, massive digging weakness.
* *Core Value:* Ledges and gaps become path-flavored decisions; the glow / noise → bugs system is the only pressure. No health system.
* **Open:**
* **Everyone starts as an Engineer,** so there is no path-less state.
* **Mixed gear: TBD.** Which path decides crossing, escapes, and tap light when the gear slots hold several paths.
* Zipline length limits.


* **Why Go Home**
* Principle: the best dives end because the player *wants* something at home, not because they're forced. Recall is free, so the question is what makes going home worth losing the depth dug to.
* **1. Loot usable only at home (strongest pull):** machines and modules install in the base; path gear goes on the **gear rack** in the pod. **Gadgets** (charges, ore magnets, one-off tools) work immediately in the field for instant gratification; everything bigger pulls you home.
* **2. Rock you can't break yet (push with a purpose):** a glowing vein behind rock your drill can't handle. Go home, upgrade, come back with a target (Metroid gating; *visible but unreachable*).
* **3. A bucket-list item becomes craftable:** a pinned item lights up (a small glow on the pack) once you carry everything it needs.
* **4. Moon bug pressure (diminishing returns over time):** see *Moon Bugs*. Replaces a hard inventory wall and any timer.
* **5. Depletion (diminishing returns over space):** loot near existing tunnels and the old city near home gets mined out, pushing you deeper and elsewhere; gives outposts their purpose.
* **Avoid:** losing loot on death, inventory Tetris, hard timers that end dives against the player's will.
* **Pacing target:** 2–3 minute dives; tune loot density so a pull trigger (1 or 3) fires in most dives. Rhythm: dive → "ooh!" → recall → install → dive deeper.


* **Moon Bugs**
* **Pivot (2026-09-25, D054, after playing b2.1):** bugs become the miners. Wild bugs nibble ore from your pack; one that has eaten 16 is tamed, and then sucks the ore you've revealed out of the rock within 12 tiles of its den, and hands it to you as you run past. Its area turns friendly (moss, bulbs, red grass, glowing lichen). No teleport home: you carry the loot back. Ore and loot have no use yet, on purpose. The design is in [next-bugs.md](../spelunking/timeline/p5-darkness/next-bugs.md); the notes below are the earlier concept.
* Local fauna (the starter pet can be a tamed one; seeds the later Tamer path).
* **No combat input:** the character defeats bugs automatically; they drop small loot. Early in a dive, bugs are a bonus.
* **Overwhelm:** when more bugs are adjacent than your gear handles, they take items from your pack and wander off with them.
* **They steal the most common items** (bulk ore), never rare finds, never equipped or installed things. The loss is volume, not treasure: real pressure, never a ruined dive. No chasing, no recovery mechanic.
* **Attracted by glow and noise:** loot in your pack glows, so a fuller, richer pack draws more bugs; digging adds noise / heat. Greed invites the swarm; returns diminish the longer and richer the dive. Readable in the world, no UI.
* **Your loot is your light:** caves are dark, and the pack's glow is what lights your path. An empty pack means a tense, dim start; a rich pack lets you see far, and makes you seen. One number (glow) drives both sight and danger: the light-is-the-art style and the risk system are the same thing.
* **Glow shielding cuts both ways:** dimming the pack means fewer bugs *and* less sight.
* **Each path handles darkness differently:**
* **Tapping lights the way** (unlimited, free), differently per path:
* **Demolitionist throws a flare** where you tap: bright, temporary light far ahead. Flares glow, so they also pull bugs toward them: a light and a lure in one.
* **Engineer shines a torchlight** where you tap: a beam that reveals without leaving anything behind.
* **Ghost listens** in the tapped direction: reveals solid / open-space boundaries (tunnel and cavern outlines) beyond the light circle, but not materials or loot, and makes no light. Can run with a dim pack and still navigate.
* All three use the same glow rule: anything that glows lights the way and attracts bugs. No new systems.
* **Paths show here too** (all automatic, no combat input): **Ghost** cold suit dims your glow (fewer bugs, long quiet dives); **Demolitionist** explosive mining scatters swarms but the noise draws the next wave; **Engineer** drones / small turrets guard you while you dig.


* **Randomized Loot Beyond Resources**
* **Relics:** modifiers that combine into emergent, occasionally broken combos (a feature, not a bug).
* **Gadgets:** change how you dig (chain-reaction charges, ore magnets, etc.).
* **Automation modules:** change how base machines work (e.g., a drill becomes a chain drill), forcing redesign of old layouts.
* Loot rolls are seeded (world seed + position + dig state) so peers can largely verify them. Unverifiable relics show as cosmetic-only to others.
* Manual loot income is capped per the manual-income rule.


* **Trophy Wall**
* Found relics are displayed in the base. The flex moment for visitors.

---

### Paths: Specialization Triangle

* **Three Core Paths, Covering the Whole Loop**
* Each path shapes digging, raiding, *and* defending. Otherwise it's a class, not a playstyle.
* **Engineer:**
* *Dig:* drones, automated drills, reading circuits; **torchlight** on tap; crosses gaps and escapes steep climbs on **ziplines** (free, permanent). The starting path: everyone begins as an Engineer.
* *Raid:* rewire sensors, turn turrets around, open doors.
* *Defend:* sensor networks, logic-driven turrets, tripwires.
* **Demolitionist:**
* *Dig:* explosive mining; fastest digging, showers of loot; **throws flares** on tap (bright, temporary light far ahead); crosses gaps by **building bridges**, slowly; stuck on a steep climb, must teleport home.
* *Raid:* breach walls, lob grenades, set off chain reactions.
* *Defend:* mines, reinforced walls, explosive traps.
* **Ghost:** leaves no heat signature; invisible to the core detection mechanic. Reads as pale, frost-blue, no glow.
* *Dig:* **weak, slow digging**, but silent; finds hidden caches; **listens** on tap (sees tunnel / cavern outlines beyond the light circle); **climbs straight up**; free ropes to swing across gaps and rope down from steep climbs. Massive traversal boost, massive digging weakness.
* *Raid:* sneak past, cold suit to avoid detection, grapple.
* *Defend:* decoys, false vaults, cold stealth bases.


* **Hybrids (Cyberpunk-Style Branching)**
* Each pair of core paths creates a hybrid with its own abilities:
* **Engineer + Ghost = Infiltrator:** quietly rewires sensors while unseen; the base never wakes up.
* **Engineer + Demolitionist = Sapper:** remote-detonated charges, wired chains of explosives.
* **Demolitionist + Ghost = Saboteur:** plants timed charges and is gone before they go off.
* **Pure** in one path → capstone. **Two paths** → hybrid abilities. **Spread across all three** → neither. Doing everything breaks you.


* **Gear, Not a Skill Tree**
* Each relic or tool belongs to a path; path gear comes from loot.
* **Limited gear slots** (e.g., 4) define the build; in practice they support two paths at most.
* **Set bonuses:** 2 / 4 pieces of one path unlock its abilities; specific *pairs* unlock hybrids.
* **Visible:** the build *is* the silhouette; newcomers can read what a player is.
* **Loot-driven:** progression stays in the dig-and-loot loop, not in menus.
* **Built-in pivot tax:** switching paths means collecting another path's gear, never total loss.


* **Defenses Counter Each Other**
* Each path's defenses stop one attack style and are weak to another:
* Sensor networks catch Ghosts.
* Mines and reinforced walls stop Engineers, who have to get close to rewire.
* Decoys and false vaults waste Demolitionists' explosives.
* No base defense is best against everything, and the owner's path shows in their base.
* Full rules in *Vault Chamber & Defense Composition*.


* **Future Paths**
* Each new core path creates new hybrids (4 cores → 6 hybrids, 5 → 10).
* **Prospector / Geomancer:** terrain as weapon. Undermine a base, cave rock in on turrets, dig around defenses, read rock veins. The most native path to a digging game.
* **Tamer:** cave creatures as scouts, decoys, and guards.
* **Juggernaut:** armor and healing, tanking fire. The pure brute-force path.

---

### The Base: Production, Cooling, Defense

* **Carved From Rock**
* The base isn't built next to the mine; it's carved out of it. Every room is a hole you dug yourself; building is digging + placing, with the same satisfying drill feedback.
* Bases live in the **Sanctuary layer**.


* **Beacons Define the Sanctuary**
* **Planting the first underground beacon is choosing your home**, the payoff of the first milestone (see *Opening*). Its radius is Sanctuary; rock outside is Commons.
* **Growing means engineering more beacons.** Expansion beacons extend a base contiguously; each costs resources and extends the claim, so base size is visible investment.
* **Beacons generate heat themselves.** A bigger base is a more visible base: expansion vs. stealth is part of the three-way budget, with no extra rule.
* The **main beacon** houses the vault and is the raid objective.
* *Core Value:* Rust's tool-cupboard claim, in one wordless object.


* **Building Interaction: Context, Not Catalogs**
* No global build menu. Every choice is offered **at the point of action**, filtered by constraints (the Wave Function Collapse idea: each tile only offers what its surroundings allow).
* **Long-press a tile:** shows what can be built or done *there*, given the environment, neighbors, and what you own.
* **Tap a machine's input / output port:** shows what can connect there. Pick one → its ghost appears, pipes / conveyors auto-route through dug space, move or flip the ghost, tap again to place. Building grows by extending production chains; the port list doubles as the recipe book ("what consumes this?").
* **Long-press a pipe:** it becomes a ghost with **pinned ends**; drag to reroute.
* **Long-press a machine:** it becomes a ghost you can move, flip, or delete (partial refund).
* **Wordless:** choices are icons, sorted by relevance, shown around the finger. Ports are glowing nubs with generous hitboxes.
* **Earned tie-in:** options you can't afford yet show dimmed; tapping one pins it to the bucket list with its route.
* Reference for comparison (not replication): DrillDown (open-source Android factory builder): two-step ghost placement, auto-routed conveyors, auto-orientation.


* **Environment Decides Placement**
* Special spots enable unique machines: **ore deposits** (drills), **water sources** (cooling), **heat sources** such as geothermal vents (power / processing, but they add heat).
* Makes base location a strategic choice that feeds the three-way budget: plant the beacon by a vent (production, but hot) or by water (cooling, stealth)?
* The same adjacency / constraint rules can drive world generation (old-city ruins, deposits), so building and generation speak one language.


* **Multiple Bases: Outposts & Teleportation**
* A player can found **additional bases** (each with its own main beacon). The surface starter base remains as one of them.
* **Outposts fix the "walk there" tax:** recall home is always available (see *Recall Teleport*), but getting back down to depth means walking. Small outposts with a teleporter let the player jump from home straight to depth. Placing outposts deeper and deeper is a core part of progression.
* **Forgiving by design:** loot never has to be carried home, so exploration is roughly 2× more forgiving than Valheim's. The inverse of Valheim: there, people can portal but ore can't; here, loot recalls freely but reaching the frontier of your exploration costs outposts.
* **Outposts aren't free:** each has a beacon, so it produces heat, shows up as a signature, and is a raid target. More outposts = more visible. No extra rule needed.
* **Item teleportation** between own bases is **slow** (low throughput) and generates **continuous heat** at both ends for as long as the link runs.
* **Personal teleportation** (recall home, jump to an outpost) is instant and makes only a **brief heat blip**: a momentary flash in the signature, visible to anyone watching at that moment, then gone.
* **Consolidation incentive (production, not waypoints):** many production bases mean many heat signatures, many vaults to defend, and slow transfers. At some point it pays to move all production into **one larger, epic base**: the "big move" is itself a progression milestone. Outposts remain as lean travel anchors.
* **Raids per base:** each base is a separate raid target with its own vault and loss cap. A shield after a raid covers **all** of the player's bases, so owning several can't be farmed one after another.
* Teleport links are part of the setup: throughput and heat are computed, so verification still holds.
* Moving machines between bases carries a pivot tax (some cost, never a total loss).


* **Feels Awesome**
* **Visible flow:** ore streaming along conveyors, machines animating, heat glowing.
* **Instant causality:** place a drill, ore flows within a second. Fix a bottleneck, the whole line visibly smooths out.
* **Zoom-out on return:** coming back from a dive, the camera pulls back to show the whole cross-section. A "look what I have" moment every few minutes.
* **Defense payoff:** the replay of your turrets shredding a raider.


* **Feels Personal**
* **Shape is history:** per-player terrain seed plus every tunnel you dug; no two bases alike.
* **Loot shapes machines:** installed relics and modules change how machines behave *and* look.
* **Strategy is visible:** a cold stealth base looks dark, insulated, quiet; a hot fortress glows and bristles with turrets.
* **Trophy wall** of best finds.
* **No freeform drawing tools** (emblems, pixel art): they are writing by another name and would break the wordless rule. Expression comes from function, loot, and tuned visual parameters (see *View, Art & Customization*).


* **Discovered Through Natural Progression**
* Rule: every machine arrives just after the player feels the problem it solves, as **loot from digging, not from a shop**.
* 0. My surface base is tiny and that underground base is amazing → **Underground beacon** (first milestone, see *Opening*).
* 1. Bugs swarm my glowing pack → **Pack upgrades** (glow shielding, more capacity: longer dives before recalling; shielding also dims your light).
* 2. Nothing happens while I'm away → **Drill** (first "it mined while I was gone" moment, ~5 min).
* 3. Drill output piles up next to the drill → **Conveyor** to the vault / processors (first real chain).
* 4. Drills shimmer and slow down → **Heat** appears, cooling found soon after.
* 5. Something is sniffing at my base → **First raid**: a deliberately weak bot that fails and drops loot. Teaches "defense pays."
* 6. My setup could be better → **Modules**: rebuild the old layout.
* 7. Walking back down to depth every dive takes too long → **Outpost with teleporter**; repeated deeper and deeper.
* 8. My production is scattered, hot, and slow to move → the pull to **consolidate into one epic base**.
* Each machine is one visceral primitive; combining them is the progression (stacking-primitives pillar).
* **Learning from others:** the first discovered base and the skyline show what's possible; raiding bot bases means digging through other designs. Layouts can be learned via Blueprints (knowledge only; machines and materials must still be earned); anything visual you love goes on your bucket list.


* **Automated Underground Base**
* Drills, conveyors, processors, and installed modules.
* Output is a pure function of **setup + elapsed time**, so it's recomputable and verifiable by peers.
* Keeps producing while the owner is offline.


* **Heat**
* Production generates heat, shown in the world, never in UI: glowing rock, shimmer over hot machines, dust falling from the ceiling.
* Heat makes the base **visible**: higher heat means it appears in more raid-target lists.
* Running cold is stealthier but yields less.


* **Seeing at Scale: Heat, Not Bases**
* A side view can't show many bases, so distant bases are shown only by their heat.
* **Up close:** immediate neighbors' bases are visible at the edges of your Sanctuary, one or two per side.
* **Further out:** heat reads as **direction and intensity only**: glow through rock, rumble, shimmer on the left or right. You know *something hot is east*, not what. Fog of war for free.
* **From the surface:** heat plumes and beacon beams form the skyline (see *Opening*).
* **Cold bases stay dark** beyond close range. Stealth is visible.


* **Scouting**
* Notice a strong plume or directional glow.
* Optionally build a **geophone** (listening machine) that sharpens signatures: stronger or weaker, how many beacons.
* Dig toward it through Commons rock. The tunnel *is* the approach; arriving loads the target's snapshot for the raid. Distance is compressed; the feeling that matters is *following the signal*.


* **Per-Player Neighborhood (Serverless Layout)**
* World layout does not need to agree between players. Each client assembles its own neighborhood from the snapshots it has: nearby rating, weighted by heat, plus revenge targets.
* Only base *contents* are shared and verified, never world positions. Beacon claims can't overlap; nothing needs resolving.
* Cost: "my neighbor" may not see me as *theirs*. Harmless, since revenge travels with the raid replay.


* **The Three-Way Budget**
* Every base splits investment between:
* **Production:** how much you earn.
* **Cooling / heat shields:** how often you're found.
* **Defense:** how much you lose when found.
* Viable archetypes:
* **Cold stealth:** modest production, heavy cooling, thin defense. Rarely found, fragile when found.
* **Hot fortress / bait base:** max production and defense, highly visible. Raided often, wins often, profits from failed raids.
* **Balanced:** middle path, weaker at the extremes.
* *Core Value:* Parallel specialization paths with no single meta, built into the base itself.


* **Cooling Is a Routing Puzzle**
* Coolant loops, heat sinks, adjacency between hot machines. Not a flat stat.
* Heat pressure forces returning to old layouts: the iterative-refactoring pillar.


* **Balancing Guards**
* **Defense must pay:** failed raids drop the attacker's gear or a bounty into the defender's base. Otherwise cooling strictly dominates defense.
* **No free glass cannon:** loss cap and shield duration scale with heat. A hot, undefended base loses more and is shielded for less. Otherwise ignoring defense and absorbing capped losses dominates.

---

### Vault Chamber & Defense Composition

Design rule: every individual mechanic stays simple; complexity comes from simple systems interacting. Difficulty comes from composition and matchups, not pixel-perfect execution (unlike King of Thieves). Reference: No Man's Sky's Holo-Arena (teams of three, counter cycles, a few stats; hard to build the perfect team).


* **One-Screen Vault Chamber**
* Raids happen in the **vault chamber** around the main beacon: about one screen, fully readable, every defense visible once inside (King of Thieves cut levels by 40% to remove scrolling for exactly this reason).
* The rest of the base is production and scenery. Automation building stays deep; the vault chamber is a contained puzzle.
* **Owner must beat it to arm it:** after any change to the vault chamber, the owner has to raid it themselves, with their own current loadout, before it goes live (as in King of Thieves). No sealed vaults, no automatic checks.
* **Coherence for free:** defense strength is capped by the owner's own attack ability, so the owner's attack path implicitly shapes their defense style. A Ghost struggles to arm sensor-heavy defenses (sensors catch Ghosts), so a Ghost's vault leans on decoys and is naturally weaker to other Ghosts. Specializing has a mirror-image cost, the same "try to be everything and you become weak" rule as the path triangle, with no extra rules.
* **Clans break the mirror:** a vault is also armed if a **clanmate** beats it. Clanmates with other paths and gear can arm defenses the owner couldn't beat alone (see *Clans*).
* **Serverless proof:** the clearing run (owner's or clanmate's) is a deterministic replay attached to the snapshot; any peer can verify the vault is beatable. Trade-off: a cheater digging into the data could watch the solution. Acceptable under the threat model, and the owner's loadout differs from the attacker's anyway.


* **Simple Components**
* Each defense piece has an **affinity** (Engineer / Demolitionist / Ghost, or two for hybrid pieces) and at most a couple of simple properties (e.g., point vs. area, detect vs. contact).
* Small, practical palette. No freeform editors: King of Thieves found players didn't use them ("the game's not about being creative, it's very practical").


* **Limited Slots**
* The vault chamber holds only a few defense pieces (e.g., 3–5, growing with beacon tier). You can't cover everything; every choice leaves a gap.


* **Placement Is Order**
* Pieces sit in layers along the approach to the vault. What the attacker meets first matters, the way turn order and swapping matter in Holo-Arena.


* **Matchup Beats Rarity**
* An affinity advantage outweighs a tier advantage: a low-tier piece with the right counter beats a high-tier piece on the wrong one.
* **Hybrid pieces** cover two affinities at lower peak strength: breadth vs. peak.


* **Attacker Commits Before Entering**
* The attacker's gear loadout is locked when entering the vault chamber. Otherwise the attacker always picks the counter and rock-paper-scissors collapses.
* Scouting gives partial information: **heat color hints at the dominant defense affinity**. Ghost-heavy bases run cold, so they reveal less.

* **Knowledge and Gear Can Carry Skill**
* Raid success = matchup + gear + execution. Reading a vault and bringing the right loadout can substitute for dexterity, avoiding King of Thieves' ever-rising skill wall that shut out casual players.

---

### Clans

* **Clans Test Each Other's Defenses**
* Clanmates raid each other's vault chambers as free practice: no loot, no loss.
* A clanmate's successful run **arms** your vault, so a clan with mixed paths can field defenses no single member could arm alone. This is the main reward for joining a clan.
* *Core Value:* Specialization stays a strength inside a clan and a weakness alone; the "try to be everything" rule pushes players toward each other instead of toward generalist builds.


* **Arming Earns Clan Reputation**
* Every vault you arm for a clanmate earns reputation within the clan.
* Counts once per vault version; arming a vault the owner couldn't arm themselves counts more. Prevents farming by re-arming trivial changes.
* **Wordless display:** each player has a system-generated sigil (never player-drawn). Armed vaults carry the sigils of whoever armed them, so you see whose skill protects you and whose skill protects everyone.
* **Serverless:** reputation is computed locally by each member from the signed arming replays they've seen. No shared ledger; the replays are the proof.
* The one persistent reputation in the game (Commons reputation stays session-local), because clans are the one stable identity group.
* Status only for now; no mechanical bonuses (simple-systems rule).


* **Clan Blueprint Library**
* Clanmates share Blueprints for **production lines** and **vault defenses**, full or partial (a single cooling loop, one defense layer).
* A Blueprint is layout only: you still need the machines and defense pieces, and a pasted vault must still be **armed** (by you or a clanmate) before it goes live.
* Vault Blueprints are sensitive: posting one publicly shows raiders your defense. Sharing inside the clan's group chat keeps it among allies.
* Each Blueprint carries its creator's sigil; clanmates using it adds to the creator's clan reputation.


* **Clans Are Where You Learn**
* Watching clanmates' test replays against your vault shows where it breaks from angles you can't play yourself.
* Clanmates' vaults and bases are fully visible to each other: the closest, most detailed "I want a base like that" source in the game.


* **Serverless, Wordless, Messaging-App Native**
* Clans form outside the game, in the players' own messaging groups (Telegram, Discord, WhatsApp). The game adds no language; players bring their own.
* A clan is a set of mutually exchanged player keys, stored locally. Joining happens via an invite link.
* **Test loop via links:** "beat my vault" is a share link with the vault snapshot; the clanmate raids it locally and returns the clearing replay as a link; the owner attaches it as proof. Fully async, no server, and every test request is a viral post in a group chat.
* Small clans (e.g., 5–10) keep it personal.


* **Solo Fallback**
* Players without a clan can arm only what they beat themselves; bot "testers" may arm vaults at a capped strength so solo play stays viable.

---

### Async PvP Raids

* **Raids Are Asynchronous**
* The attacker spelunks into a **snapshot** of the defender's base; the defender's automated defenses fight back. The defender is not online.
* Raid targets come from the per-player neighborhood (matching rating, weighted by heat), found by following heat signatures.
* **Objective:** get through the vault chamber and reach the main beacon's vault.
* **No luck gates play:** no lottery-style energy (King of Thieves' random lockpick costs were its most criticized mechanic). Randomness lives in loot content, never in whether you're allowed to attempt.


* **Bounded Losses**
* A raid steals at most a capped percentage of **stored surplus** (cap scales with heat).
* Setup, machines, modules, relics, and progression are never touched.
* After a raid, the defender gets a shield (duration scales inversely with heat).


* **Steep Economic Dropoff**
* Loot multiplier = `0.5^(attacker_rating − defender_rating)`, clamped to at most 1 for targets above you.
* Punching down yields almost nothing; punching up yields full value.
* Rating is **recomputed from the base's setup**, never self-reported, so it cannot be faked low to farm newcomers.


* **Revenge**
* The defender receives a **replay** of the raid, bundled with the attacker's base snapshot, so revenge needs no searching.
* A revenge raid gets bonus loot, ignores the dropoff, and **ignores shields** (King of Thieves let players shield forever, blocking retaliation). One revenge per raid.
* **Replays teach defense:** the replay overlays the attacker's path through your vault chamber, showing exactly where the gap was. Every loss is a lesson.
* Replays are shareable content (the "Replay Snippets" sharing pillar).


* **Serverless Raid Integrity**
* A raid is a short deterministic replay: defender snapshot + seed + attacker inputs.
* The defender's client replays it before accepting any loss; forged raid results are rejected.
* **Loss delivery:** raid results reach the defender through peer gossip. The loss applies when the replay arrives; if it never arrives, the defender loses nothing. The attacker's loot is created either way (slight inflation, bounded by heat and dropoff).


* **Bots From Day One**
* Seed-generated bot bases are raid targets; bots raid players under the same rules.
* Works with zero real players; real snapshots mix in as they appear.

---

### Visiting

* **Read-Only Visits via Share Link**
* A base is a config: encoded with the platform string codec, shared as a link through messaging apps.
* The visitor flies through the base read-only: layout, running automation, heat, trophy wall.
* No P2P needed. Live visits come later with the P2P layer.

---

### Market Positioning

* **Genre Fit**
* Squarely in the "crafty-buildy / infinite unique situation generator" meta-genre (survival-craft, builders, automation, roguelites): the category where indies succeed most on Steam, because procedural generation and deep systems produce content without authored-content scope.
* Long-term progression (Sanctuary growth, base, path gear) and idle payoff (offline production) are what this market rewards.
* Live-service multiplayer is dead on arrival without players: solo-first, bot backfill, and async raids are non-negotiable.


* **Base Generator, Not Hand-Authored Bases**
* Bot bases (including the first discovered base and derelict fragments) come from a generator: archetype (cold stealth / hot fortress / balanced), difficulty, a deliberately **flawed** variant (one findable weakness per path), and a **decay** parameter for derelict fragments.
* Every seed gets fresh content; the "find the flaw" milestone never becomes a walkthrough someone posts online.
* The same generator feeds the bot neighborhood, raid targets, and the skyline.


* **Don't Look Like a Platformer**
* Platformers are the most oversaturated genre in Steam data, and a side view invites that label.
* Thumbnails, store tags, and the first screenshot lead with **mining, base-building, automation, raiding**: the glowing base cross-section, not a character jumping.
* If a traversal label is needed, lean Metroidvania (dig → upgrade → reach deeper), which performs far better than plain platformers.


* **Precedent: Manyland (2013–2024)**
* Browser-based, 2D side-scrolling, persistent multiplayer universe where players drew everything (19×19 pixel editor); 8M placed blocks and 100k+ creations within its first year.
* Engaging through exploring others' huge builds, collecting copies of what you saw, and emergent contraptions from simple blocks.
* **Warnings:** it shut down in 2024 when server costs rose and revenue fell (validates serverless); no goals kept it niche (we keep goals); a free pixel editor conflicts with the wordless rule (we use parameters instead).


* **Distribution & Launch Path**
* One build via a cross-platform distribution SDK to 25+ platforms (strategy: *Distribution* in [opinionated_games.md](opinionated_games.md); SDK: [toolbox.md](toolbox.md)).
* **First targets:** **YouTube Playables** (tier-1 reach, high CPM, mobile-portrait audience) running the **fully offline bot version**, plus **CrazyGames / Poki** for desktop depth.
* **Networked layer later**, once the solo game retains: raids against real players, clans, links. First on platforms that allow networking: **Discord** (natural fit for clans), **Telegram**, standalone.
* Each platform's analytics (YouTube now reports age and country) decides where to invest next.
* Data from earlier portal-only research (Poki roughly 50/50 desktop / mobile in the US, CrazyGames desktop-heavy, rewarded eCPM highest in US / EU desktop) is superseded by the aggregator landscape; kept only as background.


* **Technical Fit**
* Stack, rendering techniques, and art tooling for this game: see *Game-Specific: Spelunking Base* in [toolbox.md](toolbox.md).


* **HTML5 First, Steam Next**
* Web platforms are the cheap test bed. If retention is strong there, a paid Steam version (more content, flagship-tier features: live P2P, shared deep layers, gossip ghosts) is the natural next step.
* Precedent: Vampire Survivors started as a browser game on a JS engine before becoming a Steam hit.

---

### Playtest Bundles

Test only the riskiest bets, one playable bundle at a time, before building month-one content. Built on the real stack (plain JS + JSDoc, Canvas2D, no build step; see [toolbox.md](toolbox.md)), so the simulation code carries over into the game. ~2 weeks total.


* **Rules for Every Bundle**
* **Delivered as a link:** a static build on a restricted itch.io page (HTML5 zip, no server). Playable on desktop and phone.
* **Playtesters:** you first, then 2–3 others per bundle, at least one on a cheap Android phone. Watch silently; don't explain.
* **Self-imposed limits (replacing PICO-8's):** coloured squares only; the light circle is the only visual effect. If it's fun as squares, the art can only lift it.
* **Sim / render split from day one:** `sim` is a deterministic integer-grid, fixed-tick simulation with no rendering imports; `render` only draws its state. Both inputs (keys, swipes, taps) map to the same simulation commands.
* **Dev panel:** our own sliders for every tunable (stop rules, walk / dig / build speeds, bug and glow numbers), hidden behind a key / corner tap. Presets saved as JSON; testers play the current preset.
* **Dive log:** each dive's end reason and duration, shown at home and copyable as a string, so testers paste it back.
* **Time box:** over time means cutting features, not extending the deadline.


* **Bundle 1: Dig Feel (Days 1–3)**
* *Question:* does "move until something changes" feel good, with keys and with swipes, and do I want another dive?
* **World:** the v3 terrain (archived CA recipe: caves, soft / hard rock, ore, loot), wrapping horizontally, with a surface strip on top for home. Homogeneous for now; depth tiers later.
* **Movement:** swipe-until-stop with tap-to-stop; keyboard hold-to-move with soft stops (see *PC: WASD + Mouse*). 1-tile character: walker follows the floor over 1-tile steps, stops at walls and 2+ drops; swipe again to dig. **Stop rules as a tunable table**, plus walk and dig speeds (dig starts 3× slower): they are the experiment.
* **Swipes by context:** walk, mine / build diagonally (ore cost), dig down; ledge stops with climbing down and Engineer ziplines (everyone starts as an Engineer). Tap the character to stop, tap elsewhere for torchlight. Swipe angle zones tunable.
* **Loop:** pack (3–5 slots), long-tap teleport home, loot counted at home.
* **Juice:** screen shake, square chunks flying, per-material dig resistance.
* **Any aspect ratio:** portrait shows deeper, landscape wider.
* *Pass:* you instinctively start another dive; "push through the hard rock, or recall?" feels like a choice; swipes on the phone neither overshoot nor feel twitchy.


* **Bundle 2: Greed & Darkness (Days 4–6)**
* *Question:* does "loot lights the way, and draws the bugs" create greed, and do the three paths feel different?
* **Darkness:** light radius = pack glow.
* **Noise:** from digging and blasting.
* **Moon bugs:** auto-defeated, drop small loot; drawn by glow and noise; overwhelm → steal bulk items.
* **Three loadouts, picked at dive start:**
* Engineer: torchlight, ziplines.
* Demolitionist: flares, explosive digging, slow bridges, teleport out when stuck.
* Ghost: listening, climbing, ropes and rope-swings, cold suit, slow digging.
* **Why go home:** a visible vein behind rock the drill can't break, plus one drill upgrade bought at home with ore.
* **Dive log reasons:** found home-only loot / blocked by rock / swarmed / pack full / stuck (no way on). Mostly "swarmed" or "full" = chore; mostly "found something" = working.
* *Pass:* dives end because you want something; bug pressure feels like greed, not punishment; testers name different favourite loadouts.


* **Bundle 3: Tiny Base (Days 7–9)**
* **Pivot (2026-09-25, D054):** the idle production moved into Bundle 2 as tamed bugs mining what you revealed (p6 · b3); the drill, conveyor and heat below are the earlier plan.
* *Question:* does digging pull you into building, and building back into digging?
* Drill placed on an ore vein near home, hand-placed conveyor to the vault.
* Production ticks while diving; on recall the camera pulls back and shows the gain ("it mined while I was gone").
* Loot unlocks upgrades (pack, drill speed, second drill).
* One heat number: production → heat → above a threshold, a simple bot raid takes a share of the vault.
* *Pass:* you dive *because* you want the next machine, and build *because* you want longer dives.


* **Bundle 4: Vault (Days 10–14): The One That Matters Most**
* *Question:* is the one-screen, three-path raid puzzle interesting, attacking and defending?
* **Attack:** pick 1 of 3 loadouts before entering (Engineer rewires, Demolitionist breaches, Ghost unseen by sensors); same movement, stopping at detection-zone edges. Defenses: sensor sweeps, mines, turrets, reinforced walls.
* **First-vault lesson:** a hand-made flawed starter vault with one weakness per path. Does getting shot make you think "I'll try it the other way"?
* **Defend:** place 3–5 defenses, **beat it yourself to arm it**, then a few bot raiders with different loadouts try it.
* **Square chamber:** fits portrait, landscape, and square without scrolling.
* *Pass:* loadout choice matters; failing teaches something; designing a vault you can *just barely* beat is fun; you notice your vault is weak to your own path.


* **Order**
* Bundle 4 needs Bundle 1's movement and Bundle 2's loadouts. If Bundle 1 passes and time runs short, **Bundle 4 goes before Bundle 3**: the vault is the riskier bet.


* **Deliberately Left Out**
* Lighting and art beyond the light circle, multiplayer, clans, links, verification, settlement, surface sky, pet, derelict fragments, base generator, customization, bucket list, hybrids, outposts, designate-to-carve, cooling.


* **What the Bundles Can't Tell Us**
* How much light / particles / heat shimmer add (excluded on purpose); social pull (real rivals, clans). These wait until the bundles prove the loop.


* **Kill Criteria**
* **Bundle 1 boring even after tuning stop rules:** rethink movement before anything else.
* **Bundle 4 feels solved after 3 vaults:** the triangle needs more interacting pieces before building on it.

---

### Scope

* **Month One**
* Surface starter base (landed pod) with starter-tier beacon, starter pet, and floor hatch into the Commons.
* Circular surface settlement (visual only): wrapping ring, colonists, pets, other players' / bots' pods visible but inaccessible.
* Moon setting: surface sky showpiece (gas giant, rings, nebula, auroras) in parallax.
* Base generator (archetypes, difficulty, flawed variants) feeding the first discovered base, bot neighborhood, and raid targets.
* Derelict fragments (one broken defense, one lesson, one starter gear piece each) before the first real base.
* First milestone: guaranteed discoverable generated bot base with one flaw per path, legible failure, wanderer poking, trespasser's prize (underground beacon).
* Digging loop with depth-scaled risk; buried old-city ruin layer (procedural rooms, pipes, machinery) above real geology.
* ~20 relics / gadgets with combining modifiers, ~5 of them automation modules.
* Three core paths (Engineer, Demolitionist, Ghost) with three hybrids, as path gear + set bonuses.
* Small base carved from rock: drills, conveyor, a few modules, cooling, defenses, trophy wall.
* Context building: long-press tile options, port-driven connections with auto-routed pipes, ghost move / flip / delete, pinned-end rerouting; environment-gated machines (ore, water, heat source).
* Recall teleport; why-go-home triggers (home-only loot, unbreakable rock, craftable bucket-list items); moon bugs with glow-driven swarms and common-item theft; depletion near home.
* Beacons (first beacon + expansion), with beacon heat.
* Heat, the three-way budget, balancing guards.
* Directional heat signatures, surface skyline, per-player neighborhood of bot bases.
* One-screen vault chamber with limited slots, affinity-tagged defense pieces, owner-must-beat-it arming, locked attacker loadout.
* Async raids against bot bases; bots raiding the player; replays with attacker-path overlay; revenge.
* Read-only visit via share link.
* Clans via invite links; "beat my vault" test links and returned clearing replays; clanmate arming; capped bot testers for solo players; clan Blueprint sharing (production lines, full / partial vault defenses).
* Art pipeline: dynamic lighting, particles, procedural animation, procedural rock shaders, parallax layers.
* Parametric visual customization from earned materials; pin & bucket list.
* Swipe-until-something-changes controls with bump-to-interact; designate-to-carve for base rooms; any aspect ratio (portrait / landscape / square) with a square vault chamber.
* Fully offline solo-with-bots build, shippable to YouTube Playables; networked features behind a per-platform switch.
* Platform modules extracted: save core, string codec, deterministic core, publisher adapter, visual kit with dev tweak panel (tools per module: [toolbox.md](toolbox.md)).


* **Later**
* Outposts with teleporters (first thing after month one: the walk-there tax grows with depth) and item teleportation. Month one: single underground base plus the surface starter base, shallow enough that walking down is still fun.
* Geophone and richer scouting.
* Settlement districts: move to a different district with different visuals and perks.
* Life inside: tenants and more pets (beyond the starter pet). Procedurally animated cave critters and drones move into warm, lit rooms; pets follow the player. Critters love warmth, but heat reveals you: a cozy, populated base is a visible base.
* Additional core paths (Prospector, Tamer, Juggernaut).
* Abandoned player bases become derelicts: outposts left behind after the "big move" (or bases of players who stopped playing) decay into derelict fragments in newcomers' worlds, via gossiped snapshots run through the decay parameter. The world fills with ruins built by real players.
* Real-player raids via P2P gossip delivery.
* Live base visits.
* Shared mid-depth caverns (Commons) and the abyss (Frontier) as shared layers.
* Clan extras beyond vault testing: seasons, clan leagues, shared goals (guilds were a major long-term retention driver in King of Thieves).
