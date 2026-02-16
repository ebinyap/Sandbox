'use strict';

/**
 * ゲームの積みゲーステータスを分類する (SEC-MODEL-BACKLOG)
 *
 * | ステータス      | 条件                        |
 * | untouched       | プレイ時間 0分 or null       |
 * | tasted          | 1〜30分                      |
 * | abandoned_early | 30分〜 HLTB 20%未満          |
 * | abandoned_mid   | HLTB 20%〜70%                |
 * | completed       | HLTB 70%以上                 |
 * | unknown         | HLTBデータなし（30分超）      |
 *
 * @param {Game} game
 * @returns {string}
 */
function classifyStatus(game) {
  const pt = game.playtimeMinutes || 0;

  if (pt === 0) return 'untouched';
  if (pt <= 30) return 'tasted';

  if (game.hltbMain == null) return 'unknown';

  const ratio = pt / game.hltbMain;
  if (ratio < 0.2) return 'abandoned_early';
  if (ratio < 0.7) return 'abandoned_mid';
  return 'completed';
}

/**
 * 救出優先度スコアを算出する
 *
 * 考慮要素:
 *   - プレイ投入率（プレイ時間 / HLTB）が高いほど「もう少しで完了」→ 優先度高
 *   - 購入価格が高いほど「もったいない」→ 優先度高
 *   - completed なら 0
 *
 * @param {Game} game
 * @returns {number}
 */
function calculateRescuePriority(game) {
  const status = classifyStatus(game);
  if (status === 'completed') return 0;

  const pt = game.playtimeMinutes || 0;
  const price = game.basePrice || 0;

  // 投入率ボーナス: abandoned_mid > abandoned_early > tasted > untouched
  let investmentScore = 0;
  if (game.hltbMain && game.hltbMain > 0) {
    investmentScore = Math.min(pt / game.hltbMain, 1.0);
  }

  // 価格ボーナス: 高いほどもったいない
  const priceScore = Math.min(price / 60, 1.0); // $60 で上限

  return investmentScore * 5 + priceScore * 3;
}

/**
 * ライブラリを積みゲー分析する
 * @param {Game[]} games
 * @returns {{ entries: BacklogEntry[], summary: object }}
 */
function analyzeBacklog(games) {
  if (games.length === 0) {
    return {
      entries: [],
      summary: { total: 0, byStatus: {} },
    };
  }

  const entries = games.map((game) => {
    const status = classifyStatus(game);
    const pt = game.playtimeMinutes || 0;
    const completionRate = game.hltbMain ? Math.min(pt / game.hltbMain, 1.0) : null;
    const estimatedRemaining = game.hltbMain ? Math.max(0, game.hltbMain - pt) : null;

    return {
      game,
      status,
      completionRate,
      dormantDays: null, // lastPlayedAt ベースで算出（将来）
      estimatedRemaining,
      wastedSpend: status !== 'completed' && game.basePrice ? game.basePrice : null,
      rescuePriority: calculateRescuePriority(game),
    };
  });

  // rescuePriority 降順ソート
  entries.sort((a, b) => b.rescuePriority - a.rescuePriority);

  // サマリー集計
  const byStatus = {};
  for (const entry of entries) {
    byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
  }

  return {
    entries,
    summary: {
      total: games.length,
      byStatus,
    },
  };
}

module.exports = { classifyStatus, calculateRescuePriority, analyzeBacklog };
