'use strict';

/**
 * 1時間あたりコスト（$/h）を算出する
 * @param {Game} game
 * @returns {number|null} null = 価格不明, Infinity = プレイ時間 0
 */
function calculateCostPerHour(game) {
  if (game.basePrice == null) return null;
  if (game.basePrice === 0) return 0;

  const hours = (game.playtimeMinutes || 0) / 60;
  if (hours === 0) return Infinity;

  return game.basePrice / hours;
}

/**
 * コスパ良い順にランキングする
 * null は末尾、Infinity は null の手前
 * @param {Game[]} games
 * @returns {{ game: Game, costPerHour: number|null }[]}
 */
function rankByCostEfficiency(games) {
  return games
    .map((game) => ({ game, costPerHour: calculateCostPerHour(game) }))
    .sort((a, b) => {
      // null は末尾
      if (a.costPerHour === null) return 1;
      if (b.costPerHour === null) return -1;
      return a.costPerHour - b.costPerHour;
    });
}

module.exports = { calculateCostPerHour, rankByCostEfficiency };
