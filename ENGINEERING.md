# Engineering rules

Prototypes are throwaway learning assets, and their code is allowed to be bad. The rules below guard the two things that aren't throwaway:
- **The process:** the timeline, frozen builds, decisions, and publishing.
- **The core that carries over:** `src/sim/`, the deterministic simulation that outlives each prototype.

**A rule without a check is a wish.** Every rule names what enforces it. `manual` means it's a review habit, and it gets re-read at the end of each game. A rule gets added when something goes wrong, not in advance. Log the incident below.

## Two tiers

| Tier | Where | Rules |
|---|---|---|
| **Throwaway** | `src/bundles/bN/`, `bN.html`, `tools/` | It runs, and it doesn't break the checks. Nothing else. |
| **Keeper** | `src/sim/`, `src/render/palette.js`, the timeline, the ledger | Everything below. |

Code moves from throwaway to keeper by the **rule of two** (R7): when a second prototype needs it. It gets its tests at that moment, not before.

## Rules

| # | Rule | Why | Enforced by | Since |
|---|---|---|---|---|
| R1 | `src/sim/` imports only other `src/sim/` modules | The sim runs anywhere: browser, Node tests, a Web Worker, a peer's machine | `spelunking/src/sim/boundary.test.js` | 2026-09-25 |
| R2 | Browser code sticks to ES2020 | iOS 14 Safari is the oldest target | `tsc` (`lib: ES2020`) in `.githooks/pre-push` | 2026-09-25 |
| R3 | Zero runtime dependencies; every dev dependency has a justification row | Dependencies bring "a whole world of pains" (I1) | `spelunking/tools/deps.test.js` | 2026-09-25 |
| R4 | The sim is deterministic: same seed + same commands → same state | Replayable dive logs, reproducible bugs, P2P agreement | `spelunking/src/sim/determinism.test.js` | 2026-09-25 |
| R5 | No clock and no unseeded randomness in the sim (`Math.random`, `Date`, timers) | R4 breaks silently otherwise | `spelunking/src/sim/determinism.test.js` | 2026-09-25 |
| R6 | Frozen builds are never modified | The timeline must play what was tested (I3) | `MANIFEST.sha256` per build + `spelunking/tools/frozen.test.js` | 2026-09-25 |
| R7 | Rule of two: code enters `src/sim/` when a second prototype needs it, with tests | Keeps the throwaway tier cheap and the keeper tier honest | manual | 2026-09-25 |
| R8 | Every sim rule change gets a test on an ASCII map | Movement rules are the experiment; tests are their spec | manual | 2026-09-25 |
| R9 | Shared code only grows; a different behaviour becomes a new version (v4, b1.2) | Earlier tools and frozen builds keep working | manual, backed by R6 | 2026-09-24 |
| R10 | The timeline is consistent: required sections, a time box, a valid decision ledger, `index.html` up to date | The timeline is the project's memory | `tools/timeline.js --strict` in `.githooks/pre-push` | 2026-09-25 |
| R11 | Nothing reaches `main` without the checks passing | The repo is public and a push publishes (D023) | `.githooks/pre-push` | 2026-09-25 |
| R12 | No secrets in the repo, ever | Public repo: a leaked key is public within a minute | GitHub secret scanning + push protection (repo setting) | 2026-09-25 |
| R13 | Every playable version is on the timeline: the pushed newest bundle (b1, then b2, …) is always a frozen build; an older bundle stays playable as its frozen builds | You test what the timeline shows, and every version stays playable (D037) | `spelunking/tools/unfrozen.sh` in `.githooks/pre-push`; `npm run ship` freezes and pushes | 2026-09-25 |
| R14 | Shipped code runs on iOS 14.0 Safari: no newer JS syntax or DOM API; newer CSS only where the page works without it. `tsc` only sees JS built-ins (R2) | On the oldest target a newer API is a black screen, while every other check stays green (I4) | `spelunking/tools/compat.test.js` (a denylist for JS that grows with each incident); CSS by the build check | 2026-09-25 |
| R15 | Every page loads in a browser with no uncaught error, failed load or rejected promise, and errors show on screen | Every other check runs in Node, and nothing loaded the game itself (I4) | `spelunking/tools/smoke.sh` (headless Chromium) in `.githooks/pre-push`; `src/errors.js` on every page | 2026-09-25 |
| R16 | Every major release gets a build check. Major means a new bundle (`bN.html`), closing a prototype entry, or a portal submission. A sub-agent with fresh context reviews the diff, the checks and the running page, and the release commit carries its verdict as a `Build-check:` line. Point freezes (b1.N) rely on the automated checks | The author can't see their own gaps, and reading isn't running ([guide 02 §6](guides/engineering/02-pre-commit-and-release-checks.md)). The review costs ~70k tokens and ~4 minutes, which is worth it per release but not per push (user's call) | `.claude/agents/build-check.md`; `.githooks/pre-push` refuses a new `bN.html` or an entry closed as `concluded`/`killed` without the line; the portal pack script will do the same when it exists | 2026-09-25 |

**Setup, once per clone:** `git config core.hooksPath .githooks`, `npm install` in each game folder (for `tsc`), and Chromium on the `PATH` (for `smoke.sh`).

## Build check (R16)

**Every push** runs the automated checks: `tsc`, the tests, iOS 14 compat, the headless page load and the timeline. They take about 5 s and cost no tokens.

The build-check sub-agent runs on **major releases** only: a new bundle (`bN.html`), closing a prototype entry, or a portal submission. For a point freeze (b1.N), you can still ask for one if a change feels risky.

1. **Build**, with the checks green locally.
2. **Run the `build-check` sub-agent** (`.claude/agents/build-check.md`) with the task statement. It's read-only and hasn't seen the author's reasoning. It:
   - runs `tsc`, the tests, `smoke.sh` and the timeline check;
   - takes phone and desktop screenshots when the page's look changed;
   - reviews the diff against the rules and the resource principles below;
   - reports only real gaps.
3. **FAIL:** fix it and run the check again. **PASS WITH NOTES:** fix the notes, or record why not.
4. **Commit** the release with the verdict as a trailer line, for example `Build-check: pass (tsc, 102 tests, smoke 3 pages, 0 findings)`. `Build-check: skipped (<why>)` is for a release that doesn't change play. The pre-push hook refuses a release commit without the line.
5. **The human part:** the report ends with what only a person can check for this diff, such as feel, touch on a phone, a hidden tab, or a run on the A41. Those stay yours.

## Resource principles

From [guides/engineering/01-runtime-resources.md](guides/engineering/01-runtime-resources.md), weighed for tiny games on a 2020 budget phone. The build check reviews each diff against them. Most can't be checked mechanically; where a check exists, it's named.

- **The sim's speed never depends on the frame rate.** It runs on fixed 60 Hz ticks with a clamped accumulator, and the renderer interpolates. Browsers run rAF at 30 fps (Safari in iframes before the first tap, iOS Low Power Mode) and at 120 fps (fast phones). Cosmetic animation uses `dt`, never "per frame". Nothing uses `setInterval`/`setTimeout` for gameplay.
- **Compute on change, not per frame.** Anything that depends only on zoom, size, settings or slow-changing state (layouts, colour strings, text metrics, the world texture) is computed once and cached behind a key.
- **No allocation in per-tile or per-entity loops.** A few small objects per frame are fine; the GC handles them. Object pools and dirty rectangles are a skip at this scale.
- **Pixel-exact drawing:** whole device pixels, `imageSmoothingEnabled = false` after every resize, no `shadowBlur`, `filter` or `getImageData` on the per-frame path.
- **A fixed, small set of canvases,** created at startup or resize, each at most 4096 × 4096. iOS caps total canvas memory and kills the page past it.
- **Idle when nobody's playing.** A hidden tab pauses the game and suspends audio. Web Audio keeps running when rAF stops.
- **The first frame never waits** for audio decoding or asset loads.
- **Storage is optional.** `localStorage` is only touched inside a `try`, because it throws in private windows and in some portal iframes.
- **Measure on the floor device.** Headless Chromium can't see fill rate or heat. Per-frame work gets 2+ minutes on the A41 before a freeze; the budget is ~10 ms per frame.

**Known gaps** (found by the research on 2026-09-25, and not yet needed):

| Gap | Label | When |
|---|---|---|
| Pause and suspend audio on `visibilitychange` (`input.js` only handles `blur`) | must | before the first portal build |
| Cap DPR at 2 (the A41 at 2.625 fills ~2.6 M px per frame) | worth it | the first A41 session: measure frame times before and after |
| Block page scroll on space and the arrow keys, and remove debug surfaces from portal builds | must | before the first portal build ([guide 03](guides/engineering/03-web-portal-requirements.md)) |
| Golden replays: 3–5 saved dives with state hashes, checked in the hook | worth it | the first sim change that silently changes an old replay, or when P2P starts |

## Dependencies

| What | Kind | Why |
|---|---|---|
| `typescript` | dev | The type check, the only independent check on code the author can't fully review. Justified in `spelunking/README.md` |
| GitHub Pages | platform | Free static hosting straight from `main`. There's no build step, so no CI is needed yet |
| Node ≥ 20 | runtime for tests and tools | `node --test` and `fs.readdirSync` with `{ recursive: true }` (20.1+) |
| Chromium | dev tool | Headless page loads (`smoke.sh`) and screenshots (the build check). It's the only way to run the game in a browser without an npm dependency. Chrome works too |
| Python 3 | dev tool | `http.server` for `npm run serve` and `smoke.sh`. It's already on every Linux and macOS machine |

## Not yet (stubs)

Each of these is a stub file with a `.todo` suffix, so no tool picks it up until it's renamed. The file itself says when to start and how.

| Tool | Stub | Start when |
|---|---|---|
| CI + gated Pages deploy | `.github/workflows/checks-and-pages.yml.todo` | someone else pushes, a broken commit goes live, or testers rely on the URL daily |
| Dependabot | `.github/dependabot.yml.todo` | the first runtime dependency, or dev dependencies beyond `typescript` |
| ESLint | `spelunking/eslint.config.js.todo` | the same bug class slips past `tsc` twice (log it below), or a second contributor |
| Prettier | `spelunking/prettier.config.js.todo` | a second contributor, or formatting noise in diffs |
| Coverage (sim only) | `spelunking/tools/coverage.sh.todo` | `src/sim/` is shared by a second game, or a sim bug ships that a test should have caught |
| A41 performance check | `spelunking/tools/perf-a41.js.todo` | a bundle adds per-frame work (b2 darkness), or A41 hitches come up in two playtests |

## Incidents

Why the rules exist. Append one line whenever something goes wrong, then ask whether it needs a rule.

| # | Date | What happened | Rule |
|---|---|---|---|
| I1 | 2026-09-24 | The first tools pulled in TS + Vite + Pixi + Tweakpane: hundreds of node modules for what was ~100 lines of Python | R3, D013 |
| I2 | 2026-09-25 | A proposal by Claude (idiomatic TypeScript) was recorded downstream as the user's choice | "justify every dependency" (in memory, not the repo) |
| I3 | 2026-09-25 | Frozen builds were edited to add a favicon (cosmetic, one line each). There was no check to catch it | R6 (manifests written after the edit) |
| I4 | 2026-09-25 | Research found two problems every check had missed. b1 couldn't start on iOS below 15.4, because `structuredClone` runs at startup. Its sound threw on iOS 14.0–14.4, because of the unprefixed `AudioContext`. `tsc` with `lib: ES2020` doesn't see DOM APIs or syntax, and nothing ever loaded a page in a browser | R14, R15, R16 |
