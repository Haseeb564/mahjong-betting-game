/**
 * ValueManager.js
 *
 * Tracks the current runtime value of every special (non-number) tile.
 * Number tile values are always their face value and never change.
 *
 * Scaling rules:
 *   - Special tile in a WINNING hand  → value + 1 (max 10)
 *   - Special tile in a LOSING hand   → value - 1 (min 0)
 *   - Values are per tile-type (id), not per instance
 *
 * Game-over boundary:
 *   Any special tile reaching exactly 0 or 10 ends the game.
 */

import { SPECIAL_TILES } from './TileDefinitions.js';

/** @typedef {{ triggered: boolean, tile?: object, value?: number }} GameOverCheck */
/** @typedef {{ tile: object, oldVal: number, newVal: number }} ValueChange */

export class ValueManager {
  constructor() {
    /** @type {Record<string, number>} tileId → current value */
    this.specialValues = {};
  }

  /** Reset all special tiles to their defined base values. */
  init() {
    SPECIAL_TILES.forEach(t => {
      this.specialValues[t.id] = t.baseValue;
    });
  }

  /**
   * Resolve the current gameplay value for any tile.
   * @param {import('./TileDefinitions.js').Tile} tile
   * @returns {number}
   */
  getValue(tile) {
    if (tile.isSpecial) {
      return this.specialValues[tile.id] ?? tile.baseValue;
    }
    return tile.baseValue;
  }

  /**
   * Compute the total value of a hand.
   * @param {import('./TileDefinitions.js').Tile[]} tiles
   * @returns {number}
   */
  handTotal(tiles) {
    return tiles.reduce((sum, tile) => sum + this.getValue(tile), 0);
  }

  /**
   * Apply win/loss delta to every special tile present in the hand.
   * @param {import('./TileDefinitions.js').Tile[]} tiles
   * @param {boolean} won
   * @returns {ValueChange[]} — list of tiles whose values actually changed
   */
  adjustAfterHand(tiles, won) {
    const delta   = won ? 1 : -1;
    const changes = [];

    tiles
      .filter(t => t.isSpecial)
      .forEach(tile => {
        const oldVal = this.specialValues[tile.id];
        const newVal = Math.max(0, Math.min(10, oldVal + delta));
        this.specialValues[tile.id] = newVal;
        if (newVal !== oldVal) {
          changes.push({ tile, oldVal, newVal });
        }
      });

    return changes;
  }

  /**
   * Check whether any special tile has hit the 0 or 10 game-over boundary.
   * @returns {GameOverCheck}
   */
  checkGameOver() {
    for (const [tileId, val] of Object.entries(this.specialValues)) {
      if (val === 0 || val === 10) {
        const tile = SPECIAL_TILES.find(t => t.id === tileId);
        return { triggered: true, tile, value: val };
      }
    }
    return { triggered: false };
  }
}
