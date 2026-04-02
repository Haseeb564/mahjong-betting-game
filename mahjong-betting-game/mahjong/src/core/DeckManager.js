/**
 * DeckManager.js
 *
 * Manages the draw pile, discard pile, and reshuffling logic.
 * Completely decoupled from UI and scoring — owns only tile movement.
 *
 * Reshuffle policy:
 *   When the draw pile is empty, a fresh deck is combined with
 *   the discard pile and reshuffled into a new draw pile.
 *   This can happen at most MAX_RESHUFFLES times per game.
 */

import { buildFullDeck } from './TileDefinitions.js';

export class DeckManager {
  /** @param {number} maxReshuffles — how many times the deck can be reshuffled */
  constructor(maxReshuffles = 2) {
    this.MAX_RESHUFFLES  = maxReshuffles;
    this.drawPile        = [];
    this.discardPile     = [];
    this.reshuffleCount  = 0;
  }

  /** Reset to a freshly shuffled deck. Call at the start of every game. */
  init() {
    this.drawPile       = this._shuffle(buildFullDeck());
    this.discardPile    = [];
    this.reshuffleCount = 0;
  }

  /**
   * Draw n tiles from the top of the draw pile.
   * Triggers a reshuffle automatically if the pile runs low.
   * Returns fewer than n tiles only when the deck is fully exhausted.
   * @param {number} n
   * @returns {{ tiles: Tile[], reshuffled: boolean }}
   */
  draw(n = 1) {
    let reshuffled = false;

    if (this.drawPile.length < n) {
      if (!this.canReshuffle()) {
        // Return whatever is left — caller checks for exhaustion
        return { tiles: this.drawPile.splice(0), reshuffled: false };
      }
      this._reshuffle();
      reshuffled = true;
    }

    return { tiles: this.drawPile.splice(0, n), reshuffled };
  }

  /**
   * Move tiles into the discard pile.
   * @param {Tile[]} tiles
   */
  discard(tiles) {
    this.discardPile.push(...tiles);
  }

  /** Whether another reshuffle is still allowed. */
  canReshuffle() {
    return this.reshuffleCount < this.MAX_RESHUFFLES;
  }

  /**
   * Whether the deck is completely exhausted with no reshuffles remaining.
   * This is a game-over trigger.
   */
  isExhausted() {
    return this.drawPile.length === 0 && !this.canReshuffle();
  }

  get drawCount()    { return this.drawPile.length; }
  get discardCount() { return this.discardPile.length; }

  // ------------------------------------------------------------------
  // Private
  // ------------------------------------------------------------------

  /**
   * Combine discard pile + a fresh deck, shuffle into a new draw pile.
   * @private
   */
  _reshuffle() {
    const freshDeck  = buildFullDeck();
    this.drawPile    = this._shuffle([...this.discardPile, ...freshDeck]);
    this.discardPile = [];
    this.reshuffleCount++;
  }

  /**
   * Fisher-Yates in-place shuffle.
   * @private
   * @template T
   * @param {T[]} arr
   * @returns {T[]}
   */
  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
