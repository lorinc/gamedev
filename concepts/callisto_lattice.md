# Callisto · the lattice, from a blank slate

The user restarted the lattice rules from a blank slate on 2026-09-27, after the rule list for p9
(`v7.html`) turned out too vague to give consistently good results. Earlier rules: `callisto_design.md` →
*Storeys* and decisions D068–D074.

## Definitions (user, 2026-09-27; tightened with Claude)

**Units.** A tile is one cell. The character is **2 tiles high** (user, locked 2026-09-27), so dig tunnels
and the path are 2 tiles high too. 1-tile passages aren't path until dug out (this replaces D072's
1-cell headroom).

**Kinds of tile:**
- **space:** open. You move through it; you can't stand on it.
- **solid:** you can't pass through it; you can stand on it.
- **semi-solid:** built. You pass through it in any direction, and it can also carry you (by intent).
  Bridges and gates are semi-solid.
- **void:** sky and sea. You can't enter it or stand on it.

**Path and floor.** The character moves *through* tiles and walks *on* others, and the two are kept apart:
we build walking tiles *below* the path, but a gate is built *in* the path. **We map the path.**
- **path tile:** a space or gate tile the character moves through: floor or a bridge directly below it,
  and 2 tiles of space or gate stacked, counting itself.
- **floor tile:** a solid tile with a space tile directly above it.
- **path surface:** path tiles joined at their sides or corners (dx = ±1, dy ∈ {−1, 0, +1}), never top or
  bottom.
- **cave path, cave floor:** the same, made of natural tiles only (created at map generation).

**Built tiles:**
- **bridge:** a built semi-solid tile with a space tile above it; it carries the path as floor does.
- **wall:** built solid, **2 tiles thick** (user: for consistency with the 2-tile path), placed as a
  straight line in one of the **8 directions** (level, upright, 45°); both ends must touch solid tiles;
  at most `wallMax` tiles long (config; 24 for now). Where one line is too restrictive, build a wall of 2
  segments (user). A 45° wall is 2 tiles per column, like a 45° tunnel, so it has no gaps at its steps.
  Walls isolate cavern spaces for incompatible ecological purposes. A wall with space above it is floor,
  as any solid is.
- **gate:** a semi-solid **upright 2 × 1** block placed in the path; it isolates environments. It can be
  placed into solid or open tiles, built or natural, but after placement it must have solid directly
  above and directly below it, and open tiles on both sides. It closes a level or a 45° path alike: a
  2-high path has exactly 2 open tiles per column, so a gate filling one column seals it (user: "gates
  could be only vertical or horizontal, 2×1 tile, and would work in all 8 directions"; a lying 2 × 1 gate
  would only be needed on a vertical path, and there are none).
- **dug:** a solid tile the player removed; it's space now.

**Natural features:**
- **cave wall:** a natural solid tile with a natural space tile to its left or right.
- **cave ceiling:** a natural solid tile with a natural space tile directly below it.
- So one solid tile can be floor, cave wall and cave ceiling at the same time.

**Pod:** a dome 10 wide × 5 high with a floor and open sides, placed as the last step of generation; the
base of operations. Its floor is built floor, not cave floor.

## The lattice (user, 2026-09-27)

The lattice is a graph of nodes and edges that an algorithm lays over the map. It sits between the
player's input and its effect. The player sees and reacts to the tiles, but acts on the graph, and each
input is read as a deliberate, bounded action on it. The player can't do everything the terrain allows,
only pick from the choices the lattice offers. This removes the need for pixel-perfect input, prevents
accidental permanent changes, cuts frustration, and keeps the controls to one finger on a phone.

To come (user): what nodes and edges are, in tile terms; when the lattice is generated and regenerated;
what goes through the lattice.

**Free digging is out** (user: "I think, free digging is out, for phone-control-UX reasons").

**Travel and interact (user):** the path is used by a vehicle. A spider-bot detaches from the chassis and
walks everywhere: it climbs the back wall, walls and ceilings. Two ways to play: **travel** (the vehicle,
fast swipes along the path) and **interact** (the spider's crawl, slower and more involved).
- **The shield:** it depletes from environmental damage (cold, pH, radiation) and simply from moving
  around. When it runs out, nothing really happens: a visual warning, and the bot returns to the chassis
  by itself to recharge. Still casual, but "it still gives great push-pull, feeling of danger" (user).
- **No precise interactions:** getting close to certain things is the interaction; at worst a tap once
  close (user).
- **The vehicle travels, the bot builds** (user: "building infra out in the wilderness").
- **Nothing vertical (D068) applies to the vehicle's path only;** the spider climbs (user: "sure").
- **The back wall** is visuals only, always there (user).

**What makes a good lattice (user):**
- all reasonable interactions pre-calculated, pre-placed
- good exit points to interact with the environment
- far enough apart to give space for buildables and growables
- good connectivity
- doesn't break the cave's natural beauty
- the built path lets the player "zoom through" the map, with input only to correct course
- nodes not chosen for the navigation path are still free and suitable for buildables

**The monorail (user's idea, being tried):** the vehicle can be a monorail pod, so it doesn't have to run
on the floor, which greatly simplifies path building. We need nodes for small, big and titan buildables
and a straight path through them: straight paths between cavities, preferably in existing tunnels rather
than bored ones. It can run mostly on a grid, adjusted only to look organic on the map; maybe even laid at
the WFC stage. The user wants to see rails on the relaxed grid's edges: "Not sure it will work well, but it
might potentially be awesome. Just make it a straight line, it is a rail." p10 (`v8.html`) shows two
ways: A, straight chords between relaxed-grid vertices in open space; B, the edges of a coarse relaxed
grid of its own.
- **The gate changes least:** still infrastructure built into a wall that lets the transport through,
  still 2 tiles, doing exactly what it did; it just doesn't have to be reachable on foot (user).
- Open: how the rail hangs (ceiling, pylons, free); the sizes of small, big and titan buildables; whether
  a gate through a 2-thick wall is two 1 × 2 gates or one 2 × 2.

## Flags

Each tile carries a bitmask, set in one pass over the map, so every rule is a lookup. Natural = neither
BUILT nor DUG.

| Bit | Flag      | Meaning                                                          |
| --- | --------- | ---------------------------------------------------------------- |
| 0   | SOLID     | rock or wall                                                     |
| 1   | SEMI      | bridge or gate                                                   |
| 2   | VOID      | sky or sea                                                       |
| 3   | BUILT     | wall, bridge, gate, pod                                          |
| 4   | DUG       | removed by the player                                            |
| 5   | FLOOR     | solid, space above                                               |
| 6   | PATH      | space or gate, floor or bridge below, 2 tiles of headroom        |
| 7   | CAVE_WALL | natural solid, natural space left or right                       |
| 8   | CEILING   | natural solid, natural space below                               |
