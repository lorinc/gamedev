# 2026-09-25 · Lorinc · desktop

- **Build:** b1.1 (first playable, commit `2054adc`), then fixes on the dev server, frozen as b1.1 (`12146ee`)
- **Device:** desktop, Chromium, keyboard + mouse
- **Source:** written on 2026-09-25 from the session notes; the quotes are Lorinc's words with minimal spelling and grammar fixes.

## What was seen

- The character mined into chasms and walked out over the void.
- It stopped at a 2-deep drop and refused to step off, although `harmlessDrop` is 4.
- Going diagonally down into a chasm, then down: the character climbs into the hole, clings to the rock it stood on, and stops (`overhang`). It looks like standing on air.

## Quotes

> TBD: We have not covered the use case where the char digs into a chasm. What's up with the 4 slots? Is that the inventory?

> Feedback:
> - The char should mine first, then check if the newly mined place is a viable location, and only then move there if it IS. This would prevent digging into chasms.
> - Remove the ability to dig straight down.

> The char does not step off an edge if there are 2 empty spaces below, although harmlessDrop=4.

> Tap and long-tap should work with '5' on the numeric keyboard.

> If I dig down diagonally into a chasm, the engine allows me to push the `down` button and stand over the chasm. I think the engine thinks I'm in the `climbed down, got stuck` situation, right?

## Dive log

Not captured in this session.

## What changed because of it

- Mine first, then look. No digging straight down. Step off by asking. All three have ASCII-map tests (`src/sim/dig/dig.test.js`).
- Numpad 5: tap = stop, hold = teleport, with a charge ring.
- Open: the chasm-cling bug (see Conclusion → next in the entry).

## Later the same day · live dev (seed-7727 terrain, zoomed out 3×)

> I created two screenshots …, where the char stops at a 1-step-down location where it should not stop. I have seen this in other locations as well. My assumption is that the char reacts to what used to be in that spot, not what's there right now.

> That's NOT what I said. Not what was there a moment earlier. What was there originally.

- **Found:** the terrain logic was right: sim, renderer and rules share one world, and digging changes it in place. The stops came from the stop rules. **junction** read an open cave above the step-down cell as "a shaft overhead". **open** fires when mining breaks out of rock.
- **Changed:** junction now needs rock on both sides of the shaft (D024). Mining break-out still stops, by choice ("walk on only when walking").
- **Not added:** an on-screen stop reason (the user said no; the dive log already counts the reasons).

## After closing · b1.2 (live)

> Terrain traversal is clumsy for a few reasons:
> - There's no way to dig a 1-block-high ledge.
> - There's no way to build a ramp down to the right, then go left (there's no stairs-type block where the char can decide to walk up or go straight).
>
> - The backpack is very limiting, which is okay for a game balanced like Dome Keeper, but not for this game, where resources are used at a much larger scale. I want the current backpack to stack 32 materials per slot, and to collect all 4 kinds of materials currently in the game. Add these as TODOs to the current live build.
>
> My 'gut feeling' is that for this game to become an impulse-fun engine, it must become a semi-idle 'terrain tamer', where you traverse the terrain, remove fog from resources, create pathways, and your idle robots, tamed animals, whatever your char has, gradually mine the resources available within reach of those pathways.

- **Recorded as TODOs in the live code:** the 1-high ledge and stairs block in `src/sim/dig/rules.js`, to be designed as rules in p4. The pack (32 per slot, all 4 materials) in `src/sim/dig/game.js` and `tunables.js`.
- **Direction (not decided):** a semi-idle "terrain tamer". You traverse, lift the fog off resources and cut pathways, and your robots or tamed animals gradually mine whatever is in reach of those pathways. This pulls the concept's b3 idea ("it mined while I was gone") forward and makes it the core loop. It would also change what the pack is for.

> The tamer loop test is limited by the clumsiness of terrain traversal. Also, we need a visual signal for why something does NOT happen, because everything that felt like a bug was indeed a misinterpreted feature. So: when the char wants to place a block but there's no material, flash the placed block AND the backpack in transparent red, signalling "I tried, can't do".

- **Order kept:** p4 · Rule Lab first. The terrain-tamer test waits until traversal is fixed.
- **Built in the live b1 (D027):** a refused build (`noOre`) or loot pickup (`packFull`) reports the cells it tried, and those cells and the backpack flash red: two blinks, fading over 0.7 s.
