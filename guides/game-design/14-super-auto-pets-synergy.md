# 14 · Super Auto Pets: pet synergy

Scope: how Super Auto Pets (SAP) makes pets act on each other, why that works, and where it fails. The auto-battle is
the cautionary part. Written for a turn-based taming game where effects between the player's own pieces are also the
main strategy, but the player acts every turn.

**Sources.** Researched 2026-10-04 from the web. Team Wood (two people at launch, Danish developer Arkuni and an
anonymous partner, per Wikipedia) has given little published design commentary; the only developer statement found
in text is their 2021 itch.io forum post. A video interview (Not A Game Devlog, YouTube) exists but was not watched.
Mechanics are from the fan wikis and the reviews listed at the end. Items marked **[unverified]** come from general
game knowledge and were not checked against a source or the current patch (pet stats change often).

## The mechanics

### The loop

- **Shop, then fight.** Each turn the player gets 10 gold to buy pets (3 gold), food, or reroll the shop. The team
  is a row of 5 slots. Pressing End turn starts a fight the player only watches (Wikipedia; Engadget, 2022).
- **The fight.** The front pet of each team fights the front pet of the other. When one faints, the next steps up.
  Damage is dealt both ways at once, each pet hitting for its attack **[unverified wording; front-vs-front is in
  Wikipedia]**.
- **Run shape.** Arena mode: 10 wins before you lose your hearts, against recorded teams of other players
  (asynchronous). Versus: 8 players live (Steam page).
- **Growth.** Shop tier rises every two turns, up to tier 6. Three copies of a pet merge into level 2, six into
  level 3, which strengthens its ability (Wikipedia; Engadget).

### Abilities are triggers

Every pet has one ability, written as **trigger → effect**. The wiki lists 14 triggers, split by phase:

- **Shop-phase triggers:** Buy, Sell, Buy food, Eat shop food, Friend bought, Buy tier-1 pet, Level-up, Start of
  turn, End turn.
- **Battle triggers:** Start of battle, Faint, Friend faints, Friend summoned, Knockout. Later patches add Hurt and
  "before/after attack" phases (Grounded SAP order list).

Effects mostly do one of four things: add stats to a friend, deal damage, summon a token, or copy/repeat another
ability. Synergy is never a set bonus ("3 beasts = +10%", as in Teamfight Tactics); it is one pet's effect being
another pet's trigger.

### How pets act on each other (concrete chains)

- **Summon chains.** Cricket faints → summons a 1/1 zombie cricket. Horse: friend summoned → give it +attack. Sheep
  and Spider summon on faint; Turkey and Fly buff or multiply what is summoned (Stoy review, 2021). So a dying pet is
  a resource: every faint feeds every "friend summoned" pet behind it.
- **Positional buffs.** Dodo gives part of its attack to the pet ahead of it. Tiger makes the pet ahead use its
  ability twice. Parrot copies the ability of the pet ahead (Stoy; Engadget). Position decides who receives.
- **Start-of-battle damage.** Mosquito deals 1 damage to a random enemy before anyone attacks. Skunk lowers an
  enemy's health (Engadget). These pick off small pets before the fight starts.
- **Faint protection.** Turtle gives a friend armour when it faints (Engadget).
- **Counters through the same rules.** A summon team is weak to area damage (e.g. Hedgehog: faint → 2 damage to all
  **[unverified]**), because each token dies to it and each death fires further triggers.

A simulator run over every 1-3 pet team of turn one (3,424 teams, 24.9 million battles, Feb 2022 patch) found the
best team was **Cricket + Mosquito + Mosquito** (94.6% win rate), then Horse + Cricket + Cricket (93.4%); the best
single pet won 50%, the average team 35.7% (Matt Keeter, *Super Auto Sim*). Even on turn one, two cheap pets that
feed each other beat any one pet.

### Ordering

- **Same trigger → highest attack first, ties random** (wiki glossary; Grounded SAP, *Order of Operations*).
- Across triggers there is a fixed sequence. The community-written list has five phases and a 25-step standard
  order; e.g. "after faint" abilities fire before "friend faints", and an empty front slot is filled before some
  summons arrive (Grounded SAP). The game does not show this list.

## Why the synergy works

- **Few rules per piece.** One pet = one ability = one line of tooltip; no class/origin bonuses to learn (Switzer,
  TheGamer, 2021; review summaries). The depth is in combinations, not in the pieces.
- **One row instead of a board.** Placement is a single order of five slots, which keeps positioning readable while
  still mattering (Switzer: "trading the two-dimensional battlefield for a one-dimensional row").
- **Flavour matches function.** Abilities follow the animal's character (turtle shields, skunk weakens), which helps
  recall (Engadget: mechanics "tie to each creature's personality").
- **The shop is a stream of small decisions.** Every buy, sell, merge and food has its own trigger, so the shop phase
  is where the player acts and where the synergy is built.
- **No timer in Arena.** Team Wood's stated aim: "We wanted the auto battler experience with a competitive aspect but
  where [you] have time to think through your actions" (teamwood, itch.io forum, 29 Apr 2021).
- **Short runs, pick-up-and-play,** against 20–30 minute matches elsewhere in the genre (Engadget).

## Where it fails

### The auto-battle: the decision is far from its result

- The player's last input is End turn. Everything after is a cascade of triggers resolved by attack order and a
  25-step sequence the game does not show. To judge a buy, the player has to run that cascade in their head for an
  opponent they have not seen yet (Arena opponents are other players' recorded teams).
- The community built tools to do this outside the game: a snipe-damage calculator and odds calculator (Grounded
  SAP), and full battle simulators (Keeter; others). That players need software to predict a five-pet fight is the
  clearest evidence of the burden.
- Random targeting (Mosquito picks a random enemy) and random ties make the same team win or lose the same fight,
  so a loss does not clearly say "your decision was wrong" (Keeter models these as branching outcomes).
- Player reading of this on the Steam forum: "too much RNG, too much meta" (thread, June 2023); others call it "90%
  luck". A forum thread, not a measure; others in it defend the randomness ("if the game wasn't random, it would be
  boring").

### Synergy collapses into a meta

- Strong chains get found and repeated. The Dodo team was strong enough to be nerfed at launch (Stoy, Nov 2021);
  forum players in 2023 report facing the same Peacock / Kangaroo / Hippo teams again and again at high win streaks.
  When the best chain is known, the other options stop being viable (the depth problem in
  [10](10-depth-vs-complexity.md)).
- Frequent balance patches to fix this are a complaint of their own ("too many changes from patch to patch").

### The audience numbers

- Steam: 91% positive of about 25,000 reviews (Steam page, 2026-10-04). Peak 10,760 concurrent players in January
  2022, a month average of 6,683; the last 30 days averaged about 332, roughly 94% below the peak (SteamCharts).
- Steam is only part of it: the game is free and also on iOS, Android and the web, and most play may be on mobile.
  Mobile numbers were not found from a primary source (one aggregator claims 3.9 million downloads **[unverified]**).
- So the numbers show a streamer-driven spike (Northernlion and Ludwig, per Wikipedia) and a small, loyal long tail.
  They do not, on their own, show that the auto-battle is the cause of the narrow niche; that link is a reading,
  not a finding.

## Possible uses **[C]**

- **Keep:** one-line trigger → effect abilities; synergy as "my effect is your trigger" rather than set bonuses; a
  single ordered row instead of a board; flavour that matches the effect; summons and faints as resources.
- **Change:** in a turn-based game the cascade resolves after each player action, in view, so each step is visible
  and the player can respond. The prediction SAP asks for across a whole fight shrinks to one step ahead.
- **Watch:** SAP's hidden 25-step order is the thing to avoid. If two effects can fire at once, the order must be
  shown on screen, or be a rule a player can say in one sentence ("highest attack first" is that sentence; the rest
  is not).
- **Watch:** synergy chains converge on a meta. Countering through the same rules (area damage against summons) is
  what kept SAP's options viable, where it worked.

## Sources (by value per hour)

1. Grounded SAP, *Order of Operations* (Freetz): the full trigger order. <https://www.groundedsap.co.uk/Article.aspx?ID=11>
2. Matt Keeter, *Super Auto Sim* (Feb 2022): exhaustive turn-one simulation. <https://www.mattkeeter.com/projects/super/>
3. Super Auto Pets wiki, *Glossary*: trigger list, attack-order rule. <https://superautopets.wiki.gg/wiki/Glossary>
4. Sam Rutherford, Engadget (21 Mar 2022). <https://www.engadget.com/super-auto-pets-auto-battler-game-143026957.html>
5. Eric Switzer, TheGamer (24 Dec 2021). <https://www.thegamer.com/super-auto-pets-pokemon-auto-chess-battler/>
6. Jarred Stoy, Esteemed Steam Games review (6 Nov 2021). <https://www.esteemedsteamgames.com/posts/super-auto-pets-in-depth-review-steams-cutest-auto-battler>
7. teamwood, itch.io forum post (29 Apr 2021). <https://itch.io/t/1355958/super-auto-pets-chill-online-auto-battler>
8. Steam forum, "Too much RNG, too much meta…" (June 2023). <https://steamcommunity.com/app/1714040/discussions/0/6226836983331213926/>
9. Wikipedia, *Super Auto Pets*. <https://en.wikipedia.org/wiki/Super_Auto_Pets>
10. Steam store page and SteamCharts (both read 2026-10-04). <https://store.steampowered.com/app/1714040/Super_Auto_Pets/>, <https://steamcharts.com/app/1714040>

Not read: Rock Paper Shotgun review (O'Connor, 2021; fetch blocked), the Medium essay "Why Super Auto Pets is so good"
(403), the Not A Game Devlog interview video.
