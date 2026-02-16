'use strict';

const { createGame } = require('./models');

/**
 * 2つの Game を id ベースでマージする。
 * base の非 null 値を優先し、null の箇所を overlay で埋める。
 * sourceFlags は和集合。tags/genres は base を優先。
 * @param {Game} base
 * @param {Game} overlay
 * @returns {Game}
 */
function mergeGamePair(base, overlay) {
  const merged = createGame();

  for (const key of Object.keys(merged)) {
    if (key === 'sourceFlags') continue;
    if (key === 'tags' || key === 'genres') {
      merged[key] = base[key].length > 0 ? base[key] : overlay[key];
      continue;
    }
    merged[key] = base[key] != null ? base[key] : overlay[key];
  }

  // sourceFlags: 重複なしの和集合
  const flags = new Set([...base.sourceFlags, ...overlay.sourceFlags]);
  merged.sourceFlags = [...flags];

  return merged;
}

/**
 * 複数ソースからの Game 配列を id でグルーピングしてマージする。
 * 出現順を保持する。
 * @param {Game[]} games
 * @returns {Game[]}
 */
function mergeGames(games) {
  const map = new Map();
  const order = [];

  for (const game of games) {
    if (map.has(game.id)) {
      map.set(game.id, mergeGamePair(map.get(game.id), game));
    } else {
      map.set(game.id, game);
      order.push(game.id);
    }
  }

  return order.map((id) => map.get(id));
}

module.exports = { mergeGamePair, mergeGames };
