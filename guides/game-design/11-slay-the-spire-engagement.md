# 11 · Slay the Spire: combat and card design

Scope: Slay the Spire's combat and card design. What the mechanics are, why it is easy to start and hard to master,
how cards combine, why enemy intents work, and where the design fails. Written for a turn-based taming game whose bar
is "as easy to start and as hard to master as Slay the Spire".

**Sources.** Researched 2026-10-04 from the web. The primary sources are Anthony Giovannetti's GDC 2019 talk (the
slides and the auto-captioned transcript, including the Q&A, where most of the design detail is) and Casey Yano's
2026 interview for the Academy of Interactive Arts & Sciences (auto-captions). Giovannetti and Yano are Mega Crit's two
co-founders and designers. Secondary sources are two Game Developer interviews, GMTK's synergy video (transcript) and
a few critics. Card and enemy rules come from the fan wiki. Timestamps are approximate. The Rock Paper Shotgun article
on the intent system (Wiltshire, 2018) could not be fetched, so its content is known only from Wikipedia's summary.

## The mechanics

- **A turn.** You get 3 energy and draw 5 cards. Each card costs energy (usually 0 to 2) and either deals damage,
  gives Block, applies a status, or draws or creates cards. When you end the turn, your hand is discarded and the
  enemies act. Block absorbs damage and is gone at the start of your next turn.
- **Discarding the hand comes from Dominion.** It makes you cycle through the whole deck, "a property you really
  want". The Runic Pyramid relic lets you keep your hand, and Giovannetti says it "totally alters the play style":
  play becomes about holding cards, not flying through the deck. Hearthstone-style hand keeping was never tested
  (GDC, Q&A, ~25:20).
- **The deck.** The Ironclad starts with 10 cards: 5 Strike, 4 Defend and 1 Bash. After each fight you pick one of
  three random cards, or skip. More cards come from events and shops. Shops and some events remove cards. Relics are
  passive items that change rules (wiki; GMTK).
- **Enemies show their next move.** An icon over each enemy shows the move type (attack, block, buff, debuff, a
  combination, escape, sleep or unknown), and attacks show the damage number, with a multiplier for multi-hits (wiki,
  *Intent*).

## Why it is easy to start

- **Very few rules on screen.** Energy, HP, Block, and the enemy's number. The opening deck has two real verbs, hit
  and block, and the first decision is a sum: is the incoming number bigger than my Block?
- **No guessing.** Yano says the information was deliberately made "very clear", and that his rule for the whole
  game was to remove "high friction" things he disliked in complex card games. He did not want players to "ask your
  friends what the scary monster with a big axe is going to do" (AIAS ~29:40–33:40). Cards show their final numbers
  after modifiers, so the player does not do the arithmetic (described by the interviewer, ~28:30).
- **The deck is built one card at a time.** GMTK's Mark Brown, who avoids deckbuilding card games because picking
  from hundreds of cards is "too much for me", says the game makes deckbuilding "way less daunting": each reward is a
  choice of three, made in the context of the deck you already have.
- **Each card is simple on its own.** GMTK cites Mark Rosewater's "lenticular design": simple on the surface, deep
  only to players who see what it combines with.

## Why it is hard to master

- **Planning on three horizons (GMTK).** *Per turn:* play order (apply Vulnerable, then attack). *Per combat:* set up
  over several turns (stack poison, then a card that triples it; bank energy; hold two combo cards with Setup or
  Thinking Ahead). *Per run:* which cards, relics and shop buys to take.
- **Skipping and removing are as important as adding.** A synergy deck wants few cards, so every reward is also a
  question of whether the card dilutes the deck. GMTK calls this "so clever". It is invisible to a beginner, who
  takes every card.
- **Enemies punish single strategies.** Giovannetti: "We wanted a wide gamut of enemies that would challenge
  different strategies in unique ways. It was important to us that there would not just be a single dominant
  strategy" (Game Developer, 2020). Examples from the wiki: Gremlin Nob, an Act 1 elite, gains Strength whenever you
  play a Skill, so a block-heavy deck takes more damage. The Awakened One, a final boss, gains Strength whenever you
  play a Power. The Time Eater ends your turn after you play 12 cards, which caps long combo turns.
- **Ascension.** The game is balanced at base difficulty, then 20 harder levels unlock one at a time, so each
  player settles where their skill is. Metrics can then be sorted by level (GDC ~14:15–16:30).

## How cards combine

- **Set-up and pay-off.** Body Slam deals damage equal to your Block. Entrench doubles Block and Barricade keeps it
  between turns, so a block deck becomes an attack deck. Heavy Blade counts Strength three times (five upgraded), and
  Inflame (gain Strength) and Limit Break (double Strength) feed it. The community calls these "set-up" and
  "pay-off" cards, and a group of them an archetype (Moll, Game Developer, 2020).
- **Relics are the other half.** Corruption makes Skills cost 0 and Exhaust them. Dead Branch adds a random card
  whenever a card is Exhausted. Together they are among the strongest combos in the game (GDC ~5:13).
- **Why synergies hold players (GMTK).** They make you feel powerful (one turn of huge damage after many small
  ones). They make you feel smart, because you found the link yourself ("like you got one over on the developer").
  They add depth with few parts: 20 stand-alone cards give 20 strategies, while 10 cards that pair give many more.
  And they need set-up: a synergy that comes together too easily is less fun.
- **The randomness is what keeps combos acceptable.** You cannot pick synergies from a list, you respond to what is
  offered. Giovannetti says a combo that is too strong is acceptable if it is rare and hard to assemble. You may see
  Corruption early, skip it because it does not fit, and then find Dead Branch late. Being single-player helps too:
  a broken combo dominates the game, not another person (GDC ~4:30–6:00). Giovannetti: "we don't have to worry about the
  typical downside of strong combos—where the opponent feels bad" (Game Developer, 2020).
- **How each character is built.** Each character's card set has target counts per rarity and per role (block,
  attack, draw, energy gain), "three core archetypes that you build towards and then a lot of glue in between"
  (Yano, AIAS ~64:00, describing the design process carried into Slay the Spire 2).
- **The balance target is "every card should have a place", not equal power.** Some cards are build-arounds that
  define a deck, and some are staples that fit many decks without standing out. Each should be reasonable to take
  some share of the time. To avoid: "warping" content, meaning anything too powerful *and* too easy to set up, so
  that the game becomes about assembling it (GDC ~3:16–4:30).
- **Which strong things get removed.** Slow, grindy strategies were "nuked the hardest". An early version let
  players farm healing Powers indefinitely, which was optimal but "really really boring". A big number on screen that
  makes the player feel powerful was kept and encouraged (GDC Q&A ~24:00).

## Enemy intents

- **What they are.** Every enemy shows next turn's action, with the exact damage for attacks. Your turn becomes a
  puzzle with a known threat, solved with an unknown hand.
- **First attempt: random enemy moves, like Final Fantasy.** It failed. Players found it "too random", because the
  cards already carry plenty of randomness. More concretely: "you didn't know like how much block do I need on this
  turn … can I attack or not" (GDC Q&A ~28:26).
- **About ten versions followed** (GDC Q&A ~33:17). One gave each monster a sentence of flavour text describing its
  next move ("this slime is thinking about gooping you for four times five damage"). That broke down in two ways.
  Players had to learn every monster, and with several enemies the text sat in a large top bar where the player
  clicked between monsters to read each one (Yano, AIAS ~30:00; GDC Q&A).
- **Icons without numbers failed too.** "Nobody memorized any of the icons." Adding the numbers worked at once:
  "we put the numbers there and it just … clicked" (Yano, AIAS ~32:00).
- **Why full information did not make it shallow.** Yano: "what's interesting isn't the full information … you're
  already having to deal with randomness from the cards that you're drawing and figuring out what cards to play in
  which order. And if the enemy has even like one special ability, then you have to work around that. That's
  actually enough mental cycles." The randomness sits on the player's side (the draw). The enemy side is open.
- **Hiding intents is used as a cost.** The Runic Dome boss relic gives +1 energy per turn and shows all intents as
  unknown (wiki). Slay the Spire 2 shows several intents side by side instead of one merged icon; Mega Crit's reason
  was not found.

## Where it fails

- **The draw can leave you with no real choice.** One critic: "sometimes you will find yourself a sitting duck with
  absolutely nothing you can do about it". Card rewards are random too, so a planned build can never be ordered, and
  each act's boss is shown only when the act starts, so the final boss is known only in Act 3 (St. Elmo's Fire,
  2022). This is the price of the GMTK point above: the same randomness that keeps combos fresh also takes control
  away. Full enemy information shows the threat, but does not guarantee an answer to it.
- **Once strategies are known, play becomes execution.** Podgorski: with outside tips "you're essentially enacting
  a slow-moving cutscene. You already know which cards to prioritize" (The Gemsbok, 2019). GMTK: synergies harden
  into optimal strategies that "get a bit boring". Permadeath and random offers delay this but do not prevent it.
- **Infinite loops.** Dual Wield once copied any card in hand: "It was totally broken. You could copy skills and go
  infinite really easily" (Game Developer, 2018). It now copies only an Attack or a Power (wiki). Infinite combos are
  still possible with other cards. The Time Eater's 12-card limit is a counter (wiki).
- **Metrics mislead.** Madness looked like one of the strongest cards because it mostly came from an event late in
  Act 3, just before the boss, so it showed up in winning decks. Early on, two "super playtesters" dominated the
  averages (GDC ~11:07). The Awakened One was retuned after data showed Power-heavy decks struggling against it (Game
  Developer, 2018).
- **For Slay the Spire 2, a smaller card pool was tried and rejected.** According to a PC Gamer headline, players
  "hated it: 'We need new stuff!'" (2026; only the headline and a news summary were read, not the article). The
  summary says Yano wanted fewer cards so that each pick felt deliberate.

## Possible uses **[C]**

For a taming game with an animal as the opponent. These are inferences, not from the sources.

- **Keep:** the animal shows its next action with a number (flee, bite for 6, calm for 2), the way intents do. The
  sources say this was the change that made the combat click, and that open information did not make it shallow.
- **Keep:** randomness on the player's side (what you draw or have available this turn), openness on the opponent's
  side. Yano's "enough mental cycles" is a budget: one unknown hand plus one special ability per opponent.
- **Keep:** a starting set with two verbs, set-up and pay-off pairs added one pick at a time, and skipping or
  removing as a skill. Each animal can punish one strategy, as Gremlin Nob does Skills.
- **Watch:** combos that are strong and also easy to set up ("warping"), and slow, safe loops (infinite healing).
  The first takes over the game, the second is optimal but boring.
- **Watch:** a hand with no answer to a known threat feels worse than not knowing. The draw rules need a floor.

## Sources (by value per hour)

1. Anthony Giovannetti, *Slay the Spire: Metrics Driven Design and Balance*, GDC 2019 (30 min + Q&A). Video
   <https://www.youtube.com/watch?v=7rqfbvnO_H0>; slides
   <https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf>; Vault
   <https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics>
2. Casey Yano, *Designing Slay the Spire 2 with Creator Casey Yano*, Academy of Interactive Arts & Sciences
   (recorded August 2026). Intent history at ~29:00–34:00. <https://www.youtube.com/watch?v=Bo1eS08wCF4>
3. GMTK (Mark Brown), *How Synergies Make Slay the Spire Fun* (March 2019).
   <https://www.youtube.com/watch?v=terD4Bk3L_8>
4. Joel Couture, *Road to the IGF: Mega Crit Games' Slay the Spire*, Game Developer (22 Jan 2020).
   <https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i->
5. Game Developer staff, *How Slay the Spire's devs use data to balance their roguelike deck-builder* (27 Feb 2018).
   <https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder>
6. Félix Moll, *Archetypes in deckbuilding games*, Game Developer (15 May 2020).
   <https://www.gamedeveloper.com/design/archetypes-in-deckbuilding-games>
7. Slay the Spire wiki: *Intent*, *Gremlin Nob*, *Time Eater*, *Dual Wield*, *Ironclad*, *Slay the Spire 2: Intent*.
   <https://slaythespire.wiki.gg/wiki/Intent>
8. Daniel Podgorski, *Why Not to Look Up Tips for Slay the Spire*, The Gemsbok (16 Oct 2019).
   <https://thegemsbok.com/art-reviews-and-articles/slay-the-spire-mega-crit-games-outside-help-tips-wikis/>
9. St. Elmo's Fire, *Slay the Spire* review, Dragon Quill (15 May 2022). <https://www.dragon-quill.net/slay-the-spire/>
10. Wikipedia, *Slay the Spire* (Development section). <https://en.wikipedia.org/wiki/Slay_the_Spire>

Not read: Alex Wiltshire, *Why revealing all is the secret of Slay The Spire's success*, Rock Paper Shotgun (19 Feb
2018), and *How Slay the Spire was tested on Netrunner pros*, RPS (31 Jan 2018), both blocked. The PC Gamer article on
the Slay the Spire 2 card pool (body not served). Edge's 2019 feature (403).
