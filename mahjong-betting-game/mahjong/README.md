# Mahjong Hand Betting Game

There are TWO submissions; one is a multi-file submission which requires a server because browsers block ES modules over file://.

I will include a single file version which is the DEMO version that anyone can open instantly without having to host on a server.

## Project Structure

```
mahjong-betting-game/
├── index.html                  # Shell — markup only, no logic
├── README.md
└── src/
    ├── App.js                  # Top-level controller
    ├── core/
    │   ├── TileDefinitions.js  # Pure tile data & deck factory
    │   ├── DeckManager.js      # Draw pile, discard, reshuffling
    │   ├── ValueManager.js     # Dynamic special-tile value tracking
    │   └── GameEngine.js       # Game rules, scoring, state machine
    ├── ui/
    │   ├── TileRenderer.js     # DOM tile factory (pure, no state)
    │   └── UI.js               # All DOM updates & screen transitions
    ├── storage/
    │   └── Leaderboard.js      # Pluggable score persistence
    └── styles/
        ├── base.css            # Variables, reset, shared components
        ├── tiles.css           # Tile component styles
        └── screens.css         # Landing / game / end screen layouts
```

**Module dependency graph** (no cycles):

```
index.html
  └── App.js
        ├── core/GameEngine.js
        │     ├── core/DeckManager.js
        │     │     └── core/TileDefinitions.js
        │     └── core/ValueManager.js
        │           └── core/TileDefinitions.js
        ├── storage/Leaderboard.js   (swappable)
        └── ui/UI.js
              └── ui/TileRenderer.js
```

---

## Setup & Running

> **Important:** ES modules require a server — you can't open `index.html` directly via `file://` due to browser CORS restrictions.


## How to Play

1. Click **New Game** on the landing page
2. A hand of 5 Mahjong tiles is dealt — their total value is shown
3. Bet whether the **next** hand's total will be **Higher ▲** or **Lower ▼**
4. Correct bets earn points; incorrect bets earn nothing
5. The game ends when a game-over condition is triggered

### Tile Values

| Type | Value |
|------|-------|
| Number tiles (1–9 Man/Pin/Sou) | Face value |
| Dragon tiles (中/發/白) | Starts at 5, scales dynamically |
| Wind tiles (東/南/西/北) | Starts at 5, scales dynamically |

**Dynamic scaling:** After each hand, every special tile that appeared in it gains +1 (win) or loses -1 (loss). Values are bounded 0–10.

### Scoring

| Event | Points |
|-------|--------|
| Correct bet | +10 + hand total |
| Every 3-win streak | +5 bonus |
| Incorrect bet / Push | +0 |

### Game Over Conditions

- Any special tile's value reaches **0** or **10**
- Draw pile is exhausted for the **3rd time** (2 reshuffles maximum)

---

## Architecture Notes

Each module has a single, clear responsibility. Adding features touches exactly one layer:

| Change | Where |
|--------|-------|
| New tile type | `TileDefinitions.js` only |
| New scoring rule | `GameEngine._resolveResult()` or `placeBet()` |
| New game-over condition | `ValueManager.checkGameOver()` or `GameEngine._dealHand()` |
| New storage backend | Replace `_load()` / `_save()` in `Leaderboard.js` |
| New screen | Add `<div class="screen">` in `index.html`, add `showScreen()` call in `UI.js` |
| New visual style | `tiles.css` or `screens.css` — never touches logic |

### Swapping the Leaderboard backend

`Leaderboard.js` currently uses `localStorage`. To switch to a REST API:

```js
// Before (localStorage)
function _load() {
  return JSON.parse(localStorage.getItem(KEY)) ?? [];
}

// After (REST API — make addScore/getTop async in App.js too)
async function _load() {
  const res = await fetch('/api/scores');
  return res.json();
}
```

The public interface (`addScore`, `getTop`, `clearAll`) stays identical — only `App.js` needs `await` added.

---

## What Was Handwritten vs AI-Assisted

### Handwritten
- Module breakdown and responsibility boundaries
- CSS variable naming conventions
- Game rules interpretation (dynamic scaling, reshuffle limits, push logic, scoring formula)
- CSS aesthetic direction: felt-table theme, ornamental gold borders, 3D tile shadows
- Animation sequencing and timing (staggered tile reveal, result flash, score pulse)
- Architecture decisions: no build step, ES modules, swappable storage interface
- Fisher-Yates shuffle reference implementation

### AI-Assisted (Claude)
- HTML/CSS boilerplate scaffolding
- localStorage try/catch wrapper pattern
- Unicode Mahjong tile character lookup

---


