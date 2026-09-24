# 01 · Foundations and Frameworks

Game design theory worth knowing for a solo dev who ships one small browser game a month. Starting point: Mark Brown's *Game Maker's Toolkit* (GMTK). Covers MDA, verbs and core loops, Koster, Meier, Schell, Nintendo practice, and systemic vs. authored design.

Sibling guides (only linked here, not repeated): [02 game feel](02-game-feel.md) · [03 levels, onboarding, difficulty](03-levels-onboarding-difficulty.md) · [04 motivation and casual/portal audiences](04-motivation-and-audience.md) · [05 process and scope](05-process-and-scope.md).

**How to read this:** every framework below is a *lens for reviewing a build*. None of them is a process for producing one. For your situation they're worth maybe an evening each. The build is where the design happens.

---

## 1. TL;DR

1. **Mechanics make the experience.** Setting, story and art only change how it looks. If it isn't fun as coloured squares, it won't be fun.
2. **Find the verb first, then build the game around it** (Nintendo's "play first").
3. **Make one verb do many jobs.** Versatile verbs and dual-purpose mechanics give depth without extra rules.
4. **Fun is learning a pattern.** Once the player has mastered it, the game gets boring unless it introduces a new one.
5. **A decision only counts if the right answer depends on the situation** (Meier). If players always pick the same option, or pick at random, it isn't a decision.
6. **Loops repeat, arcs don't.** Know which one you're building. A small game needs one excellent loop, not an arc.
7. **Feedback loops steer the whole game.** Positive loops snowball and negative loops stabilise. Pick each one on purpose.
8. **Input randomness beats output randomness** for a game about choices. Show the dice before the player commits.
9. **Systemic design means few universal rules that multiply.** For a solo dev it's cheaper per hour of play than authored content, but it needs tighter constraints, not fewer.
10. **Players will optimise the fun out of your game.** Make the best strategy and the fun strategy the same one.
11. **Subtract.** Cutting a mechanic usually improves the game more than adding one.
12. **Introduce, develop, twist, conclude** (kishōtenketsu). This is the smallest useful unit of content structure. Then drop the gimmick.

---

## 2. Principles in depth

### 2.1 Mechanics make the experience (MDA)

**What:** Hunicke, LeBlanc and Zubek's MDA paper (2004) splits a game into **Mechanics** (rules and code), **Dynamics** (what happens at runtime when the rules meet a player) and **Aesthetics** (the emotions the player has). The designer can only touch mechanics. The player first meets aesthetics. Dynamics sit in between, and you can't author them directly: you find out what they are by playing. MDA builds on Doug Church's 1999 "Formal Abstract Design Tools", which asked for a shared design vocabulary.

**Why it matters:** it explains why "make it feel tense" is a wish, not a design. You can only change a number or a rule and then observe. GMTK's first real lesson, *Theme and Mechanics in Far Cry 2 and Far Cry 4* (Brown, 2015), shows two games with near-identical settings that feel opposite because of mechanics: jamming guns, malaria and fire spread in 2 versus a player-empowering toolkit in 4. Brown's retrospective puts it first on his list: "Mechanics drive experience."

**Honest value:** high as a *mindset*, low as a *procedure*. You need a single sentence from it: *"I change mechanics; I observe dynamics; I judge aesthetics."* The paper's taxonomy of eight kinds of fun (sensation, fantasy, narrative, challenge, fellowship, discovery, expression, submission) is useful vocabulary and useless for making decisions. Common critique: MDA pushes you to think mechanics-first and then hope. In practice, you pick the target feeling first, then iterate on mechanics until it shows up.

**Example:** Downwell. Its tension comes from one rule: your gun is also your jump. It doesn't come from the dark palette.

**Apply to spelunking:** the "chill but greedy" aesthetic will come entirely from stop rules, dig-speed ratios and the glow→bugs curve, not from the moon setting. That's why b1 is right to test as coloured squares. Keep it that way until b2 passes.

### 2.2 Verb first: Nintendo's "play first"

**What:** Nintendo prototypes the *act of playing* before it decides what the game is about. GMTK's *Nintendo – Putting Play First* (2016) covers the practice. Splatoon started as blocks of tofu shooting ink at each other. The team only picked squids once "hiding in your own ink" turned out to be the fun (Iwata Asks: Splatoon, "It Started With Tofu"). For *Breath of the Wild*, the team built a **2D prototype styled after the first NES Zelda** to test their physics and chemistry rules before building the 3D world (GDC 2017, "Breaking Conventions with The Legend of Zelda: Breath of the Wild").

**Why it matters:** the verb is the most-repeated thing in your game, and the player will do it thousands of times. Everything else (goals, loot, progression) is there to give the verb reasons and contexts. A strong verb can survive weak content, but no amount of content saves a weak verb.

**Honest value:** the highest-value principle in this guide for a one-game-a-month cadence. It's also free, because it just tells you what order to work in.

**Apply to spelunking:** the verb is "swipe, then the character carries on until something changes." The concept doc's kill criterion ("b1 boring after tuning stop rules → rethink movement before anything else") is exactly Nintendo's rule. Hold to it, even though 800 lines of concept doc depend on the answer.

### 2.3 Versatile verbs and dual-purpose design

**What:** two GMTK videos, one idea. *The Secret of Mario's Jump (and other Versatile Verbs)* (2017): a good verb has many uses depending on context (Mario's jump moves, attacks, dodges and reaches). *Downwell's Dual Purpose Design* (2016) quotes Miyamoto's maxim that a good idea solves several problems at once: in Downwell, one button is jump, shoot and brake. Harvey and Randy Smith's GDC 2004 talk on emergent gameplay makes the systemic version of the same point: fewer, more general rules produce more second-order consequences.

**Why it matters:** each new verb costs onboarding, UI, balance and code. Each new *use* of an existing verb costs almost nothing, and players find it themselves, which feels like mastery.

**Honest value:** very high for touch-first casual games, where input bandwidth is tiny (swipe, tap, long-tap).

**Example:** *Tomb of the Mask*: a single swipe gesture, where the level geometry decides the outcome. The whole game comes from one verb.

**Apply to spelunking:** the design already does this. The swipe means walk, mine, build, cross or climb depending on context, and **glow is dual-purpose** (your loot is your light *and* your bug lure). Treat "glow drives both sight and danger" as the design's crown jewel and defend it from extra rules. The risk is the flip side of versatility: a context misread. Log every "I didn't mean to mine" in b1.

### 2.4 Fun is pattern-learning (Koster, *A Theory of Fun*)

**What:** Raph Koster's claim (2004 book, revised 2013) is that fun is the feeling of the brain learning a pattern. When the pattern is mastered, or when it's too noisy to learn at all, boredom follows. Games are "chunkable" problems. He revisits and partly revises this in "A Theory of Fun 10 Years Later" (GDC Online 2012), which moves toward a "game grammar": games as nested loops of learnable systems.

**Why it matters:** it gives you a test for "why did I stop playing?": *what was I still learning at minute 10, 30, 60?* It also explains why small games can be excellent. They only need enough pattern for the time players spend with them.

**Honest value:** high. It's a short, illustrated, quick read. The trap is treating "learning" as "more content". New patterns can come from interactions between existing systems, which costs far less than new systems.

**Example:** Spelunky. You're still learning at hour 50 because a small set of rules (enemies, traps, shopkeeper, items) keeps producing new combinations.

**Apply to spelunking:** once a player has learned "soft rock = one long flick, hard rock = stop and decide," what's the next pattern? Depth tiers must bring *new decisions* (e.g., rock that's cheap to mine but loud, or veins guarded by bug nests), not just bigger numbers on the same decision.

### 2.5 Interesting decisions (Sid Meier)

**What:** "A game is a series of interesting decisions" (Meier, GDC 1989; expanded in his GDC 2012 lecture *Interesting Decisions*). A decision is **not** interesting if players always choose the same option or choose at random. The interesting ones involve **trade-offs**, are **situational** (the best answer changes with the game state), let players **express a style**, and have **persistent** consequences, with enough information to decide well. Main categories: risk vs. reward, short-term vs. long-term, and customisation/expression. His process advice: be ruthless and cut. "Probably a third of the things that we try, if not more, end up getting taken out."

**Why it matters:** it's the most practical test in this guide. You can apply it to a single mechanic in 30 seconds.

**Honest value:** very high, zero overhead. Note that dexterity-driven moments aren't "decisions" in Meier's sense and don't need to be. The test is for the choice layer.

**Example:** *Slay the Spire* card rewards. Pick one of three or skip. The right answer depends on your deck, relics and upcoming fights (GMTK: *How Synergies Make Slay the Spire Fun*).

**Apply to spelunking:** "push through hard rock, or recall?" only counts as a decision if the answer *varies* with pack glow, bug density and whether a vein is visible behind the rock. Add a "why I recalled" field to the dive log. If one answer dominates, the decision is fake and needs retuning. The same test applies to recall timing in general: if "recall when pack is full" is always right, the pack limit is the only thing deciding.

### 2.6 Loops, arcs and "the core mechanic"

**What:** Daniel Cook's *The Chemistry of Game Design* (2007) models play as **skill atoms**: action → simulation → feedback → the player's updated mental model. They chain into skill trees, which show where players learn and where they get stuck. *Loops and Arcs* (2012) adds a distinction. **Loops** repeat and build mastery. **Arcs** play once, like a story or a scripted reveal, and are consumed. The "core loop" in pitch decks (dig → loot → install → produce) is a loop of loops. The inner loop (the moment-to-moment verb) matters most, and each outer loop exists to give the inner one new contexts.

**Why it matters:** arcs are expensive (authored, used once) and loops are cheap (built once, played thousands of times). A solo monthly cadence can afford only loops plus a few tiny arcs, like the first-base reveal.

**Honest value:** high for vocabulary. Skill-atom diagrams are useful *once*, drawn on paper after a playtest where someone got lost. Don't maintain them.

**Apply to spelunking:** the concept has four nested loops (swipe, dive, base, raid) and several arcs (first base discovered, first raid, the big move). For month one, make the swipe and dive loops excellent and treat everything outer as optional. The concept's own "why go home" section is really a spec for the joint between the dive loop and the base loop. That joint is where the game lives or dies.

### 2.7 Feedback loops

**What:** positive feedback amplifies (winning makes winning easier: snowballs, runaways, compounding idle games). Negative feedback dampens (winning makes the next win harder: rubber-banding, diminishing returns). GMTK: *How Games Use Feedback Loops* (2018) uses Pyre as a worked example of deliberately mixing the two.

**Why it matters:** these loops shape the whole curve of a session and of a save file. Most balance bugs are an unintended positive loop.

**Honest value:** high, and cheap to reason about on paper. Before tuning numbers, draw every arrow as "more X → more Y" and mark each loop + or −.

**Apply to spelunking:** glow → bugs → theft of bulk ore is a **negative** loop on dive length. It's good, and it replaces a hard inventory cap. Production → better gear → deeper dives → better loot is a **positive** loop that you *want* in an idle-flavoured game. Heat → visibility → raids is the negative brake on it. Check that no single arrow in the chain is missing in the month-one build; otherwise the positive loop runs unchecked.

### 2.8 Two types of random

**What:** GMTK's *The Two Types of Random in Game Design* (2020). **Input randomness** is random state the player sees *before* acting: a dealt hand, a generated map. It creates problems to solve. **Output randomness** is a roll *after* the player commits: crit chance, a miss. It creates drama but can feel unfair. Strategy-heavy games lean on input randomness.

**Why it matters:** your game is procedural. You get to choose where the dice sit.

**Honest value:** very high for any procedural or roguelite game, and a one-evening lesson.

**Example:** *Into the Breach* shows every enemy intent before you move, which is almost pure input randomness. That's why losing there feels like your own fault.

**Apply to spelunking:** terrain is input randomness (good). Loot rolls are output randomness, and the concept already softens them with *visible but unreachable* glow through rock, which turns a roll into information. Push further: let the vein's colour or brightness hint at its tier, so the "is it worth it?" decision happens with the dice on the table.

### 2.9 Systemic vs. authored design

**What:** **Authored** design hand-places content and scripts outcomes (Uncharted set pieces, handcrafted puzzles). **Systemic** design defines objects with properties and **universal rules**, then lets situations emerge. GMTK's *The Rise of the Systemic Game* (2018) argues rules must apply universally to their class of objects: if fire burns grass, it burns *all* grass. Nintendo called the BotW version **"multiplicative gameplay"**: player actions, objects and terrain all react to each other through simple rules, so solutions multiply without being authored. Their 2D prototype had no puzzles at all, just a river, some trees, and rules. Harvey Smith and Randy Smith (Ion Storm, *Deus Ex* / *Thief*) cover the practical techniques in "Practical Techniques for Implementing Emergent Gameplay" (GDC 2004).

**Why it matters for you:** authored content scales linearly with your hours. Systemic content scales with the number of *interactions*. A solo dev shipping monthly can't afford much authored content. Spelunky shows the hybrid: hand-authored room chunks assembled by rules (GMTK: *How (and Why) Spelunky Makes its Own Levels*).

**Honest value:** high, but with two traps. (1) Emergence isn't free: every new universal rule multiplies the *testing* space as well as the fun space. (2) "It's systemic" becomes an excuse not to design the first five minutes. Players still need an authored-feeling on-ramp; that's the job of 03.

**Apply to spelunking:** "anything that glows lights the way *and* attracts bugs" is a proper universal rule. Keep it universal: flares, ore veins, *and* hot base machines should all obey it, with no special cases. The base generator (archetype + difficulty + flaw + decay parameters) is the Spelunky hybrid, and it's the right call. Just don't build it before b4 shows the vault is fun with one hand-made vault.

### 2.10 Players optimise the fun out

**What:** Soren Johnson, "Water Finds a Crack" (Game Developer column, 2011): "Given the opportunity, players will optimize the fun out of a game." Examples include Civ's "infinite city sleaze" and Morrowind players running into walls to level up. Players undervalue their own time and will grind a tedious dominant strategy. Johnson's fix: make degenerate strategies genuinely suboptimal *through mechanics* (Civ IV's per-city maintenance), not through prohibitions. GMTK's *How Game Designers Protect Players From Themselves* (2017) catalogues the techniques and their controversies (rest XP, weapon degradation, etc.).

**Why it matters:** in casual games with no fail state, the dominant strategy *is* the game for most players. If it's boring, the game is boring.

**Honest value:** very high. Ask "what's the laziest profitable thing a player could do?" at every playtest.

**Apply to spelunking:** likely cracks are: (a) farming the loot-dense old city forever instead of going deeper (depletion is the right mechanical answer, so ship it in month one, not later); (b) diving with an empty pack on purpose to stay invisible; (c) building staircases just to dump glow. Watch the dive-log end reasons for any single strategy dominating.

### 2.11 Design by subtraction

**What:** GMTK's *Ico, and Design by Subtraction* (2015): Fumito Ueda's team removed every element that didn't serve the core experience, including HUD, combat depth and dialogue. Meier cuts a third of what he tries. Rosewater: "restrictions breed creativity" (*Twenty Years, Twenty Lessons*, GDC 2016).

**Why it matters:** each added system costs you balancing time with every existing system, which grows roughly with the square of the count. For a one-month game, subtraction is how you get polish.

**Honest value:** maximum. This is the direct antidote to overengineering.

**Apply to spelunking:** the concept's "Month One" list has roughly 30 features, including clans, raids, three paths with hybrids, a base generator, heat, cooling, and a settlement. Seen through this guide, the dig loop + glow/bugs + one base-pull (b1–b3) is already a complete small game. Everything else is a later month, or a later game. Test each system with "if I cut it, does the swipe loop still have a reason to exist?" Scope itself is guide 05's job.

### 2.12 Kishōtenketsu: the unit of content

**What:** Koichi Hayashida (director, *Super Mario 3D Land*, *Galaxy 2*), in a 2012 Gamasutra interview: "First, you have to learn how to use that gameplay mechanic, and then the stage will offer you a slightly more complicated scenario… then something crazy happens that makes you think about it in a way you weren't expecting. And then you get to demonstrate… mastery." That's **ki** (introduce), **shō** (develop), **ten** (twist) and **ketsu** (conclude), borrowed from four-panel manga via Miyamoto. GMTK's *Super Mario 3D World's 4 Step Level Design* (2015) shows that levels use one gimmick through all four beats and then retire it.

**Why it matters:** it's the cheapest way to get "surprise" out of existing mechanics, and it doubles as wordless onboarding.

**Honest value:** high for handmade levels. For procedural games, apply it to *sequences* (tier introductions, first encounters) rather than levels. Level structure in depth is guide 03's topic.

**Apply to spelunking:** the derelict fragments are already ki/shō for raiding (one broken defense, one lesson). Apply the same beat to each depth tier: hard rock alone → hard rock hiding a vein → hard rock where mining is loud and bugs converge (ten) → the player chooses to blast or bypass (ketsu).

---

## 3. Anti-patterns and overengineering traps

**Framework-as-process.** MDA, Schell's 113 lenses, Bartle types and the eight kinds of fun are *review tools*. If you catch yourself filling in a lens worksheet before a build exists, stop. Rule of thumb: pick **three to five lenses** that fit this game (Schell's *Essential Experience*, *the Toy*, *Elegance*, *Surprise*, *Reward* are good defaults) and use them only after a playtest.

**Concept docs outgrowing builds.** A design written but not played is a list of hypotheses, not a design. The spelunking concept is ~850 lines and b1 has zero builds. That isn't a failure, since the bundle plan exists precisely to correct it. But it's the classic indie failure pattern. Freeze the concept doc until b1 has a verdict, and write only into the bundle READMEs.

**Engines for emergence before the verb is fun.** Systemic design tempts programmers toward entity-component frameworks, rule engines, data-driven everything. Emergence comes from *few* rules interacting, not from infrastructure that could host many. Hard-code the first three rules; extract structure the third time you repeat yourself. (The concept's own "extract the platform, don't pre-build it" rule applies to design code too.)

**Emergence as an excuse.** "Players will find their own fun" is how systemic games ship with a boring first ten minutes. Emergent sandboxes still need an authored hook and a first goal.

**Fake decisions.** Options that are strictly better, strictly worse, or indistinguishable. Three paths where one is obviously best is worse than one path. Meier's test catches these. Playtests measure them.

**Theme-first design.** Picking the fantasy (moon colony, raids, clans) and then inventing mechanics to justify each part. The setting-explains-mechanics idea in the concept doc is good *after* the fact, as a coat of paint on mechanics that already work. It's a trap if it generates features.

**Genre stacking.** "Core Keeper + King of Thieves + Mindustry" is three games' worth of balancing. GMTK's *How To Think Like A Game Designer* (originally *How To Steal Like a Game Designer*, 2023) shows how stolen mechanics break when their supporting context doesn't come with them, e.g. a save system that only works because of the game's tension model. Steal one mechanic *with* its context, or don't steal it.

**Spreadsheet balance before play.** Tuning curves on paper for systems nobody has played. Put the numbers in the Tweakpane panel instead, and tune them by feel and by dive log.

**Taking every GMTK lesson as a rule.** Brown's own tenth lesson: "Question everything, including this advice." His second: there are no wrong mechanics, only mechanics wrong for the intended experience (lives, score, permadeath are fine *in context*).

**Study as procrastination.** Watching design videos feels productive. Cap it: one video per session, *after* the day's build, and only when it answers a question the build raised.

---

## 4. Annotated sources, ranked by value per hour

★ = watch/read first. Lengths are measured runtimes where given.

### Tier 1: highest value per hour

1. ★ **Nintendo – Putting Play First** — Mark Brown (GMTK), 2016. Video, 12 min. <https://www.youtube.com/watch?v=2u6HTG8LuXQ>
   The verb-first method in 12 minutes. Directly justifies the b1-first bundle order.
2. ★ **The Two Types of Random in Game Design** — Mark Brown (GMTK), 2020. Video, 19 min. <https://www.youtube.com/watch?v=dwI5b-wRLic>
   The single most applicable idea for a procedural loot game.
3. ★ **Sid Meier's Interesting Decisions** — Sid Meier, GDC 2012. Talk, 61 min. Video: <https://www.youtube.com/watch?v=WggIdtrqgKg> · Vault: <https://gdcvault.com/play/1015756/Interesting> · Written recap (5 min): <https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions>
   Read the recap if short on time. The talk adds examples from Civ and Pirates!.
4. ★ **Water Finds a Crack** — Soren Johnson, Game Developer column, 2011. Article, ~10 min. <https://www.designer-notes.com/game-developer-column-17-water-finds-a-crack/>
   Why dominant strategies kill fun, and how to fix them mechanically, not with prohibitions.
5. **The Secret of Mario's Jump (and other Versatile Verbs)** — GMTK, 2017. 13 min. <https://www.youtube.com/watch?v=7daTGyVZ60I>
   Verb design for low-input games.
6. **Downwell's Dual Purpose Design** — GMTK, 2016. 6 min. <https://www.youtube.com/watch?v=i5C1Uj7jJCg>
   Miyamoto's "solve several problems at once", in a 6-minute case study of a small indie game.
7. **Theme and Mechanics in Far Cry 2 and Far Cry 4** — GMTK, 2015. 5 min. <https://www.youtube.com/watch?v=Xm5myQWcJxc>
   MDA's core claim in five minutes, without the jargon.
8. **Super Mario 3D World's 4 Step Level Design** — GMTK, 2015. 5 min. <https://www.youtube.com/watch?v=dBmIkEvEBtA> · Source interview: <https://www.gamedeveloper.com/design/the-secret-to-i-mario-i-level-design>
   Kishōtenketsu.
9. **10 Game Design Lessons from 10 Years of GMTK** — Mark Brown, 2024. Article/video. <https://gmtk.substack.com/p/10-game-design-lessons-from-10-years>
   Brown's own index to his back catalogue. Use it as a map of which older videos to watch.

### Tier 2: strong, a bit longer or narrower

10. **A Theory of Fun for Game Design** — Raph Koster, 2004 / rev. 2013. Book, ~3–4 h (short, illustrated). <https://theoryoffun.com/> · 10-years-later talk (GDC Online 2012): <https://gdcvault.com/play/1016632/A-Theory-of-Fun-10> · slides: <https://www.raphkoster.com/games/presentations/a-theory-of-fun-10-years-later/>
    The "fun = learning" lens. The talk covers the revisions; the book is the more pleasant read.
11. **MDA: A Formal Approach to Game Design and Game Research** — Hunicke, LeBlanc, Zubek, 2004. Paper, 5 pages, ~20 min. <https://users.cs.northwestern.edu/~hunicke/MDA.pdf>
    Read it once so you know the vocabulary when others use it. Don't adopt it as a process.
12. **The Rise of the Systemic Game** — GMTK, 2018. 13 min. <https://www.youtube.com/watch?v=SnpAAX9CkIc>
    Universal rules and emergence, with examples from BotW and Watch Dogs 2.
13. **Breaking Conventions with The Legend of Zelda: Breath of the Wild** — Fujibayashi, Takizawa, Dohta, GDC 2017. Talk, 88 min. <https://www.youtube.com/watch?v=QyMsF31NdNc> · Written summary: <https://www.gamedeveloper.com/design/5-design-lessons-learned-from-i-the-legend-of-zelda-breath-of-the-wild-i->
    "Multiplicative gameplay" and the 2D prototype. Skim the summary; watch the prototype section.
14. **How Games Use Feedback Loops** — GMTK, 2018. 13 min. <https://www.youtube.com/watch?v=H4kbJObhcHw>
    Draw your + and − loops after watching it.
15. **The Games That Designed Themselves** — GMTK, 2020. 12 min. <https://www.youtube.com/watch?v=kMDe7_YwVKI>
    Gunpoint, Necrodancer, Ape Out and Into the Breach were found by building, not by planning. A good antidote to concept-doc-first work. (Overlaps with guide 05.)
16. **How Game Designers Solved These 11 Problems** — GMTK, 2022. 16 min. <https://www.youtube.com/watch?v=rJZyPdYIbZI>
    A problem-solving toolkit: find the lever, flip it, solve it elsewhere. The most useful video when you're stuck.
17. **How Game Designers Protect Players From Themselves** — GMTK, 2017. 12 min. <https://www.youtube.com/watch?v=7L8vAGGitr8>
    The practical companion to "Water Finds a Crack".
18. **Twenty Years, Twenty Lessons** — Mark Rosewater, GDC 2016. Talk, ~60 min. <https://gdcvault.com/play/1023186/Twenty-Years-Twenty> · Written version: <https://magic.wizards.com/en/news/making-magic/twenty-years-twenty-lessons-part-1-2016-05-30>
    Passed a million views for a reason: short, blunt lessons ("fighting human nature is a losing battle").
19. **The Chemistry of Game Design** (2007) and **Loops and Arcs** (2012) — Daniel Cook, Lostgarden. Articles, ~30 min each. <https://lostgarden.com/2007/07/19/the-chemistry-of-game-design/> · <https://lostgarden.com/2012/04/30/loops-and-arcs/>
    Skill atoms and loop/arc vocabulary. Read *Loops and Arcs* first.

### Tier 3: situational or reference

20. **How (and Why) Spelunky Makes its Own Levels** — GMTK, 2016. 7 min. <https://www.youtube.com/watch?v=Uqk5Zf0tw3o> — the authored/procedural hybrid. Directly relevant to the base generator.
21. **How Synergies Make Slay the Spire Fun** — GMTK, 2019. 10 min. <https://www.youtube.com/watch?v=terD4Bk3L_8> (originally titled "Why Synergies are the Secret to Slay the Spire's Fun") — relevant to relics and hybrids.
22. **Balatro's 'Cursed' Design Problem** — GMTK, 2024. 14 min. <https://www.youtube.com/watch?v=zk3S3o1qOHo> — how much information to show before a decision. Pairs with *Two Types of Random*.
23. **Ico, and Design by Subtraction** — GMTK, 2015. 7 min. <https://www.youtube.com/watch?v=AmSBIyT0ih0>
24. **How To Think Like A Game Designer** (orig. *How To Steal Like a Game Designer*) — GMTK, 2023. 13 min. <https://www.youtube.com/watch?v=iIOIT3dCy5w> — uses MDA to check whether a borrowed mechanic fits your game.
25. **How to find amazing game ideas** — GMTK, 2025. 27 min. <https://www.youtube.com/watch?v=0m60QbT85Tc> — part 1 of his Game Dev 101 series ("simple + unexpected"). Part 2, *What's the Point of Prototyping?* (17 min, <https://www.youtube.com/watch?v=8tHJgtbj6rs>), belongs to guide 05.
26. **How to Keep Players Engaged (Without Being Evil)** — GMTK, 2018. 11 min. <https://www.youtube.com/watch?v=hbzGO_Qonu0> — pacing, anticipation, goals. Overlaps with guide 04.
27. **What Makes a Good Puzzle?** — GMTK, 2018. 18 min. <https://www.youtube.com/watch?v=zsjC6fa_YBg> — relevant to the one-screen vault (b4) only.
28. **Boss Keys** (playlist) — GMTK, 2016–. Multi-episode series. <https://www.youtube.com/playlist?list=PLc38fcMFcV_ul4D6OChdWhsNsYY3NA5B2> — Zelda dungeon and Metroidvania world graphs (lock/key structure). Deep but narrow. Worth one episode only if you build gated depth (the "rock you can't break yet" pull).
29. **Design Icons** — GMTK, 2019–. Game-history series, e.g. *What Pac-Man Brought to Game Design* (16 min, <https://www.youtube.com/watch?v=S4RHbnBkyh0>). Enjoyable, low direct value. Watch for pleasure, not for work.
30. **The 100 Games That Taught Me Game Design** — GMTK, 2024. 133 min. <https://www.youtube.com/watch?v=gWNXGfXOrro> — a curriculum of games to play, not a lesson. Use it as a lookup list when you need a reference game for a mechanic.
31. **The Art of Game Design: A Book of Lenses** (3rd ed.) — Jesse Schell. Book, ~20 h. <https://schellgames.com/art-of-game-design> — the most complete textbook, with 100+ lenses (there's also a free *Deck of Lenses* iPad app). Poor value per hour cover-to-cover for you. Use it as a reference and pick 3–5 lenses.
32. **Designing Games: A Guide to Engineering Experiences** — Tynan Sylvester (RimWorld), O'Reilly 2013. Book, ~8 h. <https://www.goodreads.com/book/show/16144499-designing-games> — the best book-length treatment of elegance and emergence by someone who then shipped a systemic hit solo-ish. Read it after this guide if you want one book.
33. **Formal Abstract Design Tools** — Doug Church, 1999. Article, 20 min. <https://www.gamedeveloper.com/design/formal-abstract-design-tools> — historical; MDA's ancestor ("intention" and "perceivable consequence" are still good words).
34. **Practical Techniques for Implementing Emergent Gameplay** — Harvey Smith & Randy Smith, GDC 2004. Slides (.ppt). <https://witchboy.net/wp-content/uploads/2009/03/randysmithandharveysmith_gdc_2004.ppt> — immersive-sim systemic design from the source. Dense, dated format.
35. **Designer Notes** podcast — Soren Johnson (with Adam Saltsman). Hours-long career interviews. <https://www.designer-notes.com/category/podcast/> · archive: <https://www.idlethumbs.net/designernotes/episodes> — excellent for background listening. Low value per *focused* hour, fine while walking.
36. **Iwata Asks: Splatoon — "It Started With Tofu"** — Nintendo. Interview, 10 min. <https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Splatoon/Splatoon/1-It-Started-With-Tofu/1-It-Started-With-Tofu-1021365.html> — the primary source for verb-first prototyping.

**Deliberately left out:** Extra Credits. It covers much of the same ground as GMTK, less rigorously and with fewer primary sources, so it adds nothing here. Game-feel and juice talks (see 02), onboarding and difficulty (03), motivation and audience research (04), and prototyping and scope (05).

---

### If you only have two hours

Watch 1, 2, 5, 6 and 7 (~55 min), read the Meier recap and "Water Finds a Crack" (~15 min), then go back to b1. For the rest of the time, fill in the "why I recalled" dive-log field (§2.5) and the feedback-loop sketch (§2.7).
