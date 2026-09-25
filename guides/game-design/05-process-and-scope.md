# 05 · Process and Scope: Finding the Fun, Finishing, Not Overengineering

Scope: how small games get prototyped, tested, cut and shipped by people who ship a lot of them. Sibling guides cover design foundations / MDA, game feel / juice, level design and difficulty, and player motivation / audiences. This one only links to those topics.

Researched September 2026. Every URL below was fetched or surfaced by search at that time. Quotes are short and verbatim from the fetched pages. Where a page was paywalled or blocked, the source list says so.

---

## 1. TL;DR: the principles that matter

1. **Only a playable build counts as progress.** Tools, docs, sims and research don't. Derek Yu: "A damn game can be played, and if you have not created something that can be played, it's not a damn game!"
2. **Build the toy first.** Get the core verb fun with no goals, menus or meta. The Experimental Gameplay Project had the basic toy running "in a few hours", and every idea got less than a week.
3. **More time does not mean more quality.** A prototype is hours to days, not weeks. Gabler et al. found "no correlation between time spent in development and how successful the game ultimately turned out".
4. **Grow tools out of games. Don't build them ahead of games.** Pull reusable code out *after* a game needed it (Petrie's "Write Games, Not Engines"). A tool with no game using it is a hobby.
5. **Prototypes are disposable by design.** Rami Ismail: "Your Prototypes should not be made to be high-quality, structured well, or reusable." Prototypes answer *should* we make this. A vertical slice answers *can* we make it. A one-month game barely needs the second.
6. **Kill fast, and kill cheap.** "Learn When to Shoot Your Baby in the Crib." Set a kill criterion before you build, and honour it.
7. **Watch, don't explain.** Hand over the build and shut up. Tanya Short: "don't explain, interrupt, or suggest." Trust behaviour over opinions.
8. **The web gives you free strangers. Use them.** Poki's playtest tool returns 10 real-player recordings per run, free, at any stage. Its Player Fit Test measures 500 players' playtime. That beats any analytics you could build.
9. **Freeze features early. The last 10% is the real work.** Plan the final third of the month for polish, onboarding, SDK integration and submission, with no new mechanics.
10. **Scale down, never sideways or up.** Cut features instead of moving the deadline. If you quit a project, make the next one smaller (Yu tips 13 and 14). Park new ideas in a "next game" list (Yu tip 12).
11. **Beware the two death loops:** restarting (remaking the first levels as your skill grows) and polishing (endless tweaks). Both feel like work, and neither ships.
12. **The cadence is the product.** Of 3,403 people who submitted at least one #1GAM game, 218 finished twelve. Shipping monthly is a practised skill, and wrap-up is the phase people practise least (Rami Ismail).

---

## 2. Principles in depth

### 2.1 Only a playable build counts

**What.** Derek Yu's *Finishing a Game* (2010), tip 2: "Actually start the damn game". A game is something that can be played. Pieter Levels framed his 12-startups-in-12-months run (2014) the same way: "By doing nothing, you figure out exactly nothing."

**Why.** Fun is an emergent property of a running loop plus a human. It can't be read off a design doc or a terrain render. Anything upstream of the loop is a guess about the loop.

**Example.** Vlambeer's *Luftrauser* was a jam game made in under 48 hours. The commercial *Luftrausers* then took roughly 2.5 years. Per Rami Ismail, the sequel "took weeks to get up to that same level of quality" as the jam original. The jam proved the fun cheaply. Production was the expensive part, and they only started it once the fun was proven.

**Apply to our workflow.** Be honest about the numbers. This repo has about 1,230 lines of TypeScript, and about 1,120 of them are tools or sim. There are three terrain tool versions (v1 generator, v2 CA Lab, v3 Terrain), zero playable bundles, and about 15,600 words of concept docs. b1 is still marked "scoping". None of this is wasted: the sim/render split and deterministic core are sound. But until now the effort has gone into tooling and specification, not play. The next commit that matters is `b1.1 first playable`. The v3 terrain is good enough for b1. By the concept doc's own rules, b1 only needs caves, soft/hard rock and ore to answer its question. **No v4 tool until b1 has been played by someone other than you.**

### 2.2 Build the toy first; the idea is not the game

**What.** From *How to Prototype a Game in Under 7 Days* (Gabler, Gray, Kucic, Shodhan, 2005), section "Build the Toy First": the toy is "the core mechanic of the game minus any goals or decisions." The Experimental Gameplay Project's rules were: under seven days, exactly one person, built around a theme. That produced 50 games in a semester, and *Tower of Goo*, which led to *World of Goo*.

**Why.** If the verb isn't fun in isolation, goals and progression just decorate a chore. Another section heading from the same article: "Heavy Theming Will Not Salvage Bad Design", and "If the gameplay is horrible, there is no recovery".

**Example.** The *Tower of Goo* prototype was just "build up". The implicit goal came from the toy itself.

**Apply.** b1 is already scoped as a toy test ("does move-until-something-changes feel good?"). It carries pack slots, teleport, zipline, build cost, torchlight with no gameplay effect, and three input schemes. Cut to the toy for b1.1: walk, stop rules and dig, keyboard only, on the v3 terrain. Add swipes in b1.2 once the keyboard version is fun. The dig verb is either fun in 2 days of tuning or it isn't, and a 5-slot pack won't change that.

### 2.3 Short cycles; more time ≠ more quality

**What.** Gabler et al., section "Enforce Short Development Cycles (More Time != More Quality)": any gameplay idea can be prototyped in under a week, and extra time yields diminishing returns. Jonas Tyroller (Thronefall, 2 devs, about 2 years, roughly 1M copies) described prototypes and mini-games taking "not ... more than 1-2 days" each. His rule of thumb was about two months of prototyping for a two-year game (Pragmatic Engineer interview).

**Why.** Prototype time is search time. Many short samples beat one long one. Tyroller's 2024 video *This Problem Changes Your Perspective On Game Dev* opens with "Design Is a Search Algorithm" and a "Speed vs. Accuracy" trade-off. In short: you're searching a huge space of possible games, and fast, rough evaluations cover more of it.

**Apply.** Scale Tyroller's ratio (about 8% of the project) to a month and you get **2–3 days of prototyping**. The bundle plan (b1–b4 in 14 days, 3 days each) already fits this. Treat the 3-day box as sacred: "running over means cutting features, not extending."

### 2.4 Grow tools out of games

**What.** Josh Petrie, *Write Games, Not Engines* (2007): at the start of each new project, pull the functionality you can reuse out into a common library. This means "growing an engine (rather than manufacturing it from whole cloth)". Derek Yu, tip 3, on rolling your own tech: "do you really have to?" Gabler et al. have a section titled "Nobody Cares About Your Great Engineering" and note "a great engineer does not necessarily make a great prototyper".

**Why.** A tool built before the game optimises for problems you imagine you'll have. The game then reveals different problems. Tools are also the most comfortable procrastination there is for a programmer: every hour produces visible, testable, satisfying progress while the scary question (is it fun?) waits.

**Apply.** The terrain-tool history is the textbook case. It was defensible once (the terrain *is* the level design in a digging game). A second version is borderline. A third, before any player has dug a tile, is the trap. The repo rule "tools only add, never change shared behaviour" is good hygiene for a bundle series. But make the rule of thumb explicit: **a tool gets a new version only when a playtest note asks for something it can't do.** For the monthly games, the shared library (`src/sim`, save core, publisher adapter) grows by extraction from game N when game N+1 needs it, not before.

### 2.5 Prototypes are disposable

**What.** Rami Ismail (Levelling the Playing Field): prototypes check whether you *should* make the game, and the vertical slice checks whether you *can*. Prototypes should be "fast, cheap, and precise". Use primitive shapes, old assets, borrowed content. Gabler: "If You Can Get Away With it, Fake it."

**The terms, precisely:**
- **Fun test / prototype.** Answers one design question. Throwaway code. Coloured squares. Hours to days.
- **Grey-box.** A level-design term: the layout built from untextured blocks so you can test space and flow before art. In a procedural game, grey-box is the generator's output with no art.
- **Vertical slice.** One of everything at ship quality. It proves production capability and pipeline cost, usually for a publisher pitch. For a one-month web game, the shipped game *is* the vertical slice. Don't build one separately.

**Apply.** The bundle rule "built on the real stack, so the sim code carries over" is a mild contradiction of this principle. It's fine as long as the bundle code is allowed to be ugly. Don't gold-plate bundle code for reuse. `src/sim/` is where durable code lives, and bundles can hack around it.

### 2.6 Kill fast; kill cheap

**What.** Gabler: "Cut Your Losses and 'Learn When to Shoot Your Baby in the Crib'". Recognise dead ends quickly, because a fresh start beats salvaging existing code. Yu, tip 14: "If there's no salvaging it, at least make sure that you scale down your next project."

**Why.** Sunk cost grows with polish. Killing at day 2 costs 2 days. Killing at week 3 costs the month *and* your nerve.

**Apply.** b1 has the best kill criterion in the repo: "still boring after tuning the stop rules → rethink movement." Add a clock to it: *2 days of tuning*. Write each bundle's verdict before starting the next. When something is killed, archive it with a one-paragraph "why", like the dated recipes in `archive/`. A killed toy is often the seed of next month's game.

### 2.7 Playtesting as a solo dev

**What.** Tanya X. Short (Kitfox), *The Imposter's Guide to Taking Feedback* (2016). Before the test, write down your assumptions and blind spots so you can try to disprove them. During the test: "don't explain, interrupt, or suggest". The only question you ask mid-play is "What are you trying to do right now?" Afterwards, sort what you heard into criticism (find the underlying problem), observations (compare against your assumptions) and suggestions (mostly scope creep, so extract the problem behind them).

**What to measure (cheap, no servers):**
- **Session length and time to first meaningful action.** Portals judge you on these. CrazyGames Basic Launch benchmarks: conversion (plays lasting 1+ minute) 80%+, average playtime 10+ minutes, D1 retention 10–15%, load under 10 s, build under 20 MB. Poki's Player Fit Test calls it healthy when average playtime is over 3 minutes and at least 25% of plays last over 3 minutes. Stronger games average 5+ minutes.
- **End-of-session reason.** The concept doc's dive-log idea (end reason plus duration, copyable string) is exactly right and needs no backend. Reading reasons like "swarmed" vs "found something" tells you whether the loop is a chore.
- **Unprompted restart.** It's the b1 pass criterion ("you instinctively start another dive"). Count it on video.

**Where to get players:**
1. Yourself, with a timer. Least reliable.
2. 2–3 people in the room, at least one on a cheap Android phone (already in the bundle rules).
3. **Poki Playtest.** Upload a build, get 10 recordings of real players with inputs and console logs. Free, repeatable, any stage, no partnership needed.
4. **Poki Player Fit Test.** 500 players' playtime, usually back within hours. You must have watched 10 recordings and uploaded a thumbnail first.
5. **CrazyGames Basic Launch.** Live with no SDK and no monetisation for at least 7 days or 500 plays, and QA watches the metrics.
6. A restricted itch.io page for friends. Optionally the GameAnalytics JS SDK (free account; progression and design events), if a platform allows external calls. Check each portal's rules first. `toolbox.md` notes some forbid external network calls.

**Apply.** For each bundle, write the assumptions list before the first playtest. It goes in the Assumptions section of the bundle's timeline entry (`spelunking/timeline/pN-slug/entry.md`).

### 2.8 Freeze early; the last 10% is 90%

**What.** Yu, tip 15: the last 10% is really 90%, and "you'll probably do a 'final lap' sprint many times before you get to the real final lap." Mark Brown (GMTK) spent over 3 years on *Mind Over Magnet*, which was never the plan. In *The Hardest Thing About Finishing a Game* (2024) he writes: "Very few games ship with all of the ideas, levels, mechanics, and story beats that the developer originally intended." He cut from 50 to 40 puzzles and dropped a character. On switching to polish only: "the game is just getting better". Earlier in the *Developing* series, a 30-day focused sprint (suggested by Oliver Granlund) moved him further than months of meandering.

**Apply.** Portal integration (Playgama Bridge, ads, storage, aspect ratios, load time) is part of the last 10% and is always underestimated. Do an SDK smoke test in week 1, even with a blank game, so week 4 isn't the first contact.

### 2.9 Death loops: restarting and polishing

**What.** Derek Yu, *Indie Game Dev: Death Loops*. In the **restart loop**, devs "would continuously remake their first few levels" as their skills improve. In the **polish loop**, there's always something you could improve a little. His way out: scope from finished references, save most polish for the end, and remember that "the core concept and basic execution are much more important" than polish for broad appeal.

**Apply.** Three terrain tool versions *is* a restart loop, one level below the game. Each version was better, and none was needed to answer b1's question. Name it and stop it. v3 is frozen for b1–b4.

### 2.10 Scope to what you've finished before

**What.** Yu, *Assessing Risk*: "The threshold for success goes up the more resources you invest in your game." Novelty without expertise tends toward gimmick, so put your personality in the details of a known form. Aim for small games that feel big and fiddly. Christer Kaitila (#1GAM founder) sized monthly games at "20 to 50 hours of work": one core mechanic, done well. Rami Ismail's short-term goals for new devs are to make a game, ship it without a loss, then keep shipping.

**Apply: the elephant.** The memory file says *one HTML5 game per month*. `spelunking_base.md → Scope → Month One` lists roughly 24 feature groups: base generator, async raids with replays, clans with invite links, ~20 relics with modifiers, three paths plus three hybrids, a heat economy, a surface settlement, a procedural art pipeline, and more. That's a year-plus game for a solo dev, not a month. Pick one of two plans explicitly:

- **(a) Spelunking Base is the flagship.** Monthly shipping pauses, or runs as small spin-offs. Accept a multi-month timeline and plan it as such.
- **(b) The monthly practice wins.** Month 1 ships the *smallest game inside Spelunking Base*: dig, loot and recall, with greed vs darkness. That's roughly b1 + b2 with a score, a best-depth record, and nothing else. Clans, raids and bases are future months or never.

Doing neither, with a monthly cadence on paper and a year of scope in the doc, is how you end up polishing concept docs for a year.

### 2.11 Jams and constraints are training

**What.** The Ludum Dare Compo is 48 hours, solo, from scratch, source shared. The Jam is 72 hours and allows teams and existing assets. The GMTK Game Jam 2026 ran 96 hours (July 22–26, theme "Count Down", 10,500+ entries). Kaitila: after half a dozen jams he could make something "simple but finished, rough but playable, in 48 hours". Gabler: "it became easier to be creative when there were restrictions in place." Yu, tip 8: use events as real deadlines.

**Apply.** A jam is the cheapest rehearsal of the whole month: idea, toy, loop, ship, all in 3–4 days. Enter one or two a year with the real stack (TS + Vite + Pixi). It also stress-tests how fast your shared library lets you start. If a new game takes more than an hour to get something on screen, *that* is the tool worth building.

### 2.12 The cadence compounds

**What.** #1GAM (2012–2018): 17,047 sign-ups, 3,403 submitted at least one game, 218 made 12 or more, and 11,565 games in total. Kaitila's rules: release early and often, keep a working build at all times, and finish one task to its minimal complete state before starting the next. On web portals, repeated shots matter. Artem Lanin's 2025 write-up describes five Poki games, 67M plays, and the third game catching a trend. The CrazyGames incremental-roguelite devlog came after three flops.

**Apply.** Treat each month's game as a lottery ticket plus a skill rep. The portfolio, and the shared library extracted from it, is the asset.

---

## 3. A monthly cadence (4 weeks, ~120–160 h full-time)

This synthesises Gabler (toy in hours, idea in under a week), Tyroller (about 8% of time on prototyping, 1–2 days per prototype), Kaitila (20–50 h core, MVP first, always-working builds), Brown (freeze and polish) and the portal test pipelines. Adjust the hours, not the shape.

**Week 0 (last 2 days of the previous month, overlapping).** Pick 3 candidate toys from the "next game" list. Each one gets a one-line question and a kill criterion. No docs longer than a page.

**Week 1: search.**
- Days 1–3: three toys, one per day. Coloured squares, keyboard only, dev panel for tunables. Ugly code is fine.
- Day 4: play all three cold. Pick one. Archive the others with a "why".
- Day 5: first **Poki Playtest** (10 recordings) of the toy with a trivial goal attached. Also do a Playgama Bridge / portal SDK smoke test on a blank build.
- *Gate:* someone who isn't you played it, and at least some recordings show a voluntary second attempt. If not, pick toy #2 or shrink the idea. You don't get a fourth toy.

**Week 2: the loop.**
- Goal, fail state, restart, score or progression hook, save. The minimal complete game (Kaitila's MVP), shippable if it had to be.
- Mid-week: second Poki Playtest.
- Day 10: **feature freeze.** Write the list of what's in. Everything else goes to the next-game list.
- *Gate:* **Poki Player Fit Test** at average playtime of 3 minutes or more. Below that, cut to the part that holds attention, or accept a small-ceiling game and ship anyway.

**Week 3: content and feel.**
- Levels, tuning and variety within the frozen feature set. Juice (see the game-feel guide). First-30-seconds onboarding without text walls. Load time under 10 s, any aspect ratio, a cheap Android phone.
- Re-run the fit test after the onboarding pass. The biggest wins usually come from the first minute.

**Week 4: finish.**
- Days 1–3: bugs, audio, thumbnail, title, store text, analytics events.
- Days 4–5: submit to portals (Playgama QA takes about 2–4 weeks, so it overlaps next month's search week). Put it on itch.io. Tag the release.
- Last day: a 1-page postmortem (what took longer than planned; what you'd cut earlier; which code to extract into the shared library).
- Buffer: 2 days. If you don't need them, they go to week 0 of the next month, not to more polish.

**Portfolio overlap.** Portal QA, Basic Launch windows and fit tests run for days. Month N's release can sit in QA while month N+1's toys get built. Treat live metrics from game N as input to picking game N+1.

---

## 4. Tripwires and anti-patterns

Hard rules. When one trips, stop and do the listed action, not "one more thing".

| Tripwire | Action |
|---|---|
| More than 20% of a cycle (about 1 week of 4) on tools, sim or infrastructure with no playable loop | Stop tooling. Build the ugliest playable thing on what exists. |
| A tool reaches **v3 before any external playtest** *(already tripped here)* | Freeze the tool. The next version must be requested by a playtest note. |
| Day 5 of a month and no build in a stranger's hands | Upload whatever runs to Poki Playtest today. |
| Design doc words exceed gameplay code lines for the current game | Close the doc. Code until the ratio flips. |
| The "Month One" feature list has more than 5 items for a one-month game | Cut to the verb, the goal, the fail state and one hook. |
| A toy isn't fun after 2 days of tuning | Kill it. Archive it with a why. Next toy. |
| A new mechanic appears after the week-2 freeze | Write it in the next-game list. Don't open the editor. |
| Refactoring shared code "for the next game" before the next game exists | Stop. Extract only when game N+1 needs it (Petrie). |
| Restarting the same project a second time | Ship a smaller subset of it instead (Yu, tip 14). |
| Fit-test playtime flat after 2 polish passes | Ship it. Polish is not the bottleneck (Yu's polish loop). |
| Networking, accounts, clans or async PvP in a one-month game | Out of scope by definition. Park it for the flagship decision. |
| Tuning sliders alone for more than 3 hours without a new playtest | Ship the preset to testers. Your own taste has saturated. |
| Reading design theory instead of building (including this library) | Cap reading at about 1 hour per week during a cycle. Read postmortems *after* shipping. |

**Anti-patterns, named:**
- **Tools-first.** "I'll be faster once the tool is done." You won't know which tool you need until the game tells you.
- **Specification-first.** A 10,000-word concept doc for an unplayed loop. Design docs are hypotheses. Keep them one page until a bundle passes.
- **Reusable prototypes.** Clean architecture in throwaway code slows the search and makes killing emotionally expensive.
- **Scaling sideways.** A failed or stalled project becomes a *different* big project. Scale down instead.
- **Explaining during playtests.** Every sentence you say is a tutorial you'll never ship.
- **Polishing a toy that doesn't hold attention.** "Heavy Theming Will Not Salvage Bad Design."
- **Moving the deadline.** The time box is the design tool. Cut features, never extend.

---

## 5. Sources, ranked by value per hour

★ = read or watch first. Times are approximate.

1. ★ **Derek Yu, "Finishing a Game"** (2010, ~10 min). Fifteen tips. Tips 2, 3, 5, 11–15 hit this project directly. https://makegames.tumblr.com/post/1136623767/finishing-a-game
2. ★ **Gabler, Gray, Kucic, Shodhan, "How to Prototype a Game in Under 7 Days"** (Gamasutra, 2005, ~25 min). Toy first, short cycles, kill early, "Nobody Cares About Your Great Engineering". https://www.gamedeveloper.com/game-platforms/how-to-prototype-a-game-in-under-7-days (full text mirror: https://www.cs.hmc.edu/~markk/SWE_copies/gabler_prototyping.html; GDC talk: https://www.gdcvault.com/play/1013294/How-to-Prototype-a-Game)
3. ★ **Poki for Developers: How testing works + Player fit test** (~15 min). The free stranger-playtest pipeline and benchmark numbers. The most actionable page here. https://developers.poki.com/guide/how-testing-works · https://developers.poki.com/guide/player-fit-test
4. ★ **Derek Yu, "Indie Game Dev: Death Loops"** (~15 min). The restart and polish loops, and how out. https://www.derekyu.com/makegames/deathloops.html
5. **Josh Petrie, "Write Games, Not Engines"** (2007, ~5 min). Grow the library by extraction. https://geometrian.com/projects/blog/write_games_not_engines.html
6. **Rami Ismail, "Prototypes & Vertical Slice"** (Levelling the Playing Field, ~10 min). Should vs can; disposable prototypes. https://ltpf.ramiismail.com/prototypes-and-vertical-slice/
7. **CrazyGames, "Basic Launch: The Metrics That Matter"** (~5 min). Conversion, playtime and D1 targets. https://docs.crazygames.com/resources/basic-launch-metrics/
8. **Christer Kaitila, "#1GAM: How to Succeed at Making One Game a Month"** (Envato Tuts+, 2013, ~15 min). 20–50 h scope, MVP, always-working builds. https://code.tutsplus.com/1gam-how-to-succeed-at-making-one-game-a-month--gamedev-3695a
9. **Tanya X. Short, "The Imposter's Guide to Taking Feedback"** (2016, ~10 min). Playtest protocol and how to sort feedback. https://www.gamedeveloper.com/design/the-imposter-s-guide-to-taking-feedback
10. **Mark Brown, "The Hardest Thing About Finishing a Game"** (GMTK Substack, 2024, ~10 min). Cutting scope late; polish vs content. https://gmtk.substack.com/p/the-hardest-thing-about-finishing
11. **Derek Yu, "Indie Game Dev: Assessing Risk"** (~15 min). Investment vs appeal; small-but-big-feeling. https://www.derekyu.com/makegames/risk.html
12. **Gergely Orosz, "Building a best-selling game with a tiny team – with Jonas Tyroller"** (Pragmatic Engineer, partly paywalled, ~15 min). 1–2 day prototypes, prototyping as about 8% of the timeline, spaghetti code is fine at indie scale. https://newsletter.pragmaticengineer.com/p/thronefall
13. **Jonas Tyroller, "This Problem Changes Your Perspective On Game Dev"** (2024, 25 min video). Design as search; speed vs accuracy. https://www.youtube.com/watch?v=o5K0uqhxgsE (chapter list: https://www.gamesinprogress.com/indie-game-developers/jonas-tyroller/this-problem-changes-your-perspective-on-game-dev). Channel: https://www.youtube.com/@JonasTyroller/videos
14. **Christer Kaitila, "Making 12 games in 12 months"** (2012, ~10 min). KISS; jams as training. https://www.gamedeveloper.com/game-platforms/making-12-games-in-12-months
15. **One Game A Month archive** (~3 min). The completion statistics. https://www.onegameamonth.com/
16. **Q&A: Why Vlambeer returned to its roots with Luftrausers** (~10 min). A jam prototype vs years of production. https://www.gamedeveloper.com/audio/q-a-why-vlambeer-returned-to-its-roots-with-i-luftrausers-i-
17. **Pieter Levels, "12 startups in 12 months"** (2014, ~5 min). Monthly shipping as a cure for launch fear. https://levels.io/12-startups-12-months/
18. **Ludum Dare rules** and **GMTK Game Jam 2026**. Jam formats for practice runs. https://ldjam.com/events/ludum-dare/rules · https://itch.io/jam/gmtk-jam-2026
19. **Artem Lanin, "From hobby to 67 Million Gameplays on Poki in 2025"** (Medium; the fetch was blocked, so the details come from the search snippet). A portfolio of 5 web games; trend timing. https://medium.com/@playrea/from-hobby-to-67-million-gameplays-on-poki-in-2025-df2c147cfb27
20. **GameAnalytics JavaScript SDK** (docs, as needed). Free hosted event analytics, written in TypeScript. https://docs.gameanalytics.com/integrations/sdk/javascript/event-tracking/ · https://github.com/GameAnalytics/GA-SDK-JAVASCRIPT
21. **Rami Ismail, "Ask Rami: Ship or S(hr)ink"** (partly paywalled). Wrap-up is the least-practised phase. https://ltpf.ramiismail.com/ask-rami-ship-or-s-hr-ink/
22. **GMTK "Developing" series, *Mind Over Magnet*** (several hours of video). A great story, but low value per hour for this dev. Watch the finishing episodes only, as a cautionary tale about a small game taking 3 years. https://www.youtube.com/playlist?list=PLc38fcMFcV_uH3OK4sTa4bf-UXGk2NW2n
23. **itch.io postmortems feed** (browse after shipping, not before). https://itch.io/devlogs/postmortems
