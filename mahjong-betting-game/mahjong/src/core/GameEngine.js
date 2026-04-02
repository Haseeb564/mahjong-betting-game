/**
 * GameEngine.js
 *
 * The core game state machine. Owns all rules, scoring, and
 * game-over logic. Has zero awareness of the DOM or UI.
 *
 * Consumers (App.js) call:
 *   engine.newGame()        — reset and deal first hand
 *   engine.placeBet(dir)    — resolve current bet, deal next hand
 *   engine.getState()       — snapshot of everything UI needs to render
 *
 * Scoring formula:
 *   Win  → +10 (base) + handTotal + streakBonus
 *   Streak bonus: +5 for every 3 consecutive wins
 *   Push → no change
 *   Loss → no change
 *
 * To extend scoring or add new game-over conditions, edit only this file.
 */

import { DeckManager }  from './DeckManager.js';
import { ValueManager } from './ValueManager.js';

/** @typedef {'win'|'lose'|'push'} BetResult */

/**
 * @typedef {Object} BetOutcome
 * @property {BetResult}   result
 * @property {number}      prevTotal
 * @property {number}      thisTotal
 * @property {number}      scoreGained
 * @property {import('./ValueManager.js').ValueChange[]} valueChanges
 * @property {boolean}     reshuffled
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {Tile[]}    tiles
 * @property {number}    total
 * @property {BetResult} result
 * @property {string}    direction
 * @property {number}    scoreGained
 * @property {number}    round
 */

export class GameEngine {
  constructor() {
    this.deck   = new DeckManager(2);   // 2 reshuffles allowed
    this.values = new ValueManager();

    // Mutable game state — reset by newGame()
    this.currentHand    = [];
    this.handHistory    = [];
    this.score          = 0;
    this.round          = 0;
    this.wins           = 0;
    this.losses         = 0;
    this.currentStreak  = 0;
    this.bestStreak     = 0;
    this.lastHandTotal  = null;
    this.isOver         = false;
    this.overReason     = '';
    this.lastReshuffled = false;
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /** Full reset + deal the first hand. */
  newGame() {
    this.deck.init();
    this.values.init();

    this.currentHand    = [];
    this.handHistory    = [];
    this.score          = 0;
    this.round          = 0;
    this.wins           = 0;
    this.losses         = 0;
    this.currentStreak  = 0;
    this.bestStreak     = 0;
    this.lastHandTotal  = null;
    this.isOver         = false;
    this.overReason     = '';
    this.lastReshuffled = false;

    this._dealHand();
  }

  /**
   * Resolve a bet and advance the game.
   * Returns null if the game is already over.
   * @param {'higher'|'lower'} direction
   * @returns {BetOutcome|null}
   */
  placeBet(direction) {
    if (this.isOver) return null;

    const prevTotal  = this.lastHandTotal;
    const thisTotal  = this.values.handTotal(this.currentHand);
    const handSnapshot = [...this.currentHand];

    // Resolve result
    const result = this._resolveResult(direction, prevTotal, thisTotal);
    const won    = result === 'win';
    const lost   = result === 'lose';

    // Update streaks & score
    let scoreGained = 0;
    if (won) {
      this.wins++;
      this.currentStreak++;
      this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
      const streakBonus = Math.floor(this.currentStreak / 3) * 5;
      scoreGained = 10 + thisTotal + streakBonus;
      this.score += scoreGained;
    } else if (lost) {
      this.losses++;
      this.currentStreak = 0;
    }

    // Adjust special tile values
    const valueChanges = this.values.adjustAfterHand(handSnapshot, won);

    // Check game-over: tile boundary hit
    const tileCheck = this.values.checkGameOver();
    if (tileCheck.triggered) {
      this.isOver     = true;
      this.overReason = `${tileCheck.tile.label} tile value reached ${tileCheck.value}`;
    }

    // Record history
    this.handHistory.unshift({
      tiles:       handSnapshot,
      total:       thisTotal,
      result,
      direction,
      scoreGained,
      round:       this.round,
    });

    this.lastHandTotal = thisTotal;

    // Deal next hand unless the game just ended
    let reshuffled = false;
    if (!this.isOver) {
      reshuffled = this._dealHand();
    }

    return { result, prevTotal, thisTotal, scoreGained, valueChanges, reshuffled };
  }

  /**
   * Pure snapshot of all state the UI needs.
   * Never returns internal mutable references — always copies.
   */
  getState() {
    return {
      currentHand:    [...this.currentHand],
      handTotal:      this.values.handTotal(this.currentHand),
      handHistory:    [...this.handHistory],
      score:          this.score,
      round:          this.round,
      wins:           this.wins,
      losses:         this.losses,
      currentStreak:  this.currentStreak,
      bestStreak:     this.bestStreak,
      lastHandTotal:  this.lastHandTotal,
      drawCount:      this.deck.drawCount,
      discardCount:   this.deck.discardCount,
      reshufflesDone: this.deck.reshuffleCount,
      maxReshuffles:  this.deck.MAX_RESHUFFLES,
      isOver:         this.isOver,
      overReason:     this.overReason,
    };
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  /**
   * Deal a fresh hand of 5 tiles, discarding the previous hand first.
   * Sets this.isOver if the deck is exhausted.
   * @returns {boolean} whether a reshuffle occurred
   * @private
   */
  _dealHand() {
    if (this.currentHand.length > 0) {
      this.deck.discard(this.currentHand);
    }

    const { tiles, reshuffled } = this.deck.draw(5);

    if (tiles.length < 5) {
      // Could not draw a full hand — deck exhausted
      this.isOver     = true;
      this.overReason = `Draw pile exhausted after ${this.deck.reshuffleCount + 1} uses`;
      this.currentHand = tiles; // show whatever was drawn
    } else {
      this.currentHand = tiles;
      this.round++;
    }

    return reshuffled;
  }

  /**
   * Determine bet result from direction and totals.
   * Equal totals are always a push.
   * First hand (prevTotal === null) is always a push.
   * @private
   */
  _resolveResult(direction, prevTotal, thisTotal) {
    if (prevTotal === null) return 'push';
    if (thisTotal === prevTotal) return 'push';
    if (direction === 'higher') return thisTotal > prevTotal ? 'win' : 'lose';
    if (direction === 'lower')  return thisTotal < prevTotal ? 'win' : 'lose';
    return 'push';
  }
}
