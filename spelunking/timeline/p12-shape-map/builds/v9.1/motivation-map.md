# The motivation map: reference

Supporting document for the [shape exploration](README.md). It holds what Quantic Foundry's model says and what the
map measures. How the pool sits on it is in [04-assess.md](04-assess.md).

**Sources**

- Nick Yee, "Gaming Motivations Group Into 3 High-Level Clusters" (Quantic Foundry, 2015-12-21), saved by the user as
  [guides/NickYee_game_motivation_map.pdf](../../guides/NickYee_game_motivation_map.pdf). The site blocks automated
  readers.
- A Quantic Foundry text listing the games behind each motivation, pasted by the user on 2026-10-02 (no link given).

## The 12 motivations

With the reference chart's own keywords:

| Pair | Motivation | Keywords |
|---|---|---|
| Action ("Boom!") | Destruction | guns, explosives, chaos, mayhem |
| | Excitement | fast-paced, action, surprises, thrills |
| Social ("Let's play together") | Competition | duels, matches, high on ranking |
| | Community | being on a team, chatting, interacting |
| Mastery ("Let me think") | Challenge | practice, high difficulty, challenges |
| | Strategy | thinking ahead, making decisions |
| Achievement ("I want more") | Completion | get all collectibles, complete all missions |
| | Power | powerful character, powerful equipment |
| Immersion ("Once upon a time") | Fantasy | being someone else, somewhere else |
| | Story | elaborate plots, interesting characters |
| Creativity ("What if?") | Design | expression, customization |
| | Discovery | explore, tinker, experiment |

## What the article says about the map

- **Method:** multidimensional scaling on data from over 140,000 gamers. Motivations that correlate more are drawn
  closer together. The same structure appeared in all six regions they had data for.
- **Three clusters:** Immersion-Creativity (left: Story, Design, Fantasy), Mastery-Achievement (top: Completion,
  Strategy, Challenge), Action-Social (bottom right: Competition, Community, Excitement, Destruction).
- **Two bridges:** Discovery joins Immersion-Creativity to Mastery-Achievement. Power joins Mastery-Achievement to
  Action-Social. No bridge was found between Immersion-Creativity and Action-Social.
- **How to read distance:** "If someone scores high on a particular motivation, they are more likely to score high on
  the nearby motivations. The opposite isn't true though. Motivations that are farther apart are independent of each
  other; they don't suppress each other."
- **Axes (the authors' reading):** left = acting on the world, right = acting on other players; top = cerebral
  (careful, long-term), bottom = kinetic (dynamic, fast-paced).

## The illustration, measured

The user asked for special attention to the illustration itself. The map image was extracted from the PDF, the twelve
dots located, and the distances computed. **Unit: one grid square of the map.**

Limits of the measurement: the map is a 2D squeeze of many correlations, and the six regional maps on the last page of
the PDF keep the structure but move single dots around (in Southeast Asia, Story sits up near Discovery, and Strategy
and Completion swap places). So differences under about 0.3 squares mean nothing.

**Distance from Discovery to each motivation:**

| Motivation | Squares | Side of the map |
|---|---|---|
| Design | 0.92 | left (Immersion-Creativity) |
| Story | 1.19 | left |
| Strategy | 1.24 | top (Mastery-Achievement) |
| Completion | 1.44 | top |
| Power | 1.48 | centre (the bridge) |
| Fantasy | 1.68 | left |
| Community | 2.01 | bottom right (Action-Social) |
| Challenge | 2.10 | top right |
| Excitement | 2.60 | bottom right |
| Destruction | 2.61 | bottom |
| Competition | 2.72 | right |

**All distances** (dot positions read from the image; rows and columns in the same order):

| | Comp | Stra | Chal | Disc | Powr | Stor | Desi | Cmpt | Fant | Comm | Exci | Dest |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Completion | 0 | 0.68 | 1.54 | 1.44 | 1.63 | 2.60 | 2.36 | 2.91 | 3.11 | 2.82 | 3.17 | 3.56 |
| Strategy | 0.68 | 0 | 1.01 | 1.24 | 0.95 | 2.42 | 2.08 | 2.24 | 2.87 | 2.18 | 2.49 | 2.94 |
| Challenge | 1.54 | 1.01 | 0 | 2.10 | 0.88 | 3.18 | 2.76 | 1.57 | 3.53 | 2.10 | 2.10 | 2.84 |
| Discovery | 1.44 | 1.24 | 2.10 | 0 | 1.48 | 1.19 | 0.92 | 2.72 | 1.68 | 2.01 | 2.60 | 2.61 |
| Power | 1.63 | 0.95 | 0.88 | 1.48 | 0 | 2.41 | 1.96 | 1.35 | 2.70 | 1.31 | 1.54 | 2.08 |
| Story | 2.60 | 2.42 | 3.18 | 1.19 | 2.41 | 0 | 0.48 | 3.40 | 0.57 | 2.31 | 3.01 | 2.61 |
| Design | 2.36 | 2.08 | 2.76 | 0.92 | 1.96 | 0.48 | 0 | 2.92 | 0.79 | 1.85 | 2.54 | 2.21 |
| Competition | 2.91 | 2.24 | 1.57 | 2.72 | 1.35 | 3.40 | 2.92 | 0 | 3.51 | 1.28 | 0.78 | 1.75 |
| Fantasy | 3.11 | 2.87 | 3.53 | 1.68 | 2.70 | 0.57 | 0.79 | 3.51 | 0 | 2.31 | 3.01 | 2.43 |
| Community | 2.82 | 2.18 | 2.10 | 2.01 | 1.31 | 2.31 | 1.85 | 1.28 | 2.31 | 0 | 0.70 | 0.77 |
| Excitement | 3.17 | 2.49 | 2.10 | 2.60 | 1.54 | 3.01 | 2.54 | 0.78 | 3.01 | 0.70 | 0 | 0.97 |
| Destruction | 3.56 | 2.94 | 2.84 | 2.61 | 2.08 | 2.61 | 2.21 | 1.75 | 2.43 | 0.77 | 0.97 | 0 |

**What the picture shows:**

1. **Discovery stands alone, in the grey between the yellow and the blue.** It belongs to no coloured cluster. Its
   nearest neighbour is Design, on the left; Strategy and Story are about equally near after that.
2. **Discovery has two neighbourhoods, and they are far from each other.** Left: Design, Story, Fantasy. Up: Strategy,
   Completion. Design to Strategy is 2.08 squares and Design to Completion 2.36: as far as Discovery is from
   Challenge. The only thing the two sides share is Discovery.
3. **Power is the most central dot on the whole map** (smallest average distance to all others, 1.66). It is about
   one square from Strategy and Challenge, 1.3 from Community and Competition, and 1.48 from Discovery, the same as
   Completion. It is a hub, not a far step.
4. **Challenge is far from Discovery** (2.10), as far as Community. It is reached through Strategy or Power, not
   directly.
5. **Completion is out on the edge.** It is the most "cerebral" dot and the second most remote overall; Strategy is
   its one close neighbour.
6. **The left cluster and the bottom-right cluster are tight; the top one is loose.** Story, Design and Fantasy are
   within 0.8 of each other. Completion to Challenge is 1.54.
7. **On the authors' axes,** Discovery is on the "acting on the world" side and only slightly on the cerebral side.
   Completion is the most cerebral, Destruction the most kinetic, Fantasy and Story the most "world", Competition the
   most "other players".

## The games behind each motivation

Method, from the pasted text: over 100,000 gamers listed up to three favourite games; for each motivation, the games
named by the top 20% of scorers were pooled, then weighted against each game's general popularity, and grouped until
ten distinct sets remained.

| Motivation | Games most over-represented among its top scorers |
|---|---|
| Discovery | Elder Scrolls, Fallout, Fable, Zelda, GTA, Minecraft, Earthbound, Kerbal Space Program, Metal Gear Solid 3, Metroid Prime |
| Design | The Sims, City of Heroes, Animal Crossing, Guild Wars 2, Final Fantasy XIV, Dragon Age, Mass Effect, Monster Hunter, Pokémon, Elder Scrolls |
| Story | Dragon Age, Mass Effect, Persona 3/4, Tales of Symphonia, Xenogears, Final Fantasy VIII/IX/X, Knights of the Old Republic, Fire Emblem, Kingdom Hearts, Planescape Torment |
| Fantasy | Dragon Age, Elder Scrolls, Dishonored, Mass Effect, Skyrim, Fable, Fallout New Vegas, Knights of the Old Republic, Journey, Zelda |
| Strategy | Europa Universalis 4, Crusader Kings 2, Civilization, EVE Online, XCOM, StarCraft, Fire Emblem, Age of Empires, Warcraft 3, Kerbal Space Program |
| Challenge | Super Smash Bros. Melee, Devil May Cry 3, World of Warcraft, Dark Souls, Counter-Strike, Street Fighter, Monster Hunter, DoTA, StarCraft 2, Warcraft 3 |
| Completion | Final Fantasy, Assassin's Creed, Zelda, God of War, Animal Crossing, Elder Scrolls, Destiny, Pokémon, Guild Wars 2, Fire Emblem |
| Power | World of Warcraft, Diablo 2/3, DoTA, RuneScape, Destiny, Call of Duty, League of Legends, Counter-Strike, God of War, Resident Evil |
| Excitement | Super Smash Bros. Melee, Battlefield, Counter-Strike, Call of Duty, God of War, Destiny, Kingdom Hearts 2, Resident Evil, League of Legends |
| Destruction | GTA, Battlefield, Destiny, Call of Duty, Gears of War, Halo, Borderlands, Doom, God of War, Counter-Strike |
| Community | Final Fantasy XIV, Battlefield, Destiny, Guild Wars, EverQuest, League of Legends, Monster Hunter, World of Warcraft, Counter-Strike, DoTA |
| Competition | Counter-Strike, Super Smash Bros. Melee, DoTA, League of Legends, Street Fighter, Heroes of the Storm, StarCraft 2, Call of Duty, Battlefield, FIFA |

**What each dimension means in practice (Claude's reading of the lists):**

| Motivation | In practice |
|---|---|
| Discovery | mostly big open worlds to roam; and, in Minecraft and Kerbal, a system to experiment on |
| Design | making a character and a home your own (The Sims, Animal Crossing), and a team that is yours (Pokémon) |
| Completion | collecting everything and finishing every mission in a large game (Pokémon, Animal Crossing's museum) |
| Strategy | long-horizon planning in heavy games (grand strategy, 4X, tactics) |
| Power | levelling and loot: a character and gear that get stronger (Diablo, RuneScape, World of Warcraft) |
| Challenge | execution skill, practice and high difficulty, mostly dexterity and competitive |
| Excitement | fast action |
| Destruction | blowing things up in shooters; GTA's sandbox mayhem |
| Story | elaborate plots in long role-playing games |
| Fantasy | being someone else in an immersive world |
| Community | live team play and chat |
| Competition | live duels and rankings |

**What a game on two lists means (Claude's inference, not in the source).** A list places a game under a motivation
when that motivation's fans name it more than others do. A game on two lists is therefore drawing two groups, each for
its own part of the game. Animal Crossing and Pokémon are on both the Design list and the Completion list, although
those two motivations are 2.36 squares apart.

## Limits of the model

- **The sample** is self-selected and core-leaning (about 81% male, median age 24; see
  [strategy/09](../../guides/strategy/09-audience-and-game-shape.md)).
- **The game lists show extremes.** They are the favourites of each motivation's strongest scorers, not its casual
  end. The data is from about 2015: no idle game, no deck builder and no farming game appears anywhere in it.
- **No motivation for nurturing, cuteness or relaxing exists in the model.** Shapes built on those land on Design and
  Completion only because nothing closer exists, and the players they are for are the ones the model sees least.
- **No profile per mechanic is published,** and the per-game profiles are a paid product. Any mapping of a mechanic to
  motivations is an inference.
