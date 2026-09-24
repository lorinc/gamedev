# Toolbox

Frameworks, libraries, SDKs, and tools for the platform and its games. Design principles live in [opinionated_games.md](opinionated_games.md); game designs live in their own concept files (e.g., [spelunking_base.md](spelunking_base.md)).

---

### Runtime Stack

**Decided 2026-09-25:** dependencies are bad by default. Everything below was proposed by Claude, not chosen by the user, and each runtime dependency must be re-justified at the point a bundle actually needs it (see *Dependencies* in [spelunking/README.md](../spelunking/README.md)). Current stack: plain `.js` ES modules with JSDoc types checked by `tsc`, no build step, Canvas2D, zero runtime packages.

* **Simulation: Plain JavaScript, JSDoc-typed**
* Deterministic integer-grid simulation, engine-independent, runnable in a **Web Worker**, fully testable (principle: *Simulation / Renderer Split* in [opinionated_games.md](opinionated_games.md)).
* No engine physics (Phaser Arcade, Matter.js, Box2D): float-based, not deterministic across browsers.
* Fixed-point / integer math only; avoid engine-dependent `Math.*` functions in simulation code.


* **Renderer: Canvas2D now; PixiJS v8 is a candidate once shaders are needed**
* Deferred 2026-09-25: b1 (coloured squares) runs on Canvas2D. Re-argue Pixi only when a bundle needs what Canvas2D can't do on the Galaxy A41 (bloom, heat shimmer, a lighting pass).
* WebGPU with automatic WebGL fallback.
* 2D-first: fast sprite and particle batching for dense tile worlds and heavy particle use.
* Filter pipeline: bloom / glow, **displacement (heat shimmer)**, custom shaders.
* Render-to-texture for a 2D lighting pass; parallax via layered containers.
* Mature and widely used; strong AI coding assistance.


* **Renderer Alternatives Considered**
* **Phaser:** portal-proven (Vampire Survivors), but its framework features (Arcade physics, tilemap editor, scenes) go unused with a custom simulation, and custom multi-pass lighting fights its pipeline. Phaser 4 reworked the renderer; worth a re-check, not a replacement.
* **three.js:** best shader / post-processing ecosystem; a perspective camera gives real parallax depth and fog. More boilerplate for plain 2D. Choose if visuals lean more 3D.
* **Defold:** excellent portal fit (small builds, fast load), but Lua and editor-centric, less AI training data.
* **Godot web export:** ruled out (download size and load time break the 3-second rule).
* **LittleJS / Kaplay:** too thin for heavy shader and lighting work.


* **Performance Budget (Low-End Devices)**
* Lighting and bloom at half / quarter resolution.
* Capped particle counts with automatic quality downgrade.
* Test on a cheap Android phone and in all three aspect ratios from week one.


* **Storage**
* Browser storage (localStorage / IndexedDB) through the publisher SDK's storage abstraction where a platform requires it (e.g., YouTube Playables).
* String export / import as a backup and for sharing.


* **Networking (Optional Layer)**
* **WebRTC** for peer-to-peer play.
* **Trystero** for serverless signaling over public BitTorrent trackers, Nostr relays, or MQTT brokers; public STUN.
* Strict NATs (~10–20% of players) need TURN; accept the loss or budget a relay.
* Disabled on platforms that forbid external network calls.

---

### Distribution SDK

* **Playgama Bridge**
* One SDK, one build, **25+ platforms**: Poki, CrazyGames, Y8, MSN, GameDistribution, Lagged, Telegram, Discord, Facebook Instant Games, Reddit, TikTok, Yandex, VK, OK, Samsung Instant Plays, Xiaomi, Huawei, JioGames, Microsoft Store, YouTube Playables, and more.
* Abstracts ads, storage, and platform differences. Engine plugins exist; plain JS supported.
* Playgama handles QA / certification (~2–4 weeks); advertised 80% developer share. License: LGPL-3.0.
* Basis of the platform's publisher adapter.

---

### Art Tooling

Our art is **generated at runtime by shaders** (light, particles, procedural animation), so tools that output **shader code or runtime data** beat tools that bake texture files.


* **Recommended Pipeline**
* **1. In-game dev tweak panel (Tweakpane or lil-gui):** live sliders for every shader, light, and particle parameter, seen in the real scene (real lighting, heat, darkness). Presets saved as JSON. The most important art tool: standalone tools preview on neutral backgrounds, which misleads a light-is-the-art game.
* **2. AI-assisted GLSL:** describe the look, iterate in the tweak panel. Often faster than node editors for this style.
* **3. Material Maker:** for complex procedural patterns (rock strata, crystal growth, ore veins) where node graphs beat hand-written code. Port its GLSL into PixiJS filters, or bake small tiling textures as a fallback.
* **4. NixieFX or a small custom particle system** for effects.
* **Bonus:** the tweak panel's parameters are the same visual parameters players tune later (light color, pulse, particle fountains). Dev tool and player customization share one parameter schema.


* **Substance 3D Designer (Reference Only)**
* Adobe's node-based procedural material tool; industry standard.
* $199.99 perpetual (2026 version, updates through March 2027), or Steam indie bundle at $24.99 / month.
* Outputs baked PBR texture maps for 3D engines; its procedural runtime format does not run on the web.
* Not needed; only relevant for a future Steam version with baked textures.


* **Material Maker (MIT, v1.7, free; also on Steam)**
* Closest open-source equivalent to Substance Designer: ~200 nodes, real-time preview, PBR map export (Godot, Unity, Unreal, Blender).
* **Nodes are GLSL** and compile into combined shaders that can be extracted (e.g., via the Debug node); custom GLSL nodes supported.
* **Best fit for rock and material looks.**


* **NixieFX (Free Editor, Open-Source Runtime)**
* Browser-based particle / VFX editor for HTML5 games: multi-emitter timelines, curves, forces, noise, trails, sub-emitters, node-based materials.
* **PixiJS runtime adapter, deterministic particle simulation**, JSON export.
* Potentially ideal for sparks, heat, dust, loot pops. **New: check maturity** before depending on it.


* **Effekseer (Open Source)**
* Mature particle effects editor; WebGL runtime compiled to WebAssembly.
* 3D-oriented, heavier runtime. Second choice for particles.


* **cables.gl (MIT)**
* Browser node editor for real-time WebGL visuals; standalone offline editor available.
* Great for **exploring** looks (glow, shimmer, lighting ideas). Runtime too heavy to ship: prototyping only.


* **Pixel Composer (Source on GitHub; Check License)**
* Node-based 2D VFX / pixel-art tool, 300+ nodes including fluid simulation.
* Only useful if we bake sprite sheets, which goes against the runtime-procedural direction.


* **Rive (MIT Runtimes, Paid Editor from $9 / Month)**
* State-machine-driven animation.
* Probably skip: our animation is procedural in code, and its WebAssembly runtime adds weight.


* **Blender**
* Shader nodes and baking; general fallback for baking anything.

---

### Game-Specific: Spelunking Base

* **Rendering Techniques**
* 2D lighting: start with a light map plus occlusion from a tile-grid texture; avoid heavy 2D global illumination (e.g., radiance cascades) that kills low-end devices.
* Heat shimmer via displacement filter; bloom / glow for everything that matters; lighting and bloom at reduced resolution.
* Light-is-the-art keeps the bundle tiny: far under the 30 MB initial-payload limit (YouTube Playables), fast loads everywhere.


* **Code Reference: DrillDown**
* Open-source (Apache 2.0) Android / Steam factory builder (LibGDX / Java), archived 2024. Not replicated, but algorithms worth porting: conveyor pathfinding and auto-routing, dock / connector system, grid item transport. Attribution required.

---

### Sources

* [Material Maker 1.7: CG Channel](https://www.cgchannel.com/2026/07/open-source-material-authoring-software-material-maker-1-7-is-out/)
* [Material Maker on itch.io](https://rodzilla.itch.io/material-maker)
* [Substance 3D Designer 2026 on Steam](https://store.steampowered.com/app/4329280/Substance_3D_Designer_2026/)
* [Adobe Substance 3D prices: Photutorial](https://photutorial.com/adobe-substance3d-price/)
* [NixieFX: three.js forum](https://discourse.threejs.org/t/nixiefx-browser-particle-editor-with-an-open-source-three-js-runtime/93646)
* [Effekseer](https://effekseer.github.io/en/)
* [EffekseerForWebGL on GitHub](https://github.com/effekseer/EffekseerForWebGL)
* [cables.gl is now open source: Hacker News](https://news.ycombinator.com/item?id=41162036)
* [Pixel Composer on GitHub](https://github.com/Ttanasart-pt/Pixel-Composer)
* [Rive review 2026: MakerStack](https://makerstack.co/reviews/rive-review/)
* [Playgama Bridge on GitHub](https://github.com/playgama/bridge)
* [DrillDown on GitHub](https://github.com/Dakror/DrillDown)
