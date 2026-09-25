---
id: p5
title: Darkness (b2)
started: 2026-09-25
status: building
budget: 3d
from: p4
dev: b2.html
build b2.1: 2026-09-25 · p5 · b2 Darkness: zoom, light and the seen map, the fog, the seismic probe (D049–D053)
---

# p5 · b2 · Darkness

The first half of Bundle 2 (Greed & Darkness) from the [concept doc](../../../concepts/spelunking_base.md), with one loadout: the Engineer from b1. You dig in the dark. Your light is the glow of what you carry, and a seismic probe shows what's inside the rock. No bugs, no noise and no other loadouts yet. b2 starts as a copy of b1.7, whose dig feel the user called done: "spelunking now genuinely feels unrestricted, well-controlled, intuitive and smooth".

## Question

Does darkness, with a light that grows with your loot and a probe that sees into the rock, turn digging into exploring?

**Pass:** you probe to decide where to dig, and follow what it shows; a fuller pack feels brighter and pulls you deeper; the dim map of what you've seen gets you back without thinking.

**Kill:** probing becomes a reflex every few steps, or is never used; the dark only hides the caves you want to see, and feels like a chore.

## Assumptions

1. [?] Standing still while the probe's rings spread is enough of a cost while there are no bugs: you probe to choose, you don't spam it.
2. [?] A light radius that grows with the ore and loot in the pack is felt, and pulls you on.
3. [?] Light that spreads only through air (it shows surfaces, never inside rock) reads naturally, and the probe is the way into the rock.
4. [?] The dim "seen" layer is enough to find your way; no map screen is needed yet.
5. [?] Fixed zoom steps (the pack's pixel-exact tile sizes) feel fine with the wheel and with a pinch.

## Limitations

- [constraint ?] One loadout (the Engineer), and darkness and the probe alone: no bugs, no noise.
- [cut] Moon bugs, noise, the Demolitionist and the Ghost, and the "why go home" drill: the rest of Bundle 2, after this.
- [cut] Soft light edges and glow: hard tile edges for now (user: "this is a prototype, not the game itself").
- [cut] A map screen or pause: the zoom levels are the map for now.

## Built

Built in steps, one at a time (the user's call: sequential sub-sessions with small scopes, not parallel ones):

0. The b2 bundle, forked from b1.7; this entry; decisions D049–D053.
1. Zoom (D050).
2. Light and the seen map in the sim (D051, D052).
3. The darkness drawn (D052).
4. The probe (D053).
5. The build check, and b2.1 frozen.

**Zoom (step 1, D050):**
- The tunable `view.zoom` is an index into the 11 sizes, or −1 for the default: about 24 tiles across the short side, so 30 px on a 1280×720 window.
- **Wheel:** one level per notch, and a trackpad's small steps add up to one level per 100 px. A trackpad pinch (ctrl+wheel) works the same.
- **Pinch:** one level per ×1.25 change in the distance between the two fingers.
- A second finger drops the first finger's pending tap, swipe or teleport. A swipe already made still ends its hold when you lift.
- The browser never zooms the page, and the zoom is remembered per browser.
- **Planks:** their treads are drawn from a list kept up to date as you build and mine, instead of a scan of every visible tile each frame. The pixels are identical.

Claude's calls, not discussed:
- A finger that swiped and got a second finger within 0.2 s stays a flick.
- A new finger added to a pinch starts a fresh pinch.

Known: near the surface, the camera's existing clamp makes the view jump when you zoom.

**Light and seen in the sim (step 2, D051, D052):** ruleset `b2.1` = b1.7 + `light: { base 4, orePer 16, lootPer 8 }`. A new keeper module, `src/sim/dig/light.js`, holds the radius, computed in whole numbers from the pack, and the lit cells.
- **How the light spreads:** it floods 4-connected through open cells within dx² + dy² ≤ r², wrapping at the world's edge. It also lights the rock cells 8-bordering those, if they're in range.
- **Seen:** the game keeps a `seen` map, which only grows, plus the current `lit` list and radius, and emits a `seen` event for newly seen cells. The `reveal()` helper is ready for the probe.
- **Cost:** the lit cells are recomputed only when your cell, the radius or the world changes, about once a step, in 20–60 µs on a desktop.
- **Without `light`,** as in every b1 ruleset, none of it runs, and every example gives the same result.
- **Tests:** 17 light tests on ASCII maps, and the determinism test covers the seen map.

Claude's calls, not discussed:
- The surface cells are fixed at the start, and always lit.
- The light spreads on the tick a wall is mined, before you step in.
- Distance across the wrap edge is the short way round.

Known: `?rules=lab` (a Rule Lab ruleset) has no `light`, so it plays without darkness.

**The darkness drawn (step 3, D052):**
- A fog overlay, 1 px per tile, the size of the world, drawn over the world and the plank treads and under the character, debris and cues.
- **Never seen** is opaque black, **seen** is black at 65% alpha, **lit** is clear.
- It's built from the seen map at the start, then updated only from `seen` events and when the lit list changes, by merging the old and new sorted lists.
- The dev panel's readout shows `light r N`.
- **Cost:** the CPU per frame barely changes, but the second full-screen blit adds about 1.5 ms of fill in headless Chromium. It's untested on the A41.

Claude's calls, not discussed:
- The lit diff runs at the start of a frame, so several changes in one frame cost one update.
- A per-cell "clear now" flag keeps the surface from being dimmed at the start.

Known: the dim level on dark tiles (hard rock, cave air) is barely distinguishable from black; worth a look on a real screen.

**The probe (step 4, D053):**
- **The rule:** in ruleset b2.1, the ↓ row `onFloor` is now the meaning `probe`. It comes after the plank rows and after `ledgeAhead → climbOver`, so the ledge still wins. b1.7 still refuses there.
- **Numbers:** `numbers.probe = { flick 2, hold 4, ringTicks 5 }`, in a new keeper module, `src/sim/dig/probe.js`. Ring r reveals the cells with (r−1)² < dx² + dy² ≤ r².
- **Timing:** at radius 4, a flick runs 6 rings in 30 ticks and a hold 8 rings in 40 ticks (0.67 s).
- **While it runs:** the character stands still, and the run ends with an always-on stop, `probe`, which shows no cue.
- **On screen:** up to 4 thin rings fading around the character, and a low ping per ring.
- **Tests:** 21 probe tests on ASCII maps.

Claude's calls, not discussed:
- A new swipe during a probe counts as letting go of the probe's hold. The swipe then runs after the probe.
- A teleport ends a probe at once. It's the only thing that does.
- Ring 1 comes on the probe's first tick.

## Feedback

None yet.

## Conclusion → next

Open.

- Next package, designed with the user after playing b2.1 and not built yet: [tamed bugs mine for you, loot is carried home](next-bugs.md). It changes the probe's centre and turns ↑ into rock into a ceiling probe, so D053 and D043 change when it's built.
