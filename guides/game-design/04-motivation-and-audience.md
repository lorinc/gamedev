# 04 — Motivation and Audience

Player psychology, motivation models, ethics, and what casual web-portal players actually do. Written for a solo dev who ships one small HTML5 game a month through portals and aggregators.

Sibling guides (not repeated here): [foundations/MDA](01-foundations.md), [game feel and juice](02-game-feel.md), [levels, onboarding, difficulty](03-levels-onboarding-difficulty.md), [process and scope](05-process-and-scope.md).

Verified September 2026. Portal numbers come from the portals' own docs and blogs and are labeled that way. Anything not sourced is marked as opinion.

---

## 1. TL;DR: the principles that matter

1. **The first minute decides everything.** Poki and CrazyGames both measure how many page visitors start and keep playing ("conversion to play"). Both tell you to cut splash screens, menus and text. Your game starts when the page loads, not when the tutorial ends.
2. **Target the portals' own bars:** load in under 10 s, ship under 20 MB, 65%+ conversion to play, 5+ minutes average playtime (10+ for management and sim games). Those numbers come from the portals, not from folklore (§3).
3. **Competence first, autonomy second, relatedness last.** SDT ranks what holds players, and the order also matches cost for a monthly game: competence is cheap, relatedness (multiplayer) is expensive.
4. **Make the verb itself the reward.** Extrinsic rewards that depend on completing or performing a task measurably reduce intrinsic motivation. Use progression to open new ways to play, not as a paycheck for play the player already enjoys.
5. **Casual flow is low-attention flow.** Portal players multitask (a Poki-commissioned survey found 90% do something else while playing), and they sample 2–3 games per session. Design for a readable state at a glance and a loop you can pick up again after looking away.
6. **Teach with the world, not with words.** Visceral first action, then combine the primitives: skill atoms, not tutorial screens. Both portals ask for this explicitly.
7. **Player-type taxonomies are lenses, not segments.** Bartle is an unvalidated MUD essay. Quantic Foundry is empirical but comes from a self-selected, core-leaning sample. Use them to find blind spots, never to decide features.
8. **Coziness = safety + abundance + softness.** The dev's "no fall damage, no consumable limits" rule is textbook cozy design. Protect it from extrinsic reward creep, timers and social comparison.
9. **Constrain expression to what can only be kind, or at least harmless.** Journey, Sky and the Souls messages all reach wordless social play by *narrowing* what players can do to each other. Every affordance you add is an affordance griefers get too.
10. **Asynchronous traces beat synchronous presence** for a serverless monthly game: ghosts, left-behind objects and gift links give most of the "I'm not alone" feeling at a fraction of the P2P cost.
11. **No dark patterns, and not only for ethical reasons.** Portals ban ad-bait UI outright, and short-session players leave before a compulsion loop pays off. Dark patterns cost engineering time and still don't pay off here.
12. **Every meta-system must justify itself inside a month.** The default is one core loop, one light persistence layer (a local save plus a collection), and nothing else until a game shows traction.

---

## 2. Principles in depth

### 2.1 Self-Determination Theory (SDT) and the PENS model

**What.** Ryan, Rigby and Przybylski (2006) tested whether SDT's three basic needs predict game enjoyment. **Competence** (mastery, effective action), **autonomy** (volition, meaningful choice) and **relatedness** (connection to others) each independently predicted enjoyment and intention to keep playing, while game-specific factors like graphics mattered less. Rigby and Ryan turned this into the *Player Experience of Need Satisfaction* (PENS) model and the book *Glued to Games* (2011), whose main claim is that "fun" isn't what hooks people: need satisfaction is.

**Why it matters.** SDT is the most tested motivation framework in games research. It also explains *why* some things work: generous feedback serves competence, choosing where to dig serves autonomy, and a gift from a stranger serves relatedness.

**Criticism.** Tyack and Mekler (CHI 2020) reviewed 110 CHI/CHI PLAY papers that cited SDT. Most used it descriptively and ran questionnaires without engaging with the theory's core concepts or mini-theories. In practice, "SDT says so" is often a label stuck on a design after the fact. PENS is also a commercial instrument from Rigby's consultancy, Immersyve. Treat SDT as a solid checklist, not a physics engine.

**Example.** Tetris-like games deliver competence almost purely. Minecraft delivers autonomy. Journey delivers relatedness with almost no competence challenge. All three work.

**Apply to our games.**
- *Competence* is the cheapest need to satisfy. Crisp input response, readable feedback, a first action that succeeds. Spelunking's "swipe = intent" controls and "difficulty from composition and knowledge, not dexterity" are exactly right. **Value: very high, cost: low.**
- *Autonomy* means real choices about *where* and *how* to play, not dialog options. Choosing which vein to follow, which module to install, when to go home. Watch out for the "parallel specialization paths" pillar: each path costs balance time. **Value: high, cost: medium.**
- *Relatedness* is the most expensive need to build, and bots can partly stand in for it (see 2.9). **Value: moderate for a monthly game, cost: high.** Ship it last, if at all.

### 2.2 Flow, and why casual flow is different

**What.** Csikszentmihalyi's flow is the absorbed state in which challenge matches skill, goals are clear and feedback is immediate. Jenova Chen's MFA thesis *Flow in Games* (2006) argues that because players differ in skill, the flow zone differs per player. His answer is to hand players *subconscious choices* that adjust difficulty. In flOw, you dive deeper when you feel ready and float up when you don't.

**Why.** Chen's version is the useful one for us. It doesn't mean dynamic difficulty algorithms. It means **letting the player steer their own challenge through in-world actions**, which is already a pillar ("player-driven dynamic difficulty").

**The casual caveat (opinion, backed by portal survey data).** Portal players are rarely in deep flow. Poki's 2026 survey (2,000 US/UK web gamers, run by Atomik Research for Poki) reports 90% doing something else while playing: music 56%, streaming 49%, social media 38%. Typical sessions run 11–20 minutes, across 2–3 different games. Design for **interruptible flow**: a state readable at a glance, no penalty for idling, and a loop that picks back up in one action.

**Apply.** Spelunking's depth axis *is* flOw's depth axis: going deeper is choosing more risk. Keep that as the only difficulty dial. No difficulty menu, no rubber-banding AI. **Value: high, cost: near zero if designed in from the start.**

### 2.3 Player-type models: Bartle and Quantic Foundry

**What.** Bartle (1996) sorted MUD players into Achievers, Explorers, Socializers and Killers on two axes: acting on vs. interacting with, and the world vs. players. Nick Yee's factor-analytic work (2006) replaced *types* with *components*: Achievement, Social and Immersion, which correlate only weakly, so one player can score high on all three. Quantic Foundry (Yee and Ducheneaut) extends this to 12 motivations in 6 pairs and 3 clusters, from over 1.25M respondents according to their own reference deck:

| Cluster | Pairs (motivations) |
|---|---|
| Action–Social ("bright") | Action (Destruction, Excitement) · Social (Competition, Community) |
| Mastery–Achievement ("tall") | Mastery (Challenge, Strategy) · Achievement (Completion, Power) |
| Immersion–Creativity ("wide") | Immersion (Fantasy, Story) · Creativity (Design, Discovery) |

**Criticism.**
- Bartle's types come from an essay that summarized a MUD staff discussion. They were never psychometrically validated, and they were written for MUDs, not for games in general. Yee's data shows motivations don't sort people into exclusive types.
- Quantic Foundry's sample is self-selected: people who take an online "gamer motivation profile" quiz, which skews toward engaged, core gamers. Casual portal players who spend 5 minutes per game are underrepresented. Notably, their data has **no standalone "exploration" factor**. Map-exploration items load on Fantasy and mechanics-exploration on Mastery. That matters for a cave game (see below).
- Both models describe *players*, but you can't target players on a portal. You get whoever clicks the thumbnail.

**Apply.** Use Quantic Foundry as an audit: "which of the 12 does spelunking feed?" Probably Discovery, Completion (the bucket list), Design (tunable base visuals), Power (deeper gear), and Excitement (chain reactions). Then ask whether the thumbnail and first minute show *those*. Because Quantic Foundry has no pure "exploration" factor, "exploration" needs a concrete payoff: loot (Completion), something to tinker with (Discovery), or a vista (Fantasy). Wandering alone isn't enough. **Value: moderate as a one-hour audit. Zero as a feature planner.**

### 2.4 Intrinsic vs. extrinsic rewards, and progression

**What.** Deci, Koestner and Ryan's 1999 meta-analysis of 128 experiments found that engagement-contingent, completion-contingent and performance-contingent tangible rewards significantly undermined free-choice intrinsic motivation. Verbal (informational) feedback did not. This is the *overjustification effect*. The finding is contested: Cameron, Pierce and colleagues published rebuttals, and effect sizes vary. The direction is robust enough to design by. GMTK's *This Psychological Trick Makes Rewards Backfire* is the 15-minute game-specific version.

**Why it matters for us.** Portal players give you 5 minutes. XP bars, daily streaks and currency drips work on *returning* players, and on a portal most players never return (CrazyGames' "good" day-1 retention benchmark is 10–15%). What holds the first session is intrinsic: the verb feels good and the world is curious.

**Rules of thumb (opinion):**
- Rewards should be **informational** ("you got better", "here's a new verb") rather than **controlling** ("do X to earn Y").
- **Unlocks that change play** (new module, new verb, a new depth layer) beat **numbers going up**. A +5% dig speed is a paycheck. A drill that punches through obsidian is a new toy.
- Collections work as a light meta *if* completing them is a side effect of play you would do anyway. The spelunking bucket list ("pin what you love, see how to get it") is aspiration, not obligation. Keep it that way: no expiring pins, no "complete 5 today".

**Apply.** Spelunking's loop (dig → loot → install → produce → dig deeper) is healthy because the loot *changes how the base works*. The risk is the "Produce" step turning into an idle-number treadmill. **Value: high (it's the core design lever). Cost: it's a discipline, not a system.**

### 2.5 Idle and incremental games as a design lesson

**What.** Anthony Pecorella (Kongregate) documented the math: costs grow exponentially (`cost = base × rate^owned`, with rates around 1.07–1.15 in his AdVenture Capitalist example), production grows linearly with multipliers, so exponential costs always eventually outrun production. That produces walls, and *prestige* (reset for a permanent multiplier) turns each wall into a new lap.

**The lesson for non-idle games.**
1. **Visible compounding is intensely satisfying**, even with almost no skill involved. The automation pillar taps into exactly this.
2. **Offline progress** ("while you were away...") is the cheapest return hook there is. It's also a pure function of config and elapsed time, which matches the dev's `output = f(config, time)` verification design.
3. **Idle math produces walls by construction.** Prestige is how the genre patches them, and prestige is balance-heavy. The pillar doc already caps this at "one pivot mechanic per game".

**Apply.** Borrow two things: a closed-form offline yield on return, and machines that visibly show numbers compounding. Skip prestige, multiple currencies and upgrade trees for monthly games. **Value: high for the offline-yield hook (a few hours of work), negative for full idle meta (weeks of balancing).**

### 2.6 Onboarding without tutorials: skill atoms

**What.** Daniel Cook's *The Chemistry of Game Design* (2007) models a game as a chain of **skill atoms**: action → simulation → feedback → the player updates their model. Atoms depend on earlier atoms. A player who hasn't mastered atom A can't learn B, and they leave or get bored at that point. *Loops and Arcs* (2012) extends the idea: loops are learnable systems, arcs are content you consume once.

**Why.** It turns "no tutorials" from a vibe into a checklist. List every atom, order the dependencies, and make sure each gets exercised in a safe context before it's combined with others. The dev's "stacking visceral primitives" pillar is skill chains under another name.

**Example.** GMTK's *Half-Life 2's Invisible Tutorial*: the game teaches physics manipulation by making it the only way out of a room.

**Apply.** For spelunking, write the chain on one page. Swipe-walk → swipe-into-wall mines → loot glows → teleport home → install. Each of these must succeed on the first attempt within the first 30 seconds, with the buried old city as a guaranteed-success zone ("dense with loot by nature" is exactly right). Level-by-level teaching belongs to [03](03-levels-onboarding-difficulty.md). **Value: very high, cost: low.**

### 2.7 Cozy design

**What.** Project Horseshoe 2017 (Cook, Short, Forbes, Howe and others) defines coziness as the fantasy of **safety** (no physical, emotional or social risk), **abundance** (needs met, nothing pressing) and **softness** (gentle stimuli). It lists what *negates* coziness: extrinsic rewards, threats, responsibility, intense stimulus, vast distances, non-consensual social situations, deception, opulence. It adds that danger can *enhance* coziness when it sits outside the safe space (the Dark Souls bonfire). Kitfox's Tanya X. Short summarized the report for developers as *Designing for Coziness*.

**Why.** The report's argument (Cook) is that coziness attracts underserved audiences, reduces stress-driven churn, and "attracts nice people", which is a community-health argument for a game with player interaction.

**Apply.** Spelunking already matches this closely: a warm lit home against the dark, no fall death, no consumable scarcity. Three guardrails:
- **Raids threaten safety.** The pillar doc caps them to surplus. Present them as weather, not war: visible, bounded, recoverable within minutes.
- **Timers and dailies negate abundance.** Don't add them.
- **"FOMO-driven quest system"** (the bucket list's own description in the concept doc) is fine as *aspiration*, but actual FOMO (limited-time items) is a coziness negator and a dark pattern. Keep pinned items permanently obtainable.

**Value: high, cost: mostly restraint.**

### 2.8 Social design without text

**Journey (2012).** No names, no chat, no lobby. Players communicate with a chime, and proximity recharges flight. In his GDC 2013 *Designing Journey* talk, Chen describes the multiplayer as deliberately about neither achievement nor empowerment. In the 2024 GDC talk *Designing to Reduce Toxicity in Online Games*, as reported by PC Gamer, he describes the many iterations Journey's systems needed before players saw each other as collaborators rather than competition for resources. Players push each other only if the game lets them. **The lesson is subtractive: remove every mechanic whose most entertaining use is harming someone.**

**Sky: Children of the Light.** A "dual consent" ladder (PC Gamer's account of Chen's talk). Strangers appear as silhouettes. Both players must hold out a candle to see each other. Friendship, emotes-together, chat and teleport-to each cost further candles, which are the progression currency, so trust is a spent resource. Chen: "you have to earn your rights to apply your social power." He also describes a failure: benches that seated eight players became stages for reaction-seekers.

**Dark Souls / Demon's Souls.** Messages are assembled from fixed templates and a fixed word list, retrieved at random, and rated by readers. Miyazaki traces the co-op idea to cars on a snowy hill pushing each other up without ever meeting (GamesRadar, citing The New Yorker). The template constraint makes messages moderation-free, yet players still found ways to be funny and to troll ("try finger, but hole").

**Death Stranding.** The Social Strand System: structures other players built appear in your world, you both benefit, and the only reply is a "like". Director's Cut work focused on improving exactly this asynchronous layer (Shacknews).

**Cook's frameworks.** *Game design patterns for building friendships* (2017) says friendships form through **proximity** (repeated encounters with recognizable people), **similarity**, **reciprocity**, then **disclosure**. *Kind Games* (2023) collects prosocial patterns: scaffolded communication, low-cost shared emotes, gifting, asynchronous help. It also gives the key warning: "ask how your prosocial feature will be used for evil."

**Apply to our games.**
- The wordless pillar is well supported by precedent. Its hard part isn't the absence of text. It's that **every physical affordance** (pushing, blocking, digging near someone, taking loot) becomes speech, and the rude kind is louder. Before adding any interaction in the Commons, write down its griefing use.
- **Recognition needs persistence**, and Cook's proximity factor needs recognizable repeat encounters. With session-local identity and small rooms, friendships rarely form. That's fine. Aim for *moments* (a stranger's gift) rather than *relationships*.
- **Cheapest relatedness, ranked (opinion):** (1) bot kindness modeled on screen, costing nothing extra because bots exist anyway; (2) gift links through messaging apps; (3) left-behind objects and ghosts from a seeded or cached pool; (4) live P2P emotes; (5) live shared rooms with physical interaction. Ship them in that order. Items 4–5 should wait for traction, as the pillar doc already says.
- Sky's lesson for the Frontier: make escalation **opt-in and mutual**, never unilateral.

**Value: very high for 1–2, moderate for 3, low per hour for 4–5 in a monthly game.**

### 2.9 Ethical design vs. dark patterns

**What.** Zagal, Björk and Lewis (FDG 2013) define a dark game design pattern as one "used intentionally by a game creator to cause negative experiences for players which are against their best interests and likely to happen without their consent". They group these as temporal (grinding, playing on the game's schedule), monetary (premium currency obfuscation, pay-to-skip), and social (pyramid recruiting, impersonation). DarkPattern.games catalogs them per mobile game.

**Why avoid them here, beyond ethics:**
- **The portals prohibit many of them outright.** CrazyGames' requirements: buttons must not be "sized to encourage ads", no "delays to confuse users", midgame ads never on navigation buttons, rewarded ads must be clearly optional, not offered too often, never chained.
- **They pay off only over long retention**, and portal traffic is dominated by first sessions.
- **They contradict coziness**, which is the brand.
- Kids are a large share of portal audiences (CrazyGames requires PEGI 12 content). Keep that in mind.

**Allowed and good:** a rewarded ad that is a genuine, optional convenience at a natural break. Offline yield that just accumulates, with no "come back or lose it". Collections without expiry.

---

## 3. The web-portal reality

### 3.1 What the portals publish (primary sources)

**Poki developer docs** ([How testing works](https://developers.poki.com/guide/how-testing-works), [Player fit test](https://developers.poki.com/guide/player-fit-test), [Reading results](https://developers.poki.com/guide/reading-results), [Easy access](https://developers.poki.com/guide/easy-access)):
- Targets before review: **65%+ conversion to play, 5+ minutes average playtime (10+ for management/simulation)**. Platform average: **~70% conversion, 6+ minutes**.
- The player fit test (500 Poki players) counts as healthy at **3+ minutes average with 25%+ of plays over 3 minutes**. The docs call 3 minutes "the minimum".
- Low conversion → "Speed. Shrink your file size, shorten loading, and make onboarding snappy." Quitting in the first minute plus a left-leaning histogram → an onboarding or loading problem.
- Onboarding: skip splash screens, title screens and level selects for new players. Start with levels players will easily finish. Use images, animations and gestures instead of text. Introduce features gradually. Use progressive loading.
- Mobile: "portrait-playable games see more players enter gameplay on average". Portrait also unlocks an extra mobile ad format.
- Poki does not state a fixed mobile share in these docs. Instead it offers a live [player device report](https://developers.poki.com/guide/player-device-report) sampled from its player base. Check it before deciding on performance budgets.

**Poki blog** ([What makes a high-quality browser game](https://poki.com/blog/what-makes-high-quality-browser-game)): the Stickman Hook case study. A 40 MB WebGL build with a 29.5 s median load converted at 50%. A 6 MB HTML5 rebuild with a 3.7 s load converted at 72%. The post also says core loops should be "optimised for short player sessions" and UI must be "big, readable" on mobile and desktop.

**Poki survey** ([2026 State of Web Gaming](https://poki.com/blog/state-of-web-gaming-report-2026)). A survey commissioned by Poki: 2,000 US/UK web gamers who play at least weekly, run by Atomik Research. **Self-reported and from an interested party.** 37% play several times a day. Sessions typically run 11–20 minutes, with 2–3 games per session. 80% play at home to relax. 90% multitask. 46% have abandoned mobile games over slow loading.

**CrazyGames docs** ([Basic launch metrics](https://docs.crazygames.com/resources/basic-launch-metrics/), [Gameplay requirements](https://docs.crazygames.com/requirements/gameplay/), [Quality guidelines](https://docs.crazygames.com/requirements/quality/), [Ads](https://docs.crazygames.com/requirements/ads/)):
- Launch benchmarks: **average playtime 10+ min**, **day-1 retention 10–15%**, **conversion (plays ≥1 min) 80%+**, load **<10 s**, build **<20 MB**.
- "Land new users in gameplay immediately", or at most 1 click. Onboarding should happen inside gameplay, be skippable, and use visuals over text.
- If a game offers both solo and multiplayer, solo must be "as prominent as playing with friends".
- Midgame ads at most one every 3 minutes, only at natural breaks. Rewarded ads must be optional, clearly labeled, not chained.

### 3.2 What these numbers mean for design

- CrazyGames' "conversion" (≥1 minute) is an **onboarding metric**. Poki's conversion is mostly a **loading metric**. Both are about the first minute.
- A 5–10 minute average with 10–15% day-1 retention means **the first session is the game** for most players. Persistence is a bonus for the minority who return. Design the first 10 minutes as a complete, satisfying arc: a first dive, a first install, the base starting to hum, one clear glimpse of something deeper.
- Management and sim games get a 10+ minute bar on Poki. Spelunking's base half is judged against that.
- "Solo as prominent as multiplayer" fits the "every game fully fun solo" pillar exactly.

### 3.3 Folklore (plausible, but not from a primary source)

- **"You have 3/5/10 seconds."** No portal doc I found states a hard seconds threshold for fun. "10 seconds" appears in CrazyGames' *load-time* target and in third-party articles (e.g., the Defold/Björn Ritzl web best-practices post, whose numbers roughly match Poki's). The pillar doc's "3 seconds to core loop" is a fine internal goal, but it's our own rule.
- **"Most portal traffic is mobile."** It depends on the portal and the country. Third-party traffic estimators (Similarweb and others) show large regional swings. Use the portal's own device report and your analytics.
- **"Portal players are kids."** Partly true, since content rules assume minors, but there's no public age split in the docs I verified.
- **"Retention mechanics (dailies, streaks) boost portal revenue."** Unproven for portals. The portals' own advice is almost entirely about load time, onboarding, clarity and session depth.

---

## 4. Anti-patterns and overengineering traps

Ranked by how often they're likely to cost a monthly developer a month (opinion).

1. **Meta before core.** Currencies, upgrade trees, prestige, achievements and dailies built before the core verb survives Poki's player fit test. Portal players judge the first 5 minutes, and meta pays off only after that. *Rule: no meta work until the core loop alone clears a 3-minute average in playtests.*
2. **Multiplayer as the first feature.** P2P rooms, reconciliation, matchmaking, reputation. Every precedent in §2.8 took years and a team. *Rule: bots, then gift links, then async ghosts. Live P2P only after traction.*
3. **Tutorial screens.** Both portals say no. If you're writing a tutorial, the skill chain is broken.
4. **Parallel specialization paths ×N.** Each path multiplies balance work. The pillar doc already limits this to two by default, three when they form a triangle. Hold to it.
5. **Theory-driven feature lists.** "We need something for Socializers." Bartle segments don't exist on a portal, and a feature for a type you imagined is scope bloat with a citation attached.
6. **Extrinsic reward creep.** A +1 coin popup on every action, XP for things that are already fun, streaks. It undermines intrinsic motivation, looks cluttered, and breaks the "no UI clutter" pillar.
7. **Dark-pattern monetization.** Ad-bait buttons, fake "continue?" countdowns, chained rewarded ads. The portal rejects these, and players bounce anyway.
8. **Rich social affordances without a griefing pass.** Every physical interaction is a message, and the rude one is the most fun to send. Journey and Sky both had to *remove or gate* affordances after testing.
9. **Personal persistence as a promise.** Browser storage gets cleared and portals differ in their storage APIs. The design must not *depend* on long-lived saves (the pillar's string-export fallback is right).
10. **Designing for flow in a multitasking audience.** Long uninterruptible sequences and punishment for looking away. Portal players have a stream running in the other tab.

---

## 5. Annotated sources, ranked by value per hour

★ = watch/read first.

| # | Source | Time | Why it's worth it |
|---|---|---|---|
| 1 ★ | Poki docs: [Easy access & onboarding](https://developers.poki.com/guide/easy-access), [How testing works](https://developers.poki.com/guide/how-testing-works), [Player fit test](https://developers.poki.com/guide/player-fit-test), [Reading results](https://developers.poki.com/guide/reading-results) | 20 min | The actual bar your game is judged against, in the platform's own numbers. Highest value per minute in this list. |
| 2 ★ | CrazyGames docs: [Basic launch metrics](https://docs.crazygames.com/resources/basic-launch-metrics/), [Quality guidelines](https://docs.crazygames.com/requirements/quality/), [Ads](https://docs.crazygames.com/requirements/ads/) | 15 min | Second portal's benchmarks, including day-1 retention, plus the ad rules that doubly forbid dark patterns. |
| 3 ★ | Project Horseshoe 2017, *Coziness in Games* ([report](https://projecthorseshoe.com/reports/featured/ph17r3.htm); [Cook's Lostgarden post](https://lostgarden.com/2018/01/24/cozy-games/); [Short's summary](https://www.gamedeveloper.com/design/designing-for-coziness)) | 45 min | The design vocabulary for the dev's "casual, not survival" stance, including its list of coziness negators to check new features against. |
| 4 ★ | Daniel Cook, [*Game design patterns for building friendships*](https://lostgarden.com/2017/01/27/game-design-patterns-for-building-friendships/) ([GDC talk](https://www.youtube.com/watch?v=voz6S7ryWC0)) and [*Kind Games: Designing for Prosocial Multiplayer*](https://lostgarden.com/2023/07/08/kind-games-designing-for-prosocial-multiplayer/) | 90 min | The best available writing on social systems without chat. Kind Games covers Journey, Sky, Souls and Death Stranding in one place, with failure cases. |
| 5 ★ | GMTK, [*This Psychological Trick Makes Rewards Backfire*](https://www.youtube.com/watch?v=1ypOUn6rThM) | 15 min | Overjustification applied to games. Watch before designing any progression system. |
| 6 | Daniel Cook, [*The Chemistry of Game Design*](https://lostgarden.com/2007/07/19/the-chemistry-of-game-design/) and [*Loops and Arcs*](https://lostgarden.com/2012/04/30/loops-and-arcs/); talk [*Game Design Theory I Wish I Had Known When I Started*](https://www.youtube.com/watch?v=qwPe3OHR04c) | 90 min | Skill atoms: the operational form of "no tutorials". |
| 7 | Jenova Chen, [GDC 2024 *Designing to Reduce Toxicity in Online Games*](https://gdcvault.com/play/1034512/Free-to-Play-Summit-Designing) ([YouTube](https://www.youtube.com/watch?v=VXTMG0qeJqk); [PC Gamer write-up](https://www.pcgamer.com/games/mmo/nobody-is-born-toxic-says-journeys-creative-director-while-preparing-to-launch-the-kindest-mmo-on-pc/)) | 60 min | Sky's consent ladder, and why every social affordance needs gating. Directly relevant to the wordless and Commons pillars. |
| 8 | Poki blog, [*What makes a high-quality browser game*](https://poki.com/blog/what-makes-high-quality-browser-game) | 10 min | The Stickman Hook load-time/conversion case study. |
| 9 | Ryan, Rigby & Przybylski 2006, [*The Motivational Pull of Video Games*](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf) ([journal](https://link.springer.com/article/10.1007/s11031-006-9051-8)) | 60 min | The primary SDT-in-games study. Read the intro and discussion, and skim the stats. The book [*Glued to Games*](https://books.google.com/books/about/Glued_to_Games.html?id=Bg1GEwaGhUwC) is optional. The paper carries the core idea. |
| 10 | Jenova Chen, [*Flow in Games* MFA thesis](https://www.jenovachen.com/flowingames/Flow_in_games_final.pdf) | 40 min | Player-steered difficulty through in-world choices, i.e. the depth-is-risk axis. |
| 11 | Pecorella, [*The Math of Idle Games, Part I*](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i) ([GDC Europe 2016 talk](https://www.gdcvault.com/play/1023876/Quest-for-Progress-The-Math)) | 30 min | Cost and production curves. Read once to understand why compounding satisfies, and why prestige exists. |
| 12 | Zagal, Björk & Lewis 2013, [*Dark Patterns in the Design of Games*](http://www.fdg2013.org/program/papers/paper06_zagal_etal.pdf); [DarkPattern.games](https://www.darkpattern.games/) | 40 min | Taxonomy to check your own designs against. |
| 13 | Chen, [GDC 2013 *Designing Journey*](https://gdcvault.com/play/1017700/Designing) ([archive.org copy](https://archive.org/details/GDC2013Chen)) | 60 min | The origin story of wordless co-op. Emotionally useful, less actionable than #7. |
| 14 | GMTK, [*Half-Life 2's Invisible Tutorial*](https://www.youtube.com/watch?v=MMggqenxuZc) and [*How Game Designers Protect Players From Themselves*](https://www.youtube.com/watch?v=7L8vAGGitr8) | 25 min | Teaching through space, and nudging player behavior without rules. |
| 15 | Poki, [*2026 State of Web Gaming*](https://poki.com/blog/state-of-web-gaming-report-2026) | 15 min | Survey context (sessions, multitasking). Commissioned by the portal, so read it as directional. |
| 16 | Quantic Foundry, [Gamer Motivation Model reference (PDF)](https://quanticfoundry.com/wp-content/uploads/2019/04/Gamer-Motivation-Model-Reference.pdf); Nick Yee, [*Motivations of Play in Online Games*](https://nickyee.com/pubs/Yee%20-%20Motivations%20(2007).pdf) | 40 min | Use as an audit lens. Yee's paper is the empirical rebuttal to type-based thinking. |
| 17 | Deci, Koestner & Ryan 1999, [meta-analysis of extrinsic rewards](https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf) | 60+ min | Primary evidence behind #5. Only if you want the details of the debate. |
| 18 | Tyack & Mekler 2020, [*SDT in HCI Games Research*](https://dl.acm.org/doi/abs/10.1145/3313831.3376723) | 30 min | The critique: how SDT gets used as a label. Keeps you honest. |
| 19 | Bartle 1996, [*Hearts, Clubs, Diamonds, Spades*](https://mud.co.uk/richard/hcds.htm) | 30 min | Historical. Read it so you recognize it when others cite it, not to design from it. |
| 20 | Souls and Death Stranding background: [Miyazaki's snowy-hill inspiration (GamesRadar)](https://www.gamesradar.com/elden-ring-and-dark-souls-summoning-system-was-inspired-by-miyazakis-car-breaking-down/); [Death Stranding DC async multiplayer (Shacknews)](https://www.shacknews.com/article/125784/a-big-goal-of-death-stranding-directors-cut-was-improving-the-asynchronous-multiplayer) | 15 min | Anecdotes. Cook's *Kind Games* (#4) covers the design substance better. |
| — | Third-party, non-portal: [Defold, *Best practices when building for the web*](https://defold.com/2026/06/02/Best-practices-when-building-for-the-web/) | 15 min | Useful summary of Poki-style targets, but secondary. Prefer #1. |
