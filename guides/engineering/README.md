# Engineering library: index

Three guides, researched in parallel on 2026-09-25 for the build check (R16 in [ENGINEERING.md](../../ENGINEERING.md)). Each weighs every practice for one person shipping one small HTML5 game a month (must / worth it / later / skip), cites its sources inline, and ends with the yes/no questions a pre-commit review can answer. The build-check sub-agent's checklist (`.claude/agents/build-check.md`) and the resource principles in ENGINEERING.md are distilled from them.

| # | Guide | Answers |
|---|---|---|
| 01 | [Runtime resources on low-end mobile](01-runtime-resources.md) | What costs frame time, battery and memory in a Canvas2D game on a Galaxy A41 or iOS 14, and what's worth doing about it |
| 02 | [Pre-commit and release checks](02-pre-commit-and-release-checks.md) | What studios verify before a change lands, which parts already exist here, and which to skip at solo scale |
| 03 | [Web portal requirements](03-web-portal-requirements.md) | What Poki, CrazyGames, GameDistribution and the rest require of a build, from their own docs, and what gets games rejected |
