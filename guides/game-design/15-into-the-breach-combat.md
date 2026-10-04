# 15 · Into the Breach: combat mechanics

Scope: Into the Breach's combat. What the mechanics are, why they work, and where they fail. Written for a turn-based
taming game with no killing, no luck, an opponent that telegraphs its moves, moves with several effects, cooldowns,
and everything visible.

**Sources.** Researched 2026-10-04 from the web. The primary source is Matthew Davis's GDC 2019 talk *Into the
Breach Design Postmortem* (auto-captioned transcript, including the Q&A). Davis is the programmer and Justin Ma the
artist of Subset Games, a two-person studio, and the talk "represents our collective memory". Other primary sources
are interviews with Ma and Davis: Game Developer's *Road to the IGF* (2018), Alex Wiltshire's piece on failure for
Game Developer (2018), and Nic Reuben's Cliqist interview with Ma (2018). GMTK covers the game in one segment of a
wider video. Weapon and rule details come from player guides and Wikipedia, since the fan wiki could not be fetched.
Timestamps are approximate.

## The mechanics

- **The board.** An 8x8 grid, three mechs against the Vek (giant bugs). Each mission lasts a fixed number of
  turns, usually four or five, and the player wins by surviving them, not by killing every enemy (Wikipedia; GDC
  ~19:00). About 200 maps exist, all hand-made (GDC Q&A ~57:30).
- **The turn.** The Vek move and show their attacks: a highlighted target tile, the attack type, and the damage.
  The player then moves and fires each mech. Only after that do the Vek carry out "the attacks still marked on the
  board". The order in which enemies and environment effects resolve is shown by hovering an icon or holding Alt,
  and it matters, because the first attack can move or kill something before the next one (player guides).
- **There is no hit chance.** Every attack, the player's and the enemy's, does exactly what it shows: "there's no
  miss chance and there's no hit chance … the information is always going to be accurate", so the player's turn is
  "completely deterministic" (GDC ~13:30). The randomness sits in what the enemy decides before the player turn
  (where to move, whom to target) and where new Vek emerge.
- **Health is the city.** Buildings feed the Power Grid, which is the run's health bar. Each building hit costs
  Grid Power, and losing all of it ends the run. Mechs can be disabled, and their pilot can die, but mechs fully
  repair between missions (Wikipedia; Wiltshire).
- **Small numbers.** Mechs and Vek have a few hit points, and attacks deal 1 to 3 damage. Davis: "very low numbers
  and almost board game like design … where one point of damage is meaningful and then making that two points of
  damage is a huge change" (GDC ~5:40).
- **Weapons have several effects, and push is the main one.** The starting squad: the Titan Fist deals 2 damage to
  an adjacent tile and pushes the target. The Taurus Cannon fires a projectile for 1 damage and pushes. The Artemis
  Artillery deals 1 damage to the target tile and pushes all four tiles next to it (GameFAQs). A unit pushed into
  another unit, a mountain or a building takes 1 extra damage, and so does what it hits. A ground unit pushed into
  water or a chasm dies (player guides).
- **A pushed Vek keeps its attack, but the attack moves with it.** The attack is fixed in direction relative to
  the Vek, so moving the Vek one tile moves where the attack lands, often onto another Vek. "Check where its marked
  attack will point afterward" (Pixeltwelve guide).
- **Other levers.** A mech standing on a tile where a Vek is about to emerge blocks it and takes 1 damage per turn.
  A mech can skip its attack to repair. Smoke, fire, acid and ice change what a unit can do (player guides). Each
  mission allows one full turn reset, and a move can be undone freely before the mech fires (Steam guide).
- **Enemy behaviour is simple and stays the same.** Each Vek acts on its own, with no coordination: it looks at
  every attack it could make and picks randomly between the best and second-best (GDC Q&A ~56:50). A given enemy
  type always has the same health, weapon and movement. Harder variants ("Alpha", purple) have more of each but
  behave the same way (GDC ~28:00).

## Why it works

- **The threat is in the open, so the turn is a puzzle.** Ma: "When every enemy attack is telegraphed and there's
  no random chance in your attack options, the game starts to feel like a puzzle", one that "even an experienced
  player can still appreciate solving fresh … every time" (Road to the IGF). The design goal: "We wanted to make
  something where every death felt like your own fault" (ibid.). Davis calls the game "a puzzle game that's
  masquerading as a strategy game" (GDC ~45:30).
- **Telegraphing broke the genre, and fixed objects fixed it.** In a normal tactics game, about "90% of the
  tactics" is managing threat zones: cover, dodging, hit chances. Once every attack is shown, moving a mech out of
  the way is trivial and that layer disappears (GDC ~15:00). The answer was something that cannot move: the
  buildings. The Vek target them, and losing them is losing the game. Davis says this was hard to see because
  every other game teaches "don't let your things get hurt and kill the enemy units" (GDC ~16:30). An earlier
  version, where building damage weakened the mechs, failed because play was "only interesting when you're
  worrying about the buildings getting damaged" (~17:00).
- **Moving enemies is more fun than killing them.** "Killing enemies just fundamentally wasn't as fun as
  manipulating them". Pushes, teleports and grapples "made the player feel really smart" (GDC ~17:40). The turn
  limit made this possible: if the goal is to survive four turns, "you could make interesting non-lethal weapons"
  and "it didn't matter if anybody died" (~18:40). GMTK sums up the chain: you know what they will do, so the game
  is about protecting buildings, so it is about pushing enemies so their attacks miss, so you can trick enemies
  into killing each other.
- **Short fights, no dead turns.** The turn limit removed the slow end of a normal tactics fight (chasing the last
  enemy, searching for enemies). Every turn has a decision. Four-turn battles were not planned; they were found by
  following the telegraph (GDC ~19:20).
- **The UI decided what weapons could exist.** The goal was a chess board: you know what each piece does without
  hovering over it (GDC ~24:00). Showing only the target was not enough; players also needed the attack type,
  because moving a unit changes the result differently for a punch than for a shot. So: "instead of building a UI
  that could describe all of our weapons we had to start building weapons that could be described by the UI"
  (~26:00). This gave three attack types (melee, projectile, artillery) and attacks only in the four straight
  directions. A mech can shoot along any line from any tile it can reach, and every enemy's attack lines up with
  the grid. Odd shapes, a "four-leaf clover" and radius attacks, were cut because they forced the player to check
  ranges all the time (~27:00). Some icons were added three months before release (~24:50).
- **Enemies the player can learn.** Fixed enemy stats work like chess pieces: learn the Firefly once and it is
  always the Firefly (GDC ~28:00). One Alpha variant once pushed its target while the basic one did not, and that
  was cut, because "you thought you had the firefly down … and then when they get upgraded suddenly" the answer was
  different (~29:00).
- **Competing values make the choices.** Buildings, mechs (a dead pilot is lost), and bonus objectives all matter.
  Ma: "When you have this interplay between buildings being important, mechs being important, objectives being
  important, it empowers interesting decision-making" (Wiltshire). Sometimes the right move costs a mech.
- **An easy puzzle can still be fun.** Davis says the game is "a good chunk easier than FTL" and still fun,
  because solving a puzzle you are good at is satisfying, while an easy FTL felt like pandering (GDC ~47:50).

## Where it fails

- **Too hard means unsolvable, not hard.** "As soon as you have six monsters attacking six locations and you've
  only got three mechs then it's not that it's hard … you just can't stop" it, and the player feels the game is
  unfair. The threshold was "very tight": "as soon as we spawned one too many enemy the whole game broke" (GDC
  ~45:50). Spawn counts are therefore adjusted to the board, one of the few places the game reacts to the player
  (Q&A ~52:40). Ma: "The most frustrating thing that can happen is to have a situation where you have no options
  whatsoever"; maps avoid layouts where a Vek cannot be moved. Davis: "If the enemy is in a position where you
  can't move it, then it becomes this unstoppable force and it's not fun at all" (Wiltshire).
- **Checkmate states need a patch of luck.** When the next enemy turn is a certain loss, the player has to press
  End Turn knowing they will lose, which Davis calls "really mean". The fix was Grid Defense, a small chance
  (15% at the start, per player guides) that a building resists a hit, so "there's always a chance". Davis calls
  it a "gross ugly pillar" in a deterministic design: players "really hated" the pilot skill that raised it, and he
  would now hide it (GDC ~22:00–23:30). Ma: players hate missing a 95% shot in XCOM, but "most take no issue with a
  5% chance effect where the result is in their favor", as long as they never plan on it (Cliqist).
- **Fixed enemies limit difficulty tuning.** Small changes ("this one extra unit does one extra point of damage")
  were not allowed, because enemies had to stay learnable. Push attacks were kept off early enemies for
  accessibility, and could then not be added to later variants. By accident, push nearly vanished from the enemy
  side; "we didn't really even realize that until quite late" (GDC ~28:30–30:30).
- **The UI constraint cut whole weapon trees.** Ma's large upgrade trees for weapons were dropped, and a research
  system failed because the weapon design "really couldn't support" it (GDC ~30:30, ~35:00).
- **Players fight the rules they were taught.** In playtests, players protected their mechs and not the buildings,
  so the game felt much harder to some players than others. Reviews called it both too hard and too easy (GDC
  ~47:00). Ma: the game requires players "to unlearn something that's been taught by almost every other strategy
  game" (Wiltshire). Even the starting Artillery Mech, which pushes by hitting the tile next to an enemy, was "a
  lot to ask", because "all games have always trained us to shoot at the enemy" (GDC Q&A ~54:50).
- **Little tension once read, and repetition.** One reviewer beat it on the first run: with information "so
  tight and terse", "there isn't much in the way of challenge", and Hard mode "increases the number of Vek in an
  attempt to brute force defeat" (sser, RPG Codex, 2018). Another found the same small set of Vek on every island
  and the same special mission per island on every run, and said random upgrades can remove the tension (Frostilyte,
  2018). The 2022 Advanced Edition added enemies, squads and an "Unfair" difficulty (Wikipedia).
- **The strategy layer between fights stayed thin.** After years of failed versions, it became a mission list on
  a map with one choice and three resources. Davis: it is not "brilliant", it just has to "get out of its way" of
  the combat (GDC ~38:30–50:30).

## Possible uses **[C]**

For a taming game with an animal as the opponent. These are inferences, not from the sources.

- **Keep:** the animal shows its next move with target, type and number, and the player's moves have no hit
  chance. The sources say this makes the turn a puzzle that still holds experienced players.
- **Keep:** a goal that the animal's moves threaten and that cannot step aside (the herd, a nest, the player's
  camp, the animal's own calm). Without one, a fully shown attack is easy to dodge and the threat layer collapses.
- **Keep:** a fixed number of turns as the goal, not depleting the opponent. It is what made non-lethal moves
  (push, redirect) the core of Into the Breach, which fits "no killing" directly.
- **Keep:** moves that redirect the animal's own telegraphed action (a push moves where its attack lands), and few
  attack shapes in straight lines, so a move is readable without hovering.
- **Watch:** one move too many from the animal makes a turn unsolvable, not harder. Difficulty needs a check that
  every turn has an answer, and Into the Breach needed a small luck patch for checkmate states.
- **Watch:** opponents whose behaviour changes between variants. The sources say learnable, fixed behaviour was
  worth losing fine difficulty tuning.

## Sources (by value per hour)

1. Matthew Davis, *Into the Breach Design Postmortem*, GDC 2019 (50 min + Q&A). Video
   <https://www.youtube.com/watch?v=s_I07Iq_2XM>; Vault <https://gdcvault.com/play/1026333/-Into-the-Breach-Design>
2. Alex Wiltshire, *Reimagining failure in strategy game design in Into the Breach*, Game Developer (28 Feb 2018).
   <https://www.gamedeveloper.com/design/reimagining-failure-in-strategy-game-design-in-i-into-the-breach-i->
3. *Road to the IGF: Subset Games' Into the Breach*, Game Developer (2018).
   <https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i->
4. Nic Reuben, *Into the Breach: Building a Better Mech with Subset Games' Justin Ma*, Cliqist (6 Mar 2018).
   <https://cliqist.com/2018/03/06/into-the-breach-building-a-better-mech-with-subset-games-justin-ma/>
5. GMTK (Mark Brown), *The Games That Designed Themselves* (17 Aug 2020), Into the Breach segment ~1:15–2:15.
   <https://www.youtube.com/watch?v=kMDe7_YwVKI>
6. sser, *RPG Codex Review: Into the Breach* (27 Feb 2018). <https://rpgcodex.net/content.php?id=10843>
7. Frostilyte, *Into The Breach Review* (6 Jun 2018). <https://frostilyte.ca/2018/06/06/into-the-breach/>
8. Player guides for rules: Steam *Beginners Guide & Advice*
   <https://steamcommunity.com/sharedfiles/filedetails/?id=2618873050>; Pixeltwelve beginner guide
   <https://pixeltwelve.com/guides/into-the-breach-beginner-guide-enemy-attacks-grid>; GameFAQs *Rift Walkers*
   <https://gamefaqs.gamespot.com/pc/205477-into-the-breach/faqs/76363/rift-walkers>
9. Wikipedia, *Into the Breach*. <https://en.wikipedia.org/wiki/Into_the_Breach>

Not read: Soren Johnson's *Designer Notes 70* podcast with Justin Ma (audio, no transcript found). Adam Millard (The
Architect of Games), *Does Into The Breach Really Have Perfect Information?* (2018; transcript page blocked). The
Into the Breach fan wiki (blocked), so status-effect details (smoke, fire, acid, ice) are from player guides only
and unverified against the game.
