// The taming gauge model: what each animal dimension does to each motivation's gauge.
// Plain data, loaded by gauge-model.html with a <script> tag so the page also opens from disk.
// Every cell is a draft until it has been gone through with the user.
window.GAUGE_MODEL = {
  motivations: ['hunger', 'comfort', 'curiosity'],

  // What each property means, and how a dimension's value changes it (the combination rule, a proposal).
  properties: {
    share: { unit: 'weight', combine: 'add', what: '% of willingness: the weights of the three motivations are summed over the dimensions, then scaled to 100%' },
    default: { unit: 'points', combine: 'add', what: 'resting level, 0–100: where the needle sits at the start and drifts back to' },
    inertia: { unit: '×', combine: 'multiply', what: 'how heavy the needle is: an action moves it by 1/inertia, and it drifts back to its default by drift/inertia points a turn (drift is 5). Shown to the player as calm (high) ↔ jumpy (low)' },
  },
  drift: 5, // points a turn a needle of inertia 1 drifts back to its default

  // Before any dimension: every animal starts here.
  base: {
    hunger: { share: 1, default: 40, inertia: 1 },
    comfort: { share: 1, default: 40, inertia: 1 },
    curiosity: { share: 0, default: 40, inertia: 1 },
  },

  // dimension → value → motivation → property → modifier. A missing cell means no effect (add 0, multiply 1).
  dimensions: {
    size: {
      values: ['small', 'medium', 'large'],
      cells: {
        small: { hunger: { inertia: 0.8 }, comfort: { default: -10, inertia: 0.8 } },
        medium: {},
        large: { hunger: { inertia: 1.4 }, comfort: { default: 10, inertia: 1.4 } },
      },
    },
    agility: {
      values: ['slow', 'medium', 'fast'],
      cells: {
        slow: { hunger: { inertia: 1.4 }, comfort: { inertia: 1.4 }, curiosity: { inertia: 1.4 } },
        medium: {},
        fast: { hunger: { inertia: 0.7 }, comfort: { inertia: 0.7 }, curiosity: { inertia: 0.7 } },
      },
    },
    intelligence: {
      values: ['low', 'medium', 'high'],
      cells: {
        low: {},
        medium: { curiosity: { share: 0.5, default: 10 } },
        high: { curiosity: { share: 1.5, default: 20 } },
      },
    },
    diet: {
      values: ['plants', 'anything', 'meat'],
      cells: { plants: {}, anything: {}, meat: {} },
    },
  },

  // v10.4: the gauge's lines and clock, and how the dimensions move them (they were text "outside the grid" before).
  lines: {
    base: { flee: 25, friendly: 70, clock: 3 }, // willingness below `flee` for `clock` turns: it reacts and is gone
    size: { small: { friendly: -10 }, large: { friendly: 10 } }, // the capture threshold
    agility: { slow: { clock: 1 }, fast: { flee: 5, clock: -1 } }, // fast animals react sooner
  },
  // v10.4: a trick wears out: each use of the same action in a row has this much of the last one's effect
  fill: { low: 0.85, medium: 0.7, high: 0.5 }, // by intelligence

  // v10.4: the motivations act on each other (kid-obvious rules). A motivation's zones: low < 30, high > 70.
  zones: { low: 30, high: 70 },
  interactions: [
    { id: 'fear', rule: 'a scared animal is neither hungry nor curious', how: 'comfort low: hunger and curiosity count half in willingness' },
    { id: 'bold', rule: 'a hungry animal takes risks', how: 'hunger high: hunger counts in full even when comfort is low (it overrides fear)' },
    { id: 'look', rule: 'a curious animal stays to look', how: 'curiosity high: the flee clock stops' },
  ],

  // Effects that are not in the grid yet.
  outside: [
    'size: comfort moves less against team strength (D195); inertia covers it only in general',
    'size: how hard an attack hits the pets (the team side, not the gauge)',
    'diet: which foods move hunger (plants, anything, meat); the demo bait always suits the animal',
    'diet: for meat-eaters, small pets in the team move hunger too',
    'when scared: the reaction (fight, flee, hide) by the strongest stat (D194, D195)',
  ],

  // v10.4: demo actions and scripted encounters, to see the animals behave over turns. Each action moves one
  // motivation by `push` points, divided by its inertia and worn by `fill`. Real pet skills come later.
  actions: {
    bait: { hunger: 25 },
    calm: { comfort: 25 },
    show: { curiosity: 25 },
    wait: {},
  },
  turns: 10,
  scripts: [
    { name: 'bait every turn', plan: ['bait'] },
    { name: 'calm twice, then bait', plan: ['calm', 'calm', 'bait'] },
    { name: 'calm, bait, show, in turn', plan: ['calm', 'bait', 'show'], cycle: true },
    { name: 'wait', plan: ['wait'] },
  ],

  // Sample animals, to see what the cells add up to. v10.4: each has one extreme (Sonny's exaggerated rule), applied
  // after the grid: a property of one motivation pushed far (add for share and default, multiply for inertia).
  examples: [
    { name: 'snail', size: 'small', agility: 'slow', intelligence: 'low', diet: 'plants',
      extreme: { motivation: 'comfort', property: 'inertia', value: 2, why: 'nothing rattles it, nothing hurries it' } },
    { name: 'flea', size: 'small', agility: 'fast', intelligence: 'low', diet: 'meat',
      extreme: { motivation: 'comfort', property: 'inertia', value: 0.4, why: 'the jumpiest: gone at the first wrong move' } },
    { name: 'deer', size: 'medium', agility: 'fast', intelligence: 'medium', diet: 'plants',
      extreme: { motivation: 'comfort', property: 'default', value: -20, why: 'skittish: starts on edge' } },
    { name: 'crow', size: 'small', agility: 'medium', intelligence: 'high', diet: 'anything',
      extreme: { motivation: 'curiosity', property: 'default', value: 25, why: 'cannot resist anything new' } },
    { name: 'bear', size: 'large', agility: 'medium', intelligence: 'medium', diet: 'anything',
      extreme: { motivation: 'hunger', property: 'share', value: 1, why: 'always hungry' } },
  ],
}
