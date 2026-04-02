/**
 * UI.js
 *
 * Owns all DOM updates, screen transitions, and animations.
 * Receives plain data from App.js — never imports GameEngine directly.
 *
 * Rule: if it touches the DOM, it lives here.
 * Rule: if it computes game logic, it belongs in core/.
 */

import { renderHand } from './TileRenderer.js';

// ------------------------------------------------------------------
// Screen management
// ------------------------------------------------------------------

const SCREENS = {
  landing: document.getElementById('screen-landing'),
  game:    document.getElementById('screen-game'),
  end:     document.getElementById('screen-end'),
};

/**
 * Transition to a named screen. All others are hidden.
 * @param {'landing'|'game'|'end'} name
 */
export function showScreen(name) {
  Object.values(SCREENS).forEach(s => s.classList.remove('active'));
  SCREENS[name]?.classList.add('active');
}

// ------------------------------------------------------------------
// HUD
// ------------------------------------------------------------------

/**
 * @param {{ score: number, round: number, currentStreak: number,
 *           drawCount: number, discardCount: number,
 *           reshufflesDone: number, maxReshuffles: number }} state
 */
export function updateHUD(state) {
  _setText('hud-score',  state.score);
  _setText('hud-round',  state.round);
  _setText('hud-streak', state.currentStreak + (state.currentStreak >= 3 ? '🔥' : ''));
  _setText('draw-count',    state.drawCount);
  _setText('discard-count', state.discardCount);
  _setText('reshuffle-count',
    `Reshuffles: ${state.reshufflesDone}/${state.maxReshuffles}`
  );
}

// ------------------------------------------------------------------
// Current hand
// ------------------------------------------------------------------

/**
 * Render the active hand's tiles.
 * @param {Tile[]} tiles
 * @param {ValueManager} valueManager
 */
export function renderCurrentHand(tiles, valueManager) {
  const container = document.getElementById('current-hand-tiles');
  renderHand(container, tiles, valueManager);
}

/**
 * Update the large hand-total number with a pulse animation.
 * @param {number} total
 */
export function updateHandTotal(total) {
  const el = document.getElementById('hand-total');
  el.textContent = total;
  el.classList.remove('pulse');
  requestAnimationFrame(() => el.classList.add('pulse'));
}

/**
 * Flash a win/lose/push result badge below the hand.
 * Auto-hides after 2 seconds.
 * @param {'win'|'lose'|'push'} result
 */
export function showResultFlash(result) {
  const el = document.getElementById('result-flash');
  const messages = {
    win:  '✦ CORRECT — WIN! ✦',
    lose: '✕ WRONG — LOSE',
    push: '◆ PUSH',
  };
  el.textContent = messages[result] ?? '';
  el.className   = `result-flash ${result} show`;
  setTimeout(() => el.classList.remove('show'), 2000);
}

// ------------------------------------------------------------------
// History
// ------------------------------------------------------------------

/**
 * Prepend one hand to the history sidebar.
 * Keeps DOM capped at 20 entries to avoid unbounded growth.
 * @param {HistoryEntry} entry
 * @param {ValueManager} valueManager
 */
export function addHistory(entry, valueManager) {
  const list = document.getElementById('history-list');

  const el = document.createElement('div');
  el.className = 'history-hand';

  const tilesDiv = document.createElement('div');
  tilesDiv.className = 'history-tiles';
  renderHand(tilesDiv, entry.tiles, valueManager, { small: true });

  const metaDiv = document.createElement('div');
  metaDiv.className = 'history-meta';
  metaDiv.innerHTML = `
    <span class="history-total">${entry.total}</span>
    <span class="history-result ${entry.result}">${entry.result.toUpperCase()}</span>
  `;

  el.appendChild(tilesDiv);
  el.appendChild(metaDiv);
  list.insertBefore(el, list.firstChild);

  // Cap DOM entries
  while (list.children.length > 20) list.removeChild(list.lastChild);
}

/** Clear the entire history list. */
export function clearHistory() {
  document.getElementById('history-list').innerHTML = '';
}

// ------------------------------------------------------------------
// Betting controls
// ------------------------------------------------------------------

/** @param {boolean} enabled */
export function setBettingEnabled(enabled) {
  document.getElementById('btn-higher').disabled = !enabled;
  document.getElementById('btn-lower').disabled  = !enabled;
}

/**
 * Update the prompt text above the bet buttons.
 * @param {string} html
 */
export function setBetPrompt(html) {
  document.getElementById('bet-prompt').innerHTML = html;
}

// ------------------------------------------------------------------
// Notifications
// ------------------------------------------------------------------

/**
 * Flash the reshuffle notice banner.
 */
export function showReshuffleNotice() {
  const el = document.getElementById('reshuffle-notice');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

/**
 * Show a floating toast message.
 * @param {string} message
 * @param {number} [duration=2500]
 */
export function showToast(message, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ------------------------------------------------------------------
// End screen
// ------------------------------------------------------------------

/**
 * Populate and show the end-of-game screen.
 * @param {{ score: number, round: number, wins: number, bestStreak: number, overReason: string }} state
 * @param {{ isTop: boolean }|null} lbResult
 */
export function showEndScreen(state, lbResult) {
  _setText('end-score',  state.score);
  _setText('end-rounds', state.round);
  _setText('end-wins',   state.wins);
  _setText('end-streak', state.bestStreak);
  _setText('end-reason', state.overReason);

  const badge = document.getElementById('end-new-record');
  badge.style.display = (lbResult?.isTop) ? 'inline-block' : 'none';

  showScreen('end');
}

// ------------------------------------------------------------------
// Leaderboard display
// ------------------------------------------------------------------

const RANK_CLASSES  = ['first', 'second', 'third', '', ''];
const RANK_SYMBOLS  = ['①', '②', '③', '④', '⑤'];

/**
 * Render a leaderboard list into any container element by id.
 * @param {string} containerId
 * @param {import('../storage/Leaderboard.js').LeaderboardEntry[]} entries
 */
export function renderLeaderboard(containerId, entries) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (!entries?.length) {
    container.innerHTML = '<div class="lb-empty">No scores yet — be the first!</div>';
    return;
  }

  entries.forEach((entry, i) => {
    const el = document.createElement('div');
    el.className = 'lb-entry';
    el.style.animationDelay = `${i * 0.05}s`;

    const date = entry.date
      ? new Date(entry.date).toLocaleDateString()
      : '—';

    el.innerHTML = `
      <span class="lb-rank ${RANK_CLASSES[i]}">${RANK_SYMBOLS[i]}</span>
      <span class="lb-name">${date}</span>
      <span class="lb-score">${entry.score}</span>
    `;
    container.appendChild(el);
  });
}

// ------------------------------------------------------------------
// Private utilities
// ------------------------------------------------------------------

function _setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
