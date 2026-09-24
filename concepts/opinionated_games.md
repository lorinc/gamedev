### PvP & Multi-Player Dynamics

* **Wordless Interaction: No Verbal or Written Communication**
* Players cannot communicate through language in any form: no text chat, no voice, no player-written signs, names, or labels.
* All player-to-player expression goes through emotes, actions, gifts, and things left in the world.
* *Core Value:* Every interaction is read through behavior, not words. Kindness and rudeness have to be *done*, not said. No language barrier, and almost nothing to moderate.


* **Three-Tier World: Sanctuary, Commons, Frontier**
* A sterile world where nobody *can* be rude is also a world where nobody's kindness *means* anything. Moral choice needs room to exist.
* **Sanctuary (small, personal):** The player's home ground for permanent growth. Nobody else can break, dismantle, or brick your setup or progression here; at most a capped share of stored surplus can be raided (game-specific). Core progression lives here and only here.
* **Commons (the majority of the world):** Natural ground, populated by real players and AI players (see *AI Players*). Players can help, gift, share, compete, prank, contest resources, and be rude to each other. Losses here are real but bounded and recoverable.
* **Frontier (opt-in, high-risk):** Full PvP with real stakes: loot drops, destructible outposts, contested territory. Richest yields in the game, but only for those who choose to enter.
* *Core Value:* Every player always has a safe floor to retreat to, the shared world has real social texture, and risk-seekers get a place built for them.


* **Sanctuary: Guaranteed Permanent Growth**
* Other players **cannot** break, dismantle, steal, or permanently brick your Sanctuary infrastructure, builds, or core progression.
* A game may allow async raids on a **capped share of stored surplus** only (e.g., [spelunking_base.md](spelunking_base.md)). Setup and progression stay untouchable.
* Sanctuary is where compounding growth (automation, blueprints, mastery) accumulates; nothing that happens in Commons or Frontier can roll it back.
* Visitors can be invited in (co-building, trading, showing off), but only with permission.
* *Core Value:* Removes paranoid defense anxiety; the player can always take bold social risks elsewhere knowing their foundation is untouchable.


* **Commons: Natural Ground for Kindness and Rudeness**
* **Kindness is mechanically meaningful:** Gifting, leaving supplies or wordless wayfinding markers for strangers, repairing someone else's outpost, rescuing a stranded player, building shared bridges and roads. Anonymous kindness should be discoverable ("someone left this for me") and feel great to receive.
* **Rudeness is allowed but has texture:** Sniping a resource node, blocking a route, a harmless prank, a mocking emote, beating someone to a contested objective. These are social frictions, not bannable offenses.
* **Bounded exposure:** Things built or carried in Commons can be contested, damaged, or lost, but losses are capped and recover within minutes, never touching Sanctuary progress.
* **Reputation memory:** The room remembers how you behave (visible cues on the character, how NPCs and settlements respond, what other players see). Kind players become known and welcomed; rude players become known and wary-of. Session-local by necessity (see *Technical Architecture & Trust*).
* *Core Value:* Social choices carry weight because both directions are possible, and consequences come from the community, not from a rules wall.


* **Rudeness vs. Griefing: Humbling Mechanics**
* Rudeness is part of the Commons. **Griefing** (repeated, asymmetric targeting of weaker or newer players, camping, deliberately ruining others' sessions) is not.
* The system detects griefing patterns and converts them into a public gameplay event: bounties or target markers on the offender, incentivizing nearby and newer players to gang up and deliver a humbling defeat.
* Punishment escalates with the pattern, not a single act: one prank goes unnoticed, a sustained campaign against newcomers becomes a room-wide hunt.
* *Core Value:* Neutralizes toxicity through emergent community justice without heavy-handed moderation, while leaving room for ordinary friction.


* **Systemic Incentives: High-Yield Collaboration vs. Costly Aggression**
* **Cooperation is hyper-efficient:** Synergistic builds, resource sharing, and joint infrastructure offer the fastest yield and highest progression returns in Sanctuary and Commons.
* **Unprovoked aggression in Commons is possible but expensive:** It costs resources and reputation for low economic return. It is a viable choice, just a poor growth strategy.
* **Aggression pays in the Frontier:** There, conflict is the economy; rewards scale with risk taken.
* *Core Value:* The player base leans toward constructive play by default, without making conflict impossible or pointless.


* **Frontier: Opt-In High-Risk PvP**
* Entering the Frontier is an explicit, visible choice; nobody is dragged into it.
* Real stakes: gear and outposts earned in the session can be lost or taken. Sanctuary progress is never at risk, and imported Sanctuary power is capped on entry.
* Unique resources, cosmetics, and prestige available only here, so it has a reason to exist beyond pure combat.
* Complemented by consensual duels anywhere ("Let's see who built a better setup").
* *Core Value:* High-skill, high-stakes rivalry for those who want it, without imposing it on those who don't.



---

### Virality & Social Dynamics (Messaging App & HTML5 Context)

* **Game-Breaking Emergent Combos Are Features, Not Bugs**
* Massive systemic interactivity combined with slight randomization will naturally produce overpowered, "broken," or wild chain-reaction combos.
* Do not aggressively patch out every ridiculous synergy; embrace them as high-dopamine, clip-worthy, social-media-ready moments.
* *Core Value:* Gives players the feeling of "I broke the game with my brain," driving organic word-of-mouth chatter.


* **Frictionless Social Sharing (Native to Web/Chat Context)**
* HTML5 games thrive inside fast-paced messaging platforms (Telegram, Discord, WhatsApp, Web viewports).
* Enable instant, 1-click sharing of string-based **Blueprints** (base designs, automation layouts), **Build Configurations**, **Replay Snippets**, or rare **Seed Discoveries**.
* *Core Value:* Transforms single-player mastery into social currency and effortless network-driven acquisition.



---

### Emotional & Experiential Core (Player Perspective)

* **Experience Over Mechanics**
* Players do not process systems as abstract code; they care about visceral feelings and memorable moments.
* *Target Emotional States:*
* "I outsmarted that situation/opponent!" (Clutch cleverness)
* "Look at this insane setup I just created!" (Creative flex / Shareability)
* "I am completely dominant in this zone, time to step into the unknown." (Earned mastery and self-paced progression)




* **Parallel Specialization Paths (No Single 'Meta')**
* Avoid a single optimal solution or mandatory "best way" to solve problems.
* Every available path requires dedicated player skill and build specialization tuned for that specific strategy.
* *Core Value:* High replayability through meaningful, distinct playstyles with low-risk upfront commitments.



---

### Core Gameplay Mechanics & World Rules

* **Simple Systems, Emergent Complexity**
* Every individual mechanic stays simple: few rules, few properties per component. Depth comes from simple systems interacting (counters, limited slots, ordering), never from making one system intricate.
* When a new idea would add a rule to an existing system, prefer a new interaction between existing systems instead.
* *Core Value:* Easy to learn in seconds, hard to master; keeps scope and balance manageable for a solo dev.


* **Player-Driven Dynamic Difficulty & Complexity**
* Both difficulty and complexity scale directly through in-game actions and progression choices, never menu sliders or arbitrary thresholds.
* *Examples:* Wealth-based raid triggers, zone-bound difficulty progression, unlocking higher-tier supply chains only when expanding, choosing to step from Commons into the Frontier.
* *Core Value:* Full agency over when to introduce risk, and when to opt into deeper systemic complexity.


* **Frictioned Class/Build Switching ("Pivot Tax")**
* Respecs or build changes carry a fair cost—never free on-the-fly toggles, but never total progress resets.
* Reborn / rebirth mechanisms allow carrying over core effort while requiring localized reinvestment in role-specific tools, infrastructure, and mastery.
* *Core Value:* Gives decisions weight while creating a fresh, novel progression loop out of old investment.


* **Automation & Investment Returns**
* Front-loaded effort converts manual tasks into passive yield.
* Unlocks "free resources" through strategic building and infrastructure.
* *Core Value:* Strong sense of tangible, compounding growth.


* **Iterative Refactoring: Scale, Logic & Function**
* Progression forces returning to older infrastructure—not just to output *more*, but to introduce new operational logic (e.g., conditional routing, priority balancers, split supply lines).
* *Core Value:* Evolving static builds into dynamic, responsive systems.


* **Low-Friction & Low-Penalty Failure Recovery**
* Failure consequences must be symbolic and brief—never creating compounding death spirals or permanent loss.
* Max recovery window: 2–3 minutes without extra compounding risk.
* *Scope:* Applies to Sanctuary and Commons. The Frontier deliberately breaks this rule (real loss is the point), but even there, losses never reach Sanctuary progress.
* *Core Value:* Encourages bold experimentation without frustrating setback traps.


* **Frictionless Inventory & Micro-Management Quality of Life (QoL)**
* Bulk automation for repetitive tasks (e.g., single-button sorting into nearby containers).
* Complex sorting systems that reward investment by eliminating manual overhead.
* *Core Value:* Translating intent into immediate action without manual busywork.



---

### HTML5 Game Design Goals & Intuitive Mechanics

* **Stacking Visceral Primitives (Replaces Formal Tutorials)**
* Place players in scenarios where the initial required action is primitive, visceral, and immediately obvious.
* Gradually combine two or more of these basic behaviors into single scenarios.
* *Core Value:* Building systemic understanding effortlessly through compounded gut reactions.


* **Visual & Environmental Systemic Feedback**
* System state, bottlenecks, and low supplies are communicated purely through readable visual cues within the world—never pop-ups or text alerts.
* *Core Value:* Zero UI clutter; status is immediately clear at a glance.


* **Zero-Friction Onboarding**
* Immediate entry into the core gameplay loop within 3 seconds of loading.
* Zero mandatory text walls; mechanic introduction integrated into immediate interaction.


* **No Menus: Everything Is Tap, Hold, Drag, or Pinch on the World**
* Every feature must work with **one pointer** (finger or mouse) acting on something in the world. If it can't, redesign or cut it.
* **No navigation menus or screens.** Short, contextual icon lists are allowed only **at the point of action** (e.g., long-press a tile → what can be built there), never as global catalogs.
* **Location is the mode:** where the player is decides what they are doing; no mode switches.
* **Zoom is the only "interface":** pinch in to act, pinch out to plan.
* **The object is the menu:** tapping does the one sensible thing; long-press offers at most a few icon choices around the finger.
* **Things live in the world:** storage on shelves, gear on a rack, lists on a pinboard, replays as holograms. The only persistent on-screen element is a tiny pack strip (3–5 slots) and a recall button.
* **Forgiving precision:** grid snapping, object-level targeting, generous hitboxes.
* **Complexity arrives over time, not on screen:** the screen shows one problem at a time.
* *Core Value:* Works identically on phone, tablet, and desktop; nothing to reflow across aspect ratios; nothing to read.


* **Any Screen, Any Aspect Ratio**
* Every game must run in **portrait, landscape, and square** (9:16, 16:9, 1:1), with **touch and mouse / keyboard** (a YouTube Playables requirement, and the norm across aggregators).
* Critical one-screen play areas are designed **roughly square** so they fit every ratio; elsewhere the camera adapts (e.g., portrait shows deeper, landscape shows wider).
* Touch and keyboard / mouse may use different input schemes (e.g., swipes vs. WASD + click), but both must map to **the same simulation commands**, with no precision or speed advantage for either in competitive play.



---

### Technical Architecture & Trust (Browser-Only P2P)

* **No Servers: Browser-Only, Peer-to-Peer**
* All game state lives in the player's browser. All shared play runs peer-to-peer. No server stores state or computes game logic.
* Unavoidable third-party infrastructure is stateless only: public signaling and STUN. Players behind strict NATs (~10–20%) may fail to connect without TURN; accept this or budget a relay. Libraries: see [toolbox.md](toolbox.md).
* Shared rooms stay small (~2–8 peers, full mesh).
* **Networking is a per-platform layer.** Some platforms forbid all external network calls (YouTube Playables: no multiplayer servers, analytics, or payment gateways). The core game must run fully offline and solo (bots included); P2P, links, and clans switch on only where the platform allows.
* *Core Value:* Zero ops, zero hosting cost; publishers receive a static bundle.


* **Simulation / Renderer Split**
* Game logic is a **deterministic integer-grid simulation**, independent of any engine and fully testable. Required for replays, proofs, verification, and async raids.
* No engine physics (float-based, not deterministic across browsers).
* The renderer is only a view of simulation state, so the engine question reduces to "which renderer."
* Low-end devices set the performance budget from week one.
* Stack, renderer choice, and performance techniques: see [toolbox.md](toolbox.md).


* **Threat Model: Protect Others' Experience, Not Items**
* Super-casual games. Cheating that breaks **other players'** experience must be prevented.
* Kids forging fancy items **for themselves** is acceptable.
* Design goal: make forgery irrelevant to others rather than impossible.


* **Local Save Hygiene**
* A local "blockchain" of hashes does **not** stop forgery: the hashing code ships in the bundle, so a cheater can recompute a valid chain for any forged state. Hashing is only as strong as the party holding the key, and locally, that party is the cheater.
* Checksum + light obfuscation is enough to stop casual devtools editing.
* Saves are exportable as strings (same format as Blueprints) as a backup against cleared browser storage.


* **Verification by Recomputation (Sanctuary Output)**
* Automation output is a pure function of **configuration + elapsed time**. Peers don't need to replay inputs; they recompute expected output from reported core metrics ("automation Y running for X time, upgraded Z") and compare.
* Self-reported metrics are constrained so they must be mutually consistent:
* **Closed ledger:** every upgrade has a cost that must be covered by computed production *before* it. History is a chain: config → production → spend → new config → …
* **Peer-anchored time:** claimed elapsed time cannot exceed real time since the first peer-witnessed checkpoint. Other players' clocks bound it, not the cheater's.
* **Capped manual income:** clicking, loot, and anything not derivable from automation has a hard max rate.
* **Result:** a forger must fabricate a complete, consistent history within real elapsed time. **The best a cheater can claim is what a perfect player could have achieved.** Acceptable ceiling.
* *Requirements:* deterministic integer / fixed-point production math (no floats, no engine-dependent `Math.*`), a compact timestamped log of config changes (not inputs), production that is closed-form from config + time (not physics- or skill-driven).


* **Subjective Truth: Each Client Decides for Itself**
* No consensus protocol. Every client independently recomputes every Sanctuary it sees.
* The cheater sees their forged base. Everyone else sees the recomputed legitimate version (or a flagged one).
* Trades and gifts from a player are valued at the recomputed amounts on the receiving side.
* *Core Value:* Forgery stays private to the forger by construction.


* **Item Provenance**
* Items carry a trace to the checkpoint / ledger entry that produced them.
* Traceable items are fully functional anywhere. Untraceable items are cosmetic-only in anyone else's world.
* Power imported from Sanctuary into shared rooms is capped or normalized.


* **In-Room Peer Validation (Commons & Frontier)**
* Peers simulate shared rooms from everyone's inputs (lockstep) or cross-check a host.
* Impossible actions (speed, one-shot kills, out-of-range looting) are rejected by majority; a desynced cheater gets dropped.
* Residual gap: one player running multiple tabs as sock-puppet peers can win a small-room majority. Random matchmaking makes this rare; accepted for super-casual play.
* Heavier netcode than the rest; reserve for games where shared-room stakes matter.


* **Serverless Shared World**
* World terrain is generated from a shared seed; nobody stores it.
* Sanctuary positions derive from player-ID hashes; neighbors are the players whose IDs land nearby. No coordination needed.
* Neighbors cache and gossip each other's latest snapshots, so an offline player's Sanctuary is still visible as of their last checkpoint.


* **Consequences for the Social Design**
* **Reputation and bounties are session-local.** No persistent identity exists (clearing storage creates a new player), so reputation lives within a room. Across sessions, the griefing defense is small rooms and instant, free leaving.
* **Frontier stakes are session-bound.** "Real loss" means losing what was earned in that session, never imported Sanctuary items.
* **Asynchronous kindness travels without servers:**
* **Gift links:** gifts sent as shareable strings through messaging apps; wordless, free, and viral.
* **Gossip ghosts:** peers who meet exchange a few left-behind objects and carry them into later rooms. Slow, lossy delivery is part of the charm.


---

### AI Players: Populating the World

* **Bot-Backfilled Commons & Frontier**
* Commons and Frontier are pre-populated with AI players. Each real player who joins replaces one bot.
* Solo play is simply multiplayer with every slot filled by bots: the world works fully offline, and P2P only swaps bots for humans.
* *Core Value:* Solves the cold-start and density problem. The world is never empty, even on day one of a portal launch.


* **Wordless Design Makes Bots Believable**
* With no language, the classic bot tell (bad conversation) doesn't exist. Bots only need plausible behavior and well-timed emotes.


* **Bots Carry the Social Design**
* **Bots teach the norms:** new players learn the culture by watching bots gift, help stranded players, and occasionally prank. Kindness is modeled before any real player arrives.
* **Bots can play the villain:** an occasional mildly griefing bot triggers the bounty / humbling mechanic without needing a real troll.
* **Frontier bots:** the Frontier is viable with zero real players; real stakes, with tuned rather than stranger-dependent risk.


* **Rules for Bots**
* **Leave, don't vanish:** a bot finishes its current interaction, then walks home or out of view. Never pull a bot mid-trade or mid-gift with a real player.
* **Target density with hysteresis:** bots fill a room to a target size; returning bots are delayed so they don't flicker in and out as players come and go.
* **Economy-safe:** bot gifts are capped and their items carry "world" provenance, so bots can't inflate the economy.
* **Seed-generated Sanctuaries:** bot neighbors have generated bases that pass verification trivially.
* **Honesty:** bots are never *claimed* to be human, but not labeled either.


* **Serverless Bot Simulation**
* Bot decisions are driven by the room's seeded RNG, so every peer computes identical bot actions.
* Zero bandwidth, no host needed, and not injectable by a cheater.



---

### Solo-Dev Scope & Reusable Platform (AI-Accelerated)

* **Where the Cost Is**
* This concept's cost is systems code (saves, networking, verification, bots), not AAA-style content. AI acceleration is strongest exactly there, and nearly all of it is game-agnostic: pay once, reuse every month.
* **AI accelerates:** boilerplate, netcode wrappers, serialization, fixed-point math, publisher SDK integration, bot behaviors, tests, mechanic prototyping.
* **AI does not accelerate much:** finding the fun, balance tuning, real-network P2P debugging (NAT, mobile carriers), cross-browser determinism bugs.


* **Rule: Every Game Is Fully Fun Solo**
* Multiplayer is an overlay that lights up when peers are present. Nothing depends on it.
* With bot backfill, "solo" still includes a populated Commons and Frontier.


* **Build Once, Reuse Everywhere (Platform Layer)**
* **Save core:** local storage, checksum + obfuscation, string export/import.
* **String codec:** one format for Blueprints, saves, gift links, share links.
* **Deterministic core:** fixed-point math, config/ledger log, generic `output = f(config, time)` verifier, plausibility bounds.
* **Provenance:** item tagging with cosmetic-only fallback.
* **P2P layer:** signaling wrapper, room-by-topic join, lockstep / host cross-check, validation hooks.
* **Bot kit:** behavior primitives (wander, gather, gift, help, prank, emote, flee, fight), density manager, seeded decisions.
* **Social kit:** emote set, session reputation / bounty module fed by gameplay events.
* **Publisher adapter:** one interface over a cross-platform distribution SDK (ads, storage, platform differences). Save core writes through its storage abstraction.
* **Visual kit:** dynamic lighting, particles, procedural animation, procedural texture shaders, parallax layers, dev tweak panel. "Light is the art": no large tilesets needed, reusable style across games.
* Concrete frameworks, SDKs, and tools for each module: see [toolbox.md](toolbox.md).


* **Per Game (the Actual Monthly Work)**
* Core loop, visceral primitives, emergent combos, visual feedback, automation content, balance.
* Game-specific verbs and tuning for the bot kit.


* **Drop or Defer Until a Game Shows Traction**
* **Serverless shared world, neighbor snapshot caching, gossip ghosts:** high complexity, low payoff without real population.
* **Peer-witnessed checkpoints and peer-anchored time:** only meaningful once real players can see each other's Sanctuaries. Keep the verifier in the library anyway; it's cheap once written.
* **Rebirth plus many parallel specialization paths:** balance-heavy. At most one pivot mechanic per game. Two paths by default; three when they form a triangle of pairwise hybrids (the minimum that produces synergy, e.g., [spelunking_base.md](spelunking_base.md)). More core paths come in later updates.
* **Real-player Frontier PvP balance:** ship the bot-only Frontier first.


* **Distribution: Aggregators, Not Single Portals**
* Web game distribution is fragmented across hundreds of platforms; cross-platform publishers push one build everywhere (portals, messaging apps, social platforms, OEM stores, YouTube Playables). SDK details: see [toolbox.md](toolbox.md).
* **YouTube Playables** is the headline new channel: tier-1-heavy audience, reportedly higher CPMs than other web platforms, rapid growth; live in the US, CA, UK, AU, IN, MY, TR with an EU rollout. Revenue share still a pilot; ad-funded.
* **Design to the strictest platform:** YouTube Playables rules: no external network calls, portrait required (1:1 / 16:9 / 9:16), touch + mouse / keyboard, platform-provided storage, initial payload < 30 MB, 13+ audience.
* **Feature tiers per platform:** offline solo-with-bots everywhere; networked layer (P2P, links, clans) only where allowed (Discord, Telegram, standalone, most portals).
* Growth figures come mostly from publishers with an interest in the story; treat as directional and let each platform's own analytics decide where to invest.


* **Sequencing: Extract the Platform, Don't Pre-Build It**
* **Game 1:** single-player with bots; save core, string codec, deterministic core, publisher adapter written as clean modules.
* **Game 2:** reuse the modules, add gift links.
* **Game ~3:** add the P2P layer as an optional overlay.
* **By game 4–5:** the platform exists, and every month still shipped a game. Building the platform upfront means months of no releases and a platform designed on guesses.



---

Ready for your next set of thoughts whenever you're ready.
