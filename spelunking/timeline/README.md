# Spelunking · prototype timeline

**Play it:** https://lorinc.github.io/spelunking-play/

Spelunking Base is being built in public, one small prototype at a time. Each prototype asks one question, writes down what it assumes, ships a playable build, gets played, and ends with a decision. This folder is that history. Every build here is frozen exactly as it was tested.

Each `pN-*` folder is one prototype. Start at its `entry.md`.

## How an entry works

```
pN-slug/
  entry.md        frontmatter + Question · Assumptions · Built · Feedback · Conclusion → next
  builds/<id>/    a frozen, playable build (open index.html); never edited after it ships
  feedback/       one file per play session: YYYY-MM-DD_tester_device.md
  media/          cover.png, screenshots
```

**Assumptions** are marked `[?]` open, `[✓]` held, `[✗]` broken. The marks change as feedback comes in, so the timeline shows which beliefs each prototype confirmed or broke.

**Frontmatter** (flat `key: value` lines between `---`):

```
id: p3
title: Dig Feel (b1)
started: 2026-09-24
ended: 2026-09-30          # when concluded or killed
status: playtesting         # building | playtesting | concluded | killed
from: p2                    # the prototype it grew out of
cover: media/cover.png
dev: b1.html                # optional: link to the live, unfrozen build
build b1.1: 2026-09-25 · what this build changed
```

`index.html` is generated from the entries (`npm run timeline`). Don't edit it by hand.

Entries in the source repo are written to stand alone. The design docs they grew from are private. Links out of this folder are refused at publish time.
