# Shape exploration: log

How the exercise got to its current state. The other files in this folder hold the present only. Newest last.
Quotes are the user's, with spelling lightly fixed.

## 2026-10-03: what to build ([build-principles.md](build-principles.md))

- The user asked to save the ideas of this stage: "save these ideas, these are relevant and important at this 'what
  to build' stage".
- **The principle.** Starting from a pasted summary of why Slay the Spire is easy to play and impossible to master:
  "I really would like to build the game like this." On why it sold: "Why I think Slay the Spire was a financial
  success is that it is both accessible, but never gets boring. And it does it through system, not by content, which
  makes the dev effort valuable." The follow-up made clear "like this" meant the principle, not Slay the Spire's run
  structure.
- **The tool.** "I plan to build a system optimizer / simulator, that makes the balancing and the complexity of random
  permutations manageable."
- **Expectations of a good game.** The user: "We know enough already to describe some expectations of a good game."
  The user drafted the list; Claude objected to three points, sharpened four and added two; the user agreed to all of
  it. Quotes from the draft that the agreed list restates:
  - "I need distinct, distant pillars for the tension cadence to work."
  - "The core should be possible to reach the fun toy feeling in seconds of loading the game."
  - "I love games where you choose when to face the next challenge, and you are under no constant pressure while
    preparing."
  - The draft said "the only useful feedback is the immediate"; Claude objected that for a Discovery-and-Strategy
    audience delayed consequences are where strategy comes from, if traceable. Agreed as "immediate signal, delayed
    consequence traceable".
- **Candidate A, the short run.** From "picking the game up again must not be overwhelming": "This points towards a
  very specific game shape: a short run, where complexity does not carry over, only knowledge, like Noita, or Super
  Auto Pets. Magicraft is borderline, because you unlock mechanics, but they can be ignored. What can not be ignored in
  Magicraft is the unlocked spells / trinkets in your random pool, that WILL make subsequent runs more complex, even if
  you forgot a lot about the game. That's an antipattern." Status: "just a strong candidate".
- **The simulation-time tension.** "Short runs bring a LOT of restrictions, but probably that's a good thing for
  creative constraints and interesting design. But it will be hard to combine with a simulated world that needs time
  to run its course." Claude offered three ways to fit the arc in a run, and advised against a world that keeps
  running between runs.
- **Candidate B, idle with prestige.** The user corrected that advice: "You forget that incremental / idle games are
  very popular now, and we should not reject that angle just yet."
- **Doc rule.** build-principles.md was rewritten as present-state only; this narrative moved here.
- **Pillars.** The user placed three equal-weight pillars on the map: around 1a, 2a, 1b, "but just a bit more
  towards challenge"; where 14's height and 25's column meet, near the audience–Story line; around 2b, 17, 8 and 3.
  "Not all pillars will be identical, but they should weigh the same. Some will be one central loop, some 2 support
  loops, and there will be one or two side loops." Their cards wait until their content is worked out.
- **Pillar roles.** The user's reading of the map, which Claude agreed with: P3 is what the player controls about the
  simulation; P2 is the most kinetic, the exciting exploration and horizon expansion; P1 is where difficulty scales
  with progress (Claude added: at steps the player chooses, or Power gains feel erased). Claude had first read P2 as
  the breather and asked where tranquility goes. The user: what is brought back from explorations feeds tinkering;
  tranquility side loops can live around any pillar (a vivarium or zoo, rare beautiful sightings during exploration,
  a riskless strategy-testing loop).
- **Limits and feeds.** Each pillar needs a limit raised by its loop and a plausible feed from another pillar. The user:
  "Allow players to grind and 'beef up' for the challenge in each pillar, so if something feels hard, it can be made
  easier without a slider. The theme is ecology, the loadout can not be technology. I think, this will be a taming
  game, where you find procgen living things (from slime mold to Arrakis sand worm), raise them, and send them to
  excursions." Breach = strategy, bringing back samples, seeds or captured animals; enclosures = the simulation, to
  farm or to tame and level; expeditions = exploring and flagging prospects. This replaced the earlier cycle
  (P2 → P3 → P1 → P2 through 14, 2b/2a, 1b).
- **Flows reworked.** The user: "P1 brings environmental / economic flora into the P3 simulation. P1 brings economic
  and exploration fauna into the P3 simulation. P3 simulation creates resources to host and level both. P3 simulation
  creates the teams that go on both P2 and P1 expeditions." And: "P1 unlocks new areas for P1 and P2 exploration."
  This replaced samples, seeds and captured animals (P1 → P3) and scouts with matching traits (P3 → P2).
- **Prospects as mysteries.** The user: "Prospects should be flagged as mystery (indicated by particle effects and
  shaders crossing the FOW, not by text or a symbol), until breached. Once breached, the expedition needs to spend time
  there to collect intel. Without that, we just see the visuals, but that's all. I'm not sure how we will be able to
  get the causality through without walls of text, but that's a good challenge to have."
- **Flows renamed and rerouted.** The user: "P1 -> P1: new fauna to tame. P2 -> P1: new areas to breach. P1 -> P2: open
  area for exploration. P3 -> P2: explorer pets. P3 -> P1: breach pets (would be nice to find a more peaceful name).
  P1 -> P3: does not exist, this goes through the P1 > P2 > P3 route."
- **Pillar names.** The user: "P3 is 'Colony'. P2 is 'Caverns'. P1 is 'Expanse' -- but I need options for this now."
  They replace Breach, Expedition and Enclosures.
- **P1 named The Unseen,** from a list of options for "uncharted" and "mystery" (Outlands was the runner-up).
- **Wake, not breach.** Asked for a less violent verb that can't be confused with exploring a cavern; the user chose
  "wake": "Wake is fitting, because simulation is suspended under FOW, it only looks alive via ambience."
- **Pioneers.** "Breach pets" renamed. The user wants names that are the explanation, not ones that need explanation;
  chose "Pioneers" from Pioneers, Pathfinders, Trailblazers, Openers, Vanguard.
