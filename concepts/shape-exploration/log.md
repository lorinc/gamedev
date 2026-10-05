# Shape exploration: log

How the exercise got to its current state. The other files in this folder hold the present only. Newest last.
Quotes are the user's, with spelling lightly fixed.

## 2026-10-03: what to build ([build-principles.md](build-principles.md))

- The user asked to save the ideas of this stage: "save these ideas, these are relevant and important at this 'what
  to build' stage".
- **The principle.** Starting from a pasted summary of why Slay the Spire is easy to play and impossible to master:
  "I really would like to build the game like this." On why it sold: "Why I think Slay the Spire was a financial
  success is that it is both accessible, but never gets boring. And it does it through system, not by content, which
  makes the dev effort valuable." The follow-up made clear "like this" meant the principle, not Slay the Spire's run
  structure.
- **The tool.** "I plan to build a system optimizer / simulator, that makes the balancing and the complexity of random
  permutations manageable."
- **Expectations of a good game.** The user: "We know enough already to describe some expectations of a good game."
  The user drafted the list; Claude objected to three points, sharpened four and added two; the user agreed to all of
  it. Quotes from the draft that the agreed list restates:
  - "I need distinct, distant pillars for the tension cadence to work."
  - "The core should be possible to reach the fun toy feeling in seconds of loading the game."
  - "I love games where you choose when to face the next challenge, and you are under no constant pressure while
    preparing."
  - The draft said "the only useful feedback is the immediate"; Claude objected that for a Discovery-and-Strategy
    audience delayed consequences are where strategy comes from, if traceable. Agreed as "immediate signal, delayed
    consequence traceable".
- **Candidate A, the short run.** From "picking the game up again must not be overwhelming": "This points towards a
  very specific game shape: a short run, where complexity does not carry over, only knowledge, like Noita, or Super
  Auto Pets. Magicraft is borderline, because you unlock mechanics, but they can be ignored. What can not be ignored in
  Magicraft is the unlocked spells / trinkets in your random pool, that WILL make subsequent runs more complex, even if
  you forgot a lot about the game. That's an antipattern." Status: "just a strong candidate".
- **The simulation-time tension.** "Short runs bring a LOT of restrictions, but probably that's a good thing for
  creative constraints and interesting design. But it will be hard to combine with a simulated world that needs time
  to run its course." Claude offered three ways to fit the arc in a run, and advised against a world that keeps
  running between runs.
- **Candidate B, idle with prestige.** The user corrected that advice: "You forget that incremental / idle games are
  very popular now, and we should not reject that angle just yet."
- **Doc rule.** build-principles.md was rewritten as present-state only; this narrative moved here.
- **Pillars.** The user placed three equal-weight pillars on the map: around 1a, 2a, 1b, "but just a bit more
  towards challenge"; where 14's height and 25's column meet, near the audience–Story line; around 2b, 17, 8 and 3.
  "Not all pillars will be identical, but they should weigh the same. Some will be one central loop, some 2 support
  loops, and there will be one or two side loops." Their cards wait until their content is worked out.
- **Pillar roles.** The user's reading of the map, which Claude agreed with: P3 is what the player controls about the
  simulation; P2 is the most kinetic, the exciting exploration and horizon expansion; P1 is where difficulty scales
  with progress (Claude added: at steps the player chooses, or Power gains feel erased). Claude had first read P2 as
  the breather and asked where tranquility goes. The user: what is brought back from explorations feeds tinkering;
  tranquility side loops can live around any pillar (a vivarium or zoo, rare beautiful sightings during exploration,
  a riskless strategy-testing loop).
- **Limits and feeds.** Each pillar needs a limit raised by its loop and a plausible feed from another pillar. The user:
  "Allow players to grind and 'beef up' for the challenge in each pillar, so if something feels hard, it can be made
  easier without a slider. The theme is ecology, the loadout can not be technology. I think, this will be a taming
  game, where you find procgen living things (from slime mold to Arrakis sand worm), raise them, and send them to
  excursions." Breach = strategy, bringing back samples, seeds or captured animals; enclosures = the simulation, to
  farm or to tame and level; expeditions = exploring and flagging prospects. This replaced the earlier cycle
  (P2 → P3 → P1 → P2 through 14, 2b/2a, 1b).
- **Flows reworked.** The user: "P1 brings environmental / economic flora into the P3 simulation. P1 brings economic
  and exploration fauna into the P3 simulation. P3 simulation creates resources to host and level both. P3 simulation
  creates the teams that go on both P2 and P1 expeditions." And: "P1 unlocks new areas for P1 and P2 exploration."
  This replaced samples, seeds and captured animals (P1 → P3) and scouts with matching traits (P3 → P2).
- **Prospects as mysteries.** The user: "Prospects should be flagged as mystery (indicated by particle effects and
  shaders crossing the FOW, not by text or a symbol), until breached. Once breached, the expedition needs to spend time
  there to collect intel. Without that, we just see the visuals, but that's all. I'm not sure how we will be able to
  get the causality through without walls of text, but that's a good challenge to have."
- **Flows renamed and rerouted.** The user: "P1 -> P1: new fauna to tame. P2 -> P1: new areas to breach. P1 -> P2: open
  area for exploration. P3 -> P2: explorer pets. P3 -> P1: breach pets (would be nice to find a more peaceful name).
  P1 -> P3: does not exist, this goes through the P1 > P2 > P3 route."
- **Pillar names.** The user: "P3 is 'Colony'. P2 is 'Caverns'. P1 is 'Expanse' -- but I need options for this now."
  They replace Breach, Expedition and Enclosures.
- **P1 named The Unseen,** from a list of options for "uncharted" and "mystery" (Outlands was the runner-up).
- **Wake, not breach.** Asked for a less violent verb that can't be confused with exploring a cavern; the user chose
  "wake": "Wake is fitting, because simulation is suspended under FOW, it only looks alive via ambience."
- **Pioneers.** "Breach pets" renamed. The user wants names that are the explanation, not ones that need explanation;
  chose "Pioneers" from Pioneers, Pathfinders, Trailblazers, Openers, Vanguard.
- **Naturalists; no P1 → P1.** "Explorer pets" renamed naturalists. The user: "There's no P1->P1. A successful pioneer
  push opens up the unseen that becomes part of the cavern, that is now the Naturalist's domain."
- **Foragers; three categories.** The user: "So, we have 3 categories now. Economic, naturalist and pioneer. Let's call
  the naturalists foragers."
- **Flora and fauna.** The user: "All flora plays a systemic role, but some generate resources - these are the economic
  plants. All flora is collected by foragers during trips. All fauna is collected by pioneers through some kind of
  battle, that is not violent push, but peaceful pull, and success results the animal following the pioneers back
  into the colony, loss means that the animal decided to stay." Fauna now goes P1 → P3, flora P2 → P3.
- **What taming needs.** The user: "Pioneers need environmental protection for that area, and something that is
  intriguing for the tamed animal; ability to generate / deliver food for them, and, because nature is not
  romanticised, even prey animals can be used. And the stronger the animal is, the longer the taming takes, needing
  stronger team, more food / prey."
- **Field trips.** The user: "Okay, foragers go on field trips."
- **Colonies in place; Unseen → Cavern → Colony.** The user listed the loops per pillar, idle or active, then: "As I'm
  writing these I realized - the colony is not one place. Player needs colonized areas in different biomes, and
  'taking them home' and building them is a lot of coding and complexity. Just let biomes stay, wherever they are, and
  claim the place as colony and do the economic stuff in place. Even allow pioneers and foragers to leave from and
  arrive to any colony area. So the progress is: unseen > cavern > colony, and each transition has its cost /
  challenges. This growth always has a clear frontier, so complexity does not explode." Claude raised six gaps; the
  user's answers:
  1. Why more biomes: "for awesome, powerful, spectacular tames, for the sake of discovery and wonder, to see the
     unique mechanics of that biome, to have a chance to find unique wonders (breather loop)".
  2. Travel: "I'd rather add a teleport animation between colonies, I do not want to spend a lot of resources on
     pathfinding... unless we keep and polish the current mycelium travel network, that reduces complexity by several
     magnitudes."
  3. Tuning: "tames will not have a 'native' biome colony to live at the beginning - that's the game's way to tell the
     user to establish a colony in all biomes. The game can survive in non-native environment, but can only grow
     and/or reproduce in ideal conditions. And there, the player might want to push the balance into a more productive
     state. That's tuning."
  4. "The unseen does not need an idle part, that's where the action happens. But okay, we can make the taming IDLE,
     just like sending NMS frigates on missions. But not everything needs to be idle, the game does need some
     hands-on kinetic challenge, and this is the best candidate - the messy, mysterious frontier."
  5. "Open up: means now foragers can start to learn the biome. Once some biome elements are 100% learnt, prospectors
     can bring fauna home, pioneers can start taming. Taming goes through the food chain - simple animals first, then
     use them to tame stronger ones, and eventually the top predator, a mini-boss. The pioneers should tame a few
     low-level animals for their local resistances, and send in external crops and baits for capturing the next tier
     animal."
  6. "We should limit the biome connections, and that will keep growth manageable. Also, we should add heavy incentive
     using baits and crops from the same tier of biomes (like DAG levels), so player explores all of the next tiers
     before moving on to the next ones."
  The map stays as it is: it shows the player appeal per pillar, nothing else.
- **Order settled.** The loop list and answer 5 disagreed; the user: "I was changing my mind mid-flight. Open >
  foragers prospect and forage, pioneers tame a few of easiest animals > pioneers walk the food chain, reach the top >
  area can be colonized > colonized area allows economic use of crops and animals." Prospectors are not a fourth
  role: "just foragers have multiple roles: they collect knowledge (prospectors), they forage resources, they bring
  home flora samples, and they lift FOW". Taming the top predator, not finding everything, now unlocks colonization.
- **Five stages of a living thing.** The user: "biosphere entities go through these stages: unseen > wild > studied >
  foraged > cultivated." Pioneers open an area (unseen > wild); foragers study the food chain bottom-up; what is
  known can be foraged; what is foraged can be used in taming; tamed animals tame predators; the top predator tamed
  opens the area for colonization; cultivated areas self-collect. "We do not have to name everything, only what
  requires user decision": send pioneers to open up; "can't tame a creature without its natural diet already
  foraged"; "this also applies to predators, pioneers need to tame enough prey to capture it - careful, deep food
  chain requires exponentially more prey"; once the top predator is tamed the area can be cultivated; "cultivated
  area self-harvests both crop and prey". Studying and foraging are automatic.
- **Fauna is tamed, not foraged.** The user: "Fauna does not get automatically foraged, it needs the pioneers to tame
  them with active player participation."
- **Cultivation is triggered.** The user: "Cultivate is not an active process, it is a triggered outcome of active fauna
  taming."
- **Building a colony is a decision.** The user: "but colony build should be a user action, done by foragers."
  Taming the top predator makes the area colonizable; building the colony is the player's call.
- **Caverns, and a balance.** The state after the top predator is tamed is called Caverns. The user: "Okay, this is
  balanced - foragers and pioneers both have 4 tasks."
- **Area stages.** The opened area is called Wild: an area goes Unseen → Wild → Caverns → Cultivated.
- **Terrain.** The user: "Area should be 'terrain' and also have studied and foraged stage for the elements (ores,
  liquids, physical attributes)."
- **Depth, not confusion.** The user: "Coding this is not too complicated, because this is just a few principles
  applied to a few concepts. I think the player will also get it, because it is both natural, and mostly on autopilot.
  Complexity is now depth and lore, and not confusing uninformed decisions." On Claude's worry that three decisions
  carry too little hands-on play: "there will be more hands-on decisions, the pet levelling system. Player will want
  their teams to be strong enough for the next unseen breach, balancing a food chain up from minerals to apex
  predators, across multiple biomes, and maintain good forager and pioneer teams with probably synergising traits.
  This is a lot of work, even if a lot of things already run on autopilot."
- **Pillar names.** P3 Colony is renamed Cultivation and P2 Caverns is renamed Prospecting, so the pillars are The
  Unseen, Prospecting and Cultivation.
- **Biome tiers, teams, levelling.** Asked what a team is, what levelling costs and raises, and what makes a biome's
  tier: the first two are TBD. On tiers: "biomes will be a descent into the depths of the moon, but not like cake
  layers, but as amorphous blobs. And TBD, but I guess deeper layers will have more complexity: more environmental
  threats, deeper food chain, probably dependent on previous ones."
- **No deep bait graph.** On Claude's "which earlier biomes' baits it needs": "this makes it a similar mechanics as
  factorio games, but significantly less intuitive... so unless we fix that, I would not make this a deep graph. The
  team synergy will be a much more enjoyable mechanics, this one is a drag."
- **Abilities over resistances.** The user: "blobs also have slightly randomized physical boundaries, keep that in
  mind. And we need stuff that carry over resistances, because that mechanics is a good gatekeeper, but not fun at all.
  We need stuff like psychoactive crops or bait, mating-dance-imitators, resistance copiers, buffers, healers,
  burrowing super-prospectors... exciting stuff, that will keep a pet in a team, even if it has no resistance to the
  biome."
- **Suspicion and pickiness.** On Claude's reading that psychoactive bait substitutes for the natural diet: "actually
  psychoactive food was about lowering the tamed animal's suspicion... but yes, lowering how picky an animal is also a
  cool 'bend'."
- **Sonny and a scouting breach.** The user remembered Sonny's fights: "Every new area used something from the
  previous skills in an unexpected, really smart and exciting way." Asked to abstract the mechanic so it generalises
  to any battle mechanic, and to save it as an idea for taming and the breach: idea-taming-and-breach.md. The user
  added: "the breach could be a game, where the pioneers must wander in the unseen until all entities that live
  there have been spotted. Not a fight, not a tame, but a scouting game."
- **Telegraphing.** The user: "Sonny did what Slay the Spire did years later and shook the industry with it - Sonny's
  enemies telegraphed their actions, and you had to adjust your strategy, and it was therefore not luck."
- **Telegraphs and cooldowns.** The user: "Sonny enemies sometimes telegraphed multiple rounds ahead, based on the time
  you needed to plan your actions, because your actions also had cooldowns, so if your counter was on cooldown when
  you needed it, you've lost the battle."
- **Teams instead of a deck; coercion is allowed.** The user: "So, instead of building a deck, I build teams with
  skills that complement each other and have cooldowns", with the snare-and-charm example now in
  idea-taming-and-breach.md. On Claude's worry that a snare is coercion against the peaceful pull: "This does not
  have to be a Disney tale, coercion is not brutal violence. Sometimes a vet does coerce a pet to save it."

## 2026-10-04: the game shape (D188)

- Two candidates stood for the game's shape: A, a short run that keeps only knowledge (Noita, Super Auto Pets), and B,
  idle with prestige. The user settled it: "it is an incremental idle game, where you come in, move the needle, reap
  the rewards: resources, lore, unlocks, and play the taming game." "Each session can be 1 or more runs, and a run can
  be anything that pushes the needle: levelling up pets, changing and testing teams, reviewing new info on scouted
  animals, deciding on what to tame with what strategy." The idle layer, as the user amended it: "colonies
  (auto-harvest), foragers (caverns foraging) and scouts (intel gathering) keep working".
- Candidate A's reasoning, dropped from build-principles.md: complexity does not carry over, only knowledge; Power
  would have had to live inside each run; and the simulated world would have had to fit its arc inside one run
  (compress time, shrink the space, or set up and watch it play out).
- On the systems: "The food chain: the system has a working prototype, and the rest is creating and balancing
  procedural content. The colony: same as the food chain, just auto-harvests. Teams: needs polishing, but we have much
  better guesses now than when we drew the map first."

## 2026-10-05: genre, mode and mood (guide 17)

- The user shared Indie Game Clinic's "Game Genres - a Design Perspective" and asked for the lessons that apply here.
  The video says to build the base (the 3C) before the middle (loops, progression). The user defended the project's
  order: "Yes, we have built a 3C prototype, but a LOT of things in it will be dropped/changed, based on the
  exploration we do in the middle. I think this is better than the linear bottom-up method he is proposing."
- Claude agreed and added: in an idle game the moment-to-moment is the taming encounter, not the 3C, so the middle
  exploration found the base rather than skipping it; the condition is that the middle stays cheap until taming is
  fun once. Also raised: how the idle and taming halves cover each other, genre versus mode, generators and content
  after fun once, and animal tells as part of the base.
- The user called these "genuine pitfalls and good principles" and asked for them to be woven into the materials:
  guide 17, game-strategy.md item 17, build-principles.md (*The base is found, not chosen*, genre and mode, the
  combination reason as a draft, open question 6), and the taming README (*What p13 has to prove*).
- The user corrected the framing of the combination: "The idle farming + strategic taming + turn-based 'combat' was
  not 'my idea', it was the culmination of my preferences, competences and modelled audience needs. It solidified via
  very extensive exploration of the map." build-principles.md now says where it comes from (agreed); the mutual-cover
  reading stays a draft.

## 2026-10-05: deck-building roguelikes (guide 18)

- The user shared PepperHead's "What Makes A Good DECK BUILDING Roguelike?" ("it has a lot of insight into what makes
  deck building game good"). Claude walked through it against taming in chat.
- The user asked for it to be written up, with a rule for the record: "do not take your assessments as facts... I want
  the video insights to dominate the record, and your inference to be flagged as unverified inference." The user found
  some of the chat's insights shallower than usual.
- Written up as guide 18 (the video's claims, with Claude's project readings in a closing section flagged as unverified
  inference), game-strategy.md item 18, a pointer in build-principles.md open question 6, and the taming README
  (*What the deck-building references say*, the video's points only).

