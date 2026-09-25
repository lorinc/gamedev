---
id: p4
title: Rule Lab (v4)
started: 2026-09-25
status: building
budget: 3d
from: p3
dev: v4.html, b1.html
build b1.3: 2026-09-25 · ruleset b1.3: cling above a chasm, any mining, gravity (D035); swipe cue disc, "?" on stops, bug reports
build b1.4: 2026-09-25 · b1: deep-fall red + teleport charge (D036); every version on the timeline (D037, R13)
build b1.5: 2026-09-25 · b1: the backpack on the character's back, 6 slots of 16, building paid in rock (D038)
build b1.6: 2026-09-25 · Ruleset b1.6: planks, asking first, fewer stops (D039–D043)
build b1.7: 2026-09-25 · A yes covers only its kind of action, while the run keeps doing it (D044)
---

# p4 · Rule Lab (v4)

The movement and stop rules decide the game feel, and in b1 they were code. Every piece of feedback so far was a change to them. This prototype turns them into data with a visual editor. A ruleset is a JSON file that is saved, exported and loaded the same way a terrain recipe is.

## Question

Can the swipe table and stop rules live as a JSON ruleset, edited visually against small example situations, without losing any b1.2 behaviour?

**Pass:** `rules/b1.2.json` reproduces b1.2 exactly (every existing dig test passes on the data-driven sim). A rule change like D024 is made in the editor, checked against its situations, exported and loaded into b1, with no code change.

**Kill:** the table needs so many special conditions that it's code in disguise. Then keep the rules in code, and only make the numbers and stop toggles data.

## Assumptions

1. [✓] Every b1.2 behaviour fits a first-match decision table: (swipe, situation) → action, over a small, fixed vocabulary of named conditions (next cell open, floor below, headroom, standing / clinging, drop ≤ N, …). Held: 11 conditions, 18 rows. The one catch, "mine first, then look", fits by keeping sequencing inside a meaning.
2. [✓] The data-driven sim stays deterministic and passes every current dig test unchanged. Held: identical to `resolve()` on 48,000 random actions, and the determinism hash is unchanged.
3. [?] Seeing a rule's situation (a small map, the swipe, the result) beside the rule makes changes faster and safer than editing code.
4. [?] A ruleset JSON is small and readable enough to diff in git and paste into chat, like a terrain recipe. `b1.2.json` is 73 lines, one row or situation per line. Is it readable enough for you?
5. [✓] The same situations (small ASCII maps + the expected result) can be both the editor's previews and the test suite. Held: `rules/examples.json` (they're called examples now: "situation" became the name for a condition set).
6. [✓] The timeline's "Rules at close" table can be generated from the ruleset instead of written by hand. Held: the `<!-- ruleset: … -->` line.

## Limitations

- [constraint ?] No new mechanics: p4 only represents and edits the rules b1.2 already has. The Engineer is still the only character.
- [constraint ?] The condition vocabulary is fixed in code. The editor combines conditions, it can't invent new ones. A new condition is a code change with a test.
- [cut] Terrain editing: that stays in the v2 / v3 recipes.
- [cut] Zipline, chasm crossing, the chasm-cling fix, Ghost and Demolitionist: these go to the next dig playtest, built on rulesets.
- [cut] Phone layout for the editor: it's a desktop tool. The rulesets it makes are played on every device.

## Built

**Format** (D028). A ruleset is one JSON file, `rules/<name>.json`, whose sections refer to each other only by id:
- `swipes`: the gesture → intent numbers (commit distance, the horizontal and vertical angle bands).
- `situations`: named, all-of combinations of conditions (`!` negates), such as `stepUpAhead: standing, !fwdOpen, fwdAboveOpen, aboveOpen`.
- `table`: per intent (← → · ↓ · ↑ · ↗ ↖ · ↘ ↙), an ordered first-match list of `{ if: situation, do: meaning }`, plus `reason` for a refusal or `place` for a build.
- `reasons`: every refusal names its signal, `none` or `flash` (D027).
- `stops` and `numbers`: the stop switches and the tunables.

The order is swipe > situation > meaning, because "ahead" means the swipe's side, so the situation can only be judged once the intent is known. `rules/b1.2.json` has 14 situations and 18 rows. A row that needs "do, then look" (like mine first, then look) keeps that inside a meaning, so the table never has to encode sequencing.

**Vocabulary** (code, `src/sim/dig/ruleset.js`): 11 conditions, 13 meanings and 2 signals, each with its own description. The editor combines these but can't invent new ones.

**Interpreter:** `interpret()` replaced `resolve()` in the game. `resolve()` stays as the reference. `ruleset.test.js` compares the two on 3,000 random small worlds × 8 swipes × 2 facings (48,000 actions), and they're identical. Every row is hit. The determinism hash is unchanged.

**Examples** (`rules/examples.json`): 22 ASCII maps, each with swipes and the expected stop (and optionally the position, the map after and the pack).
- The 14 map tests from `dig.test.js` moved there. 8 new ones cover the rows that had no test: ↑, the diagonals while clinging, the overhang, letting go, getting stuck, the staircase down into rock and into air.
- `examples.test.js` runs them all and fails if any row of the b1.2 table is used by no example.
- `dig.test.js` keeps what a map can't show: build credit, tried cells, dives, determinism.

**v4.html · Rule Lab:**
- The table editor: a situation and a meaning dropdown per row, a reason or place field, reorder and delete, and each row's plain-text reading underneath.
- The situations as condition chips (click cycles ignore → needed → needed not), the refusal signals, the stop switches and the numbers.
- The examples replay on every change: a preview of each map with the path, the mined cells and the refused cells in red, the actual stop against the expected one, and the rows each swipe used.
- Click a row's number or its "N ex" count to highlight the examples it decides. Failing examples sort first. "accept result" records a new behaviour as the expected one.
- A form for new examples draws a map, adds swipes and shows a live preview.
- Buttons: copy / paste / download the ruleset, copy / paste the examples, copy as Markdown, reset to the files, and ▶ play in b1. Everything autosaves in the browser.

**b1 loads a ruleset:** `rules/b1.2.json` by default, or with `b1.html?rules=lab` the one the Rule Lab saved. Its numbers, stops and swipe angles become the panel defaults. The red flash follows each reason's signal, and the dive log names the ruleset.

**The timeline renders rulesets:** the line `<!-- ruleset: builds/bN.M/rules/<name>.json -->` in an entry becomes the ruleset's tables. `npm run freeze` now copies `rules/` into the build, so a closed playtest's rules come from the frozen file.

**Checked in a browser** (headless Chromium): v4 loads with 22 of 22 passing. Switching the `junction` stop off fails exactly `junction-shaft`, and `b1.html?rules=lab` then plays with `junction` off. b1 on the default ruleset walks, mines a staircase and stops as before.

**After the first report** ([feedback](feedback/2026-09-25_lorinc_desktop.md)):
- **D030:** a `noOre` / `packFull` refusal in the middle of a run gives way to the stop the run would have made anyway, so it stops quietly with no flash. Examples: `stairs-end` is new, and `loot-pack` and `stair-into-chasm` are updated.
- **D031, bug reports:** the 🐞 button bottom-left in b1, or the B key, shows "Copied last events to clipboard". The text has:
  - the last 5 swipes: the raw gesture (angle and length, or the key), the intent, the ruleset row for each step, the stop with its signal and the refused cells;
  - the map where the last swipe started;
  - an `EXAMPLE` line, which the Rule Lab's "paste bug report" opens as a draft example;
  - a `REPLAY` line with every command and its tick. `npm run replay -- report.txt` rebuilds the session and checks it tells the same story.
- **Checked:** `tools/replay.test.js` checks the replay. In headless Chromium, real mouse swipes → B → the clipboard → a ✓ replay → v4 opened the draft.

**The swipe cue (D032):** what a swipe attempts is now visible. A white disc, one step out in the swipe's direction, shows an arrow, stairs or a pickaxe, blinks red if refused and fades in 0.6 s. It replaces the red flash on the refused cells. The pack flash stays for now. A run that stops on its own shows the disc with just "?" in the run's direction, never red (D034; the exact trigger is in the bug report).

**Ruleset b1.3 (D035), from a bug report** (clinging at the foot of your own staircase, above a chasm, with no way back up). ↗ ↖ toward the wall you hold climb it; any mining is allowed; gravity makes you fall when nothing holds you, and home after a fall deeper than `harmlessDrop`. b1 and the Rule Lab load `rules/b1.3.json`; `b1.2.json` stays as the frozen reference. Four new examples.

**Deep-fall feedback (D036, after b1.3):** at the bottom of a fall deeper than `harmlessDrop`, the character turns red and the teleport charge ring fills over 0.7 s, then it teleports home.

**The backpack (D038, ruleset b1.5):** the pack strip at the bottom is gone. The character carries a backpack of 6 slots × 16 units (2 wide, 3 tall, each slot a 4×4 grid filling from the bottom), and every material mined goes in. Building costs 1 rock per tile (soft first); ore and loot never pay. With no room, rock is dropped and ore or loot refuse. `rules/b1.5.json` is the default, and `migrate()` brings older rulesets (the Rule Lab's saved one, b1.2 in the tests) up to it. Four examples changed; `stair-into-chasm` now builds on down with the rock it dug.

**Planks and asking first (D039–D043, ruleset b1.6):** every build places a plank, a tread along the top of an open cell, which you stand on or walk under. A build, or digging a step you could walk up, asks first: the run stops, the swipe disc blinks, and the same swipe again does it. Runs no longer stop for break-outs, harder rock, ore, loot or junctions. → at a gap bridges (after asking) and never steps off; ↓ drops. ↑ mines the rock above, climbs a plank ladder, or builds one. The tick-6659 crossing is the example `plank-crossing`. A yes covers only the kind of action it was asked about, while the run keeps doing it (D044, from a b1.6 report). A walking run stops in front of a plank that crosses its way, so you can pick → or ↗ (D045). Of the 27 old examples, 15 changed and one (`no-up`) went; 9 are new.

**Pass criterion, half met:** `rules/b1.2.json` reproduces b1.2 exactly. A D024-style change made in the editor, checked against examples and played in b1 without code has been tried once, by the build check above. It's still open for you.

## Feedback

None yet.

## Conclusion → next

Open.
