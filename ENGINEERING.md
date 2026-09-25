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

**Setup, once per clone:** `git config core.hooksPath .githooks`, and `npm install` in each game folder (for `tsc`).

## Dependencies

| What | Kind | Why |
|---|---|---|
| `typescript` | dev | The type check, the only independent check on code the author can't fully review. Justified in `spelunking/README.md` |
| GitHub Pages | platform | Free static hosting straight from `main`. There's no build step, so no CI is needed yet |
| Node ≥ 20 | runtime for tests and tools | `node --test` and `fs.readdirSync` with `{ recursive: true }` (20.1+) |

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
