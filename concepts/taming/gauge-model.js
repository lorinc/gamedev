// The taming gauge model: what each animal dimension does to each motivation's gauge.
// Plain data, loaded by gauge-model.html with a <script> tag so the page also opens from disk.
// Every cell is a draft until it has been gone through with the user; `ok: true` marks the ones agreed.
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

  // Effects of the dimensions that are not one of the four properties: they live outside the grid.
  outside: [
    'size: the friendly line (the capture threshold) is higher for larger animals',
    'size: comfort moves less against team strength (D195); inertia covers it only in general',
    'size: how hard an attack hits the pets (the team side, not the gauge)',
    'agility: the flee/attack line is higher and the flee clock shorter for faster animals',
    'intelligence: a repeated action type fills faster, so a trick wears out',
    'diet: which foods move hunger (plants, anything, meat)',
    'diet: for meat-eaters, small pets in the team move hunger too',
  ],

  // Sample animals, to see what the cells add up to.
  examples: [
    { name: 'snail', size: 'small', agility: 'slow', intelligence: 'low', diet: 'plants' },
    { name: 'flea', size: 'small', agility: 'fast', intelligence: 'low', diet: 'meat' },
    { name: 'deer', size: 'medium', agility: 'fast', intelligence: 'medium', diet: 'plants' },
    { name: 'crow', size: 'small', agility: 'medium', intelligence: 'high', diet: 'anything' },
    { name: 'bear', size: 'large', agility: 'medium', intelligence: 'medium', diet: 'anything' },
  ],
}
