# 17 · Genre, mode and mood

Scope: three words for what kind of game something is, and the build order they imply. General, for any game.

**Source.** "Game Genres - a Design Perspective", Indie Game Clinic, <https://www.youtube.com/watch?v=3KJbYdNP5js>.
The transcript was pasted by the user on 2026-10-05 and has no timestamps. It is one designer's opinion (ten years
in industry, five teaching, about 80 viewer games reviewed in under a year), argued from those reviews and from
examples; nothing in it is measured. He says he hasn't seen the genre/mode split used for games before. Everything
here is from the transcript unless marked.

## The claims

### Why designers classify games differently from players

- Players argue about genres for fun ("is it a roguelike?"). A designer asks a different question: what do this
  category's players expect, why do its best games work, and what is broken in it that could be fixed.
- Steam tags mix several kinds of category. Only some of them (his example: "3D platformer") are genres.

### Three words, borrowed from film and literature studies

- From film studies (Altman): *semantic* genres are recognised by what you see (a western: desert, cowboy hat),
  *syntactic* ones by the shape of the story (a mystery), and *pragmatic* ones are whatever fans say they are. "Cozy"
  is pragmatic.
- From literature: **genre** is what the story is about (horror); **mode** is how it is framed and delivered.
  *Dracula* is horror in the epistolary mode (letters); *World War Z* is zombie horror as UN reports. His food
  version: Mexican is the genre, taco truck or restaurant is the mode.

### His definitions for games

- **Genre** = what the player does moment to moment. It tells you the **3C**: character, camera and controls (an
  industry term; in big studios some designers work only on these). "Real-time strategy" and "platformer" put a
  camera, a character and an input device in your head at once.
- **Mode** = the structure over sessions: why the player does things, what the rewards and long goals are.
  Roguelike, roguelite, metroidvania, Soulslike and (often) deck-builder are modes. "Soulslike" can't be a genre:
  the originals are 3D brawlers, and there are Soulslike card games.
- **Mood** = aesthetic, theme, feeling: cozy, horror.

### The pyramid

| Layer | Holds | Word |
|---|---|---|
| Top | aesthetic, theme, mood | mood |
| Middle | progression: what you collect, upgrade, invest in | mode |
| Bottom | core mechanics: what you do over and over | genre |

- Each layer stands on the one below. If the core activity isn't enjoyable, nobody cares about the rewards; if the
  progression doesn't work, nobody cares how pretty it is.
- **Hollow Knight:** platformer is the genre (jumping, side-view fighting: the fun of any 30 seconds), metroidvania
  and Soulslike are the modes (exploring, upgrading, secrets).
- A game is an activity. A strong mood can decide between two good games; it can't save a weak base.

### Genre or mode, depending on the game

- **Roguelike** is a genre in the classic games (top-down, grid, turn-based: you see it in a screenshot) and a mode
  in modern ones (Spelunky, Enter the Gungeon: you see a platformer or a twin-stick shooter, and the roguelike part
  only shows over many runs).
- **Deck-builder** is a genre in tabletop deck-builders, where building the deck is what you do every turn (digital
  example: Party House in UFO 50). In **Slay the Spire** and Loop Hero it is a mode: 80–90% of the time you are
  *using* cards, and building the deck is the long-term progression.
- **Rogue Legacy 2** lets the player pay to lock the castle layout, which switches its mode from roguelike to
  metroidvania. A mode can be optional.

### A mashup needs a design reason: Spelunky

- Derek Yu's questions (from his *Spelunky* book): what do I like about platformers (easy to pick up, tension on
  every jump), what don't I (replaying the same levels, memorising layouts), what do I like about roguelikes
  (variety, meaningful death), what don't I (chores like pillar-dancing, memorising commands).
- Each half fixes a weakness of the other. That is the reason to combine them, not novelty or liking both.
- Most successful "genre mashups" are one genre in another's mode: Spelunky is a platformer (genre) in the roguelike
  mode. If you played it once you'd never notice the roguelike part.

### The four pitfalls he sees most

1. **Mashups without a design reason**: two things put together because the dev likes both, and they don't fit.
2. **Generators before the game is fun once.** "You do not need a level generator to make the game fun to play
   100 times until you know that it is fun to play once." His caricature: a roguelike whose levels build themselves,
   and the only thing to do in them is jump. Randomness is not what people love in roguelikes; build variety is (his
   earlier video "Your roguelikes are wrong").
3. **Content before the activity is proven:** a big metroidvania world, Soulslike areas, more enemies, weapons,
   story, dialogue. All middle of the pyramid. Exception: in a visual novel, talking to characters *is* the core.
4. **Starting from a mood or mode you can't build yet.** "I'll make a horror game" or "a roguelike" can commit you
   to art or tech beyond your current skills. Starting from the core activity shows quickly whether you can build
   it. His example: people start with a running, jumping character because it looks easy, then find they hate
   programming and animating one.

### Mood first, and the exception

- Starting with mood leaves you in limbo: no structure, no known fun. Time spent on "blood on wolves" or swaying
  flowers is lost, and you get too attached to that art to see the game is bad.
- He doesn't forbid starting from a theme: some designers start from mechanics, some from "a game about X". The
  mistake is spending a long time up there and *delaying* finding the core.
- **Accidentally cozy:** the developer of *Nights* built a cute open-world game. Testers called it cozy, he hadn't
  known the label, and he then studied that market and steered the game toward it. The mood was found from the core.
- Cozy games are often a collection of simple minigames (crops, fishing). The game is the meta-question of fitting
  them into a day, and that question needs the minigames to exist first.

## Possible uses **[C]**

- *Overlaps with earlier guides:* "the verb comes first" is the library's first agreed point (README, 01 §2.2,
  05 §2.2); "repeat a tested core, then vary it" is [09](09-repetition-and-variety.md); generators before the core is
  05's tripwire and [03](03-levels-onboarding-difficulty.md)'s procgen warning; appeal versus engagement is
  [08](08-engagement-vs-appeal.md) (mood is mostly appeal). The new parts are the genre/mode/mood split, the
  "genre or mode depends on the game" test, and the mashup question.
- **The 3C is the base only when the moment-to-moment lives in the character.** That holds for his examples
  (platformers, brawlers, shooters). In an idle or incremental game, moving and the camera are only the way in; what
  the player does over and over is a decision (Cookie Clicker's moment-to-moment is choosing the next purchase, not
  the click). There the pyramid's bottom and middle overlap, and "build the 3C first" can point at the wrong layer.
  Not from the video.
- **The base can be found rather than chosen.** His order assumes you know your genre on day one. When the core
  activity is still unknown, building a first guess at the base, then exploring the middle cheaply (maps, paper,
  throwaway prototypes), can show where the real base is. The *Nights* story is an instance of this at the top
  layer. The condition that keeps it safe is his own: the middle exploration stays cheap, and no content or
  generators are built on it until the found base is fun once. Not from the video.
- **The mashup check as a review question.** For any combination: what weakness of A does B fix, and what weakness
  of B does A fix? If neither answer exists, it is novelty.
- **The genre/mode question for any card or deck design:** is the player mostly *playing* the set (deck as mode), or
  mostly *building* it (deck as genre)? The answer decides what the first prototype must prove fun.
- **Readability can belong to the base.** When the core activity is reading another creature or system (telegraphs,
  intents), the visuals that carry that information are part of the bottom layer, not the mood. Slay the Spire's
  intents took about ten versions ([11](11-slay-the-spire-engagement.md)). Not from the video.
