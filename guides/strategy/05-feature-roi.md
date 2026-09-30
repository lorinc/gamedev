# Features by cost and return

Scope: which common game features pay for themselves in a small indie game, and which ones sink projects. General,
for any game.

**Unvalidated.** This comes from a summary the user pasted on 2026-09-30 of a BiteMe Games video that rates features
by cost vs return: <https://www.youtube.com/watch?v=0Ks54W2_XrQ>. Timestamps point into that video. Neither the video
nor the summary was checked. The last section is the summary's own commentary, not the video's.

## Worth it

- **A demo.** The most important feature (the video is from 2024): it converts players and gets the game into events
  like Steam Next Fest [20:17]. See [04](04-launch-plan.md).
- **Achievements.** An easy win: little development time, more retention and completionist play [13:39].
- **Anti-cheat, for multiplayer only.** Required once there's competition or leaderboards. For single-player games it's
  the lowest tier: don't waste time obfuscating save files [12:22].
- **Trains.** A running joke in the video, but argued seriously too: trains market well and look good in any genre
  [26:17].
- **Accessibility and graphics settings.** Basic comfort options matter more than top graphics. The video names toggles
  for motion blur, V-Sync and field of view as mandatory [08:24]. They're PC and 3D examples. The principle is basic
  comfort settings.
- **Difficulty settings.** They help turn demo players into buyers. Simple stat scaling (health and damage
  multipliers) is cheap and widens the audience a lot [28:55].
- **Controller support and rebinding.** Depends on the genre: essential for shooters and platformers, poor for menu-
  heavy management games. Native controller support pays back more than full key rebinding. Both add a lot of
  testing [04:59].

## Traps

These features are often misjudged as small, and they sink projects:

- **Multiplayer.** The biggest pitfall for solo devs and first games: networking, server costs, latency and testing
  add huge technical debt. Only for experienced developers or inherently social genres such as party games [21:28].
  - **The user's counterpoint (2026-09-30): this is a blanket statement, and the optimum is in the details.**
    Asynchronous, gradual multiplayer avoids almost all of those problems.
  - **No Man's Sky** started with little more than shared discoveries: names others gave to planets and species showed
    up in your game. Real co-op came in later updates, step by step.
  - **King of Thieves** is asynchronous: you build a trap-filled dungeon, and other players try to rob it while you're
    not there. You watch the replays.
  - The trap is *real-time* multiplayer: latency, sync, servers. Asynchronous traces (discoveries, ghosts, built
    things others visit) skip most of that. The game design guide
    [04](../game-design/04-motivation-and-audience.md) says the same: "Asynchronous traces beat synchronous presence".
  - *These examples are from Claude's knowledge, not researched here.*
- **Branching narratives.** Unless the game is a visual novel, tracking choices and writing diverging stories costs
  more writing and assets than a small team can sustain. A linear story is tighter and better polished [23:43].
- **Modding support (Workshop).** Adding it mid-project fails. Modding also only thrives with a huge player base,
  which 99% of indie games never have [18:05].

## Depends on the game

- **Localisation.** It opens other markets, but translation is expensive, and longer languages (German, Dutch) break
  UI laid out for English [01:07].
- **Unit tests.** Useful for simulation and management games with deep, overlapping systems. Dismissed as too slow for
  action games [16:04].
- **New Game Plus.** A poor substitute for real content. Spend the effort making the main game longer or better
  [10:55].

## The summary's own commentary (not from the video)

- **Testing.** The video rates unit tests low (C tier) as time-consuming, yet complains about the time sunk into
  fixing localised UI, controller rebinding and multiplayer. The summary argues that tests are what prevent that lost
  time.
- **Foundations, not features.** Multiplayer, modding and branching state change how the game manages its state. They
  can't be added later. They're foundations you build the game on from the start, as Minecraft did with modding.
