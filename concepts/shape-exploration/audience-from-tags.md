# The audience of each reference game, read from its store page

Supporting document for the [shape exploration](README.md). Made 2026-10-02.

**The user's request:** "for each game, determine the target audience, *based on the Steam game tags and the game
pitch*, independently from the game loops we flagged, and put it on the chart."

The result is on [map.html](map.html): each reference game has a green diamond for its audience, and a green ring on
every motivation the audience is made of.

## How it was made

1. **The input** is each game's Steam store page on 2026-10-02: its tags in Steam's order (up to 20), and its short
   description (the pitch). The loops, their sizes and their positions were not used.
2. **Each tag goes to one of three places** by a fixed table, the same for all ten games:
   - a motivation of Quantic Foundry's model, or two of them at half weight each;
   - mood: a tag that says how the game feels and has no motivation in the model;
   - form: a tag that says what the game looks like or how it is delivered. Ignored.
3. **Weights.** The first tag counts 20, the second 19, and so on down to 1. Each motivation that the pitch promises
   counts 20, the same as a first tag.
4. **The audience mark** sits at the weighted middle of those motivations, using the positions of the 12 dots measured
   on the picture.
5. **The gap** is the distance from the audience mark to the weighted middle of the game's loops (core 3, supporting
   2, side 1), in axis units, where a whole axis is 2.

## Results

Sorted by the gap. Motivations under 5% are left out.

| Game | Motivations (share) | Mood tags, outside the model | Mood share of the tag weight | Audience mark | Gap to the loops |
|---|---|---|---|---|---|
| A Short Hike | Fantasy 45%, Discovery 44%, Excitement 7% | Relaxing, Cute, Casual, Nature, Family Friendly, Beautiful, Cozy, Funny | 53% | 0.57 World, 0.09 Kinetic | 0.08 |
| Super Auto Pets | Strategy 34%, Community 25%, Competition 24%, Power 11% | Cute, Casual, Colorful, Family Friendly, Dogs, Horses | 32% | 0.42 Player, 0.06 Cerebral | 0.09 |
| Forager | Discovery 30%, Design 25%, Challenge 13%, Power 11%, Strategy 9%, Fantasy 7% | Casual | 2% | 0.22 World, 0.17 Cerebral | 0.11 |
| 20 Minutes Till Dawn | Challenge 29%, Excitement 19%, Power 19%, Destruction 18%, Fantasy 11% | Casual | 5% | 0.34 Player, 0.11 Kinetic | 0.12 |
| Islanders | Strategy 57%, Design 31%, Fantasy 7% | Relaxing, Beautiful, Colorful, Addictive | 32% | 0.19 World, 0.32 Cerebral | 0.13 |
| Minami Lane | Strategy 48%, Design 35%, Completion 16% | Cute, Casual, Relaxing, Colorful, Cozy, Cats | 56% | 0.20 World, 0.42 Cerebral | 0.22 |
| Stacklands | Strategy 59%, Challenge 17%, Design 15%, Power 8% | Cute, Casual, Colorful | 7% | 0.10 Player, 0.48 Cerebral | 0.23 |
| SUMMERHOUSE | Design 53%, Strategy 24%, Fantasy 13%, Discovery 11% | Relaxing, Casual, Colorful, Cozy, Cute | 44% | 0.51 World, 0.05 Cerebral | 0.24 |
| Brotato | Challenge 34%, Excitement 28%, Community 15%, Power 13%, Destruction 6%, Fantasy 5% | Casual | 2% | 0.49 Player, 0.10 Kinetic | 0.32 |
| Kabuto Park | Power 36%, Completion 35%, Strategy 29% | Casual, Nature, Cozy, Cute, Colorful, Relaxing, Family Friendly | 57% | 0.13 Player, 0.60 Cerebral | 0.62 |

**The audience in words** (Claude's reading of the same tags and pitch):

| Game | Who the store page is speaking to |
|---|---|
| A Short Hike | People who want to wander a pretty place in peace: a short, gentle, cute outing, children included |
| Islanders | Relaxed builders who like a puzzle: city building as a calm score game, with nothing to manage |
| Minami Lane | Cozy players who want a cute little management game: light optimising, wrapped in cats and colour |
| Kabuto Park | Cozy creature collectors of any age: catch them all, train a team, win light card battles |
| Stacklands | Card and board game players who like to run a village and keep it alive. Strategy first, cute second |
| SUMMERHOUSE | People who want to make something pretty with no rules: a creative toy to relax with |
| 20 Minutes Till Dawn | Action roguelite players: survive a bullet hell and grow an overpowered build, in a dark horror theme |
| Brotato | Action roguelike players who want short arcade runs and builds, alone or with a friend on the couch |
| Forager | Survival-crafting players who want to explore, gather and build a base, in a lighter 2D form |
| Super Auto Pets | Casual strategy players who want to compete with friends without pressure: cute, free, family friendly |

## What it shows

1. **For eight of the ten games the audience lands close to the loops** (a gap of 0.08 to 0.24). The store page and
   the loop map, made separately, describe roughly the same place.
2. **Kabuto Park is the one clear mismatch (0.62).** Its store page speaks of collecting, card battles and training:
   Completion, Power and Strategy, at the top of the map. Its core loop, catching bugs, was placed low on the World
   side. Two readings: the store page names what the bugs are for and leaves the catching to the mood tags; or the
   catch loop is placed too far from where its players are.
3. **Brotato is the second (0.32).** The tags are about the action half and co-op. The shop, which is one of its two
   core loops, shows up only in the pitch ("create unique builds").
4. **The peaceful games are sold on mood, and the model can't see it.** Mood tags carry 32% to 57% of the tag weight
   for A Short Hike, Islanders, Minami Lane, Kabuto Park, SUMMERHOUSE and Super Auto Pets. For Stacklands it is 7%,
   and for Forager, Brotato and 20 Minutes Till Dawn 2% to 5%. For the first group, about half of what the store page
   says about its audience has no place on the map. This is finding 10 of [findings.md](findings.md) ("the model has
   no motivation for nurturing, cuteness or relaxing"), now with a size.
5. **For four games a mood tag is first or second, ahead of most genre tags:** Relaxing is first for Islanders and
   Cute for Minami Lane; Relaxing is second for A Short Hike and SUMMERHOUSE.

## The user's pattern: the audience sits at the centre of the loops

**The user (2026-10-02):** "There might be another pattern here: the audience somehow always sits at the center of the
gameplay loops."

**Grade: likely**, in the sense of [findings.md](findings.md). Checked the same day, after the Super Auto Pets
correction below:

| Game | Audience to the centre of its own loops | To the centres of the other nine games (mean) | Own game's rank among the ten | To its nearest loop | Inside the area the loops span |
|---|---|---|---|---|---|
| A Short Hike | 0.08 | 0.64 | 1st | 0.31 | yes |
| Super Auto Pets | 0.08 | 0.64 | 1st | 0.25 | yes |
| Forager | 0.10 | 0.41 | 2nd | 0.27 | yes |
| 20 Minutes Till Dawn | 0.12 | 0.66 | 1st | 0.47 | yes |
| Islanders | 0.13 | 0.42 | 2nd | 0.29 | yes |
| Minami Lane | 0.22 | 0.46 | 3rd | 0.16 | no |
| Stacklands | 0.22 | 0.55 | 2nd | 0.13 | no |
| SUMMERHOUSE | 0.23 | 0.54 | 3rd | 0.14 | no |
| Brotato | 0.33 | 0.74 | 3rd | 0.32 | yes |
| Kabuto Park | 0.62 | 0.61 | 7th | 0.16 | no |

- **It is not just everything drifting to the middle.** For nine games the audience is two to eight times nearer its
  own game's centre than the centres of the other games, and its own game is among the three nearest of ten.
- **For five games the audience is at the centre and on no loop:** A Short Hike, Super Auto Pets, Forager, 20 Minutes
  Till Dawn and Islanders. The audience is two to four times nearer the centre than the nearest loop, and the loops
  surround it. 20 Minutes Till Dawn is the sharpest case: no loop is within 0.47 of its audience, and the centre is
  0.12 away. Brotato is surrounded too, but no nearer the centre than its nearest loop.
- **For three it sits beside one loop, at the edge:** Minami Lane, Stacklands, SUMMERHOUSE.
- **Kabuto Park does not fit.**
- **What it may mean.** No single loop serves the audience; the loops stand on different sides of it. This fits the
  main finding in findings.md, the swing between pillars: the pillars are apart, and the audience is between them.
- **What limits it.** The audience mark is itself a middle of several motivations, and the loops were placed by the
  same person using the same motivations as rulers. The plainest reading is that a store page names the same
  motivations the loops serve, in about the same proportions. Whether developers aim for this, or tags simply
  describe what is in the game, the data can't say. "Always" is nine of ten in a sample of ten successes.
- **What the tool covers (user, 2026-10-02):** "a game can fail for a million of reasons, we can find games that fit
  or not fit this pattern and failed. This tool only works in the 'game mechanics and loop expectations met'
  dimension of a game." So failed games would not test the pattern, and the pattern does not predict success. It
  describes one dimension: whether the loops deliver what the store page leads its audience to expect.

## Corrections to the loops that came out of this

- **Super Auto Pets, the shop (user, 2026-10-02):** "you misread the shop motivation. The shop is where your team gets
  really good… aka powerful." And: "the shop is power by strategy and grind." So Power is what the loop is for,
  and strategy and grind are the means. The shop loop was at 0.30 Player, 0.55 Cerebral, next to Strategy; it is now at 0.34
  Player, 0.30 Cerebral, next to Power. The core loop's distance to the audience mark fell from 0.51 to 0.26, and the
  game's gap from 0.15 to 0.09. Note that the store page itself puts Strategy first (34%) and Power at 11%: the
  audience mark sits low because of Community and Competition, not because of Power.

## How far it can be trusted

- **It is independent of the loops only in its input.** Claude made both the tag table and the loop positions, with
  the same 12 dots as rulers. The agreement in point 1 is weaker evidence than it looks.
- **The tag table is a judgement.** The softest calls: Building and City Builder split between Design and Strategy
  (this puts 24% Strategy on SUMMERHOUSE, a game with nothing to plan); Survival as Challenge (for Stacklands and
  Forager it is closer to a genre label); Farming Sim as Design; Roguelite as Power.
- **The mark is a blend.** Motivations far apart are independent ([motivation-map.md](motivation-map.md)), so a mark
  in the middle of two of them is not a place where the players are. The rings say more than the diamond.
- **Steam tags are set by players and by the developer**, and describe the game as much as the buyer.
- **The weights (20 down to 1, pitch at 20) are arbitrary.** Differences of a few percent mean nothing.
- **SUMMERHOUSE has 17 tags**, the others 20.

## The table of tags

| Motivation | Tags |
|---|---|
| Discovery | Exploration, Crafting |
| Discovery and Fantasy | Open World |
| Discovery and Design | Sandbox |
| Discovery and Challenge | Open World Survival Craft |
| Design | Design & Illustration, Life Sim, Farming Sim, Agriculture |
| Design and Strategy | Building, City Builder, Base Building, Colony Sim |
| Strategy | Strategy, Turn-Based Strategy, Turn-Based, Management, Resource Management, Puzzle, Deckbuilding, Card Game, Card Battler, Auto Battler, Tabletop, Solitaire |
| Completion | Creature Collector, Hidden Object |
| Power | RPG, Party-Based RPG, Roguelite |
| Power and Design | Gun Customization |
| Challenge | Survival, Bullet Hell, Score Attack, Roguelike |
| Challenge and Excitement | Action Roguelike, 3D Platformer |
| Excitement | Action, Arcade, Bullet Heaven, Flight |
| Excitement and Destruction | Shoot 'Em Up, Top-Down Shooter, Arena Shooter, Hack and Slash, Combat |
| Competition | PvP |
| Competition and Community | Asynchronous Multiplayer |
| Community | Co-op, Local Co-Op, Multiplayer |
| Fantasy | Adventure, Atmospheric, Walking Simulator, Horror, Lovecraftian, Dark Fantasy, Fantasy, Sci-fi |
| Story | none of the tags on these ten pages |

- **Mood (outside the model):** Relaxing, Cozy, Cute, Casual, Family Friendly, Beautiful, Colorful, Addictive, Nature,
  Cats, Dogs, Horses, Funny.
- **Form (ignored):** Indie, Singleplayer, 2D, 3D, Pixel Graphics, Top-Down, Isometric, Stylized, Hand-drawn,
  Minimalist, Cartoony, Short, Great Soundtrack, Controller, Free to Play, Procedural Generation, Replay Value, PvE,
  Simulation, Female Protagonist.

## The store pages, as read

Tags in Steam's order; the last column is what the pitch was read as promising.

| Game | Tags | Pitch | Read as |
|---|---|---|---|
| A Short Hike | Exploration, Relaxing, Adventure, Indie, Cute, Pixel Graphics, Open World, Casual, Nature, Short, Singleplayer, Great Soundtrack, 3D Platformer, Family Friendly, Beautiful, Female Protagonist, Flight, Walking Simulator, Cozy, Funny | "Hike, climb, and soar through the peaceful mountainside landscapes of Hawk Peak Provincial Park as you make your way to the summit." | Discovery, Fantasy |
| Islanders | Relaxing, City Builder, Strategy, Building, Puzzle, Indie, Minimalist, Singleplayer, Beautiful, Colony Sim, Atmospheric, Colorful, Procedural Generation, Addictive, Score Attack, Replay Value, 3D, Top-Down, Turn-Based Strategy, Exploration | "ISLANDERS is a minimalist strategy game about building cities on colorful islands." | Strategy, Design |
| Minami Lane | Cute, Casual, Life Sim, Relaxing, Management, Simulation, Colorful, Cozy, Indie, City Builder, Strategy, Resource Management, Isometric, Stylized, Hand-drawn, Singleplayer, Cats, Building, 2D, Hidden Object | "Welcome to Minami Lane! Build your own street in this tiny cozy, casual management sim! Unlock and customize buildings, manage your shops, and maximize the happiness of your villagers to complete quests and fill your street with love!" | Design, Strategy, Completion |
| Kabuto Park | Creature Collector, Casual, Nature, Cozy, Cute, Card Battler, Colorful, Relaxing, RPG, PvE, Deckbuilding, Party-Based RPG, Strategy, 2D, Hand-drawn, Cartoony, Simulation, Singleplayer, Female Protagonist, Family Friendly | "Enjoy summer in Kabuto Park! Catch the cutest bugs, train them and win the Summer Beetle Battles Championship in this tiny bug collection game! Upgrade your equipment to find rarer, stronger and shinier little friends." | Completion, Power |
| Stacklands | Card Game, Management, Survival, Roguelite, Card Battler, City Builder, Strategy, Building, Solitaire, Singleplayer, 2D, Deckbuilding, Tabletop, Cute, Simulation, Indie, Hand-drawn, Casual, Colorful, Fantasy | "Stacklands is a village builder where you stack cards to collect food, build structures, and fight creatures. […] Play your cards right and expand your village!" | Design, Strategy, Challenge |
| SUMMERHOUSE | Sandbox, Relaxing, Singleplayer, Casual, City Builder, Building, Pixel Graphics, Colorful, Atmospheric, Indie, Simulation, 3D, Stylized, Strategy, Cozy, Design & Illustration, Cute | "A tiny building game about beautiful lived-in houses. No rules or restrictions, just pure creativity." | Design |
| 20 Minutes Till Dawn | Action Roguelike, Bullet Hell, Survival, Roguelite, Shoot 'Em Up, Horror, Top-Down Shooter, Combat, Pixel Graphics, Singleplayer, Lovecraftian, Casual, Bullet Heaven, Strategy, Action, RPG, Gun Customization, Controller, Score Attack, Dark Fantasy | "20 Minutes Till Dawn is a survival roguelite where endless hordes of creatures lurk from the dark. Craft an array of overpowering builds and eradicate waves of Lovecraftian nightmares. Will you be able to survive the night?" | Power, Destruction, Challenge |
| Brotato | Roguelike, Singleplayer, Bullet Hell, Action Roguelike, Local Co-Op, Bullet Heaven, Multiplayer, Survival, Arena Shooter, Sci-fi, Roguelite, Replay Value, Top-Down Shooter, Hack and Slash, Arcade, Co-op, Casual, 2D, Action, Controller | "Brotato is a top-down arena shooter roguelite where you play a potato wielding up to 6 weapons at a time to fight off hordes of aliens. Choose from a variety of traits and items to create unique builds and survive until help arrives." | Excitement, Power, Challenge |
| Forager | Open World Survival Craft, Pixel Graphics, Survival, Crafting, Indie, Farming Sim, Sandbox, 2D, Adventure, Base Building, Resource Management, Singleplayer, Multiplayer, Building, Exploration, Open World, RPG, Casual, Agriculture, Simulation | "The highly popular and quirky 'idle game that you want to actively keep playing'. Explore, craft, gather & manage resources, find secrets and build your base out of nothing! Buy land to explore and expand!" | Discovery, Design, Power |
| Super Auto Pets | Auto Battler, Free to Play, Strategy, Multiplayer, Cute, PvP, Asynchronous Multiplayer, 2D, Casual, Card Battler, Colorful, Family Friendly, Card Game, Minimalist, Combat, Roguelike, Dogs, Horses, Turn-Based, Deckbuilding | "Build the strongest team of pets and tussle with your friends!" | Power, Competition, Community |
