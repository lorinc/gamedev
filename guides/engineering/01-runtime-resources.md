# 01 · Runtime resources on low-end mobile

How to keep a small Canvas2D game fast, cool and light on a budget phone. Written for a solo dev who ships one small browser game a month: plain JS modules, no build step, no dependencies, a fixed 60 Hz sim with interpolated rendering, pixel art drawn from a 1-px-per-tile offscreen canvas. Floor devices: **Samsung Galaxy A41** (2020) and **iOS 14 Safari**.

Researched 2026-09-25. Sources are linked inline and listed at the end. Where a number is folklore or my own arithmetic, it says so.

**How to read this:** every practice has a label.

| Label | Meaning |
|---|---|
| **must** | Cheap, and skipping it breaks something real on the floor devices or on portals. Do it in every game. |
| **worth it** | A few lines, clear payoff. Do it when you touch that code. |
| **later** | Only when a measurement on the A41 says so. Write down the trigger, not the code. |
| **skip** | Wrong size of solution for tiny games. |

Overengineering is the main failure mode here. A 60 fps pixel-art game with a few hundred draw calls per frame is well inside what a 2020 budget phone can do. Most of the "must" items below are about **correctness under odd frame rates** and **not burning battery when nobody is playing**, not about raw speed.

---

## 1. TL;DR

1. **The sim speed must not depend on the rAF rate.** Portals run your game in a cross-origin iframe, and Safari throttles rAF there to 30 fps until the first tap ([WebKit bug 170534](https://bugs.webkit.org/show_bug.cgi?id=170534)). iOS Low Power Mode also caps rAF at 30 fps ([WebKit bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745)). 120 Hz Android phones call rAF twice as often. A fixed-step accumulator handles all three.
2. **Clamp the accumulator** so a long frame can't trigger a spiral of death. Gaffer on Games clamps at 250 ms ([Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)); anything from 100–250 ms is fine.
3. **Cap devicePixelRatio.** The A41 renders about 2.6 million pixels per frame at native DPR. Capping at 2 cuts that to 58%. CrazyGames forces DPR 1 on iOS and low-memory Android for Unity games ([CrazyGames technical requirements](https://docs.crazygames.com/requirements/technical/)); PlayCanvas documents the same fill-rate problem ([PlayCanvas DPR](https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/)).
4. **Stop everything when hidden or paused.** rAF already stops in hidden tabs ([MDN rAF](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)). Web Audio doesn't: suspend the `AudioContext` yourself ([MDN suspend](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend)).
5. **Allocation per frame is fine in small amounts.** A few short-lived objects per frame are what V8's young-generation GC is built for ([V8 blog](https://v8.dev/blog/orinoco-parallel-scavenger)). The rule is: **nothing allocated per tile or per entity per frame**. Object pools are a skip.
6. **Cache what depends on rare inputs** (layout on resize, colour strings per palette entry, fonts). Don't cache what's cheap to recompute.
7. **Canvas memory on iOS is capped.** A single canvas can't exceed 16,777,216 pixels (4096 × 4096), and total canvas memory is capped too (384 MB on iOS 15, lower before) ([PQINA](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/)). Keep a fixed, small set of canvases.
8. **Size is not your problem.** Poki's guidance is ≤5 MB initial and ≤8 MB total ([Poki engine guide](https://developers.poki.com/guide/web-engine)); CrazyGames wants ≤20 MB initial for its mobile homepage. A no-dependency JS game with synthesized sound is well under 1 MB.
9. **iOS 14.0–14.4 has no unprefixed `AudioContext`.** It arrived in Safari 14.1 / iOS 14.5 ([WebKit 14.1 post](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)). Use `window.AudioContext || window.webkitAudioContext`.
10. **Measure on the A41, not in DevTools emulation.** CPU throttling in DevTools slows the CPU; it doesn't give you a weak GPU or a hot phone. The frame budget to aim for is ~10 ms of your own work per frame ([web.dev RAIL](https://web.dev/articles/rail)).

---

## 2. Per-frame work

### 2.1 Allocation and GC pressure

**What:** every `{}`, `[]`, closure, template string or spread in the render loop creates garbage. When enough piles up, the GC runs, and a long GC pause shows as a dropped frame. The classic article on this is Colt McAnlis' [Static Memory JavaScript with Object Pools](https://web.dev/articles/speed-static-mem-pools) (2013), which describes the "sawtooth" memory graph.

**What's changed since 2013:** V8 is generational. New objects go into a small nursery (up to 16 MiB in V8), which is collected often and cheaply, now in parallel across cores, "even on low-end mobile devices" ([V8 blog, Orinoco parallel scavenger](https://v8.dev/blog/orinoco-parallel-scavenger)). Objects that die within the frame are the cheapest kind. So the 2013 advice ("pre-allocate everything, pool everything") is too strong for a small game. I found no primary source giving a safe "allocations per frame" number; any figure you see is folklore.

**What matters is the scale.** Ten small objects per frame is noise. Ten per tile on screen (a 30 × 60 view is 1800 tiles) is 18,000 per frame, and that will show on the A41.

| Practice | Label | Why |
|---|---|---|
| No allocation inside per-tile or per-entity loops in `draw` (no `{x, y}` returns, no `[...arr]`, no template strings, no closures created inside the loop) | **must** | This is the only allocation that scales with the world; everything else is constant and small |
| Build colour strings once per palette entry (`const TILE_CSS = TILE_RGB.map(css)`), not with `` `rgb(${r},${g},${b})` `` per draw call | **worth it** | One-line change; removes string building from the hottest loop |
| A few per-frame closures, small objects or a template-string font at the top of `draw` | fine | The young-generation GC handles this; rewriting it costs clarity for nothing measurable |
| `Math.max(...arr)`, `arr.shift()` on a debug readout | fine | Only when the panel is open; 60 elements |
| Object pools, pre-allocated vector classes | **skip** | Solves a problem these games don't have; adds release bugs. Revisit only if the Performance panel shows GC in dropped frames |
| Particle systems: fixed-size typed arrays or a fixed array of reused records | **later** | Only when a game has hundreds of particles |

**How to check:** in the Chrome Performance panel, tick "Memory" and record 10 s of play. A flat-ish JS heap line with small regular dips is fine. Tall sawteeth with "Minor GC" or "Major GC" blocks inside the red dropped frames are the problem ([Chrome DevTools performance](https://developer.chrome.com/docs/devtools/performance)).

### 2.2 Cache derived values until their inputs change

**What:** layouts, font strings, gradients, `Path2D` objects and text measurements often depend only on screen size, zoom or a setting. Compute them when those inputs change, not every frame.

The simple pattern is a key string. If the key matches last frame's, reuse the result:

```js
let cache = null
function layoutFor(tp, bh) {
  const key = tp + ' ' + bh
  if (cache && cache.key === key) return cache.value
  cache = { key, value: computeLayout(tp, bh) }
  return cache.value
}
```

(The key string itself is a small per-frame allocation. That's fine; see 2.1.)

| Practice | Label | Why |
|---|---|---|
| Layout computed on resize or zoom change, not per frame, when it involves loops or many allocations | **worth it** | Easy with a key; avoids work that scales with UI complexity |
| Gradients (`createLinearGradient`/`createRadialGradient`) created once per size and reused | **worth it** | Gradients are objects with colour stops; recreating per frame is pure waste. Needed once b2 adds a light radius |
| `measureText` results cached per string and font | **worth it** | Text is expensive in canvas; MDN's advice is to "avoid text rendering whenever possible" ([MDN Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)) |
| Pre-render static text (score labels, titles) to a small offscreen canvas | **later** | Only when text shows up in the profile |
| Memoize cheap arithmetic | **skip** | The cache check costs as much as the maths |

### 2.3 Canvas state changes and batching

**What:** each `fillStyle` assignment, `save`/`restore`, `font` change and path call has a cost. The old advice is to group draws by colour ("draw all stripes of one colour, then switch"), to batch shapes into one path, and to avoid `shadowBlur` entirely ([web.dev canvas performance](https://web.dev/articles/canvas-performance), Boris Smus, 2011; [MDN Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)). The 2011 article predates GPU-accelerated canvas on Android, so its measured speedups don't carry over as numbers. The direction still holds.

| Practice | Label | Why |
|---|---|---|
| No `shadowBlur`, no `filter` on the per-frame canvas | **must** | Called "very expensive" by both sources, and a glow can always be pre-rendered |
| Don't set `fillStyle`/`font` to the same value in a tight loop; set it once before the loop when all items share it | **worth it** | Free when you write the loop; setting a style parses a colour string |
| `save`/`restore` only around code that changes transform, clip or alpha; not per sprite | **worth it** | Each save copies the whole state; resetting two properties by hand is cheaper |
| Sort draws by colour to batch `fillRect` | **later** | For a few hundred rects per frame it won't show; do it if a profile shows fill calls dominating |
| Integer coordinates for `drawImage`/`fillRect` (`Math.round` or `| 0`) | **must** for pixel art | Sub-pixel positions force anti-aliasing (MDN), and for pixel art they also produce seams and blurry edges, which is the bigger reason |
| `getContext('2d', { alpha: false })` on the main canvas | **must** | One flag; the browser can skip blending with the page (MDN). Only valid if the canvas is opaque |
| `willReadFrequently: true` on any canvas you `getImageData` from every frame | **later** | Only if you add per-frame readback; better to not read back at all |

### 2.4 Offscreen canvases and pre-rendering

**What:** draw something complex once to a hidden canvas, then `drawImage` it each frame. Both MDN and web.dev recommend it; web.dev adds that the offscreen canvas must "fit snugly" around the content, because copying an oversized canvas costs fill-rate.

Your tile world already does the best version of this: one pixel per tile on a small canvas, updated with `fillRect(x, y, 1, 1)` only when a tile changes, and drawn scaled up with `imageSmoothingEnabled = false`. That's one `drawImage` for the whole world per frame, which is about as cheap as Canvas2D gets.

Note: the `OffscreenCanvas` *API* (for workers) is Baseline only since March 2023 ([MDN OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)), so not on iOS 14. Use a plain `document.createElement('canvas')` that's never attached to the page. That works everywhere.

| Practice | Label | Why |
|---|---|---|
| World tiles on a 1-px-per-tile canvas, patched on change, drawn with one scaled `drawImage` | **must** (already done) | Constant cost per frame regardless of how many tiles are visible |
| Pre-render sprites that are drawn from several shapes (character with backpack, glow sprites) into a small canvas per zoom level | **later** | Worth it once a sprite is 20+ calls or uses gradients; rebuild on zoom change |
| Multiple stacked `<canvas>` layers (static background, dynamic foreground) | **later** | Useful when a big part of the screen is static. In a scrolling game almost nothing is |
| `OffscreenCanvas` in a Web Worker | **skip** | Not on iOS 14, and the main thread isn't the bottleneck for games this size |

### 2.5 Dirty regions vs. full redraw

**What:** redraw only the rectangles that changed ([web.dev](https://web.dev/articles/canvas-performance) calls this the biggest win for mostly-static scenes).

For a game whose camera follows the character, nearly every pixel moves every frame while you're moving. Dirty-rect tracking then saves nothing and adds a class of "ghost pixel" bugs.

| Practice | Label | Why |
|---|---|---|
| Full redraw each frame for the play view | **must** | Simplest correct thing when the camera scrolls |
| Dirty-rect tracking on the main canvas | **skip** | No win with a moving camera; bugs guaranteed |
| Patch-on-change for the offscreen tile canvas | **must** (already done) | That's dirty-region rendering where it actually pays |
| Skip the whole draw when nothing changed (see §4.1) | **later** | Cheaper than dirty rects and covers the idle case |

### 2.6 `imageSmoothingEnabled`

Default is `true` (smoothed). Set it to `false` for pixel art ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled)).

The trap: **resizing a canvas resets its whole 2D context state**, including `imageSmoothingEnabled`, `fillStyle`, `font` and the transform. The HTML spec's "set bitmap dimensions" starts with "Reset the rendering context to its default state" ([HTML spec, canvas](https://html.spec.whatwg.org/multipage/canvas.html)). A game that turns smoothing off once at startup goes blurry after the first rotation.

| Practice | Label | Why |
|---|---|---|
| Set `imageSmoothingEnabled = false` either in every `draw`, or right after every resize | **must** | Otherwise rotation or a window resize silently blurs the art |
| Also set `imageSmoothingEnabled = false` on the offscreen canvases you draw *from* scaled | **must** | Same reason, same bug |
| CSS `image-rendering: pixelated` on the canvas element if you ever scale it with CSS | **worth it** | Supported since iOS Safari 10 ([caniuse](https://caniuse.com/css-crisp-edges)); only matters when backing size ≠ display size |

### 2.7 devicePixelRatio and canvas size

**What:** MDN's pattern is to set `canvas.width = cssWidth * devicePixelRatio` so the canvas is sharp on high-DPI screens, and notes that a 2× DPR canvas holds 4× the pixels ([MDN devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)). Every one of those pixels is cleared and filled each frame. On phones with big screens and weak GPUs, this fill-rate is the usual bottleneck. PlayCanvas: low and mid-tier devices with high-resolution screens get "low frame rates if device pixel ratio is enabled due to fill rate limitations of the hardware" ([PlayCanvas](https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/)). CrazyGames sets DPR 1 for iOS and low-memory Android on its Unity games ([CrazyGames](https://docs.crazygames.com/requirements/technical/)).

**The A41 in numbers.** Screen: 1080 × 2400, 6.1", Mali-G52 MC2 GPU, 4 or 8 GB RAM ([GSMArena](https://www.gsmarena.com/samsung_galaxy_a41-10138.php)). The repo's perf stub assumes a 411 × 913 CSS viewport at DPR 2.625; confirm by reading `devicePixelRatio` on the device. My arithmetic, at 4 bytes per pixel:

| DPR used | Canvas size | Pixels per frame | Backing store |
|---|---|---|---|
| 2.625 (native) | 1079 × 2397 | 2.59 M | ~10.3 MB |
| 2 (capped) | 822 × 1826 | 1.50 M (58%) | ~6.0 MB |
| 1 | 411 × 913 | 0.38 M (15%) | ~1.5 MB |

For pixel art the sharpness argument is weaker than for text: a 16-device-pixel tile is still crisp at DPR 2. Text and thin UI lines are what get soft.

| Practice | Label | Why |
|---|---|---|
| `dpr = Math.min(window.devicePixelRatio || 1, 2)` | **worth it** | One line, 42% fewer pixels on the A41, no visible loss for pixel art. Measure before and after on the device |
| Tile size in *device* pixels is an integer (`Math.round`) | **must** | Non-integer scaling gives uneven tile widths and seams |
| Recompute canvas size on `resize` only, never per frame | **must** | Setting `canvas.width` reallocates and resets the context |
| Adaptive DPR (drop to 1.5 or 1 when frame time is high) | **later** | Needs hysteresis and testing; do it only if the A41 misses budget at DPR 2 |
| Render at a fixed low internal resolution and CSS-scale up | **skip** for now | Nice retro look, but non-integer CSS scale factors on phones give uneven pixels, and it changes the whole art pipeline |

---

## 3. Frame pacing

### 3.1 Fixed timestep with an accumulator

**What:** rAF gives you a variable frame time. The sim consumes it in fixed steps (here 1/60 s), keeps the remainder in an accumulator, and the renderer interpolates between the last two sim states with `alpha = acc / TICK` ([Gaffer on Games, Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)). It's the only design that keeps a deterministic sim deterministic *and* smooth on screens that aren't 60 Hz.

Why it's a must on the web specifically, with sources:

| rAF rate | When | Source |
|---|---|---|
| 30 fps | Cross-origin iframe in Safari, until the user interacts with it. **Portals embed games in cross-origin iframes.** | [WebKit bug 170534](https://bugs.webkit.org/show_bug.cgi?id=170534) |
| 30 fps | iOS Low Power Mode (intentional since iOS 14, "the behavior in iOS 13 was a bug") | [WebKit bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745) |
| 60 fps | Safari on 120 Hz iPhones, by default; there's a feature flag to lift it | [MacRumors](https://www.macrumors.com/how-to/enable-smoother-120hz-browsing-in-safari/) (secondary) |
| 90/120/144 | Chrome on high-refresh Android and desktop: rAF "will generally match the display refresh rate" | [MDN rAF](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) |
| 0 | Hidden tab or hidden iframe | [MDN rAF](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) |

| Practice | Label | Why |
|---|---|---|
| Sim advances only in fixed ticks from an accumulator; nothing in the sim reads frame time | **must** | Otherwise the game runs at half speed in a Safari iframe or in Low Power Mode |
| Use the rAF `timestamp` argument, not a second `performance.now()` call, for frame time | **worth it** | MDN: using it prevents animations running "faster on high refresh-rate screens"; one clock, no drift |
| Cosmetic animation (juice, tweens) uses real `dt`, clamped | **must** | Else effects run at double speed at 120 Hz or half speed at 30 fps |
| Interpolate render state with `alpha = acc / TICK` | **must** (already done) | Without it, 60 Hz ticks on a 120 Hz or 90 Hz screen judder |

### 3.2 Spiral of death and max ticks per frame

**What:** if one frame takes long, the next frame owes many ticks. If running those ticks takes longer than the time they represent, the sim falls further behind each frame ("spiral of death", Gaffer). The fix is to clamp: Gaffer clamps frame time to 0.25 s. Clamping the accumulator to 100 ms caps work at 6 ticks per frame at 60 Hz.

When you come back to a tab after a minute, rAF resumes with a huge delta. The clamp turns that into "the game paused", which is what the player expects.

| Practice | Label | Why |
|---|---|---|
| Clamp `acc` (or frame time) to 100–250 ms before the tick loop | **must** (already done: 100 ms) | Prevents the spiral and the tab-return jump in one line |
| A separate "max N ticks per frame" counter | **skip** | Same thing as the clamp, twice |
| Measure the cost of one sim tick in Node; fail if it grows past a set fraction of 16.7 ms | **worth it** | The sim is pure and deterministic, so this is a cheap, stable test (§7.4) |

### 3.3 120 Hz displays

At 120 Hz, rAF fires every ~8.3 ms. Half the frames run zero ticks and only redraw with a new `alpha`, which is correct and looks smoother. The cost is that you render twice as often, doubling GPU and battery use for a game whose sim only changes 60 times a second.

| Practice | Label | Why |
|---|---|---|
| Make sure 120 Hz is *correct* (zero-tick frames don't break anything, juice uses `dt`) | **must** | Test once with DevTools or a 120 Hz phone |
| Cap rendering at ~60 fps by skipping rAF callbacks that come < ~12 ms after the last drawn frame | **later** | Saves battery on 120 Hz Android. The A41 is 60 Hz, so it doesn't help the floor device |

---

## 4. Battery and thermals

Phones throttle their CPU and GPU when they get hot. A game that runs fine for one minute can drop frames after ten. I found no primary source with numbers for the A41; treat "it gets slower after a few minutes" as something to test, not a figure.

### 4.1 Don't render when nothing can change

| Practice | Label | Why |
|---|---|---|
| Stop the rAF loop (don't call `requestAnimationFrame`) while a pause menu, results screen or ad is up; restart it on input | **worth it** | Small change; portals *require* a pause state around ads (Poki's `gameplayStop()`, [Poki requirements](https://developers.poki.com/guide/requirements-quality)), so the pause state exists anyway |
| In-game idle detection (character still, no animation → skip draw) | **later** | Most games always have something moving; the check is easy to get subtly wrong |
| No `setInterval`/`setTimeout` game loops | **must** | Chrome's docs: rAF "will wait for the page to be visible, so it doesn't use any CPU when the page is hidden"; timers keep firing, throttled ([Chrome timer throttling](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)) |

### 4.2 Hidden tab, app switch, audio

rAF stops by itself when the page is hidden. Web Audio doesn't. An `AudioContext` keeps the audio hardware awake, and Chrome gives pages that "made noises in the past 30 seconds" lighter timer throttling in the background ([Chrome timer throttling](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)). `suspend()` "temporarily halt[s] audio hardware access and reduc[es] CPU/battery usage" ([MDN suspend](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend)). MDN calls the transition to hidden "the last reliable event" and says to stop non-essential tasks there ([MDN visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)).

iOS has an extra state. When iOS interrupts audio (a call, another app), the context goes to `"interrupted"`, and it has to be resumed from inside a user gesture such as `touchend`. CrazyGames notes that listening to visibility changes alone is not enough on WebKit ([CrazyGames](https://docs.crazygames.com/requirements/technical/)).

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.suspend()   // and: game → paused state, save progress
  else if (!paused) audio.resume()
})
// iOS: also try resume() on the next touchend if ctx.state !== 'running'
```

| Practice | Label | Why |
|---|---|---|
| One `visibilitychange` handler: suspend audio, enter the pause state, save progress | **must** | Portals require a pause on interruption; saves battery; last reliable moment to save |
| Resume audio on the next user gesture if `ctx.state !== 'running'` | **must** | iOS "interrupted" state; otherwise the game is silent after a phone call |
| `window.AudioContext || window.webkitAudioContext` | **must** while iOS 14 is a target | Unprefixed `AudioContext` only from Safari 14.1 / iOS 14.5 ([WebKit](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)); iOS 14.0–14.4 throws |
| Suspend audio when the game is paused but visible | **later** | Small battery win; only if the game has no pause-menu sound |

---

## 5. Memory

### 5.1 Canvas memory, especially on iOS

Each canvas holds width × height × 4 bytes of pixels. iOS Safari has two limits (both collected by [PQINA](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/) and [PQINA, canvas area](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/), backed by [WebKit bug 195325](https://bugs.webkit.org/show_bug.cgi?id=195325) and [Apple forum threads](https://developer.apple.com/forums/thread/112218)):

- **Per canvas:** width × height ≤ 16,777,216 (4096 × 4096). Past that, context creation fails.
- **All canvases together:** 384 MB on iOS 15, lower on earlier versions (224 MB is reported in an Apple forum thread); device-specific. Safari also keeps discarded canvases around "for a while", so creating and dropping canvases repeatedly can hit the cap. Past it, new canvases draw as transparent and the console says "Total canvas memory use exceeds the maximum limit".

PQINA's fix for canvases you're done with: set `width = height = 1` before dropping them.

| Practice | Label | Why |
|---|---|---|
| A fixed set of canvases created at startup (main + world + a few sprite caches); none created per frame or per event | **must** | Keeps you far from both iOS limits with no bookkeeping |
| World canvas ≤ 4096 × 4096 tiles (1 px per tile) | **must** | Hard iOS limit. Assert it where the world is created |
| When a new dive or level replaces a canvas, shrink the old one to 1 × 1 first | **worth it** | Two lines; avoids the iOS "hoarding" failure when games restart many times in one session |
| Budget total canvas pixels (sum over all canvases) | **later** | Only if you start caching many sprites per zoom level |

### 5.2 Leaks from event listeners and restarts

Listeners added once at startup can't leak. Listeners added inside something that runs again (a new dive, a new level, a new `createRenderer()`) accumulate: each keeps its closure, and whatever that closure references (old world, old canvases) stays alive.

`addEventListener(..., { signal })` with `AbortController` is the tidy way to remove a batch of listeners, but it's not on iOS 14 (Safari support started at 15; [caniuse](https://caniuse.com/mdn-api_eventtarget_addeventlistener_options_parameter_options_signal_parameter)).

| Practice | Label | Why |
|---|---|---|
| `addEventListener` only in startup code, or paired with a `removeEventListener` in the same module | **must** | The one leak pattern that actually happens in small games |
| Restart a dive by resetting state, not by re-running setup | **worth it** | Removes the leak class entirely |
| Heap check: play 5 dives, force GC in DevTools Memory panel, compare heap sizes | **worth it** once per game | 5 minutes; catches the leak before a portal player plays for an hour |
| `WeakRef`/`FinalizationRegistry` bookkeeping | **skip** | No need at this size |

### 5.3 Typed arrays for world data

A `Uint8Array(w * h)` holds one tile per byte with no per-element object overhead, it's contiguous, and it serializes easily for replays and P2P ([MDN typed arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays)).

| Practice | Label | Why |
|---|---|---|
| World grid as one flat typed array indexed `y * w + x` | **must** (already done) | Compact, fast, deterministic, easy to hash for P2P desync checks later |
| Typed arrays for entities (struct-of-arrays) | **later** | Only with hundreds of entities; plain objects are clearer |

---

## 6. Load and size

### 6.1 What portals ask for

| Portal | Size | Time | Source |
|---|---|---|---|
| Poki | "the initial download should not exceed 5MB and 8MB in total"; "Keep the initial download even smaller with progressive loading" | "Players tend to move to another game if loading takes more than 10 seconds" | [Poki engine guide](https://developers.poki.com/guide/web-engine), [Poki requirements](https://developers.poki.com/guide/requirements-quality) |
| CrazyGames | Initial ≤ 50 MB; ≤ 20 MB to be eligible for the mobile homepage; total ≤ 250 MB; ≤ 1500 files | Externally hosted files: playable in ≤ 20 s. Should run smoothly on a 4 GB RAM Chromebook | [CrazyGames technical](https://docs.crazygames.com/requirements/technical/) |

A no-dependency JS game is tens to hundreds of KB. The whole engine comparison on Poki's page starts at 130 KB (PixiJS) for an empty project. You're below all of them.

**My suggested budget (not a portal number):** initial download ≤ 1 MB, total ≤ 3 MB. It's generous for this stack, and it means size never becomes a conversation with a publisher.

### 6.2 Audio formats

Synthesized Web Audio (oscillators, noise buffers) costs zero bytes and zero decode time. Keep it as long as it sounds right.

For recorded audio: iOS 14 Safari doesn't play Ogg Vorbis (Safari support: partial from 14.1, full from 18.4) ([caniuse Ogg Vorbis](https://caniuse.com/ogg-vorbis)), and Opus-in-Ogg only arrived with Safari 18.4. MP3 plays everywhere you care about ([caniuse MP3](https://caniuse.com/mp3)).

| Practice | Label | Why |
|---|---|---|
| Synthesized sound effects | **worth it** (already done) | 0 bytes, no loading, tunable in code |
| Recorded audio as MP3 (or AAC `.m4a`), one format only | **must** if you add files | Ogg/Opus fail on iOS 14; one format means no fallback logic |
| Decode audio files after the first user gesture, not before first paint | **worth it** | Audio can't start before a gesture anyway; don't let it delay the first frame |
| Music streamed via `<audio>` instead of decoded into a buffer | **later** | Decoded PCM is large (my arithmetic: ~10 MB per stereo minute at 44.1 kHz in 32-bit float); only matters once you have music |

### 6.3 First paint and module loading

Without a bundler, the browser discovers ES modules by following `import`s, one level of the tree per round trip. For ~10 small files on HTTP/2 this is fast. It gets slow only with deep import chains on a slow connection.

| Practice | Label | Why |
|---|---|---|
| Show something (a coloured canvas or title) within the first frame after `main.js` runs; no blocking on assets | **must** | The 10-second budget is also a first-impression budget |
| Keep the import tree shallow (entry imports its modules directly) | **worth it** | Costs nothing to follow; limits the waterfall |
| Load assets for later levels on demand | **later** | Only when a game has assets big enough to matter |
| A bundler or minifier to cut size | **skip** | Violates the no-build rule to save kilobytes no one will notice |

---

## 7. Measuring

### 7.1 Budgets

At 60 Hz a frame lasts 16.7 ms. The browser needs about 6 ms of that for its own work, so web.dev's RAIL guideline is "Produce each frame in an animation in 10 ms or less" ([web.dev RAIL](https://web.dev/articles/rail)). RAIL is from 2015 and aimed at page animations; use it as a starting point, not a law.

Budgets for the A41, proposed for this project:

| Metric | Budget | How measured |
|---|---|---|
| Your work per frame (script start to end of `frame()`) | median ≤ 6 ms, p95 ≤ 10 ms | `performance.now()` at start and end of the rAF callback |
| Frame interval (rAF delta) | p95 ≤ 17 ms; < 1% of frames > 33 ms | rAF `timestamp` deltas |
| One sim tick | ≤ 1 ms on the A41 (≈ ≤ 0.1–0.25 ms on a desktop in Node) | Node micro-benchmark, §7.4 |
| Canvas pixels per frame | ≤ 1.6 M on the A41 | `canvas.width * canvas.height` |
| Initial download | ≤ 1 MB | DevTools Network panel, "transferred" |

The "your work" number doesn't include the browser's raster and GPU time. That's why the frame-interval number is needed too: it catches fill-rate problems that script timing can't see.

### 7.2 Real device: Chrome remote debugging on the A41

From [Chrome remote debugging](https://developer.chrome.com/docs/devtools/remote-debugging):

1. On the phone: Settings → About → tap Build number 7 times; Developer options → USB debugging on.
2. USB cable to the dev machine. On desktop Chromium open `chrome://inspect#devices`, tick "Discover USB devices", accept the prompt on the phone.
3. Click "inspect" under the phone's tab. Performance panel → record 10–20 s of play → look for red frames in the Frames track, and at what fills them (Scripting, Rendering, Painting, GC).

What only the real device shows: fill-rate limits (GPU), thermal throttling after 10+ minutes, touch latency, Samsung Internet quirks, and real memory pressure.

For iOS, the equivalent needs a Mac with Safari's Web Inspector. Without a Mac, test by playing and reading the in-game frame-time readout.

### 7.3 An in-game frame-time histogram

A dev-panel readout of average and max over the last 60 frames is a good start. A histogram is better, because "max" is one outlier and "average" hides stutter. A fixed `Uint16Array` of buckets costs no allocation:

```js
const buckets = new Uint16Array(6)            // ≤17, ≤25, ≤33, ≤50, ≤100, >100 ms
const EDGES = [17, 25, 33, 50, 100]
function record(ms) {
  let i = 0
  while (i < EDGES.length && ms > EDGES[i]) i++
  buckets[i]++
}
```

Read it after a 2-minute session: the share of frames above 17 ms is the stutter rate. Track "work ms" (script time inside the callback) the same way.

| Practice | Label | Why |
|---|---|---|
| Dev-panel readout of frame time (avg/max) | **must** (already done) | Lets any playtest on the A41 double as a perf test |
| Histogram of frame intervals and work time, shown in the panel and in the dive log | **worth it** | ~15 lines; turns "felt laggy" into a number per playtest |
| Long Animation Frames API or `PerformanceObserver` telemetry | **skip** | Chrome-only, and there's no server to send it to |

### 7.4 Cheap automated checks vs. what needs a phone

| Check | Automatable cheaply? | Label | Notes |
|---|---|---|---|
| Sim tick cost: run N ticks of a seeded dive in Node, fail if the mean exceeds a threshold | **yes**, `node --test`, < 1 s | **worth it** | The sim is pure and deterministic, so results are stable. Set the threshold with 3–5× headroom over today's number to avoid flaky failures |
| Sim allocation: `process.memoryUsage().heapUsed` before/after 10k ticks with `--expose-gc` | **yes** | **later** | Only if the sim starts to allocate per tick |
| Headless Chromium over CDP: run a bundle 10 s, read `Performance.getMetrics` (`JSHeapUsedSize`, `ScriptDuration`) and the in-page histogram | yes, ~100 lines, a few seconds, somewhat noisy | **later** | Already stubbed as `spelunking/tools/perf-a41.js.todo` with triggers. Use for *regressions relative to the last build*, not absolute numbers. Headless usually rasterizes in software, so GPU and fill-rate numbers mean nothing there |
| DevTools CPU throttling with the calibrated "low-tier mobile" preset (Chrome 134+) | manual, 2 min | **worth it** before freezing a build | Calibrates to your machine ([Chrome blog](https://developer.chrome.com/blog/devtools-grounded-real-world)). CPU only |
| Fill-rate, thermal, touch latency, iOS audio interruption | **no**: real device | **must** before each release | 10 minutes on the A41 plus one iPhone pass per game |
| Static greps in the pre-push hook (`setInterval` in bundles, bare `new AudioContext(`, `shadowBlur`) | yes, trivial | **later** | Brittle and easy to get around. Add one only after its bug has shipped once (R-rule policy in `ENGINEERING.md`) |

---

## 8. Apply to this repo (b1.5, as of 2026-09-25)

A quick read of `spelunking/src/bundles/b1/`, not a full audit:

| Finding | Where | Label |
|---|---|---|
| Fixed 60 Hz ticks, accumulator clamped to 100 ms, interpolation with `acc / TICK_MS`: correct | `main.js` `frame()` | ok |
| `imageSmoothingEnabled = false` is set inside `draw`, so a resize can't undo it | `render.js` | ok |
| `alpha: false` on the main context; world on a 1-px-per-tile canvas patched on change | `render.js` | ok |
| DPR is uncapped: `dpr = window.devicePixelRatio`, so the A41 fills ~2.6 M px per frame | `render.js` `resize()` | **worth it**: `Math.min(…, 2)`, then compare frame times on the A41 |
| `new AudioContext()` with no `webkitAudioContext` fallback: throws on iOS 14.0–14.4 | `juice.js` `unlock()` | **must** while iOS 14 is the floor |
| No `visibilitychange` handler: audio context stays live when hidden; no pause-on-hide | `main.js` | **must** before a portal build |
| `css()` builds an `rgb()` string per call, including in `draw` | `render.js` | **worth it**: precompute `TILE_CSS` once |
| Per-frame closures (`sx`, `sy`) and small object returns in `draw` | `render.js` | fine; not per tile |

---

## 9. Overengineering traps

- **Object pools and ECS for a game with 20 moving things.** The GC is fine with that; the pool's bugs aren't.
- **Dirty rectangles with a scrolling camera.** Nothing to save; ghost pixels guaranteed.
- **Adaptive quality systems** before the A41 has ever missed a frame.
- **A perf CI with thresholds on absolute ms in headless Chromium.** Flaky, and blind to the GPU, which is where the A41 will actually struggle.
- **WebGL "because it's faster".** For a few hundred rects and one scaled image per frame, Canvas2D is already GPU-backed on the floor devices and costs no shader code.
- **Workers and OffscreenCanvas.** Not on iOS 14, and the main thread isn't busy.
- **Bundling and minifying** to cut 50 KB off a 200 KB game.

---

## 10. Checks for a pre-commit review

Yes/no questions a reviewer can answer from a diff. "Auto" marks the ones a cheap script or test could check.

**Frame loop and pacing**

1. Does any new sim code read time (`performance.now`, `Date`, rAF timestamp, `dt`)? Must be **no**. *Auto: already enforced by `determinism.test.js`.*
2. Does any cosmetic animation advance per frame without using `dt`? Must be **no** (it would run 2× on 120 Hz, ½× at 30 fps).
3. Is the accumulator (or frame time) still clamped before the tick loop? Must be **yes**. *Auto: a grep, if it ever regresses.*
4. Does the diff add `setInterval`/`setTimeout` driving gameplay or rendering? Must be **no**. *Auto: grep in `src/bundles`.*

**Per-frame work**

5. Does a loop over tiles, entities or particles inside `draw` allocate (object/array literal, spread, template string, closure, `.map`/`.filter`)? Must be **no**.
6. Is anything computed per frame that depends only on size, zoom or settings (layouts, gradients, `measureText`, font strings in loops)? Should be **no**, or cached behind a key.
7. Does the diff add `shadowBlur`, `filter` or `getImageData` on the per-frame path? Must be **no**. *Auto: grep.*
8. Are all draw coordinates and tile sizes integers in device pixels? Must be **yes**.
9. After any code that resizes a canvas, is `imageSmoothingEnabled = false` re-applied (or set in `draw`)? Must be **yes**.
10. Is DPR capped where the canvas is sized? Should be **yes** (≤ 2).

**Resources and lifecycle**

11. Does the diff create a canvas outside startup or a resize/zoom handler? Must be **no**; if replacing one, is the old one shrunk to 1 × 1? *Auto: grep for `createElement('canvas')` outside a whitelist is possible, but brittle.*
12. Does the diff add an `addEventListener` in code that runs more than once without a matching `removeEventListener`? Must be **no**.
13. Is the world or any new canvas able to exceed 4096 × 4096? Must be **no**. *Auto: assert in world creation; a unit test on the largest generator setting.*
14. Does hiding the page still suspend audio and enter the pause state? Must be **yes** (once the handler exists).
15. Is `AudioContext` created with a `webkitAudioContext` fallback? Must be **yes** while iOS 14 is the floor. *Auto: grep for bare `new AudioContext(`.*

**Size and load**

16. Does the diff add a runtime dependency or an asset over 100 KB? Should be **no** without a justification row. *Auto: dependency check exists (`deps.test.js`); a file-size check over `spelunking/` is ~10 lines.*
17. Is any new audio file in a format other than MP3/AAC? Must be **no**. *Auto: extension check.*
18. Does anything now block the first frame (awaiting audio decode or asset loads before the first draw)? Must be **no**.

**Measurement**

19. For diffs that add per-frame work: did someone play 2+ minutes on the A41 and note the panel's frame-time numbers in the commit or timeline? Should be **yes**.
20. Did the sim tick benchmark stay within its threshold? *Auto: `node --test`, once the benchmark exists.*

**Cheapest to automate first**, if any are added: the sim tick benchmark (20), the bare `new AudioContext(` grep (15), the 4096 world-size assertion (13), and the asset size/format check (16, 17). Each is under 20 lines and runs in the existing pre-push hook in well under a second. The rest stay manual review habits, per `ENGINEERING.md`: a check gets automated after its bug has happened once.

---

## Sources

Primary, by topic:

- Canvas: [MDN, Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) · [web.dev, Improving HTML5 Canvas performance](https://web.dev/articles/canvas-performance) (Boris Smus, 2011) · [MDN, imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) · [HTML spec, canvas ("set bitmap dimensions")](https://html.spec.whatwg.org/multipage/canvas.html) · [MDN, devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) · [MDN, OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) · [caniuse, image-rendering](https://caniuse.com/css-crisp-edges)
- DPR and fill-rate: [PlayCanvas, Device Pixel Ratio](https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/) · [CrazyGames, Technical requirements](https://docs.crazygames.com/requirements/technical/)
- GC: [V8, Orinoco parallel scavenger](https://v8.dev/blog/orinoco-parallel-scavenger) · [web.dev, Static Memory JavaScript with Object Pools](https://web.dev/articles/speed-static-mem-pools) (Colt McAnlis, 2013)
- Pacing: [Gaffer on Games, Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/) · [MDN, requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) · [WebKit bug 170534, cross-origin iframe rAF 30 fps](https://bugs.webkit.org/show_bug.cgi?id=170534) · [WebKit bug 215745, Low Power Mode 30 fps](https://bugs.webkit.org/show_bug.cgi?id=215745) · [Motion, When browsers throttle rAF](https://motion.dev/magazine/when-browsers-throttle-requestanimationframe) (2020, secondary) · [MacRumors, Safari 120 Hz flag](https://www.macrumors.com/how-to/enable-smoother-120hz-browsing-in-safari/) (secondary)
- Background and battery: [Chrome, Timer throttling in Chrome 88](https://developer.chrome.com/blog/timer-throttling-in-chrome-88) · [MDN, visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) · [MDN, AudioContext.suspend](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend) · [WebKit, New features in Safari 14.1](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)
- Memory: [PQINA, Total canvas memory use exceeds the maximum limit](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/) · [PQINA, Canvas area exceeds the maximum limit](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/) · [WebKit bug 195325](https://bugs.webkit.org/show_bug.cgi?id=195325) · [Apple forums, 224 MB limit](https://developer.apple.com/forums/thread/112218) · [caniuse, addEventListener signal](https://caniuse.com/mdn-api_eventtarget_addeventlistener_options_parameter_options_signal_parameter) · [MDN, Typed arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays)
- Portals and size: [Poki, Choosing your web game engine](https://developers.poki.com/guide/web-engine) · [Poki, Requirements](https://developers.poki.com/guide/requirements-quality) · [CrazyGames, Technical requirements](https://docs.crazygames.com/requirements/technical/) · [caniuse, Ogg Vorbis](https://caniuse.com/ogg-vorbis) · [caniuse, MP3](https://caniuse.com/mp3)
- Measuring: [web.dev, RAIL](https://web.dev/articles/rail) · [Chrome, Remote debugging Android](https://developer.chrome.com/docs/devtools/remote-debugging) · [Chrome, Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance) · [Chrome, CPU throttling calibration](https://developer.chrome.com/blog/devtools-grounded-real-world) · [GSMArena, Galaxy A41](https://www.gsmarena.com/samsung_galaxy_a41-10138.php)

**Folklore flagged in this guide:** any "safe allocations per frame" number; thermal slowdown figures for the A41; the exact iOS total-canvas cap before iOS 15 (224 MB is one forum report). **My own numbers, not sourced:** the ≤ 1 MB / ≤ 3 MB size budget, the per-frame ms budgets for the A41, the canvas pixel arithmetic, the decoded-audio size estimate.
