# Reddit games: building a following

Scope: how games run on Reddit's Developer Platform (Devvit), how Reddit games have built followings, and what the
rules let you do with that following (linking out, self-promotion).

Researched 2026-09-30. Sources are Reddit's own docs, blog and help center, fetched on that date. Reddit blocks
automated fetching of reddit.com itself, so current subscriber counts for the subreddits could not be checked. Numbers
below are the ones Reddit or the developers published, with their dates. Earning on Reddit (developer funds, in-app
payments) is left out on purpose. Here Reddit's only job is building a following.

## TL;DR

1. **A Reddit game is a web page in a post.** HTML/CSS/JS runs in a webview inside the Reddit app and website. Reddit
   hosts it, plus an optional small Node backend with Redis, realtime and a scheduler. You run no servers.
2. **The app can't send players off Reddit.** The Devvit Rules name "Demo" apps that link to a full version elsewhere
   as forbidden. A Devvit game can't be the fragment that points to Steam, Patreon or Kickstarter.
3. **The following stays on Reddit.** It's a subreddit, not an email list. What you can do with it outside the app
   (subreddit posts, sidebar, your profile) is a gray zone. Ask Reddit before you build on it.
4. **Followings come from content flywheels.** Every hit has one: player-made levels (Honk), drawings (Pixelary),
   riddles (Riddonkulous), missions (Sword & Supper), or a daily puzzle. Posts fade from the feed in days, so the game
   has to keep making new ones.
5. **Big followings are possible but rare.** Honk passed 300,000 subscribers, Pixelary 65,000, Riddonkulous 30,000 in
   30 days. Each hackathon draws about 2,600 to 3,000 entrants, and only a handful of games become known.
6. **Reddit's featuring program is the main discovery channel.** It's curated. The higher tiers need pro polish and
   good day-1/day-3 retention. Most of the reach comes from Reddit choosing you.
7. **Design for the phone and the feed.** Most players are on mobile. The first screen shows in the feed and must make
   people stop scrolling. Scrolling inside an inline post is prohibited.
8. **Porting is a rewrite of the shell, not the core.** You'll need the Devvit CLI (Node), a `devvit.json`, a
   Reddit-specific first screen, and Redis for saves, because `localStorage` is wiped on every app update. Each release
   also goes through a review.
9. **Smallest test: one Reddit-native daily or UGC game.** Build it for Reddit, not as a cut-down port of the big
   game. Run it for a season, then judge by returning players.

## 1. How a Reddit game works today

**What runs where.** Devvit Web is "a standard web app" plus "server endpoints that you define to communicate between
the webview client and the Devvit server"
([Devvit Web overview](https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview)). The client is
HTML/CSS/JS shown "in a webview inside of a post for Reddit users". The server is a Node runtime Reddit provides.
Clients call it with `fetch('/api/...')`. The listed requirement is "HTML/CSS/JS only". The official templates are
React, Phaser, Three.js and Hello World, and there are quickstarts for Unity and GameMaker.

**Can a plain JS + Canvas game run as is?** Mostly yes, with changes to the shell:

- The config accepts a `post` block alone, with no `server` block ("One of post/server"). The client folder defaults
  to `public` with `index.html` as the entry
  ([devvit.json config](https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_configuration)). So a
  client-only game with no bundler looks possible. *I read this in the config docs but did not test it.*
- Any server code "must be compiled to CommonJS". In practice that means a bundler step for the server part.
- "No external requests from your client". CSP locks the client to the webview domain, so every asset must ship with
  the app. A zero-dependency game already works that way.
- "localStorage clears on app updates". The iframe URL changes with each version, so player progress needs Redis,
  which means server code.
- Server limits: 30 s per request, 4 MB payload, 10 MB response, no websockets or streaming, no `fs`.
- File uploads are capped at 100 MB per file (per the
  [Unity quickstart](https://developers.reddit.com/docs/quickstart/quickstart-unity.md)). *I found no documented cap
  on total bundle size.*
- Tooling is the Devvit CLI (`npx devvit playtest / upload / publish`), which needs Node and npm on the dev machine.

**Mobile app vs web.** The same app runs on iOS, Android and the website. old.reddit.com shows a text fallback
([server overview](https://developers.reddit.com/docs/capabilities/server/overview)). Posts have two view modes
([view modes](https://developers.reddit.com/docs/capabilities/server/launch_screen_and_entry_points/view_modes_entry_points)):

- **Inline:** loads in the feed post and must "only respond to taps and clicks, load quickly, and respect post
  boundaries".
- **Expanded:** "a larger modal (web) or full screen (mobile)", opened only by the user.

A Reddit staff engineer says "a majority of Reddit's logged-in user base accesses the platform via mobile"
([Mobile-first post, Aug 2025](https://developers.reddit.com/docs/blog/mobile-first-development)).

**Backend Reddit provides.** Everything is hosted by Reddit, free of charge
([server overview](https://developers.reddit.com/docs/capabilities/server/overview)):

- **Redis:** 5 GB per installation, 40,000 commands per second, 5 MB per request. Supports strings, hashes, sorted
  sets and bitfields. Plain sets and lists are not supported.
- **Realtime:** 1 MB messages, 100 messages per second per installation. Clients subscribe, the server sends.
- **Scheduler:** cron and one-off jobs, up to 10 live recurring jobs per installation.
- **Reddit API:** create posts and comments, set flair.
- **Post data:** 2 KB of data attached to each post.
- **Push notifications:** a limited beta.

Limits are summed up in the [FAQ](https://developers.reddit.com/docs/guides/faq).

**Does this conflict with "no own servers"?** No. You write server code, but Reddit runs and hosts it. There's no
machine, bill or uptime for you to manage. The cost is lock-in: the Redis data and server code only work on Reddit.
Server calls to outside domains need per-domain approval, and "Personal domains (e.g., `personaldomain.com`) - Will
not be approved"
([fetch policy](https://developers.reddit.com/docs/capabilities/server/http-fetch-policy)).

**Review.** Every published version is reviewed, with a target of "1–2 business days". Reddit recommends "batching
updates into weekly (or less frequent) releases". Reviews pause over some holidays. Games need "a dedicated, non-test
subreddit" and must support mobile and web
([launch guide](https://developers.reddit.com/docs/guides/launch/launch-guide)).

## 2. Evidence of followings

All numbers below are published by Reddit or the developers, at the date shown. None is independently verified.
Subscriber counts include people who tapped an in-game "Join" button. That button is a documented tactic
([community games guide](https://developers.reddit.com/docs/guides/best-practices/community_games)).

| Game | Following (source, date) | What drove it |
|---|---|---|
| Honk (Flappy-style) | "more than 300,000 subscribers" ([Honk blog, 2025-10-10](https://developers.reddit.com/docs/blog/honk)) | A level builder. "once I added the level builder, things really took off. People immediately started creating a new level every minute". Built over a weekend after a hackathon win, by one developer. |
| Pixelary (draw and guess) | "more than 65,000 subscribers" ([Pixelary blog, 2025-07-15](https://developers.reddit.com/docs/blog/pixelary)) | "every interaction creates new content: drawing produces new posts and guessing generates comments". Async, N players. Built by Reddit's own design lead, so not a neutral case. |
| Riddonkulous (UGC riddles) | "In just 30 days: 30K+ subscribers ... 10M+ views, 8,000+ community riddles" ([case study, 2025-06-17](https://developers.reddit.com/docs/blog/riddonkulous)) | Player-written riddles, "playable in one tap", its own subreddit from day one, dev notes and events. A solo studio. |
| Sword & Supper (idle RPG) | No numbers published ([Cabbage Systems spotlight, 2025-08-11](https://developers.reddit.com/docs/blog/sword-and-supper)) | "each mission in the game is its own post, created by a user". A closed beta of "a few hundred players" seeded the subreddit before discovery opened. |
| Syllo / Syllacrostic (daily word game) | Reddit bought it "after successful featuring" ([feature guide](https://developers.reddit.com/docs/guides/launch/feature-guide)) | Daily puzzle, streaks, daily leaderboard. *No numbers found. The acquisition post on r/Devvit could not be fetched.* |
| Hot and Cold (daily semantic word guess) | No numbers found | Reddit-built ([repo](https://github.com/reddit/devvit-HotAndCold)). A daily word, a progress bar with player avatars. |
| r/place | "Over 10 million users" in 2022 ([Outlook Respawn, 2026-07-28](https://respawn.outlookindia.com/gaming/gaming-originals/critical-state-and-the-case-for-reddit-as-a-game-platform)) | A Reddit-run April Fools event with sitewide promotion. A third party can't repeat this. |
| r/PlayQuickGames (6 small games) | No numbers. "organic players arrived within 24 hours ... with no paid promotion" ([dev.to, Sept 2026](https://dev.to/seolith/building-games-on-reddit-the-complete-guide-for-would-be-developers-1g4l)) | Daily seeds, streaks, midnight results posts that tag yesterday's winners. |

Platform scale: "over 2,000 developers have created apps in 31,000+ communities"
([blog, May 2025](https://developers.reddit.com/docs/blog/welcome)). Reddit's CEO told investors in July 2026 that
"interactive games on our developer platform drive repeat usage and daily habit"
([Q2 2026 call](https://www.fool.com/earnings/call-transcripts/2026/07/30/reddit-rddt-q2-2026-earnings-call-transcript/)).

**What the hits have in common:**

- **A content flywheel.** "Reddit posts decay quickly. Your game needs a strategy to stay relevant". It comes either
  from scheduled content (a daily puzzle) or from player-made content that creates new posts
  ([community games guide](https://developers.reddit.com/docs/guides/best-practices/community_games)). A Reddit staff
  engineer puts it as "Apps that lead to more posts are the ones that win".
- **Async play for any number of players.** "Players can participate anytime", with "a strong single-player baseline".
- **A different first screen on every post.** "If your post looks the same every time, it risks being ignored as a
  repost" (Pixelary).
- **The subreddit as home.** A dedicated subreddit, a Join button, dev notes and events, and taking feedback seriously
  (Riddonkulous, Honk).
- **Daily habit tools.** Streaks with streak freezes, daily leaderboards, player of the week, and push notifications
  (a beta you apply for).
- **Playable while logged out.** "Don't require login to start gameplay". Prompt a login when the player wants to
  save progress or subscribe
  ([logged-out guide](https://developers.reddit.com/docs/guides/logged-out-users)).

**The discovery channel is featuring**
([feature guide](https://developers.reddit.com/docs/guides/launch/feature-guide)). There are four tiers, with
Reddit's rough impression estimates:

| Tier | What you get | Impressions |
|---|---|---|
| Distributed | Early builds, a spot on r/GamesOnReddit | "Thousands" |
| Promoted | Polished games | "Tens of thousands" |
| Highlighted | High engagement | "Hundreds of thousands" |
| Hero | Pro quality | "Millions to tens of millions" |

Reddit watches "CTRs, day 1 and day 3 retention, dwell time". Every tier requires a custom first screen, working on
mobile and desktop, a self-explanatory design, and no scrolling inside inline posts. You can also apply through a
form. Featuring is curated, so reach depends on Reddit's choices.

## 3. Rules on linking out and self-promotion

**Inside the app: no linking out.** From the
[Devvit Rules](https://developers.reddit.com/docs/devvit_rules), section "No linking out to external apps":

> Apps should not link out to other apps, or promote other versions of the app on external platforms. This includes,
> but is not limited to:
> - "Demo" apps published on Devvit that link out to a full version of the app on other platforms
> - Apps that promote or upsell a link to playing the same app on other platforms
> - Apps that ask users to create a profile outside of Reddit
>
> Reddit reserves the right to reject, limit, or remove any app that encourages users to navigate off-platform [...]

The payment rules add that apps cannot "Direct redditors off-platform to provide payment to you (e.g., sending you
money directly or offering to buy you a coffee)". That covers a Patreon or Ko-fi link inside the game.

The SDK does have `navigateTo(url)` for external URLs, behind a confirmation dialog
([navigation](https://developers.reddit.com/docs/capabilities/client/navigation)). That makes it technically possible,
but the rules above still forbid it. A "Wishlist on Steam", "Back us on Kickstarter" or "Support on Patreon" button in
the game breaks the rules as written. So does a "this is a fragment of a bigger game, play the full one here" screen.

**Collecting contacts is also blocked.** You can't ask players to make an outside account. Account linking needs
opt-in, SOC2 Type II services and read-only OAuth. Any app that fetches outside data needs its own privacy policy.
There's no route to an email list from inside the app.

**Outside the app (your subreddit and your posts): a gray zone.** *I didn't find this settled.*

- The Devvit Rules govern apps. The subreddit falls under the sitewide rules. The sitewide
  [Spam policy](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam) doesn't ban linking to your own
  work: "If your contributions to Reddit consist primarily of links to a business that you run, own, or otherwise
  benefit from, please be thoughtful about the frequency of posting". It adds that moderators decide what counts as
  spam in their communities.
- So a sidebar link, a pinned dev-notes post, or an occasional "the full game is on Steam" post in your own subreddit
  isn't clearly forbidden.
- The risk: the app rule says Reddit may "limit" any app that "encourages users to navigate off-platform". Featuring
  is also curated by the same team. A subreddit built mainly as a funnel could cost the game its reach, even without a
  formal violation. *Ask r/Devvit modmail before relying on it.*

**Reddit-wide self-promotion.** The widely cited guideline comes from reddiquette: "only 1 out of every 10 of your
submissions should be your own content" (9:1). Reddit doesn't enforce reddiquette directly; each subreddit's
moderators set their own rules. *Secondary sources only
([redship.io](https://redship.io/blog/reddit-self-promotion-rules)). reddit.com/wiki/reddiquette could not be
fetched.* Ordinary link posts about a web or Steam version in game subreddits (r/WebGames, r/incremental_games,
r/IndieGaming and the like) have nothing to do with Devvit. Each follows its own subreddit's rules. This guide doesn't
cover them.

## 4. What kind of game fits

- **Short sessions.** "Keep it bite-sized", "players should be engaged within seconds". Examples: a daily chess puzzle
  instead of full matches, a 60-second Pixelary drawing, Riddonkulous "playable in one tap".
- **A daily or weekly rhythm.** A new puzzle every day, scheduled posts, recurring tournaments, seasonal events. A
  shared UTC-midnight reset is the common pattern.
- **Community participation.** Players make levels, drawings, riddles or missions, and that content becomes new posts
  and comments. This is the strongest signal across all the hits.
- **Async, any player count.** Nobody has to be online at the same time.
- **Idle formats have a precedent.** Sword & Supper chose an idle RPG with "bite-sized gameplay loops that users could
  engage with throughout their feed".
- **Mobile-first controls.** 44 px tap targets and key buttons near the bottom of the screen.

**What flops or gets discouraged:**

- Posts that look the same every time get ignored as reposts.
- A game that stops producing posts fades from the feed.
- Spammy integration, like flooding comment threads with auto-progress updates. Prompt for comments only "after an
  'aha' moment".
- Games that need "precise controls, fast-paced gameplay, or complex visual feedback" (outside commentary, Outlook
  Respawn).
- Anything that scrolls inside an inline post.
- Hackathon organizers discourage "AI Slop" and generic space shooters or trivia apps
  ([Games with a Hook hackathon, 2026](https://redditgameswithahook.devpost.com/)).
- Login walls before the first play.

**Hackathons** are how several known games started. Honk's developer won one, then built Honk days later. They run
several times a year on Devpost, with 2,603, 2,980 and 3,064 entrants in the last three
([Fun and Games 2025](https://redditfunandgames.devpost.com/),
[Daily Games 2026](https://redditdailygames2026.devpost.com/), Games with a Hook 2026). They give you a deadline and
a judged showcase, and the judges want entries "as close to launch-ready as possible".

## 5. Risks

- **The following is locked to Reddit.** Subscribers are Reddit accounts in a subreddit, and the app may not point
  them anywhere else. Moving that audience to a Steam page, Kickstarter or Patreon has to happen outside the app. How
  far Reddit tolerates that is unsettled (section 3).
- **Discovery is curated.** Organic reach depends on "clicks, dwell time, and voting" and on featuring decisions. The
  top tiers need "pro quality". A lite fragment competes with games built for Reddit from the start.
- **Policy and platform churn.** Reddit may "reject or remove any app ... at our discretion" and updates its terms
  "from time to time". The docs already list several forced migrations:
  - Blocks to Devvit Web
  - `useWebView` to Devvit Web
  - experimental Devvit Web to Devvit Web ("You must complete this migration to publish and grow your app")

  Push notifications and user actions are gated betas.
- **Porting cost.**
  - The core game logic carries over. The shell doesn't.
  - Work to plan for: the Devvit CLI and Node, `devvit.json`, a custom inline first screen with no scroll, a
    responsive layout for mobile and desktop, logged-out play, and Redis saves (localStorage is wiped per version).
  - Duties that come with it: a README for review, data deletion when users delete posts or accounts, and review of
    every version.
  - A web game that loads anything from outside its own bundle must be changed.
  - One team shipped six small games three weeks after their first line of code, using shared scaffolding (dev.to,
    self-reported).
- **Two builds.** A Devvit build and an open-web build differ in storage, first screen and outbound links. Keeping
  both in sync costs time every release.

## What to do

**Must (if you use Reddit at all)**

1. Read the "No linking out to external apps" rule before designing anything. Don't put Steam, Patreon or Kickstarter
   links or "full version" upsells in the Devvit app.
2. Build a game that works on Reddit on its own terms: a daily or player-content loop, async, playable in seconds on
   a phone, with a new-looking first screen on every post. A cut-down port of a bigger game fits worse than a small
   game made for the feed.
3. Give it its own subreddit and a Join button from day one. Seed it with a small closed beta before asking for
   featuring.

**Worth it**

4. Ask r/Devvit modmail, in writing, what the subreddit (not the app) may say about the full game elsewhere: sidebar,
   pinned dev notes, occasional announcement posts. Keep the answer.
5. Enter a Devvit hackathon as the deadline for the first Reddit game. It comes with feedback, a judged showcase and
   r/GamesOnReddit exposure.
6. Keep the game core in plain JS modules that both the web build and the Devvit shell import. Use Redis only for
   saves and the daily seed.
7. Measure day-1 and day-3 return rates. Those decide featuring.

**Later**

8. Player-made content (a level editor, shareable seeds). It drove Honk's growth, but build it only after the core
   loop holds players.
9. Push notifications and streaks. Apply for the beta once a daily loop exists.
10. Apply for featuring once the game is polished on mobile.

**Skip**

11. Treating the Devvit game as the top of a Steam, Kickstarter or Patreon funnel through in-app links. The rules
    forbid exactly that.
12. Realtime multiplayer, external servers, or fetch to your own domain. Personal domains are not approved, and
    realtime adds work without being the growth driver.
13. Porting every 4 to 8 month game to Devvit by default. Decide per game whether it has a Reddit-shaped loop.

## Sources (ranked by value)

1. Devvit Rules, including "No linking out to external apps" and the payment rules:
   https://developers.reddit.com/docs/devvit_rules
2. Featuring program, tiers and criteria: https://developers.reddit.com/docs/guides/launch/feature-guide
3. Building Community Games (retention, flywheels, async):
   https://developers.reddit.com/docs/guides/best-practices/community_games
4. Honk case study (300K+ subscribers, UGC): https://developers.reddit.com/docs/blog/honk
5. Devvit Web overview (architecture, limits, localStorage, CSP):
   https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview
6. Riddonkulous case study (30K in 30 days): https://developers.reddit.com/docs/blog/riddonkulous
7. Pixelary design post (65K+, content flywheel): https://developers.reddit.com/docs/blog/pixelary
8. Sword & Supper / Cabbage Systems spotlight: https://developers.reddit.com/docs/blog/sword-and-supper
9. Mobile-first post (Reddit staff): https://developers.reddit.com/docs/blog/mobile-first-development
10. Launch guide (review, per-version publish, subreddit requirement):
    https://developers.reddit.com/docs/guides/launch/launch-guide
11. Logged-out players guide: https://developers.reddit.com/docs/guides/logged-out-users
12. Reddit Spam policy (sitewide self-promotion wording):
    https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam
13. FAQ, limits summary: https://developers.reddit.com/docs/guides/faq
14. HTTP fetch and fetch policy: https://developers.reddit.com/docs/capabilities/server/http-fetch and
    https://developers.reddit.com/docs/capabilities/server/http-fetch-policy
15. Navigation (`navigateTo`, external link dialog):
    https://developers.reddit.com/docs/capabilities/client/navigation
16. devvit.json configuration: https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_configuration
17. View modes and entry points:
    https://developers.reddit.com/docs/capabilities/server/launch_screen_and_entry_points/view_modes_entry_points
18. Hackathons: https://redditfunandgames.devpost.com/ , https://redditdailygames2026.devpost.com/ ,
    https://redditgameswithahook.devpost.com/
19. Third-party practitioner guide (six games, r/PlayQuickGames, Sept 2026, self-reported):
    https://dev.to/seolith/building-games-on-reddit-the-complete-guide-for-would-be-developers-1g4l
20. Outlook Respawn, "Critical State and the Case for Reddit as a Game Platform" (2026-07-28, commentary):
    https://respawn.outlookindia.com/gaming/gaming-originals/critical-state-and-the-case-for-reddit-as-a-game-platform
21. Reddit Q2 2026 earnings call transcript (games mention):
    https://www.fool.com/earnings/call-transcripts/2026/07/30/reddit-rddt-q2-2026-earnings-call-transcript/
22. Devvit platform blog, scale figures (May 2025): https://developers.reddit.com/docs/blog/welcome
23. Self-promotion roundup, 9:1 reddiquette (secondary): https://redship.io/blog/reddit-self-promotion-rules

Not verified: current subscriber counts (reddit.com blocks automated fetching), the text of the Syllacrostic
acquisition post, whether a client-only Devvit post really needs no bundler, and Reddit's position on off-Reddit links
in a game's own subreddit.
