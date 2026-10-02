# 09 · Audience and game shape

Scope: how to let market information narrow the shape of a game (genre, format) when the theme is fixed. General,
for any game. Researched on 2026-10-01 from web sources; every number has its source inline. What is inferred and
not sourced is marked **[inferred]**.

## The question (user, 2026-10-01)

The user's working theory, recorded as a leaning, not a decision:

- A successful game finds an audience, promises what they want and delivers it. An audience is people who enjoy the
  same mechanics, depth, pressure-and-release cadence and art style: a dimension below genre.
- Success is where an audience's needs meet the developer's core competences.
- A theme ("restore the ecosystem of a cave", with a simulation under it) does not determine the genre. The same
  theme could be a deck builder, a god game or a platformer. The market should choose the shape, not the developer.
- The ideal outcome is a small slice of a taste that is cheap to build, not the dream game.
- **Hunch, open to revision:** roguelike deck builders are low competition, high demand, and fit the theme.

## 1. The dimension below genre: Quantic Foundry

Quantic Foundry's Gamer Motivation Model is a survey-based (factor analysis) model of 12 motivations in 6 pairs
([GDC 2020 excerpt](https://quanticfoundry.com/wp-content/uploads/2020/08/9-Player-Segments-GDC-2020-Excerpt.pdf)):

| Pair | Motivations |
|---|---|
| Action | Destruction, Excitement |
| Social | Competition, Community |
| Mastery | Challenge, Strategy |
| Achievement | Completion, Power |
| Immersion | Fantasy, Story |
| Creativity | Design, Discovery |

They group into three clusters: Action-Social ("excite me"), Mastery-Achievement ("cool-headed, long-term,
cumulative") and Immersion-Creativity ("expansive, expressive, curious"). Discovery bridges the last two
([map of motivations](https://quanticfoundry.com/2015/12/21/map-of-gaming-motivations/)).

From the same data they derive **9 player segments** (same PDF). The ones relevant to a non-action, single-player
game:

| Segment | Wants | High | Low | Their games | Notes |
|---|---|---|---|---|---|
| Gardener | "Quiet, relaxing task completion." Rules stated upfront, reactive play, no planning ten steps ahead | Completion | Strategy (10th pct), Discovery (13th) | Candy Crush, Solitaire, Animal Crossing, The Sims | 30% female (average 19%), 22% casual (average 11%) |
| Architect | "My empire begins with this village." Planning that leads to progression; solo, slow, serene; build something that is not destroyed | Strategy (63rd), Completion (59th) | Excitement (15th), Community (20th) | Europa Universalis IV, Civilization, Banished | Median age 27, 12% hardcore (average 21%) |
| Acrobat | "Flexing my reflexes." Practice a hard challenge; world-building does not matter | Challenge, Discovery | Story (9th), Fantasy (11th), Design (13th) | Spelunky, Celeste, Tetris, The Binding of Isaac | 87% male |
| Bard | "Playing a part in a grand story." Shape a world with others | Design, Community, Fantasy | Power, Completion | FFXIV, Animal Crossing, Undertale | 27% female |
| Bounty Hunter | Solo world to make their own, with power growth | Destruction, Fantasy | Community, Competition | Far Cry, Mass Effect | |

The other four (Slayer, Skirmisher, Gladiator, Ninja) centre on action, competition or cinematic story.

**One trend.** The average Strategy score fell to the 33rd percentile between June 2015 and April 2024 (1.57 million
respondents): 67% of gamers now care less about long-term planning than the 2015 average. It was more than twice the
size of the next largest change, held across genders and most regions (China excepted), and the cause is not
established ([Push Square on the report](https://www.pushsquare.com/news/2024/05/bombshell-report-finds-players-becoming-less-interested-in-deep-strategy-games)).

**Limits.** The sample is self-selected people who took an online survey: about 81% male, median age 24, mostly
"core" gamers. It under-represents the casual and young players of web portals. Game-by-game audience profiles
exist but are a paid product; the pages could not be read (HTTP 403).

## 2. What the Steam data says about shapes

Chris Zukowski assigns each 2025 Steam release one genre and counts a "hit" as 1,000+ reviews, which he ties to about
$150,000+ revenue ([What the hell happened in 2025?](https://howtomarketagame.com/2026/01/27/what-the-hell-happened-in-2025/)).
The platform baseline was 608 hits out of 20,282 releases, 2.99%
([PokeIndie genre study](https://pokeindie.com/blog/game-genre-study-2026-which-genres-are-worth-building), which
re-uses his data).

| Genre | Hits | Released 2025 | Hit rate 2025 | Hit rate 2024 |
|---|---|---|---|---|
| Farming | 5 | 60 | 8.3% | 20.83% |
| Roguelike deckbuilder | 11 | 212 | 5.1% | 6.71% |
| Simulation (all; job sims pull it up) | 43 | 1,048 | 4.1% | 3.76% |
| Management | 19 | 549 | 3.4% | 5.43% |
| Horror | 39 | 1,208 | 3.2% | 1.81% |
| Idle / incremental | 27 | 965 | 2.79% | 3.05% |
| Tower defense | 9 | 511 | 1.76% | 1.44% |
| Automation | 5 | 420 | 1.19% | 1.57% |
| Colony sim | 2 | 193 | 1.0% | 0.63% |
| City builder | 2 | 397 | 0.5% | 2.70% |
| Puzzle | 14 | 4,022 | 0.34% | 0.36% |
| 2D platformer | 3 | 1,658 | 0.18% | 0.25% |

- **Unresolved conflict:** PokeIndie gives city builder 6.4%; Zukowski's own row reads 0.5%. Zukowski is the primary
  source, so his number is in the table.
- "Crafty-buildy-strategy-simulation" games were 48% of the 50 most-played demos in the October Steam Next Fest, and
  Zukowski calls them expensive, complex and slow to make
  ([The optimistic case](https://howtomarketagame.com/2025/11/04/the-optimistic-case-that-indie-games-are-in-a-golden-age-right-now/)).
  Read with the table: demand for building games is high, and the small ones mostly don't reach it **[inferred]**.
- Idle/incremental: PokeIndie's note is "cheapest to build; low revenue ceiling".
- **Limits.** Steam only. A hit rate is not expected revenue. One genre per game hides hybrids. It counts what was
  released, not what was wanted and never made.

## 3. The deck builder hunch, checked

- **High demand: yes.** In 2022 roguelike deckbuilders had the highest median sales of any indie genre, with only 99
  released since 2019 ([Game World Observer](https://gameworldobserver.com/2022/04/22/roguelike-deckbuilders-beat-all-indie-genres-on-steam-in-terms-of-sales-but-only-99-such-titles-released-since-2019)).
  Slay the Spire 2 sold 3 million in its first week of early access in 2026
  ([Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire_II)).
- **Low competition: no longer.** 99 in three years became 212 in 2025 alone, and the hit rate fell from 6.71% to
  5.1%. It is still about 70% above the platform baseline.
- **Solo-viable, with a bill:** systemic depth replaces authored content, but "balance work is endless" (PokeIndie).
- **Who plays it [inferred]:** Strategy, Challenge and Discovery, closest to the Architect and Acrobat segments.
  That is the motivation Quantic Foundry measured in decline, and the opposite end from the Gardener. No sourced
  motivation profile of deckbuilder players was found.
- **Web:** deckbuilders exist on itch.io and CrazyGames, and Luck be a Landlord went from itch.io to 5,332 Steam
  reviews at 94% positive ([Steam page](https://store.steampowered.com/app/1404850/Luck_be_a_Landlord/)). No
  numbers were found on how card games perform on portals.

## 4. What this does and does not decide

- It **removes** shapes: 2D platformer and puzzle have the worst odds on Steam; colony sim, city builder and
  automation, the shapes nearest the theme, are next worst for the count of releases.
- It **leaves two** with data behind them that a solo developer can build: the roguelike deckbuilder (higher odds, a
  higher bar, players who want to think) and the idle/incremental game (baseline odds, the cheapest to build, a low
  ceiling). **[inferred]** These serve different segments, so choosing between them is choosing the audience, which
  is the theory's own first step.
- It **cannot** say which un-made combination people want. Only showing something and counting who responds does
  that (appeal can be tested with images before anything is built:
  [game-design/08](../game-design/08-engagement-vs-appeal.md)).

## 5. Benchmarks: what a review count is worth

Rules of thumb from memory (2026-10-01), **not checked against a source**. The table in section 2 and the
"$150,000+" figure are sourced; the multipliers below are not.

| Step | Rule of thumb |
|---|---|
| Copies sold per review | about 30 to 50 |
| Price actually paid | about $5 to $6 on a $9.50 game, after sales discounts and cheaper regional prices |
| What reaches the developer | about 55% of gross, after Steam's 30% cut, VAT and refunds |

Worked for a $9.50 game:

| Reviews | Copies | Gross | To the developer, before own taxes and costs |
|---|---|---|---|
| 1,000 | 30,000 to 50,000 | about $150,000 to $300,000 | about $80,000 to $160,000 |
| 200 to 300 | (same arithmetic) | | about $15,000 to $50,000 |

- The gross for 1,000 reviews matches Zukowski's "$150,000+" (section 2).
- Reviews arrive over the game's whole life, often several years, not in the launch month.
- 1,000 reviews is rare, not huge: about 3% of 2025 releases reached it (608 of 20,282). It is roughly the level
  where one game pays for a year or more of a solo developer's time.
- By shape, the share reaching 1,000 reviews in 2025 runs from about 1 in 20 (roguelike deckbuilder, 5.1%) to about
  1 in 500 (2D platformer, 0.18%); see the table in section 2.
- **Missing:** how many games per shape land in the tier below (200 to 300 reviews). For a plan of repeatable modest
  successes, that floor is the number that matters, and it was not researched.

## Not found

- Genre performance numbers for Poki and CrazyGames. Poki reports 100 million monthly players and 1,018 games over
  1 million plays in 2025, without a genre split
  ([Poki, 2025 in review](https://poki.com/blog/2025-at-poki-a-year-in-review)).
- A motivation profile per genre or per game (paid at Quantic Foundry).
- Tag supply-and-demand studies (Game Oracle, a Medium tag-trend analysis) could not be read (HTTP 429 and 403).
