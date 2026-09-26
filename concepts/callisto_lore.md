# Callisto: the world of Spelunking Base (lore, draft)

Status: draft, 2026-09-26. The user's direction, written up by Claude for review. Nothing here is
built. The mechanics it implies are proposed in
[callisto_design.md](callisto_design.md).

The user, on why: "I think the tamed bugs need to be more autonomous. And we need a lore, deeper than
'get ore'." The theme: **reclaiming a decaying human habitat with a "we are part of nature" mindset.**

---

### The moon

- **Callisto**, Jupiter's outermost large moon. It's the most cratered surface in the Solar System, and
  it's been dead and unchanged for 4 billion years.
- **It never melted and separated.** Its inside is a "raisin pudding" of water ice (with CO₂ ice and
  traces of ammonia) and ancient chondritic rock, roughly half and half. There's no iron core, no
  volcanism and no tectonics.
- **So there are no ore veins.** Veins need heat and flowing fluids to concentrate metals, and Callisto
  never had them. Everything valuable is **dust**, spread evenly:
  - iron and nickel as tiny metal flecks,
  - trace platinum, palladium, gold and cobalt,
  - the radioactive isotopes **potassium-40, uranium and thorium**, in parts per million.
- **Far below** (100+ km) lies a salty, ammonia-rich ocean. Galileo's magnetometer saw its conductivity.
  It stays liquid only because the ice above insulates it and the dust's slow radioactive decay warms it.

In game terms, what we've been calling "ore" is **isotope dust**, the one thing on Callisto that
carries energy.

### The colony

- Humans came for the ice: water splits into rocket fuel, and Callisto sits outside Jupiter's lethal
  radiation belt. It was the fuel stop and depot for the outer system.
- **They live in the ice, around the 90-metre line.** Ice weighs about 917 kg/m³ × 1.24 m/s² ≈ 1.1 kPa
  per metre on Callisto, so ~90 m down, the ice's own weight equals one Earth atmosphere. A cavern at
  that depth can hold breathable air without the pressure pushing the ice apart. The ice above also
  shields from radiation and micrometeorites.
- **Warm ice creeps.** Ice flows faster as it warms, so a heated cavern slowly sags and closes. That's
  why warmth has a ceiling here: too warm, and the home collapses.
- **The colony is decaying.** Its reactors, electrolysers and pink-lit farms are failing. Why, and who
  you are, is open (see *Open*).
- **Its leftovers are catalysts** (user): what the settlement stockpiled, and the junk rockets left
  behind, don't regenerate, but small amounts trigger big transformations (see callisto_elements.md).
- Jupiter stays the sky's showpiece, huge above the surface with the other moons.

### The life

Energy is so scarce that almost everything is asleep.

- **Radiotrophic microbes** feed on **radiolysis**: radiation from the dust splits water into hydrogen
  and oxidants, and the microbes live on that gradient. With the dust this thin, they divide once in
  decades or centuries.
- **Slime-mould networks** thread through the dirty ice, slowly digesting what little organic matter
  there is.
- **Concentrate the dust, and the sleepers wake.** A warmer, energy-dense patch becomes an oasis: mats,
  moss, bulbs, red grass and glowing lichen. That's the **bloom**, the "friendly area" of D057.
- **Ammonia is a nutrient**, as it is for many Earth lifeforms: nitrogen for building cells.

### The bugs

- Native creatures drawn to energy, drifting like fireflies with dim lights that blink in and out.
- **Wild bugs** chase your glow and nibble the isotope dust in your pack: you're the warmest thing in
  their world. Feed one enough, and it's tamed.
- **Tamed bugs tend hearths.** They pull dust from the walls, carry it to their den and keep it in the
  ideal band: warm enough for life to bloom, not so hot that cells die, not so warm that the ice sags.
  The bugs are the moon's gardeners; you work with them, not over them.

### The air

The long goal: caves you can breathe in, grown rather than manufactured.

- **Nitrogen** from ammonia: microbes turn it into N₂ gas (on Earth, anammox bacteria do this).
- **Oxygen** from water, by radiolysis and by the bloom.
- **Argon** from potassium: about 1 in 10 potassium-40 decays makes argon-40. Callisto's ice holds
  billions of years of it, freed as the ice warms.

**Air is a reward, never a meter.** A region that comes alive is brighter, softer and louder with life.
You never suffocate: this is a casual game, not a survival sim.

### The look

The user: "not only is Callisto crazy beautiful for some weird reason, but the ice caves + asteroid
inserts + scary pitch-black ocean match the no-pixel-art-but-shaders-and-particles art style." The world fits the concept doc's
*Art Style: Light, Particles, Procedural Animation* almost exactly:

- **From orbit, it's already a glowing ant farm on black:** a dark body sprinkled with bright crater
  specks (frost on the rims, dark lag in the lows). The Galileo image the user shared is enhanced false
  colour (true colour is a dull grey-brown). That's fine: the game shows Callisto the way a shader sees
  it, not a camera.
- **The walls are dirty ice, not rock tiles:** translucent, lit from within, with light scattering
  through them. That's a shader's job, not a tileset's.
- **Asteroid inserts are the "raisins":** dark chondritic chunks frozen into the ice, flecked with metal
  that catches the light. Isotope dust glints and sparkles like particles.
- **The ocean is the deep:** pitch black and scary, far below. The concept doc's "the abyss is the
  Frontier" gets a real place: a black void where only faint living lights and your own glow show
  anything. Darkness is the easiest thing to render and the strongest thing to show with light.
- **Everything that matters glows:** dust, bug lights, hearths, the bloom. Warmth *is* the visual
  language (the concept's "heat" idea), now tied to life instead of machines.
- **Motion over variety:** dust streams (built in b3.6), drifting bugs, lichen pulsing, the bloom
  spreading in a ring.
- Rendering stays basic Canvas2D in the prototypes; shaders come with the later move to PixiJS or
  three.js.

### Tone

Radiation is the **source of life** here, not doom. The old concept said "no radiation or doom, just no
air"; the spirit stays: **light and pretty, never grim.** Decay is the starting point, not the mood.

---

### Checked or flavour

| Claim | Status |
|---|---|
| Callisto is undifferentiated ice + chondritic rock, heavily cratered, with a conductive subsurface ocean | Mainstream science (the ocean is inferred, not seen) |
| Metals and isotopes as dispersed dust, no ore veins | Plausible inference from no differentiation or volcanism |
| Surface gravity ≈ 1.24 m/s², so ~90 m of ice ≈ 1 atm | Checked (gravity from references; the arithmetic is Claude's) |
| Warm ice creeps faster (caverns close) | Checked: standard ice physics (Glen's flow law; creep rises steeply with temperature) |
| Life powered by radiolysis | Real on Earth: *Desulforudis audaxviator*, 2.8 km down in the Mponeng gold mine, lives on H₂ from radiolysis by U, Th and K |
| ~10% of K-40 decays to Ar-40 | Checked (≈10.3–10.7%, depending on the source) |
| Microbes turning ammonia into N₂ | Real on Earth (anammox, nitrification) |
| Ammonia-brine ocean, lethal to humans | Speculative (models need an antifreeze) |
| Concentrated ppm-level dust makes a warm, blooming oasis that stays safe for humans | **Flavour.** Real dust is far too thin; radiation strong enough to feed a bloom would harm people. The game's rule: hearths are the bugs' places, and people live in the air around them |
| A breathable N₂/O₂/Ar atmosphere grown by life | **Flavour** on the scale and speed |

The user's pasted research came from an AI chat. It served as input and is not treated as fact here.

Sources for the checks: [Desulforudis audaxviator (Wikipedia)](https://en.wikipedia.org/wiki/Desulforudis_audaxviator),
[CNRS: natural radioactivity sustains subsurface life](https://news.cnrs.fr/articles/natural-radioactivity-sustains-unsuspected-subsurface-life),
[Potassium-40 (Wikipedia)](https://en.wikipedia.org/wiki/Potassium-40),
[Callisto (Astronomy Wiki)](https://astronomical.fandom.com/wiki/Callisto),
[Ice shell structure of Ganymede and Callisto (JGR Planets 2022)](https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/2021JE007028).

### Open

- **Who you are:** the last caretaker, a returning colonist, a colony robot… (user: undecided for now).
- **Why the colony decayed**, and what's left of it: the old city and derelicts of the concept doc, now
  in ice.
- **Earth seeds:** from the old colony (a seed vault or frozen farm), see callisto_design.md.
- Shops, other colonies and PvP: unchanged from the concept doc, to be reread against this world.

