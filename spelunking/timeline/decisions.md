# Spelunking · decision ledger

Append-only. A decision is never edited or deleted. A new decision supersedes it, and the old row's status becomes `superseded by Dnnn`. **From** is the timeline entry that produced the decision, or `—` for decisions made in design sessions outside a prototype. The design itself lives in the [concept doc](../../concepts/spelunking_base.md). This ledger is how its decisions changed.

D001–D023 were reconstructed on 2026-09-25 from the session notes.

| ID | Date | From | Status | Decision |
|---|---|---|---|---|
| D001 | 2026-09-24 | p1 | active | Terrain is designed on one binary grid, step by step. Stacking many CA layers is dropped as the design method. |
| D002 | 2026-09-24 | p1 | active | The map is homogeneous for now: no top / bottom differentiation. Depth tiers come later. |
| D003 | 2026-09-24 | p1 | active | CA rules are edited with the keep / born / die toggle editor, never as text. |
| D004 | 2026-09-24 | p2 | active | v2 CA Lab is frozen as the pattern-finding tool. New terrain ideas become a new tool version. |
| D005 | 2026-09-24 | p2 | active | The starter terrain is the archived seed-6712 recipe as v3 (caves, a reseeded soft / hard split, ore CA at 300 ‰, loot at 50 ‰). b1 digs in it. |
| D006 | 2026-09-24 | — | active | The character is 1 tile tall and climbs 1-tile steps without stopping. |
| D007 | 2026-09-24 | — | active | Controls signal intent, not movement: swipe (or press a key) and the character moves until something changes. What a swipe does depends on the context. |
| D008 | 2026-09-24 | — | superseded by D019 | Swiping down on open floor digs straight down. |
| D009 | 2026-09-24 | — | superseded by D010 | At a ledge, a swipe into the gap builds a bridge. |
| D010 | 2026-09-24 | — | superseded by D018 | At a ledge, a swipe into the gap is an Engineer zipline. |
| D011 | 2026-09-24 | — | active | Casual, not survival: no fall damage. A wrong move never ends a dive; if you're stuck, you teleport home. |
| D012 | 2026-09-24 | — | active | Every game runs in portrait, landscape and square, with touch and with mouse / keyboard. b1 tests the whole matrix. |
| D013 | 2026-09-25 | — | active | Stack: plain JS ES modules with JSDoc types checked by `tsc`, no build step, Canvas2D, zero runtime dependencies. Every dependency needs a written justification. |
| D014 | 2026-09-25 | p3 | active | Everyone is an Engineer in b1. The zipline is cut to b1.2, torchlight to b2. |
| D015 | 2026-09-25 | p3 | active | The keyboard gets both models, numpad intents and held WASD, to A/B test. |
| D016 | 2026-09-25 | p3 | active | Surface strip of 4 sky rows + 3 crust rows, home at x = 0. |
| D017 | 2026-09-25 | p3 | active | Swipes use pointer events and commit at a distance threshold. A swipe made mid-tile applies at the next tile boundary. |
| D018 | 2026-09-25 | p3 | active | Step off by asking: swiping into a gap again drops you, if the floor is within `harmlessDrop` (4). |
| D019 | 2026-09-25 | p3 | active | No digging straight down: the way down through rock is the diagonal staircase. |
| D020 | 2026-09-25 | p3 | active | Mine first, then look: a mining step moves into the mined cell only if you can stand there. |
| D021 | 2026-09-25 | p3 | active | Numpad 5 mirrors the taps: tap = stop, hold = teleport home. |
| D022 | 2026-09-25 | p3 | active | Juice sits behind a master switch. Stop rules are judged with it off first. |
| D023 | 2026-09-25 | — | active | Build in public: the repo is public, and a push to `main` publishes. Every prototype is a timeline entry with frozen, playable builds. |
| D024 | 2026-09-25 | p3 | active | The junction stop fires only for a real side passage: a shaft with rock on both sides overhead. Walking out of a tunnel into an open cave takes the 1-tile step down and walks on. Mining that breaks into open space still stops (the `open` rule). |
| D025 | 2026-09-25 | p3 | active | p3 (b1 · Dig Feel) closes at b1.2 without the phone matrix. Its open assumptions and constraints carry over to the next dig playtest. A closed playtest records its rule table ("Rules at close"). |
| D026 | 2026-09-25 | p3 | active | The next demo is p4 · Rule Lab (tool v4): movement and stop rules become a JSON ruleset with a visual editor, saved, exported and loaded like terrain recipes. b2 waits. |
| D027 | 2026-09-25 | p3 | active | Refusals are visible: when an action can't happen, the game shows it, because everything that felt like a bug so far was a rule working as designed. First signal: no ore to build, or no pack room for loot → the tried cells and the backpack flash transparent red ("I tried, can't do"). |
| D028 | 2026-09-25 | p4 | active | A dig ruleset is one JSON file with separate sections that refer to each other only by id: swipes (gesture → intent), situations (named all-of condition sets), the table (per intent, first match: situation → meaning), refusal signals, stops, numbers. The order is swipe > situation > meaning, because "ahead" is the swipe's side (proposed by Claude; the user asked for the separation and in-place validation, and didn't mind the order). Meanings are fixed code bundles that the table picks, so sequencing like "mine first, then look" never becomes data. |
| D029 | 2026-09-25 | p4 | active | Stairs (user's design): a normal block that the intent decides, walked through or climbed on, and some build or mine actions place one. It needs a per-intent tiles section in the ruleset and a new tile, so it comes after p4. p4 ships without stairs. |
| D030 | 2026-09-25 | p4 | active | A refusal for lack of ore or pack room (`noOre`, `packFull`) in the middle of a run gives way to the stop the run would have made anyway: it stops quietly, with no flash. It refuses (and flashes) only when the action would really have happened: on a fresh swipe, or when no stop rule catches it. Found from the first b1 report on the Rule Lab rules: ↗ up a staircase flashed red at the top. |
| D031 | 2026-09-25 | p4 | active | Bug reports remove the guesswork (user's call). The 🐞 button (bottom-left, key B) copies the last 5 swipes: the raw gesture, the intent, the ruleset row for each step, the stop and what it tried, the map where the last swipe started, a Rule Lab example, and a REPLAY line with every command and its tick. `npm run replay` reproduces the dive exactly and checks it. The raw gesture, replay and example parts were proposed by Claude and accepted. |
| D032 | 2026-09-25 | p4 | active | The swipe cue (user's design): a small opaque white disc appears one step from the character in the swipe's direction (beside, above, below or diagonal) and shows the attempted action as a negative symbol: an arrow for a walk or climb, stairs for a build, a pickaxe for a dig. It fades out in 0.6 s. It's red when the attempt is refused. The red flash moves from the refused cells to the disc, and the backpack flash stays for now. It shows on a swipe's first outcome, and mid-run only for `flash` refusals. |
