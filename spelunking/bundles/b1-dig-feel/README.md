# b1 · Dig Feel

Design source: *Playtest Bundles → Bundle 1* and *Controls & Genre* in [spelunking_base.md](../../../concepts/spelunking_base.md). The concept doc is the original; this doc records what was built, tuned, and learned.

## 1. Question and criteria

**Question:** does "move until something changes" feel good **on every target setup**, and do I want another dive? Every game must run in portrait, landscape and square with touch and mouse/keyboard ([opinionated_games.md](../../../concepts/opinionated_games.md), *Any Screen, Any Aspect Ratio*), so b1 tests the feel across all of them, not on one favourite setup.

**Test matrix** (decided 2026-09-25):

| Setup | Input | Ratios |
|---|---|---|
| Samsung Galaxy A41 (2020, the performance floor) | touch | 9:16, 16:9 |
| New HD phone | touch | 9:16, 16:9 |
| Desktop, HD monitor | mouse + keyboard | 16:9, 1:1, 9:16 (resized window) |

**Pass:**
- You instinctively start another dive, on every row of the matrix.
- "Push through the hard rock, or recall?" feels like a choice.
- Swipes on the phone neither overshoot nor feel twitchy.
- The old phone doesn't visibly hitch; the frame-time readout in the dev panel says the same.
- Sharp on the HD screens (drawn at the device pixel ratio), readable on the small one.
- Portrait shows enough depth to plan a dive; landscape doesn't feel like wasted space.

**Kill:** still boring after tuning the stop rules → rethink movement before anything else. If it only feels good on one input or one ratio, that input or ratio gets redesigned before b2.

**Time box:** 3 days. Running over means cutting features, not extending.

## 2. Scope

**In:**
- **World:** v3 terrain (archived recipe `archive/2026-09-24_starter-caves_seed6712.json`, live = cave), wrapping horizontally, with a surface strip on top and a home spot.
- **Character:** 1 tile tall in the sim, drawn ~1.3 tiles. Everyone is an Engineer.
- **Swipes by context** (8 directions; a new swipe replaces the current intent):
  - Open floor: left / right walk (follows the floor, 1-tile steps up and down without stopping); diagonal mine / build; down dig down.
  - At a wall: swipe into it mines until the environment changes; diagonal mine / build.
  - At a ledge (2+ drop): swipe into the gap = Engineer zipline; down = climb down (overhangs up to 45°; steeper: drop if floor ≤4 below, else zipline out).
  - Mine or build: rock is mined, air is built (1 ore per 12 tiles).
- **Taps:** tap the character = stop; tap elsewhere = torchlight; long-tap = charge the teleport home.
- **Keyboard:** WASD (two keys = diagonal), numpad 1–9 (5 = stop), mouse click / hold = tap / long-tap.
- **Loop:** pack (3–5 slots), teleport home, loot counted at home.
- **Juice:** screen shake, square chunks flying, per-material dig resistance.
- **Dev panel** and **dive log** (see *Rules for Every Bundle* in the concept doc).
- **Any aspect ratio:** portrait shows deeper, landscape wider. The layout follows the window live (rotate the phone, resize the browser) so a single session covers several ratios.
- **Phone testing from day 1:** the dev build is reachable from a phone on the local network. The dev panel shows frame time, device pixel ratio, viewport size and input type.

**Out (later bundles or never):** darkness and glow, moon bugs, Demolitionist and Ghost, base, heat, raids, art beyond coloured squares.

**Decided 2026-09-25 (b1.1):**
- Zipline and torchlight are cut from b1.1. The Engineer is the baseline character: walk, mine, build, climb down. Zipline comes in b1.2, torchlight with b2's darkness. At a 2+ ledge you climb down or mine.
- Keyboard: both models, as in the concept doc. The numpad (or a single key press) sets an intent, like a swipe. WASD held moves with soft stops. A/B test them.
- Surface strip: 4 sky rows + 3 solid crust rows above the terrain, home at x = 0. There's no torchlight tap.
- Swipes use pointer events (mouse and touch share one recogniser) and commit at a distance threshold, not on release. A swipe made mid-tile is applied at the next tile boundary.
- Juice sits behind a master switch. Judge the stop rules with it off first (guide 02 §2.11).

## 3. Tunables

Current values live in `presets/`. Each build ships with the preset it was tested on.

| Tunable | Start value |
|---|---|
| Walk speed | 1 tile / tick unit (placeholder) |
| Dig speed | 3× slower than walking |
| Build cost | 1 ore per 12 tiles |
| Ledge stop height | 2+ tiles |
| Harmless drop (when stuck) | floor ≤4 below |
| Climb overhang limit | 45° |
| Stop rules | wall, 2+ drop (walking); open space, new material, loot (mining / building); hazard, junction (always). Each can be toggled |
| Swipe angle zones | horizontal ±30°, diagonals narrower |
| Teleport charge time | TBD |
| Pack slots | 3–5 |

## 4. Builds

| Build | Date | Link | Preset | Changes |
|---|---|---|---|---|
| b1.1 | – | – | – | first playable |

## 5. Playtest log

One file per session in `playtests/` (`YYYY-MM-DD_tester_device.md`): who, device, what you saw (don't explain, watch), the pasted dive log, quotes.

| Date | Tester | Device | Build | Summary |
|---|---|---|---|---|

## 6. Verdict and decisions

Filled in when the bundle ends: pass / kill, what was learned, and which decisions were copied back into the concept doc.
