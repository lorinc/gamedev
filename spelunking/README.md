# Spelunking Base: prototypes

Prototypes, playtest bundles and dev tools for the game designed in [../concepts/spelunking_base.md](../concepts/spelunking_base.md) (the single source of truth for the design).

## Run

No build step: the browser runs the `.js` files as they are.

```
npm run serve        # http://localhost:8000, bound to this machine only (nothing exposed to the LAN)
npm test             # node --test: simulation tests, nothing to install
npm install          # only needed for the type check
npm run check        # tsc: type-checks the JSDoc types in src/ (emits nothing)
npm run gallery -- 1 2 3   # v1 generator: stage-by-stage PNGs into gallery/
npm run timeline     # timeline/*/entry.md + decisions.md → timeline/index.html
npm run ship         # push; if b1 changed, first freeze the next build (b1.N+1) onto the timeline (R13)
npm run replay -- report.txt   # replay a b1 bug report (the 🐞 button / B key copies it) and check it reproduces
npm run favicon      # redraw favicon.png and copy it next to every page
npm run freeze -- p3-dig-feel b1.2   # freeze bN.html + src/ into the timeline and git tag it
```

The history of every prototype, playable, is at http://localhost:8000/timeline/. The repo is public and GitHub Pages serves `main` as it is, so a push publishes: https://lorinc.github.io/gamedev/spelunking/timeline/ (live dev build: …/spelunking/b1.html).

## Dependencies

Dependencies are bad by default. Each one needs a line here saying why ~100 lines of our own code can't replace it, or it goes.

| Package | Kind | Why |
|---|---|---|
| `typescript` | dev, optional | Type-checks the code (JSDoc types in plain `.js`). It's the only independent check on code the author can't fully review. Pulls in no other packages; the game runs without it. |

Runtime dependencies: none. The browser APIs (Canvas2D, pointer events, Web Audio) are the engine. Platform SDKs (Playgama Bridge) load from the platform's own script tag in release builds only.

Rules: the sim (`src/sim/`) imports only other sim modules, enforced by `src/sim/boundary.test.js`. Browser code sticks to ES2020 (iOS 14 Safari), enforced by `tsc`.

## Layout

| Path | What |
|---|---|
| `src/sim/` | Deterministic integer-grid core, shared by everything and tested. Code that should outlive the prototypes lives here. |
| `src/sim/gen/` | Terrain: `ca.js` (cellular automaton), `pipeline.js` (v2 recipes), `terrain.js` (v3) + `starterCaves.js` (its recipe), `world.js` / `stats.js` |
| `src/sim/dig/` | The dig game: `game.js` (state + fixed tick), `ruleset.js` (the rule vocabulary + the interpreter of a ruleset), `examples.js` (replays `rules/examples.json`), `describe.js` (a ruleset as Markdown), `rules.js` (stop rules; b1.2's rules in code, kept as the reference `rules/b1.2.json` is checked against) |
| `rules/` | Dig rulesets (`<name>.json`: situations, the swipe table, refusal signals, stops, numbers) and `examples.json` (ASCII maps + swipes + expected stops: the dig tests and the Rule Lab's previews). Edit them in `v4.html`, export, commit |
| `src/bundles/v4/` + `v4.html` | Rule Lab: the ruleset editor. b1 plays the ruleset it saves with `b1.html?rules=lab` |
| `src/render/`, `src/ui/`, `src/input/` | Drawing, dev-panel widgets, touch / keyboard → commands |
| `src/bundles/bN/` + `bN.html` | Playable bundle entry points: wire sim + render + input + dev panel only |
| `timeline/pN-slug/` | One prototype: `entry.md` (question, assumptions, built, feedback, conclusion), frozen `builds/`, `feedback/`, `media/`, `presets/`. Public. See [timeline/README.md](timeline/README.md) |
| `archive/` | Frozen references: dated recipe JSON + PNG |
| `gallery/` | Renders to look at (not in git) |
| `tools/` | Node scripts: gallery export, PNG writer, timeline generator (`timeline.js` + `md.js`), `favicon.js` (draws `favicon.png`, copies it next to every page), `freeze.sh` |

## Timeline

Every prototype, tool or bundle, gets a timeline entry. The retired terrain tools (v1–v3, TS + Vite + Pixi + Tweakpane, tag `tools-v1-v3`) are there as frozen static builds, so they still play.

Current state of each: `npm run timeline`, then open the generated page (the status chips there come from each entry's frontmatter, so nothing here goes stale).

Planned bundles (from the concept doc): b2 · Greed & Darkness, b3 · Tiny Base, b4 · Vault.

**Workflow:**
1. **New prototype:** copy `timeline/_template/` to `timeline/pN-slug/`, then write its Question, Assumptions, Limitations and time box *before* building. Develop in `src/` + `bN.html` as usual.
2. **Playable:** commit, then `npm run ship`. It freezes the next b1 build into the entry that holds the newest one (with `rules/`, stamped with its id), adds the build line, tags it and pushes (R13). For another bundle or the first build in a new entry: `npm run freeze -- pN-slug bN.M` by hand, add the `build` line it prints, then ship.
3. **Play session:** a `feedback/YYYY-MM-DD_tester_device.md` from the template, with the tester's quotes (minimal spelling / grammar fixes, never rewording) and the dive log. Flip the assumption and constraint marks, record rule changes under Built, and append each decision to `timeline/decisions.md`.
4. **End:** fill in Conclusion → next (a playtest's `## Rules at close` can be the line `<!-- ruleset: builds/bN.M/rules/<name>.json -->`: the timeline renders the frozen ruleset's tables), set `ended:` and the status to `concluded` or `killed`, and copy the decisions back to the concept doc. The card shows the days used against the time box.

## Rules

The engineering rules, what enforces each one, and the tools we're deliberately not using yet live in [../ENGINEERING.md](../ENGINEERING.md). Once per clone: `git config core.hooksPath .githooks` (the pre-push checks).


- Tools and bundles only **add** to shared code; they never change behaviour another tool or bundle depends on. A different behaviour becomes a new version (v4, b1.2, …).
- A build is **frozen when it ships**: `npm run freeze` copies it to `timeline/pN-slug/builds/bN.M/` and tags it `bN.M`. Frozen builds are never edited.
- Everything is public (build in public): a push to `main` is live in about a minute. Never commit secrets. Ask other testers before publishing their feedback.
- Decisions a prototype produces go back into the concept doc; its timeline entry keeps the evidence.
