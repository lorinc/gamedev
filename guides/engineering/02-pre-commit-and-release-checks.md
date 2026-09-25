# 02 · Pre-commit and Release Checks: What Studios Verify, and What a Solo Web Dev Should Keep

Scope: what serious game teams check before a change lands and before a build ships, weighed for this project: one person, one small HTML5 game a month, plain JS + JSDoc + `tsc`, no build step, zero runtime dependencies, GitHub Pages where a push to `main` publishes. The existing rules live in `ENGINEERING.md`. This guide doesn't re-propose them. It says where they already match industry practice, and what's missing.

Researched September 2026. Every URL was fetched or surfaced by search at that time. Quotes are short and verbatim from the fetched pages. Where a page couldn't be fetched, the source list says so.

Labels used throughout:

| Label | Meaning |
|---|---|
| **must** | Do it now. Cheap, and the failure it prevents is real at this scale |
| **worth it** | Do it when you next touch the area. Cheap relative to what it catches |
| **later** | Real value, but only after a named trigger. Park it as a `.todo` stub |
| **skip** | Studio-scale practice. Overkill for one person and a one-month game |

---

## 1. TL;DR

1. **You already have the studio core.** A gate that blocks a broken change (Sea of Thieves: "Every time we check in a change to the build, it has to run against the current build and pass all the tests"), determinism tests (Factorio's presaved CRCs), and replayable bug reports (Riot's Chronobreak playbacks). Most indies have none of these.
2. **The biggest gap is the browser.** Every check today runs in Node. None loads `b1.html` in a browser. Studios run a *build verification test*: start the real build, check it doesn't fall over. A headless Chromium load that fails on any page error is the cheapest version, and it needs no dependency. **must**
3. **Make errors visible.** `window.onerror` + `unhandledrejection` that put the error on screen and into the bug report. About 10 lines. Testers can't report a frozen canvas. **must**
4. **Golden replays are nearly free for you.** You have deterministic replays. Save a few command logs with their final state hash and replay them in the pre-push hook. That's Factorio's integration-test pattern. **worth it**
5. **A seeded "monkey" run beats bots.** Feed the sim thousands of random commands in Node and assert invariants (no throw, no NaN, player inside the world). That's the solo version of King's playtest bots and Riot's 5,500-test BVS. **worth it**
6. **Ban engine-dependent maths in the sim.** MDN: "Many `Math` functions have a precision that's implementation-dependent." `Math.sin`, `cos`, `exp`, `pow` can differ between Chrome, Safari and Node. That breaks P2P agreement. The sim doesn't use them today. One regex in the boundary test keeps it that way. **worth it**
7. **"Done" includes the edges.** Pause on tab hide, resume audio, resize and rotate, first run with no storage, touch on a real phone. Portals test these; Poki and CrazyGames list them as requirements.
8. **Reviewers rubber-stamp when they only read.** Google's review guide: "It's hard to understand how some changes will impact a user when you're just reading the code." Review = diff + running build. Use a fresh-context AI reviewer for keeper-tier changes, and tell it to report only real gaps.
9. **Skip the studio machinery.** No build farm, no flaky-test quarantine, no ML commit-risk scoring, no memory budgets, no coverage targets. Your whole test suite runs in about 2 seconds. Keep it that way.

---

## 2. What already matches industry practice

Existing rule → the studio practice it mirrors. Nothing here needs changing.

| Existing rule | Studio equivalent | Source |
|---|---|---|
| R11 pre-push hook: `tsc`, tests, timeline | Sea of Thieves: tests run locally before review, then on the build server; "Failed tests block further commits until resolved" (article summary) | Game Developer, Rare part 4 |
| R4/R5 determinism test, seeded RNG, no clock in the sim | Factorio: "After every test … a crc check is made against the set of presaved crc values" | FFF-60 |
| Fixed 60 Hz tick, accumulator clamped at 100 ms (`main.js`) | Nystrom: "update the game using a fixed time step … But we'll allow flexibility in when we render" | Game Programming Patterns, Game Loop |
| `tools/replay.js` + `replay.test.js`: a bug report replays exactly | Riot: deterministic playbacks "to diagnose gameplay bugs"; input replays are the "best option for bug replication" | Riot, Game Developer |
| R8 ASCII-map example per rule change | Factorio: "Every test creates a small map, places couple of objects on the map, runs updates and then verifies" | FFF-60 |
| R6 frozen builds + SHA manifests, R13 every pushed build is frozen | Studios keep every build that went to QA reproducible; Sea of Thieves did "over 100 internal deployments" | Game Developer, Rare part 4 |
| `BUILD` id stamped into frozen copies and shown in the bug report | Standard release practice: every crash report names its build | — |
| `localStorage` wrapped in try/catch | Poki hard requirement: "Incognito support", storage in try/catch | Poki requirements |
| Audio created on first gesture (`juice.js` `unlock()`) | MDN autoplay rules; CrazyGames: call `resume()` "within user gestures" | MDN, CrazyGames |
| `user-select: none`, `touch-action: none`, context menu blocked | CrazyGames mobile requirement: `user-select: none` | CrazyGames technical |
| R3 zero runtime deps; "Not yet" stubs with triggers | Google review guide: solve "the problem they know needs to be solved *now*" | Google eng-practices |
| "A rule gets added when something goes wrong" + incident log | Factorio: "New bugs discovered by QA are covered by tests before fixes" (FFF-366 summary) | FFF-366 |

The last row is the most important one. Studios grow their checks from incidents, not from a list like this guide. Use this guide as a menu, and let incidents pick from it.

---

## 3. Pre-commit checks at studios

### 3.1 Build verification tests (BVT) and smoke tests

**What studios do.** Riot's Build Verification System runs "~5500 test cases in approximately 18 minutes for every new build", about 100,000 a day. "50 percent of all critical or blocker level bugs are discovered by the BVS." Bugs found by automation "get resolved eight times faster than the average bug" (Riot, *Automated Testing for League of Legends*). Sea of Thieves ran the build-server suite "roughly every twenty minutes", with slow multiplayer and performance tests overnight.

A smoke test is the small end of this: start the build and check it isn't "so broken that further testing makes no sense" (QF-Test glossary).

**Your gap.** All checks run in Node. A typo in an import path in `src/bundles/b1/`, a DOM id rename, or an exception in `render.js` passes every check and goes live on push. `tsc` catches some of this, not all (anything behind `any`, JSON, fetch paths, runtime errors).

**Solo version: a headless load.** `chromium --headless` can load `b1.html` from `python3 -m http.server` and dump the DOM after a virtual time budget. If the page writes errors into `document.title` (see §5.3), the hook greps for them. No npm package. About 20 lines of shell. The raw-CDP route (Node 22's built-in `WebSocket`) can also send one scripted swipe and take a screenshot, if the shell version proves too blunt.

| Practice | Label | Why |
|---|---|---|
| Headless Chromium load of each playable page, fail on any error | **must** | The only check that runs what the player runs; closes the Node-only blind spot |
| Scripted input + screenshot into `gallery/` | **worth it** | Same harness, one more step; you like seeing stages anyway |
| Multi-browser matrix (WebKit, Firefox) in automation | **later** | Trigger: a Safari-only bug ships. Until then, the phone check in §4 covers iOS |
| A build farm, nightly multi-config runs | **skip** | There's no build and one config |

### 3.2 Replay-based regression tests (golden replays)

**What studios do.** Factorio checks every integration test against presaved CRC values, so "if a bug is introduced that would break determinism … we will find out just by running the test suite" (FFF-60). Riot replays "2-3 thousand real-world games per day" from their beta servers and compares two runs to catch divergences (*Determinism in LoL: Fixing Divergences*). They chose per-frame JSON state logs over bare checksums, because a checksum makes it "easy to tell that a divergence has occurred, but difficult to drill down on the line of code."

**Solo version.** You already replay bug reports. Add a folder of *golden* command logs (a few real sessions, one per rule set), each with the final state hash. The test replays them and compares. When a rule change *should* change the outcome, re-bless the hash in the same commit, and the diff shows it.

Two traps:
- **Rules change weekly in the throwaway tier.** Golden replays pinned to b1's rules would be re-blessed every commit, and a check you always re-bless checks nothing. Pin them to the keeper tier (`src/sim/`) with a fixed ruleset file, or to a frozen build's ruleset.
- **Hash-only failures are hard to read.** Follow Riot: on mismatch, print the first tick where the per-tick state differs. Your replay tool already works tick by tick.

| Practice | Label | Why |
|---|---|---|
| 3–5 golden replays with final-state hashes in the pre-push hook | **worth it** | Nearly free given R4; catches sim regressions the ASCII tests don't cover |
| First-divergent-tick report on mismatch | **worth it** | Turns "hash differs" into a line of code |
| Harvesting every player session as a regression test (Riot-style) | **skip** | No servers, no telemetry, by design |

### 3.3 Determinism and desync checks

**What studios do.** Factorio's lockstep multiplayer needs every machine to simulate "every single tick of the game identically", and their integration tests "helped us to find" desyncs: "without the automated tests, the stable multiplayer release date would be delayed a lot" (FFF-62). Riot's hard divergences came from uninitialised memory; that bug class can't happen in JS. Glenn Fiedler warns that "Differences in floating point behavior between compilers, OS's and even instruction sets make it almost impossible to guarantee determinism" (*Deterministic Lockstep*).

**The JS version of that trap.** `+ - * /` are exact IEEE doubles in every engine. The transcendental functions aren't. MDN: "Many `Math` functions have a precision that's implementation-dependent … Even the same JavaScript engine on a different OS or architecture can give different results!" One developer traced a divergence to `Math.cos` rounding "one bit differently in Node's V8 and Chromium's" (sunset-driver issue #471). For P2P, a peer on iPhone Safari would drift from one on Chrome.

`src/sim/` uses none of them today (checked: no `Math.sin|cos|tan|atan|exp|log|pow|hypot|cbrt`). Keep it that way with one regex in `boundary.test.js`.

One more JS-specific trap: `Array.prototype.sort` with a comparator that isn't consistent (ties, `NaN`, random) gives an implementation-defined order, which can differ between engines. Sorts in the sim need a total order (tie-break on id).

| Practice | Label | Why |
|---|---|---|
| Ban engine-approximated `Math.*` in `src/sim/` (extend R1's test) | **worth it** | One regex; prevents a desync class that is invisible until P2P |
| Run the determinism test in a browser too, compare hash with Node | **later** | Trigger: P2P work starts. The headless harness from §3.1 makes it cheap |
| Per-tick state checksum exchanged between peers at runtime | **later** | Trigger: P2P. It's how lockstep games detect desync live |

### 3.4 Automated playthroughs and bots

**What studios do.** King's playtest bots play a Candy Crush level "thousands of times" before release to report difficulty; King credits them with cutting manual level adjustments by 95% (WN Hub summary). King is explicit that bots don't judge fun: designers still decide. Riot's BVS scripts spell casts on snapshotted game states and verifies outcomes.

**Solo version: a seeded monkey.** The sim runs in Node with no browser. A test that seeds an RNG, sends 10,000 random commands (swipes, stops, builds) over a few thousand ticks, and asserts invariants after every tick catches crashes and impossible states cheaply. Invariants: no throw, no `NaN`, the player is inside the world and not inside solid rock, inventory never negative, backpack never over capacity. When it fails, the seed *is* the bug report: replay it.

| Practice | Label | Why |
|---|---|---|
| Seeded random-command run with invariants, in the test suite | **worth it** | Minutes to write; finds the bugs no one thinks to write an example for |
| A bot that plays well enough to measure difficulty or dive length | **later** | Trigger: a game with levels or a balance question testers can't answer fast enough |
| ML-trained player-imitation bots | **skip** | Studio investment; Poki's free playtests give you real humans (guide 05) |

### 3.5 Performance and memory budgets

**What studios do.** Clinton Keith's example of a definition-of-done item is frame rate: if the game runs at 10 fps, teams "ensure it stays" fixed as part of done (via search summary; the blog was unreachable). Sea of Thieves runs performance and latency tests overnight. Factorio's rule, from its optimisation posts: never guess, measure on several maps (FFF-204 summary). For the web, a performance budget is "a set of limits imposed on metrics", including "the total size of a page" (web.dev).

**Solo version.** Your frame work is tiny today. The `perf-a41.js.todo` stub already names the trigger. What *is* cheap and useful now is a size number: the shipped bytes of `b1.html` and everything it loads. Portals care about size (Poki: loading under 10 seconds; CrazyGames: initial download ≤ 20 MB for the mobile homepage). You're far below that, so print the number at ship time, don't gate on it.

| Practice | Label | Why |
|---|---|---|
| Print total shipped bytes in `npm run ship` | **worth it** | One `du`; shows a regression the day an asset appears |
| Frame-time regression gate on a reference device (A41 stub) | **later** | Already stubbed with a trigger. Keep it |
| Memory budgets, heap snapshots per build | **skip** | Canvas2D, no assets, one small world. Revisit only on a crash report |

### 3.6 Asset validation

Studios validate textures, audio and meshes on import (size, format, naming, references). You have no asset pipeline: sounds are synthesised, graphics are drawn. Two web-specific checks are real, though, and both are portal requirements:
- **No external requests.** Poki: "bundle all fonts, assets, and libraries". A grep for `http://` / `https://` in shipped files (excluding comments and the privacy link) is a one-liner. **must at portal submission**, **worth it** in the hook since it's free.
- **Relative paths only.** CrazyGames: "Use only relative paths, never absolute paths." A leading `/` in a `fetch` or `src` works on your dev server and breaks inside a portal iframe. Same grep. **worth it**
- Anything more (image formats, audio loudness) **later**, when assets exist.

### 3.7 Code review checklists

**What the evidence says.** The SmartBear/Cisco study (2,500 reviews): review "fewer than 400 lines of code at a time", "Do not review for more than 60 minutes at a time", and "Checklists are the most effective way to eliminate frequently made errors and to combat the challenges of omission finding." Microsoft's study of review at scale (Bacchelli & Bird, ICSE 2013) found reviews find fewer defects than people expect; their main outcomes are understanding and knowledge transfer. Google's guide lists what to look at: design, functionality, complexity, tests, naming, comments, style, consistency, docs, every line. And on tests: make sure they're "correct, sensible, and useful" and will actually fail when the code breaks.

The solo reading: a checklist is for the things you *forget* (omissions), not the things you judge. Keep it short. §8 is the checklist.

| Practice | Label | Why |
|---|---|---|
| Short review checklist, applied to diffs over ~50 lines or any keeper-tier diff | **must** | Checklists beat memory for omissions (SmartBear) |
| Keep diffs under ~400 lines per review | **worth it** | Defect detection drops above that; also a good commit size |
| Formal inspections, sign-off roles, review metrics | **skip** | One person |

---

## 4. Definition of done for a game feature

Studios write a "definition of done" per team: the non-functional requirements every feature must meet before it counts (Clinton Keith, *Agile Game Development*). For a web game, most of it is about the edges of the browser.

| Item | Label | Why / how |
|---|---|---|
| **Feel check:** play it for 2 minutes with juice on and off; does the change feel right? | **must** | The feature *is* the feel. Tests can't see it. See `guides/game-design/02-game-feel.md` |
| **Every target input:** mouse, keyboard, and touch on a real phone (iOS Safari is the oldest target, R2) | **must** | Poki and CrazyGames both require desktop and mobile control schemes. The phone reveals touch-target size and thumb occlusion |
| **Tab hidden → game pauses.** `visibilitychange`, not only `blur` | **must** | MDN: browsers stop rAF in background tabs, and `visibilitychange` also fires when "the device screen is turned off". `input.js` handles `blur` only. The 100 ms accumulator clamp already prevents a catch-up burst on return; pausing makes it explicit and mutes sound |
| **Audio resumes after backgrounding on iOS** | **must** | CrazyGames: the AudioContext goes "interrupted" on iOS when backgrounded, and "Visibility change listening alone is insufficient": call `resume()` inside a touch or click handler. Check `unlock()` runs on *every* gesture, not only the first |
| **Resize and rotate mid-game** | **must** | Portals embed you in iframes of changing size; phones rotate. There's a `resize` handler; test that it keeps the player on screen |
| **Low frame rate** (DevTools CPU throttle ×4, or a Low Power Mode phone) | **worth it** | The fixed tick keeps speed right; check input and camera still feel OK at 30 fps |
| **Accessibility basics** that apply: no essential info by colour alone, no essential info by sound alone, readable text size, large well-spaced touch targets, a mute toggle, settings remembered, no flicker | **worth it** | These are the "Basic" tier of the Game Accessibility Guidelines: "easy to implement if thought about early enough". Ore vs rock by colour alone is the likely risk in this game |
| **Localisation-safe text:** player-facing strings in one place, no text baked into images, room for 30% longer words | **later** | Trigger: the first game with more than a handful of words. Guide 04 argues for textless play anyway |
| **Remap controls, difficulty options, subtitles** | **skip** for now | Intermediate-tier guidelines; revisit if players ask |

---

## 5. Release checklist for a web portal game

This is per *release* (a version going to testers or a portal), not per commit. Items marked "portal" matter at submission, not for a timeline build.

### 5.1 First run

- **Fresh profile.** Open the build in a private window (no storage, no cached files). It must reach play with no errors. Poki requires "Incognito support". **must**
- **Time to first input.** Poki: loading under 10 seconds; CrazyGames: gameplay within 20 seconds. Measure once on a phone on mobile data. **must at portal**, **worth it** otherwise
- **No login, no menus in the way.** Game Accessibility Guidelines (Basic): "Allow the game to be started without the need to navigate through multiple levels of menus." **must**

### 5.2 Save and load

- If the game has progress, it persists across reload *and* survives missing storage (plays, just doesn't save). Poki: "Implement save systems or inform players progress won't persist." **must** if there is progress
- Stored data carries a version, and old versions are migrated or discarded, never crash. You already do this for tunables (`b1-tunables` → `b1-tunables-changed`). **must**
- Cloud saves via portal SDK: **later**, at portal integration.

### 5.3 Errors you can see

A JS error in a canvas game usually shows as a frozen screen. Nobody reports a frozen screen usefully.

- `window.addEventListener('error', …)` and `window.addEventListener('unhandledrejection', …)` (MDN: fires when a Promise "that has no rejection handler is rejected"). The handler: stops the loop, draws the message and `BUILD` on the canvas, sets `document.title` to `ERROR: …` (the headless check greps for this), and adds the error to the bug report. The existing `fetch(rules…)` and `loadRuleset().then(...)` chain has no `.catch`, so a failed fetch today is silent. **must**
- Remote error reporting (Sentry and friends): **skip**. It's a server and a dependency, and privacy text you'd then need.

### 5.4 Version stamping

- `BUILD` is stamped on freeze and shown in the report. It's already there. Also show it somewhere a tester can screenshot (a corner of the pause screen). **worth it**

### 5.5 Privacy

- No analytics, no cookies, no external requests: nothing to disclose. CrazyGames only asks for Terms or a Privacy Policy for games "collecting personal data beyond SDK events". Bug reports are copied by the player, by hand: keep it that way. **must** (stay this way)
- Once a portal SDK is in, the portal's own policy covers its events. **later**

### 5.6 Portal hygiene (portal submission only)

| Item | Source | Label |
|---|---|---|
| Remove dev tools and debug UI (the tuning panel, `?rules=lab`) | Poki: "Remove all development tools, debug code, and testing artifacts" | **must at portal** |
| Page never scrolls the parent; arrow keys and space don't scroll | Poki: prevent viewport scrolling | **must at portal** |
| Pause key (Esc or Space), and a pause when an ad plays, with audio muted | Poki: "Automatically mute game audio during advertisement playback" | **must at portal** |
| Portal SDK events wired (`gameplayStart` on first input, `gameplayStop` on pause) and checked in Poki Inspector | Poki requirements, Poki Inspector | **must at portal** |
| Total size, file count, relative paths | CrazyGames: ≤ 250 MB, ≤ 1,500 files, relative paths only | **must at portal** (you're far below) |
| Chromebook with 4 GB RAM runs smoothly | CrazyGames | **worth it**: throttle test covers most of it |

---

## 6. Reviews that aren't rubber stamps

### 6.1 Why reviews go soft

- **Reading isn't running.** Google's guide: "It's hard to understand how some changes will impact a user when you're just reading the code." For UI changes they ask for a demo. For a game, *every* change to the throwaway tier is a UI change.
- **Big diffs get skimmed.** SmartBear: above ~400 lines, or faster than ~500 lines an hour, detection falls off. Their data point: when reviewers go faster than 450 lines/hour, defect density found is below average "in 87% of the cases" (search summary of the Cisco study).
- **The author can't see their own gaps.** Anthropic's Claude Code guide: "A fresh context improves code review since Claude won't be biased toward code it just wrote." The same applies to a person reviewing their own diff straight after writing it.
- **Asking for problems produces problems.** The same guide: "A reviewer prompted to find gaps will usually report some, even when the work is sound … Chasing every finding leads to over-engineering." Tell the reviewer to "flag only gaps that affect correctness or the stated requirements."

### 6.2 What studios do instead

- **Evidence with the review.** Sea of Thieves: developers "Demonstrate passing tests during peer review" (article summary). Claude Code guide: "Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot of the result."
- **Tests of behaviour, not code.** Jessica Baker (Rare): "Test behaviour, not implementation." Your ASCII-map tests already do this.
- **Tests that can fail.** Google: check tests will actually fail when the code breaks. The quick way: break the code on purpose once and watch the test go red.
- **Checklists for omissions, judgment for design.** SmartBear for the first; Google's "Is this change improving the code health of the system?" for the second.

### 6.3 Solo version

| Practice | Label | Why |
|---|---|---|
| Review = diff + running the build + the test output. Never the diff alone | **must** | "Test what the player sees"; the diff can't show feel or layout |
| A screenshot or short clip of the change in the commit's PR/notes or the timeline entry | **worth it** | Evidence you can look at later; you already dump stages to `gallery/` |
| Fresh-context AI reviewer (subagent / `/code-review`) for every keeper-tier change and every release | **worth it** | Independent of the author's reasoning; prompt it with this guide's §8 and "report only correctness and requirement gaps" |
| Fresh-context AI reviewer on every throwaway commit | **skip** | Throwaway code "is allowed to be bad"; review cost exceeds the code's life |
| Sleep on it: re-read your own keeper-tier diff the next day before pushing | **worth it** | The cheapest fresh context there is |
| Mandatory second human reviewer | **skip** | There isn't one. Playtesters review the game, not the code (guide 05) |

---

## 7. What not to do at solo scale

Each of these is real, good practice at a studio. Each costs more than it saves here.

| Studio practice | Why it exists there | Why skip it here |
|---|---|---|
| Build farm, nightly multi-platform builds | Hours-long builds, many platforms | No build step; one static page |
| Flaky-test quarantine ("demonstrate stability for at least one week before being promoted", Riot) | Thousands of tests, timing-dependent game clients | Your tests are deterministic and run in 2 s. A flaky test here is a bug: fix it the same day |
| ML commit-risk prediction (Ubisoft's Commit Assistant / CLEVER) | Ten years of commit history across huge teams | No history to learn from, and no team |
| Coverage targets | Keeps large teams honest | Coverage stub exists with a trigger; a number invites testing throwaway code |
| Memory budgets per system | Consoles with fixed RAM | Canvas2D and a small world |
| Hundreds of thousands of tests (Sea of Thieves) | A live service played by millions for years | A one-month game. Test the keeper tier and the rules; play the rest |
| Remote crash reporting, telemetry dashboards | Live ops | Needs servers and privacy text. On-screen errors + copyable reports do the job |
| Mandatory CI on GitHub Actions | Many committers | Stubbed with triggers already (`checks-and-pages.yml.todo`) |
| A release-manager sign-off, change advisory boards | Coordination between teams | You are the team. The checklist is the sign-off |

**The rule of thumb.** Riot runs 5,500 tests per build because a broken build costs hundreds of people an afternoon. A broken build here costs one person five minutes, and `git revert` fixes the live site. Add a check when the *same* thing breaks twice, or when a break would reach players you can't reach back (portal builds). That's `ENGINEERING.md`'s incident rule, and it's the right one.

---

## 8. Checks for a pre-commit review

Yes/no questions a reviewer (you the next morning, or a fresh-context AI agent) answers from the diff plus the running game. "Auto" says whether it's cheap to automate, and where.

### Always

| # | Question | Auto |
|---|---|---|
| 1 | Did `tsc`, the tests and the timeline check pass (pre-push green)? | **Yes, exists** (R11) |
| 2 | Does the page load in headless Chromium with no errors? | **Yes, cheap**: headless load + title grep (§3.1) |
| 3 | Did I play the changed build for at least 2 minutes, on desktop? | No |
| 4 | Is the diff under ~400 lines, or split so each part is? | Yes: `git diff --stat` warning |
| 5 | Does the commit do one thing, and does its message say why? | No |
| 6 | Did anything outside the task's scope change? | Partly: list touched top-level folders |

### When `src/sim/` (keeper tier) changed

| # | Question | Auto |
|---|---|---|
| 7 | Does every rule change have an ASCII-map test (R8)? | No (judgment) |
| 8 | Would the new test fail if the change were reverted? | Partly: revert, run, expect red |
| 9 | Do the golden replays still match, or was the hash re-blessed *on purpose* with a reason in the commit? | **Yes, cheap** (§3.2) |
| 10 | Does the seeded monkey run pass its invariants? | **Yes, cheap** (§3.4) |
| 11 | No `Math.random`, `Date`, timers, or `Math.sin/cos/tan/atan/exp/log/pow/hypot/cbrt` in the sim? | **Yes, cheap**: extend `determinism.test.js` / `boundary.test.js` |
| 12 | Do sorts in the sim have a total order (ties broken by id)? | No |
| 13 | Is this the second game needing the code (rule of two, R7)? | No |
| 14 | Is anything more generic than today's need? | No (Google: "especially vigilant about over-engineering") |

### When the game (`src/bundles/`, `*.html`) changed

| # | Question | Auto |
|---|---|---|
| 15 | Does it feel right, with juice on and off? | No |
| 16 | Does it work with touch on a real phone? | No (screenshot via CDP is only a partial check) |
| 17 | Hide the tab for 10 s, come back: paused, no burst, sound back after a tap? | No |
| 18 | Resize the window and rotate the phone: player still on screen, no stretch? | Partly: headless at two viewport sizes, screenshot |
| 19 | Private window: does it start and play with no storage? | **Yes, cheap**: the headless run uses a fresh profile |
| 20 | Is any essential information shown by colour alone or sound alone? | No |
| 21 | Any new `http(s)://` URL or absolute `/path` in shipped files? | **Yes, cheap**: grep |
| 22 | Does a thrown error show on screen with the build id? | Partly: a test page that throws on purpose |

### When shipping (freeze, testers, or portal)

| # | Question | Auto |
|---|---|---|
| 23 | Is the build frozen, manifest written, timeline updated (R6, R13)? | **Yes, exists** (`npm run ship`) |
| 24 | Is the build id visible to a tester? | Partly: grep for `BUILD` in the page |
| 25 | What's the total shipped size, and did it jump? | **Yes, cheap**: print in `ship.sh` |
| 26 | Did someone other than me play it (guide 05)? | No |
| 27 | Portal only: dev panel removed, SDK events verified in Poki Inspector, no page scroll on arrow keys? | Partly: Inspector does the SDK part |

**If you automate only three things from this list:** #2 (headless load), #22's handler behind it (errors on screen, §5.3), and #9 (golden replays). Together they cover the browser, the player's view of failure, and the sim's history, and they add about a second to the hook.

---

## 9. Sources, ranked by value per hour

★ = read first. Times are approximate.

1. ★ **Poki, "Requirements"** (~15 min). The portal's hard requirements: incognito, no external requests, debug removal, pause, mute during ads. https://developers.poki.com/guide/requirements-quality · Inspector: https://developers.poki.com/guide/inspector
2. ★ **CrazyGames, "Technical requirements"** (~10 min). Size, relative paths, iOS audio `resume()` in a gesture, `user-select`. https://docs.crazygames.com/requirements/technical/
3. ★ **Factorio Friday Facts #60, "Tests all around"** (2014, ~5 min). Integration tests on small maps with presaved CRCs for determinism. https://factorio.com/blog/post/fff-60
4. ★ **Riot, "Automated Testing for League of Legends"** (~15 min). The BVS: 5,500 tests per build, 50% of blockers, 8× faster fixes, no sleeps, one week to promote a test. https://www.riotgames.com/en/news/automated-testing-league-legends
5. ★ **Google, "What to look for in a code review"** (~10 min). Functionality, demos for UI changes, over-engineering, tests that fail. https://google.github.io/eng-practices/review/reviewer/looking-for.html
6. ★ **Claude Code, "Best practices"** (~15 min, relevant parts: verification, Writer/Reviewer, adversarial review). Fresh-context review, evidence over assertion, don't chase every finding. https://code.claude.com/docs/en/best-practices
7. **Riot, "Determinism in League of Legends: Fixing Divergences"** (~15 min). Comparing two playbacks; state logs vs checksums; uninitialised memory. https://www.riotgames.com/en/news/determinism-league-legends-fixing-divergences · Series intro: https://technology.riotgames.com/news/determinism-league-legends-introduction
8. **Factorio FFF-62, "The automation of Factorio"** (~5 min). Tests found the desyncs; daily test releases. https://www.factorio.com/blog/post/fff-62
9. **Factorio FFF-366, "The only way to go fast, is to go well!"** (2021, ~15 min). TDD, GUI tests, dependent test ordering, bugs get a test before the fix. https://www.factorio.com/blog/post/fff-366
10. **Game Developer, "How Rare Automates Testing for AI (and More) in Sea of Thieves (Part 4 of 4)"** (~10 min). Test types; the check-in flow; 20-minute server cycle. https://www.gamedeveloper.com/design/how-rare-automates-testing-for-ai-and-more-in-sea-of-thieves-part-4-of-4-
11. **Jessica Baker, "Tests and Testability"** (Rare, 2018, ~10 min). "Test behaviour, not implementation." https://jessicabaker.co.uk/2018/03/11/tests-and-testability/
12. **SmartBear, "Best Practices for Code Review"** (Cisco study, ~10 min). 200–400 LOC, 60 minutes, checklists for omissions. https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/
13. **MDN, "Page Visibility API"** and **"Autoplay guide"** (~10 min each). rAF stops in background tabs; pause on `visibilitychange`; audio needs a gesture. https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API · https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
14. **MDN, `Math`** (~2 min, the precision note) and **`unhandledrejection`** (~2 min). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math · https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event
15. **Game Accessibility Guidelines, "Basic"** (~10 min). The cheap tier. https://gameaccessibilityguidelines.com/basic/
16. **Robert Nystrom, *Game Programming Patterns*, "Game Loop"** (~20 min). Fixed update, variable render, determinism. https://gameprogrammingpatterns.com/game-loop.html
17. **Glenn Fiedler, "Deterministic Lockstep"** (~15 min). Determinism defined; floating-point caveats. https://gafferongames.com/post/deterministic_lockstep/
18. **Game Developer, "Things that can muddle your replay feature"** (~10 min). RNG state, float, script order, physics, version breaks. https://www.gamedeveloper.com/design/things-that-can-muddle-your-replay-feature
19. **Bacchelli & Bird, "Expectations, Outcomes, and Challenges of Modern Code Review"** (ICSE 2013, paper; ~5 min for the abstract). Reviews find fewer defects than expected; understanding is the bottleneck. https://www.microsoft.com/en-us/research/publication/expectations-outcomes-and-challenges-of-modern-code-review/
20. **web.dev, "Performance budgets 101"** (~10 min). Budgets as limits on size and timing. https://web.dev/articles/performance-budgets-101
21. **sunset-driver issue #471** (~3 min). A concrete `Math.cos` divergence between Node and Chromium. https://github.com/jjgroenendijk/sunset-driver/issues/471
22. **King's playtest bots** (secondary summaries; the GDC Vault talk is behind a login). Bots for difficulty, designers for fun. https://wnhub.io/news/Generative_AI/item-43934 · GDC Vault: https://gdcvault.com/play/1023858/How-King-Uses-AI-in
23. **Ubisoft La Forge, "Commit Assistant"** (~5 min). Read as the example of what to skip. https://montreal.ubisoft.com/en/ubisoft-la-forge-presents-the-commit-assistant/
24. **Clinton Keith, "Defining Done"** (blog; the host didn't resolve at fetch time, so details come from search summaries). DoD as non-functional requirements, e.g. frame rate. https://blog.agilegamedevelopment.com/2013/10/defining-done.html
25. **Sea of Thieves GDC 2019 talk** (Robert Masella; the slides PDF returned 403, video on the Vault). https://gdcvault.com/play/1026366/Automated-Testing-of-Gameplay-Features
