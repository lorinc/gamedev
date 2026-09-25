# 2026-09-25 · Lorinc · desktop

- **Build:** live dev @ `0bdeae3` (b1 on the Rule Lab's ruleset, `b1.html?rules=lab`, still the b1.2 rules)
- **Device:** desktop, Chrome, mouse
- **Source:** the dive log and two screenshots; the quotes are Lorinc's words with minimal spelling and grammar fixes.

## What was seen

- A staircase dug with ↙ from the surface into the cave, then walking up and down it.
- At the top, the run stopped with the red "I tried, can't do" flash on the surface cell beside the character. Later runs didn't stop there.

## Quotes

> At the end of this dive log, I was walking up and down on a slope. In the beginning, I was stopped by something at the top. And after 2–3 tries, that "something" did not stop me anymore. This IS a bug, let's find the reason.

> Okay, we need a bug report system that removes the guesswork from any report.

## Dive log

```
b1.1 rules b1.2 #1 59.0s ore 0 loot 0 depth 12 mined 11 built 0 | noOre:5 floor:1 wall:4 open:1 down:3 | preset d6525b
```

## The reason

- The red cell was the step ↗ would build at the top of the stairs, where they end in open air. A 45° swipe along the stairs reads as ↗. ↗ walks up an existing staircase, and at the top, going on would mean building. With no ore that's `noOre`, which accounts for the 5 in the log.
- The later tries were flatter swipes (within 30° of horizontal), which read as →. → walks up the stairs and on along the surface. Nothing in the world changed between the tries: they were two different swipes.
- The bug: with ore, the same run would have stopped quietly at the top (the `open` stop rule: a walk turning into building). Without ore, the refusal fired before the stop rules could, so the flash said "I tried" about something the run would never have done.

## What changed because of it

- D030: a `noOre` / `packFull` refusal in the middle of a run gives way to the stop the run would have made anyway. A quiet stop has no tried cells, so there's no flash. Asking again with a fresh swipe still refuses and flashes. The new example `stairs-end` covers it, and `loot-pack` and `stair-into-chasm` were updated.
- D031: the 🐞 bug report (the button bottom-left, or the B key) copies the last events. Replay a report with `npm run replay -- report.txt`, or open it in the Rule Lab with "paste bug report".

## Later: stuck above a chasm (bug report, tick 1222)

> I want to change some situation > intent > effect rules concerning the situation when the char is climbing on a wall above a chasm.

> Any mining is allowed. And every time the char finds itself in a situation where, after the mine-check-move concluded, it is standing in open space with nothing to hold on, it falls. And if it falls more than the allowed safe threshold, it teleports home.

- Seen in the report: after ↓ climbed over the staircase's last step, every way back up refused: ↗ (`noFooting`), ↑ (`up`).
- Changed: ruleset b1.3 (D035), with the examples `cling-climb-back`, `cling-mine-hold`, `cling-fall-home` and `cling-mine-down`.

## Later: a staircase at a tunnel crossing (bug report, tick 7166)

> In the next session, we will address the staircase problem. This is a prime example of when I need a staircase built instead of a solid wall.

- Seen in the report (the replay matches exactly):
  1. ↙ mined a diagonal tunnel down from (370,7).
  2. From (363,14), ↘ mined a second diagonal down to (368,19), crossing the first in an X.
  3. ↖ walked back up to the crossing.
  4. ↗ then built its step at (364,14). That cell is the top of the ↘ tunnel, so the crossing now has a solid Built block in it, and the ↘ tunnel is plugged.
- What's wanted: the stair block (D029). ↗ climbs onto it, and ↘ still walks through it.
- The report's `EXAMPLE` line (`report-6659`, start pack soft 16 + soft 12) is the starting point for the stairs example (R8). The full report is in the user's `temp/2026-09-25_stairs-report-tick7166.txt`, which is local and not in the repo.
- Changed: D039 (planks), with D040–D043 from the same design session: ruleset b1.6. The crossing is the example `plank-crossing`: ↗ asks, lays a plank at (364,14) and climbs the ↙ tunnel, and ↘ still runs down its own tunnel under the plank.
