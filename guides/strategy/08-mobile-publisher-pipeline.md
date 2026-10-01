# 08 · The mobile publisher pipeline (Mob Control)

Scope: how mobile publishers take a game from prototype to a paid-marketing hit, with the numbers they gate on, and
what carries over to a browser-portal game. Unvalidated summary of one video.

**Source.** "How This Simple Mobile Game Makes Millions", MikeRoxy,
<https://www.youtube.com/watch?v=XCrqkJHbTVw>, transcript pasted by the user on 2026-10-01 (no timestamps; the
auto-captions are garbled in places, and the lost passages are left out). One commentator's account of one game;
none of its figures (100M+ downloads, $200M+ revenue, $7.9M in-app purchases in Q1 2025, 160% ROAS) is checked
against another source. The video has a sponsor segment for a payments service (a flat 5% fee against the stores'
30%); that is an advertisement, and nothing below uses it.

## The claims

### The stages

1. **Prototype.** The most basic version, to test whether the mechanic is fun. Mob Control's first version took one
   week; the mechanic was multiplying stickmen through gates on a loop. He says prototypes now need more features and
   polish than the days-long ones of 2021, which he doesn't quantify.
2. **Test.** The publisher spends a few hundred dollars on ads and reads three numbers: **CPI** (cost per install),
   playtime, and **day-1 retention**. Bad numbers: the game is dropped, and "nine out of ten prototypes" are. The
   hardest call is keep investing or take the learnings to a new project. The targets he gives, shifting by publisher
   and genre: **about 30 minutes of playtime, 30–40% day-1 retention, CPI under $2.** The aim is **LTV above CPI**
   (revenue per player over time against the cost of getting them). Mob Control showed near-launch numbers from the
   first test.
3. **Advanced development.** Months of polish, new content and frequent updates, with **A/B tests** on features,
   ad creatives, store assets and monetization, each checked against the target numbers. Spend stays small. The metric
   is **ROAS**, return on ad spend: Mob Control reached 160% at day 120 (each $1 of acquisition returned $1.60 within
   120 days, from ads and purchases).
4. **Scaling.** Once the maths works (CPI below LTV), spend big and test hundreds of ads at once. Risks: CPI rises with
   budget, and the interested audience saturates, so many titles peak early.
5. **LiveOps.** The game keeps changing: limited-time events, offers, content updates, seasonal challenges. He credits
   this for most of the revenue.

### Hyper-casual to hybrid-casual

- Hyper-casual: very simple games, ad-funded, player gone in days, profitable only while installs are very cheap
  (it was 36% of the top-100 downloads and 27% of all mobile game downloads in 2021, he says).
- Apple's privacy change (April 2021) made targeted advertising harder, installs got dearer, and the model broke.
- **Hybrid-casual** was the answer: more depth, ads plus in-app purchases, with the purchases bringing most value.
  Mob Control was one of the first to make the move: a new team of four, nine months, adding card systems, base
  building and other retention features.
- His conclusion: the era of making money fast with super-simple games is over. The first prototype can still be bare,
  but **progression and meta features should be planned from the ideation stage**, with a prototype tested on real
  players before months are committed.

## What carries over, what doesn't **[C]**

- *Carries over, already in the guides:* build the toy fast and test it ([game-design/05](../game-design/05-process-and-scope.md));
  kill criteria set before building (05 principle 6); testing the core before content
  ([game-design/09](../game-design/09-repetition-and-variety.md)); free real-player data from a portal playtest
  (05 principle 8). The pipeline is the same shape as the one in those guides, run with money.
- *Doesn't carry over: the economics.* The whole pipeline rests on **buying installs**. A portal game gets traffic
  from the portal and shares revenue (see [03](03-funding-and-link-rules.md)); there is no CPI, so LTV-over-CPI and
  ROAS don't apply, and A/B testing ads and store assets has no counterpart. Scaling by ad spend isn't available.
- *The numbers aren't comparable.* His 30–40% day-1 retention and 30-minute playtime come from paid mobile installs
  with a publisher's yardstick; the portal benchmarks recorded in [game-design/04](../game-design/04-motivation-and-audience.md)
  are 10–15% day-1 and 10+ minutes. Neither set should be applied to the other's platform. Don't use his as a pass
  mark for a portal game.
- *Doesn't carry over: the team.* LiveOps and a nine-month, four-person rebuild are a studio's scope, against the 4–8
  month solo cadence in [game-strategy #4](../game-strategy.md). Hybrid-casual's money comes from in-app purchases,
  and the portals' own rules are ads-only (03; also [game-design/04](../game-design/04-motivation-and-audience.md)'s
  warning on dark-pattern monetization).
- *Worth keeping:* "plan the meta at ideation, even if the first prototype is bare". It is one commentator's view, but
  it is consistent with the loop guides ([06](../game-design/06-gameplay-loops.md)), which say long loops give the
  reason to return. Whether a portal game needs one is a separate question, since portal players mostly don't return
  (04).
- *Survivorship.* One hit told as "a repeatable system", with no count of how many games ran the same system and
  failed beyond the "nine out of ten" line.
