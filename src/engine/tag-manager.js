'use strict';

/**
 * タグ集計 — 各タグの出現回数を返す
 * @param {Game[]} games
 * @returns {{ [tagName: string]: number }}
 */
function aggregateTags(games) {
  const counts = {};
  for (const game of games) {
    for (const tag of game.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
}

/**
 * タグ特異性スコア（TF-IDF 的）を算出する
 * rarity = 1 - (そのタグを持つゲーム数 / 全ゲーム数)
 * ゲームが 0 本 or 1 本なら全て 0
 * @param {Game[]} games
 * @returns {{ [tagName: string]: number }} 0.0〜1.0
 */
function calculateTagRarity(games) {
  const totalGames = games.length;
  if (totalGames <= 1) {
    const rarity = {};
    for (const game of games) {
      for (const tag of game.tags) {
        rarity[tag] = 0;
      }
    }
    return rarity;
  }

  const counts = aggregateTags(games);
  const rarity = {};
  for (const [tag, count] of Object.entries(counts)) {
    rarity[tag] = 1 - count / totalGames;
  }
  return rarity;
}

module.exports = { aggregateTags, calculateTagRarity };
