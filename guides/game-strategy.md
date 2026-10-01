# Game strategy

A standing list of what game to make, how long to spend on it, how to find its players, and why, for any game, not only this one. Keep it
general. Project-specific notes go in the project, not here. The companion list for day-to-day work is
[working-habits.md](working-habits.md).

Source: a video on shipping small commercial games the user shared on 2026-09-30 (title not recorded). Timestamps
refer to that video.

1. **Build the game on one mechanic.** [01:21] Don't make a small, watered-down version of a big game. That's a bad
   experience. Take one mechanic, make it the core, and do it exceptionally well and deeply, instead of juggling
   several half-baked ones.
2. **Let constraints set the design.** [09:18] A blank slate makes it hard to keep scope small. Start from a fixed
   constraint and ask what single mechanic fits it. The video's constraint is an asset pack (a Kyoto street, an 80s
   office); a hard design rule works the same way.
3. **Don't ship prototypes as games.** [06:32] Fast doesn't mean slop. UI, game feel and polish aren't the corners
   to cut for a deadline. If the game isn't good and polished at its scope, scrap it, or admit the scope was wrong
   from the start. Small must still mean high quality.
4. **Spend 4 to 8 months per game.** [05:53] Under 4 months leaves no time for the marketing beats (festivals like
   Steam Next Fest, creator outreach, wishlists). Over 8 months defeats the point of fast iteration. Jams stay as
   time-boxing practice, not as the release cycle. *Adopted by the user on 2026-09-30, replacing one game a month:
   "this guy knows better than I do, and I want to be successful, not right."*
5. **Write the pitch on day zero.** [13:03] A short cycle means a short marketing window, so the game must be
   marketable by nature. As soon as the prototype of the one mechanic works, write the 300-character store
   description. If it's boring or has no hook, kill the project and prototype something else.
6. **Count on compounding, not hits.** [14:17] The first small game won't make a fortune. The goal is a back
   catalogue: a game every six months becomes 5 or 6 games after a few years, each earning a trickle, and together
   they fund a studio.
7. **Release lite web versions to build a following.** *(The user's angle, 2026-09-30.)* Publish free, partial web
   versions, clearly marked as fragments of a bigger game in progress. Players who like the fragment can help make
   the real game on Patreon, Kickstarter or Steam. Web games, especially Reddit games, can build a massive
   following when done well. How to do it, from the research in [strategy/](strategy/):
   - The fragment ends at a wall the player can see, with "demo" or "part of X" in the title. One call to action on
     the end screen and the main menu: a mailing list before the Steam page exists, the wishlist after
     ([02](strategy/02-web-lite-funnel.md)).
   - The full game must be a visible jump from the fragment. Giving everything away leaves nothing to sell.
   - Where the ask is allowed differs by platform. Your own site and itch.io allow it. CrazyGames allows a Steam
     link only on desktop demos. Poki, GameDistribution, Playgama and YouTube Playables don't allow it. So make
     two builds from one codebase: a clean portal build and a home build with the ask
     ([03](strategy/03-funding-and-link-rules.md)).
   - Reddit games can't link out to a full version (Reddit's app rules name "demo" apps). On Reddit, make a small
     game built for the feed (daily or player-made content) and use it to build the following
     ([01](strategy/01-reddit-games.md)).
   - *Unvalidated:* Reddit judges intent, not wording, so a name that hints at a full version is still read as
     promotion. On Reddit, the funnel runs through posting, not the game: value-first GIFs, dev insights, niche
     subreddits and sanctioned promotion windows, with the Steam link in the comments when someone asks
     ([01 §3](strategy/01-reddit-games.md)).
   - Old fragments stay up and point to the newest game. Audiences carry over best between games in one world or
     series.
8. **"I just have to make a good game" is not a plan.** *(The user, 2026-09-30.)* Many first games flop on it. When
   a game leaves systems prototyping, start the launch plan: announce 4–6 months before launch, keep beats 2–3 weeks
   apart, grow a mailing list, and run a Steam page, a demo and Next Fest
   ([strategy/04](strategy/04-launch-plan.md)).
9. **Weigh every feature by cost and return.** *(Unvalidated: a video summary the user shared, 2026-09-30.)* Cheap
   wins: a demo, achievements, difficulty settings, basic comfort settings. Traps for a solo dev: real-time
   multiplayer, branching stories, modding. Not multiplayer as such: asynchronous, gradual multiplayer (No Man's Sky's
   shared discoveries, King of Thieves' raids on other players' dungeons) avoids almost all of its problems (the
   user). The optimum is in the details, not in blanket rules. Features that change how the game holds its state (networking, mods, branching) are
   foundations, decided at the start or never ([strategy/05](strategy/05-feature-roi.md)).
10. **Pitch creators one by one, and don't expect coverage to pay the bills.** *(Unvalidated: a video summary the user
    shared, 2026-09-30.)* Find a recent game like yours, list only the creators who play several indie games and
    uploaded in the last 3 months, and send a very short first-person email with the link. Never script what they say.
    If nobody plays it, suspect the game. Even good coverage gave one dev about 2,000 wishlists
    ([strategy/06](strategy/06-creator-outreach.md)).
11. **A devlog is a video production job; price it before starting.** *(Unvalidated: a video summary the user shared,
    2026-09-30.)* If you make one: script it (outline, flow, spoken draft), choose showcase or story, and record the
    footage from Git history after the script is final. It competes with shipping for the same hours
    ([strategy/07](strategy/07-devlogs.md)).
12. **Build around one medium loop with a forcing limit.** *(One designer's opinion, from a video transcript the user
    shared, 2026-09-30. Not measured.)* Short loops are fun but give no reason to return; long loops delay the fun
    until the game is shelved. The games people keep playing are built around one or two session-length loops (a full
    pack, nightfall, a research gate forces the turn), with a fun core loop under them and a long goal over them.
    Choose the session length first ([game-design/06](game-design/06-gameplay-loops.md)).
13. **Keep them engaged, not hooked.** *(One designer's opinion, from a video transcript the user shared,
    2026-09-30.)* The video's factors: swap between kinds of play and vary the intensity, keep introducing new things,
    tease what's coming, give a long-term goal with short ones on the way, and tune the challenge. Short runs where the
    player improves and the next session differs also keep people returning. He excludes daily rewards, resource decay
    and loss aversion on principle ([game-design/07](game-design/07-keeping-players-engaged.md)).
14. **A game has two jobs: appeal and engagement.** *(One educator's opinion, from a video transcript the user shared,
    2026-09-30.)* Appeal gets someone to look (the fantasy, the style, the premise); engagement keeps them playing (feel
    and interesting decisions). A game can be strong in one and weak in the other. Appeal can be tested from the start
    with images, before anything is built; engagement needs playtests
    ([game-design/08](game-design/08-engagement-vs-appeal.md)).
15. **Repeat a tested core, then vary it, in that order.** *(One educator's opinion, from a video transcript the user
    shared, 2026-10-01. Not measured.)* The repeated core makes it a game; variety makes it a better one, and it has to
    vary the skill used, not just enemy health or time limits. Test the core with people first, then run a separate
    messy round on where variety comes from and what tools it needs, and only then go into production. Match the
    amount of variety to what the genre's players expect
    ([game-design/09](game-design/09-repetition-and-variety.md)).
16. **Mobile publishers test with a few hundred dollars, and plan the meta from day one.** *(Unvalidated: one commentator's
    video, shared by the user 2026-10-01.)* Prototype in about a week, buy a few hundred installs, read cost per
    install, playtime and day-1 retention against targets set beforehand, and drop most prototypes. The economics
    (buying installs, LTV over CPI, LiveOps) don't apply to portals, and the retention targets aren't comparable
    with portal ones ([strategy/08](strategy/08-mobile-publisher-pipeline.md)).
