---
id: pN
title: <short name>
started: YYYY-MM-DD
status: building              # building | playtesting | concluded | killed
budget: 3d                    # the time box; over time means cutting features, not extending
from: pM                      # the prototype this grew out of (drop the line if none)
cover: media/cover.png
dev: bN.html                  # while it's being played unfrozen; drop when concluded
---

# pN · <short name>

<!-- Copy this folder to timeline/pN-slug/. Write Question, Assumptions and Limitations BEFORE
     building. Anything added to Assumptions after the first build ends with (post-hoc). -->

## Question

<One sentence. What would make you keep, change or kill this?>

**Pass:** <what you'd observe if the answer is yes>

**Kill:** <what you'd observe if the answer is no>

## Assumptions

1. [?] <a belief this prototype tests; [✓] held, [✗] broken once played>

## Limitations

- [constraint ?] <something left out ON PURPOSE, to see if the loop is better without it; gets a verdict>
- [cut] <scope dropped for time; say where it comes back>

## Built

<Scope, rules, tunables. Rule changes during play: one line each, with its decision id (Dnnn).>

## Feedback

- [YYYY-MM-DD · tester · device](feedback/YYYY-MM-DD_tester_device.md): "<the one quote that matters>"

## Conclusion → next

<Verdict in one paragraph (the card shows it), then the decisions (append them to ../decisions.md) and the next step.>
