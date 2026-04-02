/**
 * TileDefinitions.js
 *
 * Pure data module — no side effects, no state.
 * Defines the complete Mahjong tile set and provides
 * factory functions to build decks.
 *
 * To add a new tile type:
 *   1. Add an entry to NUMBER_SUITS or SPECIAL_TILES
 *   2. Nothing else needs to change — all other modules
 *      consume tiles generically via { id, suit, symbol, label, baseValue, isSpecial }
 */

/** @typedef {{ id: string, suit: string, symbol: string, label: string, baseValue: number, isSpecial: boolean }} TileTemplate */
/** @typedef {TileTemplate & { instanceId: string }} Tile */

const NUMBER_SUITS = [
  {
    id: 'man',
    label: '萬',
    chars: ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'],
  },
  {
    id: 'pin',
    label: '餅',
    chars: ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'],
  },
  {
    id: 'sou',
    label: '索',
    chars: ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘'],
  },
];

/** Special (non-number) tiles. baseValue starts at 5 and scales dynamically. */
export const SPECIAL_TILES = [
  { id: 'dragon-red',   suit: 'suit-dragon-red',   symbol: '🀄', label: '中', baseValue: 5, isSpecial: true },
  { id: 'dragon-green', suit: 'suit-dragon-green',  symbol: '🀅', label: '發', baseValue: 5, isSpecial: true },
  { id: 'dragon-white', suit: 'suit-dragon-white',  symbol: '🀆', label: '白', baseValue: 5, isSpecial: true },
  { id: 'wind-east',    suit: 'suit-wind',          symbol: '🀀', label: '東', baseValue: 5, isSpecial: true },
  { id: 'wind-south',   suit: 'suit-wind',          symbol: '🀁', label: '南', baseValue: 5, isSpecial: true },
  { id: 'wind-west',    suit: 'suit-wind',          symbol: '🀂', label: '西', baseValue: 5, isSpecial: true },
  { id: 'wind-north',   suit: 'suit-wind',          symbol: '🀃', label: '北', baseValue: 5, isSpecial: true },
];

/**
 * Build one unique copy of every tile type (no duplicates).
 * @returns {TileTemplate[]}
 */
export function buildDeckTemplate() {
  const tiles = [];

  NUMBER_SUITS.forEach(suit => {
    for (let n = 1; n <= 9; n++) {
      tiles.push({
        id:        `${suit.id}-${n}`,
        suit:      `suit-${suit.id}`,
        symbol:    suit.chars[n - 1],
        label:     `${n}${suit.label}`,
        baseValue: n,
        isSpecial: false,
      });
    }
  });

  SPECIAL_TILES.forEach(t => tiles.push({ ...t }));

  return tiles;
}

/**
 * Build a full playable deck: 4 copies of every tile (136 tiles total).
 * Each tile gets a unique instanceId so identical tile types can be
 * distinguished in state without mutating shared references.
 * @returns {Tile[]}
 */
export function buildFullDeck() {
  const template = buildDeckTemplate();
  const deck = [];
  template.forEach(tile => {
    for (let i = 0; i < 4; i++) {
      deck.push({ ...tile, instanceId: `${tile.id}-${i}` });
    }
  });
  return deck;
}
