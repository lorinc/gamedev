# Devlogs as video production

Scope: how to make a YouTube devlog people watch, and what it costs. General, for any game.

**Unvalidated.** This comes from a Gemini summary the user pasted on 2026-09-30 of a video on making devlogs:
<https://www.youtube.com/watch?v=48C9hYoLMis>. Timestamps point into that video. Neither the video nor the summary
was checked. The last section is the summary's own commentary, not the video's. The view counts are one creator's own
videos, so they show a pattern at best, not a cause.

## The video's premise

It pushes back on gatekeeping in the indie community, where established creators discourage beginners [00:10]. Its
angle: a devlog is a video production problem first and a development diary second.

## Script it

Scripted videos averaged about 45,000 views against about 9,000 for unscripted ones [03:16]. Unscripted ones ramble
and miss details. The pipeline:

1. **Outline** [03:34]. Bullet every update, interesting bug and possible joke, in any order.
2. **Flow** [03:58]. Order the bullets and write the transitions, so it doesn't feel like a checklist.
3. **Riff into a script** [04:38]. Say the points out loud to find a natural cadence, then write that phrasing down
   word for word.

## Choose a mode

[05:44] Devlogs work as **showcase** (a deep dive into one mechanic, with everything non-essential cut) or as
**storytelling** (development as a struggle with a narrative). The best blend both.

## Record after the script, using version control

[10:10] Don't screen-record all the time: it piles up storage and is hard to search. Keep the project in Git, finish
the script, then check out old states and record the footage that matches each line of narration.

## Learn from other fields

[13:03] Study non-gaming creators for pacing and teaching. The video names a cooking channel (Internet Shaquille) as
its main influence for instructional content.

## Commentary from the summary (not the video)

- **Git B-roll sanitises the story.** Footage recorded afterwards drops the live moments (editor crashes, surprise
  bugs, real frustration), which are often the best parts of a storytelling devlog.
- **Word-for-word scripts can sound stiff.** Reading verbatim takes some voice-acting skill. For a beginner, bullet
  points and improvising may land better. This contradicts the video's advice: the claim is the summary's, untested.
- **It's a second job.** Outline, script, revert, record, edit: the cost can eat the time needed to finish the game.
  The video itself says devlogs aren't mandatory.

## For this project **[C]**

- Weigh a devlog like any feature: by cost and return ([05](05-feature-roi.md)). Its payoff would be reach for the
  mailing list and wishlists ([04](04-launch-plan.md)), and nothing in the summary measures that. Views aren't
  wishlists.
- The checkout-and-record trick is the cheap part to keep, since it works from the repo history alone.
