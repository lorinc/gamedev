# b1 · Dig Feel

Design source: *Playtest Bundles → Bundle 1* and *Controls & Genre* in [spelunking_base.md](../../../concepts/spelunking_base.md). The concept doc is the original; this doc records what was built, tuned, and learned.

## 1. Question and criteria

**Question:** does "move until something changes" feel good, with keys and with swipes, and do I want another dive?

**Pass:**
- You instinctively start another dive.
- "Push through the hard rock, or recall?" feels like a choice.
- Swipes on the phone neither overshoot nor feel twitchy.

**Kill:** still boring after tuning the stop rules → rethink movement before anything else.

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
- **Any aspect ratio:** portrait shows deeper, landscape wider.

**Out (later bundles or never):** darkness and glow, moon bugs, Demolitionist and Ghost, base, heat, raids, art beyond coloured squares.

**Open before building:**
- Torchlight has nothing to reveal until b2's darkness. Default: keep the tap, show the beam, no gameplay effect yet.
- Surface strip size and home position. Default: 4 sky rows + 3 solid crust rows above the terrain, home at x = 0.

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
