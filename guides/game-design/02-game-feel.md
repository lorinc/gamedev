# 02 · Game Feel, Juice, Controls and Feedback

Scope: how control, response and feedback make an action feel good, and how to get there cheaply in a TypeScript + PixiJS browser game. The examples come from spelunking b1 (dig feel). Sibling guides in this folder cover design foundations and MDA, level design and onboarding, player motivation and web-portal audiences, and indie scope and process. This one doesn't repeat them.

Swink's working definition, used throughout: game feel is **real-time control of virtual objects in a simulated space, with interactions emphasized by polish**. That gives three layers: **control** (input → response), **space** (what the object bumps into and why that matters), and **polish** (effects that sell the interaction without changing the simulation). Most "juice" advice is about the third layer. Most games that feel bad are broken in the first.

---

## 1. TL;DR: the principles that matter

1. **Response first, juice second.** If input is late or the motion curve is wrong, no amount of shake fixes it. Tune movement with every effect switched off, then add polish.
2. **Respond on the first possible frame.** A visible reaction within ~1–2 frames of the input matters more than the size of the reaction. On web, the common latency sinks are touch gestures recognised only on finger lift, `<audio>` tags, and input read once per sim tick instead of when the event fires.
3. **Be generous with intent.** Coyote time, input buffering and corner correction all read the input the player *meant*. For spelunking that means swipe angle zones biased toward the cheap action, queued swipes applied at the next tile boundary, and soft stops you can't blow through by accident.
4. **Author in designer units and derive the physics.** Pittman's jump talk comes down to "specify height and distance, compute gravity." Here, specify "seconds per soft tile" and "tiles per second walking," not per-tick damage values.
5. **Feedback should scale with meaning.** Small ticks for routine events, big hits for decisions. In spelunking the stop events (new material, breakthrough into open space, loot) are the decisions, so they get the biggest feedback.
6. **Sound is the cheapest juice per unit of effort.** One sfxr blip per tile break, pitched per material, adds more than any particle system.
7. **Screen shake is trauma, not random offset.** Keep a 0–1 trauma value, make shake = trauma², decay it linearly, and drive it with smooth noise. Keep it subtle for a casual game, and give players an off switch.
8. **Hitstop sells impact.** A freeze of 40–100 ms on a meaningful hit. In a fixed-tick sim, do it by pausing the accumulator, so determinism is untouched.
9. **Squash, stretch and easing fix a rigid grid.** The sim can stay integer and discrete as long as the render layer tweens and deforms.
10. **Permanence and material identity make digging satisfying.** Each rock should look, sound and resist differently, and your tunnels should stay dug. That is the core of Terraria, Dome Keeper and SteamWorld Dig.
11. **Tune with live sliders and blind A/B tests, not opinions.** Tweakpane plus JSON presets, a master juice toggle, and "which one did you want to keep playing?"
12. **Juice is a budget line, not a mood.** Time-box it. The b1 kill criterion asks whether the stop rules are fun, and juice can hide the answer.

---

## 2. Principles and techniques in depth

Cost scale: **S** = under an hour, **M** = half a day, **L** = more than a day. "Leverage" is my judgement for a small casual browser game.

### 2.1 Responsiveness and input latency (control layer)

**What:** the time from a physical input to a visible or audible reaction. Swink's book grounds this in perception research: around 100 ms is roughly where response stops feeling instant and starts feeling like a delay. On the web you lose frames in several places: the display pipeline, event handling that waits for the next sim tick, gesture recognisers that wait for `pointerup`, and audio latency.

**Why it works:** the player's body builds a model of the avatar. Lag breaks the sense that "I am doing this" and turns it into "I asked for this."

**Browser facts that matter:**
- Chrome aligns *continuous* events (`pointermove`, `touchmove`, `mousemove`, `wheel`) to just before the `requestAnimationFrame` callback. *Discrete* events (`keydown`, `pointerdown`, `touchstart`) dispatch immediately. Read discrete events as they arrive and record them into an input queue, which the sim consumes on its next tick.
- Recognise swipes **mid-gesture**. Once the pointer has moved past a distance threshold (start around 24 CSS px; tune it), commit the direction. Don't wait for `pointerup`. That alone can save 50–150 ms per swipe.
- The canvas needs `touch-action: none`, or the browser claims pans and pinches and sends you `pointercancel`. Add `overscroll-behavior: none` on the page (it stops pull-to-refresh), `user-select: none`, `-webkit-touch-callout: none`, and `preventDefault` on `contextmenu`, or the long-tap teleport opens a context menu.
- Use `KeyboardEvent.code` (`KeyW`), not `key`, so WASD works on AZERTY and Dvorak. Ignore `event.repeat` for anything that means "press again."
- Use Web Audio for sound, not `<audio>` elements. The `AudioContext` starts suspended until a user gesture, so call `resume()` on the first `pointerdown` or `keydown`.

**Cost:** S for each item. **Leverage:** very high. These are bugs, not polish.

**Apply to spelunking b1:** measure it. In the dev panel, show "ms from last input event to first changed render frame," computed from `performance.now()` at the event and at the next render that reflects it. Test on the cheap Android phone and with swipes, where latency is always worst.

### 2.2 Fixed timestep, variable render

**What:** the simulation advances in constant `dt` steps, consuming real time from an accumulator. Rendering happens once per rAF and interpolates between the previous and current sim states by `alpha = accumulator / dt` (Fiedler's *Fix Your Timestep*, Nystrom's *Game Loop*).

**Why it works:** the sim is deterministic, which the concept doc's replays and verification need. Rendering stays smooth on 60, 90, 120 and 144 Hz displays. Variable-dt sims feel different on every machine and drift.

**Browser details:** clamp frame time (for example `min(frameMs, 250)`) so a backgrounded tab doesn't come back and run 400 catch-up ticks. rAF stops in hidden tabs, so treat `visibilitychange` as pause. Pixi's `Ticker` gives you `deltaMS`. Put your own accumulator inside one ticker callback and don't scatter per-object ticker listeners.

**Cost:** S–M. Already decided for b1 (sim/render split). **Leverage:** high. It is the foundation for everything below.

**Apply to b1:** the sim moves in whole tiles, so the render layer must *tween* the character between tiles. Without that, a 1-tile-per-tick walker looks like a chess piece. Interpolate position with an ease (ease-out for starting, linear for sustained walking) and keep the sim integer. Every item in 2.5–2.9 lives in render and never touches `sim`.

### 2.3 Forgiveness: coyote time, buffering, corner correction

**What:** Maddy Thorson's Celeste thread lists the canonical set. Coyote time lets you jump shortly after leaving a ledge. Jump buffering makes a press just before landing fire on the landing frame. Half gravity at the jump apex gives more air control. Corner correction wiggles you around a corner you clipped by a few pixels. Wall jumps work from 2 px away. GMTK's *Why Does Celeste Feel So Good to Play?* shows them in motion.

**Why it works:** humans are imprecise by tens of milliseconds and a few pixels. The game quietly fulfils the intent instead of the literal input, and players read that as "tight controls," not as "easy."

**Example:** without buffering, a jump pressed 3 frames before landing is lost and the player blames the controls. With buffering, it fires on the landing frame.

**Cost:** S each, once the input queue exists. **Leverage:** very high in platformers. For spelunking it's high in translated form (no jumps).

**Apply to b1, as translations:**
- **Swipe buffer:** a swipe that arrives while the character is mid-tween into a tile is stored and applied at the next tile boundary, not dropped and not applied mid-tile. Buffer window: ~150 ms or "until next boundary," whichever you prefer after testing.
- **Late-swipe grace (coyote analogue):** when walking stops at a ledge or wall, a swipe that arrives within ~100 ms of the stop and matches the obvious continuation (into the wall = mine, into the gap = zipline) is honoured as though it came before the stop.
- **Angle-zone bias (corner-correction analogue):** already in the doc (horizontal ±30°, narrower diagonals). The rule is "when ambiguous, pick the cheaper, reversible action": walk over mine/build, because mine/build costs ore.
- **Soft stops on keyboard:** a held key must not blow through a soft stop. Require a fresh `keydown`, or a hold-through delay (~200 ms, tunable) after the pause. Make it a toggle and A/B it.

### 2.4 Designer-unit tuning (Pittman)

**What:** Kyle Pittman's GDC 2016 talk *Building a Better Jump* derives gravity and launch velocity from the jump height and horizontal distance to the apex you want, adds a separate, stronger gravity after the peak for a snappier fall, and recommends stable integration.

**Why it matters here, with no jumps:** the transferable idea is to expose the parameters a designer feels ("reaches 3 tiles high over 2 tiles") and compute engine values from them. Sliders in feel units produce meaningful A/B tests. Sliders in engine units produce noise.

**Cost:** S. **Leverage:** high for tuning speed.

**Apply to b1:** tunables such as "walk: tiles/s," "soft rock: s/tile," "hard rock: s/tile," "ore: s/tile," and "tween ease." Derive per-tick progress in code. "Dig 3× slower than walk" becomes a ratio slider. Asymmetric curves carry over too: accelerating into a tunnel over the first tile then holding speed reads as "the drill bit in," like Pittman's faster fall after the apex.

### 2.5 Screen shake (Nijman, Eiserloh)

**What:** move and rotate the camera briefly on impact. Jan Willem Nijman's *The Art of Screenshake* stacks about 30 tricks on a bland shooter: bigger bullets, muzzle flash, impact pops, knockback, camera lerp, camera kick, sleep (hitstop), permanence, more bass, and shake. It shows how far feel moves with no change to the rules. Squirrel Eiserloh's *Juicing Your Cameras With Math* supplies the maths: a **trauma** value in [0,1], incremented by events (+0.2, +0.5), decaying linearly; shake = trauma² or trauma³; in 2D, translation plus a little rotation; **Perlin/smooth noise, not `Math.random()`**. Smooth noise feels like a hand-held camera and respects pause and slow motion for free.

**Cost:** S for the trauma version (~40 lines). **Leverage:** high, but only if it's subtle. Shake reads as "violent," and a casual game wants "chunky." Cap maximum offset at a few pixels for routine digging, allow more at breakthroughs, and add a settings toggle. Some players get motion-sick, and portal reviewers notice.

**Apply to b1:** tile break +0.05–0.1 trauma (barely visible). Hitting harder rock (a stop) +0.25. Breakthrough into open space +0.35. Make shake directional: bias the offset along the dig direction for a small "kick." Tie the camera lerp (`x += (target − x) · k`) to the same panel, with separate horizontal and vertical `k`, plus a slight lookahead in the intent direction (downward in portrait).

### 2.6 Hitstop ("sleep")

**What:** freeze the action for a few frames when something impactful lands. Nijman calls it sleep. Sakurai's *Stop for Big Moments!* covers the fighting-game version and the longer "boss stop" on big defeats.

**Why it works:** the freeze gives the eye time to register the contact and makes the impact feel heavy, the way a real hit pauses a swing.

**Cost:** S, if the loop is built right. **Leverage:** medium–high, but use it only for a few rare events. Frequent hitstop makes controls feel sticky.

**Apply to b1:** freeze on breakthrough into open space and on loot contact, 50–90 ms. Implement it at the loop level: while `hitstopMs > 0`, don't add frame time to the accumulator, but keep rendering particles, or everything freezes. The sim still sees identical ticks, so determinism and replays hold. Never use hitstop on routine tile breaks.

### 2.7 Squash, stretch, easing, anticipation

**What:** the Disney animation principles applied to game objects. They are central to Jonasson & Purho's *Juice It or Lose It* (the Breakout demo gets tweens, squash on bounce, eased entry of every element) and are among the sliders in GMTK's *Platformer Toolkit*.

**Why it works:** deformation says "mass and elasticity" and easing says "force." A rigid square moving linearly reads as a cursor, and the same square with a 10% squash on landing reads as a creature.

**Cost:** S (scale.x/scale.y tweens on one sprite). **Leverage:** very high given b1's "coloured squares only" rule. It is the cheapest way to make a square a character.

**Apply to b1:** squash wide on stopping at a wall (1.15 × 0.85, about 80 ms back), stretch tall on a 1-tile step up, a small stretch along the dig direction while drilling, and a rhythmic pulse per tile broken. **Anticipation:** a 60–80 ms wind-up (lean back, drill "spinning up") before the first mined tile. It sells effort, and because dig is already slower than walk, it hides latency instead of adding it. Keep it out of walking.

### 2.8 Particles and debris

**What:** short-lived sprites emitted on events: dust, chips, sparks. Jonasson & Purho's and Nijman's demos lean on them heavily. Noita is the extreme case, where every pixel is simulated material (Petri Purho's GDC talk *Exploring the Tech and Design of Noita*). Its lesson for us: destruction you can *read* (this material behaves like this) is what makes digging endlessly satisfying.

**Cost:** S for a pooled emitter of coloured squares. M if you want gravity, bounce and tile collision. **Leverage:** high for dig feel. The concept doc already specifies "square chunks flying."

**Apply to b1:** on each tile break, emit 4–8 squares in the tile's own colour, biased away from the drill, with gravity. Have them fade, or better, **land and stay** for a few seconds (permanence, see 2.10). Pool the sprites, since allocating per chunk will cause GC stutter on cheap phones. Cap live particles (start around 300) and put the cap on the dev panel. Ore tiles also emit a few bright sparks, so loot shows up in the corner of the eye.

### 2.9 Audio feedback

**What:** a sound for every player-caused event. Swink's book gives sound its own chapter, and Nijman's "more bass" is one of his tricks. Dome Keeper reviews single out "the tings of the drill to the crumbling of the rocks."

**Why it works:** audio has lower perceptual latency than vision, and it conveys material better than colour (a ting says metal, a thud says dirt).

**Cost:** S with jsfxr (browser sfxr, WAV export, usable as a JS library). **Leverage:** the highest of any juice item. Mobile web players often play muted, so don't make audio the *only* channel for any meaning.

**Apply to b1:** one base "chip" sound per material, with pitch randomised ±5–8% per play so it doesn't sound machine-gunned. The pitch can rise slightly with consecutive tiles in one flick (a "streak" sound). A distinct low thunk on hitting harder rock (a stop means decision). A bright chime on loot. An airy whoosh on breakthrough. Load everything into `AudioBuffer`s at start, unlock on the first gesture, and use a simple voice limit (for example max 4 simultaneous chips).

### 2.10 Material identity and permanence: what makes digging satisfying

Lessons from the digging canon:

- **Terraria:** tiles show crack stages as they take hits, pickaxe power gates materials, and dust matches tile colour. Progress is visible *within* one tile, so a slow tile still gives feedback every hit.
- **Dome Keeper:** early drilling takes "quite a few hits," harder for resource tiles. The drill upgrade shows up as visibly faster digging. Resistance is a progression lever, and the feel changes as you upgrade.
- **SteamWorld Dig:** Image & Form's design deep dive (Olle Håkansson) reports that early playtesters "dug straight downwards, not really exploring," and tells how tile size (matching the character), 2-tile jump height, and banning mid-air digging shaped the strategy space. Digging feel is inseparable from the rules about where you *can* dig.
- **Motherload:** drilling a tile commits you to an animated move into it, and deeper rock is slower. Common criticism: blocks just disappear with no break animation, which is exactly the gap juice fills.
- **Spelunky:** a 1-tile character with automatic ledge-grab. Derek Yu's book covers feedback and the indifferent world. Relevant because b1 copies the 1-tile, auto-climb precedent.
- **Noita:** material simulation makes each substance behave differently. Far out of scope, but the takeaway is cheap: *different materials must feel different through sound, colour of debris, speed and shake*.

**Apply to b1:** give each material a feel profile (s/tile, chip sound, debris colour and count, trauma per break, crack-overlay stages) as one row in a table the dev panel edits. Crack stages matter most for hard rock: at 1+ s/tile, the player needs 2–3 visible intermediate states or it reads as "stuck." Leave tunnels dug (already true) and let debris squares settle on tunnel floors for a few seconds.

### 2.11 Juice as a cascade (Jonasson & Purho)

**What:** *Juice It or Lose It* takes a plain Breakout clone and adds tweening, colour, squash, sound, particles, eyes and a smile to the paddle, flipping each on live. The thesis: "a juicy game feels alive and responds to everything you do," with a cascade of reaction to minimal input. The demo source is on GitHub (grapefrukt/juicy-breakout).

**Why it works, and the warning:** the same *rules* feel like a different game. That's the power and also the trap. Juice makes a mediocre loop feel good for about ten minutes, and a playtest can pass on juice while the stop rules are still wrong.

**Apply to b1:** build a **master juice toggle** on day one. Evaluate the stop rules with juice off first (Swink's "feel garden": the core motion has to stand on its own), then with juice on. If it only passes with juice on, the kill criterion is live.

### 2.12 Tuning methodology

- **Live tweak panel:** Tweakpane with every tunable bound, hidden behind a key or corner tap. `pane.exportState()` / `pane.importState()` round-trip JSON presets, which is exactly the doc's `presets/` workflow. Put the preset name in the dive log so feedback maps to numbers.
- **Exaggerate, then pull back:** push each slider until it's clearly too much, then back off to taste. You find the sensitive range fast. (A working heuristic, not a citation.)
- **Blind A/B:** two presets labelled A and B (not "new" and "old"), swapped by key, each played for 1–2 dives. Ask "which one did you want to keep playing?" and "which one felt like you were fighting it?" Watch silently. Where testers hesitate tells you more than what they say.
- **One variable per round.** Changing swipe threshold and dig speed together tells you nothing.
- **Use the platformer toolkit as a calibration exercise:** 30 minutes in GMTK's *Platformer Toolkit* builds the habit of feeling what one slider does. That skill is what you need for b1.
- **Record the phone screen.** Latency and overshoot that you can't feel while playing show up in video frame by frame.

---

## 3. Cheap-first juice checklist (value per effort, descending)

Do these top-down, stop when the b1 time box says so, and re-check the juice-off test after each block.

| # | Item | Cost | Why this rank |
|---|---|---|---|
| 1 | `touch-action:none`, `overscroll-behavior:none`, context-menu suppression, `KeyboardEvent.code` | S | Broken input isn't feel, it's a bug |
| 2 | Swipe committed at distance threshold, not on `pointerup` | S | Biggest single latency win on mobile |
| 3 | Fixed-step accumulator + render interpolation/tween between tiles | S–M | Without it everything looks like a board game |
| 4 | Master juice toggle + Tweakpane with presets | S | Needed to tune and to run the kill test honestly |
| 5 | Swipe buffer to next tile boundary + angle-zone bias | S | Forgiveness = "tight controls" |
| 6 | One sfxr chip sound per material, ±pitch jitter, Web Audio unlock | S | Highest juice per minute |
| 7 | Squash/stretch on stop, step and dig pulse | S | Turns a square into a character |
| 8 | Debris squares in tile colour, pooled, capped | S | "Chunks flying" already in scope |
| 9 | Distinct stop feedback: thunk + trauma bump on harder rock | S | Makes the decision moment legible |
| 10 | Trauma-based shake with smooth noise, capped, toggle | S | Good but easy to overdo |
| 11 | Camera lerp + lookahead in intent direction | S | Portrait depth reads better |
| 12 | Crack-stage overlay for slow tiles | S–M | Needed once hard rock ≥ 1 s/tile |
| 13 | Hitstop on breakthrough and loot only | S | Rare, high impact |
| 14 | Anticipation wind-up before the first mined tile | S | Sells effort, but test that it doesn't feel laggy |
| 15 | Debris that settles and persists briefly | M | Permanence; nice, not needed for the pass/fail call |
| 16 | Haptics (`navigator.vibrate`, Android only; not in iOS Safari) | S | Mixed reception; test before keeping |
| **Leave for the end** | Lighting/glow, sub-tile rock shaders, per-pixel destruction, dynamic music, chromatic aberration, full-screen flashes | L | Out of b1 scope by the bundle rules; they only lift what already works |

---

## 4. Anti-patterns and overengineering traps

- **Juicing before the stop rules are settled.** The b1 question is whether "move until something changes" is fun. Juice raises the first impression and hides the answer. Always run the juice-off pass.
- **Building a general effects framework.** You need one emitter, one trauma value, one tween helper and one sound player. A component-based VFX system, an ECS for particles, or a node-based audio mixer is a month's gold-plating for a one-month game.
- **Shake as default seasoning.** Nijman's talk is for a shooter about violence. Constant shake in a casual, chill digging game causes fatigue and nausea. Shake is for *changes*, not *sustain*.
- **Hitstop everywhere.** Freezing on every tile makes the dig feel stuck and adds latency. Use it only for rare events.
- **Variable timestep "because it's simpler."** You lose determinism (replays and verification in the concept doc) and feel differs by device refresh rate.
- **Putting effects in the sim.** Anything cosmetic in `sim` breaks the render/sim split and makes replays depend on presentation. Juice reads sim events and never writes sim state.
- **Waiting for the gesture to end.** Swipe-on-`pointerup` and tap-vs-long-tap disambiguation are the classic web latency traps. For long-tap, show a charge ring immediately so the wait reads as intentional.
- **Tuning on a desktop only.** The cheap Android phone has the worst frame pacing, touch latency and GC stalls. Tune there first, as the doc already says.
- **Audio as the sole signal.** Portal players often play muted. Every audio cue needs a visual twin.
- **Tuning by committee of one.** You will adapt to any preset within 20 minutes. Fresh testers, blind A/B, and the dive log are the check.
- **Unbounded particles and allocations.** Unpooled `new Graphics()` per chunk will stutter on mobile. Pool from day one; it isn't harder.

---

## 5. Annotated sources, ranked by value per hour

**★ = watch/read first.**

1. ★ **Martin Jonasson & Petri Purho, *Juice It or Lose It* (talk, 2012, ~15 min).** The canonical demo of polish transforming identical rules. Watch for the "toggle each effect" structure you'll copy. https://www.youtube.com/watch?v=Fy0aCDmgnxg. Source of the demo: https://github.com/grapefrukt/juicy-breakout
2. ★ **Jan Willem Nijman (Vlambeer), *The Art of Screenshake* (INDIGO Classes 2013, ~30 min).** Around 30 incremental tricks, including sleep/hitstop, permanence, camera kick and camera lerp. Watch with a notepad and pick the four that translate to digging. https://www.youtube.com/watch?v=AJdEqssNZ-U
3. ★ **Maddy Thorson, Celeste game-feel thread (2020).** Ten forgiveness tricks with concrete pixel values. Five minutes. https://threadreaderapp.com/thread/1238338574220546049.html (original: https://x.com/MaddyThorson/status/1238338574220546049)
4. ★ **GMTK, *Platformer Toolkit* (interactive, itch.io).** More than 30 sliders (speed, coyote time, squash and stretch) with narration. The fastest way to train your tuning hand. https://gmtk.itch.io/platformer-toolkit
5. **Glenn Fiedler, *Fix Your Timestep!* (2004).** The accumulator + interpolation loop. Read before writing the b1 loop. https://gafferongames.com/post/fix_your_timestep/
6. **Squirrel Eiserloh, *Math for Game Programmers: Juicing Your Cameras With Math* (GDC 2016).** Trauma-based shake, smooth noise, asymptotic averaging. Watch the shake section (~15 min). https://www.youtube.com/watch?v=tu-Qe66AvtY. Transcript: https://archive.org/stream/GDC2016Eiserloh/GDC2016-Eiserloh_djvu.txt
7. **GMTK, *Why Does Celeste Feel So Good to Play?*** The Celeste thread in motion, with comparisons. https://www.youtube.com/watch?v=yorTG9at90g
8. **Olle Håkansson / Image & Form, *Game Design Deep Dive: The digging mechanic in SteamWorld Dig*.** The only first-party dev write-up on dig design found here. Short and directly relevant (playtesters dug straight down; tile size; restrictions). https://www.gamedeveloper.com/design/game-design-deep-dive-the-digging-mechanic-in-i-steamworld-dig-i-
9. **Chrome for Developers, *Aligned input events*.** Which web events are rAF-aligned and which are immediate. 10 min, directly shapes the input code. https://developer.chrome.com/blog/aligning-input-events
10. **MDN: `touch-action`, `KeyboardEvent.code`, Web Audio best practices (autoplay/resume).** Reference, not reading. https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action · https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code · https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
11. **GMTK, *Secrets of Game Feel and Juice*.** A good overview if you want one video tying it all together. Some overlap with 1–2. https://www.youtube.com/watch?v=216_5nu4aVQ
12. **Steve Swink, *Game Feel: The Secret Ingredient* (Gamasutra/Game Developer, 2007).** The free article version of the book's framework (input, response, context, polish, metaphor, rules). 15 min. https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient
13. **Kyle Pittman, *Math for Game Programmers: Building a Better Jump* (GDC 2016).** Only the first half matters to you: designer-unit parameterisation. https://www.youtube.com/watch?v=hG9SzQxaCm8 · https://www.gdcvault.com/play/1023559/Math-for-Game-Programmers-Building
14. **Masahiro Sakurai, *Stop for Big Moments!* (Masahiro Sakurai on Creating Games).** Hitstop with before/after comparisons. 8 min. https://www.youtube.com/watch?v=OdVkEOzdCPw
15. **Tweakpane docs, Import/Export.** `exportState()` / `importState()` for presets. https://tweakpane.github.io/docs/misc/ · PixiJS Ticker guide: https://pixijs.com/8.x/guides/components/ticker
16. **jsfxr.** Browser sfxr for placeholder sounds in minutes. https://sfxr.me/
17. **Maddy Thorson, *Celeste and TowerFall Physics*.** Integer positions with sub-pixel remainders, actors vs. solids. Matches your integer-grid sim. https://maddythorson.medium.com/celeste-and-towerfall-physics-d24bd2ae0fc5
18. **Robert Nystrom, *Game Programming Patterns: Game Loop*.** A gentler take on (5) with more context. https://gameprogrammingpatterns.com/game-loop.html
19. **Josh Anthony, *Design Dive: Dome Keeper*.** A player-designer's read on why the drilling is soothing and how upgrades change feel. https://joshanthony.info/2023/05/24/design-dive-dome-keeper/
20. **Petri Purho, *Exploring the Tech and Design of Noita* (GDC 2019).** Mostly tech. Worth it only for the "materials must behave differently" design sections. https://www.youtube.com/watch?v=prXuyMCgbTc
21. **Steve Swink, *Game Feel: A Game Designer's Guide to Virtual Sensation* (Morgan Kaufmann, 2008).** The full book: deep, academic in places, low value per hour for a one-month cycle. Read the chapters on the six components and on polish if you read any. https://www.routledge.com/Game-Feel-A-Game-Designers-Guide-to-Virtual-Sensation/Swink/p/book/9780123743282
22. **Derek Yu, *Spelunky* (Boss Fight Books).** Design memoir. Feel is a minor part, but it covers the 1-tile-character precedent and finishing games. https://bossfightbooks.com/products/spelunky-by-derek-yu
