# Spelunking · prototype timeline

**Play it:** https://lorinc.github.io/gamedev/spelunking/timeline/

Spelunking Base is being built in public, one small prototype at a time. Each prototype asks one question, writes down what it assumes, ships a playable build, gets played, and ends with a decision. This folder is that history. Every build here is frozen exactly as it was tested.

Each `pN-*` folder is one prototype. Start at its `entry.md`.

## How an entry works

```
pN-slug/
  entry.md        frontmatter + Question · Assumptions · Limitations · Built · Feedback · Conclusion → next
  builds/<id>/    a frozen, playable build (open index.html); never edited after it ships
  feedback/       one file per play session: YYYY-MM-DD_tester_device.md
  media/          cover.png, screenshots
```

Start a new entry by copying [_template/](_template/), which also holds the feedback template.

**Assumptions** are marked `[?]` open, `[✓]` held, `[✗]` broken. The marks change as feedback comes in, so the timeline shows which beliefs each prototype confirmed or broke. Assumptions are written before building. One added after the first build ends with `(post-hoc)` and gets a badge, so rewriting the question after seeing the answer stays visible.

**Limitations** are what the prototype leaves out on purpose:
- `[constraint ?]` is a limit being tested ("no fall damage": is the loop better without it?). Like an assumption, it gets `✓` or `✗`.
- `[cut]` is scope dropped for time. It says where the scope comes back.

**Time box:** `budget: 3d`. Open entries count the days live on the page, closed ones show days used against the budget, in red when over. Over time means cutting features, not extending.

**Decisions** go in [decisions.md](decisions.md), an append-only ledger: `| D024 | date | from entry | active | decision |`. A changed decision is a new row, and the old one becomes `superseded by D024`. Each card lists the decisions its prototype made.

**Frontmatter** (flat `key: value` lines between `---`):

```
id: p3
title: Dig Feel (b1)
started: 2026-09-24
ended: 2026-09-30          # when concluded or killed
status: playtesting         # building | playtesting | concluded | killed
from: p2                    # the prototype it grew out of
budget: 3d                  # the time box
cover: media/cover.png
dev: b1.html                # optional: link to the live, unfrozen build
build b1.1: 2026-09-25 · what this build changed
```

`index.html` is generated from the entries (`npm run timeline`). Don't edit it by hand.

The whole repo is public, including the design docs the entries grew from ([concepts/](../../concepts/)) and the research behind them ([guides/](../../guides/)). GitHub Pages serves `main` as it is: pushing is publishing.
