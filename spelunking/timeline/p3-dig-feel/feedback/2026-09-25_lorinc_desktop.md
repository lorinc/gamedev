# 2026-09-25 · Lorinc · desktop

- **Build:** b1.1 (first playable, commit `2054adc`), then fixes on the dev server, frozen as b1.1 (`12146ee`)
- **Device:** desktop, Chromium, keyboard + mouse
- **Source:** written on 2026-09-25 from the session notes; the quotes are verbatim.

## What was seen

- The character mined into chasms and walked out over the void.
- It stopped at a 2-deep drop and refused to step off, although `harmlessDrop` is 4.
- Going diagonally down into a chasm, then down: the character climbs into the hole, clings to the rock it stood on, and stops (`overhang`). It looks like standing on air.

## Quotes

> TBD: We have not covered the usecase, when the char digs into a chasm. What's up with the 4 slots? That's the inventory?

> feedback:
> - the char should mine first, then check if the newly mined place is a viable location, and only then move there if it IS. This would prevent digging into chasms.
> - remove the ability of digging straight down

> char does not step off an edge if there's 2 empty spaces below, although the harmlessDrop=4

> tap and long-tap on numeric keyboard should work with numeric keyboard '5'

> if I dig down diagonally into a chasm, the engine allows me to push `down` button and stand over the chasm. I think, the engine thinks, I'm in the `climbed down, gut stuck situation`, right?

## Dive log

Not captured in this session.

## What changed because of it

- Mine first, then look. No digging straight down. Step off by asking. All three have ASCII-map tests (`src/sim/dig/dig.test.js`).
- Numpad 5: tap = stop, hold = teleport, with a charge ring.
- Open: the chasm-cling bug (see Conclusion → next in the entry).

## Later the same day · live dev (seed-7727 terrain, zoomed out 3×)

> created two screenshots …, where the char stops at a 1-step-down location, where it should not stop. I have seen this in other locations as well. My assumption, that the char reacts to what used to be in that spot, not what's there right now.

> That's NOT what I said. Not what was there a moment earlier. What was there originally.

- **Found:** the terrain logic was right: sim, renderer and rules share one world, and digging changes it in place. The stops came from the stop rules. **junction** read an open cave above the step-down cell as "a shaft overhead". **open** fires when mining breaks out of rock.
- **Changed:** junction now needs rock on both sides of the shaft (D024). Mining break-out still stops, by choice ("walk on only when walking").
- **Not added:** an on-screen stop reason (the user said no; the dive log already counts the reasons).
