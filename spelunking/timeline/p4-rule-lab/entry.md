---
id: p4
title: Rule Lab (v4)
started: 2026-09-25
status: building
budget: 3d
from: p3
---

# p4 · Rule Lab (v4)

The movement and stop rules decide the game feel, and in b1 they were code. Every piece of feedback so far was a change to them. This prototype turns them into data with a visual editor. A ruleset is a JSON file that is saved, exported and loaded the same way a terrain recipe is.

## Question

Can the swipe table and stop rules live as a JSON ruleset, edited visually against small example situations, without losing any b1.2 behaviour?

**Pass:** `rules/b1.2.json` reproduces b1.2 exactly (every existing dig test passes on the data-driven sim). A rule change like D024 is made in the editor, checked against its situations, exported and loaded into b1, with no code change.

**Kill:** the table needs so many special conditions that it's code in disguise. Then keep the rules in code, and only make the numbers and stop toggles data.

## Assumptions

1. [?] Every b1.2 behaviour fits a first-match decision table: (swipe, situation) → action, over a small, fixed vocabulary of named conditions (next cell open, floor below, headroom, standing / clinging, drop ≤ N, …).
2. [?] The data-driven sim stays deterministic and passes every current dig test unchanged.
3. [?] Seeing a rule's situation (a small map, the swipe, the result) beside the rule makes changes faster and safer than editing code.
4. [?] A ruleset JSON is small and readable enough to diff in git and paste into chat, like a terrain recipe.
5. [?] The same situations (small ASCII maps + the expected result) can be both the editor's previews and the test suite.
6. [?] The timeline's "Rules at close" table can be generated from the ruleset instead of written by hand.

## Limitations

- [constraint ?] No new mechanics: p4 only represents and edits the rules b1.2 already has. The Engineer is still the only character.
- [constraint ?] The condition vocabulary is fixed in code. The editor combines conditions, it can't invent new ones. A new condition is a code change with a test.
- [cut] Terrain editing: that stays in the v2 / v3 recipes.
- [cut] Zipline, chasm crossing, the chasm-cling fix, Ghost and Demolitionist: these go to the next dig playtest, built on rulesets.
- [cut] Phone layout for the editor: it's a desktop tool. The rulesets it makes are played on every device.

## Built

Planned scope, nothing built yet:

- **Ruleset format** (`rules/<name>.json`):
  - `swipes`: ordered rows per swipe direction, each with `when` (condition ids) → `do` (action: walk, step down / up, mine then look, climb, build a step, drop, nothing), plus the blocked reason
  - `stops`: the stop rules and their switches
  - `numbers`: ticks, harmless drop, pack, build cost
  - A `version` field, and a migrate step like the one CA recipes already have.
- **Sim:** `resolve()` becomes an interpreter of the table. `rules/b1.2.json` is the acceptance test: it must reproduce b1.2 exactly.
- **Situations** (`rules/situations/*.json`): the ASCII maps from `dig.test.js` as data, each with a swipe and the expected stop position and reason. They run as tests and render as the editor's previews.
- **v4.html · Rule Lab:**
  - A table editor: rows, condition and action dropdowns, reordering.
  - Beside each row, the situations it affects, redrawn live, with pass / fail.
  - A play pane: the b1 world on the edited rules.
  - Export and import JSON (copy / paste, like the v2 recipe), and saving in the browser.
- **b1 loads a ruleset** from the Rule Lab or from `rules/`. The timeline's "Rules at close" table is rendered from the ruleset JSON.

## Feedback

None yet.

## Conclusion → next

Open.
