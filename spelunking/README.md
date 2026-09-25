# Spelunking Base: prototypes

Playtest bundles and dev tools for the game designed in [../concepts/spelunking_base.md](../concepts/spelunking_base.md) (the single source of truth for the design).

## Run

No build step: the browser runs the `.js` files as they are.

```
npm run serve        # http://localhost:8000, bound to this machine only (nothing exposed to the LAN)
npm test             # node --test: simulation tests, nothing to install
npm install          # only needed for the type check
npm run check        # tsc: type-checks the JSDoc types in src/ (emits nothing)
npm run gallery -- 1 2 3   # v1 generator: stage-by-stage PNGs into gallery/
```

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
| `src/render/`, `src/ui/`, `src/input/` | Drawing, dev-panel widgets, touch / keyboard → commands |
| `src/bundles/bN/` + `bN.html` | Playable bundle entry points: wire sim + render + input + dev panel only |
| `bundles/bN-name/` | Bundle docs: README, `presets/`, `playtests/`, `releases/` |
| `archive/` | Frozen references: dated recipe JSON + PNG |
| `gallery/` | Renders to look at (not in git) |
| `tools/` | Node scripts (gallery export, PNG writer) |

## Tools (retired)

The terrain tools lived on TS + Vite + Pixi + Tweakpane and were removed on 2026-09-25 with that stack. All three were frozen. To run them: `git checkout tools-v1-v3 && npm install && npm run dev`.

| Tool | What |
|---|---|
| v1 · Cave generator | Layered CA world: galleries, shafts, hard rock, ore, loot. Its generator lives on in `src/sim/gen/world.js` (used by the gallery) |
| v2 · CA Lab | One binary grid, hand-built gen / scale pipeline. The fundamental pattern-finding tool |
| v3 · Terrain | A v2 recipe for caves and soft / hard rock, plus ore and loot. Its output is `src/sim/gen/terrain.js`, which b1 uses |

## Bundles

| Bundle | Question | Status |
|---|---|---|
| [b1 · Dig Feel](bundles/b1-dig-feel/README.md) | Does "move until something changes" feel good, and do I want another dive? | scoping |
| b2 · Greed & Darkness | Does "loot lights the way, and draws the bugs" create greed? | – |
| b3 · Tiny Base | Does digging pull you into building, and back? | – |
| b4 · Vault | Is the one-screen, three-path raid puzzle interesting? | – |

## Rules

- Tools and bundles only **add** to shared code; they never change behaviour another tool or bundle depends on. A different behaviour becomes a new version (v4, b1.2, …).
- A bundle build is **frozen when it ships**: git tag `bN.M`, preset JSON and zip in `bundles/bN-name/releases/`.
- Decisions a bundle produces go back into the concept doc; the bundle doc keeps the evidence.
