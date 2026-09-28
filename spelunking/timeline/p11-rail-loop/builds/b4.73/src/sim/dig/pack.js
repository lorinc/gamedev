// The backpack: packSlots slots, each holding up to SLOT units of one material. A new unit tops
// up the first slot of its material with room, else takes the first empty slot. Slots keep their
// place: one emptied by building is free again, and the next new material takes it.
// Building spends rock only, soft before hard, from the last slot of that material (D038).
// Reserved slots (D064, `packReserve`): slot i holds only reserve[i]'s material, and a unit goes there
// first; the slots after the reserved ones are free for anything, and a full reserved slot overflows
// into them. Units are taken from the last slot, so the free ones empty first.

import { Tile } from '../gen/world.js'

/** Units per slot: a 4×4 grid on the drawn backpack, filled row by row from the bottom. */
export const SLOT = 16

/** @typedef {{ tile: number, n: number }} Slot */
/** @typedef {(Slot | null)[]} Pack indexed by slot; missing or null = empty */

/** @type {Record<number, string>} */
export const MATERIAL_NAME = { [Tile.Soft]: 'soft', [Tile.Hard]: 'hard', [Tile.Ore]: 'ore', [Tile.Loot]: 'loot' }
/** @type {Record<string, number>} */
const MATERIAL_OF = Object.fromEntries(Object.entries(MATERIAL_NAME).map(([t, name]) => [name, Number(t)]))

/** What mining a tile puts in the pack: a Built tile gives back soft rock. @param {number} tile */
export const material = (tile) => (tile === Tile.Built ? Tile.Soft : tile)

/** Ore and loot are never dropped: with no room for them, the mine is refused (packFull). @param {number} tile */
export const valuable = (tile) => tile === Tile.Ore || tile === Tile.Loot

/**
 * Adds one unit. False (pack unchanged) when there's no room.
 * @param {Pack} pack @param {number} slots @param {number} tile @param {string[]} [reserve] material names of the reserved slots
 */
export function add(pack, slots, tile, reserve = []) {
  const r = reserve.indexOf(MATERIAL_NAME[tile])
  if (r >= 0 && r < slots) {
    const s = pack[r]
    if (!s) {
      while (pack.length < r) pack.push(null) // no holes before it
      pack[r] = { tile, n: 1 }
      return true
    }
    if (s.n < SLOT) {
      s.n++
      return true
    }
  }
  let free = -1
  for (let i = Math.min(reserve.length, slots); i < slots; i++) {
    const s = pack[i]
    if (s && s.tile === tile && s.n < SLOT) {
      s.n++
      return true
    }
    if (!s && free < 0) free = i
  }
  if (free < 0) return false
  while (pack.length < free) pack.push(null)
  pack[free] = { tile, n: 1 }
  return true
}

/** Would all these units fit? @param {Pack} pack @param {number} slots @param {number[]} tiles @param {string[]} [reserve] */
export function fits(pack, slots, tiles, reserve) {
  const copy = pack.map((s) => s && { ...s })
  return tiles.every((t) => add(copy, slots, t, reserve))
}

/** @param {Pack} pack @param {number} tile */
export function count(pack, tile) {
  let n = 0
  for (const s of pack) if (s && s.tile === tile) n += s.n
  return n
}

/** Rock units in the pack: tiles we can build. @param {Pack} pack */
export const rock = (pack) => count(pack, Tile.Soft) + count(pack, Tile.Hard)

/** Takes one rock unit for a build, soft before hard. False when there's none. @param {Pack} pack */
export const spendRock = (pack) => take(pack, Tile.Soft) || take(pack, Tile.Hard)

/** Takes one unit of `tile`, from the last slot holding it (a wild bug's nibble, D056). False when there's none. @param {Pack} pack @param {number} tile */
export function take(pack, tile) {
  for (let i = pack.length - 1; i >= 0; i--) {
    const s = pack[i]
    if (s && s.tile === tile) {
      if (--s.n === 0) pack[i] = null
      return true
    }
  }
  return false
}

/** The pack as text, one entry per slot: 'ore 3', or '-' for an empty slot before a full one. @param {Pack} pack */
export function packText(pack) {
  const out = pack.map((s) => (s ? `${MATERIAL_NAME[s.tile]} ${s.n}` : '-'))
  while (out.length && out[out.length - 1] === '-') out.pop()
  return out
}

/** The inverse of packText. @param {string[]} text @returns {Pack} */
export function parsePack(text) {
  return text.map((e) => {
    const [name, n] = e.split(' ')
    return name === '-' ? null : { tile: MATERIAL_OF[name], n: Number(n ?? 1) }
  })
}
