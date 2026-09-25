# 03 · Web Portal Requirements

What web game portals require of an HTML5 build, and what to check before one is submitted. Written for this project: a solo dev, one small game a month, plain JS ES modules with no build step, Canvas2D, static files, zero runtime dependencies. Oldest targets are iOS 14 Safari and a Samsung Galaxy A41. P2P multiplayer over WebRTC comes later.

Researched 2026-09-25, from the portals' own developer docs wherever they exist. Anything that comes from a third party or a forum is marked **(secondhand)**. Portal rules change often, so re-read a portal's requirements page on the day you submit to it.

**How to read this:** most portal rules cost nothing if the code is shaped right from the start, and a lot if they're bolted on at the end. So the useful question is "which of these shape the code now?", not "how do I pass every portal". Every requirement gets one of four labels:

| Label | Meaning |
|---|---|
| **must now** | Affects code being written today. Cheap now, a rewrite later |
| **before first submission** | Do it in the week the first game goes to a portal, not before |
| **later** | Only when a specific portal or feature (multiplayer, a second portal) is actually on the table |
| **skip** | Doesn't apply to tiny static games, or costs more than it returns |

---

## 1. TL;DR

1. **Size is not your problem.** The strictest published budget is Poki's advice of 5 MB initial / 8 MB total ([Poki, web engine guide](https://developers.poki.com/guide/web-engine)). All of `spelunking/src` is 264 KB today. One cheap zip-size assert is enough.
2. **Load time is measured as conversion to play.** Poki and CrazyGames both measure how many visitors reach the first `gameplayStart` event. It is one of the three metrics that decide whether a game gets released ([Poki web fit test](https://developers.poki.com/guide/web-fit-test), [CrazyGames launch process](https://docs.crazygames.com/)). CrazyGames allows at most one click before gameplay.
3. **Everything is relative and bundled.** No absolute paths, no CDN fonts, no external requests of any kind. Poki blocks all external requests with a CSP by default. YouTube Playables forbids them outright.
4. **Storage is best-effort.** `localStorage` can throw (incognito), is partitioned per portal (Chrome 115+, Firefox 103+), and Safari wipes it after 7 days without a visit. Wrap every access in try/catch. Save through one module that an adapter can later point at the portal's cloud save.
5. **The game has to pause and mute on demand**, from any of four sources: tab hidden, window blur, an ad starting, a platform `onPause`. That is one `pause()`/`mute()` seam in the game, and it's worth building now.
6. **One adapter file owns every SDK call.** The game calls `platform.gameplayStart()`, `platform.adBreak()` and so on. The per-portal zip differs only in one `<script>` tag in `index.html`. No build step needed.
7. **Input: touch, mouse and keyboard, all three.** YouTube requires touch *and* mouse for every interaction. Poki and CrazyGames expect keyboard on desktop, and arrow keys, space and the wheel must not scroll the parent page.
8. **No links out, no own ads, no own analytics, no splash screen, no custom fullscreen button.** Your studio logo on the loading screen is fine (Poki).
9. **Poki demands web exclusivity.** A game on Poki can't be on other web portals ([Poki, working with Poki](https://developers.poki.com/guide/working-with-poki)). CrazyGames doesn't require exclusivity **(secondhand)**. Choose where each game goes before you integrate anything.
10. **ES modules without a bundler are fine on every portal researched.** Watch out for three things: `file://` never works, `.mjs` may get the wrong MIME type, and **`tsc` with `lib: ES2020` does not catch syntax that iOS 14.0 can't parse** (verified, see §8).
11. **P2P multiplayer collides with portal network rules.** Signalling and TURN are external requests: Poki needs them approved case by case, YouTube forbids them, and Discord Activities don't support WebRTC. That's a problem for later, but it's why the sim/network boundary matters now.

---

## 2. The portals at a glance

| Portal | Size / file limits | SDK needed for | Exclusivity | Fit here |
|---|---|---|---|---|
| **Poki** | Advice: 5 MB initial, 8 MB total ([web-engine](https://developers.poki.com/guide/web-engine)). "Players tend to move to another game if loading takes more than 10 seconds" | Always: loading, gameplay start/stop, ads | **Web exclusive** | High traffic, curated, all ages. Web fit test on ~10,000 players |
| **CrazyGames** | Initial ≤ 50 MB (≤ 20 MB for the mobile homepage), total ≤ 250 MB, ≤ 1,500 files ([technical](https://docs.crazygames.com/requirements/technical/)) | Basic launch: none. Full launch: gameplay start/stop, ads, Data module if saving | Optional, for a revenue bonus **(secondhand)** | Two-stage launch: basic (7 days, 500 plays, no ads), then full if the metrics hold |
| **GameDistribution** | Not published | Ads + pause/mute events ([SDK wiki](https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation)) | No | Syndicates to many small sites. Low bar, low revenue |
| **GameMonetize** | Not published. Zip with `index.html` at root ([SDK README](https://github.com/GameMonetize/GameMonetize.com-SDK/blob/master/README.md)) | Same event model as GD | No | Same tier as GD |
| **itch.io** | ≤ 1,000 files, ≤ 500 MB extracted, ≤ 200 MB per file, paths ≤ 240 chars, case-sensitive ([itch docs](https://itch.io/docs/creators/html5)) | None | No | No review, no ads. Good for playtests and a portfolio |
| **Newgrounds** | Zip with `index.html` at top level. 250 MB **(secondhand, old)** | None required | No | Community portal. Low effort to add |
| **Y8** | Not found in public docs | Y8 account SDK optional | No | Low priority |
| **YouTube Playables** | Initial < 30 MiB (should be < 5 MB), total < 250 MiB, per file < 30 MiB (should be < 512 KiB), ≤ 8,000 files, load < 5 s, save < 3 MiB ([stability](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability)) | Always: SDK loaded before game code, `gameReady`, pause/audio callbacks, cloud save | Invite-based | The strictest rules. Useful as a checklist even if you never submit |
| **Facebook Instant Games** | 200 MB total, aim for 1 MB initial; `index.html` + `fbapp-config.json` at root **(summarised from FB docs via search)** | Always | No | Meta is migrating everything to "Zero Permissions" (SDK v8) and sunsets Web Games on 2026-09-30 ([Meta blog](https://developers.facebook.com/blog/post/2025/07/31/web-and-instant-games-changes/)). Unstable, **skip** |
| **Telegram Mini Apps** | You host it (HTTPS) ([docs](https://core.telegram.org/bots/webapps)) | `ready()`, viewport/safe-area events | No | You host, so no portal rules apply. **Later** |
| **Discord Activities** | You host it, behind Discord's proxy and CSP ([networking](https://docs.discord.com/developers/activities/development-guides/networking)) | Always | No | The official tutorial needs a backend for the OAuth token exchange, and the networking doc lists **WebRTC as unsupported**. **Skip** while no-servers + P2P is the plan |

**Label for picking portals:** **before first submission.** Poki's exclusivity is a business decision that changes which SDK you integrate. Make it per game, not once for all games.

---

## 3. Size and load

| Requirement | Source | Label | Why |
|---|---|---|---|
| Initial download small (Poki advice: 5 MB / 8 MB total) | [Poki](https://developers.poki.com/guide/web-engine) | **before first submission** (one assert) | We're at ~0.3 MB. A zip-size check in the pack script stops accidents, like a stray WAV |
| Load to interactive in < 5 s (YouTube), < 10 s before players leave (Poki), ≤ 20 s for externally hosted files (CrazyGames) | see §2 | **must now**, as a habit | No asset pipeline, procedural audio, tiny JS. Keep it that way. Don't add a font file or sprite sheet without weighing it |
| Report loading start and finish to the SDK | Poki `gameLoadingFinished()`, CrazyGames `loadingStart/Stop`, YouTube `firstFrameReady`/`gameReady` | **before first submission** | Two adapter calls. With load times under a second there's nothing to show a progress bar for |
| Loading screen with progress | No portal requires one for fast games. Poki allows a studio logo on it | **skip** | The game loads faster than a progress bar can draw |
| File count ≤ 1,000 (itch.io is the lowest) | [itch](https://itch.io/docs/creators/html5) | **before first submission** (one assert) | We have ~35 files. Only a real risk if you ship a folder of per-tile PNGs |
| Per-file < 512 KiB (YouTube "should") | [YouTube](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability) | **skip** | Only big assets would break it, and we don't have any |

**Conversion to play is the load metric that counts.** Poki's web fit test weighs three things equally: thumbnail click-through, time on page, and the share of visitors who reach the first `gameplayStart()` ([web fit test](https://developers.poki.com/guide/web-fit-test)). A title screen, a "tap to start", a language picker and a tutorial modal each lose players before that event. CrazyGames puts it as a rule: "New users should land in gameplay immediately", with at most one click before gameplay ([gameplay requirements](https://docs.crazygames.com/requirements/gameplay/)). **Label: must now.** This is a design constraint on the first 10 seconds of every game, not a technical one.

---

## 4. Runtime: living inside someone else's iframe

Every portal runs the game in an iframe on a page it owns. Most of the rules follow from that.

### 4.1 Storage

- **Incognito and blocked storage throw.** Poki: "Incognito mode restricts localStorage, so wrap localStorage operations in a try/catch" ([requirements](https://developers.poki.com/guide/requirements-quality)).
- **Third-party storage is partitioned.** In an iframe, `localStorage` and IndexedDB are keyed by (your origin, the top-level site) in Chrome 115+ ([Privacy Sandbox](https://privacysandbox.google.com/cookies/storage-partitioning)) and Firefox 103+ ([MDN](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning)). So a save made on one portal is invisible on another, and on a portal that serves the game from a different CDN host per version it may vanish with every update.
- **Safari deletes script-writable storage** (localStorage, IndexedDB and the rest) after 7 days of Safari use without the user interacting with the site. This has been in place since iOS 13.4 ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).
- **Portals offer cloud save instead.** CrazyGames' Data module has the `localStorage` API, syncs across devices and caps out at 1 MB, and a full launch requires it if the game saves ([Data module](https://docs.crazygames.com/sdk/data/), [technical](https://docs.crazygames.com/requirements/technical/)). YouTube requires `saveData` on material progress, at < 3 MiB total and 64 KiB on exit ([integration](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration)).
- **Poki:** "Implement progress saving where appropriate, or clearly inform players when progress won't be saved."

**Label: must now** for try/catch and "saves are best-effort". **Before first submission** for routing saves through the adapter. b1 already wraps its tunables storage in try/catch. The same pattern goes in every game's save path. Keep saves small (a few KB of JSON) so every portal's cap is irrelevant.

### 4.2 Input and focus

| Requirement | Source | Label | Why |
|---|---|---|---|
| Touch **and** mouse for every interaction | [YouTube design](https://developers.google.com/youtube/gaming/playables/certification/requirements_design); CrazyGames: mouse, keyboard, touch | **must now** | Pointer events cover both with one code path. b1 already uses them |
| Keyboard on desktop | Poki, CrazyGames | **must now** | Portal traffic is still heavily desktop |
| Arrow keys, space and wheel must not scroll the parent page | [Poki SDK guide](https://developers.poki.com/guide/sdk-html5), [requirements](https://developers.poki.com/guide/requirements-quality) | **must now** | One `preventDefault` on keydown for those codes, plus `{passive:false}` wheel. **b1 today only prevents WASD/numpad**, so space and arrows would scroll a portal page |
| Don't `preventDefault` Esc; avoid Esc and Ctrl+W as game keys | [YouTube](https://developers.google.com/youtube/gaming/playables/certification/requirements_design), [CrazyGames quality](https://docs.crazygames.com/requirements/quality/) | **must now** | Esc exits fullscreen. Note that Poki asks for "ESC or spacebar" to pause, so let Esc open pause but never swallow it |
| `user-select: none`, `touch-action: none` on the game surface | [CrazyGames technical](https://docs.crazygames.com/requirements/technical/) | **must now** | b1.html already has both |
| Keyboard layout awareness (WASD vs ZQSD) | CrazyGames quality | **later** | `e.code` is already layout-independent, which covers the physical-position case |
| Mobile controls auto-enabled on tablets | Poki | **must now** | Choose touch UI by the last input used (b1 tracks `kind`), not by user agent |
| Focus: an iframe only gets keys after a click in it | common knowledge, not a portal rule | **before first submission** | Test once on itch.io. Call `window.focus()` on the first pointerdown if keys don't arrive |

### 4.3 Screen: resize, orientation, fullscreen, pixels

| Requirement | Source | Label | Why |
|---|---|---|---|
| Fill whatever size you're given and keep state on resize | Poki: scale to 640×360, 836×470, 1031×580. CrazyGames: iframe 800×450 up to 1920×1080. YouTube: every aspect ratio from 9:32 to 32:9, "MUST maintain game state when window is resized" | **must now** | b1 resizes on `resize`. Also check a portrait phone and an ultra-wide strip once per game |
| Letterbox is OK | CrazyGames (black bars), YouTube (pillarbox/letterbox) | **must now** | Easiest answer for a fixed-ratio game |
| Text legible at `devicePixelRatio` 1 | [CrazyGames](https://docs.crazygames.com/requirements/gameplay/). They force DPR 1 on iOS and low-memory Android | **must now** | Read `devicePixelRatio` at resize time (b1 does). Don't hardcode ×2 |
| Don't lock orientation | YouTube: "MUST NOT lock device orientation". `screen.orientation.lock` doesn't exist on iOS anyway (MDN compat data) | **must now** | Design for both, or letterbox |
| No custom fullscreen button | [CrazyGames](https://docs.crazygames.com/requirements/gameplay/) | **must now** | The portal provides one. And `requestFullscreen` doesn't exist on iPhone Safari at all (iPad only, 16.4+; MDN compat data) |
| Physics consistent at 144/165 Hz | CrazyGames gameplay | **must now** | b1 already runs a fixed tick with an accumulator. Keep that in every game |
| Safe areas in app wrappers | CrazyGames app, Telegram `safeAreaInset` | **later** | Only matters inside native wrappers |

### 4.4 Pause, visibility and audio

| Requirement | Source | Label | Why |
|---|---|---|---|
| Pause game + mute audio during ads | [Poki](https://developers.poki.com/guide/sdk-html5), [CrazyGames ads](https://docs.crazygames.com/requirements/ads/), [GameDistribution](https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation) (`SDK_GAME_PAUSE`/`SDK_GAME_START`), [GameMonetize](https://github.com/GameMonetize/GameMonetize.com-SDK/blob/master/README.md) | **must now** (the seam) | One `game.pause()` / `game.resume()` and one master gain node for mute. The adapter calls them |
| Disable keyboard input during ads | Poki | **must now** | Falls out of `pause()` if paused means "no commands to the sim" |
| Pause when the tab is hidden or the window loses focus | Good practice. YouTube requires pausing on its `onPause` callback **only**, not the Page Visibility API | **must now** | `visibilitychange` + `blur` → `pause()`. The adapter can override the source for YouTube. b1 only clears held keys on blur today |
| Audio starts only after a gesture; `resume()` after an iOS interruption | CrazyGames technical (iOS: call `resume()` on touchend/click when suspended) | **must now** | b1's `unlock()` does this. Call it on every pointerdown, not only the first |
| `AudioContext` unprefixed only from iOS 14.5 | MDN compat data (`webkitAudioContext` before) | **must now** | **b1 calls `new AudioContext()` bare, which throws on iOS 14.0–14.4.** Use `window.AudioContext \|\| window.webkitAudioContext` |
| Respect the platform mute | YouTube `isAudioEnabled`/`onAudioEnabledChange` | **later** | An adapter concern |
| Ads only on user input, outside gameplay | [GameDistribution](https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation): ads display only on mouseUp/touchUp | **before first submission** | Call `adBreak()` from the "next level" / "retry" click handler |
| No own ad timer; the portal decides frequency | Poki, CrazyGames (max 1 midgame ad per 3 min) | **must now** | Just request a break at natural pauses and let the SDK say no |

### 4.5 Network, links, ads, analytics, HTTPS, CSP

| Requirement | Source | Label | Why |
|---|---|---|---|
| No external requests at runtime (fonts, images, libraries, analytics) | [Poki external resources](https://developers.poki.com/guide/external-resources-policy): blocked by default via CSP, exceptions requested per URL. [YouTube privacy](https://developers.google.com/youtube/gaming/playables/certification/requirements_privacydata): "MUST NOT make external calls" | **must now** | Zero deps and no CDN already get you there. Keep a grep for `http` in shipped files |
| No outgoing links, no cross-promotion, no store links | Poki (links only via `PokiSDK.openExternalLink`). CrazyGames (privacy/terms links OK, community links on the menu only). YouTube: no clickable external links, no share prompts, no exit button | **must now** | Don't put a "more games" or Discord link in the game |
| No own ads, no own monetization UI | Poki, CrazyGames ("Only Ads requested through the CrazyGames SDK are allowed") | **skip** | We weren't going to |
| No own analytics | Poki: Google Analytics excluded, others case by case. YouTube: no external calls | **skip** | Portals give you their dashboards. The dive log and recorder are local, which is fine |
| Playable with an ad blocker | Poki | **before first submission** | The adapter must treat "SDK failed to load" as "no ads, continue". Test with uBlock once |
| No splash screens; logo only on the loading screen | Poki | **must now** | Nothing to build |
| HTTPS | All portals serve HTTPS; itch requires HTTPS for external resources | **skip** | Relative URLs inherit the scheme |
| CSP compatibility: no `eval`, no `new Function`, no inline `on*=` handlers | Portals apply a CSP (Poki, Discord). The exact directives aren't published | **must now** | Costs nothing to avoid, and it's cheap to grep. Keeping the entry script as an external module (not inline) is a safe default, though no portal documents requiring it |
| Chat and free-text usernames | Poki: no chat, profanity-filter any usernames. YouTube: don't collect personal info | **later** | Only with multiplayer. Use emotes, not chat |

---

## 5. SDK integration: an adapter, zero coupling

Every portal SDK boils down to the same six hooks. Poki: `init`, `gameLoadingFinished`, `gameplayStart`/`gameplayStop`, `commercialBreak`, `rewardedBreak` ([Poki SDK](https://developers.poki.com/guide/sdk-html5)). CrazyGames: `loadingStart/Stop`, `gameplayStart/Stop`, `requestAd` with `adStarted`/`adFinished`/`adError` callbacks. GameDistribution and GameMonetize: `showAd()` plus `SDK_GAME_PAUSE`/`SDK_GAME_START` events. YouTube: `firstFrameReady`, `gameReady`, `onPause`/`onResume`, `saveData`/`loadData`, audio-enabled callbacks.

So the game talks to one small interface and never names a portal:

```js
// src/platform/platform.js: the only file that knows portals exist
/** @typedef {{ pause(): void, resume(): void, mute(on: boolean): void }} GameHooks */
export const platform = {
  /** @param {GameHooks} hooks */ async init(hooks) {},
  loadingDone() {},
  gameplayStart() {},      // first input of a run, unpause
  gameplayStop() {},       // death, level end, pause menu
  /** @returns {Promise<void>} */ async adBreak() {},             // resolves when play may continue
  /** @returns {Promise<boolean>} */ async rewarded() { return false },
  /** @returns {Promise<string|null>} */ async load(key) {},     // try/catch localStorage by default
  /** @param {string} value */ async save(key, value) {},
}
```

- **Picking the implementation without a build step:** each portal's `index.html` adds that portal's SDK `<script>` tag. The adapter checks at `init` which global exists (`window.PokiSDK`, `window.CrazyGames`, `window.gdsdk`…) and falls back to the no-op + `localStorage` version. The pack script copies the same files and swaps one line of `index.html`. **Label: before first submission** for the Poki/CrazyGames branches. **Must now** only for the seam itself: `pause`, `resume`, `mute`, `gameplayStart/Stop` call sites, and saves going through `platform.save`.
- **Rules the adapter enforces, so the game doesn't have to know them:** don't send duplicate consecutive start/stop events (Poki requirement). Ad callbacks call `hooks.pause()` + `hooks.mute(true)` only when the ad actually starts (CrazyGames: "Only mute when the ad actually plays, not when requested"). An ad error resolves `adBreak()` normally and makes `rewarded()` return `false`. A failed SDK load (ad blocker) becomes the no-op.
- **YouTube is the odd one out.** Its SDK must load *before any game code* and it owns pause. The adapter shape still fits, but its branch is **later**.
- **Don't build:** a plugin system, a registry, per-portal feature flags or a config file. It's one file with a switch in it.

---

## 6. Review: what gets games rejected

Straight from the docs. None of it needs code today, but each item shapes a design decision.

| Rejection reason | Portal | Label |
|---|---|---|
| Doesn't reach gameplay fast; more than one click to play | CrazyGames (rule), Poki (C2P metric) | **must now** (design) |
| Metrics below category average after the test period (CTR, playtime, conversion, retention) | Poki [web fit test](https://developers.poki.com/guide/web-fit-test), CrazyGames basic launch | **must now** (design): this is the real filter, not QA |
| Physics differs at high refresh rates; crashes; console errors | CrazyGames gameplay, YouTube stability (no crashes, JS heap < 512 MB) | **must now** |
| Not English, or doesn't follow the browser locale with an English fallback | [CrazyGames](https://docs.crazygames.com/requirements/gameplay/) (English mandatory, locale "should") | **must now**: English. **Later**: other languages. Keep UI text minimal and iconic, which is cheaper than localising |
| Content not suitable for all ages (Poki) or not PEGI 12 (CrazyGames); scary, violence, gambling themes | [Poki content](https://developers.poki.com/guide/content-player-safety), CrazyGames | **must now** (design) |
| Clone / not original, generic name | Poki, CrazyGames quality | **must now** (design) |
| Debug tools, test artifacts left in the build | [Poki](https://developers.poki.com/guide/requirements-quality) | **before first submission**. b1's Backquote panel, `?rules=lab` and the latency readout must be off in the shipped entry |
| Unskippable cutscenes; text-heavy tutorials | Poki, CrazyGames quality | **must now** (design) |
| Reward buttons: need a video icon, not green, always with an equal "continue" alternative | Poki, CrazyGames ads | **later**: only if rewarded ads are used |
| No signal that content has ended | YouTube design ("MUST communicate when no more content exists") | **before first submission** (one end screen) |
| Thumbnails: static + animated (Poki); several aspect ratios, no logos in them (YouTube) | Poki, YouTube | **before first submission** |

---

## 7. Build packaging

| Requirement | Source | Label | Why |
|---|---|---|---|
| Zip, `index.html` at the zip root (not in a subfolder) | itch, GameMonetize, Newgrounds **(secondhand)**, FB | **before first submission** | Zip the *contents* of the folder |
| Relative paths only; `/foo` fails | itch, CrazyGames ("absolute paths will fail"), YouTube, Discord | **must now** | Already true: GitHub Pages serves the game from `/gamedev/spelunking/`, so an absolute path would already break the live test build. Keep it that way, because it's a free test |
| Case-exact filenames | [itch](https://itch.io/docs/creators/html5): wrong case gives a 403 | **must now** | Linux dev box + `tsc` import resolution already catch a wrong-case import |
| Filenames only `[A-Za-z0-9_.-]` | [YouTube](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability) | **before first submission** (one assert) | Cheap. Also avoids URL-encoding surprises everywhere |
| Only ZIP, no RAR/7z | itch | **skip** | `zip` is the default anyway |
| Cache-busting | Portals store each upload as a new version. Poki's CSP doc says to re-upload "to clear caching". GitHub Pages sends `Cache-Control: max-age=600` (measured) | **skip** for portals. **Later** for Pages | Within 10 minutes of a push, a tester can get a mix of old and new modules. Only worth fixing if testers hit it (a `?v=` on the entry script doesn't propagate to its imports) |
| Exclude dev files from the zip: tests, tools, `node_modules`, `.todo` stubs, `timeline/`, `gallery/` | Poki: remove testing artifacts | **before first submission** | The pack script copies an allowlist (entry html + `src/` minus `*.test.js`), not a denylist |
| `debug` flags off (GD `advertisementSettings.debug`) | [GD FAQ](https://github.com/GameDistribution/GD-HTML5/wiki/F.A.Q.) | **later** | Only with the GD branch |

---

## 8. ES modules without a bundler

No portal researched requires a single file or a bundle. All of them take a zip of static files and serve it over HTTPS.

- **`file://` never works for modules.** "If you try to load the HTML file locally (i.e., with a `file://` URL), you'll run into CORS errors due to JavaScript module security requirements" ([MDN modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)). This hits native wrappers (Cordova, Capacitor, Electron, some "offline" packagers). No portal does it. **Label: later** (only with a native wrapper; that's the day a bundler might earn its place).
- **MIME type.** Modules need a JavaScript `Content-Type`, and "most servers already set the correct type for `.js` files, but not yet for `.mjs` files" (MDN). **Must now:** use `.js`, never `.mjs`.
- **Many small files.** Each level of import depth adds a network round trip before the game can start. `<link rel=modulepreload>` would flatten that, but it only arrived in iOS Safari 17 (MDN compat data), so it does nothing on the target. With ~35 files and shallow imports on HTTP/2 CDNs this is milliseconds, not seconds. **Skip**, unless load-time measurements on the A41 over 4G say otherwise. Keep the file count far below itch's 1,000.
- **iOS 14 syntax gap: the one real finding.** A syntax error in any module kills the whole module graph, which means a black screen. The repo's rule R2 ("browser code sticks to ES2020, enforced by `tsc` with `lib: ES2020`") only catches **APIs**. I checked with the repo's own `tsconfig` and `tsc`: `arr.at(-1)` is flagged, but these pass silently:

  | Passes `tsc`, breaks on | Feature (MDN compat data) |
  |---|---|
  | iOS < 14.5 | `static x = 1` class fields, `#private` fields |
  | iOS < 15 | `#private` methods, top-level `await` (partial until 27) |
  | iOS < 16.4 | `static { }` blocks, regex lookbehind `(?<=…)` |
  | iOS < 15.4 | `structuredClone` (it's in the DOM lib, so not flagged) |
  | iOS < 14.5 | bare `new AudioContext()` (only `webkitAudioContext` before that) |
  | iPhone, any version | `element.requestFullscreen()` |

  **Label: must now.** A grep in the pre-push hook for the syntax rows is cheap. The API rows need a real iOS 14 device (or remote device) once per game.
- **Import maps** (iOS 16.4+) and **module workers** (iOS 15+) aren't available on the target. **Skip** both. Relative import paths need neither.

---

## 9. P2P multiplayer on portals (later, but it shapes the core now)

- WebRTC needs a signalling channel and usually STUN/TURN. All of those are **external requests**. Poki approves multiplayer servers case by case through its CSP settings ([external resources](https://developers.poki.com/guide/external-resources-policy)). YouTube forbids external calls. Discord's networking doc lists WebRTC as **unsupported** ([Discord](https://docs.discord.com/developers/activities/development-guides/networking)).
- Poki maintains **netlib**, a WebRTC P2P library for web games with free hosted signalling and TURN, which can also be self-hosted. It's marked beta ([github.com/poki/netlib](https://github.com/poki/netlib)). It's the obvious candidate when multiplayer comes, but it would be a runtime dependency, so it needs a justification row.
- CrazyGames' multiplayer rules are about UX: room/invite info passed through the SDK, the first player dropped straight into a private room, CrazyGames usernames shown ([multiplayer](https://docs.crazygames.com/requirements/multiplayer/)). CrazyGames only hosts files, so the networking is yours.
- **Label: later.** The part that matters now is already a rule: the sim is deterministic and imports nothing (R1, R4, R5). Networking stays a transport layer outside `src/sim/`, and every game must be fully playable single-player so it passes where networking is blocked.

---

## 10. The whole list, weighed

| # | Requirement | Label | One line why |
|---|---|---|---|
| 1 | Relative paths only, no external URLs | must now | Already true. Keeping it true is free, fixing it later isn't |
| 2 | No `eval`/`new Function`/inline handlers | must now | Portal CSPs. Zero cost |
| 3 | Syntax ≤ iOS 14.0 (no static/private fields, TLA, static blocks, lookbehind) | must now | `tsc` doesn't catch it. A black screen on the oldest target |
| 4 | `webkitAudioContext` fallback | must now | One line. b1 lacks it |
| 5 | `localStorage` in try/catch, saves best-effort and small | must now | Incognito, partitioning, Safari 7-day wipe |
| 6 | `pause()`/`resume()`/`mute()` seam; pause on hidden/blur | must now | Every portal's ad flow needs it. Painful to retrofit |
| 7 | Fixed-timestep sim | must now | Already done. CrazyGames tests at 144 Hz |
| 8 | Pointer events + keyboard; prevent scroll keys (space, arrows) and wheel; never swallow Esc | must now | b1 misses space/arrows |
| 9 | Fill any viewport, letterbox OK, DPR-aware, no orientation lock | must now | Mostly done. Check portrait and ultra-wide once |
| 10 | Gameplay within 1 click of load | must now | It's the metric that decides release |
| 11 | No links out, no own ads, analytics, splash or fullscreen button | must now | Nothing to build, only things not to add |
| 12 | `.js` not `.mjs`; never rely on `file://` | must now | MIME + CORS |
| 13 | Platform adapter file with Poki/CrazyGames branches | before first submission | Only when a real submission is days away |
| 14 | Pack script: allowlist copy, `index.html` at root, size/count/filename asserts, SDK tag swap | before first submission | ~30 lines of shell. Replaces a checklist |
| 15 | Debug panel/readouts off in the shipped entry | before first submission | Poki rejects dev tools |
| 16 | Test in each target portal's own tool (Poki Inspector, CrazyGames QA tool, GD iframe preview) | before first submission | They catch SDK event mistakes the docs can't |
| 17 | Playable with an ad blocker / SDK missing | before first submission | Adapter falls back to no-op |
| 18 | Thumbnails, end-of-content screen | before first submission | Portal metadata, not code |
| 19 | Choose portal per game (Poki exclusivity) | before first submission | Business choice that decides the integration |
| 20 | Cloud save via SDK (CrazyGames Data, YouTube saveData) | later | Only if a game has meaningful progress |
| 21 | Rewarded ads + their UI rules | later | Only if the design wants them |
| 22 | YouTube Playables branch | later | Invite-based and strictest. Its checklist is still a useful reference |
| 23 | Localisation beyond English | later | Keep text minimal instead |
| 24 | Multiplayer networking + portal approvals | later | After single-player loops ship |
| 25 | Telegram Mini App | later | You host, no portal rules. Easy if wanted |
| 26 | Loading progress bar | skip | Loads in well under a second |
| 27 | Cache-busting | skip | Portals version uploads. Pages' 10-min cache is tolerable |
| 28 | Bundling / single file / modulepreload | skip | No portal needs it, and iOS 14 ignores modulepreload |
| 29 | Facebook Instant Games, Discord Activities | skip | Platform in flux / needs a backend, and no WebRTC |
| 30 | Own analytics | skip | Banned or restricted almost everywhere |

---

## 11. Checks for a pre-commit review

Yes/no questions a reviewer can answer from a diff or by running the build. **[auto]** = a grep or a few lines in `.githooks/pre-push` or the pack script. **[auto+]** = automatable with headless Chromium over CDP, ~an hour to set up once. **[manual]** = a human looks or plays. **[covered]** = an existing check already answers it.

**From the diff (every commit that touches `src/` or an entry `.html`):**

1. Does any shipped file contain `http://`, `https://`, `//` protocol-relative URLs, or a path starting with `/` in `src=`, `href=`, `import`, `fetch(`? (Allowed: the SDK `<script>` line in a portal's `index.html`.) **[auto]**
2. Does any import point at a file that doesn't exist, or with the wrong case? **[covered]** by `tsc` import resolution on a case-sensitive filesystem.
3. Does the diff use a newer API than ES2020? **[covered]** by `tsc` `lib: ES2020`, for JS builtins only.
4. Does the diff add syntax iOS 14.0 can't parse: `static <name> =`, a `#name` field or method, top-level `await`, a `static {` block, `(?<=` / `(?<!` in a regex? **[auto]** (grep. Rare false positives in strings/comments are acceptable.)
5. Does the diff add a DOM API newer than iOS 14 (`structuredClone`, `OffscreenCanvas`, `roundRect`, `requestFullscreen`, `screen.orientation.lock`, `dvh` units)? **[auto]** for a small denylist grep. **[manual]** beyond that.
6. Is `new AudioContext` written with the `webkitAudioContext` fallback? **[auto]**
7. Is `localStorage` touched only inside a `try` (ideally in one save module)? **[auto]** (grep that `localStorage` appears only in allowed files). **[manual]** for the try.
8. Do `PokiSDK`, `CrazyGames`, `gdsdk`, `SDK_OPTIONS` or `ytgame` appear anywhere outside `src/platform/`? **[auto]**
9. Does the diff add `eval(`, `new Function(`, `setTimeout("…")`, or an inline `on…=` attribute in HTML? **[auto]**
10. Does the diff add `window.open`, `location.href =`, `top.location`, `target="_blank"`, or an `<a href>` in the game UI? **[auto]**
11. Does a new `keydown` handler `preventDefault` on `Escape`? **[auto]** (rough grep) / **[manual]**
12. Does new per-frame game logic use the fixed tick, not the frame's `dt`? **[manual]**
13. Does a new file end in `.mjs`, or have a name outside `[A-Za-z0-9_.-]`? **[auto]**
14. Does a new sound, timer or animation keep running while `paused` is true? **[manual]**

**From the build (before a submission, or when the entry/pack script changes):**

15. Does the zip have `index.html` at its root, fewer than 1,000 files, a total size under 5 MB, and no `*.test.js`, `tools/`, `node_modules/`, `.todo` files? **[auto]** (pack script asserts)
16. Does the game load with zero console errors, served from a sub-path, in Chromium at 800×450, 1920×1080 and 360×640 portrait? **[auto+]**
17. Does reaching the first `gameplayStart` take at most one click from load? **[manual]** once per game. **[auto+]** possible via an adapter log.
18. Does hiding the tab, or blurring the window, stop the sim and silence audio? **[auto+]** (CDP can emulate visibility) / **[manual]**
19. Do space, the arrow keys and the mouse wheel leave the parent page unscrolled when the game is in an iframe? **[manual]** once per game with a 10-line test page that iframes the build. **[auto+]** possible.
20. With localStorage blocked (a private window, or a thrown `SecurityError`), does the game still start and play? **[auto+]** / **[manual]**
21. With the SDK script blocked (ad blocker), does the game still start and play? **[manual]**
22. Is every debug surface (tunables panel key, `?rules=lab`, readouts) unreachable in the shipped entry? **[manual]** / **[auto]** if the pack script greps the entry for the debug flag.
23. Does it start and play on the real oldest targets: iOS 14 Safari and the A41? **[manual]** once per game. It's the only check that catches the API rows in §8.
24. Does the portal's own tool (Poki Inspector, CrazyGames QA tool, GD preview) show the expected event sequence with no duplicates and no external-resource warnings? **[manual]** per submission.

The cheap wins are #1, #4, #6, #8, #9, #10 and #13. Together they're about 15 lines of grep in the existing pre-push hook. Everything **[auto+]** can wait until the first submission shows it's worth an hour.

---

## Sources

Portal docs: [Poki SDK](https://developers.poki.com/guide/sdk-html5) · [Poki requirements](https://developers.poki.com/guide/requirements-quality) · [Poki web engine / sizes](https://developers.poki.com/guide/web-engine) · [Poki external resources](https://developers.poki.com/guide/external-resources-policy) · [Poki content safety](https://developers.poki.com/guide/content-player-safety) · [Poki web fit test](https://developers.poki.com/guide/web-fit-test) · [Poki Inspector](https://developers.poki.com/guide/inspector) · [Working with Poki](https://developers.poki.com/guide/working-with-poki) · [CrazyGames docs home](https://docs.crazygames.com/) · [CrazyGames technical](https://docs.crazygames.com/requirements/technical/) · [gameplay](https://docs.crazygames.com/requirements/gameplay/) · [ads](https://docs.crazygames.com/requirements/ads/) · [quality](https://docs.crazygames.com/requirements/quality/) · [multiplayer](https://docs.crazygames.com/requirements/multiplayer/) · [Data module](https://docs.crazygames.com/sdk/data/) · [GameDistribution SDK](https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation) · [GD FAQ](https://github.com/GameDistribution/GD-HTML5/wiki/F.A.Q.) · [GameMonetize SDK](https://github.com/GameMonetize/GameMonetize.com-SDK/blob/master/README.md) · [itch.io HTML5](https://itch.io/docs/creators/html5) · [YouTube Playables stability](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability) · [integration](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration) · [design](https://developers.google.com/youtube/gaming/playables/certification/requirements_design) · [privacy](https://developers.google.com/youtube/gaming/playables/certification/requirements_privacydata) · [Meta Instant Games changes](https://developers.facebook.com/blog/post/2025/07/31/web-and-instant-games-changes/) · [Telegram Mini Apps](https://core.telegram.org/bots/webapps) · [Discord networking](https://docs.discord.com/developers/activities/development-guides/networking) · [Poki netlib](https://github.com/poki/netlib)

Platform/browser: [MDN JS modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) · [MDN state partitioning](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning) · [Chrome storage partitioning](https://privacysandbox.google.com/cookies/storage-partitioning) · [WebKit 7-day storage cap](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) · MDN browser-compat-data (`@mdn/browser-compat-data`, fetched 2026-09-25) for every iOS version number.

Secondhand: CrazyGames optional exclusivity ([Cinevva guide](https://app.cinevva.com/guides/publish-game-crazygames)) · Newgrounds 250 MB and `index.html` at top level (forum/tutorial reports) · Facebook bundle sizes (search summary of FB bundle docs; the page itself didn't render).
