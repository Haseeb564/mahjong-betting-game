/**
 * Leaderboard.js
 *
 * Storage adapter for high scores.
 *
 * This module is intentionally designed to be swappable.
 * The public interface stays the same whether the backing
 * store is localStorage, a REST API, or an in-memory mock.
 *
 * To switch to a remote backend:
 *   1. Replace _load() and _save() with fetch() calls
 *   2. Make addScore() and getTop() async (they return Promises)
 *   3. Update App.js to await them — nothing else needs to change
 *
 * Current implementation: localStorage, synchronous.
 */

const STORAGE_KEY  = 'mahjong_lb_v1';
const MAX_ENTRIES  = 10;

/**
 * @typedef {Object} LeaderboardEntry
 * @property {number} score
 * @property {number} wins
 * @property {number} rounds
 * @property {number} bestStreak
 * @property {string} date  — ISO 8601
 */

/**
 * @typedef {Object} AddScoreResult
 * @property {number}  rank     — 1-based rank in the full board
 * @property {boolean} isTop    — true if rank <= 5
 */

/**
 * Record a completed game's score.
 * @param {number} score
 * @param {number} wins
 * @param {number} rounds
 * @param {number} bestStreak
 * @returns {AddScoreResult}
 */
export function addScore(score, wins, rounds, bestStreak) {
  const entries = _load();

  /** @type {LeaderboardEntry} */
  const newEntry = {
    score,
    wins,
    rounds,
    bestStreak,
    date: new Date().toISOString(),
  };

  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);

  const trimmed = entries.slice(0, MAX_ENTRIES);
  _save(trimmed);

  const rank = trimmed.indexOf(newEntry) + 1;
  return { rank, isTop: rank <= 5 };
}

/**
 * Retrieve the top n entries, sorted by score descending.
 * @param {number} [n=5]
 * @returns {LeaderboardEntry[]}
 */
export function getTop(n = 5) {
  return _load().slice(0, n);
}

/**
 * Clear all stored scores (useful for testing).
 */
export function clearAll() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

// ------------------------------------------------------------------
// Private — swap these two functions to change the storage backend
// ------------------------------------------------------------------

/** @returns {LeaderboardEntry[]} */
function _load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

/** @param {LeaderboardEntry[]} entries */
function _save(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
    console.warn('[Leaderboard] Could not persist scores:', entries);
  }
}
