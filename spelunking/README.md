# Spelunking Base: prototypes

Playtest bundles and dev tools for the game designed in [../concepts/spelunking_base.md](../concepts/spelunking_base.md) (the single source of truth for the design).

## Run

```
npm install
npm run dev          # http://localhost:5173 lists every tool and bundle
npm test             # simulation tests
npm run gallery -- 1 2 3   # v1 generator: stage-by-stage PNGs into gallery/
```

## Layout

| Path | What |
|---|---|
| `src/sim/` | Deterministic integer-grid core, shared by everything and tested. Code that should outlive the prototypes lives here. |
| `src/sim/gen/` | Terrain: `ca.ts` (cellular automaton), `pipeline.ts` (v2 recipes), `terrain.ts` (v3), `world.ts` / `stats.ts` |
| `src/render/`, `src/ui/`, `src/input/` | Drawing, dev-panel widgets, touch / keyboard → commands |
| `src/tools/vN/` + `vN.html` | Dev tools, numbered v1, v2, v3, … |
| `src/bundles/bN/` + `bN.html` | Playable bundle entry points: wire sim + render + input + dev panel only |
| `bundles/bN-name/` | Bundle docs: README, `presets/`, `playtests/`, `releases/` |
| `archive/` | Frozen references: dated recipe JSON + PNG |
| `gallery/` | Renders to look at (not in git) |
| `tools/` | Node scripts (gallery export, PNG writer) |

## Tools

| Tool | What |
|---|---|
| v1 · Cave generator | Layered CA world: galleries, shafts, hard rock, ore, loot |
| v2 · CA Lab | One binary grid, hand-built gen / scale pipeline. **Frozen:** the fundamental pattern-finding tool |
| v3 · Terrain | A v2 recipe for caves and soft / hard rock, plus ore and loot |

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
