/**
 * TileRenderer.js
 *
 * Pure DOM factory — takes tile data, returns elements.
 * Has no state and no side effects beyond creating DOM nodes.
 *
 * Keeping rendering logic here means:
 *   - UI.js stays clean (layout/screen logic only)
 *   - Tile visuals can be changed in one place
 *   - Easy to test by inspecting returned elements
 */

/**
 * Create a single tile element.
 *
 * @param {import('../core/TileDefinitions.js').Tile} tile
 * @param {import('../core/ValueManager.js').ValueManager} valueManager
 * @param {{ small?: boolean, animationDelay?: number }} [options]
 * @returns {HTMLElement}
 */
export function createTileElement(tile, valueManager, options = {}) {
  const { small = false, animationDelay = 0 } = options;

  const el = document.createElement('div');
  el.className = `tile ${tile.suit}${small ? ' small' : ''}`;
  el.dataset.tileId     = tile.id;
  el.dataset.instanceId = tile.instanceId;

  const value = valueManager ? valueManager.getValue(tile) : tile.baseValue;

  el.innerHTML = `
    <span class="tile-symbol">${tile.symbol}</span>
    <span class="tile-label">${tile.label}</span>
    <span class="tile-value">${value}</span>
  `;

  if (animationDelay > 0) {
    el.style.animationDelay = `${animationDelay}s`;
  }

  return el;
}

/**
 * Render a full hand of tiles into a container, replacing its contents.
 * Applies staggered animation delays automatically.
 *
 * @param {HTMLElement} container
 * @param {import('../core/TileDefinitions.js').Tile[]} tiles
 * @param {import('../core/ValueManager.js').ValueManager} valueManager
 * @param {{ small?: boolean }} [options]
 */
export function renderHand(container, tiles, valueManager, options = {}) {
  container.innerHTML = '';
  tiles.forEach((tile, i) => {
    const el = createTileElement(tile, valueManager, {
      small: options.small ?? false,
      animationDelay: i * 0.06,
    });
    container.appendChild(el);
  });
}
