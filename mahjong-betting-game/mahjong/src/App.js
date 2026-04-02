/**
 * App.js
 *
 * Top-level controller — the only module that imports from both
 * core/ and ui/. Its sole job is to wire them together.
 *
 * It holds no game logic and no DOM manipulation:
 *   - Game rules  → GameEngine
 *   - DOM updates → UI
 *   - Persistence → Leaderboard
 *
 * All button onclick handlers in index.html call window.App.*
 * so the HTML stays free of module-system concerns.
 */

import { GameEngine }   from './core/GameEngine.js';
import * as Leaderboard from './storage/Leaderboard.js';
import * as UI          from './ui/UI.js';

const engine = new GameEngine();

// ------------------------------------------------------------------
// Public API (exposed on window.App for HTML onclick handlers)
// ------------------------------------------------------------------

/**
 * Start a fresh game: reset engine, clear UI, deal first hand.
 */
export function startNewGame() {
  engine.newGame();

  UI.clearHistory();
  UI.showScreen('game');
  UI.setBettingEnabled(true);

  const state = engine.getState();
  UI.updateHUD(state);
  UI.renderCurrentHand(state.currentHand, engine.values);
  UI.updateHandTotal(state.handTotal);
  UI.setBetPrompt('Will the <em>next</em> hand be<br>higher or lower than this one?');
}

/**
 * Player places a bet. Resolves it, updates UI, deals next hand.
 * Buttons are disabled during the brief transition delay.
 * @param {'higher'|'lower'} direction
 */
export function placeBet(direction) {
  if (engine.isOver) return;
  UI.setBettingEnabled(false);

  // Short delay so the player can register their choice visually
  setTimeout(() => {
    const outcome = engine.placeBet(direction);
    if (!outcome) return;

    const state = engine.getState();

    // Notify reshuffle
    if (outcome.reshuffled) UI.showReshuffleNotice();

    // Show result badge
    UI.showResultFlash(outcome.result);

    // Add completed hand to history
    if (engine.handHistory.length > 0) {
      UI.addHistory(engine.handHistory[0], engine.values);
    }

    // Sync HUD counters and score
    UI.updateHUD(state);

    if (state.isOver) {
      setTimeout(() => _endGame(state), 1200);
      return;
    }

    // Reveal next hand after result is visible
    setTimeout(() => {
      UI.renderCurrentHand(state.currentHand, engine.values);
      UI.updateHandTotal(state.handTotal);
      UI.setBetPrompt(`Higher or lower than <strong>${outcome.thisTotal}</strong>?`);
      UI.setBettingEnabled(true);
    }, 800);

  }, 200);
}

/**
 * Exit mid-game — ask for confirmation, then return to landing.
 */
export function exitGame() {
  if (window.confirm('Exit to lobby? Your current score will not be saved.')) {
    goHome();
  }
}

/**
 * Navigate to landing page and refresh leaderboard display.
 */
export function goHome() {
  UI.showScreen('landing');
  UI.renderLeaderboard('leaderboard-display', Leaderboard.getTop(5));
}

// ------------------------------------------------------------------
// Private
// ------------------------------------------------------------------

function _endGame(state) {
  const lbResult = Leaderboard.addScore(
    state.score,
    state.wins,
    state.round,
    state.bestStreak,
  );
  UI.showEndScreen(state, lbResult);
}

// ------------------------------------------------------------------
// Boot
// ------------------------------------------------------------------

(function init() {
  // Expose to HTML onclick handlers
  window.App = { startNewGame, placeBet, exitGame, goHome };

  // Render leaderboard on landing page
  UI.renderLeaderboard('leaderboard-display', Leaderboard.getTop(5));
  UI.showScreen('landing');
})();
