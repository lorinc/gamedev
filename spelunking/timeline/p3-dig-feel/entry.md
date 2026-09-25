---
id: p3
title: Dig Feel (b1)
started: 2026-09-24
ended: 2026-09-25
status: concluded
budget: 3d
from: p2
cover: media/cover.png
build b1.1: 2026-09-25 · first playable, plus the first-play rules (mine then look, no digging down, step off by asking) and numpad 5
build b1.2: 2026-09-25 · closing build: seed-7727 terrain, zoomed out 3×, junction only at real side passages (D024), settings store only what you changed
---

# p3 · b1 · Dig Feel

The first playtest bundle for Spelunking Base. The world is the v3 terrain from [p2](../p2-atomic-terrain/entry.md). The design itself lives in the [concept doc](../../../concepts/spelunking_base.md). This entry records what was built, tuned and learned.

## Question

Does "move until something changes" feel good **on every target setup**, and do I want another dive?

Every game must run in portrait, landscape and square, with touch and with mouse / keyboard. So b1 tests the feel across all of them, not on one favourite setup.

| Setup | Input | Ratios |
|---|---|---|
| Samsung Galaxy A41 (2020, the performance floor) | touch | 9:16, 16:9 |
| New HD phone | touch | 9:16, 16:9 |
| Desktop, HD monitor | mouse + keyboard | 16:9, 1:1, 9:16 (resized window) |

**Pass:**
- You instinctively start another dive, on every row of the matrix.
- "Push through the hard rock, or recall?" feels like a choice.
- Swipes on the phone neither overshoot nor feel twitchy.
- The old phone doesn't visibly hitch, and the frame-time readout in the dev panel agrees.
- It's sharp on the HD screens (drawn at the device pixel ratio) and readable on the small one.
- Portrait shows enough depth to plan a dive, and landscape doesn't feel like wasted space.

**Kill:** if it's still boring after tuning the stop rules, rethink movement before anything else. If it only feels good on one input or one ratio, that input or ratio gets redesigned before b2.

**Time box:** 3 days. Running over means cutting features, not extending the deadline.

## Assumptions

1. [?] "Move until something changes" (swipe, and the character walks, mines or builds until the environment changes) is fun enough that you start another dive without thinking.
2. [✗] A mining step can move you into whatever it opens up. First play: tunnels walked the character into chasms. Now it mines first and then looks.
3. [✗] Every direction should be diggable, including straight down. Removed after first play: the way down through rock is the diagonal staircase.
4. [✗] Walking stops at every drop of 2+, and that's all you need at a ledge. First play: you couldn't step off a 2-deep drop even though it's harmless. Swiping into the gap again now drops you.
5. [✗] Climbing down at a ledge is always a safe move. Going diagonally down into a chasm and then pressing down leaves you clinging over the void and stuck. Clinging is also drawn exactly like standing. The fix is open (see below).
6. [?] One swipe recogniser (pointer events, commit at a distance) feels the same on touch and on mouse.
7. [?] The keyboard feels as good as swiping, both with numpad intents and with held WASD.
8. [?] Canvas2D with no dependencies runs without hitching on the Galaxy A41.
9. [?] Stop rules as a tunable table (wall, drop, open space, new material, loot, hazard, junction) can make the movement feel right without new mechanics.

## Limitations

- [constraint ?] Coloured squares only: no art, and no effects beyond the juice. If it's fun as squares, art can only lift it.
- [constraint ?] Casual, not survival: no fall damage, and a wrong move never ends a dive (D011).
- [constraint ?] Everyone is an Engineer: one path, no loadouts to choose between (D014).
- [constraint ?] No digging straight down: the way down through rock is the diagonal staircase. It was cut after first play, to see if the loop gets sharper without it (D019).
- [constraint ?] Everything is lit: no darkness, so digging is judged on its own before b2 adds greed.
- [cut] Zipline: moved to b1.2 (D014).
- [cut] Torchlight: moved to b2, where darkness arrives (D014).
- [cut] Moon bugs, Demolitionist and Ghost, the base, heat and raids: later bundles.

## Built

**World:** the v3 terrain (the recipe archived in p2, live = cave), wrapping horizontally, with a surface strip on top and a home spot. The strip is 4 sky rows + 3 solid crust rows, and home is at x = 0.

**Character:** 1 tile tall in the sim, drawn about 1.3 tiles. Everyone is an Engineer: walk, mine, build, climb down. The zipline is cut from b1.1 and comes in b1.2. Torchlight comes with b2's darkness.

**Swipes by context** (8 directions; a new swipe replaces the current intent):
- **Open floor:**
  - Left / right walks, following the floor over 1-tile steps up and down without stopping.
  - Diagonal mines or builds.
  - Down does nothing.
- **At a wall:** a swipe into the wall mines until the environment changes. Diagonal mines or builds.
- **At a ledge (a drop of 2+):**
  - A swipe into the gap drops you if the floor is within `harmlessDrop`.
  - Down climbs down: overhangs up to 45°, drop if the floor is ≤4 below.
- **Mine or build:** rock is mined, air is built (1 ore per 12 tiles).

**Taps and keys:**
- Tap the character to stop. Long-tap charges the teleport home.
- WASD: two keys together make a diagonal.
- Numpad 1–9: 5 = tap (stop); hold 5 = long-tap (teleport, with a charge ring).
- Mouse click / hold = tap / long-tap.
- Swipes use pointer events, so mouse and touch share one recogniser. A swipe commits at a distance threshold, not on release. A swipe made mid-tile applies at the next tile boundary.

**Loop:** a pack with 3–5 slots, teleport home, loot counted at home.

**Juice:** screen shake, square chunks flying, per-material dig resistance, all behind a master switch. The stop rules are judged with juice off first.

**Any aspect ratio:** portrait shows deeper, landscape wider. The layout follows the window live.

**Dev panel:** backtick, or tap the top-left corner. It shows every tunable, frame time, device pixel ratio, viewport and input type. The **dive log** is copyable, so testers can paste it back.

**Rules decided at first play (2026-09-25):**
- **Mine first, then look (D020).** A mining step moves into the mined cell only if you can stand there: it has a floor, or a 1-tile step down to one. Tunnels never walk you into a chasm.
- **Step off by asking (D018).** Walking still stops at every drop of 2+. Swiping into the gap again drops you to the floor if it's within `harmlessDrop` (default 4), and the walk then continues. A deeper gap stays a ledge.
- **No digging straight down (D019).** A down swipe only climbs over a ledge on the facing side, or continues a climb.
- **Junction means a real side passage (D024).** Walking out of a tunnel into an open cave no longer stops at the step down. A narrow shaft overhead still stops a walk, and breaking out of rock by mining still stops.

**Tunables** (current values in `presets/`):

| Tunable | Start value |
|---|---|
| Walk speed | 1 tile / tick unit (placeholder) |
| Dig speed | 3× slower than walking |
| Build cost | 1 ore per 12 tiles |
| Ledge stop height | 2+ tiles |
| Harmless drop | floor ≤4 below |
| Climb overhang limit | 45° |
| Stop rules | wall, 2+ drop (walking); open space, new material, loot (mining / building); hazard, junction (always). Each can be toggled |
| Swipe angle zones | horizontal ±30°, diagonals narrower |
| Pack slots | 3–5 |

**Out (later bundles or never):** darkness and glow, moon bugs, Demolitionist and Ghost, base, heat, raids, and art beyond coloured squares.

## Feedback

- [2026-09-25 · Lorinc · desktop](feedback/2026-09-25_lorinc_desktop.md), first play of b1.1: "the char should mine first, then check if the newly mined place is a viable location". Three rule changes, numpad 5, and the chasm-cling bug.
- Phone (Galaxy A41) and the other ratios: not played yet. This is waiting on the public repo for the phone link.

## Rules at close

The rules as they stood in b1.2, when this playtest closed. They live in code (`src/sim/dig/rules.js` + `src/bundles/b1/tunables.js`). p4 turns them into data.

**What a swipe does** (Engineer, 1 tile tall, never falls: it stands on a floor or clings to a wall):

| Swipe | Situation | Action |
|---|---|---|
| ← → | next cell open, with a floor | walk |
| ← → | next cell open, floor 1 below | step down 1, keep walking |
| ← → | next cell open, deeper gap | a running walk stops (`ledge`); a fresh swipe drops you if the floor is ≤ `harmlessDrop`, else blocked |
| ← → | next cell rock, headroom above you and it | step up 1, keep walking |
| ← → | next cell rock | mine it; step in only if it has a floor or a 1-step down (mine first, then look) |
| ↓ | standing, a ledge on the facing side | climb down over it |
| ↓ | standing, anything else | nothing (no digging straight down) |
| ↓ | clinging | climb down; follow an overhang up to 45°; past that, drop if the floor is ≤ `harmlessDrop`, else stuck (`overhang`) |
| ↑ | anywhere | nothing (straight up is the Ghost's) |
| ↗ ↖ | standing | mine the headroom and the target, build a step under the target if it's air, walk up |
| ↘ ↙ | standing | mine the cell beside you; target rock: mine it, step only onto a floor; target air: build a floor under it (ore) and step |
| any diagonal | clinging | nothing (`noFooting`) |
| any | pack full / out of ore for building | nothing (`packFull` / `noOre`) |

**Stop rules** (a run of steps goes on until one fires; a blocked action always stops):

| Rule | Stops the run when | b1.2 |
|---|---|---|
| `wall` | walking turns into mining (you reach rock) | on |
| `open` | the action changes to anything but mining: typically you break out of rock into open space, or a walk turns into building | on |
| `loot` | the next tile to mine is ore or loot | on |
| `harder` | the next tile is slower to mine than the last | on |
| `junction` | walking or tunnelling under a real side passage: a shaft with rock on both sides (D024) | on |
| `ledge` | the next walk step would drop (always; only a fresh swipe steps off) | always |
| `floor` | a climb reaches the ground | always |

**Numbers** (ticks at 60 per second):

| Tunable | b1.2 |
|---|---|
| walk / climb / fall per tile / build per tile | 7 / 10 / 3 / 14 |
| mine soft / hard / ore / loot / built | 14 / 42 / 21 / 14 / 7 |
| harmless drop | 4 tiles |
| pack slots | 4 |
| tiles built per ore | 12 |
| swipe commits after | 24 CSS px; horizontal ±30°, vertical ±25°, the rest diagonal |
| teleport charge | 700 ms |
| view | 48 tiles across the short side, lookahead 3 |
| terrain | seed-7727 recipe, 384×64 + a 7-row surface strip |

## Conclusion → next

Closed on 2026-09-25 without a full verdict. Lorinc: "This is getting enjoyable, still a lot to improve". Every rule change so far was a change to the swipe table or the stop rules above, and each one needed code. Those rules are the game feel. So the next prototype makes them data, with a visual editor: [p4 · Rule Lab](../p4-rule-lab/entry.md).

- Not tested: the phone matrix (Galaxy A41, HD phone, portrait / landscape). The open assumptions (1, 6–9) and every constraint stay open. They carry over to the next dig playtest, which will run on p4's rule files.
- Carried over, open: the chasm-cling bug (clinging is drawn like standing, and a climb into a chasm gets stuck); how to cross or descend chasms (the zipline was planned for b1.2).
- Decisions: [D014–D022, D024–D026](../decisions.md).
